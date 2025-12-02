import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, Users, TrendingUp, Coins, Heart, MessageCircle, Info, Award } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostCard } from "@/components/post/PostCard";
import { PostComposer } from "@/components/post/PostComposer";
import { StoryRing } from "@/components/stories/StoryRing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";
import type { PostWithAuthor } from "@shared/schema";

export default function Feed() {
  const { user } = useAuth();
  
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<{ posts: PostWithAuthor[]; nextCursor?: string }>({
    queryKey: ["/api/posts"],
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    enabled: !!user,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <MainLayout>
      <div
        className="h-[calc(100vh-4rem)] overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/10 border border-cyan-500/20">
                    <Users className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-feed-title">
                      Friends Feed
                    </h1>
                    <p className="text-sm text-muted-foreground">Your decentralized social timeline</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-cyan-500/5 border-cyan-500/20">
                    <Heart className="w-3 h-3 mr-1 text-red-500" />
                    +2 AXM/like
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/5 border-purple-500/20">
                    <MessageCircle className="w-3 h-3 mr-1 text-purple-500" />
                    +5 AXM/comment
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {user && (
            <Card className="mb-4 overflow-hidden border-primary/10 bg-gradient-to-r from-card to-card/80">
              <CardContent className="p-4">
                <StoryRing />
              </CardContent>
            </Card>
          )}
          
          {user && <PostComposer className="mb-6" />}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your personalized feed...</p>
            </div>
          ) : isError ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="space-y-3">
                <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto">
                  <Info className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-muted-foreground font-medium">Failed to load posts</p>
                <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="space-y-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 w-fit mx-auto">
                  <Sparkles className="w-12 h-12 text-cyan-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your Feed is Empty</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Follow some creators to see their content here, or create your first post to share with the community!
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Badge variant="secondary" className="bg-primary/5">
                    <Award className="w-3 h-3 mr-1" />
                    Earn AXM for posting
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/5">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Build your following
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading more...</span>
                </div>
              )}
              
              {!hasNextPage && posts.length > 0 && (
                <Card className="py-6 border-dashed">
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Coins className="w-4 h-4 text-primary" />
                      <span className="text-sm">You've reached the end. Keep engaging to earn AXM!</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
