import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Phone, MapPin, Users, CheckCircle, XCircle, Clock, Plus, Target, PhoneCall, ClipboardList, Map, UserCheck, Star,
  Coins, Shield, Sparkles, Megaphone, Zap, Info, HelpCircle, ArrowRight, Award, TrendingUp, Globe, Trophy
} from "lucide-react";
import type { PhoneBankingList, PhoneBankingContact, CanvassingTurf, CanvassingContact, User } from "@shared/schema";
import { MainLayout } from "@/components/layout/MainLayout";

export default function PhoneBanking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("phone-banking");
  const [showCreateListDialog, setShowCreateListDialog] = useState(false);
  const [showCreateTurfDialog, setShowCreateTurfDialog] = useState(false);

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="max-w-6xl mx-auto p-4 md:p-8 relative">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-green-500/10 border border-blue-500/20">
                    <Megaphone className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text" data-testid="text-outreach-title">
                      Outreach Tools
                    </h1>
                    <p className="text-muted-foreground">Decentralized grassroots organizing on Arbitrum</p>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  Connect with supporters through phone banking and door-to-door canvassing. Every contact is recorded 
                  on-chain, earning you AXM tokens while building a verifiable history of community organizing.
                </p>
              </div>
              {user && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowCreateListDialog(true)} 
                    data-testid="button-create-call-list-header"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    New Call List
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-500/90 hover:to-green-500/90 shadow-lg shadow-blue-500/20"
                    onClick={() => setShowCreateTurfDialog(true)} 
                    data-testid="button-create-turf-header"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    New Turf
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card className="bg-gradient-to-br from-card to-card/50 border-blue-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5 AXM</p>
                    <p className="text-xs text-muted-foreground">per call made</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-green-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <MapPin className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">8 AXM</p>
                    <p className="text-xs text-muted-foreground">per door knocked</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">On-Chain</p>
                    <p className="text-xs text-muted-foreground">Verified contacts</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-yellow-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Bonus</p>
                    <p className="text-xs text-muted-foreground">Top recruiter rewards</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1">
              <TabsTrigger value="phone-banking" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-phone-banking">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Phone Banking</span>
                <span className="sm:hidden">Calls</span>
              </TabsTrigger>
              <TabsTrigger value="canvassing" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-canvassing">
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Canvassing</span>
                <span className="sm:hidden">Doors</span>
              </TabsTrigger>
              <TabsTrigger value="my-activity" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-my-activity">
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">My Activity</span>
                <span className="sm:hidden">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex flex-col sm:flex-row gap-1 py-3" data-testid="tab-leaderboard">
                <Star className="w-4 h-4" />
                <span>Leaderboard</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phone-banking">
              <div className="space-y-6">
                <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium">Phone Banking on Arbitrum</p>
                        <p className="text-sm text-muted-foreground">
                          Make calls to supporters using provided scripts and record outcomes. Each call is logged 
                          on-chain, creating verifiable proof of your organizing work. Earn 5 AXM per call, with 
                          bonus rewards for positive contacts!
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge variant="outline" className="bg-blue-500/5">
                            <ClipboardList className="w-3 h-3 mr-1" />
                            Pre-written scripts
                          </Badge>
                          <Badge variant="outline" className="bg-blue-500/5">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Track progress
                          </Badge>
                          <Badge variant="outline" className="bg-blue-500/5">
                            <Coins className="w-3 h-3 mr-1" />
                            Earn rewards
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <PhoneBankingSection 
                  user={user} 
                  showCreateDialog={showCreateListDialog}
                  setShowCreateDialog={setShowCreateListDialog}
                />
              </div>
            </TabsContent>

            <TabsContent value="canvassing">
              <div className="space-y-6">
                <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium">Door-to-Door Canvassing</p>
                        <p className="text-sm text-muted-foreground">
                          Walk assigned turfs and talk to residents in person. Log each door knock with outcome and 
                          notes, building a permanent on-chain record of your grassroots organizing. Earn 8 AXM per 
                          door with bonuses for positive contacts!
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge variant="outline" className="bg-green-500/5">
                            <Map className="w-3 h-3 mr-1" />
                            Assigned turfs
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/5">
                            <Target className="w-3 h-3 mr-1" />
                            Track coverage
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/5">
                            <Globe className="w-3 h-3 mr-1" />
                            Real-world impact
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <CanvassingSection 
                  user={user}
                  showCreateDialog={showCreateTurfDialog}
                  setShowCreateDialog={setShowCreateTurfDialog}
                />
              </div>
            </TabsContent>

            <TabsContent value="my-activity">
              <div className="space-y-6">
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <UserCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Your Outreach Dashboard</p>
                        <p className="text-sm text-muted-foreground">
                          Track your calls, door knocks, and earned rewards. All your organizing activity is 
                          permanently recorded on Arbitrum for verifiable proof of community engagement.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <MyActivitySection user={user} />
              </div>
            </TabsContent>

            <TabsContent value="leaderboard">
              <div className="space-y-6">
                <Card className="border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Trophy className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Top Organizers</p>
                        <p className="text-sm text-muted-foreground">
                          See who's leading the organizing charge! Top phone bankers and canvassers earn exclusive 
                          NFT badges and bonus AXM rewards. The top 3 each month receive special recognition.
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
                <AccordionTrigger>How do I earn AXM through outreach?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Every contact you make is logged on-chain and earns AXM rewards. Phone calls earn 5 AXM each, 
                    door knocks earn 8 AXM each, and positive contacts earn an additional 3 AXM bonus. Your rewards 
                    are automatically sent to your connected wallet after verification.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What are call lists and turfs?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Call lists are organized sets of phone contacts for phone banking campaigns. Turfs are geographic 
                    areas with addresses for door-to-door canvassing. Campaign organizers create these to coordinate 
                    volunteer outreach efforts. You can join existing campaigns or create your own.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How are my contacts verified on-chain?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    When you record a call outcome or door knock, a transaction is created on Arbitrum containing 
                    the contact details, outcome, and timestamp. This creates an immutable record of your organizing 
                    work that can be referenced by campaigns, verified by auditors, or used for reputation building.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I create my own campaigns?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Yes! Any registered user can create call lists or canvassing turfs. Click "New Call List" or 
                    "New Turf" to set up a campaign with your own scripts and targets. As an organizer, you earn 
                    bonus AXM (1 token per contact made by volunteers) for successful campaigns you create.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Dialog open={showCreateListDialog} onOpenChange={setShowCreateListDialog}>
            <CreateCallListDialog onClose={() => setShowCreateListDialog(false)} />
          </Dialog>
          <Dialog open={showCreateTurfDialog} onOpenChange={setShowCreateTurfDialog}>
            <CreateTurfDialog onClose={() => setShowCreateTurfDialog(false)} />
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
}

function PhoneBankingSection({ user, showCreateDialog, setShowCreateDialog }: { 
  user: User | null; 
  showCreateDialog: boolean;
  setShowCreateDialog: (open: boolean) => void;
}) {
  const { data: lists, isLoading } = useQuery<PhoneBankingList[]>({
    queryKey: ["/api/phone-bank-lists"],
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Call Lists</h2>
          <p className="text-sm text-muted-foreground">Phone banking campaigns</p>
        </div>
        {user && (
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-call-list">
            <Plus className="w-4 h-4 mr-2" />
            Create Call List
          </Button>
        )}
      </div>

      {lists && lists.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <CallListCard key={list.id} list={list} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <div className="p-4 rounded-full bg-blue-500/10 w-fit mx-auto mb-4">
            <Phone className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Call Lists Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create a call list to start phone banking. You'll earn 5 AXM per call plus bonuses for organizing!
          </p>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-list">
              <Plus className="w-4 h-4 mr-2" />
              Create First Call List
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

function CallListCard({ list }: { list: PhoneBankingList }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCallDialog, setShowCallDialog] = useState(false);
  
  const completedCalls = list.completedContacts || 0;
  const totalCalls = list.totalContacts || 0;
  const progress = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
  const potentialReward = (totalCalls - completedCalls) * 5;

  return (
    <Card className="overflow-hidden group hover:border-blue-500/30 transition-colors" data-testid={`card-call-list-${list.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant={list.status === "active" ? "default" : "secondary"}
                className={list.status === "active" ? "bg-green-500" : ""}
              >
                {list.status === "active" ? "Active" : list.status}
              </Badge>
              {potentialReward > 0 && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <Coins className="w-3 h-3 mr-1" />
                  ~{potentialReward} AXM
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg truncate group-hover:text-blue-500 transition-colors">{list.name}</CardTitle>
            {list.description && (
              <CardDescription className="line-clamp-2">{list.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500/60" />
            <span>{totalCalls} contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{completedCalls} completed</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {list.script && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <ClipboardList className="w-3 h-3" />
              Script Preview
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">{list.script}</p>
          </div>
        )}
      </CardContent>
      {user && list.status === "active" && (
        <CardFooter className="bg-muted/30 border-t">
          <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600" data-testid={`button-start-calling-${list.id}`}>
                <PhoneCall className="w-4 h-4 mr-2" />
                Start Calling
                <Badge variant="secondary" className="ml-2 bg-white/20">+5 AXM/call</Badge>
              </Button>
            </DialogTrigger>
            <MakeCallDialog list={list} onClose={() => setShowCallDialog(false)} />
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
}

function MakeCallDialog({ list, onClose }: { list: PhoneBankingList; onClose: () => void }) {
  const { toast } = useToast();
  const [currentContact, setCurrentContact] = useState({ name: "John Smith", phone: "(555) 123-4567" });
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const recordCallMutation = useMutation({
    mutationFn: async (data: { outcome: string; notes?: string }) => {
      return apiRequest("POST", `/api/phone-bank-lists/${list.id}/calls`, data);
    },
    onSuccess: () => {
      const reward = outcome.includes("positive") ? 8 : 5;
      toast({ 
        title: "Call recorded on-chain!", 
        description: `You earned ${reward} AXM. Moving to next contact...` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-bank-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-bank-calls"] });
      setNotes("");
      setOutcome("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-500" />
          Phone Banking: {list.name}
        </DialogTitle>
        <DialogDescription>Record the outcome of your call to earn rewards</DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        <Card className="p-4 bg-gradient-to-r from-blue-500/5 to-transparent border-blue-500/20">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-blue-500/20">
              <AvatarFallback className="bg-blue-500/10 text-blue-500">{currentContact.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{currentContact.name}</p>
              <p className="text-sm text-muted-foreground">{currentContact.phone}</p>
            </div>
          </div>
        </Card>

        {list.script && (
          <div className="p-4 border rounded-lg bg-muted/30 max-h-32 overflow-y-auto">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Call Script
            </h4>
            <p className="text-sm whitespace-pre-wrap">{list.script}</p>
          </div>
        )}

        <div>
          <Label>Call Outcome</Label>
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger data-testid="select-call-outcome">
              <SelectValue placeholder="Select outcome..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="answered_positive">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Answered - Positive (+8 AXM)
                </div>
              </SelectItem>
              <SelectItem value="answered_negative">Answered - Negative (+5 AXM)</SelectItem>
              <SelectItem value="answered_undecided">Answered - Undecided (+5 AXM)</SelectItem>
              <SelectItem value="no_answer">No Answer (+5 AXM)</SelectItem>
              <SelectItem value="voicemail">Voicemail (+5 AXM)</SelectItem>
              <SelectItem value="wrong_number">Wrong Number (+5 AXM)</SelectItem>
              <SelectItem value="do_not_call">Do Not Call (+5 AXM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea 
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about the call..."
            className="min-h-20"
            data-testid="input-call-notes"
          />
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          End Session
        </Button>
        <Button 
          onClick={() => recordCallMutation.mutate({ outcome, notes })}
          disabled={recordCallMutation.isPending || !outcome}
          className="bg-gradient-to-r from-blue-500 to-blue-600"
          data-testid="button-record-call"
        >
          {recordCallMutation.isPending ? "Recording..." : "Record & Next"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CreateCallListDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [script, setScript] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/phone-bank-lists", data);
    },
    onSuccess: () => {
      toast({ title: "Call list created!", description: "Your new call list is ready. You'll earn 1 AXM per call made by volunteers!" });
      queryClient.invalidateQueries({ queryKey: ["/api/phone-bank-lists"] });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-500" />
          Create Call List
        </DialogTitle>
        <DialogDescription>Set up a new phone banking campaign with scripts and contacts</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Award className="w-5 h-5 text-blue-500" />
            <div className="text-sm">
              <p className="font-medium">Organizer Rewards</p>
              <p className="text-muted-foreground">Earn 1 AXM per call made by volunteers</p>
            </div>
          </CardContent>
        </Card>

        <div>
          <Label htmlFor="name">List Name *</Label>
          <Input 
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., Voter Outreach - District 5"
            data-testid="input-list-name"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this call list for? What should callers know?"
            data-testid="input-list-description"
          />
        </div>
        <div>
          <Label htmlFor="script">Call Script</Label>
          <Textarea 
            id="script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Enter the script callers should use when making calls..."
            className="min-h-32"
            data-testid="input-list-script"
          />
        </div>
      </div>
      <DialogFooter>
        <Button 
          onClick={() => {
            const trimmedName = name.trim();
            if (!trimmedName) {
              toast({ title: "Error", description: "Name is required", variant: "destructive" });
              return;
            }
            createMutation.mutate({ 
              name: trimmedName, 
              description: description.trim() || undefined, 
              script: script.trim() || undefined 
            });
          }}
          disabled={createMutation.isPending || !name.trim()}
          className="w-full sm:w-auto"
          data-testid="button-submit-list"
        >
          {createMutation.isPending ? "Creating..." : "Create Call List"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CanvassingSection({ user, showCreateDialog, setShowCreateDialog }: { 
  user: User | null;
  showCreateDialog: boolean;
  setShowCreateDialog: (open: boolean) => void;
}) {
  const { data: turfs, isLoading } = useQuery<CanvassingTurf[]>({
    queryKey: ["/api/canvassing-turfs"],
    enabled: !!user,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Canvassing Turfs</h2>
          <p className="text-sm text-muted-foreground">Door-to-door outreach areas</p>
        </div>
        {user && (
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-turf">
            <Plus className="w-4 h-4 mr-2" />
            Create Turf
          </Button>
        )}
      </div>

      {turfs && turfs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {turfs.map((turf) => (
            <TurfCard key={turf.id} turf={turf} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <div className="p-4 rounded-full bg-green-500/10 w-fit mx-auto mb-4">
            <Map className="w-12 h-12 text-green-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Canvassing Turfs Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create a turf to start door-to-door outreach. You'll earn 8 AXM per door knocked plus organizer bonuses!
          </p>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-turf">
              <Plus className="w-4 h-4 mr-2" />
              Create First Turf
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

function TurfCard({ turf }: { turf: CanvassingTurf }) {
  const { user } = useAuth();
  const [showCanvassDialog, setShowCanvassDialog] = useState(false);
  
  const knockedDoors = turf.knockedDoors || 0;
  const totalDoors = turf.totalDoors || 0;
  const progress = totalDoors > 0 ? (knockedDoors / totalDoors) * 100 : 0;
  const potentialReward = (totalDoors - knockedDoors) * 8;

  return (
    <Card className="overflow-hidden group hover:border-green-500/30 transition-colors" data-testid={`card-turf-${turf.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant={turf.status === "active" ? "default" : "secondary"}
                className={turf.status === "active" ? "bg-green-500" : ""}
              >
                {turf.status === "active" ? "Active" : turf.status}
              </Badge>
              {potentialReward > 0 && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Coins className="w-3 h-3 mr-1" />
                  ~{potentialReward} AXM
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg truncate group-hover:text-green-500 transition-colors">{turf.name}</CardTitle>
            {turf.description && (
              <CardDescription className="line-clamp-2">{turf.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-500/60" />
            <span>{totalDoors} doors</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{knockedDoors} knocked</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Coverage</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {turf.addressList && turf.addressList.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4 text-green-500/60" />
            <span className="truncate">{turf.addressList.length} addresses assigned</span>
          </div>
        )}
      </CardContent>
      {user && turf.status === "active" && (
        <CardFooter className="bg-muted/30 border-t">
          <Dialog open={showCanvassDialog} onOpenChange={setShowCanvassDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-green-500 to-green-600" data-testid={`button-start-canvassing-${turf.id}`}>
                <MapPin className="w-4 h-4 mr-2" />
                Start Canvassing
                <Badge variant="secondary" className="ml-2 bg-white/20">+8 AXM/door</Badge>
              </Button>
            </DialogTrigger>
            <CanvassDialog turf={turf} onClose={() => setShowCanvassDialog(false)} />
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
}

function CanvassDialog({ turf, onClose }: { turf: CanvassingTurf; onClose: () => void }) {
  const { toast } = useToast();
  const [currentAddress, setCurrentAddress] = useState("123 Main St");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const recordKnockMutation = useMutation({
    mutationFn: async (data: { outcome: string; notes?: string }) => {
      return apiRequest("POST", `/api/canvassing-turfs/${turf.id}/knocks`, data);
    },
    onSuccess: () => {
      const reward = outcome.includes("positive") ? 11 : 8;
      toast({ 
        title: "Door recorded on-chain!", 
        description: `You earned ${reward} AXM. Moving to next address...` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/canvassing-turfs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/door-knocks"] });
      setNotes("");
      setOutcome("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Map className="w-5 h-5 text-green-500" />
          Canvassing: {turf.name}
        </DialogTitle>
        <DialogDescription>Record your door knock results to earn rewards</DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        <Card className="p-4 bg-gradient-to-r from-green-500/5 to-transparent border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <MapPin className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-medium">{currentAddress}</p>
              <p className="text-sm text-muted-foreground">Current Location</p>
            </div>
          </div>
        </Card>

        {turf.script && (
          <div className="p-4 border rounded-lg bg-muted/30 max-h-32 overflow-y-auto">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
              <ClipboardList className="w-4 h-4 text-green-500" />
              Walk Sheet Instructions
            </h4>
            <p className="text-sm whitespace-pre-wrap">{turf.script}</p>
          </div>
        )}

        <div>
          <Label>Door Outcome</Label>
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger data-testid="select-door-outcome">
              <SelectValue placeholder="Select outcome..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contacted_positive">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Contacted - Positive (+11 AXM)
                </div>
              </SelectItem>
              <SelectItem value="contacted_negative">Contacted - Negative (+8 AXM)</SelectItem>
              <SelectItem value="contacted_undecided">Contacted - Undecided (+8 AXM)</SelectItem>
              <SelectItem value="not_home">Not Home (+8 AXM)</SelectItem>
              <SelectItem value="refused">Refused (+8 AXM)</SelectItem>
              <SelectItem value="moved">Moved/Wrong Address (+8 AXM)</SelectItem>
              <SelectItem value="do_not_contact">Do Not Contact (+8 AXM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea 
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this door..."
            className="min-h-20"
            data-testid="input-door-notes"
          />
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          End Session
        </Button>
        <Button 
          onClick={() => recordKnockMutation.mutate({ outcome, notes })}
          disabled={recordKnockMutation.isPending || !outcome}
          className="bg-gradient-to-r from-green-500 to-green-600"
          data-testid="button-record-knock"
        >
          {recordKnockMutation.isPending ? "Recording..." : "Record & Next"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CreateTurfDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [boundariesText, setBoundariesText] = useState("");
  const [script, setScript] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/canvassing-turfs", data);
    },
    onSuccess: () => {
      toast({ title: "Turf created!", description: "Your new canvassing turf is ready. You'll earn 1 AXM per door knocked by volunteers!" });
      queryClient.invalidateQueries({ queryKey: ["/api/canvassing-turfs"] });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Map className="w-5 h-5 text-green-500" />
          Create Canvassing Turf
        </DialogTitle>
        <DialogDescription>Define a new area for door-to-door outreach</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Award className="w-5 h-5 text-green-500" />
            <div className="text-sm">
              <p className="font-medium">Organizer Rewards</p>
              <p className="text-muted-foreground">Earn 1 AXM per door knocked by volunteers</p>
            </div>
          </CardContent>
        </Card>

        <div>
          <Label htmlFor="name">Turf Name *</Label>
          <Input 
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., Downtown District A"
            data-testid="input-turf-name"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this canvassing effort for?"
            data-testid="input-turf-description"
          />
        </div>
        <div>
          <Label htmlFor="boundariesText">Area Description</Label>
          <Input 
            id="boundariesText"
            value={boundariesText}
            onChange={(e) => setBoundariesText(e.target.value)}
            placeholder="E.g., Main St to Oak Ave, 1st to 5th"
            data-testid="input-turf-boundaries"
          />
        </div>
        <div>
          <Label htmlFor="script">Walk Sheet / Instructions</Label>
          <Textarea 
            id="script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Enter instructions for canvassers when they arrive at each door..."
            className="min-h-32"
            data-testid="input-turf-walksheet"
          />
        </div>
      </div>
      <DialogFooter>
        <Button 
          onClick={() => {
            const trimmedName = name.trim();
            if (!trimmedName) {
              toast({ title: "Error", description: "Name is required", variant: "destructive" });
              return;
            }
            createMutation.mutate({ 
              name: trimmedName, 
              description: description.trim() || undefined, 
              script: script.trim() || undefined 
            });
          }}
          disabled={createMutation.isPending || !name.trim()}
          className="w-full sm:w-auto"
          data-testid="button-submit-turf"
        >
          {createMutation.isPending ? "Creating..." : "Create Turf"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function MyActivitySection({ user }: { user: User | null }) {
  const { data: calls } = useQuery<PhoneBankingContact[]>({
    queryKey: ["/api/phone-banking-contacts", { callerId: user?.id }],
    enabled: !!user,
  });

  const { data: knocks } = useQuery<CanvassingContact[]>({
    queryKey: ["/api/canvassing-contacts", { canvasserId: user?.id }],
    enabled: !!user,
  });

  const totalCalls = calls?.length || 0;
  const totalKnocks = knocks?.length || 0;
  const positiveContacts = (calls?.filter(c => c.outcome?.includes("positive")).length || 0) + 
                          (knocks?.filter(k => k.outcome?.includes("positive")).length || 0);
  const totalRewards = (totalCalls * 5) + (totalKnocks * 8) + (positiveContacts * 3);

  if (!user) {
    return (
      <Card className="text-center p-12 border-dashed">
        <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
          <UserCheck className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Sign In to Track Activity</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Connect your account to view your outreach activity and earned rewards.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Outreach Dashboard</h2>
        <p className="text-sm text-muted-foreground">Your on-chain organizing activity</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Phone className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalCalls}</p>
                <p className="text-sm text-muted-foreground">Phone Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <MapPin className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalKnocks}</p>
                <p className="text-sm text-muted-foreground">Doors Knocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{positiveContacts}</p>
                <p className="text-sm text-muted-foreground">Positive Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Coins className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-500">{totalRewards}</p>
                <p className="text-sm text-muted-foreground">AXM Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-500" />
              Recent Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calls && calls.length > 0 ? (
              <div className="space-y-3">
                {calls.slice(0, 5).map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-blue-500/60" />
                      <div>
                        <p className="text-sm font-medium capitalize">{call.outcome?.replace(/_/g, ' ') || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.calledAt && format(new Date(call.calledAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={call.outcome?.includes("positive") ? "default" : "secondary"}
                      className={call.outcome?.includes("positive") ? "bg-green-500" : ""}
                    >
                      {call.outcome?.includes("positive") ? "+8 AXM" : "+5 AXM"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No calls recorded yet. Start phone banking to earn rewards!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Recent Door Knocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {knocks && knocks.length > 0 ? (
              <div className="space-y-3">
                {knocks.slice(0, 5).map((knock) => (
                  <div key={knock.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-green-500/60" />
                      <div>
                        <p className="text-sm font-medium">{knock.address || "Unknown Address"}</p>
                        <p className="text-xs text-muted-foreground">
                          {knock.contactedAt && format(new Date(knock.contactedAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={knock.outcome?.includes("positive") ? "default" : "secondary"}
                      className={knock.outcome?.includes("positive") ? "bg-green-500" : ""}
                    >
                      {knock.outcome?.includes("positive") ? "+11 AXM" : "+8 AXM"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No door knocks recorded yet. Start canvassing to earn rewards!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LeaderboardSection() {
  const { data: callLeaders } = useQuery<{ userId: string; name: string; count: number }[]>({
    queryKey: ["/api/phone-bank-calls/leaderboard"],
  });

  const { data: canvassLeaders } = useQuery<{ userId: string; name: string; count: number }[]>({
    queryKey: ["/api/door-knocks/leaderboard"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Outreach Leaderboard
        </h2>
        <p className="text-sm text-muted-foreground">Top organizers this month</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-blue-500/20">
          <CardHeader className="border-b bg-gradient-to-r from-blue-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-500" />
              Top Phone Bankers
            </CardTitle>
            <CardDescription>Leaders earn bonus AXM and exclusive NFT badges</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {callLeaders && callLeaders.length > 0 ? (
              <div className="space-y-3">
                {callLeaders.map((leader, index) => (
                  <div key={leader.userId} className={`flex items-center justify-between p-3 rounded-lg border ${
                    index < 3 ? "border-blue-500/20 bg-blue-500/5" : ""
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-yellow-500 text-yellow-950" :
                        index === 1 ? "bg-gray-300 text-gray-700" :
                        index === 2 ? "bg-amber-600 text-amber-950" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index < 3 ? <Award className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className="font-medium">{leader.name}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">{leader.count} calls</Badge>
                      <p className="text-xs text-muted-foreground mt-1">+{leader.count * 5} AXM</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No phone banking activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to top the leaderboard!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardHeader className="border-b bg-gradient-to-r from-green-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Top Canvassers
            </CardTitle>
            <CardDescription>Leaders earn bonus AXM and exclusive NFT badges</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {canvassLeaders && canvassLeaders.length > 0 ? (
              <div className="space-y-3">
                {canvassLeaders.map((leader, index) => (
                  <div key={leader.userId} className={`flex items-center justify-between p-3 rounded-lg border ${
                    index < 3 ? "border-green-500/20 bg-green-500/5" : ""
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-yellow-500 text-yellow-950" :
                        index === 1 ? "bg-gray-300 text-gray-700" :
                        index === 2 ? "bg-amber-600 text-amber-950" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index < 3 ? <Award className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className="font-medium">{leader.name}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">{leader.count} doors</Badge>
                      <p className="text-xs text-muted-foreground mt-1">+{leader.count * 8} AXM</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No canvassing activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to top the leaderboard!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex gap-2 mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
