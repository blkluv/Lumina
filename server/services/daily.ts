const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = "https://api.daily.co/v1";

interface DailyRoomConfig {
  name: string;
  privacy?: "public" | "private";
  properties?: {
    exp?: number;
    max_participants?: number;
    enable_chat?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
    owner_only_broadcast?: boolean;
  };
}

interface DailyRoom {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    exp?: number;
    max_participants?: number;
    enable_chat?: boolean;
    owner_only_broadcast?: boolean;
  };
}

interface DailyMeetingToken {
  token: string;
}

async function dailyRequest(
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: any
): Promise<any> {
  if (!DAILY_API_KEY) {
    throw new Error("Daily.co API key not configured");
  }

  const response = await fetch(`${DAILY_API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Daily.co API error: ${response.status}`, error);
    throw new Error(`Daily.co API error: ${response.status}`);
  }

  return response.json();
}

export async function createRoom(streamId: string): Promise<DailyRoom> {
  const roomName = `lumina-stream-${streamId}`;
  const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 8; // 8 hours max

  const config: DailyRoomConfig = {
    name: roomName,
    privacy: "public",
    properties: {
      exp: expirationTime,
      max_participants: 1000,
      enable_chat: false, // We use our own chat
      owner_only_broadcast: true, // Only host can broadcast
      start_video_off: false,
      start_audio_off: false,
    },
  };

  return dailyRequest("/rooms", "POST", config);
}

export async function getRoom(roomName: string): Promise<DailyRoom | null> {
  try {
    return await dailyRequest(`/rooms/${roomName}`);
  } catch (error) {
    return null;
  }
}

export async function deleteRoom(roomName: string): Promise<void> {
  try {
    await dailyRequest(`/rooms/${roomName}`, "DELETE");
  } catch (error) {
    console.error(`Failed to delete room ${roomName}:`, error);
  }
}

export async function createMeetingToken(
  roomName: string,
  options: {
    userId: string;
    userName: string;
    isOwner?: boolean;
    expiresInSeconds?: number;
  }
): Promise<string> {
  const expirationTime =
    Math.floor(Date.now() / 1000) + (options.expiresInSeconds || 60 * 60 * 4); // 4 hours default

  const tokenConfig = {
    properties: {
      room_name: roomName,
      user_id: options.userId,
      user_name: options.userName,
      is_owner: options.isOwner || false,
      exp: expirationTime,
      start_video_off: !options.isOwner,
      start_audio_off: !options.isOwner,
      enable_screenshare: options.isOwner,
      start_cloud_recording: false,
    },
  };

  const result: DailyMeetingToken = await dailyRequest(
    "/meeting-tokens",
    "POST",
    tokenConfig
  );
  return result.token;
}

export async function getRoomUrl(streamId: string): Promise<string | null> {
  const roomName = `lumina-stream-${streamId}`;
  const room = await getRoom(roomName);
  return room?.url || null;
}

export function getDailyRoomName(streamId: string): string {
  return `lumina-stream-${streamId}`;
}
