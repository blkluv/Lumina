import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Target,
  Flame,
  Star,
  Gift,
  Check,
  Lock,
  Calendar,
  TrendingUp,
  Coins,
  Zap,
  Award,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Video,
  Loader2,
  HelpCircle,
  Shield,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface Quest {
  id: string;
  type: string;
  title: string;
  description: string;
  targetCount: number;
  pointsReward: number;
  xpReward: number;
  isRecurring: boolean;
  isActive: boolean;
}

interface UserQuest extends Quest {
  progress: number;
  completed: boolean;
  completedAt: string | null;
  resetAt: string | null;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  pointsReward: number;
  xpReward: number;
  requirement: any;
}

interface UserAchievement extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

interface GamificationStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  estimatedAxm: string;
}

const questTypeIcons: Record<string, typeof Target> = {
  create_post: MessageCircle,
  create_video: Video,
  like_posts: Heart,
  comment_posts: MessageCircle,
  share_posts: Share2,
  follow_users: Users,
  daily_login: Calendar,
  earn_tips: Coins,
};

const achievementCategoryIcons: Record<string, typeof Trophy> = {
  engagement: Heart,
  social: Users,
  content: Video,
  rewards: Coins,
  streak: Flame,
};

const tierColors: Record<string, string> = {
  bronze: "bg-orange-600/20 text-orange-400 border-orange-500/30",
  silver: "bg-gray-400/20 text-gray-300 border-gray-400/30",
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  platinum: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
  diamond: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function QuestCard({ quest }: { quest: UserQuest }) {
  const Icon = questTypeIcons[quest.type] || Target;
  const progressPercent = Math.min((quest.progress / quest.targetCount) * 100, 100);
  
  return (
    <Card className={cn(
      "transition-all",
      quest.completed && "opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-xl",
            quest.completed ? "bg-primary/20" : "bg-muted"
          )}>
            {quest.completed ? (
              <Check className="h-5 w-5 text-primary" />
            ) : (
              <Icon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate" data-testid={`text-quest-title-${quest.id}`}>
                {quest.title}
              </h4>
              {quest.isRecurring && (
                <Badge variant="outline" className="text-xs">Daily</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {quest.description}
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium" data-testid={`text-quest-progress-${quest.id}`}>
                  {quest.progress} / {quest.targetCount}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-medium">+{quest.pointsReward}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">+{quest.xpReward} XP</span>
              </div>
            </div>
          </div>
          
          {quest.completed && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Check className="h-3 w-3" />
              Done
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementCard({ achievement }: { achievement: UserAchievement }) {
  const Icon = achievementCategoryIcons[achievement.category] || Trophy;
  
  return (
    <Card className={cn(
      "transition-all relative overflow-hidden",
      !achievement.unlocked && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-xl relative",
            achievement.unlocked ? "bg-primary/20" : "bg-muted"
          )}>
            {achievement.unlocked ? (
              <Trophy className="h-6 w-6 text-primary" />
            ) : (
              <>
                <Icon className="h-6 w-6 text-muted-foreground" />
                <Lock className="h-3 w-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
              </>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-semibold" data-testid={`text-achievement-name-${achievement.id}`}>
                {achievement.name}
              </h4>
              <Badge 
                variant="outline" 
                className={cn("text-xs capitalize", tierColors[achievement.tier])}
              >
                {achievement.tier}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {achievement.description}
            </p>
            
            {achievement.unlocked ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary" />
                Unlocked {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : ""}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-medium">+{achievement.pointsReward}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">+{achievement.xpReward} XP</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Rewards() {
  const { user } = useAuth();
  const { isConnected, axmBalance } = useWallet();
  const { toast } = useToast();
  
  const { data: gamification, isLoading: gamificationLoading } = useQuery<GamificationStats>({
    queryKey: ["/api/user/gamification"],
    enabled: !!user,
  });
  
  const { data: quests = [], isLoading: questsLoading } = useQuery<UserQuest[]>({
    queryKey: ["/api/quests"],
    enabled: !!user,
  });
  
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<UserAchievement[]>({
    queryKey: ["/api/achievements"],
    enabled: !!user,
  });
  
  const { data: rewards } = useQuery<{ snapshot: any; events: any[] }>({
    queryKey: ["/api/rewards"],
    enabled: !!user,
  });

  const dailyLoginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/daily-login");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/gamification"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      if (data.pointsEarned) {
        toast({
          title: "Daily Login Bonus!",
          description: `You earned ${data.pointsEarned} points! Streak: ${data.currentStreak} days`,
        });
      }
    },
  });

  const claimRewardsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rewards/claim");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/gamification"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({
        title: "Rewards Claimed!",
        description: `Successfully claimed ${data.pointsClaimed} points`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to claim rewards",
        variant: "destructive",
      });
    },
  });

  const convertPointsMutation = useMutation({
    mutationFn: async ({ points }: { points: number }) => {
      const res = await apiRequest("POST", "/api/rewards/convert", { points });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/gamification"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({
        title: "Points Converted!",
        description: `Converted ${data.pointsConverted} points to ${data.axmAmount} AXM`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert points",
        variant: "destructive",
      });
    },
  });
  
  const activeQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed);
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);
  
  const levelProgress = gamification 
    ? ((gamification.xp % 1000) / 1000) * 100 
    : 0;
  
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Please log in to view rewards</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 p-6 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-500/20 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Rewards & Achievements
                </h1>
                <p className="text-sm text-muted-foreground">
                  Complete quests, earn XP & unlock achievements on Lumina
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">Level</span>
                </div>
                <p className="text-sm font-medium mt-1">{gamification?.level || 1}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-orange-500/20">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-muted-foreground">Streak</span>
                </div>
                <p className="text-sm font-medium mt-1">{gamification?.currentStreak || 0} days</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Points</span>
                </div>
                <p className="text-sm font-medium mt-1">{gamification?.totalPoints || 0}</p>
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

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-2 bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-primary/20 border border-primary/30">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-3xl font-bold" data-testid="text-user-level">
                    {gamification?.level || 1}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">XP Progress</span>
                  <span className="font-medium" data-testid="text-user-xp">
                    {gamification?.xp || 0} / {(gamification?.level || 1) * 1000} XP
                  </span>
                </div>
                <Progress value={levelProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-500/20 border border-orange-500/30">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold" data-testid="text-current-streak">
                    {gamification?.currentStreak || 0} days
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Best: {gamification?.longestStreak || 0} days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/20 border border-primary/30">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points</p>
                  <p className="text-2xl font-bold" data-testid="text-total-points">
                    {gamification?.totalPoints || 0}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                ≈ {gamification?.estimatedAxm || "0.00"} AXM
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-gradient-to-r from-primary/10 via-transparent to-emerald-500/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Daily Login Bonus</h3>
                  <p className="text-sm text-muted-foreground">
                    Claim your daily rewards and keep your streak alive!
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => dailyLoginMutation.mutate()}
                disabled={dailyLoginMutation.isPending}
                data-testid="button-claim-daily"
              >
                {dailyLoginMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Claim Daily Bonus
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="quests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quests" className="gap-2" data-testid="tab-quests">
              <Target className="h-4 w-4" />
              Daily Quests
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2" data-testid="tab-achievements">
              <Trophy className="h-4 w-4" />
              Achievements ({unlockedAchievements.length}/{achievements.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="quests" className="mt-6 space-y-4">
            {questsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {activeQuests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Active Quests ({activeQuests.length})
                    </h3>
                    {activeQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} />
                    ))}
                  </div>
                )}
                
                {completedQuests.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                      <Check className="h-5 w-5" />
                      Completed Today ({completedQuests.length})
                    </h3>
                    {completedQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} />
                    ))}
                  </div>
                )}
                
                {quests.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No quests available</h3>
                      <p className="text-sm text-muted-foreground">
                        Check back tomorrow for new daily quests!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-6 space-y-4">
            {achievementsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {unlockedAchievements.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Unlocked ({unlockedAchievements.length})
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {unlockedAchievements.map(achievement => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </div>
                )}
                
                {lockedAchievements.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-5 w-5" />
                      Locked ({lockedAchievements.length})
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {lockedAchievements.map(achievement => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </div>
                )}
                
                {achievements.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No achievements yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete quests and engage with the community to earn achievements!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {isConnected && (
          <Card className="bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    AXM Token Balance
                  </h3>
                  <p className="text-3xl font-bold font-mono mt-2" data-testid="text-axm-balance">
                    {axmBalance} AXM
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Points: {gamification?.totalPoints || 0} (≈ {gamification?.estimatedAxm || "0.00"} AXM)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => convertPointsMutation.mutate({ points: gamification?.totalPoints || 0 })}
                    disabled={convertPointsMutation.isPending || (gamification?.totalPoints || 0) < 100}
                    data-testid="button-convert-points"
                  >
                    {convertPointsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Convert Points
                  </Button>
                  <Button 
                    onClick={() => claimRewardsMutation.mutate()}
                    disabled={claimRewardsMutation.isPending || (gamification?.totalPoints || 0) < 100}
                    data-testid="button-claim-axm"
                  >
                    {claimRewardsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="h-4 w-4 mr-2" />
                    )}
                    Claim Rewards
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              Rewards FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how-earn">
                <AccordionTrigger className="text-sm">How do I earn points and XP?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Complete daily quests like creating posts, liking content, commenting, and maintaining 
                  your login streak. Each action earns points and XP that help you level up and unlock 
                  achievements.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="convert-axm">
                <AccordionTrigger className="text-sm">How are points converted to AXM tokens?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Points are converted to AXM at a rate of 1000 points = 1 AXM. You can claim your AXM 
                  rewards once you accumulate 1000 or more points. Rewards are distributed on the 
                  Arbitrum One blockchain.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="streak-bonus">
                <AccordionTrigger className="text-sm">What are streak bonuses?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Maintaining a daily login streak earns you bonus points. The longer your streak, 
                  the bigger the bonus! Streaks reset if you miss a day, so be sure to claim your 
                  daily bonus consistently.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="achievement-tiers">
                <AccordionTrigger className="text-sm">What are achievement tiers?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Achievements come in five tiers: Bronze, Silver, Gold, Platinum, and Diamond. 
                  Higher tiers offer greater point and XP rewards. Unlock achievements by engaging 
                  with the community and completing various milestones.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
