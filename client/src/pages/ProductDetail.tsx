import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { useCart } from "@/lib/cartContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AXM_TOKEN_ADDRESS, parseAxmAmount } from "@/lib/web3Config";
import { 
  Package, 
  Coins, 
  Loader2, 
  Image as ImageIcon,
  Star,
  ShoppingCart,
  ArrowLeft,
  Heart,
  Share2,
  Shield,
  Store,
  Truck,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

interface Shop {
  id: number;
  ownerId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isVerified: boolean;
  rating: string | null;
  walletAddress: string | null;
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
  shop?: Shop;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { address, isConnected, connect, isCorrectNetwork, switchNetwork, axmBalance } = useWallet();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "pending" | "success">("idle");

  const { data: product, isLoading: productLoading, error: productError } = useQuery<ShopProduct>({
    queryKey: ["/api/marketplace/products", id],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/products/${id}`);
      if (!res.ok) throw new Error("Product not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: relatedProducts = [] } = useQuery<ShopProduct[]>({
    queryKey: ["/api/marketplace/products", "related", product?.category],
    queryFn: async () => {
      if (!product?.category) return [];
      const res = await fetch(`/api/marketplace/products?category=${product.category}&limit=4&status=active`);
      const data = await res.json();
      return data.filter((p: ShopProduct) => p.id !== product.id);
    },
    enabled: !!product?.category,
  });

  const handlePurchase = async () => {
    if (!product || !isConnected) {
      if (!isConnected) {
        connect();
      }
      return;
    }

    if (!isCorrectNetwork) {
      const switched = await switchNetwork();
      if (!switched) {
        toast({ title: "Please switch to Arbitrum One", variant: "destructive" });
        return;
      }
    }

    if (!product.shop?.walletAddress) {
      toast({ title: "Seller has not connected their wallet", variant: "destructive" });
      return;
    }

    const totalPrice = parseFloat(product.priceAxm) * quantity;
    const balance = typeof axmBalance === 'string' ? parseFloat(axmBalance) : axmBalance;
    if (balance !== null && balance < totalPrice) {
      toast({ title: "Insufficient AXM balance", variant: "destructive" });
      return;
    }

    setPurchaseStatus("pending");

    try {
      const amountWei = parseAxmAmount((parseFloat(product.priceAxm) * quantity).toString());
      const sellerAddress = product.shop.walletAddress;

      const data = `0xa9059cbb000000000000000000000000${sellerAddress.slice(2)}${amountWei.toString(16).padStart(64, "0")}`;

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: AXM_TOKEN_ADDRESS, data }],
      });

      const orderRes = await apiRequest("POST", "/api/marketplace/orders", {
        shopId: product.shopId,
        items: [{ productId: product.id, quantity, priceAxm: product.priceAxm }],
        txHash,
      });

      if (orderRes.ok) {
        toast({ title: "Purchase successful!" });
        setPurchaseStatus("success");
        queryClient.invalidateQueries({ queryKey: ["/api/marketplace/products"] });
      }
    } catch (error: any) {
      toast({ title: "Transaction failed", description: error.message, variant: "destructive" });
      setPurchaseStatus("idle");
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product as any, quantity);
    toast({ title: `Added ${quantity} item(s) to cart` });
  };

  if (productLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (productError || !product) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The product you're looking for doesn't exist or has been removed.
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

  const images = product.mediaUrls || (product.thumbnailUrl ? [product.thumbnailUrl] : []);
  const hasDiscount = product.compareAtPriceAxm && 
    parseFloat(product.compareAtPriceAxm) > parseFloat(product.priceAxm);
  const discountPercent = hasDiscount 
    ? Math.round((1 - parseFloat(product.priceAxm) / parseFloat(product.compareAtPriceAxm!)) * 100)
    : 0;
  const totalPrice = parseFloat(product.priceAxm) * quantity;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/marketplace" className="hover:text-foreground transition-colors">
            Marketplace
          </Link>
          <ChevronRight className="h-4 w-4" />
          {product.shop && (
            <>
              <Link href={`/marketplace/shop/${product.shop.slug}`} className="hover:text-foreground transition-colors">
                {product.shop.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden relative">
              {images.length > 0 ? (
                <img 
                  src={images[selectedImageIndex]} 
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={() => setSelectedImageIndex(i => (i - 1 + images.length) % images.length)}
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setSelectedImageIndex(i => (i + 1) % images.length)}
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {hasDiscount && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                  -{discountPercent}%
                </Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted ring-2 transition-all ${
                      selectedImageIndex === idx ? "ring-primary" : "ring-transparent hover:ring-primary/50"
                    }`}
                    data-testid={`button-thumbnail-${idx}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.isFeatured && (
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                    Featured
                  </Badge>
                )}
                <Badge variant="outline">{product.category}</Badge>
                <Badge variant="outline">{product.productType}</Badge>
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-product-title">
                {product.title}
              </h1>
              
              {product.avgRating && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(parseFloat(product.avgRating!))
                            ? "text-amber-500 fill-amber-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {parseFloat(product.avgRating).toFixed(1)} ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                <Coins className="h-7 w-7" />
                {product.priceAxm} AXM
              </div>
              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through">
                  {product.compareAtPriceAxm} AXM
                </span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-muted-foreground">{product.shortDescription}</p>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-qty"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold" data-testid="text-quantity">
                    {quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(q => Math.min(product.inventory || 999, q + 1))}
                    disabled={product.inventory !== null && quantity >= product.inventory}
                    data-testid="button-increase-qty"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {product.inventory !== null && (
                  <span className={`text-sm ${product.inventory <= 5 ? "text-amber-500" : "text-muted-foreground"}`}>
                    {product.inventory} in stock
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Total:</span>
                <span className="text-xl font-bold flex items-center gap-1">
                  <Coins className="h-5 w-5 text-primary" />
                  {totalPrice.toFixed(2)} AXM
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 gap-2"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={purchaseStatus === "pending" || (product.inventory !== null && product.inventory < 1)}
                  data-testid="button-buy-now"
                >
                  {purchaseStatus === "pending" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : purchaseStatus === "success" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Coins className="h-5 w-5" />
                  )}
                  {purchaseStatus === "pending" ? "Processing..." : purchaseStatus === "success" ? "Purchased!" : "Buy Now"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={handleAddToCart}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 gap-1">
                  <Heart className="h-4 w-4" />
                  Wishlist
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 gap-1">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            <Separator />

            {product.shop && (
              <Link href={`/marketplace/shop/${product.shop.slug}`}>
                <Card className="p-4 hover-elevate cursor-pointer">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={product.shop.logoUrl || undefined} />
                      <AvatarFallback>
                        <Store className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{product.shop.name}</span>
                        {product.shop.isVerified && (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {product.shop.rating && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          {parseFloat(product.shop.rating).toFixed(1)} shop rating
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Contact
                    </Button>
                  </div>
                </Card>
              </Link>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                Secure Payment
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4 text-blue-500" />
                Fast Shipping
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-amber-500" />
                Instant Settlement
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="space-y-4">
          <TabsList>
            <TabsTrigger value="description" data-testid="tab-description">Description</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews ({product.reviewCount || 0})</TabsTrigger>
            <TabsTrigger value="shipping" data-testid="tab-shipping">Shipping</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {product.description ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{product.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No detailed description available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card className="p-12 text-center">
              <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Reviews Yet</h3>
              <p className="text-muted-foreground mt-2">
                Be the first to review this product!
              </p>
              <Button className="mt-4 gap-2">
                <Star className="h-4 w-4" />
                Write a Review
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Shipping Information</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Shipping details are provided by the seller. Contact the shop for specific shipping rates and delivery times.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Buyer Protection</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      All purchases are protected by Lumina's dispute resolution system. 
                      If you don't receive your item or it doesn't match the description, 
                      you can open a dispute for a full refund.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map(p => (
                <Link key={p.id} href={`/marketplace/product/${p.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer">
                    <div className="aspect-square bg-muted">
                      {p.thumbnailUrl || (p.mediaUrls && p.mediaUrls.length > 0) ? (
                        <img 
                          src={p.thumbnailUrl || p.mediaUrls![0]} 
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <div className="flex items-center gap-1 text-primary font-semibold mt-2">
                        <Coins className="h-4 w-4" />
                        {p.priceAxm} AXM
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
