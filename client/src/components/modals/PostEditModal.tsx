import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Edit2, Plus, X, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostWithAuthor, PostMediaItem } from "@shared/schema";

interface PostEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostWithAuthor;
}

export function PostEditModal({ open, onOpenChange, post }: PostEditModalProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(post.content || "");
  const [additionalMedia, setAdditionalMedia] = useState<PostMediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContent(post.content || "");
      setAdditionalMedia((post as any).additionalMedia || []);
    }
  }, [open, post.content, (post as any).additionalMedia]);

  const uploadImage = async (file: File): Promise<string> => {
    const uploadRes = await apiRequest("POST", "/api/objects/upload", {});
    const { uploadURL } = await uploadRes.json();
    
    await new Promise<void>((resolve, reject) => {
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
        reject(new Error("Upload failed"));
      });
      
      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });

    const urlParts = new URL(uploadURL);
    return urlParts.pathname;
  };

  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} must be under 10MB`,
            variant: "destructive",
          });
          continue;
        }

        const isImage = file.type.startsWith("image/");

        if (!isImage) {
          toast({
            title: "Images only",
            description: "Additional media is limited to images. Use the main post for videos.",
            variant: "destructive",
          });
          continue;
        }

        const url = await uploadImage(file);
        
        const newMedia: PostMediaItem = {
          id: crypto.randomUUID(),
          type: "image",
          url: url,
        };

        setAdditionalMedia(prev => [...prev, newMedia]);
      }

      toast({
        title: "Images added",
        description: "Your images have been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveMedia = (id: string) => {
    setAdditionalMedia(prev => prev.filter(m => m.id !== id));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: { content: string; additionalMedia: PostMediaItem[] }) => {
      const response = await apiRequest("PATCH", `/api/posts/${post.id}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", post.author?.username] });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Failed to update",
        description: "Could not update your post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ 
      content: content.trim(),
      additionalMedia: additionalMedia,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setContent(post.content || "");
      setAdditionalMedia((post as any).additionalMedia || []);
    }
    onOpenChange(newOpen);
  };

  const allMedia = [
    ...(post.mediaUrl ? [{
      id: "primary",
      type: post.postType as "image" | "video",
      url: post.mediaUrl,
      thumbnailUrl: post.thumbnailUrl || undefined,
    }] : []),
    ...additionalMedia,
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Edit Post
          </DialogTitle>
          <DialogDescription>
            Update your caption and add more photos or videos to your post.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="content">Caption</Label>
              <Textarea
                id="content"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none"
                data-testid="input-edit-content"
              />
            </div>

            <div className="grid gap-2">
              <Label>Media</Label>
              
              {allMedia.length > 0 && (
                <div className={`grid gap-2 ${allMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {allMedia.map((media) => (
                    <div key={media.id} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
                      {media.type === "video" ? (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          {(media as any).thumbnailUrl ? (
                            <img
                              src={(media as any).thumbnailUrl}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Video className="h-8 w-8 text-white/60" />
                          )}
                          <div className="absolute top-2 left-2">
                            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                              Video
                            </span>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt="Post media"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {media.id !== "primary" && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveMedia(media.id)}
                          data-testid={`button-remove-media-${media.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddMedia}
                className="hidden"
                data-testid="input-add-media"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
                data-testid="button-add-media"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Photos
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateMutation.isPending || isUploading}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || isUploading}
              data-testid="button-save-edit"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
