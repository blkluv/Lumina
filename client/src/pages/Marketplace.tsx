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
} from "lucide-react";

const shopCategories = [
  { value: "all", label: "All Categories" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "electronics", label: "Electronics & Tech" },
  { value: "art", label: "Art & Collectibles" },
  { value: "digital", label: "Digital Products" },
  { value: "home", label: "Home & Living" },
  { value: "beauty", label: "Beauty & Health" },
  { value: "sports", label: "Sports & Outdoors" },
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
  const [, navigate] = useLocation();
  
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [cartItems, setCartItems] = useState<{ product: ShopProduct; quantity: number }[]>([]);
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

  const addToCart = (product: ShopProduct) => {
    const existing = cartItems.find(item => item.product.id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
    }
    toast({ title: "Added to cart" });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => 
      total + parseFloat(item.product.priceAxm) * item.quantity, 0
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "fashion": return "👕";
      case "electronics": return "📱";
      case "art": return "🎨";
      case "digital": return "💿";
      case "home": return "🏠";
      case "beauty": return "💄";
      case "sports": return "⚽";
      case "food": return "🍕";
      case "services": return "🛠️";
      default: return "📦";
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
                  Cart ({cartItems.length})
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
          <TabsList className="grid w-full grid-cols-4">
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
                
                <Button className="w-full gap-2" disabled={!isConnected}>
                  {isConnected ? (
                    <>
                      <Wallet className="h-4 w-4" />
                      Checkout with AXM
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      Connect Wallet to Checkout
                    </>
                  )}
                </Button>
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
                        addToCart(selectedProduct);
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
