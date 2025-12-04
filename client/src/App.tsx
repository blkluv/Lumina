import { Switch, Route, Redirect } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/themeContext";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { WalletProvider } from "@/lib/walletContext";
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Feed from "@/pages/Feed";
import ForYou from "@/pages/ForYou";
import Profile from "@/pages/Profile";
import Groups from "@/pages/Groups";
import GroupDetail from "@/pages/GroupDetail";
import Settings from "@/pages/Settings";
import Search from "@/pages/Search";
import Messages from "@/pages/Messages";
import Analytics from "@/pages/Analytics";
import Compose from "@/pages/Compose";
import Rewards from "@/pages/Rewards";
import Live from "@/pages/Live";
import LiveStreamViewer from "@/pages/LiveStreamViewer";
import Shop from "@/pages/Shop";
import NFTs from "@/pages/NFTs";
import Governance from "@/pages/Governance";
import Staking from "@/pages/Staking";
import Admin from "@/pages/Admin";
import Referrals from "@/pages/Referrals";
import Advocacy from "@/pages/Advocacy";
import Volunteers from "@/pages/Volunteers";
import ActionCenter from "@/pages/ActionCenter";
import PhoneBanking from "@/pages/PhoneBanking";
import Guidelines from "@/pages/Guidelines";
import BusinessDashboard from "@/pages/BusinessDashboard";
import Whitepaper from "@/pages/Whitepaper";
import Treasury from "@/pages/Treasury";
import Bridge from "@/pages/Bridge";
import Academy from "@/pages/Academy";
import CourseDetail from "@/pages/CourseDetail";
import LessonView from "@/pages/LessonView";
import AdminAcademy from "@/pages/AdminAcademy";
import Exchange from "@/pages/Exchange";
import Nodes from "@/pages/Nodes";
import Marketplace from "@/pages/Marketplace";
import ShopDetail from "@/pages/ShopDetail";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import { CartProvider } from "@/lib/cartContext";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/feed">
        {() => <ProtectedRoute component={Feed} />}
      </Route>
      <Route path="/foryou" component={ForYou} />
      <Route path="/profile/:username" component={Profile} />
      <Route path="/groups" component={Groups} />
      <Route path="/groups/:id" component={GroupDetail} />
      <Route path="/compose" component={Compose} />
      <Route path="/search" component={Search} />
      <Route path="/messages/:id?" component={() => <ProtectedRoute component={Messages} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/rewards" component={() => <ProtectedRoute component={Rewards} />} />
      <Route path="/live" component={Live} />
      <Route path="/live/:id" component={LiveStreamViewer} />
      <Route path="/shop" component={Shop} />
      <Route path="/nfts" component={NFTs} />
      <Route path="/governance" component={Governance} />
      <Route path="/staking" component={() => <ProtectedRoute component={Staking} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
      <Route path="/referrals" component={() => <ProtectedRoute component={Referrals} />} />
      <Route path="/advocacy" component={Advocacy} />
      <Route path="/volunteers" component={Volunteers} />
      <Route path="/action-center" component={ActionCenter} />
      <Route path="/outreach" component={() => <ProtectedRoute component={PhoneBanking} />} />
      <Route path="/guidelines" component={Guidelines} />
      <Route path="/whitepaper" component={Whitepaper} />
      <Route path="/treasury" component={Treasury} />
      <Route path="/bridge" component={Bridge} />
      <Route path="/academy" component={Academy} />
      <Route path="/academy/course/:courseId/lesson/:lessonId" component={LessonView} />
      <Route path="/academy/course/:id" component={CourseDetail} />
      <Route path="/admin/academy" component={AdminAcademy} />
      <Route path="/exchange" component={Exchange} />
      <Route path="/nodes" component={Nodes} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/marketplace/shop/:slug" component={ShopDetail} />
      <Route path="/marketplace/product/:id" component={ProductDetail} />
      <Route path="/marketplace/checkout" component={() => <ProtectedRoute component={Checkout} />} />
      <Route path="/business" component={() => <ProtectedRoute component={BusinessDashboard} />} />
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing Google Analytics Measurement ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </CartProvider>
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
