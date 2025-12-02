import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Plus, ShoppingCart, Tag, Sparkles, ExternalLink, Coins, HelpCircle, Shield, TrendingUp, Zap, Palette } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface NftWithDetails {
  id: string;
  tokenId: string;
  name: string;
  description: string | null;
  mediaUrl: string;
  status: string;
  royaltyPercent: number;
  owner: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  creator: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  createdAt: string;
}

interface NftListingWithDetails {
  id: string;
  nftId: string;
  priceAxm: string;
  isAuction: boolean;
  isActive: boolean;
  nft: NftWithDetails;
  seller: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  createdAt: string;
}

export default function NFTs() {
  const { user } = useAuth();
  const { isConnected, axmBalance } = useWallet();
  const { toast } = useToast();
  const [tab, setTab] = useState("marketplace");
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NftWithDetails | null>(null);

  const [mintForm, setMintForm] = useState({
    name: "",
    description: "",
    mediaUrl: "",
    royaltyPercent: 10,
  });

  const [listForm, setListForm] = useState({
    priceAxm: "",
    isAuction: false,
  });

  const { data: listings, isLoading: listingsLoading } = useQuery<NftListingWithDetails[]>({
    queryKey: ["/api/nft-marketplace"],
  });

  const { data: myNfts, isLoading: myNftsLoading } = useQuery<NftWithDetails[]>({
    queryKey: ["/api/nfts", "my", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/nfts?ownerId=${user?.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch NFTs");
      return res.json();
    },
    enabled: !!user,
  });

  const mintNftMutation = useMutation({
    mutationFn: async (data: typeof mintForm) => {
      const res = await apiRequest("POST", "/api/nfts/mint", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "NFT Minted!", description: "Your NFT has been created successfully" });
      setMintDialogOpen(false);
      setMintForm({ name: "", description: "", mediaUrl: "", royaltyPercent: 10 });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts", "my", user?.id] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mint NFT", variant: "destructive" });
    },
  });

  const listNftMutation = useMutation({
    mutationFn: async (data: { nftId: string; priceAxm: string; isAuction: boolean }) => {
      const res = await apiRequest("POST", "/api/nft-marketplace", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Listed!", description: "Your NFT is now for sale" });
      setListDialogOpen(false);
      setSelectedNft(null);
      setListForm({ priceAxm: "", isAuction: false });
      queryClient.invalidateQueries({ queryKey: ["/api/nft-marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts", "my", user?.id] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to list NFT", variant: "destructive" });
    },
  });

  const buyNftMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const res = await apiRequest("POST", `/api/nft-marketplace/${listingId}/buy`, { txHash: null });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Purchased!", description: "NFT is now yours" });
      queryClient.invalidateQueries({ queryKey: ["/api/nft-marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts", "my", user?.id] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to buy NFT", variant: "destructive" });
    },
  });

  const handleMint = () => {
    if (!mintForm.name || !mintForm.mediaUrl) {
      toast({ title: "Error", description: "Name and media URL are required", variant: "destructive" });
      return;
    }
    mintNftMutation.mutate(mintForm);
  };

  const handleList = () => {
    if (!selectedNft || !listForm.priceAxm) {
      toast({ title: "Error", description: "Price is required", variant: "destructive" });
      return;
    }
    listNftMutation.mutate({
      nftId: selectedNft.id,
      priceAxm: listForm.priceAxm,
      isAuction: listForm.isAuction,
    });
  };

  const renderNftCard = (nft: NftWithDetails, showListButton = false) => (
    <Card key={nft.id} className="overflow-hidden hover-elevate">
      <div className="aspect-square relative bg-muted">
        <img
          src={nft.mediaUrl}
          alt={nft.name}
          className="w-full h-full object-cover"
          data-testid={`nft-image-${nft.id}`}
        />
        <Badge className="absolute top-2 right-2" variant="secondary">
          #{nft.tokenId.slice(-6)}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate" data-testid={`nft-name-${nft.id}`}>{nft.name}</h3>
        {nft.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{nft.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={nft.creator.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">{nft.creator.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">by {nft.creator.displayName || nft.creator.username}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <Badge variant="outline">{nft.royaltyPercent}% royalty</Badge>
          <Badge variant={nft.status === "listed" ? "default" : "secondary"}>{nft.status}</Badge>
        </div>
      </CardContent>
      {showListButton && nft.status !== "listed" && (
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={() => {
              setSelectedNft(nft);
              setListDialogOpen(true);
            }}
            data-testid={`button-list-nft-${nft.id}`}
          >
            <Tag className="mr-2 h-4 w-4" />
            List for Sale
          </Button>
        </CardFooter>
      )}
    </Card>
  );

  const renderListingCard = (listing: NftListingWithDetails) => (
    <Card key={listing.id} className="overflow-hidden hover-elevate">
      <div className="aspect-square relative bg-muted">
        <img
          src={listing.nft.mediaUrl}
          alt={listing.nft.name}
          className="w-full h-full object-cover"
          data-testid={`listing-image-${listing.id}`}
        />
        {listing.isAuction && (
          <Badge className="absolute top-2 left-2 bg-purple-500">Auction</Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold truncate" data-testid={`listing-name-${listing.id}`}>{listing.nft.name}</h3>
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={listing.seller.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">{listing.seller.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{listing.seller.displayName || listing.seller.username}</span>
        </div>
        <div className="flex items-center gap-1 mt-3">
          <Coins className="h-4 w-4 text-primary" />
          <span className="font-mono font-bold text-lg text-primary" data-testid={`listing-price-${listing.id}`}>
            {listing.priceAxm} AXM
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {user?.id !== listing.seller.id ? (
          <Button
            className="w-full"
            onClick={() => buyNftMutation.mutate(listing.id)}
            disabled={buyNftMutation.isPending}
            data-testid={`button-buy-${listing.id}`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {buyNftMutation.isPending ? "Buying..." : "Buy Now"}
          </Button>
        ) : (
          <Badge variant="secondary" className="w-full justify-center py-2">Your Listing</Badge>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="relative overflow-hidden rounded-xl p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(168,85,247,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.15),transparent_50%)]" />
          <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNhODU1ZjciIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmg0djJoMnY0aC0ydjJoLTR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" data-testid="text-nfts-title">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  NFT Marketplace
                </h1>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  Mint, collect, and trade unique digital assets on the Arbitrum blockchain
                </p>
              </div>
              {user && (
                <Dialog open={mintDialogOpen} onOpenChange={setMintDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-lg shadow-primary/25" data-testid="button-mint-nft">
                      <Plus className="h-4 w-4" />
                      Mint NFT
                    </Button>
                  </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mint New NFT</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={mintForm.name}
                      onChange={(e) => setMintForm({ ...mintForm, name: e.target.value })}
                      placeholder="My Awesome NFT"
                      data-testid="input-nft-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={mintForm.description}
                      onChange={(e) => setMintForm({ ...mintForm, description: e.target.value })}
                      placeholder="Describe your NFT..."
                      data-testid="input-nft-description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Media URL</label>
                    <Input
                      value={mintForm.mediaUrl}
                      onChange={(e) => setMintForm({ ...mintForm, mediaUrl: e.target.value })}
                      placeholder="https://example.com/image.png"
                      data-testid="input-nft-media"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Royalty Percent</label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={mintForm.royaltyPercent}
                      onChange={(e) => setMintForm({ ...mintForm, royaltyPercent: parseInt(e.target.value) || 0 })}
                      data-testid="input-nft-royalty"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleMint}
                    disabled={mintNftMutation.isPending}
                    data-testid="button-confirm-mint"
                  >
                    {mintNftMutation.isPending ? "Minting..." : "Mint NFT"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground">Create</span>
                </div>
                <p className="text-sm font-medium mt-1">Mint NFTs</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-pink-500/20">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-pink-400" />
                  <span className="text-xs text-muted-foreground">Trade</span>
                </div>
                <p className="text-sm font-medium mt-1">Buy & Sell</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Royalties</span>
                </div>
                <p className="text-sm font-medium mt-1">Earn Forever</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Low Fees</span>
                </div>
                <p className="text-sm font-medium mt-1">Arbitrum L2</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="marketplace" data-testid="tab-marketplace">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="my-nfts" data-testid="tab-my-nfts">
              <ImageIcon className="mr-2 h-4 w-4" />
              My NFTs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
            {listingsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <Skeleton className="aspect-square" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !listings?.length ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No NFTs Listed</h3>
                <p className="text-muted-foreground mt-2">Be the first to list an NFT for sale!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(renderListingCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-nfts">
            {!user ? (
              <Card className="p-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Sign In Required</h3>
                <p className="text-muted-foreground mt-2">Sign in to view your NFT collection</p>
              </Card>
            ) : myNftsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <Skeleton className="aspect-square" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !myNfts?.length ? (
              <Card className="p-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No NFTs Yet</h3>
                <p className="text-muted-foreground mt-2">Mint your first NFT to start your collection</p>
                <Button className="mt-4" onClick={() => setMintDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Mint Your First NFT
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myNfts.map((nft) => renderNftCard(nft, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              NFT Marketplace Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-are-nfts">
                <AccordionTrigger className="text-sm">What are NFTs on Lumina?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  NFTs (Non-Fungible Tokens) on Lumina are unique digital assets stored on the Arbitrum One 
                  blockchain. Each NFT has a unique token ID and can represent artwork, videos, music, 
                  or any digital content. You can mint your own NFTs, trade them in the marketplace, 
                  and earn royalties on secondary sales.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="mint-nft">
                <AccordionTrigger className="text-sm">How do I mint an NFT?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click the "Mint NFT" button in the header</li>
                    <li>Enter a name and description for your NFT</li>
                    <li>Provide the media URL (image, video, or audio)</li>
                    <li>Set your royalty percentage (0-50%)</li>
                    <li>Confirm the transaction to mint your NFT</li>
                  </ol>
                  <p className="mt-2">Your NFT will be stored on the blockchain and appear in your collection.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="royalties">
                <AccordionTrigger className="text-sm">How do royalties work?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  When you mint an NFT, you set a royalty percentage (up to 50%). Every time your NFT 
                  is resold on the marketplace, you automatically receive that percentage of the sale 
                  price in AXM tokens. This creates passive income from your creations forever.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="buy-sell">
                <AccordionTrigger className="text-sm">How do I buy or sell NFTs?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p><strong>To Buy:</strong> Browse the marketplace, find an NFT you like, and click 
                    "Buy Now". The AXM tokens will be deducted from your wallet and the NFT transferred 
                    to your collection.</p>
                    <p><strong>To Sell:</strong> Go to "My NFTs", select an NFT, click "List for Sale", 
                    set your price in AXM, and confirm. Your NFT will appear in the marketplace for others 
                    to purchase.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="gas-fees">
                <AccordionTrigger className="text-sm">What are the fees?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Lumina uses Arbitrum One, a Layer 2 solution, which means transaction fees (gas) are 
                  minimal compared to Ethereum mainnet. Marketplace fees are 2.5% on all sales, and 
                  creator royalties are paid from the sale price. All transactions are in LUM tokens.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Creator Earnings</p>
                <p className="text-xs text-muted-foreground">
                  Set royalties up to 50% and earn AXM tokens every time your NFT is resold. 
                  All transactions are verified on the Arbitrum One blockchain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>List NFT for Sale</DialogTitle>
            </DialogHeader>
            {selectedNft && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedNft.mediaUrl}
                    alt={selectedNft.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{selectedNft.name}</h4>
                    <p className="text-sm text-muted-foreground">Token #{selectedNft.tokenId.slice(-6)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Price (AXM)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Coins className="h-4 w-4 text-primary" />
                    <Input
                      type="number"
                      step="0.01"
                      value={listForm.priceAxm}
                      onChange={(e) => setListForm({ ...listForm, priceAxm: e.target.value })}
                      placeholder="0.00"
                      data-testid="input-list-price"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleList}
                  disabled={listNftMutation.isPending}
                  data-testid="button-confirm-list"
                >
                  {listNftMutation.isPending ? "Listing..." : "List for Sale"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
