import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, Monitor, Settings, Play, Square, AlertCircle } from "lucide-react";

interface WHIPStreamPublisherProps {
  whipUrl: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: Error) => void;
}

interface MediaDevice {
  deviceId: string;
  label: string;
}

export default function WHIPStreamPublisher({
  whipUrl,
  onStreamStart,
  onStreamEnd,
  onError,
}: WHIPStreamPublisherProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const whipResourceUrlRef = useRef<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

  useEffect(() => {
    enumerateDevices();
    return () => {
      cleanup();
    };
  }, []);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter(d => d.kind === "videoinput")
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 4)}` }));
      const mics = devices
        .filter(d => d.kind === "audioinput")
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 4)}` }));
      
      setVideoDevices(cameras);
      setAudioDevices(mics);
      
      if (cameras.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(cameras[0].deviceId);
      }
      if (mics.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(mics[0].deviceId);
      }
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
    }
  };

  const setupPreview = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedVideoDevice ? { deviceId: selectedVideoDevice } : true,
        audio: selectedAudioDevice ? { deviceId: selectedAudioDevice } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await enumerateDevices();
      
      setConnectionError(null);
    } catch (error) {
      console.error("Failed to get media stream:", error);
      setConnectionError("Camera/microphone access denied. Please grant permissions.");
      onError?.(error as Error);
    }
  }, [selectedVideoDevice, selectedAudioDevice, onError]);

  useEffect(() => {
    setupPreview();
  }, [setupPreview]);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as MediaTrackConstraints,
        audio: true,
      });

      const audioTracks = mediaStreamRef.current?.getAudioTracks() || [];
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioTracks,
      ]);

      mediaStreamRef.current = combinedStream;
      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
      }

      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenShare(false);
        setupPreview();
      };

      setIsScreenShare(true);
    } catch (error) {
      console.error("Failed to start screen share:", error);
      setConnectionError("Screen sharing was cancelled or not supported.");
    }
  };

  const stopScreenShare = async () => {
    setIsScreenShare(false);
    await setupPreview();
  };

  const startStreaming = async () => {
    if (!whipUrl || !mediaStreamRef.current) {
      setConnectionError("No media stream available");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      peerConnectionRef.current = pc;

      mediaStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, mediaStreamRef.current!);
      });

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setConnectionError("Connection lost. Please try again.");
          stopStreaming();
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

      const response = await fetch(whipUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: pc.localDescription?.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHIP server returned ${response.status}: ${response.statusText}`);
      }

      const location = response.headers.get("Location");
      if (location) {
        whipResourceUrlRef.current = new URL(location, whipUrl).toString();
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      setIsStreaming(true);
      setIsConnecting(false);
      onStreamStart?.();
      
    } catch (error) {
      console.error("Failed to start WHIP stream:", error);
      setConnectionError(`Failed to connect: ${(error as Error).message}`);
      setIsConnecting(false);
      onError?.(error as Error);
    }
  };

  const stopStreaming = async () => {
    if (whipResourceUrlRef.current) {
      try {
        await fetch(whipResourceUrlRef.current, { method: "DELETE" });
      } catch (error) {
        console.error("Failed to delete WHIP resource:", error);
      }
      whipResourceUrlRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsStreaming(false);
    onStreamEnd?.();
  };

  const cleanup = () => {
    stopStreaming();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5" />
            Browser Stream
          </CardTitle>
          {isStreaming && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            data-testid="video-preview"
          />
          
          {!mediaStreamRef.current && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Setting up camera...</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-2 flex gap-1">
            <Button
              size="icon"
              variant={isCameraOn ? "secondary" : "destructive"}
              className="h-8 w-8"
              onClick={toggleCamera}
              disabled={isScreenShare}
              data-testid="button-toggle-camera"
            >
              {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant={isMicOn ? "secondary" : "destructive"}
              className="h-8 w-8"
              onClick={toggleMic}
              data-testid="button-toggle-mic"
            >
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {connectionError && (
          <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{connectionError}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!isStreaming ? (
            <Button
              onClick={startStreaming}
              disabled={isConnecting || !mediaStreamRef.current}
              className="flex-1"
              data-testid="button-start-stream"
            >
              {isConnecting ? (
                <>Connecting...</>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Go Live
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={stopStreaming}
              className="flex-1"
              data-testid="button-stop-stream"
            >
              <Square className="h-4 w-4 mr-2" />
              End Stream
            </Button>
          )}
          
          <Button
            size="icon"
            variant={isScreenShare ? "default" : "outline"}
            onClick={isScreenShare ? stopScreenShare : startScreenShare}
            disabled={isStreaming}
            data-testid="button-screen-share"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Camera</label>
              <Select
                value={selectedVideoDevice}
                onValueChange={(value) => {
                  setSelectedVideoDevice(value);
                  if (!isStreaming) setupPreview();
                }}
                disabled={isStreaming || isScreenShare}
              >
                <SelectTrigger data-testid="select-camera">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Microphone</label>
              <Select
                value={selectedAudioDevice}
                onValueChange={(value) => {
                  setSelectedAudioDevice(value);
                  if (!isStreaming) setupPreview();
                }}
                disabled={isStreaming}
              >
                <SelectTrigger data-testid="select-microphone">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Stream directly from your browser. No software needed.
        </p>
      </CardContent>
    </Card>
  );
}
