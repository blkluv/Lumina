import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Coins, User, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Sparkles, Award, Loader2, Copy, Check, Twitter, Facebook, Link as LinkIcon, Trash2, MoreVertical } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/layout/Header";
import { TipModal } from "@/components/modals/TipModal";
import { CommentModal } from "@/components/modals/CommentModal";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@shared/schema";

// Global sound state - unlocks after first user interaction
const SoundContext = createContext<{
  soundEnabled: boolean;
  enableSound: () => void;
  userInteracted: boolean;
}>({
  soundEnabled: true,
  enableSound: () => {},
  userInteracted: false,
});

function VideoCard({
  post,
  isActive,
  onLike,
  onFollow,
}: {
  post: PostWithAuthor;
  isActive: boolean;
  onLike: (postId: string) => Promise<void>;
  onFollow: (userId: string) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { soundEnabled, enableSound, userInteracted } = useContext(SoundContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted - browser will enforce if needed
  const [liked, setLiked] = useState((post as any).liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const postUrl = `${window.location.origin}/post/${post.id}`;

  // Fetch signed URL for video playback
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!post.mediaUrl || !post.mediaUrl.startsWith("/objects/")) {
        setVideoSrc(post.mediaUrl);
        return;
      }
      
      setVideoLoading(true);
      try {
        const response = await fetch(`/api/objects/signed-url?path=${encodeURIComponent(post.mediaUrl)}`);
        if (response.ok) {
          const data = await response.json();
          setVideoSrc(data.signedUrl);
        } else {
          // Fallback to direct URL if signed URL fails
          setVideoSrc(post.mediaUrl);
        }
      } catch (error) {
        console.error("Failed to fetch signed URL:", error);
        setVideoSrc(post.mediaUrl);
      } finally {
        setVideoLoading(false);
      }
    };
    
    fetchSignedUrl();
  }, [post.mediaUrl]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
      toast({
        title: "Video deleted",
        description: "Your video has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/videos"] });
      setShowDeleteConfirm(false);
    } catch (err) {
      toast({
        title: "Failed to delete",
        description: "Could not delete the video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const shareText = `Check out this video by @${post.author.username} on Lumina!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Video link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
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

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Video by ${post.author.displayName || post.author.username}`,
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Sync muted state with sound enabled preference
  useEffect(() => {
    if (videoRef.current && userInteracted && soundEnabled) {
      videoRef.current.muted = false;
      setIsMuted(false);
      setShowSoundPrompt(false);
    }
  }, [userInteracted, soundEnabled]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isActive) {
      const video = videoRef.current;
      
      // Try to play with sound first
      video.muted = !soundEnabled || !userInteracted;
      
      video.play().then(() => {
        setIsPlaying(true);
        // If we had to play muted (browser policy), show sound prompt
        if (video.muted && !userInteracted) {
          setShowSoundPrompt(true);
        }
      }).catch(() => {
        // If unmuted play failed, try muted
        video.muted = true;
        setIsMuted(true);
        setShowSoundPrompt(true);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, soundEnabled, userInteracted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    // Any interaction enables sound
    enableSound();
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    enableSound(); // Mark user interaction
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    setShowSoundPrompt(false);
  };

  const handleLike = async () => {
    console.log("handleLike called, user:", user?.id, "post:", post.id);
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to like videos.",
        variant: "destructive",
      });
      return;
    }
    
    // Optimistic update
    const wasLiked = liked;
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    
    try {
      console.log("Calling onLike with postId:", post.id);
      await onLike(post.id);
      console.log("onLike completed successfully");
    } catch (error) {
      console.error("onLike failed:", error);
      // Revert on error
      setLiked(wasLiked);
      setLikeCount((prev) => (wasLiked ? prev : prev - 1));
      toast({
        title: "Failed to like",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={post.thumbnailUrl || undefined}
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            onError={(e) => {
              const video = e.currentTarget;
              console.error("Video error:", {
                error: video.error?.code,
                message: video.error?.message,
                src: video.src?.substring(0, 100),
                networkState: video.networkState,
                readyState: video.readyState,
              });
            }}
            onLoadedMetadata={() => console.log("Video metadata loaded for post:", post.id)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const width = rect.width;
              if (clickX < width * 0.85) {
                togglePlay();
              }
            }}
            className="w-full h-full object-contain cursor-pointer"
            data-testid={`video-${post.id}`}
          />
        ) : videoLoading ? (
          <div className="flex items-center justify-center text-white/50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="flex items-center justify-center text-white/50">
            <p>No video available</p>
          </div>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Play className="h-10 w-10 text-white ml-1" />
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-20 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <Link href={`/profile/${post.author.username}`}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-11 w-11 border-2 border-primary/50 ring-2 ring-primary/20">
                <AvatarImage src={post.author.avatarUrl || undefined} alt={post.author.displayName || post.author.username} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  {(post.author.displayName || post.author.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">
                    {post.author.displayName || post.author.username}
                  </p>
                  {post.author.verifiedAt && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-white/70 text-xs">@{post.author.username}</p>
              </div>
            </div>
          </Link>

          {post.content && (
            <div>
              <p
                className={cn(
                  "text-white text-sm leading-relaxed",
                  !showCaption && "line-clamp-2"
                )}
                onClick={() => setShowCaption(!showCaption)}
              >
                {post.content}
              </p>
              {post.content.length > 100 && (
                <button
                  onClick={() => setShowCaption(!showCaption)}
                  className="text-white/70 text-xs mt-1 hover:text-white transition-colors"
                >
                  {showCaption ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-[10px]">
              <Coins className="w-3 h-3 mr-1" />
              Earn AXM
            </Badge>
          </div>
        </div>

        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-[100] pointer-events-auto">
          <Link href={`/profile/${post.author.username}`}>
            <div className="relative group">
              <Avatar className="h-12 w-12 border-2 border-white ring-2 ring-primary/30 transition-all group-hover:ring-primary/50">
                <AvatarImage src={post.author.avatarUrl || undefined} alt={post.author.displayName || post.author.username} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  {(post.author.displayName || post.author.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user?.id !== post.author.id && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onFollow(post.author.id);
                  }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg shadow-primary/30"
                  data-testid="button-follow-video"
                >
                  +
                </button>
              )}
            </div>
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto"
            data-testid="button-like-video"
          >
            <div 
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                liked ? "bg-red-500/30 ring-2 ring-red-500/50" : "bg-white/10 group-hover:bg-white/20"
              )}
            >
              <Heart className={cn("h-6 w-6 transition-transform group-hover:scale-110", liked ? "fill-red-500 text-red-500" : "text-white")} />
            </div>
            <span className="text-white text-xs font-medium">{likeCount}</span>
            <span className="text-primary/80 text-[9px]">+2 AXM</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCommentModal(true);
            }}
            className="flex flex-col items-center gap-1 group"
            data-testid="button-comment-video"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-all group-hover:bg-white/20">
              <MessageCircle className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
            </div>
            <span className="text-white text-xs font-medium">{post.commentCount || 0}</span>
            <span className="text-primary/80 text-[9px]">+5 AXM</span>
          </button>

          {user?.id !== post.author.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTipModal(true);
              }}
              className="flex flex-col items-center gap-1 group"
              data-testid="button-tip-video"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                <Coins className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              </div>
              <span className="text-primary text-xs font-medium">Tip</span>
            </button>
          )}

          <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
            <DropdownMenuTrigger asChild>
              <button
                className="flex flex-col items-center gap-1 group"
                data-testid="button-share-video"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-all group-hover:bg-white/20">
                  <Share2 className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
                </div>
                <span className="text-white text-xs font-medium">Share</span>
                <span className="text-primary/80 text-[9px]">+3 AXM</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="left" className="w-48" data-testid="share-menu-video">
              <DropdownMenuItem onClick={handleCopyLink} data-testid="button-copy-link-video">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy link"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShareTwitter} data-testid="button-share-twitter-video">
                <Twitter className="h-4 w-4 mr-2" />
                Share on X
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareFacebook} data-testid="button-share-facebook-video">
                <Facebook className="h-4 w-4 mr-2" />
                Share on Facebook
              </DropdownMenuItem>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleNativeShare} data-testid="button-share-native-video">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    More options...
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {user?.id === post.author.id && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex flex-col items-center gap-1 group"
              data-testid="button-delete-video"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center transition-all group-hover:bg-red-500/30 ring-1 ring-red-500/30">
                <Trash2 className="h-6 w-6 text-red-400 transition-transform group-hover:scale-110" />
              </div>
              <span className="text-red-400 text-xs font-medium">Delete</span>
            </button>
          )}
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {showSoundPrompt && (
            <div 
              className="bg-primary/90 backdrop-blur-sm px-4 py-2 rounded-full border border-primary cursor-pointer animate-pulse shadow-lg"
              onClick={() => {
                enableSound();
                if (videoRef.current) {
                  videoRef.current.muted = false;
                  setIsMuted(false);
                }
                setShowSoundPrompt(false);
              }}
            >
              <span className="text-white text-sm font-semibold flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Tap for sound
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full text-white border",
              isMuted 
                ? "bg-black/70 hover:bg-black/90 border-white/20" 
                : "bg-primary/80 hover:bg-primary border-primary/50"
            )}
            onClick={toggleMute}
            data-testid="button-mute-video"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>

        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-black/50 border border-white/10 text-white/90 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 mr-1 text-primary" />
            For You
          </Badge>
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your video and remove it from the For You feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-video"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ForYou() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  
  // Touch/swipe state for mobile
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollCooldown = 400; // ms between scroll actions
  
  // Cleanup transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);
  
  // Sound state - attempts to play with sound, remembers after first interaction
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('lumina-sound-enabled') === 'true';
      } catch {
        return true;
      }
    }
    return true;
  });
  const [userInteracted, setUserInteracted] = useState(false);

  const enableSound = useCallback(() => {
    setUserInteracted(true);
    setSoundEnabled(true);
    try {
      localStorage.setItem('lumina-sound-enabled', 'true');
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }, []);

  // Listen for any user interaction to unlock sound
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        enableSound();
      }
    };

    // These events indicate user intent to interact
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [userInteracted, enableSound]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<{ posts: PostWithAuthor[]; nextCursor?: string }>({
    queryKey: ["/api/posts/videos"],
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      console.log("likeMutation mutationFn called with postId:", postId);
      const res = await apiRequest("POST", `/api/posts/${postId}/like`, {});
      console.log("likeMutation response:", res.status);
      return res.json();
    },
    onSuccess: (data) => {
      console.log("likeMutation onSuccess:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/posts/videos"] });
    },
    onError: (error) => {
      console.error("likeMutation onError:", error);
    },
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/users/${userId}/follow`, {});
    },
  });

  // Navigate to a video with animation
  const goToVideo = useCallback((index: number, direction?: 'up' | 'down') => {
    if (index < 0 || index >= posts.length) return;
    if (isTransitioning) return;
    
    // Check cooldown
    const now = Date.now();
    if (now - lastScrollTime.current < scrollCooldown) return;
    lastScrollTime.current = now;
    
    // Clear any existing transition timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Set slide direction for animation
    const dir = direction || (index > currentIndex ? 'down' : 'up');
    setSlideDirection(dir);
    setIsTransitioning(true);
    
    setCurrentIndex(index);
    
    // Reset transition state after animation completes
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setSlideDirection(null);
    }, 350);
    
    // Prefetch more videos when near the end
    if (index >= posts.length - 2 && hasNextPage) {
      fetchNextPage();
    }
  }, [posts.length, hasNextPage, fetchNextPage, currentIndex, isTransitioning]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      goToVideo(currentIndex + 1, 'down');
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      goToVideo(currentIndex - 1, 'up');
    }
  }, [currentIndex, goToVideo]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Mouse wheel navigation with debouncing
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) < 50) return; // Increase threshold
    
    if (e.deltaY > 0) {
      goToVideo(currentIndex + 1, 'down');
    } else {
      goToVideo(currentIndex - 1, 'up');
    }
  }, [currentIndex, goToVideo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Touch/swipe gestures for mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = null;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === null || touchEndY.current === null) return;
    
    const deltaY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // Minimum swipe distance to trigger navigation
    
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        // Swiped up - go to next video
        goToVideo(currentIndex + 1, 'down');
      } else {
        // Swiped down - go to previous video
        goToVideo(currentIndex - 1, 'up');
      }
    }
    
    touchStartY.current = null;
    touchEndY.current = null;
  }, [currentIndex, goToVideo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <SoundContext.Provider value={{ soundEnabled, enableSound, userInteracted }}>
      <div className="h-screen flex flex-col bg-black">
        <div className="absolute top-0 left-0 right-0 z-50">
          <Header />
        </div>

        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden pt-16"
        >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 animate-pulse" />
              <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-white/70 text-sm">Loading curated content...</p>
            <Badge variant="secondary" className="bg-white/10 text-white/50">
              <Coins className="w-3 h-3 mr-1 text-primary" />
              Earn AXM for watching
            </Badge>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
              <Play className="h-10 w-10 text-white/30" />
            </div>
            <h2 className="text-white text-xl font-semibold">Failed to load videos</h2>
            <p className="text-white/50 max-w-xs">Please try refreshing the page to see the latest content</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-white text-xl font-semibold">No videos yet</h2>
            <p className="text-white/50 max-w-xs">Be the first to upload a video and earn AXM rewards for being an early creator!</p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-primary/10 border-primary/20 text-primary">
                <Award className="w-3 h-3 mr-1" />
                Early creator bonus
              </Badge>
            </div>
          </div>
        ) : (
          <div className="h-full relative overflow-hidden">
            {posts.map((post, index) => {
              const isCurrentVideo = index === currentIndex;
              const isPrevVideo = index === currentIndex - 1;
              const isNextVideo = index === currentIndex + 1;
              const shouldRender = isCurrentVideo || isPrevVideo || isNextVideo;
              
              if (!shouldRender) return null;
              
              // Calculate slide transform
              let translateY = '0%';
              if (isCurrentVideo) {
                translateY = '0%';
              } else if (isPrevVideo) {
                translateY = '-100%';
              } else if (isNextVideo) {
                translateY = '100%';
              }
              
              return (
                <div
                  key={post.id}
                  className={cn(
                    "absolute inset-0 transition-all duration-300 ease-out will-change-transform",
                    isCurrentVideo ? "z-10" : "z-0"
                  )}
                  style={{
                    transform: `translateY(${translateY})`,
                  }}
                >
                  <VideoCard
                    post={post}
                    isActive={isCurrentVideo}
                    onLike={(postId) => likeMutation.mutateAsync(postId)}
                    onFollow={(userId) => followMutation.mutate(userId)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {posts.length > 1 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 border border-white/10"
              onClick={() => goToVideo(currentIndex - 1, 'up')}
              disabled={currentIndex === 0 || isTransitioning}
              data-testid="button-prev-video"
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 border border-white/10"
              onClick={() => goToVideo(currentIndex + 1, 'down')}
              disabled={currentIndex === posts.length - 1 || isTransitioning}
              data-testid="button-next-video"
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
          </div>
        )}

        {posts.length > 0 && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20">
            <div className="flex flex-col items-center gap-1 bg-black/30 rounded-full py-2 px-1 backdrop-blur-sm">
              {posts.slice(Math.max(0, currentIndex - 2), Math.min(posts.length, currentIndex + 3)).map((_, i) => {
                const actualIndex = Math.max(0, currentIndex - 2) + i;
                return (
                  <div
                    key={actualIndex}
                    className={cn(
                      "w-1 rounded-full transition-all",
                      actualIndex === currentIndex
                        ? "h-8 bg-gradient-to-b from-primary to-primary/60"
                        : "h-2 bg-white/30"
                    )}
                  />
                );
              })}
            </div>
          </div>
        )}

          {posts.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <Badge variant="secondary" className="bg-black/50 border border-white/10 text-white/70 backdrop-blur-sm text-xs">
                {currentIndex + 1} / {posts.length}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </SoundContext.Provider>
  );
}
