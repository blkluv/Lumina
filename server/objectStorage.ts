import { Storage, File } from "@google-cloud/storage";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  // Create a resumable upload session for large files (videos)
  async createResumableUpload(contentType: string): Promise<{ resumableUri: string; objectPath: string }> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    // Create a resumable upload session
    const [resumableUri] = await file.createResumableUpload({
      metadata: {
        contentType,
      },
    });
    
    return {
      resumableUri,
      objectPath: `/objects/uploads/${objectId}`,
    };
  }

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600, req?: Request) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      const contentType = metadata.contentType || "application/octet-stream";
      const fileSize = parseInt(metadata.size as string, 10);
      
      // Check if this is a range request (needed for video seeking)
      const rangeHeader = req?.headers?.range;
      
      if (rangeHeader) {
        // Parse range header: "bytes=start-end"
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          res.status(416).set({
            "Content-Range": `bytes */${fileSize}`,
          }).end();
          return;
        }
        
        const chunkSize = end - start + 1;
        
        res.status(206).set({
          "Content-Type": contentType,
          "Content-Length": chunkSize,
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Encoding": "identity",
          "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
        });
        
        // Use decompress: false to ensure we send exact bytes without GCS decompression
        const stream = file.createReadStream({ start, end, decompress: false });
        stream.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });
        stream.pipe(res);
      } else {
        // Regular download (not a range request)
        res.set({
          "Content-Type": contentType,
          "Content-Length": fileSize,
          "Accept-Ranges": "bytes",
          "Content-Encoding": "identity",
          "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
        });
        // Use decompress: false to ensure we send exact bytes without GCS decompression
        const stream = file.createReadStream({ decompress: false });
        stream.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });
        stream.pipe(res);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  async getSignedReadURL(file: File, ttlSec: number = 3600): Promise<string> {
    // file.name is just the object name, file.bucket.name is the bucket name
    const bucketName = file.bucket.name;
    const objectName = file.name;
    return signObjectURL({
      bucketName,
      objectName,
      method: "GET",
      ttlSec,
    });
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Upload file directly from server to GCS (proxy upload)
  async uploadFromBuffer(
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    // Upload using stream for better memory handling
    await new Promise<void>((resolve, reject) => {
      const stream = file.createWriteStream({
        metadata: {
          contentType,
        },
        resumable: true, // Use resumable upload on server side
      });
      
      stream.on("error", reject);
      stream.on("finish", resolve);
      stream.end(buffer);
    });
    
    return `/objects/uploads/${objectId}`;
  }

  // Upload file with specific path (for HLS segments)
  async uploadFromBufferWithPath(
    buffer: Buffer,
    contentType: string,
    relativePath: string
  ): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    const fullPath = `${privateObjectDir}/${relativePath}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await new Promise<void>((resolve, reject) => {
      const stream = file.createWriteStream({
        metadata: {
          contentType,
        },
        resumable: false,
      });
      
      stream.on("error", reject);
      stream.on("finish", resolve);
      stream.end(buffer);
    });
    
    return `/objects/${relativePath}`;
  }

  // Upload multiple chunk files directly to GCS - combines chunks into single file first
  // This approach avoids GCS integrity issues by uploading a single complete file
  async uploadFromChunkFiles(
    chunkPaths: string[],
    contentType: string
  ): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const fs = await import("fs");
    const path = await import("path");
    const { pipeline } = await import("stream/promises");
    const { PassThrough } = await import("stream");
    
    // First, combine all chunks into a single temp file
    // This is more reliable than streaming directly to GCS
    const tempCombinedPath = path.join(path.dirname(chunkPaths[0]), "combined_video");
    
    console.log(`[ChunkUpload] Combining ${chunkPaths.length} chunks into temp file...`);
    
    // Create write stream for combined file
    const combinedStream = fs.createWriteStream(tempCombinedPath);
    
    try {
      // Write each chunk to the combined file
      for (let i = 0; i < chunkPaths.length; i++) {
        const chunkPath = chunkPaths[i];
        console.log(`[ChunkUpload] Appending chunk ${i + 1}/${chunkPaths.length}`);
        
        const chunkData = await fs.promises.readFile(chunkPath);
        await new Promise<void>((resolve, reject) => {
          combinedStream.write(chunkData, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Delete chunk file after appending to free disk space
        await fs.promises.unlink(chunkPath).catch(() => {});
      }
      
      // Close the combined file
      await new Promise<void>((resolve, reject) => {
        combinedStream.end((err: Error | null | undefined) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log(`[ChunkUpload] Combined file created, uploading to GCS...`);
      
      // Now upload the combined file to GCS using stream
      const readStream = fs.createReadStream(tempCombinedPath);
      const gcsWriteStream = file.createWriteStream({
        metadata: { contentType },
        resumable: true,
        validation: false, // Disable MD5/CRC validation for large assembled files
      });
      
      await pipeline(readStream, gcsWriteStream);
      
      console.log(`[ChunkUpload] Upload complete: ${chunkPaths.length} chunks`);
      
    } finally {
      // Clean up combined temp file
      await fs.promises.unlink(tempCombinedPath).catch(() => {});
    }
    
    return `/objects/uploads/${objectId}`;
  }

  // Upload file from readable stream to GCS (proxy upload for large files)
  async uploadFromStream(
    inputStream: NodeJS.ReadableStream,
    contentType: string,
    fileSize?: number
  ): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    // Upload using stream with resumable upload and proper error handling
    await new Promise<void>((resolve, reject) => {
      const writeStream = file.createWriteStream({
        metadata: {
          contentType,
        },
        resumable: true,
      });
      
      // Handle errors from both streams
      const cleanup = (err: Error) => {
        (inputStream as any).destroy?.();
        writeStream.destroy?.();
        reject(err);
      };
      
      inputStream.on("error", cleanup);
      writeStream.on("error", cleanup);
      writeStream.on("finish", resolve);
      
      inputStream.pipe(writeStream);
    });
    
    return `/objects/uploads/${objectId}`;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// Create a resumable upload session for large files
export async function createResumableUploadSession(
  bucketName: string,
  objectName: string,
  contentType: string
): Promise<string> {
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  // Create a resumable upload session
  const [resumableUri] = await file.createResumableUpload({
    metadata: {
      contentType,
    },
  });
  
  return resumableUri;
}
