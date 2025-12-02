import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/authContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Users, Clock, Plus, MapPin, Calendar, Trophy, CheckCircle, XCircle, Timer, User, Award, TrendingUp,
  Coins, Shield, Sparkles, Heart, Globe, Zap, Info, HelpCircle, ArrowRight, Star, Target, Gift
} from "lucide-react";
import type { VolunteerOpportunityWithCreator, VolunteerShift, VolunteerHours } from "@shared/schema";
import { MainLayout } from "@/components/layout/MainLayout";

export default function Volunteers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("opportunities");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="max-w-6xl mx-auto p-4 md:p-8 relative">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text" data-testid="text-volunteers-title">
                      Volunteer Hub
                    </h1>
                    <p className="text-muted-foreground">Decentralized community organizing on Arbitrum One</p>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  Join the movement. Volunteer for causes you believe in, track your contributions on-chain, 
                  and earn AXM token rewards for making a real-world impact.
                </p>
              </div>
              {user && (
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                  onClick={() => setShowCreateDialog(true)} 
                  data-testid="button-create-opportunity"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Opportunity
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">10 AXM</p>
                    <p className="text-xs text-muted-foreground">per hour volunteered</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Verified</p>
                    <p className="text-xs text-muted-foreground">On-chain records</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Award className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">NFT Badges</p>
                    <p className="text-xs text-muted-foreground">Earn achievements</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Global</p>
                    <p className="text-xs text-muted-foreground">Community impact</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1" data-testid="tabs-volunteers">
              <TabsTrigger value="opportunities" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-opportunities">
                <Users className="w-4 h-4" />
                <span>Opportunities</span>
              </TabsTrigger>
              <TabsTrigger value="my-hours" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-my-hours">
                <Clock className="w-4 h-4" />
                <span>My Hours</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-leaderboard">
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities">
              <div className="space-y-6">
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">How Volunteer Opportunities Work</p>
                        <p className="text-sm text-muted-foreground">
                          Browse available opportunities, sign up for shifts that fit your schedule, and log your hours 
                          after completing work. Verified hours are recorded on-chain and automatically converted to AXM rewards.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <OpportunitiesSection />
              </div>
            </TabsContent>

            <TabsContent value="my-hours">
              <div className="space-y-6">
                <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Track Your Contributions</p>
                        <p className="text-sm text-muted-foreground">
                          Log volunteer hours after completing work. Once verified by organizers, your hours are 
                          permanently recorded on Arbitrum and you receive 10 AXM tokens per hour as a reward.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <MyHoursSection />
              </div>
            </TabsContent>

            <TabsContent value="leaderboard">
              <div className="space-y-6">
                <Card className="border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Trophy className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Community Champions</p>
                        <p className="text-sm text-muted-foreground">
                          Top volunteers earn exclusive NFT badges and bonus AXM rewards. The top 3 volunteers each 
                          month receive special recognition and governance voting power multipliers.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <LeaderboardSection />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              Frequently Asked Questions
            </h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I earn AXM tokens through volunteering?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Sign up for volunteer opportunities and log your hours after completing work. Once your hours 
                    are verified by the opportunity organizer, you automatically receive 10 AXM tokens per hour 
                    directly to your connected wallet. There's no cap on how much you can earn!
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What are volunteer NFT badges?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    NFT badges are soulbound tokens that recognize your volunteer achievements. You can earn badges 
                    for reaching hour milestones (10h, 50h, 100h+), maintaining volunteer streaks, topping the 
                    monthly leaderboard, and other special achievements. These badges boost your reputation score 
                    and may provide governance benefits.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How is my volunteer work verified on-chain?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    When you log hours, the opportunity organizer reviews and verifies your contribution. Once 
                    verified, a permanent record is created on the Arbitrum blockchain. This provides transparent, 
                    immutable proof of your community service that can be referenced by employers, schools, or 
                    other organizations.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I create my own volunteer opportunities?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Yes! Any registered user can create volunteer opportunities. Click "Create Opportunity" to set 
                    up a new event or ongoing volunteer program. You'll be able to manage signups, verify hours, 
                    and track the impact of your initiative. Organizers also earn bonus AXM for coordinating 
                    successful volunteer events.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <CreateOpportunityDialog 
            open={showCreateDialog} 
            onOpenChange={setShowCreateDialog}
          />
        </div>
      </div>
    </MainLayout>
  );
}

function OpportunitiesSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);

  const { data: opportunities, isLoading } = useQuery<VolunteerOpportunityWithCreator[]>({
    queryKey: ["/api/volunteer-opportunities"],
  });

  const signupMutation = useMutation({
    mutationFn: async ({ opportunityId, shiftId, notes }: { opportunityId: string; shiftId?: string; notes?: string }) => {
      return apiRequest("POST", `/api/volunteer-opportunities/${opportunityId}/signup`, { shiftId, notes });
    },
    onSuccess: () => {
      toast({ title: "Signed up!", description: "You've been registered as a volunteer. You'll earn AXM rewards for verified hours." });
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-opportunities"] });
      setSelectedOpportunity(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <OpportunitiesLoading />;
  }

  if (!opportunities?.length) {
    return (
      <Card className="text-center p-12 border-dashed">
        <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
          <Users className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No volunteer opportunities yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Be the first to create a volunteer opportunity and mobilize your community. 
          Organizers earn bonus AXM tokens for successful events!
        </p>
        {user && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create First Opportunity
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {opportunities.map((opportunity) => (
        <OpportunityCard 
          key={opportunity.id} 
          opportunity={opportunity}
          onSignup={() => setSelectedOpportunity(opportunity.id)}
          isSigningUp={selectedOpportunity === opportunity.id}
          signupMutation={signupMutation}
          onClose={() => setSelectedOpportunity(null)}
        />
      ))}
    </div>
  );
}

function OpportunityCard({ 
  opportunity, 
  onSignup, 
  isSigningUp, 
  signupMutation,
  onClose 
}: { 
  opportunity: VolunteerOpportunityWithCreator;
  onSignup: () => void;
  isSigningUp: boolean;
  signupMutation: any;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [selectedShift, setSelectedShift] = useState<string | undefined>();
  const [notes, setNotes] = useState("");

  const { data: shifts } = useQuery<VolunteerShift[]>({
    queryKey: ["/api/volunteer-opportunities", opportunity.id, "shifts"],
    enabled: isSigningUp,
  });

  const spotsRemaining = opportunity.maxVolunteers 
    ? opportunity.maxVolunteers - (opportunity.currentVolunteers || 0) 
    : null;

  const isFull = spotsRemaining !== null && spotsRemaining <= 0;
  const estimatedReward = opportunity.minCommitmentHours ? opportunity.minCommitmentHours * 10 : null;

  return (
    <Card className="overflow-hidden group hover:border-primary/30 transition-colors" data-testid={`card-opportunity-${opportunity.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="bg-primary/5">
                {opportunity.category || "General"}
              </Badge>
              {estimatedReward && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Coins className="w-3 h-3 mr-1" />
                  ~{estimatedReward} AXM
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">{opportunity.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={opportunity.creator?.avatarUrl || undefined} />
                <AvatarFallback>{opportunity.creator?.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{opportunity.creator?.displayName || opportunity.creator?.username}</span>
            </CardDescription>
          </div>
          <Badge 
            variant={opportunity.status === "active" ? "default" : "secondary"}
            className={opportunity.status === "active" ? "bg-green-500" : ""}
          >
            {opportunity.status === "active" ? "Active" : opportunity.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p>
        
        <div className="flex flex-wrap gap-3 text-sm">
          {opportunity.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary/60" />
              {opportunity.location}
            </div>
          )}
          {opportunity.startDate && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary/60" />
              {format(new Date(opportunity.startDate), "MMM d, yyyy")}
            </div>
          )}
          {opportunity.minCommitmentHours && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4 text-primary/60" />
              ~{opportunity.minCommitmentHours}h commitment
            </div>
          )}
        </div>

        {opportunity.maxVolunteers && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {opportunity.currentVolunteers || 0} / {opportunity.maxVolunteers} volunteers
              </span>
              {spotsRemaining !== null && (
                <span className={spotsRemaining <= 3 ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {spotsRemaining} spots left
                </span>
              )}
            </div>
            <Progress 
              value={((opportunity.currentVolunteers || 0) / opportunity.maxVolunteers) * 100} 
              className="h-2" 
            />
          </div>
        )}

        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(opportunity.skills as string[]).slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
            ))}
            {(opportunity.skills as string[]).length > 3 && (
              <Badge variant="outline" className="text-xs">+{(opportunity.skills as string[]).length - 3} more</Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 bg-muted/30 border-t">
        {opportunity.status === "active" && !opportunity.userSignup && !isFull && user && (
          <Dialog open={isSigningUp} onOpenChange={(open) => !open && onClose()}>
            <DialogTrigger asChild>
              <Button className="flex-1" onClick={onSignup} data-testid={`button-signup-${opportunity.id}`}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Volunteer Now
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Volunteer for this Opportunity
                </DialogTitle>
                <DialogDescription>
                  Sign up to help with "{opportunity.title}". You'll earn AXM tokens for verified volunteer hours.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Coins className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Estimated Reward</p>
                      <p className="text-xs text-muted-foreground">
                        {estimatedReward ? `~${estimatedReward} AXM for ${opportunity.minCommitmentHours}h` : "10 AXM per verified hour"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {shifts && shifts.length > 0 && (
                  <div>
                    <Label>Select a Shift (Optional)</Label>
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                      <SelectTrigger data-testid="select-shift">
                        <SelectValue placeholder="Choose a shift..." />
                      </SelectTrigger>
                      <SelectContent>
                        {shifts.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {format(new Date(shift.startTime), "MMM d, h:mm a")} - {format(new Date(shift.endTime), "h:mm a")}
                            {shift.maxVolunteers && ` (${shift.currentVolunteers || 0}/${shift.maxVolunteers})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea 
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share relevant skills or availability notes..."
                    data-testid="input-signup-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => signupMutation.mutate({ opportunityId: opportunity.id, shiftId: selectedShift, notes })}
                  disabled={signupMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-confirm-signup"
                >
                  {signupMutation.isPending ? "Signing up..." : "Confirm Signup"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {opportunity.userSignup && (
          <Button variant="outline" disabled className="flex-1 bg-green-500/5 border-green-500/20 text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            Already Signed Up
          </Button>
        )}
        {isFull && !opportunity.userSignup && (
          <Button variant="outline" disabled className="flex-1">
            <XCircle className="w-4 h-4 mr-2" />
            Opportunity Full
          </Button>
        )}
        {!user && (
          <Button variant="outline" className="flex-1">
            Sign in to Volunteer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function MyHoursSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLogDialog, setShowLogDialog] = useState(false);

  const { data: hoursData, isLoading } = useQuery<{ hours: VolunteerHours[]; total: number }>({
    queryKey: ["/api/volunteer-hours"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <Card className="text-center p-12 border-dashed">
        <div className="p-4 rounded-full bg-blue-500/10 w-fit mx-auto mb-4">
          <User className="w-12 h-12 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Connect to Track Your Hours</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Sign in to view and log your volunteer hours. Your contributions are recorded on-chain 
          and converted to AXM token rewards.
        </p>
        <Button>
          Sign In to Get Started
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return <HoursLoading />;
  }

  const totalRewards = (hoursData?.total || 0) * 10;
  const monthlyHours = hoursData?.hours?.filter(h => {
    const date = new Date(h.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, h) => sum + h.hours, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary" data-testid="text-total-hours">
              {hoursData?.total?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">hours volunteered</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AXM Earned</CardTitle>
            <Coins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500" data-testid="text-axm-earned">
              {totalRewards.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">tokens from volunteering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-monthly-hours">
              {monthlyHours.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">hours this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-sessions">
              {hoursData?.hours?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">volunteer sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Your volunteer history on Arbitrum</p>
        </div>
        <Button onClick={() => setShowLogDialog(true)} data-testid="button-log-hours">
          <Plus className="w-4 h-4 mr-2" />
          Log Hours
        </Button>
      </div>

      {hoursData?.hours?.length ? (
        <div className="space-y-3">
          {hoursData.hours.map((entry) => (
            <Card key={entry.id} className="hover:border-primary/30 transition-colors" data-testid={`card-hours-${entry.id}`}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Timer className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{entry.description || "Volunteer work"}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-lg">{entry.hours}h</p>
                    <p className="text-xs text-green-500">+{entry.hours * 10} AXM</p>
                  </div>
                  <Badge 
                    variant={entry.verified ? "default" : "secondary"}
                    className={entry.verified ? "bg-green-500" : ""}
                  >
                    {entry.verified ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </>
                    ) : "Pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-8 border-dashed">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No volunteer hours logged yet</h3>
          <p className="text-muted-foreground text-sm">Start making a difference and earn AXM rewards!</p>
        </Card>
      )}

      <LogHoursDialog open={showLogDialog} onOpenChange={setShowLogDialog} />
    </div>
  );
}

function LogHoursDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const logMutation = useMutation({
    mutationFn: async (data: { hours: number; description: string; date: string }) => {
      return apiRequest("POST", "/api/volunteer-hours", data);
    },
    onSuccess: () => {
      toast({ title: "Hours logged!", description: "Your volunteer hours have been recorded and are pending verification." });
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-hours"] });
      onOpenChange(false);
      setHours("");
      setDescription("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const estimatedReward = hours ? parseFloat(hours) * 10 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Log Volunteer Hours
          </DialogTitle>
          <DialogDescription>
            Record your volunteer activity. Once verified, you'll receive AXM token rewards.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {estimatedReward > 0 && (
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Estimated Reward</span>
                </div>
                <span className="font-bold text-green-500">{estimatedReward} AXM</span>
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="hours">Hours Worked</Label>
            <Input 
              id="hours"
              type="number"
              step="0.5"
              min="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Enter hours worked"
              data-testid="input-log-hours"
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
              data-testid="input-log-date"
            />
          </div>
          <div>
            <Label htmlFor="description">Activity Description</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what volunteer work you completed..."
              data-testid="input-log-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => logMutation.mutate({ hours: parseFloat(hours), description, date })}
            disabled={logMutation.isPending || !hours}
            className="w-full sm:w-auto"
            data-testid="button-submit-hours"
          >
            {logMutation.isPending ? "Saving..." : "Submit for Verification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaderboardSection() {
  const { data: leaderboard, isLoading } = useQuery<{ userId: string; user: any; totalHours: number }[]>({
    queryKey: ["/api/volunteer-leaderboard"],
  });

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  if (!leaderboard?.length) {
    return (
      <Card className="text-center p-12 border-dashed">
        <div className="p-4 rounded-full bg-yellow-500/10 w-fit mx-auto mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Leaderboard Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Be the first to log volunteer hours and claim your spot at the top! 
          Top volunteers earn exclusive NFT badges and bonus AXM rewards.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Top Volunteers</h2>
          <p className="text-sm text-muted-foreground">Community champions earning rewards</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {leaderboard.slice(0, 3).map((entry, index) => (
          <Card 
            key={entry.userId} 
            className={`relative overflow-hidden ${
              index === 0 ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent" :
              index === 1 ? "border-slate-400/50 bg-gradient-to-br from-slate-400/10 to-transparent" :
              "border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-transparent"
            }`}
          >
            <div className="absolute top-2 right-2">
              <Badge className={
                index === 0 ? "bg-yellow-500" :
                index === 1 ? "bg-slate-400" :
                "bg-orange-500"
              }>
                #{index + 1}
              </Badge>
            </div>
            <CardContent className="pt-8 pb-4 text-center">
              <Avatar className="h-16 w-16 mx-auto mb-3 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                <AvatarImage src={entry.user?.avatarUrl} />
                <AvatarFallback className="text-lg">
                  {entry.user?.displayName?.[0] || entry.user?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold">{entry.user?.displayName || entry.user?.username}</p>
              <p className="text-sm text-muted-foreground mb-3">@{entry.user?.username}</p>
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-bold text-xl text-primary">{entry.totalHours.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-xs text-green-500 mt-1">
                +{(entry.totalHours * 10).toFixed(0)} AXM earned
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {leaderboard.length > 3 && (
        <div className="space-y-3">
          {leaderboard.slice(3).map((entry, index) => (
            <Card key={entry.userId} className="hover:border-primary/30 transition-colors" data-testid={`card-leaderboard-${index + 3}`}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-bold">
                  {index + 4}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.user?.avatarUrl} />
                  <AvatarFallback>{entry.user?.displayName?.[0] || entry.user?.username?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{entry.user?.displayName || entry.user?.username}</p>
                  <p className="text-sm text-muted-foreground">@{entry.user?.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-primary">{entry.totalHours.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">hours</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateOpportunityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [maxVolunteers, setMaxVolunteers] = useState("");
  const [minCommitmentHours, setMinCommitmentHours] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/volunteer-opportunities", data);
    },
    onSuccess: () => {
      toast({ title: "Opportunity created!", description: "Your volunteer opportunity is now live and earning organizer rewards." });
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer-opportunities"] });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setCategory("");
      setMaxVolunteers("");
      setMinCommitmentHours("");
      setLocation("");
      setStartDate("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Create Volunteer Opportunity
          </DialogTitle>
          <DialogDescription>
            Set up a new opportunity for volunteers. Organizers earn bonus AXM when volunteers complete verified hours.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 flex items-center gap-3">
              <Gift className="w-5 h-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Organizer Rewards</p>
                <p className="text-muted-foreground">Earn 2 AXM per volunteer hour completed</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="title">Opportunity Title *</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Community Cleanup Day"
              data-testid="input-opportunity-title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the volunteer opportunity, expectations, and impact..."
              data-testid="input-opportunity-description"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="environment">Environment</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="arts">Arts & Culture</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxVolunteers">Max Volunteers</Label>
              <Input 
                id="maxVolunteers"
                type="number"
                min="1"
                value={maxVolunteers}
                onChange={(e) => setMaxVolunteers(e.target.value)}
                placeholder="No limit"
                data-testid="input-max-volunteers"
              />
            </div>
            <div>
              <Label htmlFor="minCommitmentHours">Min Hours</Label>
              <Input 
                id="minCommitmentHours"
                type="number"
                min="1"
                value={minCommitmentHours}
                onChange={(e) => setMinCommitmentHours(e.target.value)}
                placeholder="Flexible"
                data-testid="input-min-hours"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address, city, or 'Remote'"
              data-testid="input-location"
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input 
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              data-testid="input-start-date"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => {
              if (!title.trim()) {
                toast({ title: "Error", description: "Title is required", variant: "destructive" });
                return;
              }
              if (!description.trim()) {
                toast({ title: "Error", description: "Description is required", variant: "destructive" });
                return;
              }
              createMutation.mutate({
                title: title.trim(),
                description: description.trim(),
                category: category || undefined,
                maxVolunteers: maxVolunteers ? parseInt(maxVolunteers) : undefined,
                minCommitmentHours: minCommitmentHours ? parseInt(minCommitmentHours) : undefined,
                location: location || undefined,
                startDate: startDate ? new Date(startDate) : undefined,
              });
            }}
            disabled={createMutation.isPending || !title.trim() || !description.trim()}
            className="w-full sm:w-auto"
            data-testid="button-submit-opportunity"
          >
            {createMutation.isPending ? "Creating..." : "Create Opportunity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpportunitiesLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex gap-2 mb-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function HoursLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 py-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-8 pb-4 text-center">
              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3" />
              <Skeleton className="h-5 w-24 mx-auto mb-1" />
              <Skeleton className="h-4 w-16 mx-auto mb-3" />
              <Skeleton className="h-6 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
