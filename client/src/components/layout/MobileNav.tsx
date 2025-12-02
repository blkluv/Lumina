import { Link, useLocation } from "wouter";
import { Home, Play, PlusCircle, Search, User } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/foryou", label: "For You", icon: Play },
  { href: "/compose", label: "Create", icon: PlusCircle, isCreate: true },
  { href: "/search", label: "Discover", icon: Search },
];

export function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          
          if (item.isCreate) {
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className="flex flex-col items-center justify-center w-14 h-14 -mt-4 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  data-testid="mobile-nav-create"
                >
                  <item.icon className="h-6 w-6" />
                </button>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 py-2",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="text-xs">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            </Link>
          );
        })}
        
        <Link href={`/profile/${user.id}`}>
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 py-2",
              location.startsWith("/profile") ? "text-primary" : "text-muted-foreground"
            )}
            data-testid="mobile-nav-profile"
          >
            <User className={cn("h-5 w-5", location.startsWith("/profile") && "text-primary")} />
            <span className="text-xs">Profile</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}
