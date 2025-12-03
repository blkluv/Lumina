interface CloudflareStreamInput {
  uid: string;
  rtmps: {
    url: string;
    streamKey: string;
  };
  rtmpsPlayback: {
    url: string;
    streamKey: string;
  };
  srt: {
    url: string;
    streamId: string;
    passphrase: string;
  };
  srtPlayback: {
    url: string;
    streamId: string;
    passphrase: string;
  };
  webRTC: {
    url: string;
  };
  webRTCPlayback: {
    url: string;
  };
  meta: {
    name?: string;
  };
  created: string;
  modified: string;
  status: {
    current: {
      state: string;
    } | null;
  };
  recording: {
    mode: string;
    requireSignedURLs: boolean;
    allowedOrigins: string[];
  };
}

interface CloudflareStreamResponse {
  result: CloudflareStreamInput;
  success: boolean;
  errors: any[];
  messages: any[];
}

interface CloudflareListResponse {
  result: CloudflareStreamInput[];
  success: boolean;
  errors: any[];
  messages: any[];
}

export interface CloudflareLiveInput {
  id: string;
  whipUrl: string;
  whepUrl: string;
  rtmpUrl: string;
  rtmpStreamKey: string;
  status: string;
  name?: string;
}

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

function getCredentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  
  if (!accountId || !apiToken) {
    throw new Error("Cloudflare Stream credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN environment variables.");
  }
  
  return { accountId, apiToken };
}

export async function createCloudflareStreamInput(name?: string): Promise<CloudflareLiveInput> {
  const { accountId, apiToken } = getCredentials();
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/live_inputs`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meta: { name: name || `Lumina Stream ${Date.now()}` },
        recording: { mode: "automatic" },
      }),
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cloudflare Stream API error:", response.status, errorText);
    throw new Error(`Failed to create Cloudflare Stream input: ${response.status}`);
  }
  
  const data: CloudflareStreamResponse = await response.json();
  
  if (!data.success || !data.result) {
    throw new Error("Failed to create Cloudflare Stream input");
  }
  
  const input = data.result;
  
  return {
    id: input.uid,
    whipUrl: input.webRTC.url,
    whepUrl: input.webRTCPlayback.url,
    rtmpUrl: input.rtmps.url,
    rtmpStreamKey: input.rtmps.streamKey,
    status: input.status?.current?.state || "idle",
    name: input.meta?.name,
  };
}

export async function getCloudflareStreamInput(inputId: string): Promise<CloudflareLiveInput | null> {
  const { accountId, apiToken } = getCredentials();
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/live_inputs/${inputId}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to get Cloudflare Stream input: ${response.status}`);
  }
  
  const data: CloudflareStreamResponse = await response.json();
  
  if (!data.success || !data.result) {
    return null;
  }
  
  const input = data.result;
  
  return {
    id: input.uid,
    whipUrl: input.webRTC.url,
    whepUrl: input.webRTCPlayback.url,
    rtmpUrl: input.rtmps.url,
    rtmpStreamKey: input.rtmps.streamKey,
    status: input.status?.current?.state || "idle",
    name: input.meta?.name,
  };
}

export async function deleteCloudflareStreamInput(inputId: string): Promise<void> {
  const { accountId, apiToken } = getCredentials();
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/live_inputs/${inputId}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Cloudflare Stream input: ${response.status}`);
  }
}

export async function listCloudflareStreamInputs(): Promise<CloudflareLiveInput[]> {
  const { accountId, apiToken } = getCredentials();
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/stream/live_inputs`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to list Cloudflare Stream inputs: ${response.status}`);
  }
  
  const data: CloudflareListResponse = await response.json();
  
  if (!data.success) {
    return [];
  }
  
  return data.result.map((input) => ({
    id: input.uid,
    whipUrl: input.webRTC.url,
    whepUrl: input.webRTCPlayback.url,
    rtmpUrl: input.rtmps.url,
    rtmpStreamKey: input.rtmps.streamKey,
    status: input.status?.current?.state || "idle",
    name: input.meta?.name,
  }));
}

export function isCloudflareConfigured(): boolean {
  return !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN);
}

export default {
  createCloudflareStreamInput,
  getCloudflareStreamInput,
  deleteCloudflareStreamInput,
  listCloudflareStreamInputs,
  isCloudflareConfigured,
};
