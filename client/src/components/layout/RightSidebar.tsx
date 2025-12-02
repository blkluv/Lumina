import { Link } from "wouter";
import { TrendingUp, Users, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const trendingCreators = [
  { id: "1", name: "Alex Chen", username: "alexchen", avatar: "", followers: "12.5K" },
  { id: "2", name: "Sarah Kim", username: "sarahk", avatar: "", followers: "8.2K" },
  { id: "3", name: "Marcus Johnson", username: "marcusj", avatar: "", followers: "15.1K" },
];

const activeGroups = [
  { id: "1", name: "DeFi Traders", members: 2340, category: "Finance" },
  { id: "2", name: "NFT Collectors", members: 1876, category: "Art" },
  { id: "3", name: "Smart Contract Devs", members: 3102, category: "Tech" },
];

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  return (
    <aside className={cn("flex flex-col gap-4 p-4", className)}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Trending Creators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingCreators.map((creator, index) => (
            <div key={creator.id} className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-4">
                {index + 1}
              </span>
              <Avatar className="h-9 w-9">
                <AvatarImage src={creator.avatar} alt={creator.name} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {creator.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{creator.name}</p>
                <p className="text-xs text-muted-foreground">
                  {creator.followers} followers
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                data-testid={`button-follow-creator-${creator.id}`}
              >
                Follow
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full text-primary" data-testid="button-view-more-creators">
            View more
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Active Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeGroups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover-elevate cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-emerald-500/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.members.toLocaleString()} members
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {group.category}
                </Badge>
              </div>
            </Link>
          ))}
          <Button variant="ghost" size="sm" className="w-full text-primary" data-testid="button-view-more-groups">
            View more
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Earn AXM</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Create content, engage with others, and earn AXM token rewards on Arbitrum One.
          </p>
          <Button variant="default" size="sm" className="w-full shadow-lg shadow-primary/25" data-testid="button-learn-more">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
