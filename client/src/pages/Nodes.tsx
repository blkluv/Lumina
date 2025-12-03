import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Server,
  Cpu,
  Wifi,
  Zap,
  RefreshCw,
  ExternalLink,
  ShoppingCart,
  Wallet,
  Lock,
  CheckCircle,
  Tag,
  TrendingUp,
  DollarSign,
  Coins,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { useWallet } from "@/lib/walletContext";
import { useDePINContract, useTokenContract, usePriceOracle, NodeTier, NodePurchase } from "@/lib/useContracts";
import { CONTRACT_ADDRESSES, getExplorerUrl } from "@/lib/contracts";

const TIER_ICONS = [Server, Cpu, Wifi, Zap, Shield];
const TIER_COLORS = [
  "from-blue-500/20 to-blue-600/10",
  "from-green-500/20 to-green-600/10",
  "from-purple-500/20 to-purple-600/10",
  "from-orange-500/20 to-orange-600/10",
  "from-pink-500/20 to-pink-600/10",
];

export default function Nodes() {
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const depin = useDePINContract();
  const token = useTokenContract();
  const priceOracle = usePriceOracle();
  
  const [totalNodesSold, setTotalNodesSold] = useState<number>(0);
  const [totalEthCollected, setTotalEthCollected] = useState<string>('0');
  const [totalAxmCollected, setTotalAxmCollected] = useState<string>('0');
  const [axmDiscount, setAxmDiscount] = useState<number>(1500);
  const [tiers, setTiers] = useState<NodeTier[]>([]);
  const [userPurchases, setUserPurchases] = useState<NodePurchase[]>([]);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [ethPrice, setEthPrice] = useState<number>(2000);
  const [isLoading, setIsLoading] = useState(true);
  
  const [purchasingTier, setPurchasingTier] = useState<number | null>(null);
  const [purchaseMethod, setPurchaseMethod] = useState<'ETH' | 'AXM'>('ETH');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<NodeTier | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [nodesSold, ethCollected, axmCollected, discount, allTiers, price] = await Promise.all([
        depin.getTotalNodesSold(),
        depin.getTotalEthCollected(),
        depin.getTotalAxmCollected(),
        depin.getAxmDiscount(),
        depin.getAllTiers(),
        priceOracle.getETHPrice(),
      ]);
      
      setTotalNodesSold(nodesSold);
      setTotalEthCollected(ethCollected);
      setTotalAxmCollected(axmCollected);
      setAxmDiscount(discount);
      setTiers(allTiers.filter(t => t.active));
      setEthPrice(price);

      if (isConnected && address) {
        const [balance, purchases] = await Promise.all([
          token.getBalance(address),
          depin.getUserPurchases(address),
        ]);
        setTokenBalance(balance);
        setUserPurchases(purchases);
      }
    } catch (error) {
      console.error('Failed to fetch DePIN data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isConnected, address]);

  const handlePurchase = async (tier: NodeTier, method: 'ETH' | 'AXM') => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to purchase nodes",
        variant: "destructive",
      });
      return;
    }

    setPurchasingTier(tier.tier);
    try {
      let txHash: string | null;
      if (method === 'ETH') {
        txHash = await depin.purchaseNodeWithETH(tier.tier, tier.category, '');
      } else {
        txHash = await depin.purchaseNodeWithAXM(tier.tier, tier.category, '');
      }
      
      toast({
        title: "Purchase Successful",
        description: `Node purchased successfully. TX: ${txHash?.slice(0, 10)}...`,
      });
      setShowPurchaseDialog(false);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase node",
        variant: "destructive",
      });
    } finally {
      setPurchasingTier(null);
    }
  };

  const openPurchaseDialog = (tier: NodeTier) => {
    setSelectedTier(tier);
    setShowPurchaseDialog(true);
  };

  const discountPercent = (axmDiscount / 100).toFixed(0);
  const formatUSD = (ethAmount: string) => {
    const eth = parseFloat(ethAmount.replace(/,/g, ''));
    return (eth * ethPrice).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-nodes-title">
              <Server className="h-8 w-8 text-primary" />
              DePIN Node Sales
            </h1>
            <p className="text-muted-foreground mt-1">
              Purchase decentralized infrastructure nodes and earn rewards
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="hover-elevate" data-testid="card-nodes-sold">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nodes Sold</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-nodes-sold">
                  {totalNodesSold.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Total nodes purchased
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-eth-collected">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ETH Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-eth-collected">
                  {parseFloat(totalEthCollected).toFixed(2)} ETH
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                ~${formatUSD(totalEthCollected)} USD
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-axm-collected">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AXM Collected</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-axm-collected">
                  {parseFloat(totalAxmCollected).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                From AXM purchases
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-axm-discount">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AXM Discount</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-500" data-testid="text-discount">
                  {discountPercent}% OFF
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Pay with AXM & save
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tiers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
            <TabsTrigger value="tiers" data-testid="tab-tiers">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Node Tiers
            </TabsTrigger>
            <TabsTrigger value="my-nodes" data-testid="tab-my-nodes">
              <Server className="h-4 w-4 mr-2" />
              My Nodes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tiers" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-32 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : tiers.length === 0 ? (
                <Card className="col-span-full p-8 text-center">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tiers Available</h3>
                  <p className="text-muted-foreground">
                    Node tiers will appear here when they become available.
                  </p>
                </Card>
              ) : (
                tiers.map((tier, index) => {
                  const TierIcon = TIER_ICONS[index % TIER_ICONS.length];
                  const gradientColor = TIER_COLORS[index % TIER_COLORS.length];
                  
                  return (
                    <Card key={tier.tier} className="overflow-hidden hover-elevate" data-testid={`card-tier-${tier.tier}`}>
                      <div className={`h-32 bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
                        <TierIcon className="h-16 w-16 text-primary/40" />
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{tier.name}</CardTitle>
                          <Badge variant="secondary">Tier {tier.tier}</Badge>
                        </div>
                        <CardDescription>
                          Decentralized infrastructure node
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">ETH Price</span>
                            <span className="font-semibold">{parseFloat(tier.priceEth).toFixed(3)} ETH</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">USD Value</span>
                            <span className="text-sm">${formatUSD(tier.priceEth)}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-500 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Pay with AXM
                            </span>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                              {discountPercent}% OFF
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => openPurchaseDialog(tier)}
                          disabled={!isConnected}
                          data-testid={`button-purchase-${tier.tier}`}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase Node
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-nodes" className="space-y-6">
            {!isConnected ? (
              <Card className="p-8 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
                <p className="text-muted-foreground">
                  Connect your wallet to view your purchased nodes.
                </p>
              </Card>
            ) : userPurchases.length === 0 ? (
              <Card className="p-8 text-center">
                <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Nodes Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't purchased any nodes yet. Browse available tiers to get started.
                </p>
                <Button onClick={() => (document.querySelector('[data-testid="tab-tiers"]') as HTMLElement)?.click()}>
                  Browse Tiers
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userPurchases.map((purchase, index) => {
                  const tier = tiers.find(t => t.tier === purchase.tierId);
                  const TierIcon = TIER_ICONS[purchase.tierId % TIER_ICONS.length];
                  
                  return (
                    <Card key={index} className="hover-elevate" data-testid={`card-purchase-${index}`}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <TierIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {tier?.name || `Tier ${purchase.tierId}`}
                            </CardTitle>
                            <CardDescription>
                              Purchased: {new Date(purchase.timestamp * 1000).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Payment</span>
                            <Badge variant="secondary">
                              {purchase.paymentType === 0 ? 'ETH' : 'AXM'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Amount Paid</span>
                            <span className="font-medium">
                              {purchase.paymentType === 0 
                                ? `${parseFloat(purchase.ethPaid).toFixed(4)} ETH`
                                : `${parseFloat(purchase.axmPaid).toLocaleString()} AXM`
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge className="bg-green-500/10 text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Purchase {selectedTier?.name}
              </DialogTitle>
              <DialogDescription>
                Choose your payment method to complete the purchase.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTier && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={purchaseMethod === 'ETH' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setPurchaseMethod('ETH')}
                    data-testid="button-pay-eth"
                  >
                    <DollarSign className="h-6 w-6" />
                    <span className="font-semibold">Pay with ETH</span>
                    <span className="text-sm opacity-70">
                      {parseFloat(selectedTier.priceEth).toFixed(3)} ETH
                    </span>
                  </Button>
                  
                  <Button
                    variant={purchaseMethod === 'AXM' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2 relative"
                    onClick={() => setPurchaseMethod('AXM')}
                    data-testid="button-pay-axm"
                  >
                    <Badge className="absolute -top-2 -right-2 bg-green-500">
                      {discountPercent}% OFF
                    </Badge>
                    <Coins className="h-6 w-6" />
                    <span className="font-semibold">Pay with AXM</span>
                    <span className="text-sm opacity-70">
                      Save {discountPercent}%
                    </span>
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Node Tier</span>
                    <span className="font-medium">{selectedTier.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <Badge variant="secondary">{purchaseMethod}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your {purchaseMethod} Balance</span>
                    <span className="font-medium">
                      {purchaseMethod === 'AXM' 
                        ? `${parseFloat(tokenBalance).toLocaleString()} AXM`
                        : 'Check Wallet'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedTier && handlePurchase(selectedTier, purchaseMethod)}
                disabled={purchasingTier !== null}
                data-testid="button-confirm-purchase"
              >
                {purchasingTier !== null ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Purchase
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DePIN Node Sales Contract</p>
                <code className="text-sm font-mono">
                  {CONTRACT_ADDRESSES.DEPIN_NODE_SALES}
                </code>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={getExplorerUrl(CONTRACT_ADDRESSES.DEPIN_NODE_SALES)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-testid="link-explorer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
