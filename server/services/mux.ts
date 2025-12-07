import Mux from "@mux/mux-node";

function getMuxClient(): Mux {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  
  if (!tokenId || !tokenSecret) {
    throw new Error("Mux credentials not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.");
  }
  
  return new Mux({ tokenId, tokenSecret });
}

export function isMuxConfigured(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

export interface MuxLiveStream {
  id: string;
  streamKey: string;
  playbackId: string;
  rtmpUrl: string;
  playbackUrl: string;
  status: "idle" | "active" | "disabled";
}

export interface MuxStreamStatus {
  status: "idle" | "active" | "disabled";
  recentAssetIds: string[];
}

export async function createMuxLiveStream(): Promise<MuxLiveStream> {
  const mux = getMuxClient();
  const liveStream = await mux.video.liveStreams.create({
    playback_policy: ["public"],
    new_asset_settings: {
      playback_policy: ["public"],
    },
    reconnect_window: 30,
    latency_mode: "low",
  });

  const playbackId = liveStream.playback_ids?.[0]?.id;
  
  if (!playbackId) {
    throw new Error("Failed to get playback ID from Mux");
  }

  return {
    id: liveStream.id,
    streamKey: liveStream.stream_key!,
    playbackId,
    rtmpUrl: "rtmps://global-live.mux.com:443/app",
    playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`,
    status: liveStream.status as "idle" | "active" | "disabled",
  };
}

export async function getMuxStreamStatus(liveStreamId: string): Promise<MuxStreamStatus> {
  const mux = getMuxClient();
  const stream = await mux.video.liveStreams.retrieve(liveStreamId);
  
  return {
    status: stream.status as "idle" | "active" | "disabled",
    recentAssetIds: stream.recent_asset_ids || [],
  };
}

export async function deleteMuxLiveStream(liveStreamId: string): Promise<void> {
  const mux = getMuxClient();
  await mux.video.liveStreams.delete(liveStreamId);
}

export async function disableMuxLiveStream(liveStreamId: string): Promise<void> {
  const mux = getMuxClient();
  await mux.video.liveStreams.disable(liveStreamId);
}

export async function enableMuxLiveStream(liveStreamId: string): Promise<void> {
  const mux = getMuxClient();
  await mux.video.liveStreams.enable(liveStreamId);
}

export async function resetMuxStreamKey(liveStreamId: string): Promise<string> {
  const mux = getMuxClient();
  const result = await mux.video.liveStreams.resetStreamKey(liveStreamId);
  return result.stream_key!;
}

// Direct Upload functions for user video uploads
export interface MuxDirectUpload {
  id: string;
  url: string; // The URL to upload the video to
}

export interface MuxAsset {
  id: string;
  playbackId: string | null;
  status: string;
  duration: number | null;
}

export async function createDirectUpload(corsOrigin: string = "*"): Promise<MuxDirectUpload> {
  const mux = getMuxClient();
  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policy: ["public"],
      // Use static_renditions for MP4 support (mp4_support is deprecated)
      // "highest" creates highest.mp4 at up to 4K resolution
      static_renditions: [
        { resolution: "highest" }
      ],
    },
  });

  return {
    id: upload.id,
    url: upload.url!,
  };
}

export async function createStaticRendition(assetId: string): Promise<void> {
  const mux = getMuxClient();
  try {
    await mux.video.assets.createStaticRendition(assetId, {
      resolution: "highest",
    });
  } catch (error) {
    console.error("Failed to create static MP4 rendition:", error);
    // Non-fatal - video will still work via HLS
  }
}

export async function getUploadStatus(uploadId: string): Promise<{ status: string; assetId: string | null }> {
  const mux = getMuxClient();
  const upload = await mux.video.uploads.retrieve(uploadId);
  
  return {
    status: upload.status || "unknown",
    assetId: upload.asset_id || null,
  };
}

export async function getAsset(assetId: string): Promise<MuxAsset> {
  const mux = getMuxClient();
  const asset = await mux.video.assets.retrieve(assetId);
  
  const playbackId = asset.playback_ids?.[0]?.id || null;
  
  return {
    id: asset.id,
    playbackId,
    status: asset.status || "unknown",
    duration: asset.duration || null,
  };
}

export async function waitForAssetReady(assetId: string, maxAttempts: number = 60): Promise<MuxAsset> {
  for (let i = 0; i < maxAttempts; i++) {
    const asset = await getAsset(assetId);
    if (asset.status === "ready") {
      return asset;
    }
    if (asset.status === "errored") {
      throw new Error("Mux asset processing failed");
    }
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error("Timeout waiting for Mux asset to be ready");
}

export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getMp4Url(playbackId: string): string {
  // Static MP4 rendition URL for social media sharing (Facebook, etc.)
  // Uses static_renditions with resolution: "highest" -> produces highest.mp4
  return `https://stream.mux.com/${playbackId}/highest.mp4`;
}

export function getThumbnailUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
}

export function getAnimatedGifUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/animated.gif`;
}

export default {
  createMuxLiveStream,
  getMuxStreamStatus,
  deleteMuxLiveStream,
  disableMuxLiveStream,
  enableMuxLiveStream,
  resetMuxStreamKey,
  getPlaybackUrl,
  getMp4Url,
  getThumbnailUrl,
  getAnimatedGifUrl,
  createDirectUpload,
  createStaticRendition,
  getUploadStatus,
  getAsset,
  waitForAssetReady,
};
