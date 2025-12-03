import { useState } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, Share2, Repeat2, MoreHorizontal, Coins, Play, Copy, Check, Twitter, Facebook, Link as LinkIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TipModal } from "@/components/modals/TipModal";
import { CommentModal } from "@/components/modals/CommentModal";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostWithAuthor } from "@shared/schema";

interface PostCardProps {
  post: PostWithAuthor;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onRepost?: (postId: string) => void;
}

function formatTimeAgo(date: Date | string | null): string {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return then.toLocaleDateString();
}

export function PostCard({ post, onLike, onComment, onShare, onRepost }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showRepostDialog, setShowRepostDialog] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [copied, setCopied] = useState(false);

  const postUrl = `${window.location.origin}/post/${post.id}`;
  const shareText = `Check out this post by @${post.author.username} on Lumina!`;

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  const handleComment = () => {
    setShowCommentModal(true);
    onComment?.(post.id);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link. Please try again.",
        variant: "destructive",
      });
    }
    onShare?.(post.id);
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    onShare?.(post.id);
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(facebookUrl, "_blank", "noopener,noreferrer");
    onShare?.(post.id);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.displayName || post.author.username}`,
          text: shareText,
          url: postUrl,
        });
        onShare?.(post.id);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRepost = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to repost content.",
        variant: "destructive",
      });
      return;
    }

    setIsReposting(true);
    try {
      // Build repost content based on original post type
      let repostContent = `Reposted from @${post.author.username}`;
      if (post.content) {
        repostContent += `:\n\n${post.content}`;
      }
      
      // For media posts, include the original media
      const repostData: Record<string, unknown> = {
        content: repostContent,
        originalPostId: post.id,
      };
      
      // Preserve the original media for image/video reposts
      if (post.postType === "video" && post.mediaUrl) {
        repostData.postType = "video";
        repostData.mediaUrl = post.mediaUrl;
        repostData.thumbnailUrl = post.thumbnailUrl;
        repostData.videoDuration = post.videoDuration;
      } else if (post.postType === "image" && post.mediaUrl) {
        repostData.postType = "image";
        repostData.mediaUrl = post.mediaUrl;
      } else {
        repostData.postType = "text";
      }
      
      await apiRequest("POST", "/api/posts", repostData);
      
      setShareCount((prev) => prev + 1);
      await queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Reposted!",
        description: "The post has been shared to your profile.",
      });
      
      setShowRepostDialog(false);
      onRepost?.(post.id);
    } catch (err) {
      toast({
        title: "Repost failed",
        description: "Could not repost. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReposting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover-elevate" data-testid={`post-card-${post.id}`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                <AvatarImage src={post.author.avatarUrl || undefined} alt={post.author.displayName || post.author.username} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {(post.author.displayName || post.author.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/profile/${post.author.id}`} className="inline-flex items-center gap-2 group">
                    <span className="font-semibold truncate group-hover:text-primary transition-colors" data-testid="text-post-author">
                      {post.author.displayName || post.author.username}
                    </span>
                    <span className="text-muted-foreground text-sm">@{post.author.username}</span>
                  </Link>
                  <span className="text-muted-foreground text-sm ml-2">
                    · {formatTimeAgo(post.createdAt)}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" data-testid="button-post-menu">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Copy link</DropdownMenuItem>
                    <DropdownMenuItem>Share to...</DropdownMenuItem>
                    {user?.id !== post.author.id && (
                      <>
                        <DropdownMenuItem>Report</DropdownMenuItem>
                        <DropdownMenuItem>Mute @{post.author.username}</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {post.content && (
                <p className="mt-2 text-sm sm:text-base whitespace-pre-wrap break-words" data-testid="text-post-content">
                  {post.content}
                </p>
              )}

              {post.mediaUrl && post.postType === "image" && (
                <div className="mt-3 rounded-xl overflow-hidden bg-muted/50 border border-border/50">
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full max-h-[500px] object-contain bg-black/5 dark:bg-white/5"
                    loading="lazy"
                    data-testid="img-post-media"
                  />
                </div>
              )}

              {post.mediaUrl && post.postType === "video" && (
                <div className="mt-3 rounded-xl overflow-hidden bg-black relative aspect-video border border-border/50">
                  <video
                    src={post.mediaUrl}
                    poster={post.thumbnailUrl || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                    data-testid="video-post-media"
                  />
                  {post.videoDuration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs flex items-center gap-1 pointer-events-none">
                      <Play className="h-3 w-3" />
                      {Math.floor(post.videoDuration / 60)}:{(post.videoDuration % 60).toString().padStart(2, "0")}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-4 -ml-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-1.5 h-8 px-2",
                      liked && "text-red-500"
                    )}
                    onClick={handleLike}
                    data-testid="button-like"
                  >
                    <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                    <span className="text-sm">{likeCount > 0 ? likeCount : ""}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2"
                    onClick={handleComment}
                    data-testid="button-comment"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{(post.commentCount || 0) > 0 ? post.commentCount : ""}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2"
                    onClick={() => setShowRepostDialog(true)}
                    data-testid="button-repost"
                  >
                    <Repeat2 className="h-4 w-4" />
                    <span className="text-sm">{shareCount > 0 ? shareCount : ""}</span>
                  </Button>

                  <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 px-2"
                        data-testid="button-share"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" data-testid="share-menu">
                      <DropdownMenuItem onClick={handleCopyLink} data-testid="button-copy-link">
                        {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copied ? "Copied!" : "Copy link"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleShareTwitter} data-testid="button-share-twitter">
                        <Twitter className="h-4 w-4 mr-2" />
                        Share on X
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareFacebook} data-testid="button-share-facebook">
                        <Facebook className="h-4 w-4 mr-2" />
                        Share on Facebook
                      </DropdownMenuItem>
                      {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleNativeShare} data-testid="button-share-native">
                            <LinkIcon className="h-4 w-4 mr-2" />
                            More options...
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {user?.id !== post.author.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2 text-primary hover:text-primary"
                    onClick={() => setShowTipModal(true)}
                    data-testid="button-tip"
                  >
                    <Coins className="h-4 w-4" />
                    <span className="text-sm">Tip</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TipModal
        open={showTipModal}
        onOpenChange={setShowTipModal}
        recipient={post.author}
      />

      <CommentModal
        open={showCommentModal}
        onOpenChange={setShowCommentModal}
        post={post}
      />

      <Dialog open={showRepostDialog} onOpenChange={setShowRepostDialog}>
        <DialogContent data-testid="repost-dialog">
          <DialogHeader>
            <DialogTitle>Repost this content?</DialogTitle>
            <DialogDescription>
              This will share the post by @{post.author.username} to your profile for your followers to see.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-3 rounded-lg bg-muted/50 border text-sm">
            <p className="font-medium mb-1">{post.author.displayName || post.author.username}</p>
            {post.content && (
              <p className="text-muted-foreground line-clamp-3 mb-2">{post.content}</p>
            )}
            {post.postType === "video" && post.mediaUrl && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Play className="h-4 w-4" />
                <span>Video content will be included</span>
              </div>
            )}
            {post.postType === "image" && post.mediaUrl && (
              <div className="mt-2 rounded overflow-hidden max-h-32">
                <img src={post.mediaUrl} alt="Post preview" className="w-full object-cover" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRepostDialog(false)}
              data-testid="button-cancel-repost"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRepost}
              disabled={isReposting}
              data-testid="button-confirm-repost"
            >
              {isReposting ? "Reposting..." : "Repost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
