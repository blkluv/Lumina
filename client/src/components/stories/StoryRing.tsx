import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StoryViewer } from "./StoryViewer";
import { StoryCreator } from "./StoryCreator";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";
import type { User, Story } from "@shared/schema";

interface StoryGroup {
  userId: string;
  user: User;
  stories: Story[];
}

interface StoryRingProps {
  className?: string;
}

export function StoryRing({ className }: StoryRingProps) {
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  
  const { data: storyFeed = [], isLoading } = useQuery<StoryGroup[]>({
    queryKey: ["/api/stories/feed"],
    enabled: !!user,
    refetchInterval: 30000,
  });
  
  const openStory = (index: number) => {
    setSelectedGroupIndex(index);
    setViewerOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <>
      <ScrollArea className={cn("w-full", className)}>
        <div className="flex gap-4 pb-4">
          {user && (
            <button
              onClick={() => setCreatorOpen(true)}
              className="flex flex-col items-center gap-1.5 group"
              data-testid="button-add-story"
            >
              <div className="relative">
                <div className="p-0.5 rounded-full bg-muted">
                  <Avatar className="h-16 w-16 border-2 border-background">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                      {(user.displayName || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-primary text-primary-foreground">
                  <Plus className="h-3 w-3" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Add Story
              </span>
            </button>
          )}
          
          {storyFeed.map((group, index) => (
            <button
              key={group.userId}
              onClick={() => openStory(index)}
              className="flex flex-col items-center gap-1.5 group"
              data-testid={`story-ring-${group.userId}`}
            >
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary via-emerald-400 to-primary">
                <Avatar className="h-16 w-16 border-2 border-background">
                  <AvatarImage 
                    src={group.user.avatarUrl || undefined} 
                    alt={group.user.displayName || group.user.username} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {(group.user.displayName || group.user.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors max-w-[4.5rem] truncate">
                {group.user.displayName || group.user.username}
              </span>
            </button>
          ))}
          
          {storyFeed.length === 0 && user && (
            <div className="flex items-center justify-center py-2 px-4">
              <p className="text-sm text-muted-foreground">
                No stories yet. Be the first to share!
              </p>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      <StoryViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        storyGroups={storyFeed}
        initialGroupIndex={selectedGroupIndex}
      />
      
      <StoryCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
      />
    </>
  );
}
