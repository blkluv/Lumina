import { useState, useRef } from "react";
import { Image, Video, X, Loader2, Globe, Users, AlertTriangle, ShieldCheck, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

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
  const [moderationWarning, setModerationWarning] = useState<{
    isViolation: boolean;
    severity: string;
    explanation: string;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const maxLength = 500;
  const charCount = content.length;
  const isOverLimit = charCount > maxLength;

  if (!user) return null;

  const handleMediaSelect = (file: File, type: "image" | "video") => {
    setMediaFile(file);
    setMediaType(type);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Videos must be under 100MB",
          variant: "destructive",
        });
        return;
      }
      handleMediaSelect(file, "video");
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
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
    try {
      let mediaUrl = null;
      
      if (mediaFile) {
        const uploadRes = await apiRequest("POST", "/api/objects/upload", {});
        const { uploadURL } = await uploadRes.json();
        
        await fetch(uploadURL, {
          method: "PUT",
          body: mediaFile,
          headers: {
            "Content-Type": mediaFile.type,
          },
        });
        
        const updateRes = await apiRequest("PUT", "/api/media", {
          mediaURL: uploadURL.split("?")[0],
        });
        const { objectPath } = await updateRes.json();
        mediaUrl = objectPath;
      }

      await apiRequest("POST", "/api/posts", {
        content: content.trim(),
        postType: mediaType || "text",
        mediaUrl,
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
              </div>
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
                    (moderationWarning?.isViolation && 
                      (moderationWarning.severity === "high" || moderationWarning.severity === "critical"))
                  }
                  className="shadow-lg shadow-primary/25"
                  data-testid="button-submit-post"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
