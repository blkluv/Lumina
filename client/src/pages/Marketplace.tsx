import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { useCart } from "@/lib/cartContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Plus, 
  Package, 
  Coins, 
  Loader2, 
  Image as ImageIcon,
  ExternalLink,
  Truck,
  CheckCircle,
  Star,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Users,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Tag,
  Heart,
  Share2,
  Eye,
  DollarSign,
  Percent,
  Link2,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  BarChart3,
  Gift,
  Crown,
  HelpCircle,
  BookOpen,
  Rocket,
  Globe,
  Lock,
  BadgeCheck,
  Banknote,
  RefreshCcw,
  MessageSquare,
  ThumbsUp,
  Award,
  Layers,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const shopCategories = [
  { value: "all", label: "All Categories" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "electronics", label: "Electronics & Tech" },
  { value: "collectibles", label: "Art & Collectibles" },
  { value: "digital", label: "Digital Products" },
  { value: "home", label: "Home & Living" },
  { value: "beauty", label: "Beauty & Health" },
  { value: "food", label: "Food & Beverages" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

interface Shop {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  category: string;
  walletAddress: string | null;
  status: string;
  isVerified: boolean;
  rating: string | null;
  totalProducts: number | null;
  totalSales: number | null;
  createdAt: Date;
  owner?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface ShopProduct {
  id: string;
  shopId: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  priceAxm: string;
  compareAtPriceAxm: string | null;
  category: string;
  productType: string;
  status: string;
  mediaUrls: string[] | null;
  thumbnailUrl: string | null;
  inventory: number | null;
  isFeatured: boolean | null;
  reviewCount: number | null;
  avgRating: string | null;
  viewCount: number | null;
  createdAt: Date;
  shop?: Shop;
}

interface ShopOrder {
  id: string;
  orderNumber: string;
  shopId: string;
  buyerId: string;
  subtotalAxm: string;
  totalAxm: string;
  status: string;
  shippingAddress: any;
  trackingNumber: string | null;
  createdAt: Date;
  shop?: Shop;
  buyer?: any;
  items?: { product: ShopProduct; quantity: number; priceAxm: string }[];
}

export default function Marketplace() {
  const { user } = useAuth();
  const { address, isConnected, connect } = useWallet();
  const { toast } = useToast();
  const { cartItems, addToCart, removeFromCart, getCartTotal, getItemCount } = useCart();
  const [, navigate] = useLocation();
  
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [newShopData, setNewShopData] = useState({
    name: "",
    description: "",
    category: "other",
    walletAddress: "",
    contactEmail: "",
  });

  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/marketplace/shops", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      const res = await fetch(`/api/marketplace/shops?${params.toString()}`);
      return res.json();
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/marketplace/products", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("status", "active");
      const res = await fetch(`/api/marketplace/products?${params.toString()}`);
      return res.json();
    },
  });

  const { data: featuredProducts = [] } = useQuery<ShopProduct[]>({
    queryKey: ["/api/marketplace/products", "featured"],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/products?featured=true&limit=6`);
      return res.json();
    },
  });

  const { data: myShop } = useQuery<Shop | null>({
    queryKey: ["/api/marketplace/my-shop"],
    enabled: !!user,
  });

  const { data: myOrders = [], isLoading: ordersLoading } = useQuery<ShopOrder[]>({
    queryKey: ["/api/marketplace/orders/my-purchases"],
    enabled: !!user,
  });

  const createShopMutation = useMutation({
    mutationFn: async (data: typeof newShopData) => {
      const res = await apiRequest("POST", "/api/marketplace/shops", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Shop created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-shop"] });
      setShowCreateShop(false);
      setNewShopData({ name: "", description: "", category: "other", walletAddress: "", contactEmail: "" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create shop", description: error.message, variant: "destructive" });
    },
  });

  const handleAddToCart = (product: ShopProduct) => {
    addToCart(product as any);
    toast({ title: "Added to cart" });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "fashion": return <Tag className="h-4 w-4" />;
      case "electronics": return <Zap className="h-4 w-4" />;
      case "collectibles": return <Sparkles className="h-4 w-4" />;
      case "digital": return <Package className="h-4 w-4" />;
      case "home": return <Store className="h-4 w-4" />;
      case "beauty": return <Heart className="h-4 w-4" />;
      case "food": return <Gift className="h-4 w-4" />;
      case "services": return <Users className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold" data-testid="text-marketplace-title">
                      Lumina Marketplace
                    </h1>
                    <p className="text-muted-foreground">
                      Web3-native commerce with ultra-low fees
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowCart(true)}
                  data-testid="button-view-cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({getItemCount()})
                </Button>
                
                {user && !myShop && (
                  <Button 
                    className="gap-2" 
                    onClick={() => {
                      if (address) {
                        setNewShopData(prev => ({ ...prev, walletAddress: address }));
                      }
                      setShowCreateShop(true);
                    }}
                    data-testid="button-create-shop"
                  >
                    <Plus className="h-4 w-4" />
                    Open Shop
                  </Button>
                )}
                
                {myShop && (
                  <Link href={`/marketplace/shop/${myShop.slug}`}>
                    <Button className="gap-2" data-testid="button-my-shop">
                      <Store className="h-4 w-4" />
                      My Shop
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card/50 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Percent className="h-4 w-4 text-green-500" />
                  Platform Fee
                </div>
                <p className="text-2xl font-bold text-green-500">1-2%</p>
                <p className="text-xs text-muted-foreground">vs 6-8% on TikTok Shop</p>
              </div>
              
              <div className="bg-card/50 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Settlement
                </div>
                <p className="text-2xl font-bold text-amber-500">Instant</p>
                <p className="text-xs text-muted-foreground">Direct to wallet</p>
              </div>
              
              <div className="bg-card/50 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Shop as NFT
                </div>
                <p className="text-2xl font-bold text-blue-500">Owned</p>
                <p className="text-xs text-muted-foreground">True ownership</p>
              </div>
              
              <div className="bg-card/50 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Gift className="h-4 w-4 text-purple-500" />
                  Buyer Rewards
                </div>
                <p className="text-2xl font-bold text-purple-500">Earn AXM</p>
                <p className="text-xs text-muted-foreground">Buy-to-earn</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products and shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {shopCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="learn" data-testid="tab-learn">
              <BookOpen className="h-4 w-4 mr-2" />
              Learn
            </TabsTrigger>
            <TabsTrigger value="browse" data-testid="tab-browse">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="shops" data-testid="tab-shops">
              <Store className="h-4 w-4 mr-2" />
              Shops
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <ShoppingBag className="h-4 w-4 mr-2" />
              My Orders
            </TabsTrigger>
            <TabsTrigger value="affiliates" data-testid="tab-affiliates">
              <Link2 className="h-4 w-4 mr-2" />
              Affiliates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-8">
            {featuredProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Featured Products
                  </h2>
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredProducts.slice(0, 6).map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onSelect={setSelectedProduct}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">All Products</h2>
              {productsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">No Products Found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchQuery || selectedCategory !== "all" 
                      ? "Try adjusting your search or filters"
                      : "Be the first to list a product on Lumina Marketplace!"}
                  </p>
                  {user && !myShop && (
                    <Button onClick={() => setShowCreateShop(true)} className="mt-4 gap-2">
                      <Store className="h-4 w-4" />
                      Open Your Shop
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onSelect={setSelectedProduct}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="shops" className="space-y-6">
            {shopsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : shops.length === 0 ? (
              <Card className="p-12 text-center">
                <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Shops Found</h3>
                <p className="text-muted-foreground mt-2">
                  Be the first to open a shop on Lumina Marketplace!
                </p>
                {user && (
                  <Button onClick={() => setShowCreateShop(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Open Your Shop
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map(shop => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {!user ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Sign In Required</h3>
                <p className="text-muted-foreground mt-2">
                  Please sign in to view your orders
                </p>
                <Link href="/login">
                  <Button className="mt-4">Sign In</Button>
                </Link>
              </Card>
            ) : ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Orders Yet</h3>
                <p className="text-muted-foreground mt-2">
                  Start shopping to see your orders here
                </p>
                <Button onClick={() => setActiveTab("browse")} className="mt-4 gap-2">
                  <Package className="h-4 w-4" />
                  Browse Products
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="affiliates" className="space-y-6">
            <Card className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Link2 className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">Affiliate Program</h3>
                  <p className="text-muted-foreground mt-1">
                    Earn commissions by promoting products from your favorite shops.
                    Share your unique affiliate links and earn up to 20% on every sale.
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
                      <p className="font-semibold">Up to 20% Commission</p>
                      <p className="text-sm text-muted-foreground">Earn on every sale</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Zap className="h-6 w-6 text-amber-500 mb-2" />
                      <p className="font-semibold">Instant Payouts</p>
                      <p className="text-sm text-muted-foreground">Direct to your wallet</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-500 mb-2" />
                      <p className="font-semibold">Real-time Analytics</p>
                      <p className="text-sm text-muted-foreground">Track your performance</p>
                    </div>
                  </div>
                  <Button className="mt-4 gap-2">
                    <Link2 className="h-4 w-4" />
                    Browse Affiliate Programs
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="learn" className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 md:p-12">
              <div className="relative z-10">
                <Badge className="mb-4" variant="secondary">
                  <Rocket className="h-3 w-3 mr-1" />
                  Web3 Commerce Revolution
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  The Future of E-Commerce is Here
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mb-6">
                  JoinLumina Marketplace combines the best of Web3 technology with seamless shopping experiences. 
                  Own your shop as an NFT, receive instant payments, and earn rewards on every purchase.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button className="gap-2" onClick={() => setActiveTab("browse")}>
                    <ShoppingBag className="h-4 w-4" />
                    Start Shopping
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setShowCreateShop(true)}>
                    <Store className="h-4 w-4" />
                    Open Your Shop
                  </Button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
            </div>

            {/* How It Works */}
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">How It Works</h3>
                  <p className="text-muted-foreground">Simple steps to get started</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* For Buyers */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                    For Buyers
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold">Connect Your Wallet</h4>
                        <p className="text-sm text-muted-foreground">
                          Connect your MetaMask or compatible Web3 wallet to get started. Make sure you're on Arbitrum One network.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">Browse & Add to Cart</h4>
                        <p className="text-sm text-muted-foreground">
                          Explore products from verified shops. Add items to your cart from multiple shops in a single session.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold">Pay with AXM Tokens</h4>
                        <p className="text-sm text-muted-foreground">
                          Checkout with AXM tokens. Payments are instant and go directly to sellers with only 2% platform fee.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold">Earn Rewards</h4>
                        <p className="text-sm text-muted-foreground">
                          Get AXM tokens back on every purchase through our Buy-to-Earn program. Leave reviews to earn more!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* For Sellers */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Store className="h-5 w-5 text-green-500" />
                    For Sellers
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold">Create Your Shop</h4>
                        <p className="text-sm text-muted-foreground">
                          Click "Open Shop" to create your store. Your shop is minted as an NFT you truly own.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">Customize & Add Products</h4>
                        <p className="text-sm text-muted-foreground">
                          Upload your logo and banner, then list products with up to 20 images each. Set prices in AXM.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold">Receive Instant Payments</h4>
                        <p className="text-sm text-muted-foreground">
                          When customers buy, 98% of the payment goes directly to your wallet. No waiting, no holdbacks.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold">Grow with Affiliates</h4>
                        <p className="text-sm text-muted-foreground">
                          Set up affiliate commissions to let others promote your products and expand your reach.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Why We're Better */}
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Why JoinLumina Beats the Competition</h3>
                  <p className="text-muted-foreground">See how we compare to traditional platforms</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 font-semibold">Feature</th>
                      <th className="text-center py-4 px-4">
                        <div className="flex flex-col items-center">
                          <Badge className="mb-1">JoinLumina</Badge>
                          <span className="text-xs text-muted-foreground">Web3</span>
                        </div>
                      </th>
                      <th className="text-center py-4 px-4 text-muted-foreground">Amazon</th>
                      <th className="text-center py-4 px-4 text-muted-foreground">eBay</th>
                      <th className="text-center py-4 px-4 text-muted-foreground">TikTok Shop</th>
                      <th className="text-center py-4 px-4 text-muted-foreground">Etsy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Platform Fee</td>
                      <td className="text-center py-4 px-4 text-green-500 font-semibold">1-2%</td>
                      <td className="text-center py-4 px-4 text-destructive">8-15%</td>
                      <td className="text-center py-4 px-4 text-destructive">10-15%</td>
                      <td className="text-center py-4 px-4 text-destructive">6-8%</td>
                      <td className="text-center py-4 px-4 text-destructive">6.5%+</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Payment Speed</td>
                      <td className="text-center py-4 px-4 text-green-500 font-semibold">Instant</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">14+ days</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">2-4 days</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">7-14 days</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">3-5 days</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Shop Ownership</td>
                      <td className="text-center py-4 px-4">
                        <Badge variant="secondary" className="text-xs">NFT Owned</Badge>
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Rented</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Rented</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Rented</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Rented</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Buyer Rewards</td>
                      <td className="text-center py-4 px-4">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Limited</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">None</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">None</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">None</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Affiliate System</td>
                      <td className="text-center py-4 px-4">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="text-center py-4 px-4">
                        <CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Limited</td>
                      <td className="text-center py-4 px-4">
                        <CheckCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">None</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Deplatforming Risk</td>
                      <td className="text-center py-4 px-4 text-green-500 font-semibold">None</td>
                      <td className="text-center py-4 px-4 text-destructive">High</td>
                      <td className="text-center py-4 px-4 text-destructive">High</td>
                      <td className="text-center py-4 px-4 text-destructive">High</td>
                      <td className="text-center py-4 px-4 text-destructive">High</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-medium">Dispute Resolution</td>
                      <td className="text-center py-4 px-4">
                        <Badge variant="secondary" className="text-xs">DAO Governed</Badge>
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Platform</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Platform</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Platform</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">Platform</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Key Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="p-3 bg-green-500/10 rounded-xl w-fit mb-4">
                  <Banknote className="h-6 w-6 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Ultra-Low Fees</h4>
                <p className="text-sm text-muted-foreground">
                  Keep 98% of every sale. Our 2% platform fee is the lowest in the industry, 
                  meaning more money in your pocket with every transaction.
                </p>
              </Card>

              <Card className="p-6">
                <div className="p-3 bg-amber-500/10 rounded-xl w-fit mb-4">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Instant Settlement</h4>
                <p className="text-sm text-muted-foreground">
                  No more waiting weeks for payouts. When a customer pays, the AXM tokens 
                  go directly to your wallet in seconds, not days.
                </p>
              </Card>

              <Card className="p-6">
                <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4">
                  <Shield className="h-6 w-6 text-blue-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">True Ownership</h4>
                <p className="text-sm text-muted-foreground">
                  Your shop is an NFT you own. No one can shut you down, ban your account, 
                  or take your business away. You're in complete control.
                </p>
              </Card>

              <Card className="p-6">
                <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-4">
                  <Gift className="h-6 w-6 text-purple-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Buy-to-Earn</h4>
                <p className="text-sm text-muted-foreground">
                  Every purchase earns you AXM tokens. The more you shop, the more you earn. 
                  Turn your spending into investments.
                </p>
              </Card>

              <Card className="p-6">
                <div className="p-3 bg-pink-500/10 rounded-xl w-fit mb-4">
                  <MessageSquare className="h-6 w-6 text-pink-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Review-to-Earn</h4>
                <p className="text-sm text-muted-foreground">
                  Leave honest reviews and earn AXM tokens. Your feedback helps the community 
                  and rewards you for your time.
                </p>
              </Card>

              <Card className="p-6">
                <div className="p-3 bg-cyan-500/10 rounded-xl w-fit mb-4">
                  <Globe className="h-6 w-6 text-cyan-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Global & Borderless</h4>
                <p className="text-sm text-muted-foreground">
                  No geographic restrictions. Sell to anyone, anywhere in the world. 
                  Crypto payments mean no currency conversion hassles.
                </p>
              </Card>
            </div>

            {/* Instructions Accordion */}
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Detailed Instructions</h3>
                  <p className="text-muted-foreground">Step-by-step guides for buyers and sellers</p>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="wallet-setup">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-primary" />
                      Setting Up Your Wallet
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>To use JoinLumina Marketplace, you need a Web3 wallet. Here's how to get started:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Install MetaMask from <strong>metamask.io</strong> as a browser extension or mobile app</li>
                      <li>Create a new wallet and <strong>securely save your recovery phrase</strong></li>
                      <li>Add the Arbitrum One network to MetaMask (Chain ID: 42161)</li>
                      <li>Fund your wallet with ETH for gas fees and AXM for purchases</li>
                      <li>Connect your wallet to JoinLumina by clicking the "Connect Wallet" button</li>
                    </ol>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      <strong>Pro Tip:</strong> Always verify you're on the real JoinLumina website before connecting your wallet. 
                      Never share your recovery phrase with anyone.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="buying">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-blue-500" />
                      How to Buy Products
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Browse the <strong>Products</strong> tab or explore individual <strong>Shops</strong></li>
                      <li>Click on a product to view details, images, and reviews</li>
                      <li>Click <strong>"Add to Cart"</strong> to add items (you can add from multiple shops)</li>
                      <li>Click the <strong>Cart</strong> button to review your items</li>
                      <li>Click <strong>"Checkout"</strong> and confirm the transaction in your wallet</li>
                      <li>Track your order in the <strong>My Orders</strong> tab</li>
                    </ol>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      <strong>Rewards:</strong> After your purchase, you'll automatically receive AXM tokens as part of our 
                      Buy-to-Earn program. Leave a review to earn even more!
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="selling">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Store className="h-5 w-5 text-green-500" />
                      How to Open & Manage Your Shop
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Click <strong>"Open Shop"</strong> and fill in your shop details</li>
                      <li>Enter your wallet address where you want to receive payments</li>
                      <li>Once created, go to <strong>My Shop → Manage</strong> to access your dashboard</li>
                      <li>In the <strong>Products</strong> tab, add new products with titles, descriptions, and up to 20 images</li>
                      <li>In the <strong>Settings</strong> tab, upload your logo and banner to customize your shop</li>
                      <li>View and manage orders in the <strong>Orders</strong> tab</li>
                    </ol>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      <strong>Pro Tip:</strong> High-quality product images and detailed descriptions lead to more sales. 
                      Use all 20 image slots to showcase your products from every angle.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="affiliates">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Link2 className="h-5 w-5 text-purple-500" />
                      Earning with Affiliate Links
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>Earn commissions by promoting products you love:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Browse products and find items with affiliate programs enabled</li>
                      <li>Click the <strong>Share</strong> icon to get your unique affiliate link</li>
                      <li>Share the link on social media, blogs, or with friends</li>
                      <li>When someone purchases through your link, you earn up to <strong>20% commission</strong></li>
                      <li>Commissions are paid instantly to your wallet in AXM tokens</li>
                    </ol>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      <strong>For Shop Owners:</strong> Enable affiliate programs in your shop settings to let others 
                      promote your products. Set commission rates between 1-20%.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="disputes">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-amber-500" />
                      Dispute Resolution & Buyer Protection
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3">
                    <p>Our DAO-governed dispute resolution ensures fair outcomes:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>If you have an issue with an order, first contact the seller directly</li>
                      <li>If unresolved, open a dispute from your order details page</li>
                      <li>Provide evidence (screenshots, messages, photos of products received)</li>
                      <li>The DAO community reviews the case and votes on the outcome</li>
                      <li>Resolutions are enforced on-chain, ensuring transparency</li>
                    </ol>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      <strong>Note:</strong> Most disputes are resolved within 48-72 hours. Both buyers and sellers 
                      can stake AXM tokens to support their case, with the winner receiving the stakes.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

            {/* FAQs */}
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
                  <p className="text-muted-foreground">Quick answers to common questions</p>
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger className="text-left">What is AXM token and where can I get it?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    AXM is the native token of the Lumina ecosystem on Arbitrum One. You can acquire AXM through our 
                    built-in Exchange, by bridging from other networks, or by earning it through Buy-to-Earn and 
                    Review-to-Earn programs. AXM is used for all transactions, rewards, staking, and governance.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-left">Why are fees so low compared to other platforms?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Traditional platforms charge high fees to cover payment processing, fraud prevention, and 
                    middleman costs. Blockchain technology eliminates these intermediaries. Our 2% fee covers 
                    platform maintenance and DAO treasury contributions. There are no hidden fees or payment 
                    processor charges.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-left">What does "shop as NFT" mean?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Your shop is represented as an NFT (Non-Fungible Token) on the Arbitrum blockchain. This means 
                    you truly own it – it can't be arbitrarily shut down by a central authority. You can even 
                    transfer or sell your shop to someone else. The NFT contains your shop's data and earnings rights.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger className="text-left">How does Buy-to-Earn work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Every time you make a purchase, a portion of the transaction is rewarded back to you in AXM 
                    tokens. The exact reward rate varies based on the product, seller settings, and your account 
                    level. These rewards are distributed automatically after purchase confirmation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger className="text-left">Can I sell physical products or only digital?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can sell both! JoinLumina Marketplace supports physical goods, digital products, services, 
                    and NFTs. For physical goods, you're responsible for shipping. Our order system helps you 
                    track shipping addresses and fulfillment status.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6">
                  <AccordionTrigger className="text-left">What happens if I receive a damaged or wrong item?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    First, contact the seller through your order details. If the seller doesn't resolve your issue, 
                    you can open a DAO-governed dispute. Provide evidence of the problem, and the community will 
                    vote on a fair resolution. Successful disputes can result in full or partial refunds.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-7">
                  <AccordionTrigger className="text-left">Is there a minimum amount to start selling?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No minimum! You can create a shop and list products for free. You only pay the 2% platform fee 
                    when you make a sale. There are no monthly fees, listing fees, or subscription costs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-8">
                  <AccordionTrigger className="text-left">How do I get verified as a seller?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Verification is earned through positive reputation. Factors include: completed sales, positive 
                    reviews, response time, and dispute resolution rate. High-performing shops receive a verified 
                    badge that increases buyer trust and visibility in search results.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-9">
                  <AccordionTrigger className="text-left">What network should my wallet be on?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    JoinLumina Marketplace runs on Arbitrum One (Chain ID: 42161). Make sure your wallet is 
                    connected to this network. You'll need ETH for gas fees (very low on Arbitrum) and AXM 
                    tokens for purchases. Our Exchange can help you swap between tokens.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-10">
                  <AccordionTrigger className="text-left">Can I use LIVE shopping features?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! Shop owners can host live shopping events to showcase products in real-time. Buyers can 
                    join live streams, ask questions, and purchase featured items directly during the broadcast. 
                    It's like QVC, but decentralized and interactive.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

            {/* Call to Action */}
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-background text-center">
              <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Ready to Join the Revolution?</h3>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Whether you're a buyer looking for deals and rewards, or a seller seeking freedom and fair fees, 
                JoinLumina Marketplace is your gateway to Web3 commerce.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button size="lg" className="gap-2" onClick={() => setActiveTab("browse")}>
                  <ShoppingBag className="h-4 w-4" />
                  Start Shopping
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={() => setShowCreateShop(true)}>
                  <Store className="h-4 w-4" />
                  Open Your Shop
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateShop} onOpenChange={setShowCreateShop}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Open Your Shop
              </DialogTitle>
              <DialogDescription>
                Create your own shop on Lumina Marketplace and start selling with ultra-low fees.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Shop Name *</Label>
                <Input
                  id="shop-name"
                  placeholder="Enter your shop name"
                  value={newShopData.name}
                  onChange={(e) => setNewShopData({ ...newShopData, name: e.target.value })}
                  data-testid="input-shop-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shop-description">Description</Label>
                <Textarea
                  id="shop-description"
                  placeholder="Tell customers about your shop"
                  value={newShopData.description}
                  onChange={(e) => setNewShopData({ ...newShopData, description: e.target.value })}
                  className="min-h-[100px]"
                  data-testid="input-shop-description"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shop-category">Category *</Label>
                <Select 
                  value={newShopData.category} 
                  onValueChange={(value) => setNewShopData({ ...newShopData, category: value })}
                >
                  <SelectTrigger data-testid="select-shop-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shopCategories.filter(c => c.value !== "all").map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wallet-address">Wallet Address *</Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet-address"
                    placeholder="0x..."
                    value={newShopData.walletAddress}
                    onChange={(e) => setNewShopData({ ...newShopData, walletAddress: e.target.value })}
                    data-testid="input-wallet-address"
                  />
                  {isConnected && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewShopData({ ...newShopData, walletAddress: address || "" })}
                    >
                      Use Connected
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  This is where you'll receive payments for your sales
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="shop@example.com"
                  value={newShopData.contactEmail}
                  onChange={(e) => setNewShopData({ ...newShopData, contactEmail: e.target.value })}
                  data-testid="input-contact-email"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateShop(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createShopMutation.mutate(newShopData)}
                disabled={!newShopData.name || !newShopData.walletAddress || createShopMutation.isPending}
                className="gap-2"
                data-testid="button-submit-create-shop"
              >
                {createShopMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Store className="h-4 w-4" />
                )}
                Create Shop
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Shopping Cart
              </DialogTitle>
            </DialogHeader>
            
            {cartItems.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ScrollArea className="max-h-[300px]">
                  {cartItems.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 py-3 border-b">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {item.product.thumbnailUrl ? (
                          <img 
                            src={item.product.thumbnailUrl} 
                            alt={item.product.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {item.product.priceAxm} AXM
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                        data-testid={`button-remove-cart-${item.product.id}`}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
                
                <Separator />
                
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="flex items-center gap-1 text-primary">
                    <Coins className="h-4 w-4" />
                    {getCartTotal().toFixed(2)} AXM
                  </span>
                </div>
                
                <Link href="/marketplace/checkout">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => setShowCart(false)}
                    data-testid="button-checkout"
                  >
                    <Wallet className="h-4 w-4" />
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          {selectedProduct && (
            <DialogContent className="max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedProduct.thumbnailUrl ? (
                    <img 
                      src={selectedProduct.thumbnailUrl} 
                      alt={selectedProduct.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {getCategoryIcon(selectedProduct.category)} {selectedProduct.category}
                    </Badge>
                    <h2 className="text-2xl font-bold">{selectedProduct.title}</h2>
                    {selectedProduct.shop && (
                      <p className="text-sm text-muted-foreground mt-1">
                        by {selectedProduct.shop.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary flex items-center gap-1">
                      <Coins className="h-6 w-6" />
                      {selectedProduct.priceAxm} AXM
                    </span>
                    {selectedProduct.compareAtPriceAxm && (
                      <span className="text-lg text-muted-foreground line-through">
                        {selectedProduct.compareAtPriceAxm} AXM
                      </span>
                    )}
                  </div>
                  
                  {selectedProduct.description && (
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {selectedProduct.reviewCount && selectedProduct.reviewCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {selectedProduct.avgRating} ({selectedProduct.reviewCount} reviews)
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {selectedProduct.viewCount || 0} views
                    </div>
                  </div>
                  
                  {selectedProduct.inventory !== null && (
                    <Badge variant={selectedProduct.inventory > 0 ? "secondary" : "destructive"}>
                      {selectedProduct.inventory > 0 
                        ? `${selectedProduct.inventory} in stock` 
                        : "Out of stock"}
                    </Badge>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1 gap-2"
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      disabled={selectedProduct.inventory === 0}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button variant="outline" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </MainLayout>
  );
}

function ProductCard({ 
  product, 
  onSelect, 
  onAddToCart 
}: { 
  product: ShopProduct; 
  onSelect: (p: ShopProduct) => void;
  onAddToCart: (p: ShopProduct) => void;
}) {
  return (
    <Card 
      className="overflow-hidden hover-elevate cursor-pointer group"
      onClick={() => onSelect(product)}
      data-testid={`card-product-${product.id}`}
    >
      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
        {product.thumbnailUrl ? (
          <img 
            src={product.thumbnailUrl} 
            alt={product.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground" />
        )}
        {product.isFeatured && (
          <Badge className="absolute top-2 left-2 bg-amber-500">
            <Sparkles className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        {product.compareAtPriceAxm && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            Sale
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{product.title}</h3>
        {product.shop && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {product.shop.name}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-primary flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {product.priceAxm}
            </span>
            <span className="text-xs text-muted-foreground">AXM</span>
          </div>
          {product.avgRating && parseFloat(product.avgRating) > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              {parseFloat(product.avgRating).toFixed(1)}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          size="sm" 
          className="w-full gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
        >
          <ShoppingCart className="h-3 w-3" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}

function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link href={`/marketplace/shop/${shop.slug}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer group" data-testid={`card-shop-${shop.id}`}>
        <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative">
          {shop.bannerUrl && (
            <img 
              src={shop.bannerUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute -bottom-8 left-4">
            <Avatar className="h-16 w-16 border-4 border-background">
              {shop.logoUrl ? (
                <AvatarImage src={shop.logoUrl} />
              ) : (
                <AvatarFallback className="text-xl">
                  {shop.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>
        <CardContent className="pt-10 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{shop.name}</h3>
                {shop.isVerified && (
                  <CheckCircle className="h-4 w-4 text-primary fill-primary" />
                )}
              </div>
              <Badge variant="outline" className="mt-1">
                {shop.category}
              </Badge>
            </div>
            {shop.rating && parseFloat(shop.rating) > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                {parseFloat(shop.rating).toFixed(1)}
              </div>
            )}
          </div>
          {shop.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {shop.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {shop.totalProducts || 0} products
            </div>
            <div className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              {shop.totalSales || 0} sales
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OrderCard({ order }: { order: ShopOrder }) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    paid: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    processing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    shipped: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    delivered: "bg-green-500/10 text-green-600 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <Card className="p-4" data-testid={`card-order-${order.id}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm">{order.orderNumber}</p>
            <Badge className={statusColors[order.status] || ""}>
              {order.status}
            </Badge>
          </div>
          {order.shop && (
            <p className="text-sm text-muted-foreground mt-1">
              from {order.shop.name}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold flex items-center gap-1">
            <Coins className="h-4 w-4 text-primary" />
            {order.totalAxm} AXM
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {order.items && order.items.length > 0 && (
        <div className="mt-4 space-y-2">
          {order.items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                {item.product.thumbnailUrl ? (
                  <img 
                    src={item.product.thumbnailUrl} 
                    alt="" 
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="truncate">{item.product.title}</p>
                <p className="text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p>{item.priceAxm} AXM</p>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-sm text-muted-foreground">
              +{order.items.length - 2} more items
            </p>
          )}
        </div>
      )}
      
      {order.trackingNumber && (
        <div className="mt-4 flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2">
          <Truck className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Tracking:</span>
          <span className="font-mono">{order.trackingNumber}</span>
        </div>
      )}
    </Card>
  );
}
