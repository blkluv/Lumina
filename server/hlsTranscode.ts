import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { ObjectStorageService } from "./objectStorage";
import path from "path";
import fs from "fs/promises";
import os from "os";

const objectStorageService = new ObjectStorageService();

interface HLSTranscodeResult {
  manifestPath: string;
  segmentPaths: string[];
  duration: number;
}

async function downloadVideoToTemp(videoPath: string): Promise<string> {
  console.log(`[HLS] Downloading video from storage: ${videoPath}`);
  
  const file = await objectStorageService.getObjectEntityFile(videoPath);
  
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `video_${randomUUID()}.mp4`);
  
  await file.download({ destination: tempFile });
  
  const stats = await fs.stat(tempFile);
  console.log(`[HLS] Downloaded video: ${stats.size} bytes`);
  
  if (stats.size === 0) {
    throw new Error("Downloaded video file is empty");
  }
  
  return tempFile;
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
    
    ffprobe.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        const duration = parseFloat(stdout.trim());
        resolve(isNaN(duration) ? 0 : duration);
      } else {
        resolve(0);
      }
    });

    ffprobe.on("error", () => {
      resolve(0);
    });
  });
}

async function transcodeToHLS(
  inputPath: string,
  outputDir: string
): Promise<{ manifestFile: string; segmentFiles: string[] }> {
  const manifestFile = path.join(outputDir, "playlist.m3u8");
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", inputPath,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ac", "2",
      "-ar", "44100",
      "-vf", "scale='trunc(min(1280,iw)/2)*2':'trunc(min(720,ih)/2)*2':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2",
      "-profile:v", "main",
      "-level", "3.1",
      "-start_number", "0",
      "-hls_time", "6",
      "-hls_list_size", "0",
      "-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"),
      "-f", "hls",
      manifestFile
    ]);

    let stderr = "";
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", async (code) => {
      if (code === 0) {
        const files = await fs.readdir(outputDir);
        const segmentFiles = files
          .filter(f => f.endsWith(".ts"))
          .map(f => path.join(outputDir, f));
        
        resolve({ manifestFile, segmentFiles });
      } else {
        reject(new Error(`ffmpeg HLS transcode failed with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}

export async function transcodeVideoToHLS(
  videoStoragePath: string,
  userId: string
): Promise<HLSTranscodeResult> {
  const hlsId = randomUUID();
  const tempDir = path.join(os.tmpdir(), `hls_${hlsId}`);
  let tempVideoPath: string | null = null;
  
  try {
    await fs.mkdir(tempDir, { recursive: true });
    
    console.log(`[HLS] Starting transcode for ${videoStoragePath}`);
    
    tempVideoPath = await downloadVideoToTemp(videoStoragePath);
    
    const duration = await getVideoDuration(tempVideoPath);
    console.log(`[HLS] Video duration: ${duration}s`);
    
    const { manifestFile, segmentFiles } = await transcodeToHLS(tempVideoPath, tempDir);
    console.log(`[HLS] Transcode complete: ${segmentFiles.length} segments`);
    
    const hlsBasePath = `/objects/hls/${hlsId}`;
    const uploadedSegmentPaths: string[] = [];
    
    for (const segmentFile of segmentFiles) {
      const segmentBuffer = await fs.readFile(segmentFile);
      const segmentName = path.basename(segmentFile);
      const segmentPath = `hls/${hlsId}/${segmentName}`;
      
      await objectStorageService.uploadFromBufferWithPath(segmentBuffer, "video/mp2t", segmentPath);
      uploadedSegmentPaths.push(`/objects/${segmentPath}`);
      
      await objectStorageService.trySetObjectEntityAclPolicy(`/objects/${segmentPath}`, {
        owner: userId,
        visibility: "public",
      });
    }
    
    let manifestContent = await fs.readFile(manifestFile, "utf-8");
    manifestContent = manifestContent.replace(/segment_(\d+)\.ts/g, (match) => {
      return `/objects/hls/${hlsId}/${match}`;
    });
    
    const manifestBuffer = Buffer.from(manifestContent, "utf-8");
    const manifestPath = `hls/${hlsId}/playlist.m3u8`;
    
    await objectStorageService.uploadFromBufferWithPath(
      manifestBuffer, 
      "application/vnd.apple.mpegurl", 
      manifestPath
    );
    
    await objectStorageService.trySetObjectEntityAclPolicy(`/objects/${manifestPath}`, {
      owner: userId,
      visibility: "public",
    });
    
    console.log(`[HLS] Upload complete: /objects/${manifestPath}`);
    
    return {
      manifestPath: `/objects/${manifestPath}`,
      segmentPaths: uploadedSegmentPaths,
      duration
    };
  } finally {
    if (tempVideoPath) {
      await fs.unlink(tempVideoPath).catch(() => {});
    }
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function checkHLSManifestExists(manifestPath: string): Promise<boolean> {
  try {
    const file = await objectStorageService.getObjectEntityFile(manifestPath);
    const [exists] = await file.exists();
    return exists;
  } catch {
    return false;
  }
}
