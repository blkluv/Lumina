import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { ObjectStorageService, objectStorageClient } from "./objectStorage";
import path from "path";
import fs from "fs/promises";
import os from "os";

const objectStorageService = new ObjectStorageService();

interface ThumbnailResult {
  thumbnailPath: string;
  timestamp: number;
}

interface FrameExtractionResult {
  frames: Array<{
    thumbnailPath: string;
    timestamp: number;
    previewUrl: string;
  }>;
}

function parseObjectPath(objectPath: string): { bucketName: string; objectName: string } {
  const parts = objectPath.replace(/^\/objects\//, "").split("/");
  const bucketName = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
  const objectName = `${process.env.PRIVATE_OBJECT_DIR}/${parts.join("/")}`;
  return { bucketName, objectName };
}

async function downloadVideoToTemp(videoPath: string): Promise<string> {
  const { bucketName, objectName } = parseObjectPath(videoPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `video_${randomUUID()}.mp4`);
  
  await file.download({ destination: tempFile });
  return tempFile;
}

async function extractFrameWithFfmpeg(
  videoPath: string,
  timestamp: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-ss", timestamp.toString(),
      "-i", videoPath,
      "-vframes", "1",
      "-q:v", "2",
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
      "-y",
      outputPath
    ]);

    let stderr = "";
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      videoPath
    ]);

    let stdout = "";
    let stderr = "";
    
    ffprobe.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    ffprobe.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        const duration = parseFloat(stdout.trim());
        resolve(isNaN(duration) ? 10 : duration);
      } else {
        console.error("ffprobe error:", stderr);
        resolve(10);
      }
    });

    ffprobe.on("error", (err) => {
      console.error("ffprobe spawn error:", err);
      resolve(10);
    });
  });
}

async function uploadThumbnailToStorage(
  localPath: string,
  userId: string
): Promise<string> {
  const buffer = await fs.readFile(localPath);
  const objectPath = await objectStorageService.uploadFromBuffer(buffer, "image/jpeg");
  
  await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
    owner: userId,
    visibility: "public",
  });
  
  return objectPath;
}

export async function generateAutoThumbnail(
  videoPath: string,
  userId: string,
  timestamp: number = 2
): Promise<ThumbnailResult> {
  let tempVideoPath: string | null = null;
  let tempThumbnailPath: string | null = null;
  
  try {
    tempVideoPath = await downloadVideoToTemp(videoPath);
    
    const duration = await getVideoDuration(tempVideoPath);
    const safeTimestamp = Math.min(timestamp, Math.max(0, duration - 0.5));
    
    tempThumbnailPath = path.join(os.tmpdir(), `thumb_${randomUUID()}.jpg`);
    
    await extractFrameWithFfmpeg(tempVideoPath, safeTimestamp, tempThumbnailPath);
    
    const thumbnailPath = await uploadThumbnailToStorage(tempThumbnailPath, userId);
    
    return {
      thumbnailPath,
      timestamp: safeTimestamp
    };
  } finally {
    if (tempVideoPath) {
      await fs.unlink(tempVideoPath).catch(() => {});
    }
    if (tempThumbnailPath) {
      await fs.unlink(tempThumbnailPath).catch(() => {});
    }
  }
}

export async function extractMultipleFrames(
  videoPath: string,
  userId: string,
  frameCount: number = 6
): Promise<FrameExtractionResult> {
  let tempVideoPath: string | null = null;
  const tempThumbnailPaths: string[] = [];
  
  try {
    tempVideoPath = await downloadVideoToTemp(videoPath);
    
    const duration = await getVideoDuration(tempVideoPath);
    
    const timestamps: number[] = [];
    for (let i = 0; i < frameCount; i++) {
      const t = (duration / (frameCount + 1)) * (i + 1);
      timestamps.push(Math.max(0, Math.min(t, duration - 0.5)));
    }
    
    const frames: FrameExtractionResult["frames"] = [];
    
    for (const timestamp of timestamps) {
      const tempPath = path.join(os.tmpdir(), `frame_${randomUUID()}.jpg`);
      tempThumbnailPaths.push(tempPath);
      
      try {
        await extractFrameWithFfmpeg(tempVideoPath, timestamp, tempPath);
        const thumbnailPath = await uploadThumbnailToStorage(tempPath, userId);
        
        frames.push({
          thumbnailPath,
          timestamp,
          previewUrl: thumbnailPath
        });
      } catch (err) {
        console.error(`Failed to extract frame at ${timestamp}s:`, err);
      }
    }
    
    return { frames };
  } finally {
    if (tempVideoPath) {
      await fs.unlink(tempVideoPath).catch(() => {});
    }
    for (const tempPath of tempThumbnailPaths) {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}

export async function generateThumbnailAtTimestamp(
  videoPath: string,
  userId: string,
  timestamp: number
): Promise<ThumbnailResult> {
  return generateAutoThumbnail(videoPath, userId, timestamp);
}
