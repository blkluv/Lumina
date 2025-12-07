import { useState, useRef } from "react";
import { Image, Video, X, Loader2, Globe, Users, AlertTriangle, ShieldCheck, Shield, Upload } from "lucide-react";
import * as UpChunk from "@mux/upchunk";
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
  
  // Mux upload states
  const [muxHlsUrl, setMuxHlsUrl] = useState<string | null>(null);
  const [muxThumbnailUrl, setMuxThumbnailUrl] = useState<string | null>(null);

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
    setMuxHlsUrl(null);
    setMuxThumbnailUrl(null);
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
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
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
    const { uploadId, objectPath } = await initResponse.json();
    console.log("[Upload] Got uploadId:", uploadId);
    
    // Upload each chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("uploadId", uploadId);
      formData.append("chunkIndex", String(chunkIndex));
      formData.append("totalChunks", String(totalChunks));
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Update progress based on chunks completed
            const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
            setUploadProgress(progress);
            resolve();
          } else {
            reject(new Error(`Chunk upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener("error", (e) => {
          console.error("[Upload] Chunk XHR error:", e);
          reject(new Error("Upload failed - please check your connection"));
        });
        
        console.log("[Upload] Sending chunk", chunkIndex, "of", totalChunks);
        xhr.open("POST", "/api/objects/chunked-upload/chunk");
        xhr.withCredentials = true;
        if (csrfToken) {
          xhr.setRequestHeader("X-CSRF-Token", csrfToken);
        }
        xhr.timeout = 120000; // 2 minutes per chunk
        xhr.send(formData);
      });
    }
    
    // Finalize the upload and get the actual storage path
    const completeResponse = await apiRequest("POST", "/api/objects/chunked-upload/complete", {
      uploadId,
    });
    const completeData = await completeResponse.json();
    
    // Use the actual path from the complete response (where the video was stored)
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

  // Upload video via Mux - handles all sizes reliably
  const uploadViaMux = async (file: File): Promise<{ hlsUrl: string; thumbnailUrl: string }> => {
    console.log("[Mux Upload] Starting Mux upload for file:", file.name, "size:", file.size);
    
    // Step 1: Get direct upload URL from our server
    const initResponse = await apiRequest("POST", "/api/mux/upload", {});
    const initData = await initResponse.json();
    
    // Check if Mux is not configured
    if (initData.muxNotConfigured) {
      throw new Error("Mux is not configured");
    }
    
    const { uploadId, uploadUrl } = initData;
    console.log("[Mux Upload] Got upload URL, uploadId:", uploadId);
    
    // Step 2: Upload file directly to Mux using UpChunk
    // Use chunked streaming - do NOT use useLargeFileWorkaround as it loads entire file into memory
    // Only enable the workaround for Safari/WebKit if streaming is not supported
    const needsWorkaround = !('stream' in File.prototype);
    
    await new Promise<void>((resolve, reject) => {
      const upload = UpChunk.createUpload({
        endpoint: uploadUrl,
        file: file,
        chunkSize: 5120, // 5MB chunks - reliable for large files
        dynamicChunkSize: true, // Auto-adjust based on network speed
        useLargeFileWorkaround: needsWorkaround, // Only for browsers without File.stream()
      });
      
      upload.on("progress", (progress: { detail: number }) => {
        const percent = Math.round(progress.detail);
        console.log("[Mux Upload] Progress:", percent + "%");
        setUploadProgress(percent);
      });
      
      upload.on("error", (error: { detail: string }) => {
        console.error("[Mux Upload] Error:", error.detail);
        reject(new Error(error.detail || "Upload to Mux failed"));
      });
      
      upload.on("success", () => {
        console.log("[Mux Upload] Upload complete, waiting for processing...");
        resolve();
      });
      
      upload.on("offline", () => {
        console.log("[Mux Upload] Connection lost, will resume when back online");
      });
      
      upload.on("online", () => {
        console.log("[Mux Upload] Back online, resuming upload");
      });
    });
    
    // Step 3: Poll for asset to be ready (Mux processes the video)
    setUploadProgress(100);
    console.log("[Mux Upload] Polling for asset status...");
    
    let attempts = 0;
    let consecutiveErrors = 0;
    const maxAttempts = 120; // 4 minutes max wait (2s intervals)
    const maxConsecutiveErrors = 5;
    
    while (attempts < maxAttempts) {
      // Add jitter to polling interval (2-4 seconds)
      const pollDelay = 2000 + Math.random() * 2000;
      await new Promise(r => setTimeout(r, pollDelay));
      
      try {
        const statusResponse = await apiRequest("GET", `/api/mux/upload/${uploadId}/status`);
        const status = await statusResponse.json();
        console.log("[Mux Upload] Status:", status.status, "Asset:", status.assetStatus);
        
        consecutiveErrors = 0; // Reset error counter on success
        
        if (status.assetStatus === "ready" && status.hlsUrl) {
          console.log("[Mux Upload] Asset ready! HLS URL:", status.hlsUrl);
          return {
            hlsUrl: status.hlsUrl,
            thumbnailUrl: status.thumbnailUrl || "",
          };
        }
        
        if (status.assetStatus === "errored") {
          throw new Error("Video processing failed on Mux");
        }
        
        attempts++;
      } catch (error: any) {
        console.error("[Mux Upload] Status check error:", error);
        consecutiveErrors++;
        attempts++;
        
        // If too many consecutive errors, abort
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error("Unable to verify video processing status - please try again");
        }
        
        // Exponential backoff on errors
        await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, consecutiveErrors), 10000)));
      }
    }
    
    throw new Error("Video processing timed out - please try again");
  };

  // Upload video and show thumbnail selector
  const handleVideoUpload = async () => {
    console.log("[Upload] handleVideoUpload called, mediaFile:", mediaFile?.name, "mediaType:", mediaType);
    if (!mediaFile || mediaType !== "video") return;
    
    setIsSubmitting(true);
    setUploadProgress(0);
    setIsUploading(true);
    
    try {
      // Use Mux for all video uploads - reliable for any size
      console.log("[Upload] Using Mux for video upload, size:", mediaFile.size);
      const { hlsUrl, thumbnailUrl } = await uploadViaMux(mediaFile);
      
      // Store Mux URLs for post creation
      setMuxHlsUrl(hlsUrl);
      setMuxThumbnailUrl(thumbnailUrl);
      setUploadedVideoPath(hlsUrl); // Use HLS URL as the video path
      setSelectedThumbnail(thumbnailUrl); // Auto-select Mux thumbnail
      
      // Skip thumbnail selector for Mux uploads - Mux auto-generates thumbnails
      setShowThumbnailSelector(false);
      
      toast({
        title: "Video uploaded",
        description: "Your video is ready! Click Post to publish.",
      });
    } catch (error: any) {
      console.error("[Upload] Video upload failed:", error);
      
      // Check if it's a Mux configuration error - fall back to old method
      if (error.message?.includes("not configured")) {
        console.log("[Upload] Mux not configured, falling back to chunked upload");
        try {
          const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024;
          let videoPath: string;
          
          if (mediaFile.size > LARGE_FILE_THRESHOLD) {
            videoPath = await uploadChunked(mediaFile);
          } else {
            videoPath = await uploadViaProxy(mediaFile);
          }
          
          setUploadedVideoPath(videoPath);
          setShowThumbnailSelector(true);
          
          toast({
            title: "Video uploaded",
            description: "Now choose a thumbnail for your video!",
          });
          return;
        } catch (fallbackError: any) {
          console.error("[Upload] Fallback upload also failed:", fallbackError);
          toast({
            title: "Upload failed",
            description: fallbackError.message || "Failed to upload video",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload video",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
      setUploadProgress(0);
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

    // For videos that haven't been uploaded yet, upload first
    if (mediaType === "video" && mediaFile && !uploadedVideoPath) {
      await handleVideoUpload();
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let mediaUrl = uploadedVideoPath;
      let thumbnailUrl = selectedThumbnail;
      let hlsUrl = muxHlsUrl;
      
      // For Mux uploads, the uploadedVideoPath is actually the HLS URL
      // so we should clear mediaUrl and use hlsUrl instead
      if (muxHlsUrl) {
        mediaUrl = null; // No local media URL for Mux uploads
        hlsUrl = muxHlsUrl;
        thumbnailUrl = muxThumbnailUrl || selectedThumbnail;
      }
      
      if (mediaFile && !mediaUrl && !hlsUrl) {
        setIsUploading(true);
        if (mediaType === "video") {
          // Use chunked upload for files over 50MB to bypass server limits
          const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
          if (mediaFile.size > LARGE_FILE_THRESHOLD) {
            mediaUrl = await uploadChunked(mediaFile);
          } else {
            mediaUrl = await uploadViaProxy(mediaFile);
          }
        } else {
          mediaUrl = await uploadDirect(mediaFile);
        }
        setIsUploading(false);
      }

      // Auto-generate thumbnail for videos if not already selected (non-Mux uploads)
      if (mediaType === "video" && mediaUrl && !thumbnailUrl && !selectedThumbnail && !muxThumbnailUrl) {
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
        mediaUrl,
        hlsUrl, // Include HLS URL for Mux uploads
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
