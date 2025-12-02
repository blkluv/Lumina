import { useState } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, Share2, Repeat2, MoreHorizontal, Coins, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TipModal } from "@/components/modals/TipModal";
import { CommentModal } from "@/components/modals/CommentModal";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";
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
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  const handleComment = () => {
    setShowCommentModal(true);
    onComment?.(post.id);
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
                <div className="mt-3 rounded-xl overflow-hidden bg-muted">
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full max-h-96 object-cover"
                    data-testid="img-post-media"
                  />
                </div>
              )}

              {post.mediaUrl && post.postType === "video" && (
                <div className="mt-3 rounded-xl overflow-hidden bg-muted relative aspect-video">
                  <video
                    src={post.mediaUrl}
                    poster={post.thumbnailUrl || undefined}
                    controls
                    className="w-full h-full object-cover"
                    data-testid="video-post-media"
                  />
                  {post.videoDuration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs flex items-center gap-1">
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
                    <span className="text-sm">{post.commentCount > 0 ? post.commentCount : ""}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2"
                    onClick={() => onRepost?.(post.id)}
                    data-testid="button-repost"
                  >
                    <Repeat2 className="h-4 w-4" />
                    <span className="text-sm">{post.shareCount > 0 ? post.shareCount : ""}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2"
                    onClick={() => onShare?.(post.id)}
                    data-testid="button-share"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
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
    </>
  );
}
