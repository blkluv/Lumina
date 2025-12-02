import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Users, Plus, Loader2, Lock, Globe, Coins, Sparkles, Shield, HelpCircle, ChevronDown, TrendingUp, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { GroupWithCreator } from "@shared/schema";

interface GroupWithMembership extends GroupWithCreator {
  isMember: boolean;
}

const categories = [
  "All",
  "Finance",
  "Tech",
  "Art",
  "Gaming",
  "Music",
  "Sports",
  "Lifestyle",
];

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    category: "Tech",
    isPrivate: false,
  });

  const { data: groups = [], isLoading, isError } = useQuery<GroupWithMembership[]>({
    queryKey: ["/api/groups"],
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: typeof newGroup) => {
      const res = await apiRequest("POST", "/api/groups", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreateDialogOpen(false);
      setNewGroup({ name: "", description: "", category: "Tech", isPrivate: false });
      toast({
        title: "Group Created",
        description: "Your new community group has been created successfully!",
      });
      if (data?.id) {
        navigate(`/groups/${data.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async ({ groupId, leave }: { groupId: string; leave: boolean }) => {
      if (leave) {
        await apiRequest("DELETE", `/api/groups/${groupId}/members`, {});
      } else {
        await apiRequest("POST", `/api/groups/${groupId}/members`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your group.",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate(newGroup);
  };

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || group.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const myGroups = groups.filter((group) => group.isMember);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-xl p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/15 to-pink-500/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(34,211,238,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.15),transparent_50%)]" />
          <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMmQzZWUiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmg0djJoMnY0aC0ydjJoLTR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" data-testid="text-groups-title">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Community Groups
                </h1>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  Join decentralized communities and earn AXM tokens for active participation
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg shadow-primary/25" data-testid="button-create-group">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input
                        id="group-name"
                        placeholder="Enter group name..."
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                        data-testid="input-group-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-description">Description</Label>
                      <Textarea
                        id="group-description"
                        placeholder="What is this group about?"
                        value={newGroup.description}
                        onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                        rows={3}
                        data-testid="input-group-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-category">Category</Label>
                      <Select
                        value={newGroup.category}
                        onValueChange={(value) => setNewGroup({ ...newGroup, category: value })}
                      >
                        <SelectTrigger id="group-category" data-testid="select-group-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c !== "All").map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="space-y-0.5">
                        <Label htmlFor="group-private" className="cursor-pointer">Private Group</Label>
                        <p className="text-xs text-muted-foreground">
                          {newGroup.isPrivate 
                            ? "Members need approval to join" 
                            : "Anyone can join this group"}
                        </p>
                      </div>
                      <Switch
                        id="group-private"
                        checked={newGroup.isPrivate}
                        onCheckedChange={(checked) => setNewGroup({ ...newGroup, isPrivate: checked })}
                        data-testid="switch-group-private"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-create-group"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateGroup}
                        disabled={createGroupMutation.isPending || !newGroup.name.trim()}
                        data-testid="button-confirm-create-group"
                      >
                        {createGroupMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Group"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Earn Rewards</span>
                </div>
                <p className="text-sm font-medium mt-1">+50 AXM/week</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground">Governance</span>
                </div>
                <p className="text-sm font-medium mt-1">Vote on Decisions</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-pink-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pink-400" />
                  <span className="text-xs text-muted-foreground">Exclusive</span>
                </div>
                <p className="text-sm font-medium mt-1">NFT Access</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <p className="text-sm font-medium mt-1">{groups.length} Groups</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-groups"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "shrink-0",
                activeCategory === category && "shadow-lg shadow-primary/25"
              )}
              data-testid={`button-category-${category.toLowerCase()}`}
            >
              {category}
            </Button>
          ))}
        </div>

        {user && myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Your Groups</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {myGroups.slice(0, 4).map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-my-group-${group.id}`}>
                    <div
                      className="h-24 bg-gradient-to-br from-primary/30 via-emerald-500/20 to-primary/10"
                      style={group.coverUrl ? { backgroundImage: `url(${group.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.memberCount?.toLocaleString()} members
                          </p>
                        </div>
                        {group.isPrivate && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-4">
            {activeCategory === "All" ? "Discover Groups" : `${activeCategory} Groups`}
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Failed to load groups</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No groups found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredGroups.map((group) => (
                <Card key={group.id} className="overflow-hidden" data-testid={`card-group-${group.id}`}>
                  <Link href={`/groups/${group.id}`}>
                    <div
                      className="h-32 bg-gradient-to-br from-primary/30 via-emerald-500/20 to-primary/10 cursor-pointer"
                      style={group.coverUrl ? { backgroundImage: `url(${group.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                    />
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/groups/${group.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors truncate">
                            {group.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {group.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {group.memberCount?.toLocaleString()}
                          </span>
                          {group.category && (
                            <Badge variant="secondary">{group.category}</Badge>
                          )}
                          {group.isPrivate ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Globe className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <Button
                        variant={group.isMember ? "outline" : "default"}
                        size="sm"
                        className={group.isMember ? "" : "shadow-lg shadow-primary/25"}
                        onClick={() => joinMutation.mutate({ groupId: group.id, leave: group.isMember })}
                        disabled={joinMutation.isPending}
                        data-testid={`button-join-group-${group.id}`}
                      >
                        {joinMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : group.isMember ? (
                          "Joined"
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              About Community Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-are-groups">
                <AccordionTrigger className="text-sm">What are Community Groups?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Community Groups are decentralized spaces where Lumina members gather around shared interests. 
                  Groups operate on the Arbitrum One blockchain, enabling transparent governance, token-gated 
                  access, and on-chain reward distribution. Members can propose ideas, vote on decisions, and 
                  earn AXM tokens for active participation.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="earn-tokens">
                <AccordionTrigger className="text-sm">How do I earn AXM tokens in groups?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Post valuable content that receives engagement (+10 AXM per like)</li>
                    <li>Start discussions and respond to other members (+5 AXM)</li>
                    <li>Participate in group governance votes (+25 AXM per vote)</li>
                    <li>Weekly activity bonus for consistent participation (+50 AXM)</li>
                    <li>Create content that gets featured by admins (+100 AXM)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="create-group">
                <AccordionTrigger className="text-sm">How do I create a group?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Click the "Create Group" button to start your own community. You'll need to provide a name, 
                  description, and category. Group creators receive admin privileges and earn 5% of all AXM 
                  tokens distributed to group members. You can set your group as public or private, and 
                  optionally require NFT ownership for membership.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="private-groups">
                <AccordionTrigger className="text-sm">What are private vs public groups?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p><strong>Public Groups:</strong> Anyone can join and view content. Great for building 
                    large communities and maximizing reach.</p>
                    <p><strong>Private Groups:</strong> Membership requires approval or specific criteria 
                    (e.g., NFT ownership, staking requirements). Content is hidden from non-members. 
                    Ideal for exclusive communities and premium content.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="governance">
                <AccordionTrigger className="text-sm">How does group governance work?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Each group has a decentralized governance system powered by the Arbitrum blockchain. 
                  Members can create proposals for group decisions, and voting power is determined by 
                  AXM tokens staked in the group. Proposals that reach quorum and majority approval are 
                  automatically executed via smart contracts.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Boost Your Earnings</p>
                <p className="text-xs text-muted-foreground">
                  Join multiple groups to maximize your AXM token rewards. Active members in 3+ groups 
                  earn a 20% bonus on all rewards. All transactions are recorded on the Arbitrum One blockchain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
