import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

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
  const stream = await mux.video.liveStreams.retrieve(liveStreamId);
  
  return {
    status: stream.status as "idle" | "active" | "disabled",
    recentAssetIds: stream.recent_asset_ids || [],
  };
}

export async function deleteMuxLiveStream(liveStreamId: string): Promise<void> {
  await mux.video.liveStreams.delete(liveStreamId);
}

export async function disableMuxLiveStream(liveStreamId: string): Promise<void> {
  await mux.video.liveStreams.disable(liveStreamId);
}

export async function enableMuxLiveStream(liveStreamId: string): Promise<void> {
  await mux.video.liveStreams.enable(liveStreamId);
}

export async function resetMuxStreamKey(liveStreamId: string): Promise<string> {
  const result = await mux.video.liveStreams.resetStreamKey(liveStreamId);
  return result.stream_key!;
}

export function getPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
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
  getThumbnailUrl,
  getAnimatedGifUrl,
};
