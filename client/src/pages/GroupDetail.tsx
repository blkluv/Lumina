import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Lock, Globe, ArrowLeft, Settings, Loader2, Crown, Shield, Ban, MoreVertical, UserMinus, AlertTriangle, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostComposer } from "@/components/post/PostComposer";
import { PostCard } from "@/components/post/PostCard";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GroupWithCreator, PostWithAuthor, User } from "@shared/schema";

interface GroupMember extends User {
  role: "admin" | "moderator" | "member";
  joinedAt: string;
}

interface GroupDetailData extends GroupWithCreator {
  isMember: boolean;
  isCreator: boolean;
  posts: PostWithAuthor[];
  members?: GroupMember[];
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("posts");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editedGroup, setEditedGroup] = useState<{name: string; description: string; isPrivate: boolean}>({
    name: "",
    description: "",
    isPrivate: false,
  });

  const { data: group, isLoading, isError } = useQuery<GroupDetailData>({
    queryKey: ["/api/groups", id],
    enabled: !!id,
  });

  const { data: members = [] } = useQuery<GroupMember[]>({
    queryKey: ["/api/groups", id, "members"],
    enabled: !!id && activeTab === "members",
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/groups/${id}/members`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Joined Group", description: "You're now a member of this group!" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/groups/${id}/members`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Left Group", description: "You've left this group." });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: typeof editedGroup) => {
      await apiRequest("PATCH", `/api/groups/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", id] });
      setIsSettingsOpen(false);
      toast({ title: "Group Updated", description: "Group settings have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update group settings.", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/groups/${id}/members/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", id] });
      toast({ title: "Member Removed", description: "The member has been removed from the group." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
    },
  });

  const promoteModeratorMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/groups/${id}/members/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", id, "members"] });
      toast({ title: "Role Updated", description: "Member role has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update member role.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError || !group) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Group not found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/groups")}>
                Back to Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2"
          onClick={() => navigate("/groups")}
          data-testid="button-back-groups"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Button>

        <Card className="overflow-hidden mb-6">
          <div
            className="h-32 sm:h-48 bg-gradient-to-br from-primary/30 via-emerald-500/20 to-primary/10"
            style={group.coverUrl ? { backgroundImage: `url(${group.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          />
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold" data-testid="text-group-name">{group.name}</h1>
                  {group.isPrivate ? (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Globe className="h-3 w-3" />
                      Public
                    </Badge>
                  )}
                </div>
                {group.description && (
                  <p className="text-muted-foreground mb-4" data-testid="text-group-description">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span data-testid="text-member-count">{group.memberCount?.toLocaleString() || 0} members</span>
                  </div>
                  {group.category && (
                    <Badge variant="outline">{group.category}</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {user && !group.isCreator && (
                  group.isMember ? (
                    <Button
                      variant="outline"
                      onClick={() => leaveMutation.mutate()}
                      disabled={leaveMutation.isPending}
                      data-testid="button-leave-group"
                    >
                      {leaveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Leave Group"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => joinMutation.mutate()}
                      disabled={joinMutation.isPending}
                      className="shadow-lg shadow-primary/25"
                      data-testid="button-join-group"
                    >
                      {joinMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Join Group"
                      )}
                    </Button>
                  )
                )}
                {group.isCreator && (
                  <Dialog open={isSettingsOpen} onOpenChange={(open) => {
                    setIsSettingsOpen(open);
                    if (open && group) {
                      setEditedGroup({
                        name: group.name,
                        description: group.description || "",
                        isPrivate: group.isPrivate || false,
                      });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" data-testid="button-group-settings">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Group Settings</DialogTitle>
                        <DialogDescription>
                          Manage your group settings and preferences.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-group-name">Group Name</Label>
                          <Input
                            id="edit-group-name"
                            value={editedGroup.name}
                            onChange={(e) => setEditedGroup({ ...editedGroup, name: e.target.value })}
                            data-testid="input-edit-group-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-group-description">Description</Label>
                          <Textarea
                            id="edit-group-description"
                            value={editedGroup.description}
                            onChange={(e) => setEditedGroup({ ...editedGroup, description: e.target.value })}
                            rows={3}
                            data-testid="input-edit-group-description"
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                          <div className="space-y-0.5">
                            <Label htmlFor="edit-group-private" className="cursor-pointer">Private Group</Label>
                            <p className="text-xs text-muted-foreground">
                              {editedGroup.isPrivate 
                                ? "Members need approval to join" 
                                : "Anyone can join this group"}
                            </p>
                          </div>
                          <Switch
                            id="edit-group-private"
                            checked={editedGroup.isPrivate}
                            onCheckedChange={(checked) => setEditedGroup({ ...editedGroup, isPrivate: checked })}
                            data-testid="switch-edit-group-private"
                          />
                        </div>
                      </div>
                      <DialogFooter className="pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsSettingsOpen(false)}
                          data-testid="button-cancel-settings"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => updateGroupMutation.mutate(editedGroup)}
                          disabled={updateGroupMutation.isPending}
                          data-testid="button-save-settings"
                        >
                          {updateGroupMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {group.createdBy && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Created by</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={group.createdBy.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {(group.createdBy.displayName || group.createdBy.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {group.createdBy.displayName || group.createdBy.username}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="posts" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4 pt-4">
            {user && group.isMember && (
              <Card>
                <CardContent className="p-4">
                  <PostComposer groupId={group.id} />
                </CardContent>
              </Card>
            )}
            
            {group.posts && group.posts.length > 0 ? (
              group.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {group.isMember
                      ? "No posts yet. Be the first to share something!"
                      : "Join this group to see and create posts."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Group Members
                  </span>
                  <Badge variant="secondary">{group.memberCount || 0} members</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {members.length > 0 ? (
                      members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`member-row-${member.id}`}
                        >
                          <Link href={`/profile/${member.id}`} className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback>
                                {(member.displayName || member.username).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {member.displayName || member.username}
                                </span>
                                {member.role === "admin" && (
                                  <Badge variant="default" className="gap-1 text-xs">
                                    <Crown className="h-3 w-3" />
                                    Admin
                                  </Badge>
                                )}
                                {member.role === "moderator" && (
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <Shield className="h-3 w-3" />
                                    Mod
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                @{member.username}
                              </span>
                            </div>
                          </Link>

                          {group.isCreator && member.id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-member-options-${member.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {member.role === "member" && (
                                  <DropdownMenuItem
                                    onClick={() => promoteModeratorMutation.mutate({ userId: member.id, role: "moderator" })}
                                    data-testid={`button-promote-${member.id}`}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Make Moderator
                                  </DropdownMenuItem>
                                )}
                                {member.role === "moderator" && (
                                  <DropdownMenuItem
                                    onClick={() => promoteModeratorMutation.mutate({ userId: member.id, role: "member" })}
                                    data-testid={`button-demote-${member.id}`}
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Remove Moderator
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => removeMemberMutation.mutate(member.id)}
                                  data-testid={`button-remove-${member.id}`}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Remove from Group
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No members to display</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
