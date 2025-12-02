import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Unlock, Coins, TrendingUp, Gift, Clock, Percent, Award, Sparkles, HelpCircle, Shield, Zap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

interface StakingPosition {
  id: string;
  userId: string;
  amountAxm: string;
  lockDuration: number;
  rewardMultiplier: number;
  status: string;
  stakedAt: string;
  withdrawableAt: string;
  totalRewardsEarned: string;
}

interface StakingData {
  positions: StakingPosition[];
  totalStaked: string;
}

interface ReputationBadge {
  id: string;
  userId: string;
  badgeType: string;
  name: string;
  description: string;
  imageUrl: string | null;
  earnedAt: string;
}

const LOCK_DURATIONS = [
  { days: 30, label: "30 Days", multiplier: 100, description: "Base rewards" },
  { days: 90, label: "90 Days", multiplier: 125, description: "25% bonus" },
  { days: 180, label: "180 Days", multiplier: 150, description: "50% bonus" },
  { days: 365, label: "1 Year", multiplier: 200, description: "100% bonus" },
];

export default function Staking() {
  const { user } = useAuth();
  const { isConnected, axmBalance } = useWallet();
  const { toast } = useToast();
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [stakeForm, setStakeForm] = useState({
    amountAxm: "",
    lockDuration: 30,
  });

  const { data: stakingData, isLoading: stakingLoading } = useQuery<StakingData>({
    queryKey: ["/api/staking/positions"],
    enabled: !!user,
  });

  const { data: badges, isLoading: badgesLoading } = useQuery<ReputationBadge[]>({
    queryKey: ["/api/badges"],
    enabled: !!user,
  });

  const stakeMutation = useMutation({
    mutationFn: async (data: { amountAxm: string; lockDuration: number }) => {
      const res = await apiRequest("POST", "/api/staking/stake", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Staked!", description: "Your AXM tokens have been staked successfully" });
      setStakeDialogOpen(false);
      setStakeForm({ amountAxm: "", lockDuration: 30 });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to stake", variant: "destructive" });
    },
  });

  const unstakeMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const res = await apiRequest("POST", `/api/staking/${positionId}/unstake`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Unstaking Initiated", description: "Your tokens will be available soon" });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/positions"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Cannot unstake yet", variant: "destructive" });
    },
  });

  const claimRewardsMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const res = await apiRequest("POST", `/api/staking/${positionId}/claim-rewards`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rewards Claimed!", description: "Your rewards have been added to your wallet" });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/positions"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to claim rewards", variant: "destructive" });
    },
  });

  const handleStake = () => {
    if (!stakeForm.amountAxm || parseFloat(stakeForm.amountAxm) <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    stakeMutation.mutate(stakeForm);
  };

  const totalStaked = parseFloat(stakingData?.totalStaked || "0");
  const positions = stakingData?.positions || [];
  const activePositions = positions.filter(p => p.status === "active");

  const selectedDuration = LOCK_DURATIONS.find(d => d.days === stakeForm.lockDuration);

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case "early_adopter": return "star";
      case "verified_creator": return "verified";
      case "top_contributor": return "trophy";
      case "whale": return "fish";
      case "diamond_hands": return "gem";
      default: return "award";
    }
  };

  const renderPositionCard = (position: StakingPosition) => {
    const canUnstake = new Date(position.withdrawableAt) <= new Date();
    const stakedAmount = parseFloat(position.amountAxm);
    const earnedRewards = parseFloat(position.totalRewardsEarned || "0");

    return (
      <Card key={position.id} className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg" data-testid={`position-amount-${position.id}`}>
                  {stakedAmount.toFixed(2)} AXM
                </CardTitle>
                <CardDescription>{position.lockDuration} Day Lock</CardDescription>
              </div>
            </div>
            <Badge variant={position.status === "active" ? "default" : "secondary"}>
              {position.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Multiplier</p>
              <p className="font-semibold flex items-center gap-1">
                <Percent className="h-4 w-4 text-primary" />
                {position.rewardMultiplier}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rewards Earned</p>
              <p className="font-semibold flex items-center gap-1 text-green-500">
                <TrendingUp className="h-4 w-4" />
                {earnedRewards.toFixed(4)} AXM
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                <Clock className="inline h-4 w-4 mr-1" />
                Unlocks
              </span>
              <span>{canUnstake ? "Now" : formatDistanceToNow(new Date(position.withdrawableAt), { addSuffix: true })}</span>
            </div>
            <Progress 
              value={canUnstake ? 100 : Math.min(100, 
                ((Date.now() - new Date(position.stakedAt).getTime()) / 
                (new Date(position.withdrawableAt).getTime() - new Date(position.stakedAt).getTime())) * 100
              )} 
            />
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => claimRewardsMutation.mutate(position.id)}
            disabled={claimRewardsMutation.isPending}
            data-testid={`button-claim-${position.id}`}
          >
            <Gift className="mr-2 h-4 w-4" />
            Claim Rewards
          </Button>
          <Button
            variant={canUnstake ? "default" : "secondary"}
            className="flex-1"
            onClick={() => unstakeMutation.mutate(position.id)}
            disabled={unstakeMutation.isPending || !canUnstake}
            data-testid={`button-unstake-${position.id}`}
          >
            <Unlock className="mr-2 h-4 w-4" />
            Unstake
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 p-6 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Token Staking
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Stake AXM to earn passive rewards on Arbitrum One
                  </p>
                </div>
              </div>
              {user && (
                <Dialog open={stakeDialogOpen} onOpenChange={setStakeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-stake" className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                      <Coins className="mr-2 h-4 w-4" />
                      Stake AXM
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Stake AXM Tokens</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium">Amount to Stake</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Coins className="h-4 w-4 text-primary" />
                          <Input
                            type="number"
                            step="0.01"
                            value={stakeForm.amountAxm}
                            onChange={(e) => setStakeForm({ ...stakeForm, amountAxm: e.target.value })}
                            placeholder="0.00"
                            data-testid="input-stake-amount"
                          />
                          <span className="text-sm text-muted-foreground">AXM</span>
                        </div>
                        {isConnected && (
                          <p className="text-sm text-muted-foreground mt-1">Balance: {axmBalance} AXM</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Lock Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                          {LOCK_DURATIONS.map((duration) => (
                            <Button
                              key={duration.days}
                              type="button"
                              variant={stakeForm.lockDuration === duration.days ? "default" : "outline"}
                              className="flex flex-col h-auto py-3"
                              onClick={() => setStakeForm({ ...stakeForm, lockDuration: duration.days })}
                              data-testid={`button-duration-${duration.days}`}
                            >
                              <span className="font-semibold">{duration.label}</span>
                              <span className="text-xs opacity-80">{duration.description}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                      {selectedDuration && stakeForm.amountAxm && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium mb-2">Estimated Returns</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">APY</span>
                            <span className="font-mono">{(selectedDuration.multiplier * 0.0365).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Multiplier</span>
                            <span className="font-mono">{selectedDuration.multiplier}%</span>
                          </div>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={handleStake}
                        disabled={stakeMutation.isPending}
                        data-testid="button-confirm-stake"
                      >
                        {stakeMutation.isPending ? "Staking..." : "Stake Tokens"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Staked</span>
                </div>
                <p className="text-sm font-medium mt-1" data-testid="text-total-staked-header">
                  {totalStaked.toFixed(2)} AXM
                </p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <p className="text-sm font-medium mt-1">{activePositions.length} Positions</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground">Badges</span>
                </div>
                <p className="text-sm font-medium mt-1">{badges?.length || 0} Earned</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Network</span>
                </div>
                <p className="text-sm font-medium mt-1">Arbitrum L2</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="positions">
          <TabsList className="mb-6">
            <TabsTrigger value="positions" data-testid="tab-positions">
              <Lock className="mr-2 h-4 w-4" />
              Staking Positions
            </TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">
              <Award className="mr-2 h-4 w-4" />
              Reputation Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            {!user ? (
              <Card className="p-12 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Sign In Required</h3>
                <p className="text-muted-foreground mt-2">Sign in to view your staking positions</p>
              </Card>
            ) : stakingLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </Card>
                ))}
              </div>
            ) : !positions.length ? (
              <Card className="p-12 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Staking Positions</h3>
                <p className="text-muted-foreground mt-2">Start staking to earn rewards and unlock benefits</p>
                <Button className="mt-4" onClick={() => setStakeDialogOpen(true)}>
                  <Coins className="mr-2 h-4 w-4" />
                  Stake Your First AXM
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positions.map(renderPositionCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="badges">
            {!user ? (
              <Card className="p-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Sign In Required</h3>
                <p className="text-muted-foreground mt-2">Sign in to view your badges</p>
              </Card>
            ) : badgesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-16 w-16 mx-auto rounded-full mb-3" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </Card>
                ))}
              </div>
            ) : !badges?.length ? (
              <Card className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Badges Yet</h3>
                <p className="text-muted-foreground mt-2">Complete achievements to earn reputation badges</p>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <Award className="h-8 w-8 mx-auto text-yellow-500 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Early Adopter</p>
                    <p className="text-xs text-muted-foreground">First 1000 users</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <Award className="h-8 w-8 mx-auto text-blue-500 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Verified Creator</p>
                    <p className="text-xs text-muted-foreground">Get verified</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <Award className="h-8 w-8 mx-auto text-purple-500 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Whale</p>
                    <p className="text-xs text-muted-foreground">Stake 10000+ AXM</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <Award className="h-8 w-8 mx-auto text-cyan-500 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Diamond Hands</p>
                    <p className="text-xs text-muted-foreground">180+ day stake</p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <Card key={badge.id} className="p-4 text-center hover-elevate">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold" data-testid={`badge-name-${badge.id}`}>{badge.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Earned {format(new Date(badge.earnedAt), "MMM d, yyyy")}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              Staking Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-staking">
                <AccordionTrigger className="text-sm">What is AXM staking?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Staking locks your LUM tokens in a smart contract on Arbitrum One to earn passive rewards. 
                  The longer you stake, the higher your reward multiplier. Staked tokens also grant voting 
                  power in the Lumina DAO governance system.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="lock-durations">
                <AccordionTrigger className="text-sm">What are the lock duration options?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p><strong>30 Days:</strong> Base rewards with 100% multiplier</p>
                    <p><strong>90 Days:</strong> 25% bonus with 125% multiplier</p>
                    <p><strong>180 Days:</strong> 50% bonus with 150% multiplier</p>
                    <p><strong>1 Year:</strong> Maximum 100% bonus with 200% multiplier</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="claiming-rewards">
                <AccordionTrigger className="text-sm">How do I claim my rewards?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Rewards accumulate automatically and can be claimed at any time without affecting your stake. 
                  Click "Claim Rewards" on any staking position to add earned AXM to your wallet. Gas fees on 
                  Arbitrum L2 are minimal.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="unstaking">
                <AccordionTrigger className="text-sm">When can I unstake?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  You can unstake once your lock duration has completed. The progress bar shows how close 
                  you are to being able to unstake. Early unstaking is not permitted to ensure protocol stability 
                  and fair reward distribution.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="reputation-badges">
                <AccordionTrigger className="text-sm">What are reputation badges?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Reputation badges are on-chain achievements stored as soulbound tokens. They cannot be 
                  transferred and represent your contributions to the Lumina community. Badges include Early 
                  Adopter, Verified Creator, Whale (10000+ LUM staked), and Diamond Hands (180+ day stake).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Compound Your Earnings</p>
                <p className="text-xs text-muted-foreground">
                  Re-stake your earned rewards to maximize your APY through compound interest. Longer lock 
                  durations combined with regular compounding can significantly increase your total returns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
