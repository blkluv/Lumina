import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { MobileNav } from "./MobileNav";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  showRightSidebar?: boolean;
  fullWidth?: boolean;
}

export function MainLayout({ children, showRightSidebar = true, fullWidth = false }: MainLayoutProps) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      
      <div className={cn("flex", fullWidth ? "" : "max-w-7xl mx-auto")}>
        {user && (
          <>
            <Sidebar className="hidden lg:flex w-72 sticky top-16 h-[calc(100vh-4rem)] border-r border-border shrink-0 overflow-y-auto" />
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent side="left" className="w-72 p-0 overflow-y-auto" aria-describedby={undefined}>
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <Sidebar className="h-full pt-6 pb-8" />
              </SheetContent>
            </Sheet>
          </>
        )}
        
        <main className={cn(
          "flex-1 min-w-0",
          user && "pb-20 lg:pb-0"
        )}>
          {children}
        </main>
        
        {user && showRightSidebar && (
          <RightSidebar className="hidden xl:flex w-80 sticky top-16 h-[calc(100vh-4rem)] border-l border-border shrink-0 overflow-y-auto" />
        )}
      </div>
      
      {user && <MobileNav />}
    </div>
  );
}
