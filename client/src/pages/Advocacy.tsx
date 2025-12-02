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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { FileEdit, Users, DollarSign, Calendar, Plus, MapPin, Clock, Target, TrendingUp, Heart, Check, ExternalLink, Megaphone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { PetitionWithCreator, CampaignWithCreator, EventWithCreator } from "@shared/schema";

export default function Advocacy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("petitions");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<"petition" | "campaign" | "event">("petition");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 p-6 mb-8 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-16 w-16 rounded-full bg-gradient-to-br from-pink-400/15 to-primary/15 blur-xl" />
          
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <Megaphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" data-testid="text-advocacy-title">
                  Advocacy Hub
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create change through petitions, fundraising & events
                </p>
              </div>
            </div>
            {user && (
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-advocacy" className="gap-2">
                <Plus className="w-4 h-4" />
                Create New
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8" data-testid="tabs-advocacy">
            <TabsTrigger value="petitions" data-testid="tab-petitions">
              <FileEdit className="w-4 h-4 mr-2" />
              Petitions
            </TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              <DollarSign className="w-4 h-4 mr-2" />
              Fundraising
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="petitions">
            <PetitionsSection />
          </TabsContent>
          <TabsContent value="campaigns">
            <CampaignsSection />
          </TabsContent>
          <TabsContent value="events">
            <EventsSection />
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Learn how to maximize your advocacy impact</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger data-testid="accordion-faq-petitions">How do petitions work on Lumina?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Petitions allow you to gather digital signatures for causes you care about. 
                    When you create a petition, it's stored on the blockchain for transparency. 
                    Anyone can sign using their Lumina account, and signatures are verified to 
                    prevent duplicates. Once you reach your target, you can deliver the petition 
                    to decision-makers with proof of community support.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger data-testid="accordion-faq-donations">How are AXM token donations processed?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Fundraising campaigns accept donations in AXM tokens via smart contracts. 
                    Funds are held in escrow until the campaign reaches its goal or deadline. 
                    If the goal is met, funds are released to the campaign creator. If not, 
                    donors can request refunds. All transactions are recorded on the Arbitrum 
                    blockchain for complete transparency.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger data-testid="accordion-faq-rewards">Can I earn rewards for advocacy activities?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Yes! Lumina rewards community engagement. You earn LUM tokens for signing 
                    petitions, donating to campaigns, and attending events. Campaign creators 
                    earn additional rewards when their petitions reach milestones or campaigns 
                    meet their goals. Check the Rewards page to track your advocacy points.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger data-testid="accordion-faq-events">How do I organize community events?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    Create an event by clicking "Create New" and selecting the Events tab. 
                    Specify details like date, location (physical or virtual), and capacity. 
                    Attendees can RSVP through the platform, and you'll receive notifications 
                    about new sign-ups. Event check-ins are tracked and can be used for 
                    engagement scoring and reward distribution.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger data-testid="accordion-faq-privacy">Are my advocacy activities private?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    You control your privacy settings. By default, petition signatures are 
                    public to show community support, but you can sign anonymously. Donation 
                    amounts are private unless you choose to display them. Event attendance 
                    is visible to organizers but not publicly shared. Review your privacy 
                    settings in the Settings page.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <CreateDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
          type={createType}
          onTypeChange={setCreateType}
        />
      </div>
    </div>
  );
}

function PetitionsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPetition, setSelectedPetition] = useState<string | null>(null);
  const [signName, setSignName] = useState("");
  const [signComment, setSignComment] = useState("");

  const { data: petitions, isLoading } = useQuery<PetitionWithCreator[]>({
    queryKey: ["/api/petitions"],
  });

  const signMutation = useMutation({
    mutationFn: async ({ petitionId, name, comment }: { petitionId: string; name: string; comment?: string }) => {
      return apiRequest("POST", `/api/petitions/${petitionId}/sign`, { name, comment });
    },
    onSuccess: () => {
      toast({ title: "Thank you!", description: "Your signature has been added to the petition." });
      queryClient.invalidateQueries({ queryKey: ["/api/petitions"] });
      setSelectedPetition(null);
      setSignName("");
      setSignComment("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <PetitionsLoading />;
  }

  if (!petitions?.length) {
    return (
      <Card className="text-center p-12">
        <FileEdit className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No petitions yet</h3>
        <p className="text-muted-foreground">Be the first to start a petition and make your voice heard!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {petitions.map((petition) => (
        <Card key={petition.id} className="overflow-hidden" data-testid={`card-petition-${petition.id}`}>
          {petition.imageUrl && (
            <div className="h-48 overflow-hidden">
              <img src={petition.imageUrl} alt={petition.title} className="w-full h-full object-cover" />
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">{petition.category || "General"}</Badge>
                <CardTitle className="text-xl">{petition.title}</CardTitle>
                <CardDescription className="mt-2 flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={petition.creator.avatarUrl || undefined} />
                    <AvatarFallback>{petition.creator.displayName?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  Started by {petition.creator.displayName || petition.creator.username}
                </CardDescription>
              </div>
              <Badge variant={petition.status === "active" ? "default" : "secondary"}>
                {petition.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{petition.description}</p>
            
            {petition.targetEntity && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Target className="w-4 h-4" />
                To: {petition.targetEntity}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {petition.currentSignatures?.toLocaleString() || 0} signatures
                </span>
                <span className="text-muted-foreground">
                  Goal: {petition.targetSignatures?.toLocaleString() || 1000}
                </span>
              </div>
              <Progress 
                value={((petition.currentSignatures || 0) / (petition.targetSignatures || 1000)) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            {petition.status === "active" && !petition.hasUserSigned && (
              <Dialog open={selectedPetition === petition.id} onOpenChange={(open) => setSelectedPetition(open ? petition.id : null)}>
                <DialogTrigger asChild>
                  <Button className="flex-1" data-testid={`button-sign-petition-${petition.id}`}>
                    <FileEdit className="w-4 h-4 mr-2" />
                    Sign Petition
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign this petition</DialogTitle>
                    <DialogDescription>Add your voice to "{petition.title}"</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="signName">Your Name</Label>
                      <Input 
                        id="signName"
                        value={signName || user?.displayName || user?.username || ""}
                        onChange={(e) => setSignName(e.target.value)}
                        placeholder="Enter your name"
                        data-testid="input-sign-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signComment">Comment (optional)</Label>
                      <Textarea 
                        id="signComment"
                        value={signComment}
                        onChange={(e) => setSignComment(e.target.value)}
                        placeholder="Why are you signing this petition?"
                        data-testid="input-sign-comment"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => signMutation.mutate({ petitionId: petition.id, name: signName || user?.displayName || "Anonymous", comment: signComment })}
                      disabled={signMutation.isPending}
                      data-testid="button-confirm-sign"
                    >
                      {signMutation.isPending ? "Signing..." : "Sign Petition"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {petition.hasUserSigned && (
              <Button variant="outline" disabled className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Signed
              </Button>
            )}
            <Button variant="outline">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function CampaignsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donationMessage, setDonationMessage] = useState("");

  const { data: campaigns, isLoading } = useQuery<CampaignWithCreator[]>({
    queryKey: ["/api/campaigns"],
  });

  const donateMutation = useMutation({
    mutationFn: async ({ campaignId, amount, name, message }: { campaignId: string; amount: number; name: string; message?: string }) => {
      return apiRequest("POST", `/api/campaigns/${campaignId}/donate`, { amount, donorName: name, message });
    },
    onSuccess: () => {
      toast({ title: "Thank you!", description: "Your donation has been recorded." });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setSelectedCampaign(null);
      setDonationAmount("");
      setDonorName("");
      setDonationMessage("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <CampaignsLoading />;
  }

  if (!campaigns?.length) {
    return (
      <Card className="text-center p-12">
        <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No fundraising campaigns yet</h3>
        <p className="text-muted-foreground">Start a campaign to raise funds for a cause you care about!</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="overflow-hidden" data-testid={`card-campaign-${campaign.id}`}>
          {campaign.imageUrl && (
            <div className="h-48 overflow-hidden">
              <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">{campaign.category || "General"}</Badge>
                <CardTitle className="text-lg">{campaign.title}</CardTitle>
              </div>
              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                {campaign.status}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={campaign.creator.avatarUrl || undefined} />
                <AvatarFallback>{campaign.creator.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              {campaign.creator.displayName || campaign.creator.username}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{campaign.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-lg">
                  ${((campaign.currentAmount || 0) / 100).toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  of ${(campaign.goalAmount / 100).toLocaleString()} goal
                </span>
              </div>
              <Progress value={campaign.percentComplete} className="h-2" />
              <p className="text-sm text-muted-foreground text-right">
                {campaign.percentComplete}% funded
              </p>
            </div>

            {campaign.endDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                <Clock className="w-4 h-4" />
                Ends {format(new Date(campaign.endDate), "MMM d, yyyy")}
              </div>
            )}
          </CardContent>
          <CardFooter>
            {campaign.status === "active" && (
              <Dialog open={selectedCampaign === campaign.id} onOpenChange={(open) => setSelectedCampaign(open ? campaign.id : null)}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid={`button-donate-campaign-${campaign.id}`}>
                    <Heart className="w-4 h-4 mr-2" />
                    Donate Now
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Make a Donation</DialogTitle>
                    <DialogDescription>Support "{campaign.title}"</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="donationAmount">Donation Amount ($)</Label>
                      <Input 
                        id="donationAmount"
                        type="number"
                        min="1"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Enter amount"
                        data-testid="input-donation-amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="donorName">Your Name</Label>
                      <Input 
                        id="donorName"
                        value={donorName || user?.displayName || user?.username || ""}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Enter your name"
                        data-testid="input-donor-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="donationMessage">Message (optional)</Label>
                      <Textarea 
                        id="donationMessage"
                        value={donationMessage}
                        onChange={(e) => setDonationMessage(e.target.value)}
                        placeholder="Add a message of support"
                        data-testid="input-donation-message"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => donateMutation.mutate({ 
                        campaignId: campaign.id, 
                        amount: Math.round(parseFloat(donationAmount) * 100), 
                        name: donorName || user?.displayName || "Anonymous",
                        message: donationMessage 
                      })}
                      disabled={donateMutation.isPending || !donationAmount}
                      data-testid="button-confirm-donate"
                    >
                      {donateMutation.isPending ? "Processing..." : `Donate $${donationAmount || "0"}`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function EventsSection() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<EventWithCreator[]>({
    queryKey: ["/api/events"],
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      return apiRequest("POST", `/api/events/${eventId}/rsvp`, { status });
    },
    onSuccess: () => {
      toast({ title: "RSVP confirmed!", description: "We'll see you there!" });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("DELETE", `/api/events/${eventId}/rsvp`);
    },
    onSuccess: () => {
      toast({ title: "RSVP cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  if (isLoading) {
    return <EventsLoading />;
  }

  if (!events?.length) {
    return (
      <Card className="text-center p-12">
        <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No events yet</h3>
        <p className="text-muted-foreground">Create an event to bring your community together!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden" data-testid={`card-event-${event.id}`}>
          <div className="flex flex-col md:flex-row">
            {event.imageUrl && (
              <div className="md:w-48 h-32 md:h-auto overflow-hidden flex-shrink-0">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge variant="secondary" className="mb-2">{event.category || "General"}</Badge>
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                </div>
                <Badge variant={event.status === "upcoming" ? "default" : "secondary"}>
                  {event.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {event.currentAttendees || 0} attending
                  {event.maxAttendees && ` / ${event.maxAttendees} spots`}
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={event.creator.avatarUrl || undefined} />
                    <AvatarFallback>{event.creator.displayName?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  Hosted by {event.creator.displayName || event.creator.username}
                </div>
                <div className="flex gap-2">
                  {event.userRsvp ? (
                    <Button 
                      variant="outline" 
                      onClick={() => cancelRsvpMutation.mutate(event.id)}
                      disabled={cancelRsvpMutation.isPending}
                      data-testid={`button-cancel-rsvp-${event.id}`}
                    >
                      Cancel RSVP
                    </Button>
                  ) : event.status === "upcoming" && user && (
                    <Button 
                      onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "going" })}
                      disabled={rsvpMutation.isPending || ((event.spotsRemaining ?? null) !== null && (event.spotsRemaining ?? 0) <= 0)}
                      data-testid={`button-rsvp-${event.id}`}
                    >
                      {(event.spotsRemaining ?? null) !== null && (event.spotsRemaining ?? 0) <= 0 ? "Event Full" : "RSVP"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CreateDialog({ open, onOpenChange, type, onTypeChange }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  type: "petition" | "campaign" | "event";
  onTypeChange: (type: "petition" | "campaign" | "event") => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    targetSignatures: 1000,
    targetEntity: "",
    goalAmount: 1000,
    startDate: "",
    location: "",
    maxAttendees: "",
  });

  const createPetitionMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/petitions", data),
    onSuccess: () => {
      toast({ title: "Success!", description: "Your petition has been created." });
      queryClient.invalidateQueries({ queryKey: ["/api/petitions"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/campaigns", data),
    onSuccess: () => {
      toast({ title: "Success!", description: "Your campaign has been created." });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/events", data),
    onSuccess: () => {
      toast({ title: "Success!", description: "Your event has been created." });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      targetSignatures: 1000,
      targetEntity: "",
      goalAmount: 1000,
      startDate: "",
      location: "",
      maxAttendees: "",
    });
  };

  const handleSubmit = () => {
    if (type === "petition") {
      createPetitionMutation.mutate({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        targetSignatures: formData.targetSignatures,
        targetEntity: formData.targetEntity,
      });
    } else if (type === "campaign") {
      createCampaignMutation.mutate({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        goalAmount: formData.goalAmount * 100,
      });
    } else if (type === "event") {
      createEventMutation.mutate({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startDate: formData.startDate,
        location: formData.location,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
      });
    }
  };

  const isPending = createPetitionMutation.isPending || createCampaignMutation.isPending || createEventMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
          <DialogDescription>Choose what you want to create</DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => onTypeChange(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="petition">Petition</TabsTrigger>
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
            <TabsTrigger value="event">Event</TabsTrigger>
          </TabsList>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={type === "petition" ? "What change do you want to make?" : type === "campaign" ? "What are you raising funds for?" : "Event name"}
                data-testid="input-create-title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell your story..."
                rows={3}
                data-testid="input-create-description"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input 
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Environment, Health, Community"
                data-testid="input-create-category"
              />
            </div>

            {type === "petition" && (
              <>
                <div>
                  <Label htmlFor="targetSignatures">Signature Goal</Label>
                  <Input 
                    id="targetSignatures"
                    type="number"
                    value={formData.targetSignatures}
                    onChange={(e) => setFormData({ ...formData, targetSignatures: parseInt(e.target.value) || 1000 })}
                    data-testid="input-target-signatures"
                  />
                </div>
                <div>
                  <Label htmlFor="targetEntity">Who should see this petition?</Label>
                  <Input 
                    id="targetEntity"
                    value={formData.targetEntity}
                    onChange={(e) => setFormData({ ...formData, targetEntity: e.target.value })}
                    placeholder="e.g., Mayor, CEO, Government"
                    data-testid="input-target-entity"
                  />
                </div>
              </>
            )}

            {type === "campaign" && (
              <div>
                <Label htmlFor="goalAmount">Fundraising Goal ($)</Label>
                <Input 
                  id="goalAmount"
                  type="number"
                  value={formData.goalAmount}
                  onChange={(e) => setFormData({ ...formData, goalAmount: parseInt(e.target.value) || 1000 })}
                  data-testid="input-goal-amount"
                />
              </div>
            )}

            {type === "event" && (
              <>
                <div>
                  <Label htmlFor="startDate">Date & Time</Label>
                  <Input 
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Address or 'Online'"
                    data-testid="input-location"
                  />
                </div>
                <div>
                  <Label htmlFor="maxAttendees">Max Attendees (optional)</Label>
                  <Input 
                    id="maxAttendees"
                    type="number"
                    value={formData.maxAttendees}
                    onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                    placeholder="Leave blank for unlimited"
                    data-testid="input-max-attendees"
                  />
                </div>
              </>
            )}
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={isPending || !formData.title || !formData.description}
            data-testid="button-create-submit"
          >
            {isPending ? "Creating..." : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PetitionsLoading() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CampaignsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <Skeleton className="h-48 w-full" />
          <CardHeader>
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventsLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-48 h-32" />
            <div className="flex-1">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
