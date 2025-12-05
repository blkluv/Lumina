import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Camera, Image, X, Loader2, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StoryCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BACKGROUND_COLORS = [
  "#000000",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#10b981",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#ef4444",
];

export function StoryCreator({ open, onOpenChange }: StoryCreatorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const createStoryMutation = useMutation({
    mutationFn: async (data: { mediaUrl: string; mediaType: string; caption?: string; backgroundColor?: string }) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Story posted!" });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/feed"] });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to create story", variant: "destructive" });
    },
  });
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({ title: "Please select an image or video", variant: "destructive" });
      return;
    }
    
    const isVideo = file.type.startsWith("video/");
    
    // File size validation
    if (isVideo && file.size > 500 * 1024 * 1024) {
      toast({ title: "Videos must be under 500MB", variant: "destructive" });
      return;
    }
    if (!isVideo && file.size > 10 * 1024 * 1024) {
      toast({ title: "Images must be under 10MB", variant: "destructive" });
      return;
    }
    
    // Video duration validation (max 3 minutes for stories)
    if (isVideo) {
      const video = document.createElement("video");
      video.preload = "metadata";
      
      const durationPromise = new Promise<number>((resolve, reject) => {
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          resolve(video.duration);
        };
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          reject(new Error("Failed to load video"));
        };
      });
      
      video.src = URL.createObjectURL(file);
      
      try {
        const duration = await durationPromise;
        if (duration > 180) {
          toast({ title: "Videos must be 3 minutes or less", variant: "destructive" });
          return;
        }
      } catch {
        toast({ title: "Could not process video file", variant: "destructive" });
        return;
      }
    }
    
    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");
    
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  
  const uploadWithProgress = (url: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed - network error"));
      });
      
      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timed out - please try again"));
      });
      
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.timeout = 600000; // 10 minutes timeout for large files
      xhr.send(file);
    });
  };

  const uploadAndCreate = async () => {
    if (!mediaFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadRes = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await uploadRes.json();
      
      // Use XMLHttpRequest for progress tracking on large files
      await uploadWithProgress(uploadURL, mediaFile);
      
      const updateRes = await apiRequest("PUT", "/api/media", {
        mediaURL: uploadURL.split("?")[0],
      });
      const { objectPath } = await updateRes.json();
      
      await createStoryMutation.mutateAsync({
        mediaUrl: objectPath,
        mediaType,
        caption: caption.trim() || undefined,
        backgroundColor,
      });
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const resetForm = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setCaption("");
    setBackgroundColor(BACKGROUND_COLORS[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const isSubmitting = isUploading || createStoryMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
          <DialogDescription>
            Share a moment that disappears in 24 hours
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!mediaPreview ? (
            <div className="space-y-4">
              <div
                className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">Add Photo or Video</p>
                <p className="text-sm text-muted-foreground">Click to browse</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-story-file"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className="relative aspect-[9/16] max-h-[300px] rounded-xl overflow-hidden mx-auto"
                style={{ backgroundColor }}
              >
                {mediaType === "video" ? (
                  <video
                    src={mediaPreview}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                )}
                
                {caption && (
                  <div className="absolute bottom-4 left-2 right-2">
                    <p className="text-white text-center text-sm font-medium drop-shadow-lg">
                      {caption}
                    </p>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => {
                    setMediaFile(null);
                    setMediaPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  data-testid="button-remove-media"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        backgroundColor === color ? "border-primary scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setBackgroundColor(color)}
                      data-testid={`color-${color.replace("#", "")}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Input
                  id="caption"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={150}
                  data-testid="input-story-caption"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {caption.length}/150
                </p>
              </div>
            </div>
          )}
          
          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Upload className="h-4 w-4 animate-pulse" />
                  Uploading...
                </span>
                <span className="text-primary font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={uploadAndCreate}
              disabled={!mediaFile || isSubmitting}
              data-testid="button-post-story"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isUploading ? `Uploading ${uploadProgress}%...` : "Posting..."}
                </>
              ) : (
                "Post Story"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
