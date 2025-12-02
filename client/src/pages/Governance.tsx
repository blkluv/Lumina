import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vote, Plus, Clock, CheckCircle, XCircle, MinusCircle, Users, Coins, HelpCircle, Shield, TrendingUp, Zap, Scale, Wallet, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

interface ProposalWithDetails {
  id: string;
  proposerId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  startsAt: string;
  endsAt: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotingPower: string;
  quorumRequired: string;
  proposer: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  createdAt: string;
  userVote?: { voteType: string } | null;
}

export default function Governance() {
  const { user } = useAuth();
  const { isConnected, address, connect } = useWallet();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tab, setTab] = useState("active");
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithDetails | null>(null);
  const [isSigningVote, setIsSigningVote] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "general",
  });

  const { data: proposals, isLoading } = useQuery<ProposalWithDetails[]>({
    queryKey: ["/api/governance/proposals"],
  });

  const createProposalMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const res = await apiRequest("POST", "/api/governance/proposals", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Proposal Created!", description: "Your proposal is now live for voting" });
      setCreateDialogOpen(false);
      setCreateForm({ title: "", description: "", category: "general" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/proposals"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to create proposal. You need at least 100 AXM staked.", 
        variant: "destructive" 
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, voteType, signature, message }: { proposalId: string; voteType: string; signature?: string; message?: string }) => {
      const res = await apiRequest("POST", `/api/governance/proposals/${proposalId}/vote`, { 
        voteType, 
        signature, 
        message,
        walletAddress: address 
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Vote Cast!", description: "Your vote has been recorded on-chain" });
      queryClient.invalidateQueries({ queryKey: ["/api/governance/proposals"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to vote", 
        variant: "destructive" 
      });
    },
  });

  const handleCreate = () => {
    if (!createForm.title || !createForm.description) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" });
      return;
    }
    createProposalMutation.mutate(createForm);
  };

  const handleVote = async (proposalId: string, voteType: string) => {
    if (!isConnected) {
      toast({ 
        title: "Wallet Required", 
        description: "Please connect your wallet to vote on proposals", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsSigningVote(true);
      
      const message = `Lumina DAO Vote\n\nProposal: ${proposalId}\nVote: ${voteType}\nTimestamp: ${Date.now()}`;
      
      if (window.ethereum && address) {
        try {
          const signature = await window.ethereum.request({
            method: "personal_sign",
            params: [message, address],
          });
          
          voteMutation.mutate({ proposalId, voteType, signature, message });
        } catch (signError: any) {
          if (signError.code === 4001) {
            toast({ 
              title: "Signature Rejected", 
              description: "You need to sign the message to cast your vote", 
              variant: "destructive" 
            });
          } else {
            voteMutation.mutate({ proposalId, voteType });
          }
        }
      } else {
        voteMutation.mutate({ proposalId, voteType });
      }
    } finally {
      setIsSigningVote(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "passed": return "bg-blue-500";
      case "rejected": return "bg-red-500";
      case "pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "treasury": return "bg-yellow-500/20 text-yellow-500";
      case "protocol": return "bg-blue-500/20 text-blue-500";
      case "community": return "bg-purple-500/20 text-purple-500";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  const filteredProposals = proposals?.filter((p) => {
    if (tab === "active") return p.status === "active";
    if (tab === "passed") return p.status === "passed";
    if (tab === "rejected") return p.status === "rejected";
    return true;
  }) || [];

  const renderProposalCard = (proposal: ProposalWithDetails) => {
    const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
    const forPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const againstPercent = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
    const quorumPercent = parseFloat(proposal.totalVotingPower) / parseFloat(proposal.quorumRequired) * 100;
    const isActive = proposal.status === "active";
    const hasVoted = proposal.userVote !== null && proposal.userVote !== undefined;

    return (
      <Card key={proposal.id} className="hover-elevate">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getCategoryColor(proposal.category)}>{proposal.category}</Badge>
                <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
              </div>
              <CardTitle className="text-xl" data-testid={`proposal-title-${proposal.id}`}>
                {proposal.title}
              </CardTitle>
              <CardDescription className="mt-2 line-clamp-2">
                {proposal.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={proposal.proposer.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">{proposal.proposer.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              by {proposal.proposer.displayName || proposal.proposer.username}
            </span>
            <span className="text-sm text-muted-foreground ml-auto">
              <Clock className="inline h-4 w-4 mr-1" />
              {formatDistanceToNow(new Date(proposal.endsAt), { addSuffix: true })}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                For: {proposal.votesFor}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                Against: {proposal.votesAgainst}
              </span>
              <span className="flex items-center gap-1">
                <MinusCircle className="h-4 w-4 text-gray-500" />
                Abstain: {proposal.votesAbstain}
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div className="bg-green-500" style={{ width: `${forPercent}%` }} />
              <div className="bg-red-500" style={{ width: `${againstPercent}%` }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Quorum Progress</span>
              <span>{Math.min(quorumPercent, 100).toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(quorumPercent, 100)} />
          </div>

          {isActive && user && (
            <div className="flex gap-2 pt-2">
              {hasVoted ? (
                <Badge variant="secondary" className="flex-1 justify-center py-2">
                  Voted: {proposal.userVote?.voteType}
                </Badge>
              ) : !isConnected ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={connect}
                  data-testid={`button-connect-wallet-${proposal.id}`}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet to Vote
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
                    onClick={() => handleVote(proposal.id, "for")}
                    disabled={voteMutation.isPending || isSigningVote}
                    data-testid={`button-vote-for-${proposal.id}`}
                  >
                    {(voteMutation.isPending || isSigningVote) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    For
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleVote(proposal.id, "against")}
                    disabled={voteMutation.isPending || isSigningVote}
                    data-testid={`button-vote-against-${proposal.id}`}
                  >
                    {(voteMutation.isPending || isSigningVote) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Against
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleVote(proposal.id, "abstain")}
                    disabled={voteMutation.isPending || isSigningVote}
                    data-testid={`button-vote-abstain-${proposal.id}`}
                  >
                    {(voteMutation.isPending || isSigningVote) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MinusCircle className="mr-2 h-4 w-4" />
                    )}
                    Abstain
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="relative overflow-hidden rounded-xl p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-cyan-500/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.15),transparent_50%)]" />
          <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzYjgyZjYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmg0djJoMnY0aC0ydjJoLTR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" data-testid="text-governance-title">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-white" />
                  </div>
                  DAO Governance
                </h1>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  Vote on proposals and shape the future of Lumina on the blockchain
                </p>
              </div>
              {user && (
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-lg shadow-primary/25" data-testid="button-create-proposal">
                      <Plus className="h-4 w-4" />
                      Create Proposal
                    </Button>
                  </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Proposal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="Proposal title..."
                      data-testid="input-proposal-title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={createForm.category}
                      onValueChange={(value) => setCreateForm({ ...createForm, category: value })}
                    >
                      <SelectTrigger data-testid="select-proposal-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="treasury">Treasury</SelectItem>
                        <SelectItem value="protocol">Protocol</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Describe your proposal in detail..."
                      rows={6}
                      data-testid="input-proposal-description"
                    />
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Requirements</p>
                    <p className="text-muted-foreground">You need at least 100 AXM staked to create a proposal.</p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreate}
                    disabled={createProposalMutation.isPending}
                    data-testid="button-submit-proposal"
                  >
                    {createProposalMutation.isPending ? "Creating..." : "Create Proposal"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Proposals</span>
                </div>
                <p className="text-sm font-medium mt-1">{proposals?.length || 0} Total</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Passed</span>
                </div>
                <p className="text-sm font-medium mt-1">{proposals?.filter(p => p.status === "passed").length || 0}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <p className="text-sm font-medium mt-1">{proposals?.filter(p => p.status === "active").length || 0}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">On-Chain</span>
                </div>
                <p className="text-sm font-medium mt-1">Arbitrum L2</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
            <TabsTrigger value="passed" data-testid="tab-passed">Passed</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </Card>
                ))}
              </div>
            ) : !filteredProposals.length ? (
              <Card className="p-12 text-center">
                <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Proposals</h3>
                <p className="text-muted-foreground mt-2">
                  {tab === "active" ? "No active proposals at the moment" : "No proposals in this category"}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProposals.map(renderProposalCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              DAO Governance Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-dao">
                <AccordionTrigger className="text-sm">What is the Lumina DAO?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  The Lumina DAO (Decentralized Autonomous Organization) is the governance system that allows 
                  LUM token holders to collectively make decisions about the platform's future. All proposals 
                  and votes are recorded on the Arbitrum One blockchain, ensuring transparency and immutability.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-to-vote">
                <AccordionTrigger className="text-sm">How do I vote on proposals?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Connect your wallet and stake AXM tokens</li>
                    <li>Browse active proposals in the governance tab</li>
                    <li>Click "For", "Against", or "Abstain" on any proposal</li>
                    <li>Your vote is weighted by your staked AXM amount</li>
                    <li>Vote is recorded on-chain and cannot be changed</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="create-proposal">
                <AccordionTrigger className="text-sm">How do I create a proposal?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  To create a proposal, you need at least 100 AXM tokens staked. Click "Create Proposal", 
                  fill in the title, category, and detailed description. Once submitted, your proposal 
                  enters a voting period where the community can vote. Proposals that reach quorum and 
                  majority approval are executed automatically.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="voting-power">
                <AccordionTrigger className="text-sm">How is voting power calculated?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Voting power is determined by the amount of AXM tokens you have staked. 1 staked AXM = 1 vote. 
                  You must stake tokens before the proposal is created to be eligible to vote. Delegation is 
                  also supported—you can delegate your voting power to another address without transferring tokens.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="proposal-categories">
                <AccordionTrigger className="text-sm">What are the proposal categories?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p><strong>Treasury:</strong> Proposals related to fund allocation and financial decisions.</p>
                    <p><strong>Protocol:</strong> Technical changes to smart contracts and platform mechanics.</p>
                    <p><strong>Community:</strong> Community initiatives, events, and social features.</p>
                    <p><strong>General:</strong> All other proposals that don't fit specific categories.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Earn Governance Rewards</p>
                <p className="text-xs text-muted-foreground">
                  Participate in governance to earn +25 AXM per vote. Active voters also receive exclusive 
                  governance badges and increased staking rewards.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
