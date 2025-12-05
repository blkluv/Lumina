import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingBag, 
  Plus, 
  Package, 
  Coins, 
  Loader2, 
  Image as ImageIcon,
  ExternalLink,
  Truck,
  CheckCircle,
  Pencil,
  X,
  Upload,
  Video,
  Trash2,
} from "lucide-react";
import { AXM_TOKEN_ADDRESS, parseAxmAmount } from "@/lib/web3Config";
import type { User } from "@shared/schema";

interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string | null;
  priceAxm: string;
  imageUrls: string[] | null;
  category: string | null;
  stock: number | null;
  status: string;
  soldCount: number | null;
  createdAt: Date | null;
  seller?: User;
}

interface Order {
  id: string;
  buyerId: string;
  productId: string;
  sellerId: string;
  quantity: number;
  totalAxm: string;
  status: string;
  shippingAddress: any;
  txHash: string | null;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date | null;
  product?: Product;
  buyer?: User;
  seller?: User;
}

const categories = [
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

const MAX_MEDIA_COUNT = 10;

export default function Shop() {
  const { user } = useAuth();
  const { address, isConnected, connect, isCorrectNetwork, switchNetwork, axmBalance } = useWallet();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    priceAxm: "",
    category: "",
    stock: "1",
    imageUrls: [] as string[],
  });
  const [editProduct, setEditProduct] = useState({
    name: "",
    description: "",
    priceAxm: "",
    category: "",
    stock: "1",
    status: "active",
    imageUrls: [] as string[],
  });
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "pending" | "success">("idle");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: myProducts = [], isLoading: myProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/my-products"],
    enabled: !!user,
  });

  const { data: myOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: sellingOrders = [], isLoading: sellingOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", "selling"],
    enabled: !!user,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof newProduct) => {
      const res = await apiRequest("POST", "/api/products", {
        ...data,
        stock: parseInt(data.stock),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Product listed successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      setShowAddProduct(false);
      setNewProduct({ name: "", description: "", priceAxm: "", category: "", stock: "1", imageUrls: [] });
    },
    onError: () => {
      toast({ title: "Failed to list product", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editProduct }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, {
        ...data,
        stock: parseInt(data.stock),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      setEditingProduct(null);
      setEditProduct({ name: "", description: "", priceAxm: "", category: "", stock: "1", status: "active", imageUrls: [] });
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  const purchaseProductMutation = useMutation({
    mutationFn: async ({ productId, txHash }: { productId: string; txHash?: string }) => {
      const res = await apiRequest("POST", "/api/orders", {
        productId,
        quantity: 1,
        txHash,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Purchase successful!" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setPurchaseStatus("success");
    },
    onError: () => {
      toast({ title: "Purchase failed", variant: "destructive" });
      setPurchaseStatus("idle");
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Order updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const uploadMedia = async (file: File, targetState: "new" | "edit") => {
    const currentUrls = targetState === "new" ? newProduct.imageUrls : editProduct.imageUrls;
    
    if (currentUrls.length >= MAX_MEDIA_COUNT) {
      toast({ title: `Maximum ${MAX_MEDIA_COUNT} media files allowed`, variant: "destructive" });
      return;
    }

    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const isImage = validImageTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      toast({ title: "Invalid file type. Please upload an image or video.", variant: "destructive" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large. Maximum size is 50MB.", variant: "destructive" });
      return;
    }

    setUploadingMedia(true);

    try {
      const uploadRes = await apiRequest("POST", "/api/objects/upload", {
        filename: file.name,
        contentType: file.type,
      });
      const { uploadURL } = await uploadRes.json();

      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const mediaRes = await apiRequest("PUT", "/api/media", {
        mediaURL: uploadURL.split("?")[0],
      });
      const { objectPath } = await mediaRes.json();
      
      const finalPath = isVideo ? `${objectPath}#video` : objectPath;
      
      if (targetState === "new") {
        setNewProduct(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, finalPath],
        }));
      } else {
        setEditProduct(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, finalPath],
        }));
      }

      toast({ title: "Media uploaded successfully!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Failed to upload media", variant: "destructive" });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, targetState: "new" | "edit") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await uploadMedia(files[i], targetState);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeMedia = (index: number, targetState: "new" | "edit") => {
    if (targetState === "new") {
      setNewProduct(prev => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      }));
    } else {
      setEditProduct(prev => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      }));
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditProduct({
      name: product.name,
      description: product.description || "",
      priceAxm: product.priceAxm,
      category: product.category || "",
      stock: String(product.stock || 0),
      status: product.status,
      imageUrls: product.imageUrls || [],
    });
  };

  const handlePurchase = async () => {
    if (!selectedProduct || !isConnected) return;

    if (!isCorrectNetwork) {
      const switched = await switchNetwork();
      if (!switched) {
        toast({ title: "Please switch to Arbitrum One", variant: "destructive" });
        return;
      }
    }

    setPurchaseStatus("pending");

    try {
      const amountWei = parseAxmAmount(selectedProduct.priceAxm);
      const sellerAddress = selectedProduct.seller?.walletAddress;

      if (!sellerAddress) {
        toast({ title: "Seller has not connected their wallet", variant: "destructive" });
        setPurchaseStatus("idle");
        return;
      }

      const data = `0xa9059cbb000000000000000000000000${sellerAddress.slice(2)}${amountWei.toString(16).padStart(64, "0")}`;

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: AXM_TOKEN_ADDRESS, data }],
      });

      await purchaseProductMutation.mutateAsync({ productId: selectedProduct.id, txHash });
    } catch (error: any) {
      toast({ title: "Transaction failed", description: error.message, variant: "destructive" });
      setPurchaseStatus("idle");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      paid: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      delivered: "bg-green-500/10 text-green-500 border-green-500/20",
    };
    return <Badge className={statusStyles[status] || ""}>{status}</Badge>;
  };

  const isVideoUrl = (url: string) => {
    return url.match(/\.(mp4|webm|mov)$/i) || url.includes("video") || url.includes("#video");
  };

  const getCleanUrl = (url: string) => {
    return url.split("#")[0];
  };

  const MediaPreview = ({ url, index, onRemove }: { url: string; index: number; onRemove: () => void }) => {
    const isVideo = isVideoUrl(url);
    const cleanUrl = getCleanUrl(url);
    
    return (
      <div className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
        {isVideo ? (
          <video src={cleanUrl} className="w-full h-full object-cover" />
        ) : (
          <img src={cleanUrl} alt={`Product media ${index + 1}`} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {isVideo && (
          <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1.5 py-0.5">
            <Video className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  const MediaUploadGrid = ({ 
    urls, 
    targetState, 
    maxCount = MAX_MEDIA_COUNT 
  }: { 
    urls: string[]; 
    targetState: "new" | "edit"; 
    maxCount?: number;
  }) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Product Media ({urls.length}/{maxCount})</Label>
          {urls.length < maxCount && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditMode(targetState === "edit");
                fileInputRef.current?.click();
              }}
              disabled={uploadingMedia}
              className="gap-1"
            >
              {uploadingMedia ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Add Media
            </Button>
          )}
        </div>
        
        {urls.length === 0 ? (
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => {
              setIsEditMode(targetState === "edit");
              fileInputRef.current?.click();
            }}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="p-3 rounded-full bg-muted">
                <ImageIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Click to upload photos or videos</p>
              <p className="text-xs">Supports images (JPG, PNG, GIF, WebP) and videos (MP4, WebM)</p>
              <p className="text-xs">Maximum {maxCount} files, up to 50MB each</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {urls.map((url, index) => (
              <MediaPreview
                key={index}
                url={url}
                index={index}
                onRemove={() => removeMedia(index, targetState)}
              />
            ))}
            {urls.length < maxCount && (
              <div 
                className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  setIsEditMode(targetState === "edit");
                  fileInputRef.current?.click();
                }}
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, isEditMode ? "edit" : "new")}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-primary" />
              Shop
            </h1>
            <p className="text-muted-foreground mt-1">
              Buy and sell products with AXM tokens
            </p>
          </div>
          {user && (
            <Button onClick={() => setShowAddProduct(true)} className="gap-2" data-testid="button-add-product">
              <Plus className="h-4 w-4" />
              List Product
            </Button>
          )}
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse" data-testid="tab-browse">Browse</TabsTrigger>
            <TabsTrigger value="my-products" data-testid="tab-my-products">My Products</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">My Orders</TabsTrigger>
            <TabsTrigger value="selling" data-testid="tab-selling">Selling</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Products Yet</h3>
                <p className="text-muted-foreground mt-2">Be the first to list a product!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden hover-elevate cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product);
                      setPurchaseStatus("idle");
                      setSelectedMediaIndex(0);
                    }}
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className="aspect-video bg-muted flex items-center justify-center pointer-events-none">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        isVideoUrl(product.imageUrls[0]) ? (
                          <video 
                            src={getCleanUrl(product.imageUrls[0])} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img 
                            src={getCleanUrl(product.imageUrls[0])} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4 pointer-events-none">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.description || "No description"}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-primary font-semibold">
                          <Coins className="h-4 w-4" />
                          {product.priceAxm} AXM
                        </div>
                        <Badge variant="outline">
                          {product.stock || 0} in stock
                        </Badge>
                      </div>
                      {product.seller && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={product.seller.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {(product.seller.displayName || product.seller.username).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            @{product.seller.username}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-products" className="space-y-4">
            {myProductsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myProducts.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Products Listed</h3>
                <p className="text-muted-foreground mt-2">Start selling by listing your first product!</p>
                <Button onClick={() => setShowAddProduct(true)} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  List Product
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden group">
                    <div className="aspect-video bg-muted flex items-center justify-center relative">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        isVideoUrl(product.imageUrls[0]) ? (
                          <video src={getCleanUrl(product.imageUrls[0])} className="w-full h-full object-cover" />
                        ) : (
                          <img src={getCleanUrl(product.imageUrls[0])} alt={product.name} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                      {product.imageUrls && product.imageUrls.length > 1 && (
                        <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0">
                          +{product.imageUrls.length - 1} more
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(product);
                          }}
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Product
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold truncate">{product.name}</h3>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>
                          {product.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <Coins className="h-4 w-4" />
                        {product.priceAxm} AXM
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>{product.stock || 0} in stock</span>
                        <span>{product.soldCount || 0} sold</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Orders Yet</h3>
                <p className="text-muted-foreground mt-2">Your purchase history will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            {order.product?.imageUrls?.[0] ? (
                              <img src={getCleanUrl(order.product.imageUrls[0])} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{order.product?.name || "Product"}</h4>
                            <p className="text-sm text-muted-foreground">
                              Qty: {order.quantity} • {order.totalAxm} AXM
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      {order.txHash && (
                        <a
                          href={`https://arbiscan.io/tx/${order.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                        >
                          View Transaction <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="selling" className="space-y-4">
            {sellingOrdersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sellingOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Sales Yet</h3>
                <p className="text-muted-foreground mt-2">Orders for your products will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {sellingOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            {order.product?.imageUrls?.[0] ? (
                              <img src={getCleanUrl(order.product.imageUrls[0])} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{order.product?.name || "Product"}</h4>
                            <p className="text-sm text-muted-foreground">
                              Buyer: @{order.buyer?.username} • {order.totalAxm} AXM
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                          {order.status === "paid" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: "shipped" })}
                              className="gap-1"
                            >
                              <Truck className="h-4 w-4" />
                              Mark Shipped
                            </Button>
                          )}
                          {order.status === "shipped" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: "delivered" })}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>List a Product</DialogTitle>
              <DialogDescription>
                Sell digital or physical products for AXM tokens
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
                <MediaUploadGrid urls={newProduct.imageUrls} targetState="new" />
                
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    placeholder="Enter product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    data-testid="input-product-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your product in detail..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="min-h-[100px]"
                    data-testid="input-product-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (AXM)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newProduct.priceAxm}
                      onChange={(e) => setNewProduct({ ...newProduct, priceAxm: e.target.value })}
                      data-testid="input-product-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      data-testid="input-product-stock"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger data-testid="select-product-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createProductMutation.mutate(newProduct)}
                disabled={!newProduct.name || !newProduct.priceAxm || createProductMutation.isPending}
                data-testid="button-submit-product"
              >
                {createProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                List Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update your product details and media
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
                <MediaUploadGrid urls={editProduct.imageUrls} targetState="edit" />
                
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    placeholder="Enter product name"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    data-testid="input-edit-product-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your product in detail..."
                    value={editProduct.description}
                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                    className="min-h-[100px]"
                    data-testid="input-edit-product-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (AXM)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={editProduct.priceAxm}
                      onChange={(e) => setEditProduct({ ...editProduct, priceAxm: e.target.value })}
                      data-testid="input-edit-product-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={editProduct.stock}
                      onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                      data-testid="input-edit-product-stock"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={editProduct.category}
                      onValueChange={(value) => setEditProduct({ ...editProduct, category: value })}
                    >
                      <SelectTrigger data-testid="select-edit-product-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editProduct.status}
                      onValueChange={(value) => setEditProduct({ ...editProduct, status: value })}
                    >
                      <SelectTrigger data-testid="select-edit-product-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="sold_out">Sold Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingProduct) {
                    updateProductMutation.mutate({ id: editingProduct.id, data: editProduct });
                  }
                }}
                disabled={!editProduct.name || !editProduct.priceAxm || updateProductMutation.isPending}
                data-testid="button-update-product"
              >
                {updateProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-lg" aria-describedby="product-description">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedProduct.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0 ? (
                    <div className="space-y-2">
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {isVideoUrl(selectedProduct.imageUrls[selectedMediaIndex] || selectedProduct.imageUrls[0]) ? (
                          <video 
                            src={getCleanUrl(selectedProduct.imageUrls[selectedMediaIndex] || selectedProduct.imageUrls[0])} 
                            controls
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img 
                            src={getCleanUrl(selectedProduct.imageUrls[selectedMediaIndex] || selectedProduct.imageUrls[0])} 
                            alt={selectedProduct.name} 
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      {selectedProduct.imageUrls.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {selectedProduct.imageUrls.map((url, index) => (
                            <div 
                              key={index} 
                              className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted cursor-pointer ring-2 transition-all ${
                                selectedMediaIndex === index ? 'ring-primary' : 'ring-transparent hover:ring-primary/50'
                              }`}
                              onClick={() => setSelectedMediaIndex(index)}
                            >
                              {isVideoUrl(url) ? (
                                <div className="relative w-full h-full">
                                  <video src={getCleanUrl(url)} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Video className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <img src={getCleanUrl(url)} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <p id="product-description" className="text-muted-foreground">
                    {selectedProduct.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Price</span>
                    <div className="flex items-center gap-1 text-xl font-bold text-primary">
                      <Coins className="h-5 w-5" />
                      {selectedProduct.priceAxm} AXM
                    </div>
                  </div>
                  {selectedProduct.seller && (
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Avatar>
                        <AvatarImage src={selectedProduct.seller.avatarUrl || undefined} />
                        <AvatarFallback>
                          {(selectedProduct.seller.displayName || selectedProduct.seller.username).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedProduct.seller.displayName || selectedProduct.seller.username}</p>
                        <p className="text-sm text-muted-foreground">@{selectedProduct.seller.username}</p>
                      </div>
                    </div>
                  )}

                  {purchaseStatus === "success" ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold">Purchase Complete!</h3>
                      <p className="text-muted-foreground">Check your orders for details.</p>
                    </div>
                  ) : !isConnected ? (
                    <Button onClick={connect} className="w-full" data-testid="button-connect-purchase">
                      Connect Wallet to Purchase
                    </Button>
                  ) : selectedProduct.sellerId === user?.id ? (
                    <div className="text-center text-muted-foreground py-4">
                      This is your own product
                    </div>
                  ) : !selectedProduct.seller?.walletAddress ? (
                    <div className="text-center text-muted-foreground py-4">
                      Seller has not connected their wallet yet
                    </div>
                  ) : (selectedProduct.stock || 0) <= 0 ? (
                    <Button disabled className="w-full">
                      Out of Stock
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePurchase}
                      disabled={purchaseStatus === "pending"}
                      className="w-full shadow-lg shadow-primary/25"
                      data-testid="button-purchase"
                    >
                      {purchaseStatus === "pending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {purchaseStatus === "pending" ? "Processing..." : `Buy for ${selectedProduct.priceAxm} AXM`}
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
