import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Check, BarChart3, Clock } from "lucide-react";
import type { PollWithOptions } from "@shared/schema";

interface PollDisplayProps {
  poll: PollWithOptions;
  postId?: string;
  onVote?: () => void;
}

export function PollDisplay({ poll, postId, onVote }: PollDisplayProps) {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const hasVoted = !!poll.userVote;
  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      return apiRequest("POST", `/api/polls/${poll.id}/vote`, { optionId });
    },
    onSuccess: () => {
      if (postId) {
        queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/polls", poll.id] });
      toast({ title: "Vote recorded!" });
      onVote?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to vote",
        description: error?.message || "You may have already voted",
        variant: "destructive",
      });
    },
  });

  const handleVote = () => {
    if (selectedOption && !hasVoted && !isExpired) {
      voteMutation.mutate(selectedOption);
    }
  };

  const getPercentage = (voteCount: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((voteCount / (poll.totalVotes || 1)) * 100);
  };

  const formatTimeLeft = () => {
    if (!poll.expiresAt) return null;
    const now = new Date();
    const expires = new Date(poll.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d left`;
    } else if (hours > 0) {
      return `${hours}h left`;
    } else {
      return `${minutes}m left`;
    }
  };

  return (
    <Card className="border-primary/20" data-testid={`poll-${poll.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {poll.question}
          </CardTitle>
          {poll.expiresAt && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeLeft()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.voteCount || 0);
          const isSelected = selectedOption === option.id || poll.userVote?.optionId === option.id;
          
          return (
            <div key={option.id} className="relative">
              {hasVoted || isExpired ? (
                <div 
                  className="relative overflow-hidden rounded-lg border p-3"
                  data-testid={`poll-option-${option.id}`}
                >
                  <Progress 
                    value={percentage} 
                    className="absolute inset-0 h-full rounded-lg opacity-20" 
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {poll.userVote?.optionId === option.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{option.text}</span>
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                </div>
              ) : (
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full justify-start h-auto py-3"
                  onClick={() => setSelectedOption(option.id)}
                  disabled={voteMutation.isPending}
                  data-testid={`poll-option-${option.id}`}
                >
                  {isSelected && <Check className="h-4 w-4 mr-2" />}
                  {option.text}
                </Button>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
          <span>{poll.totalVotes || 0} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
          {!hasVoted && !isExpired && (
            <Button 
              size="sm"
              onClick={handleVote}
              disabled={!selectedOption || voteMutation.isPending}
              data-testid="vote-submit"
            >
              {voteMutation.isPending ? "Voting..." : "Vote"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
