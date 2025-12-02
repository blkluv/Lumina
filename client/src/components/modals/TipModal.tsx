import { useState } from "react";
import { Loader2, Coins, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface TipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: User;
}

export function TipModal({ open, onOpenChange, recipient }: TipModalProps) {
  const { address, isConnected, axmBalance, connect, isCorrectNetwork, switchNetwork } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const quickAmounts = ["1", "5", "10", "25", "50"];

  const handleTip = async () => {
    if (!isConnected || !recipient.walletAddress || !amount) return;

    if (!isCorrectNetwork) {
      const switched = await switchNetwork();
      if (!switched) {
        toast({
          title: "Network switch required",
          description: "Please switch to Arbitrum One to send tips.",
          variant: "destructive",
        });
        return;
      }
    }

    setStatus("pending");

    try {
      const amountWei = parseAxmAmount(amount);
      const data = `0xa9059cbb000000000000000000000000${recipient.walletAddress.slice(2)}${amountWei.toString(16).padStart(64, "0")}`;

      const txHashResult = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: AXM_TOKEN_ADDRESS,
            data,
          },
        ],
      });

      setTxHash(txHashResult);
      
      // Record transaction in database
      try {
        await apiRequest("POST", "/api/transactions", {
          toUserId: recipient.id,
          type: "tip",
          amount: amount,
          txHash: txHashResult,
          metadata: { 
            recipientUsername: recipient.username,
            tokenAddress: AXM_TOKEN_ADDRESS,
          },
        });
      } catch (dbError) {
        console.error("Failed to record transaction:", dbError);
      }
      
      setStatus("success");
      
      toast({
        title: "Tip sent!",
        description: `You sent ${amount} AXM to @${recipient.username}`,
      });
    } catch (error: any) {
      setStatus("error");
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to send tip. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setAmount("");
    setStatus("idle");
    setTxHash(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Send Tip
          </DialogTitle>
          <DialogDescription>
            Send AXM tokens directly to this creator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={recipient.avatarUrl || undefined} alt={recipient.displayName || recipient.username} />
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
                <h3 className="text-lg font-semibold">Tip Sent!</h3>
                <p className="text-muted-foreground text-sm">
                  You sent {amount} AXM to @{recipient.username}
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
              <Button onClick={handleClose} className="w-full" data-testid="button-tip-done">
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
                Connect your wallet to send tips
              </p>
              <Button onClick={connect} className="w-full gap-2" data-testid="button-connect-tip">
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
                <Label>Amount (AXM)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg font-mono"
                  data-testid="input-tip-amount"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Your balance: {axmBalance} AXM</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt)}
                    className="flex-1 min-w-16"
                    data-testid={`button-quick-amount-${amt}`}
                  >
                    {amt} AXM
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleTip}
                disabled={!amount || parseFloat(amount) <= 0 || status === "pending"}
                className="w-full shadow-lg shadow-primary/25"
                data-testid="button-send-tip"
              >
                {status === "pending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === "pending" ? "Sending..." : `Send ${amount || "0"} AXM`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
