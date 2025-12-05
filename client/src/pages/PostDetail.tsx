import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Heart, MessageCircle, Share2, Coins, Play, Copy, Check, Twitter, Facebook } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TipModal } from "@/components/modals/TipModal";
import { CommentModal } from "@/components/modals/CommentModal";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostWithAuthor } from "@shared/schema";

function formatTimeAgo(date: Date | string | null): string {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return then.toLocaleDateString();
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const { data: post, isLoading, error } = useQuery<PostWithAuthor>({
    queryKey: ["/api/posts", id],
    enabled: !!id,
  });

  useEffect(() => {
    if (post) {
      setLikeCount(post.likeCount || 0);
      setLiked((post as any).liked ?? false);
    }
  }, [post]);

  const postUrl = `${window.location.origin}/post/${id}`;
  const shareText = post ? `Check out this post by @${post.author?.username} on Lumina!` : "Check out this post on Lumina!";

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to like posts.",
        variant: "destructive",
      });
      return;
    }

    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      await apiRequest("POST", `/api/posts/${id}/like`);
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
    } catch (err) {
      setLiked(!newLiked);
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
      });
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(facebookUrl, "_blank", "noopener,noreferrer");
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Post not found</h1>
          <p className="text-muted-foreground">This post may have been deleted or doesn't exist.</p>
          <Button onClick={() => navigate("/feed")} data-testid="button-back-to-feed">
            Go to Feed
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2"
          onClick={() => window.history.back()}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card className="overflow-hidden" data-testid={`card-post-${post.id}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Link href={`/profile/${post.author.username}`}>
                <Avatar className="w-12 h-12 cursor-pointer">
                  <AvatarImage src={post.author.avatarUrl || undefined} />
                  <AvatarFallback>
                    {(post.author.displayName || post.author.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/profile/${post.author.username}`}>
                    <span className="font-semibold hover:underline cursor-pointer" data-testid="text-author-name">
                      {post.author.displayName || post.author.username}
                    </span>
                  </Link>
                  <span className="text-muted-foreground text-sm">@{post.author.username}</span>
                  {post.author.walletVerified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-post-time">
                  {formatTimeAgo(post.createdAt)}
                </p>
              </div>
            </div>

            {post.content && (
              <p className="text-lg mb-4 whitespace-pre-wrap" data-testid="text-post-content">
                {post.content}
              </p>
            )}

            {post.mediaUrl && post.postType === "video" && (
              <div 
                className="relative rounded-lg overflow-hidden bg-black aspect-video mb-4 cursor-pointer"
                onClick={togglePlayPause}
              >
                <video
                  ref={videoRef}
                  src={post.mediaUrl}
                  className="w-full h-full object-contain"
                  playsInline
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  data-testid="video-post-media"
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-black fill-black ml-1" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {post.mediaUrl && post.postType === "image" && (
              <div className="rounded-lg overflow-hidden mb-4">
                <img
                  src={post.mediaUrl}
                  alt="Post media"
                  className="w-full h-auto max-h-[600px] object-contain bg-muted"
                  data-testid="img-post-media"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={liked ? "text-red-500" : ""}
                  data-testid="button-like"
                >
                  <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                  <span className="ml-1">{likeCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCommentModal(true)}
                  data-testid="button-comment"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="ml-1">{post.commentCount || 0}</span>
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTipModal(true)}
                  className="text-amber-500"
                  data-testid="button-tip"
                >
                  <Coins className="w-5 h-5" />
                  Tip
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="button-share">
                      <Share2 className="w-5 h-5" />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyLink} data-testid="menu-copy-link">
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? "Copied!" : "Copy link"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareTwitter} data-testid="menu-share-twitter">
                      <Twitter className="w-4 h-4 mr-2" />
                      Share on X
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareFacebook} data-testid="menu-share-facebook">
                      <Facebook className="w-4 h-4 mr-2" />
                      Share on Facebook
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <h3 className="font-semibold mb-2">Share this post</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Share this post on social media to help spread the word about Lumina!
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCopyLink} data-testid="button-copy-link-bottom">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareTwitter} data-testid="button-share-twitter-bottom">
              <Twitter className="w-4 h-4 mr-2" />
              Share on X
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareFacebook} data-testid="button-share-facebook-bottom">
              <Facebook className="w-4 h-4 mr-2" />
              Share on Facebook
            </Button>
          </div>
        </div>
      </div>

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
    </MainLayout>
  );
}
