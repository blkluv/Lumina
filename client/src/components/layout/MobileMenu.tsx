import { Link, useLocation } from "wouter";
import { X, Home, Play, Users, User, Settings, TrendingUp, Coins, Search, MessageCircle, BarChart3, Trophy, Radio, ShoppingBag, ImageIcon, Vote, Lock, Award, Megaphone, Hand, ClipboardList, Phone, Shield, Building2, Gift, GraduationCap, ArrowDownUp, Server, ArrowLeftRight, FileText, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/foryou", label: "For You", icon: Play },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/search", label: "Discover", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/groups", label: "Groups", icon: Users },
];

const communityItems = [
  { href: "/advocacy", label: "Advocacy", icon: Megaphone },
  { href: "/volunteers", label: "Volunteer", icon: Hand },
  { href: "/action-center", label: "Action Center", icon: ClipboardList },
  { href: "/outreach", label: "Outreach", icon: Phone },
];

const web3Items = [
  { href: "/bridge", label: "Bridge", icon: ArrowLeftRight },
  { href: "/academy", label: "The Forge", icon: GraduationCap },
  { href: "/exchange", label: "Exchange", icon: ArrowDownUp },
  { href: "/nodes", label: "DePIN Nodes", icon: Server },
  { href: "/nfts", label: "NFT Gallery", icon: ImageIcon },
  { href: "/governance", label: "DAO", icon: Vote },
  { href: "/staking", label: "Staking", icon: Lock },
];

const otherItems = [
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/referrals", label: "Referrals", icon: Gift },
  { href: "/whitepaper", label: "Whitepaper", icon: FileText },
  { href: "/guidelines", label: "Guidelines", icon: Shield },
];

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const { address, isConnected, axmBalance, connect, disconnect } = useWallet();
  const [location] = useLocation();

  const handleNavClick = () => {
    onOpenChange(false);
  };

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Home }) => {
    const isActive = location === href || (href !== "/" && location.startsWith(href));
    return (
      <Link href={href} onClick={handleNavClick}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 h-11",
            isActive && "bg-primary/10 text-primary border border-primary/20"
          )}
          data-testid={`mobile-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
          {label}
        </Button>
      </Link>
    );
  };

  const NavSection = ({ title, items }: { title: string; items: typeof mainNavItems }) => (
    <div className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      {items.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <span className="font-bold text-primary-foreground">L</span>
            </div>
            Lumina
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-4 space-y-4">
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" data-testid="mobile-menu-name">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </div>
            )}

            {isConnected ? (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium">Wallet Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm" data-testid="mobile-menu-axm">{axmBalance} AXM</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={disconnect} data-testid="mobile-disconnect-wallet">
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full gap-2 border-primary/30" 
                onClick={connect}
                data-testid="mobile-connect-wallet"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}

            <Separator />

            <NavSection title="Main" items={mainNavItems} />
            
            <Separator />
            
            <NavSection title="Community" items={communityItems} />
            
            <Separator />
            
            <NavSection title="Web3" items={web3Items} />
            
            <Separator />
            
            <NavSection title="More" items={otherItems} />

            {user && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Account
                  </h3>
                  <NavItem href={`/profile/${user.id}`} label="Profile" icon={User} />
                  <NavItem href="/rewards" label="Rewards" icon={Trophy} />
                  <NavItem href="/analytics" label="Analytics" icon={BarChart3} />
                  {user.isBusinessAccount && (
                    <NavItem href="/business" label="Business Dashboard" icon={Building2} />
                  )}
                  <NavItem href="/settings" label="Settings" icon={Settings} />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      logout();
                      handleNavClick();
                    }}
                    data-testid="mobile-nav-logout"
                  >
                    <X className="h-5 w-5" />
                    Log out
                  </Button>
                </div>
              </>
            )}

            {!user && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Link href="/login" onClick={handleNavClick}>
                    <Button className="w-full" data-testid="mobile-nav-login">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={handleNavClick}>
                    <Button variant="outline" className="w-full" data-testid="mobile-nav-signup">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
