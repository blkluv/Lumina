import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Coins, User, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Sparkles, Award, Loader2, Copy, Check, Twitter, Facebook, Link as LinkIcon } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
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
  onLike: (postId: string) => void;
  onFollow: (userId: string) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { soundEnabled, enableSound, userInteracted } = useContext(SoundContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted - browser will enforce if needed
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);

  const postUrl = `${window.location.origin}/post/${post.id}`;
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

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike(post.id);
  };

  return (
    <>
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        {post.mediaUrl ? (
          <video
            ref={videoRef}
            src={post.mediaUrl}
            poster={post.thumbnailUrl || undefined}
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
            data-testid={`video-${post.id}`}
          />
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
          <Link href={`/profile/${post.author.id}`}>
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

        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
          <Link href={`/profile/${post.author.id}`}>
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
            onClick={handleLike}
            className="flex flex-col items-center gap-1 group"
            data-testid="button-like-video"
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              liked ? "bg-red-500/30 ring-2 ring-red-500/50" : "bg-white/10 group-hover:bg-white/20"
            )}>
              <Heart className={cn("h-6 w-6 transition-transform group-hover:scale-110", liked ? "fill-red-500 text-red-500" : "text-white")} />
            </div>
            <span className="text-white text-xs font-medium">{likeCount}</span>
            <span className="text-primary/80 text-[9px]">+2 AXM</span>
          </button>

          <button
            onClick={() => setShowCommentModal(true)}
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
              onClick={() => setShowTipModal(true)}
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
    </>
  );
}

export default function ForYou() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Sound state - attempts to play with sound, remembers after first interaction
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lumina-sound-enabled') === 'true';
    }
    return true;
  });
  const [userInteracted, setUserInteracted] = useState(false);

  const enableSound = useCallback(() => {
    setUserInteracted(true);
    setSoundEnabled(true);
    localStorage.setItem('lumina-sound-enabled', 'true');
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
      await apiRequest("POST", `/api/posts/${postId}/like`, {});
    },
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/users/${userId}/follow`, {});
    },
  });

  const goToVideo = useCallback((index: number) => {
    if (index < 0 || index >= posts.length) return;
    setCurrentIndex(index);
    
    if (index === posts.length - 2 && hasNextPage) {
      fetchNextPage();
    }
  }, [posts.length, hasNextPage, fetchNextPage]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "j") {
      goToVideo(currentIndex + 1);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      goToVideo(currentIndex - 1);
    }
  }, [currentIndex, goToVideo]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) < 30) return;
    
    if (e.deltaY > 0) {
      goToVideo(currentIndex + 1);
    } else {
      goToVideo(currentIndex - 1);
    }
  }, [currentIndex, goToVideo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

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
          <div className="h-full">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                )}
              >
                <VideoCard
                  post={post}
                  isActive={index === currentIndex}
                  onLike={(postId) => likeMutation.mutate(postId)}
                  onFollow={(userId) => followMutation.mutate(userId)}
                />
              </div>
            ))}
          </div>
        )}

        {posts.length > 1 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 border border-white/10"
              onClick={() => goToVideo(currentIndex - 1)}
              disabled={currentIndex === 0}
              data-testid="button-prev-video"
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 border border-white/10"
              onClick={() => goToVideo(currentIndex + 1)}
              disabled={currentIndex === posts.length - 1}
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
