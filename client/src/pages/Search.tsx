import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Users, FileText, UsersRound, TrendingUp, Star, Loader2, Globe, Zap, Shield } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/post/PostCard";
import { useAuth } from "@/lib/authContext";
import { Link } from "wouter";
import type { User, PostWithAuthor, GroupWithCreator } from "@shared/schema";

interface SearchResults {
  users: User[];
  posts: PostWithAuthor[];
  groups: GroupWithCreator[];
}

function UserCard({ user }: { user: User }) {
  return (
    <Link href={`/profile/${user.id}`}>
      <Card className="hover-elevate cursor-pointer transition-all">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {(user.displayName || user.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.displayName || user.username}</p>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{user.bio}</p>
            )}
          </div>
          {user.walletVerified && (
            <Badge variant="outline" className="flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary mr-1" />
              Web3
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function GroupCard({ group }: { group: GroupWithCreator }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover-elevate cursor-pointer transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <UsersRound className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{group.name}</p>
                {group.category && (
                  <Badge variant="secondary" className="flex-shrink-0">{group.category}</Badge>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{group.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {group.memberCount?.toLocaleString()} members
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TrendingCreator({ user, rank }: { user: User; rank: number }) {
  return (
    <Link href={`/profile/${user.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer transition-all" data-testid={`creator-${user.id}`}>
        <span className="w-6 text-center font-bold text-muted-foreground">{rank}</span>
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.displayName || user.username}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
        {user.walletVerified && (
          <div className="w-2 h-2 rounded-full bg-primary" />
        )}
      </div>
    </Link>
  );
}

export default function Search() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: searchResults, isLoading: isSearching } = useQuery<SearchResults>({
    queryKey: ["/api/search", searchQuery, activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const { data: trendingPosts = [] } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/discover/trending"],
  });

  const { data: topCreators = [] } = useQuery<User[]>({
    queryKey: ["/api/discover/creators"],
  });

  const hasResults = searchResults && (
    searchResults.users.length > 0 ||
    searchResults.posts.length > 0 ||
    searchResults.groups.length > 0
  );

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto py-4 space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 p-6 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Discover
                </h1>
                <p className="text-sm text-muted-foreground">
                  Search creators, posts & groups on Arbitrum
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-2 border border-primary/20 text-center">
                <Zap className="h-4 w-4 text-primary mx-auto" />
                <span className="text-xs text-muted-foreground">Fast Search</span>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-2 border border-green-500/20 text-center">
                <Users className="h-4 w-4 text-green-400 mx-auto" />
                <span className="text-xs text-muted-foreground">Web3 Users</span>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-2 border border-cyan-500/20 text-center">
                <Shield className="h-4 w-4 text-cyan-400 mx-auto" />
                <span className="text-xs text-muted-foreground">Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur py-4 -mx-4 px-4 mb-4 rounded-lg">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search creators, posts, groups..."
              className="pl-10 h-12 text-base bg-muted/50 border border-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-page"
            />
          </div>
        </div>

        {searchQuery.length >= 2 ? (
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="all" className="gap-2">
                  All
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="posts" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="groups" className="gap-2">
                  <UsersRound className="h-4 w-4" />
                  Groups
                </TabsTrigger>
              </TabsList>

              {isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !hasResults ? (
                <div className="text-center py-12">
                  <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                  <p className="text-sm text-muted-foreground mt-1">Try different keywords</p>
                </div>
              ) : (
                <>
                  <TabsContent value="all" className="space-y-6">
                    {searchResults?.users.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Users</h3>
                        <div className="grid gap-3">
                          {searchResults.users.slice(0, 3).map((u) => (
                            <UserCard key={u.id} user={u} />
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults?.posts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Posts</h3>
                        <div className="space-y-4">
                          {searchResults.posts.slice(0, 3).map((post) => (
                            <PostCard key={post.id} post={post} />
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults?.groups.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Groups</h3>
                        <div className="grid gap-3">
                          {searchResults.groups.slice(0, 3).map((group) => (
                            <GroupCard key={group.id} group={group} />
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="users" className="space-y-3">
                    {searchResults?.users.map((u) => (
                      <UserCard key={u.id} user={u} />
                    ))}
                  </TabsContent>

                  <TabsContent value="posts" className="space-y-4">
                    {searchResults?.posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </TabsContent>

                  <TabsContent value="groups" className="space-y-3">
                    {searchResults?.groups.map((group) => (
                      <GroupCard key={group.id} group={group} />
                    ))}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No trending posts yet</p>
                ) : (
                  trendingPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="border-b last:border-0 pb-3 last:pb-0">
                      <Link href={`/post/${post.id}`}>
                        <div className="flex items-start gap-3 hover-elevate p-2 -m-2 rounded-lg cursor-pointer">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.author.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {post.author.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">@{post.author.username}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{post.likeCount} likes</span>
                              <span>{post.commentCount} comments</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top Creators
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topCreators.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No creators yet</p>
                ) : (
                  <div className="space-y-1">
                    {topCreators.slice(0, 10).map((creator, index) => (
                      <TrendingCreator key={creator.id} user={creator} rank={index + 1} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
