import { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Maximize, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface WHEPVideoPlayerProps {
  whepUrl: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  showControls?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export default function WHEPVideoPlayer({
  whepUrl,
  autoPlay = true,
  muted: initialMuted = false,
  className,
  showControls = true,
  onConnectionChange,
}: WHEPVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const whepResourceUrlRef = useRef<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const connect = useCallback(async () => {
    if (!whepUrl || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      peerConnectionRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
          onConnectionChange?.(true);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("WHEP connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsConnected(true);
          setRetryCount(0);
          onConnectionChange?.(true);
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setIsConnected(false);
          onConnectionChange?.(false);
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              connect();
            }, 2000);
          } else {
            setConnectionError("Connection lost. Click to retry.");
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", checkState);
          setTimeout(resolve, 3000);
        }
      });

      const response = await fetch(whepUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: pc.localDescription?.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHEP server returned ${response.status}`);
      }

      const location = response.headers.get("Location");
      if (location) {
        whepResourceUrlRef.current = new URL(location, whepUrl).toString();
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setIsConnecting(false);
    } catch (error) {
      console.error("WHEP connection failed:", error);
      setConnectionError("Failed to connect to stream");
      setIsConnecting(false);
      setIsConnected(false);
      onConnectionChange?.(false);
    }
  }, [whepUrl, isConnecting, retryCount, onConnectionChange]);

  const disconnect = useCallback(async () => {
    if (whepResourceUrlRef.current) {
      try {
        await fetch(whepResourceUrlRef.current, { method: "DELETE" });
      } catch (error) {
        console.error("Failed to delete WHEP resource:", error);
      }
      whepResourceUrlRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsConnected(false);
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  useEffect(() => {
    if (autoPlay) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [whepUrl]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setConnectionError(null);
    connect();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video bg-black rounded-lg overflow-hidden group",
        className
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-contain"
        data-testid="whep-video-player"
      />

      {!isConnected && !isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          {connectionError ? (
            <div className="text-center">
              <WifiOff className="h-12 w-12 mx-auto mb-2 text-destructive" />
              <p className="text-white mb-4">{connectionError}</p>
              <Button onClick={handleRetry} data-testid="button-retry-connection">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          ) : (
            <div className="text-center text-white">
              <Wifi className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Waiting for stream...</p>
            </div>
          )}
        </div>
      )}

      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center text-white">
            <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Connecting...</p>
          </div>
        </div>
      )}

      {isConnected && (
        <Badge
          variant="destructive"
          className="absolute top-3 left-3 animate-pulse"
        >
          LIVE
        </Badge>
      )}

      {showControls && isConnected && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleMute}
                data-testid="button-toggle-mute"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                WebRTC
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
                data-testid="button-fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
