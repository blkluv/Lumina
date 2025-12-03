import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowDownUp,
  Droplets,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Info,
  ArrowDown,
  Percent,
  Wallet,
  Lock,
  Activity,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { useWallet } from "@/lib/walletContext";
import { useExchangeContract, useTokenContract, PoolInfo } from "@/lib/useContracts";
import { CONTRACT_ADDRESSES, getExplorerUrl, formatTokenAmount, parseTokenAmount } from "@/lib/contracts";

export default function Exchange() {
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const exchange = useExchangeContract();
  const token = useTokenContract();
  
  const [totalPools, setTotalPools] = useState<number>(0);
  const [totalSwaps, setTotalSwaps] = useState<number>(0);
  const [swapFee, setSwapFee] = useState<number>(30);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [userPoolIds, setUserPoolIds] = useState<number[]>([]);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  
  const [swapFromToken, setSwapFromToken] = useState<string>('ETH');
  const [swapToToken, setSwapToToken] = useState<string>('AXM');
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [estimatedOutput, setEstimatedOutput] = useState<string>('0');
  const [isSwapping, setIsSwapping] = useState(false);
  const [slippage, setSlippage] = useState<string>('0.5');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [poolsCount, swapsCount, fee] = await Promise.all([
        exchange.getTotalPools(),
        exchange.getTotalSwaps(),
        exchange.getSwapFee(),
      ]);
      
      setTotalPools(poolsCount);
      setTotalSwaps(swapsCount);
      setSwapFee(fee);

      const poolPromises = [];
      for (let i = 1; i <= Math.min(poolsCount, 20); i++) {
        poolPromises.push(exchange.getPool(i));
      }
      const poolResults = await Promise.all(poolPromises);
      setPools(poolResults.filter((p): p is PoolInfo => p !== null && p.isActive));

      if (isConnected && address) {
        const [balance, userPools] = await Promise.all([
          token.getBalance(address),
          exchange.getUserPools(address),
        ]);
        setTokenBalance(balance);
        setUserPoolIds(userPools);
      }
    } catch (error) {
      console.error('Failed to fetch exchange data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isConnected, address]);

  const handleSwapTokens = () => {
    const temp = swapFromToken;
    setSwapFromToken(swapToToken);
    setSwapToToken(temp);
    setSwapAmount('');
    setEstimatedOutput('0');
  };

  const handleSwap = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to swap tokens",
        variant: "destructive",
      });
      return;
    }

    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid swap amount",
        variant: "destructive",
      });
      return;
    }

    setIsSwapping(true);
    try {
      toast({
        title: "Swap Initiated",
        description: "Swap functionality requires an active pool. Please create a pool first.",
      });
    } catch (error: any) {
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to execute swap",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const feePercentage = (swapFee / 100).toFixed(2);

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
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-exchange-title">
              <ArrowDownUp className="h-8 w-8 text-primary" />
              Axiom Exchange
            </h1>
            <p className="text-muted-foreground mt-1">
              Swap tokens and provide liquidity on the decentralized exchange
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
          <Card className="hover-elevate" data-testid="card-total-pools">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Liquidity Pools</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-pools">
                  {totalPools}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Active trading pairs
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-total-swaps">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Swaps</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-swaps">
                  {totalSwaps.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                All-time transactions
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-swap-fee">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Swap Fee</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-swap-fee">
                  {feePercentage}%
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Per transaction
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-your-balance">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your AXM Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-axm-balance">
                  {isConnected ? parseFloat(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {isConnected ? 'Available for trading' : 'Connect wallet'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownUp className="h-5 w-5" />
                  Swap Tokens
                </CardTitle>
                <CardDescription>
                  Trade tokens instantly with low fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <div className="flex gap-2">
                      <Select value={swapFromToken} onValueChange={setSwapFromToken}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="AXM">AXM</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                        className="flex-1"
                        data-testid="input-swap-amount"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full"
                      onClick={handleSwapTokens}
                      data-testid="button-swap-direction"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>To (estimated)</Label>
                    <div className="flex gap-2">
                      <Select value={swapToToken} onValueChange={setSwapToToken}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="AXM">AXM</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={estimatedOutput}
                        disabled
                        className="flex-1"
                        data-testid="input-estimated-output"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Slippage Tolerance</span>
                    <Select value={slippage} onValueChange={setSlippage}>
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.1">0.1%</SelectItem>
                        <SelectItem value="0.5">0.5%</SelectItem>
                        <SelectItem value="1.0">1.0%</SelectItem>
                        <SelectItem value="3.0">3.0%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Swap Fee</span>
                    <span>{feePercentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Route</span>
                    <span>{swapFromToken} → {swapToToken}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={!isConnected || isSwapping || !swapAmount}
                  onClick={handleSwap}
                  data-testid="button-swap"
                >
                  {!isConnected ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </>
                  ) : isSwapping ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Swapping...
                    </>
                  ) : (
                    <>
                      <ArrowDownUp className="h-4 w-4 mr-2" />
                      Swap
                    </>
                  )}
                </Button>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Swaps are executed on-chain using the Axiom Exchange smart contract. 
                    Trades are subject to a {feePercentage}% fee which goes to liquidity providers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Active Pools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : pools.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active pools</p>
                  </div>
                ) : (
                  pools.slice(0, 5).map((pool) => (
                    <div 
                      key={pool.poolId} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                      data-testid={`pool-${pool.poolId}`}
                    >
                      <div>
                        <p className="font-medium text-sm">Pool #{pool.poolId}</p>
                        <p className="text-xs text-muted-foreground">
                          TVL: {parseFloat(pool.totalLiquidity).toLocaleString()} tokens
                        </p>
                      </div>
                      <Badge variant="secondary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Your Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Connect wallet to view positions</p>
                  </div>
                ) : userPoolIds.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No liquidity positions</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Add Liquidity
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userPoolIds.map((poolId) => (
                      <div 
                        key={poolId}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <span className="font-medium text-sm">Pool #{poolId}</span>
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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
                <p className="text-sm text-muted-foreground">Exchange Hub Contract</p>
                <code className="text-sm font-mono">
                  {CONTRACT_ADDRESSES.EXCHANGE_HUB}
                </code>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={getExplorerUrl(CONTRACT_ADDRESSES.EXCHANGE_HUB)} 
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
