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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  BarChart3, Phone, Mail, MessageSquare, Plus, Vote, Users, Send, CheckCircle, ExternalLink, Building2,
  Coins, Shield, Sparkles, Megaphone, Target, Scale, Globe, Info, HelpCircle, ArrowRight, 
  FileText, Zap, TrendingUp, Award, Copy
} from "lucide-react";
import type { OpinionPollWithCreator, ContactOfficialsCampaign } from "@shared/schema";
import { MainLayout } from "@/components/layout/MainLayout";

export default function ActionCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("polls");
  const [showCreatePollDialog, setShowCreatePollDialog] = useState(false);
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-primary/10" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
          
          <div className="max-w-6xl mx-auto p-4 md:p-8 relative">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary/10 border border-purple-500/20">
                    <Megaphone className="w-8 h-8 text-purple-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text" data-testid="text-action-center-title">
                      Action Center
                    </h1>
                    <p className="text-muted-foreground">On-chain civic engagement on Arbitrum</p>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  Voice your opinion through decentralized polls and coordinate campaigns to contact elected officials. 
                  Every action is recorded on-chain and earns you AXM governance tokens.
                </p>
              </div>
              {user && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowCreatePollDialog(true)} 
                    data-testid="button-create-poll"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Create Poll
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-primary hover:from-purple-500/90 hover:to-primary/90 shadow-lg shadow-purple-500/20"
                    onClick={() => setShowCreateCampaignDialog(true)} 
                    data-testid="button-create-campaign"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card className="bg-gradient-to-br from-card to-card/50 border-purple-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Vote className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5 AXM</p>
                    <p className="text-xs text-muted-foreground">per poll vote</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">15 AXM</p>
                    <p className="text-xs text-muted-foreground">per official contact</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-green-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Shield className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">On-Chain</p>
                    <p className="text-xs text-muted-foreground">Permanent records</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-blue-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Scale className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">DAO Power</p>
                    <p className="text-xs text-muted-foreground">Votes = governance</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1" data-testid="tabs-action-center">
              <TabsTrigger value="polls" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-polls">
                <BarChart3 className="w-4 h-4" />
                <span>Opinion Polls</span>
              </TabsTrigger>
              <TabsTrigger value="officials" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-officials">
                <Building2 className="w-4 h-4" />
                <span>Contact Officials</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="polls">
              <div className="space-y-6">
                <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium">Decentralized Community Polling</p>
                        <p className="text-sm text-muted-foreground">
                          Create and vote on polls to gauge community sentiment. All votes are recorded on the Arbitrum 
                          blockchain, ensuring transparency and immutability. Poll creators earn 20 AXM, and voters earn 
                          5 AXM per vote. Poll results can inform DAO governance decisions.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge variant="outline" className="bg-purple-500/5">
                            <Shield className="w-3 h-3 mr-1" />
                            Tamper-proof
                          </Badge>
                          <Badge variant="outline" className="bg-purple-500/5">
                            <Users className="w-3 h-3 mr-1" />
                            Community-driven
                          </Badge>
                          <Badge variant="outline" className="bg-purple-500/5">
                            <Coins className="w-3 h-3 mr-1" />
                            Earn rewards
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <OpinionPollsSection />
              </div>
            </TabsContent>

            <TabsContent value="officials">
              <div className="space-y-6">
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium">Coordinated Civic Action</p>
                        <p className="text-sm text-muted-foreground">
                          Launch campaigns to contact elected officials about issues that matter. Use provided scripts 
                          and talking points to amplify your voice. Each contact you make is recorded on-chain, building 
                          a verifiable history of civic engagement that earns you 15 AXM rewards.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge variant="outline" className="bg-primary/5">
                            <FileText className="w-3 h-3 mr-1" />
                            Ready scripts
                          </Badge>
                          <Badge variant="outline" className="bg-primary/5">
                            <Target className="w-3 h-3 mr-1" />
                            Track impact
                          </Badge>
                          <Badge variant="outline" className="bg-primary/5">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Build momentum
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <ContactOfficialsSection />
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
                <AccordionTrigger>How are poll votes recorded on-chain?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    When you cast a vote, a transaction is recorded on the Arbitrum blockchain containing your wallet 
                    address and selected options. This creates an immutable, publicly verifiable record of community 
                    sentiment. Your vote cannot be altered or deleted, ensuring complete transparency.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do contact campaigns affect governance?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Contact campaigns create on-chain proof of civic engagement that can be referenced in DAO proposals. 
                    When proposing policy changes, you can cite verified contact records to demonstrate community support. 
                    This bridges traditional civic action with decentralized governance.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What rewards do I earn for participation?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    You earn LUM tokens for each action: 5 LUM per poll vote, 15 LUM per official contact, and 20 LUM 
                    for creating polls or campaigns. These tokens grant voting power in the Lumina DAO and can be staked 
                    for additional rewards. Active civic participants gain increased influence in platform governance.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I create anonymous polls?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    While votes are recorded on-chain, they're linked to wallet addresses rather than personal identities. 
                    If you want additional privacy, you can use a separate wallet for voting. The platform respects 
                    pseudonymity while maintaining verifiable vote counts and preventing double-voting.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <CreatePollDialog open={showCreatePollDialog} onOpenChange={setShowCreatePollDialog} />
          <CreateContactCampaignDialog open={showCreateCampaignDialog} onOpenChange={setShowCreateCampaignDialog} />
        </div>
      </div>
    </MainLayout>
  );
}

function OpinionPollsSection() {
  const { data: polls, isLoading } = useQuery<OpinionPollWithCreator[]>({
    queryKey: ["/api/opinion-polls"],
  });

  if (isLoading) {
    return <PollsLoading />;
  }

  if (!polls?.length) {
    return (
      <Card className="text-center p-12 border-dashed">
        <div className="p-4 rounded-full bg-purple-500/10 w-fit mx-auto mb-4">
          <BarChart3 className="w-12 h-12 text-purple-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No polls yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Be the first to create a poll and gather community opinions. 
          Poll creators earn 20 AXM tokens and gain visibility in the community!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
}

function PollCard({ poll }: { poll: OpinionPollWithCreator }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const hasVoted = !!poll.userVote;
  const isActive = poll.status === "active";
  const options = poll.options as { id: string; text: string; votes: number }[];
  const totalVotes = poll.totalVotes || options.reduce((sum, opt) => sum + opt.votes, 0);

  const voteMutation = useMutation({
    mutationFn: async (optionIds: string[]) => {
      return apiRequest("POST", `/api/opinion-polls/${poll.id}/vote`, { optionIds });
    },
    onSuccess: () => {
      toast({ 
        title: "Vote recorded on-chain!", 
        description: "You earned 5 AXM for participating. Thank you for sharing your opinion." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opinion-polls"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleVote = () => {
    if (selectedOptions.length === 0) {
      toast({ title: "Error", description: "Please select at least one option", variant: "destructive" });
      return;
    }
    voteMutation.mutate(selectedOptions);
  };

  const toggleOption = (optionId: string) => {
    if (poll.allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  return (
    <Card className="overflow-hidden group hover:border-purple-500/30 transition-colors" data-testid={`card-poll-${poll.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={isActive ? "bg-green-500" : ""}
              >
                {isActive ? "Active" : poll.status}
              </Badge>
              {hasVoted && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Voted
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg group-hover:text-purple-500 transition-colors">{poll.question}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={poll.creator?.avatarUrl || undefined} />
                <AvatarFallback>{poll.creator?.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{poll.creator?.displayName || poll.creator?.username}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {poll.description && (
          <p className="text-sm text-muted-foreground">{poll.description}</p>
        )}

        <div className="space-y-3">
          {options.map((option) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            const isSelected = selectedOptions.includes(option.id);
            const wasSelected = poll.userVote?.optionIds?.includes(option.id);

            if (hasVoted || !isActive || (poll.showResults && !user)) {
              return (
                <div key={option.id} className="space-y-1" data-testid={`poll-option-${option.id}`}>
                  <div className="flex justify-between text-sm">
                    <span className={wasSelected ? "font-medium text-purple-500" : ""}>
                      {wasSelected && <CheckCircle className="w-4 h-4 inline mr-1" />}
                      {option.text}
                    </span>
                    <span className="text-muted-foreground font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">{option.votes} votes</p>
                </div>
              );
            }

            return (
              <div 
                key={option.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected ? "border-purple-500 bg-purple-500/5 shadow-sm" : "hover:bg-muted/50 hover:border-muted-foreground/20"
                }`}
                onClick={() => toggleOption(option.id)}
                data-testid={`poll-option-${option.id}`}
              >
                {poll.allowMultiple ? (
                  <Checkbox checked={isSelected} className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500" />
                ) : (
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-purple-500 bg-purple-500" : "border-muted-foreground"
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-background rounded-full" />}
                  </div>
                )}
                <span className="flex-1">{option.text}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
          </div>
          <div className="flex gap-2">
            {poll.allowMultiple && (
              <Badge variant="outline" className="text-xs">Multiple choice</Badge>
            )}
            {isActive && !hasVoted && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
                <Coins className="w-3 h-3 mr-1" />
                +5 AXM
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      {isActive && !hasVoted && user && (
        <CardFooter className="bg-muted/30 border-t">
          <Button 
            onClick={handleVote} 
            disabled={voteMutation.isPending || selectedOptions.length === 0}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-500/90 hover:to-purple-600/90"
            data-testid={`button-vote-${poll.id}`}
          >
            {voteMutation.isPending ? "Recording on-chain..." : "Submit Vote"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      )}
      
      {!user && isActive && (
        <CardFooter className="bg-muted/30 border-t">
          <Button variant="outline" className="w-full">
            Sign in to Vote
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function ContactOfficialsSection() {
  const { data: campaigns, isLoading } = useQuery<ContactOfficialsCampaign[]>({
    queryKey: ["/api/contact-officials-campaigns"],
  });

  if (isLoading) {
    return <CampaignsLoading />;
  }

  if (!campaigns?.length) {
    return (
      <Card className="text-center p-12 border-dashed">
        <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
          <Building2 className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Start a campaign to mobilize your community to contact officials. 
          Campaign organizers earn 25 AXM plus 2 AXM per contact made!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {campaigns.map((campaign) => (
        <ContactCampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}

function ContactCampaignCard({ campaign }: { campaign: ContactOfficialsCampaign }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactMethod, setContactMethod] = useState<string>("email");
  const [message, setMessage] = useState(campaign.scriptTemplate || "");

  const isActive = campaign.status === "active";
  const talkingPoints = campaign.talkingPoints || [];

  const copyScript = () => {
    if (campaign.scriptTemplate) {
      navigator.clipboard.writeText(campaign.scriptTemplate);
      toast({ title: "Copied!", description: "Script copied to clipboard" });
    }
  };

  const recordContactMutation = useMutation({
    mutationFn: async (data: { officialName: string; contactMethod: string; message?: string }) => {
      return apiRequest("POST", `/api/contact-officials-campaigns/${campaign.id}/contacts`, data);
    },
    onSuccess: () => {
      toast({ 
        title: "Contact recorded on-chain!", 
        description: "You earned 15 AXM for taking civic action. Thank you for making your voice heard." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-officials-campaigns"] });
      setShowContactDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card className="overflow-hidden group hover:border-primary/30 transition-colors" data-testid={`card-campaign-${campaign.id}`}>
      <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant={isActive ? "default" : "secondary"}
                className={isActive ? "bg-green-500" : ""}
              >
                {isActive ? "Active Campaign" : campaign.status}
              </Badge>
              {campaign.officialType && (
                <Badge variant="outline" className="capitalize">{campaign.officialType.replace("_", " ")}</Badge>
              )}
              {campaign.targetJurisdiction && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <Globe className="w-3 h-3 mr-1" />
                  {campaign.targetJurisdiction}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">{campaign.title}</CardTitle>
            <CardDescription className="text-base">{campaign.description}</CardDescription>
          </div>
          <div className="text-right p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-3xl font-bold text-primary">{campaign.contactCount || 0}</p>
            <p className="text-sm text-muted-foreground">contacts made</p>
            <p className="text-xs text-green-500 mt-1">+{(campaign.contactCount || 0) * 15} AXM earned</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {campaign.callToAction && (
          <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-primary">Call to Action</p>
                  <p className="text-sm text-muted-foreground mt-1">{campaign.callToAction}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {talkingPoints.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                Key Talking Points
              </h4>
              <ul className="space-y-2">
                {talkingPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {campaign.scriptTemplate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Script Template
                </h4>
                <Button variant="ghost" size="sm" onClick={copyScript}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              <Card className="p-4 bg-muted/50 max-h-40 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{campaign.scriptTemplate}</p>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
      
      {isActive && user && (
        <CardFooter className="gap-3 bg-muted/30 border-t p-4">
          <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80" data-testid={`button-take-action-${campaign.id}`}>
                <Send className="w-4 h-4 mr-2" />
                Take Action
                <Badge variant="secondary" className="ml-2 bg-white/20">+15 AXM</Badge>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Record Your Contact
                </DialogTitle>
                <DialogDescription>
                  Log that you contacted an official about "{campaign.title}". Your action will be recorded on-chain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">Reward for this action</span>
                    </div>
                    <span className="font-bold text-green-500">+15 AXM</span>
                  </CardContent>
                </Card>

                <div>
                  <Label className="text-base">How did you contact the official?</Label>
                  <RadioGroup value={contactMethod} onValueChange={setContactMethod} className="grid grid-cols-3 gap-2 mt-2">
                    <Label 
                      htmlFor="method-email"
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        contactMethod === "email" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value="email" id="method-email" className="sr-only" />
                      <Mail className="w-5 h-5" />
                      <span className="text-sm">Email</span>
                    </Label>
                    <Label 
                      htmlFor="method-phone"
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        contactMethod === "phone" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value="phone" id="method-phone" className="sr-only" />
                      <Phone className="w-5 h-5" />
                      <span className="text-sm">Phone</span>
                    </Label>
                    <Label 
                      htmlFor="method-letter"
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        contactMethod === "letter" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem value="letter" id="method-letter" className="sr-only" />
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-sm">Letter</span>
                    </Label>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="message">Your Message (Optional)</Label>
                  <Textarea 
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What key points did you communicate?"
                    className="min-h-24"
                    data-testid="input-contact-message"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => recordContactMutation.mutate({ 
                    officialName: campaign.officialType || "Official", 
                    contactMethod, 
                    message 
                  })}
                  disabled={recordContactMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-record-contact"
                >
                  {recordContactMutation.isPending ? "Recording on-chain..." : "Record Contact"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}

      {!user && isActive && (
        <CardFooter className="bg-muted/30 border-t">
          <Button variant="outline" className="w-full">
            Sign in to Take Action
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function CreatePollDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/opinion-polls", data);
    },
    onSuccess: () => {
      toast({ title: "Poll created on-chain!", description: "Your poll is now live. You earned 20 AXM!" });
      queryClient.invalidateQueries({ queryKey: ["/api/opinion-polls"] });
      onOpenChange(false);
      setQuestion("");
      setDescription("");
      setOptions(["", ""]);
      setAllowMultiple(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addOption = () => setOptions([...options, ""]);
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Create Opinion Poll
          </DialogTitle>
          <DialogDescription>
            Ask your community for their opinion. Polls are recorded on-chain for transparent results.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardContent className="p-3 flex items-center gap-3">
              <Award className="w-5 h-5 text-purple-500" />
              <div className="text-sm">
                <p className="font-medium">Creator Reward</p>
                <p className="text-muted-foreground">Earn 20 AXM for creating this poll</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="question">Question *</Label>
            <Input 
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask the community?"
              data-testid="input-poll-question"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context or background to help voters understand..."
              data-testid="input-poll-description"
            />
          </div>
          <div>
            <Label>Answer Options *</Label>
            <p className="text-xs text-muted-foreground mb-2">Provide at least 2 options for voters to choose from</p>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    data-testid={`input-poll-option-${index}`}
                  />
                  {options.length > 2 && (
                    <Button variant="outline" size="icon" onClick={() => removeOption(index)}>
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addOption} className="w-full" data-testid="button-add-option">
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
            <Checkbox 
              id="allowMultiple" 
              checked={allowMultiple} 
              onCheckedChange={(checked) => setAllowMultiple(checked as boolean)} 
            />
            <div>
              <Label htmlFor="allowMultiple" className="cursor-pointer">Allow multiple selections</Label>
              <p className="text-xs text-muted-foreground">Let voters choose more than one option</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => {
              const trimmedQuestion = question.trim();
              const validOptions = options.filter(o => o.trim());
              if (!trimmedQuestion) {
                toast({ title: "Error", description: "Question is required", variant: "destructive" });
                return;
              }
              if (validOptions.length < 2) {
                toast({ title: "Error", description: "At least 2 options are required", variant: "destructive" });
                return;
              }
              createMutation.mutate({
                question: trimmedQuestion,
                description: description.trim() || undefined,
                options: validOptions.map((text, i) => ({ id: `opt-${i}`, text: text.trim(), votes: 0 })),
                allowMultiple,
              });
            }}
            disabled={createMutation.isPending || !question.trim() || options.filter(o => o.trim()).length < 2}
            className="w-full sm:w-auto"
            data-testid="button-submit-poll"
          >
            {createMutation.isPending ? "Creating..." : "Create Poll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateContactCampaignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [officialType, setOfficialType] = useState("");
  const [targetJurisdiction, setTargetJurisdiction] = useState("");
  const [scriptTemplate, setScriptTemplate] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [talkingPointsText, setTalkingPointsText] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/contact-officials-campaigns", data);
    },
    onSuccess: () => {
      toast({ title: "Campaign created!", description: "Your campaign is now live. You earned 25 AXM!" });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-officials-campaigns"] });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setOfficialType("");
      setTargetJurisdiction("");
      setScriptTemplate("");
      setCallToAction("");
      setTalkingPointsText("");
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
            <Building2 className="w-5 h-5 text-primary" />
            Create Contact Campaign
          </DialogTitle>
          <DialogDescription>
            Mobilize your community to contact elected officials. You earn rewards for every contact made.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 flex items-center gap-3">
              <Coins className="w-5 h-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Organizer Rewards</p>
                <p className="text-muted-foreground">25 AXM for creating + 2 AXM per contact made</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="title">Campaign Title *</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Support the Clean Energy Act"
              data-testid="input-campaign-title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this campaign important? What change are you seeking?"
              data-testid="input-campaign-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="officialType">Official Type</Label>
              <Select value={officialType} onValueChange={setOfficialType}>
                <SelectTrigger data-testid="select-official-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="senator">Senator</SelectItem>
                  <SelectItem value="representative">Representative</SelectItem>
                  <SelectItem value="governor">Governor</SelectItem>
                  <SelectItem value="mayor">Mayor</SelectItem>
                  <SelectItem value="council_member">Council Member</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetJurisdiction">Target Jurisdiction</Label>
              <Input 
                id="targetJurisdiction"
                value={targetJurisdiction}
                onChange={(e) => setTargetJurisdiction(e.target.value)}
                placeholder="E.g., California, NYC"
                data-testid="input-jurisdiction"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="callToAction">Call to Action</Label>
            <Input 
              id="callToAction"
              value={callToAction}
              onChange={(e) => setCallToAction(e.target.value)}
              placeholder="E.g., Vote YES on Bill 123"
              data-testid="input-call-to-action"
            />
          </div>
          <div>
            <Label htmlFor="talkingPoints">Talking Points (one per line)</Label>
            <Textarea 
              id="talkingPoints"
              value={talkingPointsText}
              onChange={(e) => setTalkingPointsText(e.target.value)}
              placeholder="Enter key points supporters should mention..."
              className="min-h-20"
              data-testid="input-talking-points"
            />
          </div>
          <div>
            <Label htmlFor="scriptTemplate">Script Template</Label>
            <Textarea 
              id="scriptTemplate"
              value={scriptTemplate}
              onChange={(e) => setScriptTemplate(e.target.value)}
              placeholder="Provide a template message for supporters to use..."
              className="min-h-24"
              data-testid="input-script-template"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => {
              const trimmedTitle = title.trim();
              const trimmedDescription = description.trim();
              if (!trimmedTitle) {
                toast({ title: "Error", description: "Title is required", variant: "destructive" });
                return;
              }
              if (!trimmedDescription) {
                toast({ title: "Error", description: "Description is required", variant: "destructive" });
                return;
              }
              createMutation.mutate({
                title: trimmedTitle,
                description: trimmedDescription,
                officialType: officialType || undefined,
                targetJurisdiction: targetJurisdiction.trim() || undefined,
                callToAction: callToAction.trim() || undefined,
                talkingPoints: talkingPointsText ? talkingPointsText.split('\n').filter(p => p.trim()) : undefined,
                scriptTemplate: scriptTemplate.trim() || undefined,
              });
            }}
            disabled={createMutation.isPending || !title.trim() || !description.trim()}
            className="w-full sm:w-auto"
            data-testid="button-submit-campaign"
          >
            {createMutation.isPending ? "Creating..." : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PollsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex gap-2 mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CampaignsLoading() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="border-b">
            <div className="flex gap-2 mb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
