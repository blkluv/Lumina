import { useState, useRef } from "react";
import { Image, Video, X, Loader2, Globe, Users, AlertTriangle, ShieldCheck, Shield, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { apiRequest, queryClient, getCsrfToken } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { VideoThumbnailSelector } from "./VideoThumbnailSelector";

interface PostComposerProps {
  onSuccess?: () => void;
  className?: string;
  groupId?: string;
}

export function PostComposer({ onSuccess, className, groupId }: PostComposerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<{
    isViolation: boolean;
    severity: string;
    explanation: string;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Video thumbnail states
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);

  const maxLength = 500;
  const charCount = content.length;
  const isOverLimit = charCount > maxLength;

  if (!user) return null;

  const handleMediaSelect = (file: File, type: "image" | "video") => {
    setMediaFile(file);
    setMediaType(type);
    
    // For videos, use URL.createObjectURL to avoid loading entire file into memory
    // FileReader.readAsDataURL would exhaust browser memory for large videos (100MB+)
    if (type === "video") {
      const objectUrl = URL.createObjectURL(file);
      setMediaPreview(objectUrl);
    } else {
      // For images, FileReader is fine since they're typically small
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Images must be under 10MB",
          variant: "destructive",
        });
        return;
      }
      handleMediaSelect(file, "image");
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Allow up to 2GB for longer videos
      if (file.size > 2 * 1024 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Videos must be under 2GB",
          variant: "destructive",
        });
        return;
      }
      
      // Validate video duration (max 10 minutes = 600 seconds)
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
        if (duration > 600) {
          toast({
            title: "Video too long",
            description: "Videos must be 10 minutes or less",
            variant: "destructive",
          });
          return;
        }
        setVideoDuration(duration);
        handleMediaSelect(file, "video");
      } catch {
        toast({
          title: "Invalid video",
          description: "Could not process video file",
          variant: "destructive",
        });
      }
    }
  };

  const clearMedia = () => {
    // Revoke object URL to prevent memory leaks (for video previews)
    if (mediaPreview && mediaType === "video" && mediaPreview.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadedVideoPath(null);
    setVideoDuration(0);
    setSelectedThumbnail(null);
    setShowThumbnailSelector(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const checkContent = async () => {
    if (!content.trim()) return;
    
    setIsChecking(true);
    try {
      const response = await apiRequest("POST", "/api/moderation/pre-check", {
        content: content.trim(),
        mediaType,
      });
      const result = await response.json();
      
      if (result.isViolation) {
        setModerationWarning({
          isViolation: true,
          severity: result.severity,
          explanation: result.explanation,
        });
      } else {
        setModerationWarning(null);
      }
    } catch (error) {
      console.error("Moderation check error:", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Chunked upload for large videos - uploads in smaller pieces to bypass size limits
  const uploadChunked = async (file: File): Promise<string> => {
    console.log("[Upload] Starting chunked upload for file:", file.name, "size:", file.size);
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (smaller for better reliability)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const csrfToken = await getCsrfToken();
    console.log("[Upload] Total chunks:", totalChunks, "CSRF token:", csrfToken ? "present" : "missing");
    
    // First, initialize the upload and get an upload ID
    console.log("[Upload] Initializing chunked upload...");
    const initResponse = await apiRequest("POST", "/api/objects/chunked-upload/init", {
      contentType: file.type,
      totalSize: file.size,
      totalChunks,
    });
    const { uploadId } = await initResponse.json();
    console.log("[Upload] Got uploadId:", uploadId);
    
    // Helper to upload a single chunk with retry
    const uploadChunk = async (chunkIndex: number, maxRetries = 3): Promise<void> => {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append("chunk", chunk, `chunk_${chunkIndex}`);
            formData.append("uploadId", uploadId);
            formData.append("chunkIndex", String(chunkIndex));
            formData.append("totalChunks", String(totalChunks));
            
            xhr.upload.addEventListener("progress", (event) => {
              if (event.lengthComputable && event.total > 0) {
                // Calculate overall progress including this chunk's progress
                const chunkProgress = event.loaded / event.total;
                const overallProgress = ((chunkIndex + chunkProgress) / totalChunks) * 100;
                setUploadProgress(Math.round(Math.min(overallProgress, 99))); // Cap at 99 until complete
              }
            });
            
            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log(`[Upload] Chunk ${chunkIndex + 1}/${totalChunks} complete`);
                resolve();
              } else {
                let errorMsg = `Status ${xhr.status}`;
                try {
                  const errData = JSON.parse(xhr.responseText);
                  errorMsg = errData.error || errorMsg;
                } catch {}
                reject(new Error(`Chunk upload failed: ${errorMsg}`));
              }
            });
            
            xhr.addEventListener("error", () => {
              reject(new Error("Network error during chunk upload"));
            });
            
            xhr.addEventListener("timeout", () => {
              reject(new Error("Chunk upload timed out"));
            });
            
            console.log(`[Upload] Sending chunk ${chunkIndex + 1}/${totalChunks} (attempt ${attempt}/${maxRetries})`);
            xhr.open("POST", "/api/objects/chunked-upload/chunk");
            xhr.withCredentials = true;
            if (csrfToken) {
              xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            }
            xhr.timeout = 180000; // 3 minutes per chunk
            xhr.send(formData);
          });
          return; // Success - exit retry loop
        } catch (error: any) {
          console.error(`[Upload] Chunk ${chunkIndex} attempt ${attempt} failed:`, error.message);
          if (attempt === maxRetries) {
            throw error;
          }
          // Wait before retry with exponential backoff
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    };
    
    // Upload each chunk sequentially
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      await uploadChunk(chunkIndex);
    }
    
    // Finalize the upload and get the actual storage path
    console.log("[Upload] All chunks uploaded, completing...");
    const completeResponse = await apiRequest("POST", "/api/objects/chunked-upload/complete", {
      uploadId,
    });
    const completeData = await completeResponse.json();
    
    console.log("[Upload] Chunked upload complete:", completeData.objectPath);
    setUploadProgress(100); // Show 100% on successful completion
    return completeData.objectPath;
  };

  // Proxy upload for smaller videos - goes through server
  const uploadViaProxy = async (file: File): Promise<string> => {
    console.log("[Upload] Starting proxy upload for file:", file.name, "size:", file.size);
    // Get CSRF token before starting upload
    const csrfToken = await getCsrfToken();
    console.log("[Upload] CSRF token for proxy:", csrfToken ? "present" : "missing");
    
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.objectPath);
          } catch {
            reject(new Error("Invalid response from server"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });
      
      xhr.addEventListener("error", (e) => {
        console.error("[Upload] Proxy XHR error:", e);
        reject(new Error("Upload failed - please check your connection and try again"));
      });
      
      xhr.addEventListener("timeout", () => {
        console.error("[Upload] Proxy XHR timeout");
        reject(new Error("Upload timed out - video may be too large, try a shorter video"));
      });
      
      console.log("[Upload] Opening proxy upload connection...");
      xhr.open("POST", "/api/objects/upload-proxy");
      xhr.withCredentials = true; // Include cookies
      if (csrfToken) {
        xhr.setRequestHeader("X-CSRF-Token", csrfToken);
      }
      xhr.timeout = 600000; // 10 minutes timeout
      xhr.send(formData);
    });
  };

  // Direct upload for images - faster for small files
  const uploadDirect = async (file: File): Promise<string> => {
    // Get signed URL from server
    const uploadRes = await apiRequest("POST", "/api/objects/upload", {});
    const { uploadURL } = await uploadRes.json();
    
    // Upload with XMLHttpRequest for progress tracking
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
        reject(new Error("Upload failed - please check your connection and try again"));
      });
      
      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timed out"));
      });
      
      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.timeout = 300000; // 5 minutes timeout
      xhr.send(file);
    });
    
    // Set ACL and get object path
    const updateRes = await apiRequest("PUT", "/api/media", {
      mediaURL: uploadURL.split("?")[0],
    });
    const { objectPath } = await updateRes.json();
    return objectPath;
  };

  // Upload video to Object Storage (MP4 direct playback) - returns the video path
  const uploadVideoToStorage = async (file: File): Promise<string> => {
    console.log("[Upload] Starting video upload, size:", file.size);
    
    const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
    
    if (file.size > LARGE_FILE_THRESHOLD) {
      // Use chunked upload for large files to avoid memory issues
      return await uploadChunked(file);
    } else {
      // Use proxy upload for smaller files (simpler, still reliable)
      return await uploadViaProxy(file);
    }
  };

  const handleThumbnailSelect = (thumbnailPath: string) => {
    setSelectedThumbnail(thumbnailPath);
    setShowThumbnailSelector(false);
    toast({
      title: "Thumbnail selected",
      description: "Click Post to publish your video!",
    });
  };

  const handleSkipThumbnail = async () => {
    // When user skips, auto-generate a thumbnail from the video
    if (uploadedVideoPath) {
      try {
        const response = await apiRequest("POST", "/api/video/auto-thumbnail", {
          videoPath: uploadedVideoPath,
        });
        const data = await response.json();
        if (data.thumbnailPath) {
          setSelectedThumbnail(data.thumbnailPath);
        }
      } catch (error) {
        console.error("Auto-thumbnail generation failed:", error);
        // Continue without thumbnail if generation fails
      }
    }
    setShowThumbnailSelector(false);
    toast({
      title: "Ready to post",
      description: "Thumbnail has been auto-generated. Click Post to publish!",
    });
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !mediaFile) || isOverLimit) return;

    // If there's a high severity warning, block submission
    if (moderationWarning?.isViolation && 
        (moderationWarning.severity === "high" || moderationWarning.severity === "critical")) {
      toast({
        title: "Content blocked",
        description: "This content violates our community guidelines. Please modify and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setIsUploading(true);
    
    try {
      let mediaUrl: string | null = uploadedVideoPath;
      let thumbnailUrl = selectedThumbnail;
      
      // Upload video if not already uploaded
      if (mediaType === "video" && mediaFile && !mediaUrl) {
        console.log("[Submit] Uploading video...");
        mediaUrl = await uploadVideoToStorage(mediaFile);
        setUploadedVideoPath(mediaUrl);
      }
      
      // Upload images directly
      if (mediaType === "image" && mediaFile && !mediaUrl) {
        console.log("[Submit] Uploading image...");
        mediaUrl = await uploadDirect(mediaFile);
      }

      // Auto-generate thumbnail for videos if not already selected
      if (mediaType === "video" && mediaUrl && !thumbnailUrl) {
        try {
          const thumbResponse = await apiRequest("POST", "/api/video/auto-thumbnail", {
            videoPath: mediaUrl,
          });
          const thumbData = await thumbResponse.json();
          if (thumbData.thumbnailPath) {
            thumbnailUrl = thumbData.thumbnailPath;
          }
        } catch (error) {
          console.error("Auto-thumbnail generation failed:", error);
          // Continue without thumbnail if generation fails
        }
      }

      await apiRequest("POST", "/api/posts", {
        content: content.trim(),
        postType: mediaType || "text",
        mediaUrl, // Direct MP4 URL from Object Storage
        thumbnailUrl,
        visibility,
        groupId: groupId || null,
        skipModeration: moderationWarning?.isViolation && 
          (moderationWarning.severity === "low" || moderationWarning.severity === "medium"),
      });

      setContent("");
      clearMedia();
      setModerationWarning(null);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully!",
      });
      
      onSuccess?.();
    } catch (error: any) {
      // Try to parse the error response for moderation blocking
      let errorData: any = null;
      try {
        // apiRequest throws with format "STATUS: JSON_BODY"
        const errorMessage = error?.message || "";
        const jsonMatch = errorMessage.match(/^\d+:\s*(.+)$/);
        if (jsonMatch) {
          errorData = JSON.parse(jsonMatch[1]);
        }
      } catch {
        // Not JSON, use as-is
      }

      if (errorData?.blocked) {
        toast({
          title: "Content blocked",
          description: "This content violates our community guidelines.",
          variant: "destructive",
        });
        setModerationWarning({
          isViolation: true,
          severity: errorData.moderationResult?.severity || "high",
          explanation: errorData.moderationResult?.explanation || "Content blocked",
        });
      } else {
        toast({
          title: "Failed to create post",
          description: errorData?.error || error?.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex gap-3 sm:gap-4">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {(user.displayName || user.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <Textarea
              placeholder="What's happening?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (moderationWarning) setModerationWarning(null);
              }}
              className="min-h-24 resize-none border-0 p-0 text-base focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground"
              data-testid="input-post-content"
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Upload className="h-4 w-4 animate-pulse" />
                    Uploading video...
                  </span>
                  <span className="text-primary font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Moderation Warning */}
            {moderationWarning && (
              <Alert 
                variant="destructive" 
                className={cn(
                  "mt-3",
                  moderationWarning.severity === "low" && "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                  moderationWarning.severity === "medium" && "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <span className="font-medium">
                    {moderationWarning.severity === "high" || moderationWarning.severity === "critical" 
                      ? "Content blocked: " 
                      : "Warning: "}
                  </span>
                  {moderationWarning.explanation}
                  {(moderationWarning.severity === "low" || moderationWarning.severity === "medium") && (
                    <span className="block mt-1 text-xs opacity-80">
                      You can still post, but your content may be reviewed by moderators.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {mediaPreview && (
              <div className="relative mt-3 rounded-xl overflow-hidden bg-muted/50 border border-border/50">
                {mediaType === "image" ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-80 object-contain bg-black/5 dark:bg-white/5"
                  />
                ) : (
                  <div className="aspect-video bg-black">
                    <video
                      src={mediaPreview}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                  onClick={clearMedia}
                  data-testid="button-remove-media"
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
                {/* Show thumbnail indicator if selected */}
                {selectedThumbnail && mediaType === "video" && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    Thumbnail set
                  </div>
                )}
              </div>
            )}

            {/* Video Thumbnail Selector */}
            {showThumbnailSelector && uploadedVideoPath && (
              <VideoThumbnailSelector
                videoPath={uploadedVideoPath}
                videoDuration={videoDuration}
                onThumbnailSelect={handleThumbnailSelect}
                onSkip={handleSkipThumbnail}
                className="mt-3"
              />
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={!!mediaFile}
                  data-testid="button-add-image"
                >
                  <Image className="h-5 w-5 text-primary" />
                </Button>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={!!mediaFile}
                  data-testid="button-add-video"
                >
                  <Video className="h-5 w-5 text-primary" />
                </Button>

                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="w-32 h-9 border-0 bg-transparent" data-testid="select-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="followers">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Followers
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-sm",
                  isOverLimit ? "text-destructive" : "text-muted-foreground"
                )}>
                  {charCount}/{maxLength}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkContent}
                  disabled={!content.trim() || isChecking}
                  className="hidden sm:flex"
                  data-testid="button-check-content"
                >
                  {isChecking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Check
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    (!content.trim() && !mediaFile) || 
                    isOverLimit || 
                    isSubmitting ||
                    showThumbnailSelector ||
                    (moderationWarning?.isViolation && 
                      (moderationWarning.severity === "high" || moderationWarning.severity === "critical"))
                  }
                  className="shadow-lg shadow-primary/25"
                  data-testid="button-submit-post"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mediaType === "video" && !uploadedVideoPath 
                    ? "Upload Video" 
                    : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
