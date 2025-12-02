import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, Smartphone, Key, Check, AlertTriangle, Loader2 } from "lucide-react";

interface TwoFactorStatus {
  enabled: boolean;
  method: string | null;
}

interface SetupResponse {
  success: boolean;
  secret: string;
  qrCodeUrl: string;
}

export function SecuritySettings() {
  const { toast } = useToast();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);

  const { data: status, isLoading } = useQuery<TwoFactorStatus>({
    queryKey: ["/api/2fa/status"],
  });

  const setupMutation = useMutation({
    mutationFn: async (): Promise<SetupResponse> => {
      const response = await apiRequest("POST", "/api/2fa/setup", { method: "totp" });
      return response.json();
    },
    onSuccess: (data: SetupResponse) => {
      setSetupData(data);
    },
    onError: () => {
      toast({ title: "Failed to setup 2FA", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/2fa/verify", { code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/2fa/status"] });
      setSetupDialogOpen(false);
      setSetupData(null);
      setVerifyCode("");
      toast({ title: "Two-factor authentication enabled" });
    },
    onError: () => {
      toast({ title: "Invalid verification code", variant: "destructive" });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/2fa/disable");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/2fa/status"] });
      toast({ title: "Two-factor authentication disabled" });
    },
    onError: () => {
      toast({ title: "Failed to disable 2FA", variant: "destructive" });
    },
  });

  const handleSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (verifyCode.length === 6) {
      verifyMutation.mutate(verifyCode);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="security-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </CardTitle>
        <CardDescription>Manage your account security settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">Two-Factor Authentication</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {status?.enabled ? (
            <div className="space-y-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Your account is protected with {status.method?.toUpperCase() || "TOTP"} authentication
                </AlertDescription>
              </Alert>
              
              <Button
                variant="destructive"
                onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending}
                data-testid="disable-2fa"
              >
                {disableMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Disable 2FA
              </Button>
            </div>
          ) : (
            <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleSetup} disabled={setupMutation.isPending} data-testid="enable-2fa">
                  {setupMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Enable 2FA
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="2fa-setup-dialog">
                <DialogHeader>
                  <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                </DialogHeader>
                
                {setupData ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>1. Scan this QR code with your authenticator app</Label>
                      <div className="flex justify-center p-4 bg-white rounded-lg">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUrl)}`}
                          alt="QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Or enter this secret manually:</Label>
                      <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
                        {setupData.secret}
                      </code>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="verify-code">2. Enter the 6-digit code from your app</Label>
                      <Input
                        id="verify-code"
                        type="text"
                        placeholder="000000"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest"
                        data-testid="2fa-code-input"
                      />
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={handleVerify}
                      disabled={verifyCode.length !== 6 || verifyMutation.isPending}
                      data-testid="verify-2fa"
                    >
                      {verifyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Verify and Enable
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="font-medium">Password</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Change your account password
              </p>
            </div>
            <Button variant="outline" disabled data-testid="change-password">
              Change
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
