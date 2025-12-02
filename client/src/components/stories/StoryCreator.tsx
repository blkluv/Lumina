import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Camera, Image, X, Loader2 } from "lucide-react";
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
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({ title: "Please select an image or video", variant: "destructive" });
      return;
    }
    
    setMediaFile(file);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  
  const uploadAndCreate = async () => {
    if (!mediaFile) return;
    
    setIsUploading(true);
    
    try {
      const uploadRes = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await uploadRes.json();
      
      const uploadFormData = new FormData();
      Object.entries(uploadURL.fields).forEach(([key, value]) => {
        uploadFormData.append(key, value as string);
      });
      uploadFormData.append("file", mediaFile);
      
      await fetch(uploadURL.url, {
        method: "POST",
        body: uploadFormData,
      });
      
      const mediaUrl = `/objects/${uploadURL.fields.key}`;
      
      await apiRequest("PUT", "/api/media", { mediaURL: mediaUrl });
      
      await createStoryMutation.mutateAsync({
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
        backgroundColor,
      });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
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
                  Posting...
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
