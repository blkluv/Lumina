import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  Shield,
  Lock,
  Gift,
  Users,
  Sparkles,
  Copy,
  Check,
  DollarSign,
  BarChart3,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { useTreasuryContract, usePriceOracle } from "@/lib/useContracts";
import { CONTRACT_ADDRESSES, NETWORK_CONFIG, TREASURY_CONFIG } from "@/lib/contracts";

export default function Treasury() {
  const { toast } = useToast();
  const treasury = useTreasuryContract();
  const priceOracle = usePriceOracle();
  
  const [treasuryBalance, setTreasuryBalance] = useState<string>('0');
  const [totalSupply, setTotalSupply] = useState<string>('0');
  const [circulatingSupply, setCirculatingSupply] = useState<string>('0');
  const [axmPrice, setAxmPrice] = useState<number>(0.001);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [priceSource, setPriceSource] = useState<string>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balance, supply, circulating, priceData] = await Promise.all([
        treasury.getTreasuryBalance(),
        treasury.getTotalSupply(),
        treasury.getCirculatingSupply(),
        priceOracle.getAXMPrice()
      ]);
      
      setTreasuryBalance(balance);
      setTotalSupply(supply);
      setCirculatingSupply(circulating);
      setAxmPrice(priceData);
      
      const priceResponse = await fetch('/api/price/axm');
      const priceInfo = await priceResponse.json();
      setPriceChange24h(priceInfo.change24h || 0);
      setPriceSource(priceInfo.source || 'fallback');
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch treasury data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const copyAddress = async (address: string, label: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: "Address Copied",
      description: `${label} address copied to clipboard`,
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatUSD = (tokens: string | number): string => {
    const num = typeof tokens === 'string' ? parseFloat(tokens.replace(/,/g, '')) : tokens;
    if (isNaN(num)) return '$0.00';
    const usdValue = num * axmPrice;
    
    if (usdValue >= 1e9) {
      return `$${(usdValue / 1e9).toFixed(2)}B`;
    } else if (usdValue >= 1e6) {
      return `$${(usdValue / 1e6).toFixed(2)}M`;
    } else if (usdValue >= 1e3) {
      return `$${(usdValue / 1e3).toFixed(2)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdValue);
  };

  const calculatePercentage = (balance: string, total: string): number => {
    const balanceNum = parseFloat(balance.replace(/,/g, ''));
    const totalNum = parseFloat(total.replace(/,/g, ''));
    if (isNaN(balanceNum) || isNaN(totalNum) || totalNum === 0) return 0;
    return (balanceNum / totalNum) * 100;
  };

  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const treasuryPercentage = calculatePercentage(treasuryBalance, totalSupply);

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
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-treasury-title">
              <Wallet className="h-8 w-8 text-primary" />
              Treasury Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time treasury balances and token metrics on Arbitrum One
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
          <Card className="hover-elevate" data-testid="card-axm-price">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AXM Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-axm-price">
                ${axmPrice.toFixed(6)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {priceChange24h >= 0 ? (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{priceChange24h.toFixed(2)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {priceChange24h.toFixed(2)}%
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {priceSource === 'coingecko' ? 'Live' : 'Est.'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-treasury-balance">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-treasury-balance">
                {isLoading ? '...' : formatNumber(treasuryBalance)} AXM
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-treasury-usd">
                {formatUSD(treasuryBalance)} USD
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-rewards-pool">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Pool</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-rewards-allocation">
                {formatNumber(TREASURY_CONFIG.REWARDS_POOL_ALLOCATION)} AXM
              </div>
              <p className="text-sm text-muted-foreground">
                {formatUSD(TREASURY_CONFIG.REWARDS_POOL_ALLOCATION)} allocated
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-circulating">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Circulating Supply</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-circulating">
                {isLoading ? '...' : formatNumber(circulatingSupply)} AXM
              </div>
              <p className="text-sm text-muted-foreground">
                of {formatNumber(totalSupply)} total
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card data-testid="card-token-distribution">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Token Distribution
              </CardTitle>
              <CardDescription>
                Current allocation of AXM tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Treasury Holdings</span>
                  <span className="text-sm text-muted-foreground">
                    {treasuryPercentage.toFixed(2)}%
                  </span>
                </div>
                <Progress value={treasuryPercentage} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Circulating Supply</span>
                  <span className="text-sm text-muted-foreground">
                    {(100 - treasuryPercentage).toFixed(2)}%
                  </span>
                </div>
                <Progress value={100 - treasuryPercentage} className="h-2" />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Supply</span>
                  <span className="font-medium">15,000,000,000 AXM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Supply</span>
                  <span className="font-medium">{formatNumber(totalSupply)} AXM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fully Diluted Value</span>
                  <span className="font-medium">{formatUSD(15000000000)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-contract-addresses">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Contract Addresses
              </CardTitle>
              <CardDescription>
                Verified contracts on Arbitrum One
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'AXM Token', address: CONTRACT_ADDRESSES.AXM_TOKEN },
                { label: 'Treasury Vault', address: TREASURY_CONFIG.TREASURY_VAULT_ADDRESS },
                { label: 'Staking Hub', address: CONTRACT_ADDRESSES.STAKING_EMISSIONS },
                { label: 'Social Hub', address: CONTRACT_ADDRESSES.COMMUNITY_SOCIAL },
                { label: 'Gamification', address: CONTRACT_ADDRESSES.GAMIFICATION },
              ].map(({ label, address }) => (
                <div 
                  key={address}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {shortenAddress(address)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyAddress(address, label)}
                      data-testid={`button-copy-${label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {copiedAddress === address ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <a
                      href={`${NETWORK_CONFIG.blockExplorer}/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" data-testid={`button-explorer-${label.toLowerCase().replace(/\s/g, '-')}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="hover-elevate" data-testid="card-feature-rewards">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                User Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Earn AXM tokens for creating quality content, engaging with the community, 
                and completing daily activities.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Posts</Badge>
                <Badge variant="secondary">Likes</Badge>
                <Badge variant="secondary">Streaks</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-feature-staking">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Staking Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Stake your AXM tokens to earn passive rewards and gain governance 
                voting power in the DAO.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">APY</Badge>
                <Badge variant="secondary">Voting</Badge>
                <Badge variant="secondary">Tiers</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-feature-tips">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Creator Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Support your favorite creators directly with AXM tips. 
                100% of tips go to the creator.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Direct</Badge>
                <Badge variant="secondary">Instant</Badge>
                <Badge variant="secondary">No Fees</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8" data-testid="card-network-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Network Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Network</p>
                <p className="font-bold">{NETWORK_CONFIG.chainName}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Chain ID</p>
                <p className="font-bold">{NETWORK_CONFIG.chainId}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="font-bold">{lastUpdated.toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Data refreshes automatically every 60 seconds. 
            Treasury balances are read directly from the blockchain.
          </p>
          <p className="mt-2">
            <Link href="/whitepaper" className="text-primary hover:underline" data-testid="link-whitepaper">
              Read the Whitepaper
            </Link>
            {' | '}
            <a 
              href={NETWORK_CONFIG.blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View on Arbiscan
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
