import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowDownUp, Server } from "lucide-react";

const navItems = [
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/exchange", label: "Exchange", icon: ArrowDownUp },
  { href: "/nodes", label: "DePIN Nodes", icon: Server },
];

export function Web3FeatureNav() {
  const [location] = useLocation();

  return (
    <div 
      className="flex items-center gap-2 mb-6 p-1 bg-muted/50 rounded-lg w-fit flex-wrap" 
      data-testid="nav-web3-features"
    >
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        
        return (
          <Link key={item.href} href={item.href}>
            <Button 
              variant={isActive ? "default" : "ghost"} 
              size="sm" 
              className="gap-2"
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
