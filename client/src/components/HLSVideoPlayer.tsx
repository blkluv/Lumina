import { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Loader2,
  Radio,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HLSVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  onError?: (error: string) => void;
  onStreamActive?: () => void;
  onStreamIdle?: () => void;
}

export function HLSVideoPlayer({
  src,
  poster,
  autoPlay = true,
  muted = false,
  className,
  onError,
  onStreamActive,
  onStreamIdle,
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [isLive, setIsLive] = useState(true);
  const [streamStatus, setStreamStatus] = useState<"connecting" | "active" | "idle">("connecting");
  
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setError(null);
    setStreamStatus("connecting");

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        setStreamStatus("active");
        onStreamActive?.();
        
        const levels = data.levels.map((level, index) => ({
          height: level.height,
          index,
        }));
        setQualities(levels);
        
        if (autoPlay) {
          video.play().catch(() => {
            setIsMuted(true);
            video.muted = true;
            video.play().catch(console.error);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                setStreamStatus("idle");
                setIsLoading(false);
                onStreamIdle?.();
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("Stream playback error");
              onError?.("Stream playback error");
              break;
          }
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQuality(data.level);
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        setStreamStatus("active");
        onStreamActive?.();
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });
      video.addEventListener("error", () => {
        setError("Failed to load stream");
        onError?.("Failed to load stream");
      });
    } else {
      setError("HLS playback not supported in this browser");
      onError?.("HLS playback not supported");
    }
  }, [src, autoPlay, onError, onStreamActive, onStreamIdle]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value[0];
    if (value[0] > 0 && video.muted) {
      video.muted = false;
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const jumpToLive = () => {
    const video = videoRef.current;
    if (!video || !hlsRef.current) return;
    video.currentTime = video.duration;
    video.play().catch(console.error);
  };

  if (streamStatus === "idle") {
    return (
      <div className={cn("relative bg-black flex items-center justify-center", className)}>
        <div className="text-center p-8">
          <Radio className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-semibold text-white mb-2">Waiting for broadcaster...</h3>
          <p className="text-muted-foreground">
            The stream will start when the host begins broadcasting via RTMP
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("relative bg-black flex items-center justify-center", className)}>
        <div className="text-center p-8">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Stream Error</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black group", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        muted={isMuted}
        data-testid="video-player"
      />

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
                data-testid="button-mute"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-24"
                data-testid="slider-volume"
              />
            </div>

            {isLive && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1 px-2 py-1 h-7"
                onClick={jumpToLive}
                data-testid="button-live"
              >
                <Radio className="h-3 w-3" />
                LIVE
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {qualities.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    data-testid="button-quality"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleQualityChange(-1)}
                    className={currentQuality === -1 ? "bg-accent" : ""}
                  >
                    Auto
                  </DropdownMenuItem>
                  {qualities.map((q) => (
                    <DropdownMenuItem
                      key={q.index}
                      onClick={() => handleQualityChange(q.index)}
                      className={currentQuality === q.index ? "bg-accent" : ""}
                    >
                      {q.height}p
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
              data-testid="button-fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
