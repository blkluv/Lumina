import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Coins, ExternalLink, CheckCircle, AlertCircle, Gift, Heart, Star, Sparkles, Flame, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/lib/walletContext";
import { AXM_TOKEN_ADDRESS, parseAxmAmount } from "@/lib/web3Config";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface GiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: User;
  postId?: string;
  streamId?: string;
}

const giftTypes = [
  { type: "heart", label: "Heart", value: "1", icon: Heart, color: "text-red-500" },
  { type: "star", label: "Star", value: "5", icon: Star, color: "text-yellow-500" },
  { type: "sparkle", label: "Sparkle", value: "10", icon: Sparkles, color: "text-blue-500" },
  { type: "flame", label: "Flame", value: "25", icon: Flame, color: "text-orange-500" },
  { type: "crown", label: "Crown", value: "50", icon: Crown, color: "text-purple-500" },
  { type: "diamond", label: "Diamond", value: "100", icon: Gift, color: "text-cyan-500" },
];

export function GiftModal({ open, onOpenChange, recipient, postId, streamId }: GiftModalProps) {
  const { address, isConnected, axmBalance, connect, isCorrectNetwork, switchNetwork } = useWallet();
  const { toast } = useToast();
  const [selectedGift, setSelectedGift] = useState<typeof giftTypes[0] | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const sendGiftMutation = useMutation({
    mutationFn: async (data: { 
      recipientId: string;
      giftType: string;
      axmValue: string;
      message?: string;
      txHash?: string;
      postId?: string;
      streamId?: string;
    }) => {
      const res = await apiRequest("POST", "/api/gifts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gifts/received"] });
      toast({ title: "Gift sent successfully!" });
    },
  });

  const handleSendGift = async () => {
    if (!isConnected || !recipient.walletAddress || !selectedGift) return;

    if (!isCorrectNetwork) {
      const switched = await switchNetwork();
      if (!switched) {
        toast({
          title: "Network switch required",
          description: "Please switch to Arbitrum One to send gifts.",
          variant: "destructive",
        });
        return;
      }
    }

    setStatus("pending");

    try {
      const amountWei = parseAxmAmount(selectedGift.value);
      const data = `0xa9059cbb000000000000000000000000${recipient.walletAddress.slice(2)}${amountWei.toString(16).padStart(64, "0")}`;

      const txHashResult = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: AXM_TOKEN_ADDRESS, data }],
      });

      setTxHash(txHashResult);

      await sendGiftMutation.mutateAsync({
        recipientId: recipient.id,
        giftType: selectedGift.type,
        axmValue: selectedGift.value,
        message: message || undefined,
        txHash: txHashResult,
        postId,
        streamId,
      });

      setStatus("success");
    } catch (error: any) {
      setStatus("error");
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to send gift. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setSelectedGift(null);
    setMessage("");
    setStatus("idle");
    setTxHash(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Send a Gift
          </DialogTitle>
          <DialogDescription>
            Send a virtual gift with AXM tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={recipient.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {(recipient.displayName || recipient.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{recipient.displayName || recipient.username}</p>
              <p className="text-sm text-muted-foreground">@{recipient.username}</p>
            </div>
          </div>

          {status === "success" ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Gift Sent!</h3>
                <p className="text-muted-foreground text-sm">
                  You sent a {selectedGift?.label} to @{recipient.username}
                </p>
              </div>
              {txHash && (
                <a
                  href={`https://arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary text-sm hover:underline"
                >
                  View on Arbiscan
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <Button onClick={handleClose} className="w-full" data-testid="button-gift-done">
                Done
              </Button>
            </div>
          ) : status === "error" ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Transaction Failed</h3>
                <p className="text-muted-foreground text-sm">
                  Something went wrong. Please try again.
                </p>
              </div>
              <Button onClick={() => setStatus("idle")} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          ) : !isConnected ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-muted-foreground">
                Connect your wallet to send gifts
              </p>
              <Button onClick={connect} className="w-full gap-2" data-testid="button-connect-gift">
                Connect Wallet
              </Button>
            </div>
          ) : !recipient.walletAddress ? (
            <div className="text-center space-y-4 py-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                This creator hasn't connected their wallet yet
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Choose a Gift</Label>
                <div className="grid grid-cols-3 gap-2">
                  {giftTypes.map((gift) => {
                    const Icon = gift.icon;
                    const isSelected = selectedGift?.type === gift.type;
                    return (
                      <button
                        key={gift.type}
                        onClick={() => setSelectedGift(gift)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`button-gift-${gift.type}`}
                      >
                        <Icon className={`h-8 w-8 ${gift.color}`} />
                        <span className="text-xs font-medium">{gift.label}</span>
                        <span className="text-xs text-muted-foreground">{gift.value} AXM</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add a Message (Optional)</Label>
                <Input
                  placeholder="Say something nice..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={100}
                  data-testid="input-gift-message"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Your balance: {axmBalance} AXM</span>
                {selectedGift && (
                  <span className="text-primary font-medium">
                    Cost: {selectedGift.value} AXM
                  </span>
                )}
              </div>

              <Button
                onClick={handleSendGift}
                disabled={!selectedGift || status === "pending"}
                className="w-full shadow-lg shadow-primary/25"
                data-testid="button-send-gift"
              >
                {status === "pending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === "pending" ? "Sending..." : `Send ${selectedGift?.label || "Gift"}`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
