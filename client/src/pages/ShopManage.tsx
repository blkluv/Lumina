import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/authContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Package, 
  Coins, 
  Loader2, 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Save,
  ExternalLink,
  Upload,
  ImageIcon,
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
  contactEmail: string | null;
  status: string;
  isVerified: boolean;
  rating: string | null;
  totalProducts: number | null;
  totalSales: number | null;
  createdAt: string;
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

interface ShopOrder {
  id: number;
  orderNumber: string;
  shopId: number;
  buyerId: string;
  status: string;
  subtotalAxm: string;
  platformFeeAxm: string;
  totalAxm: string;
  sellerReceivesAxm: string;
  shippingAddress: any;
  trackingNumber: string | null;
  createdAt: string;
  buyer?: {
    username: string;
    displayName: string | null;
  };
}

const CATEGORIES = [
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "electronics", label: "Electronics" },
  { value: "home", label: "Home & Garden" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "collectibles", label: "Art & Collectibles" },
  { value: "food", label: "Food & Beverages" },
  { value: "digital", label: "Digital Products" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

export default function ShopManage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("products");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [shopEdits, setShopEdits] = useState<Partial<Shop>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    priceAxm: "",
    category: "other",
    inventory: "",
    media: [] as string[],
  });

  const MAX_IMAGES = 20;

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    if (productForm.media.length >= MAX_IMAGES) {
      toast({ title: "Maximum images reached", description: `You can only upload up to ${MAX_IMAGES} images`, variant: "destructive" });
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, GIF, or WebP image", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const res = await apiRequest("POST", "/api/objects/upload", {});
      const { uploadURL } = await res.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const gcsUrl = uploadURL.split("?")[0];
      const uploadsMatch = gcsUrl.match(/\/uploads\/([a-f0-9-]+)$/i);
      const objectId = uploadsMatch ? uploadsMatch[1] : gcsUrl.split("/").pop();
      const imageUrl = `/objects/uploads/${objectId}`;
      
      setProductForm(p => ({ ...p, media: [...p.media, imageUrl] }));
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setProductForm(p => ({
      ...p,
      media: p.media.filter((_, i) => i !== index)
    }));
  };

  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ["/api/marketplace/shops", slug],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shops/slug/${slug}`);
      if (!res.ok) throw new Error("Shop not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/marketplace/products", "shop", shop?.id, "all"],
    queryFn: async () => {
      if (!shop?.id) return [];
      const res = await fetch(`/api/marketplace/products?shopId=${shop.id}`);
      return res.json();
    },
    enabled: !!shop?.id,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<ShopOrder[]>({
    queryKey: ["/api/marketplace/orders", shop?.id],
    queryFn: async () => {
      if (!shop?.id) return [];
      const res = await apiRequest("GET", `/api/marketplace/orders?shopId=${shop.id}`);
      return res.json();
    },
    enabled: !!shop?.id,
  });

  const updateShopMutation = useMutation({
    mutationFn: async (updates: Partial<Shop>) => {
      const res = await apiRequest("PATCH", `/api/marketplace/shops/${shop!.id}`, updates);
      if (!res.ok) throw new Error("Failed to update shop");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Shop updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/shops", slug] });
      setShopEdits({});
    },
    onError: (error: any) => {
      toast({ title: "Failed to update shop", description: error.message, variant: "destructive" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      if (!data.title.trim()) throw new Error("Title is required");
      if (!data.priceAxm || parseFloat(data.priceAxm) <= 0) throw new Error("Valid price is required");
      
      const res = await apiRequest("POST", "/api/marketplace/products", {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        shortDescription: data.shortDescription?.trim() || null,
        priceAxm: data.priceAxm,
        category: data.category || "other",
        thumbnailUrl: data.media.length > 0 ? data.media[0] : null,
        inventory: data.inventory ? parseInt(data.inventory) : null,
        mediaUrls: data.media,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create product");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Product created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/products", "shop", shop?.id, "all"] });
      setShowAddProduct(false);
      setProductForm({ title: "", description: "", shortDescription: "", priceAxm: "", category: "other", inventory: "", media: [] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<ShopProduct>) => {
      const res = await apiRequest("PATCH", `/api/marketplace/products/${id}`, updates);
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/products", "shop", shop?.id, "all"] });
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/marketplace/products/${id}`, {});
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Product deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/products", "shop", shop?.id, "all"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete product", description: error.message, variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & { status?: string; trackingNumber?: string }) => {
      const res = await apiRequest("PATCH", `/api/marketplace/orders/${id}`, updates);
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Order updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/orders", shop?.id] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update order", description: error.message, variant: "destructive" });
    },
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

  if (!shop) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12 text-center">
          <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Shop Not Found</h1>
          <p className="text-muted-foreground mt-2">This shop doesn't exist or has been removed.</p>
          <Link href="/marketplace">
            <Button className="mt-6 gap-2" data-testid="button-back-marketplace">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (!isOwner) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12 text-center">
          <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have permission to manage this shop.</p>
          <Link href={`/marketplace/shop/${slug}`}>
            <Button className="mt-6 gap-2" data-testid="button-view-shop">
              <Eye className="h-4 w-4" />
              View Shop
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "confirmed":
        return <Badge className="gap-1 bg-blue-500"><CheckCircle className="h-3 w-3" /> Confirmed</Badge>;
      case "shipped":
        return <Badge className="gap-1 bg-purple-500"><Truck className="h-3 w-3" /> Shipped</Badge>;
      case "delivered":
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href={`/marketplace/shop/${slug}`}>
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-shop-name">{shop.name}</h1>
              <p className="text-muted-foreground">Shop Management</p>
            </div>
          </div>
          <Link href={`/marketplace/shop/${slug}`}>
            <Button variant="outline" className="gap-2" data-testid="button-view-storefront">
              <ExternalLink className="h-4 w-4" />
              View Storefront
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="products" className="gap-2" data-testid="tab-products">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders">
              <ShoppingBag className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 mt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Products ({products.length})</h2>
              <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-add-product">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        value={productForm.title} 
                        onChange={(e) => setProductForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Product title"
                        data-testid="input-product-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Input 
                        id="shortDescription" 
                        value={productForm.shortDescription} 
                        onChange={(e) => setProductForm(p => ({ ...p, shortDescription: e.target.value }))}
                        placeholder="Brief description"
                        data-testid="input-product-short-desc"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Full Description</Label>
                      <Textarea 
                        id="description" 
                        value={productForm.description} 
                        onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Detailed product description"
                        data-testid="input-product-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priceAxm">Price (AXM)</Label>
                        <Input 
                          id="priceAxm" 
                          type="number"
                          step="0.01"
                          value={productForm.priceAxm} 
                          onChange={(e) => setProductForm(p => ({ ...p, priceAxm: e.target.value }))}
                          placeholder="0.00"
                          data-testid="input-product-price"
                        />
                      </div>
                      <div>
                        <Label htmlFor="inventory">Inventory</Label>
                        <Input 
                          id="inventory" 
                          type="number"
                          value={productForm.inventory} 
                          onChange={(e) => setProductForm(p => ({ ...p, inventory: e.target.value }))}
                          placeholder="Stock quantity"
                          data-testid="input-product-inventory"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={productForm.category} onValueChange={(v) => setProductForm(p => ({ ...p, category: v }))}>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Product Images ({productForm.media.length}/{MAX_IMAGES})</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {productForm.media.map((url, index) => (
                          <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden border bg-muted group">
                            <img 
                              src={url} 
                              alt={`Product ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            {index === 0 && (
                              <span className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] px-1 rounded-br">
                                Main
                              </span>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                              data-testid={`button-remove-image-${index}`}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {productForm.media.length < MAX_IMAGES && (
                          <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                                e.target.value = "";
                              }}
                              disabled={uploadingImage}
                              data-testid="input-product-image"
                            />
                            {uploadingImage ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Plus className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">Add</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => createProductMutation.mutate(productForm)}
                      disabled={createProductMutation.isPending || !productForm.title || !productForm.priceAxm}
                      data-testid="button-create-product"
                    >
                      {createProductMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Product Dialog */}
              <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="edit-title">Title</Label>
                      <Input 
                        id="edit-title" 
                        value={productForm.title} 
                        onChange={(e) => setProductForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Product title"
                        data-testid="input-edit-product-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-shortDescription">Short Description</Label>
                      <Input 
                        id="edit-shortDescription" 
                        value={productForm.shortDescription} 
                        onChange={(e) => setProductForm(p => ({ ...p, shortDescription: e.target.value }))}
                        placeholder="Brief description"
                        data-testid="input-edit-product-short-desc"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Full Description</Label>
                      <Textarea 
                        id="edit-description" 
                        value={productForm.description} 
                        onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Detailed product description"
                        data-testid="input-edit-product-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-priceAxm">Price (AXM)</Label>
                        <Input 
                          id="edit-priceAxm" 
                          type="number"
                          step="0.01"
                          value={productForm.priceAxm} 
                          onChange={(e) => setProductForm(p => ({ ...p, priceAxm: e.target.value }))}
                          placeholder="0.00"
                          data-testid="input-edit-product-price"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-inventory">Inventory</Label>
                        <Input 
                          id="edit-inventory" 
                          type="number"
                          value={productForm.inventory} 
                          onChange={(e) => setProductForm(p => ({ ...p, inventory: e.target.value }))}
                          placeholder="Stock quantity"
                          data-testid="input-edit-product-inventory"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select value={productForm.category} onValueChange={(v) => setProductForm(p => ({ ...p, category: v }))}>
                        <SelectTrigger data-testid="select-edit-product-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Product Images ({productForm.media.length}/{MAX_IMAGES})</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {productForm.media.map((url, index) => (
                          <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden border bg-muted group">
                            <img 
                              src={url} 
                              alt={`Product ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            {index === 0 && (
                              <span className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] px-1 rounded-br">
                                Main
                              </span>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                              data-testid={`button-edit-remove-image-${index}`}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {productForm.media.length < MAX_IMAGES && (
                          <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                                e.target.value = "";
                              }}
                              disabled={uploadingImage}
                              data-testid="input-edit-product-image"
                            />
                            {uploadingImage ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Plus className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">Add</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => {
                        if (editingProduct) {
                          updateProductMutation.mutate({
                            id: editingProduct.id,
                            title: productForm.title.trim(),
                            description: productForm.description?.trim() || null,
                            shortDescription: productForm.shortDescription?.trim() || null,
                            priceAxm: productForm.priceAxm,
                            category: productForm.category,
                            inventory: productForm.inventory ? parseInt(productForm.inventory) : null,
                            thumbnailUrl: productForm.media.length > 0 ? productForm.media[0] : null,
                            mediaUrls: productForm.media,
                          });
                          setEditingProduct(null);
                        }
                      }}
                      disabled={updateProductMutation.isPending || !productForm.title || !productForm.priceAxm}
                      data-testid="button-save-product"
                    >
                      {updateProductMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {productsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No products yet. Add your first product to start selling.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="hover-elevate" data-testid={`card-product-${product.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.thumbnailUrl ? (
                            <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate" data-testid={`text-product-title-${product.id}`}>{product.title}</h3>
                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                              {product.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Coins className="h-3 w-3" />
                              {parseFloat(product.priceAxm).toLocaleString()} AXM
                            </span>
                            {product.inventory !== null && (
                              <span>Stock: {product.inventory}</span>
                            )}
                            <span>Views: {product.viewCount || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/marketplace/product/${product.id}`}>
                            <Button variant="ghost" size="icon" data-testid={`button-view-product-${product.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingProduct(product);
                              setProductForm({
                                title: product.title || "",
                                description: product.description || "",
                                shortDescription: product.shortDescription || "",
                                priceAxm: product.priceAxm || "",
                                category: product.category || "other",
                                inventory: product.inventory?.toString() || "",
                                media: product.mediaUrls || (product.thumbnailUrl ? [product.thumbnailUrl] : []),
                              });
                            }}
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              updateProductMutation.mutate({
                                id: product.id,
                                status: product.status === "active" ? "inactive" : "active"
                              });
                            }}
                            data-testid={`button-toggle-product-${product.id}`}
                          >
                            {product.status === "active" ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this product?")) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 mt-6">
            <h2 className="text-lg font-semibold">Orders ({orders.length})</h2>
            
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders yet. Orders will appear here when customers make purchases.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <Card key={order.id} data-testid={`card-order-${order.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium" data-testid={`text-order-number-${order.id}`}>
                              Order #{order.orderNumber}
                            </h3>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.buyer?.displayName || order.buyer?.username || "Customer"} - {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1 text-sm">
                            <Coins className="h-3 w-3" />
                            <span className="font-medium">{parseFloat(order.sellerReceivesAxm).toLocaleString()} AXM</span>
                            <span className="text-muted-foreground">(after fees)</span>
                          </div>
                          {order.shippingAddress && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Ship to: {order.shippingAddress.name}, {order.shippingAddress.address}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === "confirmed" && (
                            <Button 
                              size="sm" 
                              className="gap-1"
                              onClick={() => updateOrderMutation.mutate({ id: order.id, status: "shipped" })}
                              data-testid={`button-ship-order-${order.id}`}
                            >
                              <Truck className="h-3 w-3" />
                              Mark Shipped
                            </Button>
                          )}
                          {order.status === "shipped" && (
                            <Button 
                              size="sm" 
                              className="gap-1"
                              onClick={() => updateOrderMutation.mutate({ id: order.id, status: "delivered" })}
                              data-testid={`button-deliver-order-${order.id}`}
                            >
                              <CheckCircle className="h-3 w-3" />
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

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Shop Settings</CardTitle>
                <CardDescription>Update your shop information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input 
                    id="shopName" 
                    defaultValue={shop.name}
                    onChange={(e) => setShopEdits(p => ({ ...p, name: e.target.value }))}
                    data-testid="input-shop-name"
                  />
                </div>
                <div>
                  <Label htmlFor="shopDescription">Description</Label>
                  <Textarea 
                    id="shopDescription" 
                    defaultValue={shop.description || ""}
                    onChange={(e) => setShopEdits(p => ({ ...p, description: e.target.value }))}
                    data-testid="input-shop-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shopCategory">Category</Label>
                    <Select 
                      defaultValue={shop.category} 
                      onValueChange={(v) => setShopEdits(p => ({ ...p, category: v }))}
                    >
                      <SelectTrigger data-testid="select-shop-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shopEmail">Contact Email</Label>
                    <Input 
                      id="shopEmail" 
                      type="email"
                      defaultValue={shop.contactEmail || ""}
                      onChange={(e) => setShopEdits(p => ({ ...p, contactEmail: e.target.value }))}
                      data-testid="input-shop-email"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="walletAddress">Wallet Address (for payments)</Label>
                  <Input 
                    id="walletAddress" 
                    defaultValue={shop.walletAddress || ""}
                    onChange={(e) => setShopEdits(p => ({ ...p, walletAddress: e.target.value }))}
                    placeholder="0x..."
                    data-testid="input-shop-wallet"
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input 
                    id="logoUrl" 
                    defaultValue={shop.logoUrl || ""}
                    onChange={(e) => setShopEdits(p => ({ ...p, logoUrl: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-shop-logo"
                  />
                </div>
                <div>
                  <Label htmlFor="bannerUrl">Banner URL</Label>
                  <Input 
                    id="bannerUrl" 
                    defaultValue={shop.bannerUrl || ""}
                    onChange={(e) => setShopEdits(p => ({ ...p, bannerUrl: e.target.value }))}
                    placeholder="https://..."
                    data-testid="input-shop-banner"
                  />
                </div>
                <Separator />
                <Button 
                  className="gap-2"
                  onClick={() => updateShopMutation.mutate(shopEdits)}
                  disabled={updateShopMutation.isPending || Object.keys(shopEdits).length === 0}
                  data-testid="button-save-settings"
                >
                  {updateShopMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
