import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cartContext";
import { useWallet } from "@/lib/walletContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AXM_TOKEN_ADDRESS, 
  parseAxmAmount, 
  PLATFORM_TREASURY_WALLET,
  MARKETPLACE_PLATFORM_FEE_BPS
} from "@/lib/web3Config";
import { 
  ShoppingCart, 
  ArrowLeft, 
  Package, 
  Wallet, 
  Coins,
  Shield,
  CheckCircle,
  Loader2,
  AlertCircle,
  Minus,
  Plus,
  Trash2,
  Store,
  Zap,
  Gift,
  ExternalLink
} from "lucide-react";

type CheckoutStep = "cart" | "payment" | "processing" | "complete";

interface OrderResult {
  orderId: number;
  txHash: string;
  shopName: string;
  itemCount: number;
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal,
    getItemsByShop
  } = useCart();
  const { 
    isConnected, 
    address, 
    connect, 
    axmBalance, 
    isCorrectNetwork, 
    switchNetwork 
  } = useWallet();

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    address: "",
    notes: ""
  });
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentShopIndex, setCurrentShopIndex] = useState(0);
  const [orderResults, setOrderResults] = useState<OrderResult[]>([]);
  const [failedOrders, setFailedOrders] = useState<{ shopName: string; error: string }[]>([]);

  const platformFeePercent = MARKETPLACE_PLATFORM_FEE_BPS / 100; // 2% from 200 basis points
  const subtotal = getCartTotal();
  const platformFee = subtotal * (platformFeePercent / 100);
  const total = subtotal + platformFee;
  const shopGroups = getItemsByShop();
  const totalShops = shopGroups.size;

  const balance = typeof axmBalance === 'string' ? parseFloat(axmBalance) : axmBalance;
  const hasInsufficientBalance = balance !== null && balance < total;

  const processPayments = async () => {
    if (!address || !isConnected) return;

    setStep("processing");
    setProcessingProgress(0);
    setOrderResults([]);
    setFailedOrders([]);

    const shopEntries = Array.from(shopGroups.entries());
    let completedCount = 0;

    // Helper to send AXM tokens
    const sendTokens = async (toAddress: string, amount: number): Promise<string> => {
      const amountWei = parseAxmAmount(amount.toFixed(18));
      const paddedAddress = toAddress.slice(2).padStart(64, '0');
      const paddedAmount = amountWei.toString(16).padStart(64, '0');
      const data = `0xa9059cbb${paddedAddress}${paddedAmount}`;

      return await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: address,
          to: AXM_TOKEN_ADDRESS,
          data
        }]
      });
    };

    for (let i = 0; i < shopEntries.length; i++) {
      const [shopId, items] = shopEntries[i];
      const shopName = items[0]?.product?.shop?.name || `Shop #${shopId}`;
      const shopWallet = items[0]?.product?.shop?.walletAddress;
      
      setCurrentShopIndex(i);
      
      if (!shopWallet) {
        setFailedOrders(prev => [...prev, { shopName, error: "Seller wallet not configured" }]);
        completedCount++;
        setProcessingProgress((completedCount / totalShops) * 100);
        continue;
      }

      const shopSubtotal = items.reduce(
        (sum, item) => sum + parseFloat(item.product.priceAxm) * item.quantity, 
        0
      );
      const shopPlatformFee = shopSubtotal * (platformFeePercent / 100);
      const sellerAmount = shopSubtotal - shopPlatformFee;

      try {
        // Transaction 1: Send seller share to seller wallet
        const sellerTxHash = await sendTokens(shopWallet, sellerAmount);

        // Transaction 2: Send platform fee to treasury wallet
        let platformFeeTxHash = "";
        let feeTransferFailed = false;
        if (shopPlatformFee > 0) {
          try {
            platformFeeTxHash = await sendTokens(PLATFORM_TREASURY_WALLET, shopPlatformFee);
          } catch (feeError: any) {
            feeTransferFailed = true;
            console.warn("Platform fee transfer failed:", feeError.message);
            toast({
              title: "Platform fee transfer failed",
              description: "Order will be created but may require manual review",
              variant: "destructive"
            });
          }
        }

        const orderRes = await apiRequest("POST", "/api/marketplace/orders", {
          shopId,
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            priceAxm: item.product.priceAxm
          })),
          txHash: sellerTxHash,
          platformFeeTxHash,
          shippingAddress: shippingInfo.address || undefined,
          shippingName: shippingInfo.name,
          shippingEmail: shippingInfo.email,
          notes: shippingInfo.notes
        });

        if (orderRes.ok) {
          const order = await orderRes.json();
          setOrderResults(prev => [...prev, {
            orderId: order.id,
            txHash: sellerTxHash,
            shopName,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
          }]);
        } else {
          throw new Error("Failed to create order");
        }

      } catch (error: any) {
        setFailedOrders(prev => [...prev, { 
          shopName, 
          error: error.message || "Transaction failed" 
        }]);
      }

      completedCount++;
      setProcessingProgress((completedCount / totalShops) * 100);
    }

    clearCart();
    queryClient.invalidateQueries({ queryKey: ["/api/marketplace/orders"] });
    setStep("complete");
  };

  const handleCheckout = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (!isCorrectNetwork) {
      const switched = await switchNetwork();
      if (!switched) {
        toast({ title: "Please switch to Arbitrum One", variant: "destructive" });
        return;
      }
    }

    if (hasInsufficientBalance) {
      toast({ title: "Insufficient AXM balance", variant: "destructive" });
      return;
    }

    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.address) {
      toast({ 
        title: "Please fill in your shipping information", 
        description: "Name, email, and shipping address are required",
        variant: "destructive" 
      });
      return;
    }

    setStep("payment");
  };

  const confirmPayment = async () => {
    try {
      await processPayments();
    } catch (error: any) {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
      setStep("cart");
    }
  };

  if (cartItems.length === 0 && step === "cart") {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
          <div className="p-6 bg-muted/30 rounded-full inline-block">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">
              Add some products from the marketplace to get started
            </p>
          </div>
          <Link href="/marketplace">
            <Button className="gap-2" data-testid="button-browse-marketplace">
              <Store className="h-4 w-4" />
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (step === "complete") {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 space-y-8">
          <div className="text-center space-y-4">
            <div className="p-6 bg-green-500/10 rounded-full inline-block">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold">Order Complete!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your orders have been submitted to the sellers.
            </p>
          </div>

          {orderResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Successful Orders ({orderResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderResults.map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{result.shopName}</p>
                      <p className="text-sm text-muted-foreground">
                        Order #{result.orderId} - {result.itemCount} item(s)
                      </p>
                    </div>
                    <a 
                      href={`https://arbiscan.io/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      View TX <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {failedOrders.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Failed Orders ({failedOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {failedOrders.map((failed, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="font-medium">{failed.shopName}</p>
                      <p className="text-sm text-destructive">{failed.error}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 justify-center">
            <Link href="/marketplace">
              <Button variant="outline" className="gap-2">
                <Store className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
            <Link href="/marketplace?tab=orders">
              <Button className="gap-2" data-testid="button-view-orders">
                <Package className="h-4 w-4" />
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (step === "processing") {
    const shopEntries = Array.from(shopGroups.entries());
    const currentShop = shopEntries[currentShopIndex];
    const currentShopName = currentShop?.[1]?.[0]?.product?.shop?.name || `Shop #${currentShop?.[0]}`;

    return (
      <MainLayout>
        <div className="max-w-lg mx-auto py-12 space-y-8 text-center">
          <div className="p-6 bg-primary/10 rounded-full inline-block">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Processing Payment</h1>
            <p className="text-muted-foreground">
              Please confirm the transaction in your wallet
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Processing order for {currentShopName}</span>
                <span>{currentShopIndex + 1} of {totalShops}</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Do not close this page until all transactions are complete
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (step === "payment") {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setStep("cart")}
              data-testid="button-back-to-cart"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Confirm Payment</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Connected Wallet</span>
                  <span className="font-mono text-sm">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">AXM Balance</span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-primary" />
                    {balance?.toFixed(2) || "0.00"} AXM
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total to Pay</span>
                  <span className="text-primary flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {total.toFixed(2)} AXM
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Secure blockchain transaction</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>Instant settlement to sellers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gift className="h-4 w-4 text-purple-500" />
                  <span>Earn buy-to-earn rewards</span>
                </div>
              </div>

              {totalShops > 1 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Your cart contains items from {totalShops} different shops. 
                    You will need to confirm {totalShops} separate transactions.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep("cart")}
              >
                Back
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={confirmPayment}
                data-testid="button-confirm-payment"
              >
                <Wallet className="h-4 w-4" />
                Confirm & Pay
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/marketplace">
            <Button variant="ghost" size="icon" data-testid="button-back-to-marketplace">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Cart Items ({cartItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from(shopGroups.entries()).map(([shopId, items]) => (
                  <div key={shopId} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Store className="h-4 w-4" />
                      {items[0]?.product?.shop?.name || `Shop #${shopId}`}
                    </div>
                    {items.map((item) => (
                      <div 
                        key={item.product.id} 
                        className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                        data-testid={`cart-item-${item.product.id}`}
                      >
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
                            {item.product.priceAxm} AXM each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            data-testid={`button-decrease-qty-${item.product.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            data-testid={`button-increase-qty-${item.product.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {(parseFloat(item.product.priceAxm) * item.quantity).toFixed(2)} AXM
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                          data-testid={`button-remove-${item.product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Separator />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact & Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={shippingInfo.name}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                      data-testid="input-shipping-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                      data-testid="input-shipping-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Shipping Address (optional for digital goods)</Label>
                  <Textarea
                    id="address"
                    placeholder="123 Main St, City, State, ZIP"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    className="resize-none"
                    data-testid="input-shipping-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Special instructions for the seller..."
                    value={shippingInfo.notes}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                    className="resize-none"
                    data-testid="input-order-notes"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{subtotal.toFixed(2)} AXM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee ({platformFeePercent}%)</span>
                  <span>{platformFee.toFixed(2)} AXM</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary flex items-center gap-1">
                    <Coins className="h-5 w-5" />
                    {total.toFixed(2)} AXM
                  </span>
                </div>

                {isConnected && balance !== null && (
                  <div className={`p-3 rounded-lg ${hasInsufficientBalance ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span>Your Balance</span>
                      <span className={hasInsufficientBalance ? 'text-destructive' : 'text-green-600'}>
                        {balance.toFixed(2)} AXM
                      </span>
                    </div>
                    {hasInsufficientBalance && (
                      <p className="text-xs text-destructive mt-1">
                        Insufficient balance. You need {(total - balance).toFixed(2)} more AXM.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                {!isConnected ? (
                  <Button 
                    className="w-full gap-2" 
                    onClick={connect}
                    data-testid="button-connect-wallet"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </Button>
                ) : !isCorrectNetwork ? (
                  <Button 
                    className="w-full gap-2" 
                    onClick={switchNetwork}
                    data-testid="button-switch-network"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Switch to Arbitrum One
                  </Button>
                ) : (
                  <Button 
                    className="w-full gap-2" 
                    onClick={handleCheckout}
                    disabled={hasInsufficientBalance || !shippingInfo.name || !shippingInfo.email}
                    data-testid="button-proceed-to-payment"
                  >
                    <Wallet className="h-4 w-4" />
                    Proceed to Payment
                  </Button>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Shield className="h-3 w-3" />
                  Secured by Arbitrum blockchain
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Zap className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Instant Settlement</p>
                    <p className="text-xs text-muted-foreground">Direct to seller wallet</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Shield className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Low Fees</p>
                    <p className="text-xs text-muted-foreground">Only {platformFeePercent}% platform fee</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Gift className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Earn Rewards</p>
                    <p className="text-xs text-muted-foreground">Buy-to-earn AXM tokens</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
