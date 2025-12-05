import { useState, useRef } from "react";
import { Image, Wand2, Grid3X3, Upload, Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getCsrfToken } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface VideoThumbnailSelectorProps {
  videoPath: string;
  videoDuration: number;
  onThumbnailSelect: (thumbnailPath: string) => void;
  onSkip?: () => void;
  className?: string;
}

interface Frame {
  thumbnailPath: string;
  timestamp: number;
  previewUrl: string;
}

export function VideoThumbnailSelector({
  videoPath,
  videoDuration,
  onThumbnailSelect,
  onSkip,
  className,
}: VideoThumbnailSelectorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<"auto" | "select" | "upload">("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [autoThumbnail, setAutoThumbnail] = useState<string | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [customTimestamp, setCustomTimestamp] = useState<number>(2);
  const [customPreview, setCustomPreview] = useState<string | null>(null);

  const generateAutoThumbnail = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/video/auto-thumbnail", {
        videoPath,
      });
      const data = await response.json();
      setAutoThumbnail(data.thumbnailPath);
      toast({
        title: "Thumbnail generated",
        description: "Auto-generated thumbnail is ready!",
      });
    } catch (error: any) {
      console.error("Auto thumbnail error:", error);
      toast({
        title: "Failed to generate thumbnail",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const extractFrames = async () => {
    setIsExtracting(true);
    try {
      const response = await apiRequest("POST", "/api/video/extract-frames", {
        videoPath,
        frameCount: 6,
      });
      const data = await response.json();
      setFrames(data.frames);
      if (data.frames.length > 0) {
        setSelectedFrame(data.frames[0].thumbnailPath);
      }
    } catch (error: any) {
      console.error("Frame extraction error:", error);
      toast({
        title: "Failed to extract frames",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const generateAtTimestamp = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/video/thumbnail-at-timestamp", {
        videoPath,
        timestamp: customTimestamp,
      });
      const data = await response.json();
      setCustomPreview(data.thumbnailPath);
    } catch (error: any) {
      console.error("Custom timestamp error:", error);
      toast({
        title: "Failed to generate preview",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Thumbnail must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {};
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      const response = await fetch("/api/objects/upload-proxy", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setCustomThumbnail(data.objectPath);
      toast({
        title: "Thumbnail uploaded",
        description: "Custom thumbnail is ready!",
      });
    } catch (error: any) {
      console.error("Custom upload error:", error);
      toast({
        title: "Failed to upload thumbnail",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    let thumbnailPath: string | null = null;

    switch (activeTab) {
      case "auto":
        thumbnailPath = autoThumbnail;
        break;
      case "select":
        thumbnailPath = customPreview || selectedFrame;
        break;
      case "upload":
        thumbnailPath = customThumbnail;
        break;
    }

    if (thumbnailPath) {
      onThumbnailSelect(thumbnailPath);
    } else {
      toast({
        title: "No thumbnail selected",
        description: "Please generate or upload a thumbnail first",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={cn("p-4 space-y-4", className)} data-testid="video-thumbnail-selector">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose Video Thumbnail</h3>
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} data-testid="button-skip-thumbnail">
            Skip
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auto" className="gap-2" data-testid="tab-auto-thumbnail">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Auto</span>
          </TabsTrigger>
          <TabsTrigger value="select" className="gap-2" data-testid="tab-select-frame">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Select</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2" data-testid="tab-upload-thumbnail">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Automatically generate a thumbnail from your video
          </p>
          
          {autoThumbnail ? (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={autoThumbnail}
                alt="Auto-generated thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={generateAutoThumbnail}
                  disabled={isGenerating}
                  data-testid="button-regenerate-auto"
                >
                  <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={generateAutoThumbnail}
              disabled={isGenerating}
              className="w-full"
              data-testid="button-generate-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Thumbnail
                </>
              )}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="select" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a frame from your video or pick a specific moment
          </p>

          {frames.length === 0 ? (
            <Button
              onClick={extractFrames}
              disabled={isExtracting}
              className="w-full"
              data-testid="button-extract-frames"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting frames...
                </>
              ) : (
                <>
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Extract Preview Frames
                </>
              )}
            </Button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {frames.map((frame) => (
                <button
                  key={frame.thumbnailPath}
                  onClick={() => setSelectedFrame(frame.thumbnailPath)}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                    selectedFrame === frame.thumbnailPath
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                  data-testid={`button-frame-${frame.timestamp}`}
                >
                  <img
                    src={frame.thumbnailPath}
                    alt={`Frame at ${formatTime(frame.timestamp)}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedFrame === frame.thumbnailPath && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 text-xs bg-black/60 text-white px-1 rounded">
                    {formatTime(frame.timestamp)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Custom Timestamp</span>
              <span className="text-sm text-muted-foreground">{formatTime(customTimestamp)}</span>
            </div>
            <Slider
              value={[customTimestamp]}
              onValueChange={([value]) => setCustomTimestamp(value)}
              max={Math.max(0, videoDuration - 0.5)}
              min={0}
              step={0.5}
              className="w-full"
              data-testid="slider-timestamp"
            />
            <div className="flex gap-2">
              <Button
                onClick={generateAtTimestamp}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="flex-1"
                data-testid="button-preview-timestamp"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Preview"
                )}
              </Button>
              {customPreview && (
                <Button
                  onClick={() => setSelectedFrame(customPreview)}
                  variant="secondary"
                  size="sm"
                  data-testid="button-use-custom-preview"
                >
                  Use This
                </Button>
              )}
            </div>
            {customPreview && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={customPreview}
                  alt="Custom timestamp preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your own custom thumbnail image
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomUpload}
            className="hidden"
          />

          {customThumbnail ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={customThumbnail}
                  alt="Custom thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
                data-testid="button-change-thumbnail"
              >
                <Image className="h-4 w-4 mr-2" />
                Change Image
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="w-full h-32 border-dashed"
              data-testid="button-upload-thumbnail"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload an image
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Max 10MB, JPG/PNG/GIF
                  </span>
                </div>
              )}
            </Button>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleConfirm}
          className="flex-1"
          disabled={
            (activeTab === "auto" && !autoThumbnail) ||
            (activeTab === "select" && !selectedFrame && !customPreview) ||
            (activeTab === "upload" && !customThumbnail)
          }
          data-testid="button-confirm-thumbnail"
        >
          <Check className="h-4 w-4 mr-2" />
          Use This Thumbnail
        </Button>
      </div>
    </Card>
  );
}
