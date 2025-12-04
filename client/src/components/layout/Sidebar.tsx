import { Link, useLocation } from "wouter";
import { Home, Play, Users, User, Settings, TrendingUp, Coins, Search, MessageCircle, BarChart3, Trophy, Radio, ShoppingBag, ImageIcon, Vote, Lock, Award, Megaphone, Hand, ClipboardList, Phone, Shield, Building2, Gift, GraduationCap, ArrowDownUp, Server, Store } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/foryou", label: "For You", icon: Play },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/search", label: "Discover", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/advocacy", label: "Advocacy", icon: Megaphone },
  { href: "/volunteers", label: "Volunteer", icon: Hand },
  { href: "/action-center", label: "Action Center", icon: ClipboardList },
  { href: "/outreach", label: "Outreach", icon: Phone },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/nfts", label: "NFT Gallery", icon: ImageIcon },
  { href: "/governance", label: "DAO", icon: Vote },
  { href: "/staking", label: "Staking", icon: Lock },
  { href: "/academy", label: "The Forge", icon: GraduationCap },
  { href: "/exchange", label: "Exchange", icon: ArrowDownUp },
  { href: "/nodes", label: "DePIN Nodes", icon: Server },
  { href: "/referrals", label: "Referrals", icon: Gift },
  { href: "/guidelines", label: "Guidelines", icon: Shield },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const { address, isConnected, axmBalance } = useWallet();
  const [location] = useLocation();

  return (
    <aside className={cn("flex flex-col gap-4 p-4", className)}>
      {user && (
        <Card className="overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-primary/30 via-emerald-500/20 to-primary/10" />
          <CardContent className="pt-0 -mt-8">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 border-4 border-card shadow-lg">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-3 font-semibold text-lg" data-testid="text-sidebar-name">
                {user.displayName || user.username}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-sidebar-username">
                @{user.username}
              </p>
              
              {isConnected && (
                <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm font-medium text-primary" data-testid="text-sidebar-axm">
                    {axmBalance} AXM
                  </span>
                </div>
              )}
              
              <div className="mt-4 flex gap-6 text-center">
                <div>
                  <p className="font-semibold" data-testid="text-followers-count">0</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="font-semibold" data-testid="text-following-count">0</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive && "bg-primary/10 text-primary border border-primary/20"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.label}
              </Button>
            </Link>
          );
        })}
        
        {user && (
          <>
            <Link href={`/profile/${user.username}`}>
              <Button
                variant={location.startsWith("/profile") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  location.startsWith("/profile") && "bg-primary/10 text-primary border border-primary/20"
                )}
                data-testid="nav-profile"
              >
                <User className="h-5 w-5" />
                Profile
              </Button>
            </Link>
            <Link href="/rewards">
              <Button
                variant={location === "/rewards" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  location === "/rewards" && "bg-primary/10 text-primary border border-primary/20"
                )}
                data-testid="nav-rewards"
              >
                <Trophy className="h-5 w-5" />
                Rewards
              </Button>
            </Link>
            <Link href="/analytics">
              <Button
                variant={location === "/analytics" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  location === "/analytics" && "bg-primary/10 text-primary border border-primary/20"
                )}
                data-testid="nav-analytics"
              >
                <BarChart3 className="h-5 w-5" />
                Analytics
              </Button>
            </Link>
            {user.isBusinessAccount && (
              <Link href="/business">
                <Button
                  variant={location === "/business" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    location === "/business" && "bg-primary/10 text-primary border border-primary/20"
                  )}
                  data-testid="nav-business"
                >
                  <Building2 className="h-5 w-5" />
                  Business Dashboard
                </Button>
              </Link>
            )}
            <Link href="/settings">
              <Button
                variant={location === "/settings" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  location === "/settings" && "bg-primary/10 text-primary border border-primary/20"
                )}
                data-testid="nav-settings"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Button>
            </Link>
          </>
        )}
      </nav>

      {user && (
        <Link href="/rewards">
          <Card className="mt-auto hover-elevate cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-sm">Rewards</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Points</span>
                    <span className="font-mono font-medium" data-testid="text-reward-points">0</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. AXM</span>
                  <span className="font-mono font-medium text-primary" data-testid="text-est-axm">~0.00</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" data-testid="button-view-rewards">
                  View Rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </aside>
  );
}
