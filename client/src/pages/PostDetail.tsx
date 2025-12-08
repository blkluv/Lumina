import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Heart, MessageCircle, Share2, Coins, Play, Copy, Check, Twitter, Facebook, Maximize, Minimize, Trash2, Edit2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import MuxPlayer from "@mux/mux-player-react";
import Hls from "hls.js";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TipModal } from "@/components/modals/TipModal";
import { CommentModal } from "@/components/modals/CommentModal";
import { PostEditModal } from "@/components/modals/PostEditModal";
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
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(null);
  const [useHls, setUseHls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [additionalMediaUrls, setAdditionalMediaUrls] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const muxPlayerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  const extractMuxPlaybackId = (url: string): string | null => {
    const match = url.match(/stream\.mux\.com\/([a-zA-Z0-9]+)\.m3u8/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
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

  useEffect(() => {
    const setupVideoSource = async () => {
      if (!post || post.postType !== "video") return;

      const hlsUrl = (post as any).hlsUrl;
      if (hlsUrl) {
        const playbackId = extractMuxPlaybackId(hlsUrl);
        if (playbackId) {
          setMuxPlaybackId(playbackId);
          setVideoSrc(null);
          setUseHls(false);
          return;
        }
        setVideoSrc(hlsUrl);
        setUseHls(true);
        setMuxPlaybackId(null);
        return;
      }

      setMuxPlaybackId(null);
      if (!post.mediaUrl) {
        setVideoSrc(null);
        return;
      }
      
      if (!post.mediaUrl.startsWith("/objects/")) {
        setVideoSrc(post.mediaUrl);
        return;
      }

      try {
        const response = await fetch(`/api/objects/signed-url?path=${encodeURIComponent(post.mediaUrl)}`);
        if (response.ok) {
          const data = await response.json();
          setVideoSrc(data.signedUrl);
        } else {
          setVideoSrc(post.mediaUrl);
        }
      } catch (error) {
        console.error("Failed to fetch signed URL:", error);
        setVideoSrc(post.mediaUrl);
      }
    };

    setupVideoSource();
  }, [post]);

  // Fetch signed URLs for additional media items
  useEffect(() => {
    const fetchAdditionalMediaUrls = async () => {
      if (!post) return;
      const additionalMedia = (post as any).additionalMedia;
      if (!additionalMedia || additionalMedia.length === 0) return;

      const urlMap: Record<string, string> = {};
      
      await Promise.all(
        additionalMedia.map(async (media: any) => {
          if (!media.url) return;
          
          // If it's an object storage path, fetch signed URL
          if (media.url.startsWith("/objects/")) {
            try {
              const response = await fetch(`/api/objects/signed-url?path=${encodeURIComponent(media.url)}`);
              if (response.ok) {
                const data = await response.json();
                urlMap[media.id] = data.signedUrl;
              } else {
                urlMap[media.id] = media.url;
              }
            } catch (error) {
              console.error("Failed to fetch signed URL for additional media:", error);
              urlMap[media.id] = media.url;
            }
          } else {
            // External URL, use as-is
            urlMap[media.id] = media.url;
          }
        })
      );

      setAdditionalMediaUrls(urlMap);
    };

    fetchAdditionalMediaUrls();
  }, [post]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || !useHls) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc;
    }
  }, [videoSrc, useHls]);

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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (muxPlaybackId && muxPlayerRef.current) {
          await muxPlayerRef.current.requestFullscreen?.();
        } else if (videoContainerRef.current) {
          await videoContainerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleDelete = async () => {
    if (!user || !post) return;
    
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", post.author?.username] });
      navigate("/feed");
    } catch (err) {
      toast({
        title: "Failed to delete",
        description: "Could not delete the post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isAuthor = user?.id === post?.authorId;

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

            {post.postType === "video" && (
              <div 
                ref={videoContainerRef}
                className="relative rounded-lg overflow-hidden bg-black aspect-video mb-4 cursor-pointer group"
                onClick={muxPlaybackId ? undefined : togglePlayPause}
              >
                {muxPlaybackId ? (
                  <MuxPlayer
                    ref={muxPlayerRef}
                    playbackId={muxPlaybackId}
                    poster={post.thumbnailUrl || undefined}
                    loop
                    streamType="on-demand"
                    primaryColor="#10b981"
                    secondaryColor="#000000"
                    accentColor="#10b981"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                    style={{ width: '100%', height: '100%' }}
                    data-testid="mux-video-post-media"
                  />
                ) : videoSrc ? (
                  <video
                    ref={videoRef}
                    src={useHls ? undefined : videoSrc}
                    poster={post.thumbnailUrl || undefined}
                    className="w-full h-full object-contain"
                    playsInline
                    loop
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    data-testid="video-post-media"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                {!isPlaying && !muxPlaybackId && videoSrc && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-black fill-black ml-1" />
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  data-testid="button-fullscreen"
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
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

            {(post as any).additionalMedia && (post as any).additionalMedia.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4" data-testid="gallery-additional-media">
                {(post as any).additionalMedia.map((media: any, index: number) => (
                  <div key={media.id || index} className="rounded-lg overflow-hidden bg-muted aspect-square">
                    {media.type === "video" ? (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        {media.thumbnailUrl ? (
                          <img
                            src={media.thumbnailUrl}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Play className="w-8 h-8 text-white/60" />
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                            Video
                          </span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={additionalMediaUrls[media.id] || media.url}
                        alt={`Additional media ${index + 1}`}
                        className="w-full h-full object-cover"
                        data-testid={`img-additional-media-${index}`}
                      />
                    )}
                  </div>
                ))}
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

                {isAuthor && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      className="text-primary"
                      data-testid="button-edit"
                    >
                      <Edit2 className="w-5 h-5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid="button-delete"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </Button>
                  </>
                )}
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

      <PostEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        post={post}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove it from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
