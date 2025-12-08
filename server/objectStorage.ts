import { Storage, File as GCSFile } from "@google-cloud/storage";
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

  async searchPublicObject(filePath: string): Promise<GCSFile | null> {
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

  async downloadObject(file: GCSFile, res: Response, cacheTtlSec: number = 3600, req?: Request) {
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

  async getObjectEntityFile(objectPath: string): Promise<GCSFile> {
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

  async getSignedReadURL(file: GCSFile, ttlSec: number = 3600): Promise<string> {
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

  // Upload a single chunk directly to GCS (for distributed/autoscale environments)
  // Chunks are stored as temp-chunks/{uploadId}/chunk_{index} and composed later
  async uploadChunkToGCS(
    uploadId: string,
    chunkIndex: number,
    chunkData: Buffer,
    contentType: string
  ): Promise<{ size: number }> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    
    const chunkPath = `${privateObjectDir}/temp-chunks/${uploadId}/chunk_${chunkIndex.toString().padStart(6, '0')}`;
    const { bucketName, objectName } = parseObjectPath(chunkPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await new Promise<void>((resolve, reject) => {
      const stream = file.createWriteStream({
        metadata: { contentType: 'application/octet-stream' },
        resumable: false,
      });
      
      stream.on("error", reject);
      stream.on("finish", resolve);
      stream.end(chunkData);
    });
    
    console.log(`[GCS Chunk] Uploaded chunk ${chunkIndex} for ${uploadId}: ${chunkData.length} bytes`);
    return { size: chunkData.length };
  }

  // Compose multiple chunks from GCS into a single file using GCS compose API
  // This works across autoscale instances since all data is in GCS, not local filesystem
  async composeChunksFromGCS(
    uploadId: string,
    totalChunks: number,
    contentType: string
  ): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    
    const objectId = randomUUID();
    const finalPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName: finalObjectName } = parseObjectPath(finalPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    
    console.log(`[GCS Compose] Composing ${totalChunks} chunks for upload ${uploadId}...`);
    
    // Build list of source chunk files
    const sourceFiles: GCSFile[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${privateObjectDir}/temp-chunks/${uploadId}/chunk_${i.toString().padStart(6, '0')}`;
      const { objectName: chunkObjectName } = parseObjectPath(chunkPath);
      sourceFiles.push(bucket.file(chunkObjectName));
    }
    
    // GCS compose has a limit of 32 objects per compose operation
    // For larger files, we need to compose in batches
    const COMPOSE_LIMIT = 32;
    let currentSources = sourceFiles;
    let tempFileIndex = 0;
    
    while (currentSources.length > COMPOSE_LIMIT) {
      const newSources: GCSFile[] = [];
      
      for (let i = 0; i < currentSources.length; i += COMPOSE_LIMIT) {
        const batch = currentSources.slice(i, i + COMPOSE_LIMIT);
        const tempPath = `${privateObjectDir}/temp-chunks/${uploadId}/composed_${tempFileIndex++}`;
        const { objectName: tempObjectName } = parseObjectPath(tempPath);
        const tempFile = bucket.file(tempObjectName);
        
        console.log(`[GCS Compose] Composing batch of ${batch.length} files -> temp file ${tempFileIndex}`);
        await (tempFile as any).compose(batch, { metadata: { contentType } });
        newSources.push(tempFile);
        
        // Delete source files after composing
        for (const src of batch) {
          await src.delete().catch(() => {});
        }
      }
      
      currentSources = newSources;
    }
    
    // Final compose to destination
    const destFile = bucket.file(finalObjectName);
    console.log(`[GCS Compose] Final compose of ${currentSources.length} files -> ${finalObjectName}`);
    await (destFile as any).compose(currentSources, { metadata: { contentType } });
    
    // Clean up remaining temp files
    for (const src of currentSources) {
      await src.delete().catch(() => {});
    }
    
    // Get final file size for logging
    const [metadata] = await destFile.getMetadata();
    console.log(`[GCS Compose] Complete: ${metadata.size} bytes`);
    
    return `/objects/uploads/${objectId}`;
  }

  // Check if a chunk exists in GCS
  async chunkExistsInGCS(uploadId: string, chunkIndex: number): Promise<boolean> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      return false;
    }
    
    const chunkPath = `${privateObjectDir}/temp-chunks/${uploadId}/chunk_${chunkIndex.toString().padStart(6, '0')}`;
    const { bucketName, objectName } = parseObjectPath(chunkPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [exists] = await file.exists();
    return exists;
  }

  // List all chunks that exist for an upload in GCS
  async listChunksInGCS(uploadId: string): Promise<number[]> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      return [];
    }
    
    const prefix = `temp-chunks/${uploadId}/chunk_`;
    const { bucketName } = parseObjectPath(`${privateObjectDir}/${prefix}`);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: `${privateObjectDir.split('/').slice(1).join('/')}/${prefix}` });
    
    const chunkIndices: number[] = [];
    for (const file of files) {
      const match = file.name.match(/chunk_(\d+)$/);
      if (match) {
        chunkIndices.push(parseInt(match[1], 10));
      }
    }
    
    return chunkIndices.sort((a, b) => a - b);
  }

  // Clean up temp chunks for an upload
  async cleanupTempChunks(uploadId: string): Promise<void> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      return;
    }
    
    const prefix = `temp-chunks/${uploadId}/`;
    const { bucketName } = parseObjectPath(`${privateObjectDir}/${prefix}`);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const fullPrefix = `${privateObjectDir.split('/').slice(1).join('/')}/${prefix}`;
    const [files] = await bucket.getFiles({ prefix: fullPrefix });
    
    console.log(`[GCS Cleanup] Deleting ${files.length} temp files for upload ${uploadId}`);
    for (const file of files) {
      await file.delete().catch(() => {});
    }
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
    objectFile: GCSFile;
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
