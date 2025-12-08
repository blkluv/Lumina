import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Link2, Wallet, Calendar, Loader2, Grid, Play, Activity, Coins, Building2, Mail, Phone, Globe, MapPin, Clock, BadgeCheck, Shield, Sparkles, Award, TrendingUp, Zap, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostCard } from "@/components/post/PostCard";
import { TipModal } from "@/components/modals/TipModal";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { truncateAddress } from "@/lib/web3Config";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, PostWithAuthor } from "@shared/schema";

const profileThemes = {
  default: {
    gradient: "from-primary/30 via-primary/20 to-primary/10",
    radial1: "rgba(34,197,94,0.15)",
    radial2: "rgba(16,185,129,0.15)",
    accent: "hsl(160, 84%, 45%)",
    accentLight: "rgba(34,197,94,0.1)",
  },
  ocean: {
    gradient: "from-cyan-500/30 via-blue-500/20 to-indigo-500/30",
    radial1: "rgba(34,211,238,0.15)",
    radial2: "rgba(59,130,246,0.15)",
    accent: "hsl(190, 90%, 50%)",
    accentLight: "rgba(34,211,238,0.1)",
  },
  sunset: {
    gradient: "from-orange-500/30 via-rose-500/20 to-pink-500/30",
    radial1: "rgba(249,115,22,0.15)",
    radial2: "rgba(244,63,94,0.15)",
    accent: "hsl(25, 95%, 55%)",
    accentLight: "rgba(249,115,22,0.1)",
  },
  purple: {
    gradient: "from-violet-500/30 via-purple-500/20 to-fuchsia-500/30",
    radial1: "rgba(139,92,246,0.15)",
    radial2: "rgba(192,38,211,0.15)",
    accent: "hsl(270, 75%, 60%)",
    accentLight: "rgba(139,92,246,0.1)",
  },
  rose: {
    gradient: "from-rose-500/30 via-pink-500/20 to-red-500/30",
    radial1: "rgba(244,63,94,0.15)",
    radial2: "rgba(236,72,153,0.15)",
    accent: "hsl(350, 90%, 60%)",
    accentLight: "rgba(244,63,94,0.1)",
  },
  gold: {
    gradient: "from-amber-500/30 via-yellow-500/20 to-orange-500/30",
    radial1: "rgba(245,158,11,0.15)",
    radial2: "rgba(234,179,8,0.15)",
    accent: "hsl(40, 95%, 55%)",
    accentLight: "rgba(245,158,11,0.1)",
  },
};

const accentColors: Record<string, string> = {
  emerald: "hsl(160, 84%, 45%)",
  blue: "hsl(210, 100%, 50%)",
  purple: "hsl(270, 75%, 60%)",
  rose: "hsl(350, 90%, 60%)",
  orange: "hsl(25, 95%, 55%)",
  cyan: "hsl(190, 90%, 50%)",
  amber: "hsl(40, 95%, 55%)",
  indigo: "hsl(240, 75%, 60%)",
};

function getAccentColor(accentValue: string | null | undefined, fallback: string): string {
  if (!accentValue) return fallback;
  if (accentValue.startsWith("#") || accentValue.startsWith("hsl") || accentValue.startsWith("rgb")) {
    return accentValue;
  }
  return accentColors[accentValue] || fallback;
}

interface ProfileData {
  user: User;
  posts: PostWithAuthor[];
  videos: PostWithAuthor[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export default function Profile() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const { bindWallet, isConnected, address } = useWallet();
  const [showTipModal, setShowTipModal] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const username = params.username;
  // isOwnProfile is determined after profile data loads (comparing currentUser.username)

  const { data: profile, isLoading, isError } = useQuery<ProfileData>({
    queryKey: ["/api/users", username],
    enabled: !!username,
  });

  const isOwnProfile = currentUser?.username === username;
  const profileUserId = profile?.user?.id;

  // Update OG meta tags for social sharing
  useEffect(() => {
    if (profile?.user) {
      const { user: profileUser } = profile;
      const displayName = profileUser.displayName || profileUser.username;
      const description = profileUser.bio || `Check out ${displayName}'s profile on Lumina`;
      const profileUrl = `https://joinlumina.io/profile/${profileUser.username}`;
      
      // Build absolute avatar URL
      let avatarUrl = profileUser.avatarUrl;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        avatarUrl = `https://joinlumina.io${avatarUrl}`;
      }

      // Update or create meta tags
      const updateMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      const updateMetaName = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      // Open Graph tags
      updateMetaTag('og:title', `${displayName} | Lumina`);
      updateMetaTag('og:description', description);
      updateMetaTag('og:url', profileUrl);
      updateMetaTag('og:type', 'profile');
      if (avatarUrl) {
        updateMetaTag('og:image', avatarUrl);
        updateMetaTag('og:image:width', '400');
        updateMetaTag('og:image:height', '400');
      }

      // Twitter Card tags
      updateMetaName('twitter:card', 'summary');
      updateMetaName('twitter:title', `${displayName} | Lumina`);
      updateMetaName('twitter:description', description);
      if (avatarUrl) {
        updateMetaName('twitter:image', avatarUrl);
      }

      // Update page title
      document.title = `${displayName} | Lumina`;

      // Cleanup on unmount
      return () => {
        document.title = 'Lumina';
      };
    }
  }, [profile]);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profile?.isFollowing) {
        await apiRequest("DELETE", `/api/users/${profileUserId}/follow`, {});
      } else {
        await apiRequest("POST", `/api/users/${profileUserId}/follow`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
    },
  });

  const handleBindWallet = async () => {
    try {
      await bindWallet();
    } catch (error) {
      console.error("Failed to bind wallet:", error);
    }
  };

  if (isLoading) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError || !profile) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <h2 className="text-xl font-semibold mb-2">User not found</h2>
          <p className="text-muted-foreground">This profile doesn't exist or failed to load.</p>
        </div>
      </MainLayout>
    );
  }

  const { user: profileUser, posts, videos, followerCount, followingCount, isFollowing } = profile;
  
  const themeKey = (profileUser.profileTheme as keyof typeof profileThemes) || "default";
  const currentTheme = profileThemes[themeKey] || profileThemes.default;
  const userAccentColor = getAccentColor(profileUser.profileAccentColor, currentTheme.accent);

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div
            className="h-48 sm:h-64 relative overflow-hidden"
            style={profileUser.bannerUrl ? { backgroundImage: `url(${profileUser.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          >
            {!profileUser.bannerUrl && (
              <>
                <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradient}`} />
                <div 
                  className="absolute inset-0" 
                  style={{ background: `radial-gradient(circle at 30% 40%, ${currentTheme.radial1}, transparent 50%)` }}
                />
                <div 
                  className="absolute inset-0" 
                  style={{ background: `radial-gradient(circle at 70% 60%, ${currentTheme.radial2}, transparent 50%)` }}
                />
                <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMmQzZWUiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmg0djJoMnY0aC0ydjJoLTR2LTJ6bTAtOGgtMnYtNGgydi0yaDR2MmgydjRoLTJ2Mmgtv2MtJnptLTIwIDhoLTJ2LTRoMnYtMmg0djJoMnY0aC0ydjJoLTR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
              </>
            )}
          </div>
          
          <div className="px-4 sm:px-6">
            <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar 
                className="h-28 w-28 sm:h-36 sm:w-36 border-4 shadow-xl"
                style={{ borderColor: userAccentColor }}
              >
                <AvatarImage src={profileUser.avatarUrl || undefined} alt={profileUser.displayName || profileUser.username} />
                <AvatarFallback 
                  className="text-4xl text-white"
                  style={{ backgroundColor: userAccentColor }}
                >
                  {(profileUser.displayName || profileUser.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-profile-name">
                      {profileUser.displayName || profileUser.username}
                    </h1>
                    <p className="text-muted-foreground" data-testid="text-profile-username">
                      @{profileUser.username}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isOwnProfile ? (
                      <>
                        {isConnected && !profileUser.walletAddress && (
                          <Button variant="outline" className="gap-2" onClick={handleBindWallet} data-testid="button-bind-wallet">
                            <Wallet className="h-4 w-4" />
                            Bind Wallet
                          </Button>
                        )}
                        <Button variant="outline" className="gap-2" onClick={() => navigate("/settings")} data-testid="button-edit-profile">
                          <Settings className="h-4 w-4" />
                          Edit Profile
                        </Button>
                        {currentUser?.isAdmin && (
                          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin")} data-testid="button-admin">
                            <Shield className="h-4 w-4" />
                            Admin
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          variant={isFollowing ? "outline" : "default"}
                          className={isFollowing ? "" : "shadow-lg shadow-primary/25"}
                          onClick={() => followMutation.mutate()}
                          disabled={followMutation.isPending}
                          data-testid="button-follow"
                        >
                          {followMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isFollowing ? (
                            "Following"
                          ) : (
                            "Follow"
                          )}
                        </Button>
                        {profileUser.walletAddress && (
                          <Button
                            variant="outline"
                            className="gap-2 text-primary"
                            onClick={() => setShowTipModal(true)}
                            data-testid="button-tip-profile"
                          >
                            <Coins className="h-4 w-4" />
                            Tip
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {profileUser.bio && (
              <p className="mt-4 text-sm sm:text-base max-w-2xl" data-testid="text-profile-bio">
                {profileUser.bio}
              </p>
            )}

            {/* Profile Details (location, website, pronouns) */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              {profileUser.pronouns && (
                <Badge variant="secondary" className="text-xs" data-testid="badge-pronouns">
                  {profileUser.pronouns}
                </Badge>
              )}
              {profileUser.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="text-location">{profileUser.location}</span>
                </div>
              )}
              {profileUser.website && (
                <a 
                  href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  data-testid="link-website"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{profileUser.website.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
            </div>

            {profileUser.isBusinessAccount && (
              <Card className="mt-4 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">{profileUser.businessName || "Business Account"}</span>
                    {profileUser.businessCategory && (
                      <Badge variant="secondary" className="text-xs">
                        {profileUser.businessCategory}
                      </Badge>
                    )}
                    {profileUser.verifiedAt && (
                      <Badge className="text-xs gap-1 bg-primary/20 text-primary">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    {profileUser.businessEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${profileUser.businessEmail}`} className="hover:text-primary hover:underline" data-testid="link-business-email">
                          {profileUser.businessEmail}
                        </a>
                      </div>
                    )}
                    {profileUser.businessPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${profileUser.businessPhone}`} className="hover:text-primary hover:underline" data-testid="link-business-phone">
                          {profileUser.businessPhone}
                        </a>
                      </div>
                    )}
                    {profileUser.businessWebsite && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a href={profileUser.businessWebsite} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline" data-testid="link-business-website">
                          {profileUser.businessWebsite.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                    {profileUser.businessAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span data-testid="text-business-address">{String(profileUser.businessAddress)}</span>
                      </div>
                    )}
                    {profileUser.businessHours && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5" />
                        <span className="whitespace-pre-line" data-testid="text-business-hours">{String(profileUser.businessHours)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              {profileUser.walletAddress && (
                <div className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="font-mono">{truncateAddress(profileUser.walletAddress)}</span>
                  {profileUser.walletVerified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(profileUser.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <button className="text-center hover:underline" data-testid="button-followers">
                <span className="font-semibold">{followerCount.toLocaleString()}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </button>
              <button className="text-center hover:underline" data-testid="button-following">
                <span className="font-semibold">{followingCount.toLocaleString()}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 px-4 sm:px-6">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger
              value="posts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-posts"
            >
              <Grid className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-videos"
            >
              <Play className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              data-testid="tab-activity"
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6 space-y-4 pb-8">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-6 pb-8">
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No videos yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group cursor-pointer"
                    onClick={() => navigate(`/post/${video.id}`)}
                    data-testid={`video-grid-${video.id}`}
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={video.mediaUrl || undefined}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                      <Play className="h-3 w-3" />
                      {video.viewCount?.toLocaleString() || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-6 pb-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-2">
                    <Coins className="h-5 w-5 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold text-cyan-400">0</p>
                  <p className="text-xs text-muted-foreground">AXM Earned</p>
                </CardContent>
              </Card>
              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-400">0</p>
                  <p className="text-xs text-muted-foreground">NFTs Minted</p>
                </CardContent>
              </Card>
              <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-2">
                    <Award className="h-5 w-5 text-pink-400" />
                  </div>
                  <p className="text-2xl font-bold text-pink-400">0</p>
                  <p className="text-xs text-muted-foreground">Achievements</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Blockchain Activity
                </h3>
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No blockchain activity yet</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet and start engaging to earn AXM tokens
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Earn AXM Tokens</p>
                    <p className="text-xs text-muted-foreground">
                      Post content, get likes, and engage with the community to earn AXM token rewards. 
                      All transactions are recorded on the Arbitrum One blockchain.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {profileUser && (
        <TipModal
          open={showTipModal}
          onOpenChange={setShowTipModal}
          recipient={profileUser}
        />
      )}
    </MainLayout>
  );
}
