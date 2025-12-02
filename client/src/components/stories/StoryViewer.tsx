import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Pause, Play } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { User, Story } from "@shared/schema";

interface StoryGroup {
  userId: string;
  user: User;
  stories: Story[];
}

interface StoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
}

const STORY_DURATION = 5000;

export function StoryViewer({ open, onOpenChange, storyGroups, initialGroupIndex }: StoryViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  
  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  
  const viewMutation = useMutation({
    mutationFn: (storyId: string) => apiRequest("POST", `/api/stories/${storyId}/view`),
  });
  
  const deleteMutation = useMutation({
    mutationFn: (storyId: string) => apiRequest("DELETE", `/api/stories/${storyId}`),
    onSuccess: () => {
      toast({ title: "Story deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/feed"] });
      
      if (currentGroup.stories.length <= 1) {
        if (storyGroups.length <= 1) {
          onOpenChange(false);
        } else {
          goToNextGroup();
        }
      }
    },
  });
  
  const goToNextStory = useCallback(() => {
    if (!currentGroup) return;
    
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
      setProgress(0);
    } else {
      if (groupIndex < storyGroups.length - 1) {
        setGroupIndex(groupIndex + 1);
        setStoryIndex(0);
        setProgress(0);
      } else {
        onOpenChange(false);
      }
    }
  }, [storyIndex, groupIndex, currentGroup, storyGroups.length, onOpenChange]);
  
  const goToPrevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = storyGroups[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [storyIndex, groupIndex, storyGroups]);
  
  const goToNextGroup = useCallback(() => {
    if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  }, [groupIndex, storyGroups.length, onOpenChange]);
  
  useEffect(() => {
    if (open) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
      setProgress(0);
      setPaused(false);
    }
  }, [open, initialGroupIndex]);
  
  useEffect(() => {
    if (open && currentStory && user) {
      viewMutation.mutate(currentStory.id);
    }
  }, [open, currentStory?.id, user]);
  
  useEffect(() => {
    if (!open || paused) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (STORY_DURATION / 100));
        if (next >= 100) {
          goToNextStory();
          return 0;
        }
        return next;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [open, paused, goToNextStory]);
  
  if (!currentGroup || !currentStory) return null;
  
  const isOwnStory = user?.id === currentGroup.userId;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[80vh] max-h-[700px] p-0 overflow-hidden bg-black border-none">
        <VisuallyHidden>
          <DialogTitle>Story Viewer</DialogTitle>
          <DialogDescription>View stories from {currentGroup.user.displayName || currentGroup.user.username}</DialogDescription>
        </VisuallyHidden>
        
        <div className="relative h-full flex flex-col">
          <div className="absolute top-0 left-0 right-0 z-20 p-3">
            <div className="flex gap-1 mb-3">
              {currentGroup.stories.map((story, idx) => (
                <div key={story.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all"
                    style={{ 
                      width: idx < storyIndex ? "100%" : idx === storyIndex ? `${progress}%` : "0%" 
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage 
                    src={currentGroup.user.avatarUrl || undefined} 
                    alt={currentGroup.user.displayName || currentGroup.user.username}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(currentGroup.user.displayName || currentGroup.user.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {currentGroup.user.displayName || currentGroup.user.username}
                  </p>
                  <p className="text-xs text-white/70">
                    {currentStory.createdAt && formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setPaused(!paused)}
                  data-testid="button-pause-story"
                >
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                
                {isOwnStory && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => deleteMutation.mutate(currentStory.id)}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete-story"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-close-story"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div 
            className="flex-1 flex items-center justify-center"
            style={{ backgroundColor: currentStory.backgroundColor || "#000" }}
          >
            {currentStory.mediaType === "video" ? (
              <video
                key={currentStory.id}
                src={currentStory.mediaUrl}
                className="max-h-full max-w-full object-contain"
                autoPlay
                muted
                loop
              />
            ) : (
              <img
                key={currentStory.id}
                src={currentStory.mediaUrl}
                alt="Story"
                className="max-h-full max-w-full object-contain"
              />
            )}
            
            {currentStory.caption && (
              <div className="absolute bottom-20 left-4 right-4">
                <p className="text-white text-center text-lg font-medium drop-shadow-lg">
                  {currentStory.caption}
                </p>
              </div>
            )}
          </div>
          
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-1/2 cursor-pointer" onClick={goToPrevStory} />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-1/2 cursor-pointer" onClick={goToNextStory} />
          
          {groupIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white hover:bg-white/20 z-10"
              onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}
              data-testid="button-prev-story"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          
          {groupIndex < storyGroups.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white hover:bg-white/20 z-10"
              onClick={(e) => { e.stopPropagation(); goToNextGroup(); }}
              data-testid="button-next-story"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
          
          {isOwnStory && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/80">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{currentStory.viewCount} views</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
