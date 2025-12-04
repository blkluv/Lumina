import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Package, 
  Coins, 
  Loader2, 
  Image as ImageIcon,
  Star,
  ShoppingCart,
  Users,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  Heart,
  Share2,
  Shield,
  MessageSquare,
  Settings,
  ChevronRight,
} from "lucide-react";

interface Shop {
  id: number;
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
  createdAt: string;
  owner?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface ShopProduct {
  id: number;
  shopId: number;
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
  createdAt: string;
}

export default function ShopDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("products");

  const { data: shop, isLoading: shopLoading, error: shopError } = useQuery<Shop>({
    queryKey: ["/api/marketplace/shops", slug],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shops/slug/${slug}`);
      if (!res.ok) throw new Error("Shop not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/marketplace/products", "shop", shop?.id],
    queryFn: async () => {
      if (!shop?.id) return [];
      const res = await fetch(`/api/marketplace/products?shopId=${shop.id}&status=active`);
      return res.json();
    },
    enabled: !!shop?.id,
  });

  const isOwner = user?.id === shop?.ownerId;

  if (shopLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (shopError || !shop) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12 text-center">
          <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Shop Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The shop you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/marketplace">
            <Button className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        <div className="relative rounded-2xl overflow-hidden">
          <div 
            className="h-48 md:h-64 bg-gradient-to-br from-primary/30 via-primary/20 to-background"
            style={shop.bannerUrl ? { 
              backgroundImage: `url(${shop.bannerUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
          
          <div className="relative px-6 pb-6 -mt-20">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={shop.logoUrl || undefined} />
                <AvatarFallback className="text-3xl bg-primary/20">
                  <Store className="h-12 w-12 text-primary" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold" data-testid="text-shop-name">
                    {shop.name}
                  </h1>
                  {shop.isVerified && (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {shop.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      {parseFloat(shop.rating).toFixed(1)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {shop.totalProducts || 0} products
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    {shop.totalSales || 0} sales
                  </div>
                  <Badge variant="outline">{shop.category}</Badge>
                </div>
                
                {shop.description && (
                  <p className="text-muted-foreground max-w-2xl">
                    {shop.description}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {isOwner ? (
                  <Button className="gap-2" onClick={() => navigate(`/marketplace/shop/${slug}/manage`)}>
                    <Settings className="h-4 w-4" />
                    Manage Shop
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Contact Seller
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Products</div>
            <div className="text-2xl font-bold mt-1">{shop.totalProducts || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Sales</div>
            <div className="text-2xl font-bold mt-1">{shop.totalSales || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Rating</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              {shop.rating ? parseFloat(shop.rating).toFixed(1) : "N/A"}
              {shop.rating && <Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Member Since</div>
            <div className="text-2xl font-bold mt-1">
              {new Date(shop.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="products" data-testid="tab-products">
              <Package className="h-4 w-4 mr-2" />
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="about" data-testid="tab-about">
              <Store className="h-4 w-4 mr-2" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Products Yet</h3>
                <p className="text-muted-foreground mt-2">
                  This shop hasn't listed any products yet.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} shopSlug={slug!} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card className="p-12 text-center">
              <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Reviews Yet</h3>
              <p className="text-muted-foreground mt-2">
                Be the first to leave a review!
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About {shop.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shop.description ? (
                  <p>{shop.description}</p>
                ) : (
                  <p className="text-muted-foreground">No description provided.</p>
                )}
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{shop.category}</Badge>
                    {shop.isVerified && (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
                        <Shield className="h-3 w-3" />
                        Verified Seller
                      </Badge>
                    )}
                  </div>
                  
                  {shop.walletAddress && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Wallet:</span>
                      <a 
                        href={`https://arbiscan.io/address/${shop.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-primary hover:underline flex items-center gap-1"
                      >
                        {shop.walletAddress.slice(0, 6)}...{shop.walletAddress.slice(-4)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  
                  {shop.owner && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Owner:</span>
                      <Link href={`/profile/${shop.owner.username}`}>
                        <div className="flex items-center gap-2 hover:text-primary transition-colors">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={shop.owner.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {(shop.owner.displayName || shop.owner.username).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">@{shop.owner.username}</span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function ProductCard({ product, shopSlug }: { product: ShopProduct; shopSlug: string }) {
  const hasDiscount = product.compareAtPriceAxm && 
    parseFloat(product.compareAtPriceAxm) > parseFloat(product.priceAxm);

  return (
    <Link href={`/marketplace/product/${product.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer group" data-testid={`card-product-${product.id}`}>
        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
          {product.thumbnailUrl || (product.mediaUrls && product.mediaUrls.length > 0) ? (
            <img 
              src={product.thumbnailUrl || product.mediaUrls![0]} 
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          )}
          {product.isFeatured && (
            <Badge className="absolute top-2 left-2 bg-amber-500/90 text-white">
              Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">{product.title}</h3>
          {product.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.shortDescription}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-primary font-semibold">
                <Coins className="h-4 w-4" />
                {product.priceAxm} AXM
              </div>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {product.compareAtPriceAxm}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            {product.avgRating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                {parseFloat(product.avgRating).toFixed(1)}
                {product.reviewCount && ` (${product.reviewCount})`}
              </div>
            )}
            {product.inventory !== null && product.inventory <= 5 && product.inventory > 0 && (
              <span className="text-amber-500">Only {product.inventory} left</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
