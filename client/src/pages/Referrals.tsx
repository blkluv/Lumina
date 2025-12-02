import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Users, Gift, Coins, Copy, Check, Share2, 
  TrendingUp, Clock, ExternalLink, HelpCircle, Shield, Zap,
  Trophy, Star, Award, Crown, Gem, Info
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ReferralEvent, User } from "@shared/schema";

interface ReferralStats {
  totalReferrals: number;
  dailyReferrals: number;
  monthlyReferrals: number;
  lifetimeReferrals: number;
  verifiedReferrals: number;
  pendingReferrals: number;
  rejectedReferrals: number;
  totalEarnings: string;
  pendingEarnings: string;
}

interface ReferralTier {
  tierLevel: number;
  name: string;
  minReferrals: number;
  bonusMultiplier: string;
  maxDailyReferrals: number;
  maxMonthlyReferrals: number;
  badgeIcon?: string;
}

interface ReferralData {
  referrals: (ReferralEvent & { referred?: User })[];
  stats: ReferralStats;
  currentTier?: ReferralTier;
  allTiers?: ReferralTier[];
  caps?: {
    daily: number;
    monthly: number;
    lifetime: number;
  };
  disclosure?: string;
}

interface LeaderboardEntry {
  referrerId: string;
  totalReferrals: number;
  verifiedReferrals: number;
  totalEarnings: string;
  user: { username: string; displayName: string | null; avatarUrl: string | null };
  tier: string;
  tierLevel: number;
}

const getTierIcon = (tierLevel: number) => {
  switch (tierLevel) {
    case 1: return <Star className="h-4 w-4" />;
    case 2: return <Award className="h-4 w-4" />;
    case 3: return <Trophy className="h-4 w-4" />;
    case 4: return <Crown className="h-4 w-4" />;
    case 5: return <Gem className="h-4 w-4" />;
    default: return <Star className="h-4 w-4" />;
  }
};

const getTierColor = (tierLevel: number) => {
  switch (tierLevel) {
    case 1: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    case 2: return "bg-amber-700/20 text-amber-500 border-amber-700/30";
    case 3: return "bg-slate-400/20 text-slate-300 border-slate-400/30";
    case 4: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case 5: return "bg-cyan-400/20 text-cyan-300 border-cyan-400/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

function StatCard({ title, value, icon: Icon, subtext }: { 
  title: string; 
  value: string | number; 
  icon: any;
  subtext?: string;
}) {
  return (
    <Card data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

export default function Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: codeData, isLoading: codeLoading } = useQuery<{ code: string }>({
    queryKey: ["/api/referrals/code"],
  });

  const { data: referralData, isLoading: referralsLoading } = useQuery<ReferralData>({
    queryKey: ["/api/referrals"],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/referrals/leaderboard"],
  });

  const { data: tiersData } = useQuery<{ tiers: ReferralTier[]; disclosure: string }>({
    queryKey: ["/api/referrals/tiers"],
  });

  const referralLink = codeData?.code 
    ? `${window.location.origin}/signup?ref=${codeData.code}` 
    : null;
  
  const currentTier = referralData?.currentTier;
  const allTiers = tiersData?.tiers || referralData?.allTiers || [];
  const caps = referralData?.caps;
  const disclosure = referralData?.disclosure || tiersData?.disclosure;
  
  const getNextTier = () => {
    if (!currentTier || !allTiers.length) return null;
    const nextTierIndex = allTiers.findIndex(t => t.tierLevel === currentTier.tierLevel) + 1;
    return nextTierIndex < allTiers.length ? allTiers[nextTierIndex] : null;
  };
  
  const nextTier = getNextTier();
  const progressToNextTier = nextTier && referralData?.stats
    ? Math.min(100, ((referralData.stats.verifiedReferrals - currentTier!.minReferrals) / (nextTier.minReferrals - currentTier!.minReferrals)) * 100)
    : 100;

  const copyToClipboard = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast({ title: "Link copied to clipboard!" });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast({ title: "Failed to copy link", variant: "destructive" });
      }
    }
  };

  const shareLink = async () => {
    if (referralLink && navigator.share) {
      try {
        await navigator.share({
          title: "Join Lumina",
          text: "Join me on Lumina and earn LUM rewards!",
          url: referralLink,
        });
      } catch {
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 p-6 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" data-testid="referrals-title">
                  Referral Program
                </h1>
                <p className="text-sm text-muted-foreground">
                  Invite friends & earn AXM rewards on Arbitrum One
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Referrals</span>
                </div>
                <p className="text-sm font-medium mt-1">{referralData?.stats.totalReferrals || 0} Friends</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Earned</span>
                </div>
                <p className="text-sm font-medium mt-1">{parseFloat(referralData?.stats.totalEarnings || "0").toFixed(2)} AXM</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-sm font-medium mt-1">{parseFloat(referralData?.stats.pendingEarnings || "0").toFixed(2)} AXM</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  {currentTier && getTierIcon(currentTier.tierLevel)}
                  <span className="text-xs text-muted-foreground">Tier</span>
                </div>
                <p className="text-sm font-medium mt-1">{currentTier?.name || "Starter"}</p>
              </div>
            </div>
          </div>
        </div>

        {disclosure && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {disclosure}
            </AlertDescription>
          </Alert>
        )}

        {currentTier && nextTier && (
          <Card className="border-primary/20" data-testid="card-tier-progress">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progress to {nextTier.name}
                </CardTitle>
                <Badge className={`${getTierColor(currentTier.tierLevel)} gap-1`}>
                  {getTierIcon(currentTier.tierLevel)}
                  {currentTier.name}
                </Badge>
              </div>
              <CardDescription>
                {Math.max(0, nextTier.minReferrals - (referralData?.stats?.verifiedReferrals || 0))} more verified referrals to unlock {parseFloat(nextTier.bonusMultiplier).toFixed(1)}x bonus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progressToNextTier} className="h-3" />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>{referralData?.stats?.verifiedReferrals || 0} verified</span>
                <span>{nextTier.minReferrals} needed</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {referralsLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Total Referrals"
                value={referralData?.stats.totalReferrals || 0}
                icon={Users}
                subtext="Friends who joined"
              />
              <StatCard
                title="Total Earnings"
                value={`${parseFloat(referralData?.stats.totalEarnings || "0").toFixed(2)} AXM`}
                icon={Coins}
                subtext="Rewards earned"
              />
              <StatCard
                title="Pending Earnings"
                value={`${parseFloat(referralData?.stats.pendingEarnings || "0").toFixed(2)} AXM`}
                icon={Clock}
                subtext="Awaiting payout"
              />
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>Share this link to earn 10 AXM for each friend who joins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {codeLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex gap-2">
                <Input
                  value={referralLink || ""}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="referral-link"
                />
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  data-testid="copy-link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button onClick={shareLink} data-testid="share-link">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Code: {codeData?.code || "..."}</Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="how-it-works" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
            <TabsTrigger value="tiers">Reward Tiers</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="how-it-works">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium">1. Share Your Link</h4>
                    <p className="text-sm text-muted-foreground">
                      Send your unique referral link to friends
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium">2. Friends Sign Up</h4>
                    <p className="text-sm text-muted-foreground">
                      When they create an account using your link
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Coins className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium">3. Earn Rewards</h4>
                    <p className="text-sm text-muted-foreground">
                      Get up to {currentTier ? parseFloat(currentTier.bonusMultiplier).toFixed(1) : "1.0"}x AXM per referral
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Reward Tiers
                </CardTitle>
                <CardDescription>
                  Earn more with higher tiers based on verified referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allTiers.map((tier) => (
                    <div 
                      key={tier.tierLevel}
                      className={`p-4 rounded-lg border ${currentTier?.tierLevel === tier.tierLevel ? 'border-primary bg-primary/5' : 'border-border'}`}
                      data-testid={`tier-card-${tier.tierLevel}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`${getTierColor(tier.tierLevel)} gap-1`}>
                          {getTierIcon(tier.tierLevel)}
                          {tier.name}
                        </Badge>
                        {currentTier?.tierLevel === tier.tierLevel && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Referrals</span>
                          <span className="font-medium">{tier.minReferrals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bonus</span>
                          <span className="font-medium text-primary">{parseFloat(tier.bonusMultiplier).toFixed(1)}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily Limit</span>
                          <span className="font-medium">{tier.maxDailyReferrals}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Referrers
                </CardTitle>
                <CardDescription>Users with the most verified referrals</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : leaderboard?.length ? (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div 
                        key={entry.referrerId}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                        data-testid={`leaderboard-entry-${index}`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                          index === 1 ? 'bg-slate-400/20 text-slate-400' :
                          index === 2 ? 'bg-amber-700/20 text-amber-600' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.user?.avatarUrl || undefined} />
                          <AvatarFallback>
                            {entry.user?.username?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {entry.user?.displayName || entry.user?.username || "Unknown"}
                            </span>
                            <Badge className={`${getTierColor(entry.tierLevel)} text-xs`}>
                              {entry.tier}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {entry.verifiedReferrals} verified referrals
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {parseFloat(entry.totalEarnings).toLocaleString()} AXM
                          </div>
                          <span className="text-xs text-muted-foreground">earned</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No referrals yet. Be the first on the leaderboard!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Usage Limits
                </CardTitle>
                <CardDescription>
                  Your current referral limits based on your tier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Daily Referrals</span>
                    <span>{referralData?.stats?.dailyReferrals || 0} / {caps?.daily || 5}</span>
                  </div>
                  <Progress value={((referralData?.stats?.dailyReferrals || 0) / (caps?.daily || 5)) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Monthly Referrals</span>
                    <span>{referralData?.stats?.monthlyReferrals || 0} / {caps?.monthly || 50}</span>
                  </div>
                  <Progress value={((referralData?.stats?.monthlyReferrals || 0) / (caps?.monthly || 50)) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Lifetime Referrals</span>
                    <span>{referralData?.stats?.lifetimeReferrals || 0} / {caps?.lifetime || 500}</span>
                  </div>
                  <Progress value={((referralData?.stats?.lifetimeReferrals || 0) / (caps?.lifetime || 500)) * 100} />
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Limits increase as you advance through tiers. Higher tiers unlock more daily and monthly referral slots.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>Friends who joined using your link</CardDescription>
          </CardHeader>
          <CardContent>
            {referralsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : referralData?.referrals && referralData.referrals.length > 0 ? (
              <div className="space-y-4">
                {referralData.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`referral-${referral.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={(referral as any).referred?.avatarUrl || undefined} />
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {(referral as any).referred?.displayName || "New User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(referral.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={referral.isPaid ? "default" : "secondary"}>
                        {referral.isPaid ? "Paid" : "Pending"}
                      </Badge>
                      <span className="font-medium text-primary">+{referral.bonusAxm} AXM</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No referrals yet. Share your link to get started!
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              Referral FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how-rewards">
                <AccordionTrigger className="text-sm">How do referral rewards work?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  When someone signs up using your referral link, you earn 10 AXM tokens once they 
                  verify their account. Rewards are distributed on the Arbitrum One blockchain, ensuring 
                  transparent and secure payments.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="claim-rewards">
                <AccordionTrigger className="text-sm">When can I claim my rewards?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Referral rewards are automatically added to your wallet balance once the referred user 
                  completes account verification. Pending rewards typically process within 24-48 hours.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="bonus-tiers">
                <AccordionTrigger className="text-sm">Are there bonus tiers?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Yes! Top referrers earn bonus rewards:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>10+ referrals: 15 AXM per new referral</li>
                    <li>50+ referrals: 20 AXM per new referral</li>
                    <li>100+ referrals: VIP badge + 25 AXM per new referral</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="on-chain">
                <AccordionTrigger className="text-sm">Are rewards stored on-chain?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  All referral rewards are recorded on the Arbitrum One blockchain for transparency. 
                  You can verify your rewards on any Arbitrum block explorer using your wallet address.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 via-purple-500/10 to-cyan-500/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Share & Earn More</p>
                <p className="text-xs text-muted-foreground">
                  The more friends you invite, the higher your reward tier becomes. Top referrers also 
                  appear on the community leaderboard and earn exclusive badges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
