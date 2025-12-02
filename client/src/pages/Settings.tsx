import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { 
  Loader2, 
  User, 
  Wallet, 
  Bell, 
  Shield, 
  LogOut, 
  Camera, 
  Link as LinkIcon, 
  Check, 
  AlertTriangle, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Clock, 
  Settings as SettingsIcon,
  ImageIcon,
  Palette,
  Eye,
  EyeOff,
  Trash2,
  X,
  ShieldAlert,
  MessageSquare,
  Scale
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { truncateAddress } from "@/lib/web3Config";
import { apiRequest, queryClient } from "@/lib/queryClient";

const profileSchema = z.object({
  displayName: z.string().max(50, "Display name must be 50 characters or less").optional(),
  bio: z.string().max(300, "Bio must be 300 characters or less").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be 20 characters or less"),
  location: z.string().max(100, "Location must be 100 characters or less").optional(),
  website: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  pronouns: z.string().max(30, "Pronouns must be 30 characters or less").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const BUSINESS_CATEGORIES = [
  { value: "creator", label: "Content Creator" },
  { value: "brand", label: "Brand" },
  { value: "restaurant", label: "Restaurant & Food" },
  { value: "retail", label: "Retail & Shopping" },
  { value: "service", label: "Professional Services" },
  { value: "entertainment", label: "Entertainment & Media" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const PROFILE_THEMES = [
  { value: "default", label: "Default", colors: ["#10b981", "#059669"] },
  { value: "ocean", label: "Ocean", colors: ["#0ea5e9", "#0284c7"] },
  { value: "sunset", label: "Sunset", colors: ["#f97316", "#ea580c"] },
  { value: "purple", label: "Purple", colors: ["#a855f7", "#9333ea"] },
  { value: "rose", label: "Rose", colors: ["#f43f5e", "#e11d48"] },
  { value: "gold", label: "Gold", colors: ["#eab308", "#ca8a04"] },
];

const ACCENT_COLORS = [
  { value: "#10b981", label: "Emerald" },
  { value: "#0ea5e9", label: "Sky" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#ec4899", label: "Pink" },
];

const PRONOUNS_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "he/him", label: "He/Him" },
  { value: "she/her", label: "She/Her" },
  { value: "they/them", label: "They/Them" },
  { value: "custom", label: "Custom" },
];

interface Warning {
  id: string;
  warningNumber: number;
  reason: string;
  details: string | null;
  violationId: string | null;
  acknowledgedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

interface MyWarningsData {
  warnings: Warning[];
  strikeCount: number;
  maxStrikes: number;
  accountAtRisk: boolean;
}

interface AppealData {
  id: string;
  violationId: string;
  reason: string;
  additionalInfo: string | null;
  status: string;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  violation?: {
    violationType: string;
    contentType: string;
    severity: string;
  };
}

function ModerationSection() {
  const { toast } = useToast();
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [selectedViolationId, setSelectedViolationId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState("");
  const [appealAdditionalInfo, setAppealAdditionalInfo] = useState("");

  const { data: warningsData, isLoading: warningsLoading } = useQuery<MyWarningsData>({
    queryKey: ["/api/moderation/my-warnings"],
  });

  const { data: myAppeals, isLoading: appealsLoading } = useQuery<AppealData[]>({
    queryKey: ["/api/appeals/me"],
  });

  const submitAppealMutation = useMutation({
    mutationFn: async ({ violationId, reason, additionalInfo }: { violationId: string; reason: string; additionalInfo?: string }) => {
      return apiRequest("POST", "/api/appeals", { violationId, reason, additionalInfo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appeals/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/my-warnings"] });
      toast({ title: "Appeal submitted successfully" });
      setAppealDialogOpen(false);
      setAppealReason("");
      setAppealAdditionalInfo("");
      setSelectedViolationId(null);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to submit appeal", variant: "destructive" });
    },
  });

  const handleAppealClick = (violationId: string) => {
    setSelectedViolationId(violationId);
    setAppealDialogOpen(true);
  };

  const handleSubmitAppeal = () => {
    if (!selectedViolationId || !appealReason.trim()) {
      toast({ title: "Please provide a reason for your appeal", variant: "destructive" });
      return;
    }
    submitAppealMutation.mutate({
      violationId: selectedViolationId,
      reason: appealReason,
      additionalInfo: appealAdditionalInfo || undefined,
    });
  };

  return (
    <>
      {/* Warning Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Account Status
          </CardTitle>
          <CardDescription>
            Your content moderation status and warnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warningsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Strike Counter */}
              <div className={`p-4 rounded-lg border ${
                warningsData?.accountAtRisk 
                  ? "border-red-500/20 bg-red-500/5" 
                  : "border-green-500/20 bg-green-500/5"
              }`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="font-medium">Warning Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {warningsData?.strikeCount || 0} of {warningsData?.maxStrikes || 3} strikes
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((strike) => (
                      <div
                        key={strike}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          strike <= (warningsData?.strikeCount || 0)
                            ? "bg-red-500 text-white"
                            : "bg-muted"
                        }`}
                        data-testid={`strike-indicator-${strike}`}
                      >
                        {strike <= (warningsData?.strikeCount || 0) ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {warningsData?.accountAtRisk && (
                  <p className="mt-3 text-sm text-red-500 font-medium">
                    Your account is at risk. One more violation may result in a ban.
                  </p>
                )}
              </div>

              {/* Warnings List */}
              {warningsData?.warnings && warningsData.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Your Warnings</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {warningsData.warnings.map((warning) => (
                        <div
                          key={warning.id}
                          className="border rounded-lg p-3"
                          data-testid={`warning-${warning.id}`}
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="bg-red-500/10 text-red-500">
                                  Strike #{warning.warningNumber}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{warning.reason}</p>
                              {warning.details && (
                                <p className="text-xs text-muted-foreground mt-1">{warning.details}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Issued: {new Date(warning.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {warning.violationId && !myAppeals?.some(a => a.violationId === warning.violationId) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAppealClick(warning.violationId!)}
                                data-testid={`appeal-button-${warning.id}`}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Appeal
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {(!warningsData?.warnings || warningsData.warnings.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No warnings on your account</p>
                  <p className="text-sm">Keep up the great work!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Appeals Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            My Appeals
          </CardTitle>
          <CardDescription>
            Track the status of your submitted appeals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appealsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !myAppeals || myAppeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p>No appeals submitted</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {myAppeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    className="border rounded-lg p-3"
                    data-testid={`my-appeal-${appeal.id}`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge
                            variant="outline"
                            className={
                              appeal.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : appeal.status === "approved"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }
                          >
                            {appeal.status === "pending" ? "Under Review" : appeal.status}
                          </Badge>
                          {appeal.violation && (
                            <Badge variant="outline">{appeal.violation.violationType}</Badge>
                          )}
                        </div>
                        <p className="text-sm">{appeal.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted: {new Date(appeal.createdAt).toLocaleDateString()}
                        </p>
                        {appeal.reviewNotes && (
                          <p className="text-xs mt-2 p-2 rounded bg-muted">
                            <span className="font-medium">Admin Response:</span> {appeal.reviewNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Appeal Dialog */}
      <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit an Appeal</DialogTitle>
            <DialogDescription>
              Explain why you believe this violation was issued in error. Our moderation team will review your appeal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="appeal-reason">Reason for Appeal *</Label>
              <Textarea
                id="appeal-reason"
                placeholder="Explain why you believe this was a mistake..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                className="mt-2"
                data-testid="input-appeal-reason"
              />
            </div>
            <div>
              <Label htmlFor="appeal-additional">Additional Information</Label>
              <Textarea
                id="appeal-additional"
                placeholder="Any additional context or evidence..."
                value={appealAdditionalInfo}
                onChange={(e) => setAppealAdditionalInfo(e.target.value)}
                className="mt-2"
                data-testid="input-appeal-additional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppealDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAppeal}
              disabled={submitAppealMutation.isPending || !appealReason.trim()}
              data-testid="button-submit-appeal"
            >
              {submitAppealMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Appeal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, logout, updateUser } = useAuth();
  const { address, isConnected, isCorrectNetwork, connect, disconnect, bindWallet, switchNetwork } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBindingWallet, setIsBindingWallet] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [customPronouns, setCustomPronouns] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [privacySettings, setPrivacySettings] = useState({
    showWalletOnProfile: user?.showWalletOnProfile ?? true,
    showBadgesOnProfile: user?.showBadgesOnProfile ?? true,
  });

  const [themeSettings, setThemeSettings] = useState({
    profileTheme: user?.profileTheme || "default",
    profileAccentColor: user?.profileAccentColor || "#10b981",
  });

  const [businessForm, setBusinessForm] = useState({
    isBusinessAccount: user?.isBusinessAccount || false,
    businessCategory: user?.businessCategory || "",
    businessName: user?.businessName || "",
    businessEmail: user?.businessEmail || "",
    businessPhone: user?.businessPhone || "",
    businessWebsite: user?.businessWebsite || "",
    businessAddress: typeof user?.businessAddress === 'string' ? user.businessAddress : "",
    businessHours: typeof user?.businessHours === 'string' ? user.businessHours : "",
    businessDescription: user?.businessDescription || "",
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      username: user?.username || "",
      location: user?.location || "",
      website: user?.website || "",
      pronouns: user?.pronouns || "",
    },
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleUpdateProfile = async (values: ProfileFormValues) => {
    setIsUpdating(true);
    try {
      await apiRequest("PATCH", "/api/users/me", values);
      updateUser(values);
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateTheme = async () => {
    setIsUpdating(true);
    try {
      await apiRequest("PATCH", "/api/users/me", themeSettings);
      updateUser(themeSettings);
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
      toast({
        title: "Theme updated",
        description: "Your profile theme has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update theme",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePrivacy = async () => {
    setIsUpdatingPrivacy(true);
    try {
      await apiRequest("PATCH", "/api/users/me", privacySettings);
      updateUser(privacySettings);
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
      toast({
        title: "Privacy settings updated",
        description: "Your preferences have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update privacy",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleBindWallet = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }

    setIsBindingWallet(true);
    try {
      await bindWallet();
      toast({
        title: "Wallet connected",
        description: "Your wallet has been successfully linked to your account.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to connect wallet",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBindingWallet(false);
    }
  };

  const handleUnbindWallet = async () => {
    try {
      await apiRequest("DELETE", "/api/wallet/unbind", {});
      updateUser({ walletAddress: null, walletVerified: false });
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been unlinked from your account.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to disconnect wallet",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleUpdateBusiness = async () => {
    setIsUpdatingBusiness(true);
    try {
      await apiRequest("PATCH", "/api/users/me/business", businessForm);
      updateUser({
        ...businessForm,
        businessCategory: businessForm.businessCategory as "creator" | "brand" | "restaurant" | "retail" | "service" | "entertainment" | "education" | "other" | null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
      toast({
        title: "Business profile updated",
        description: "Your business settings have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update business profile",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar must be under 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadRes = await apiRequest("POST", "/api/objects/upload", {});
      const { uploadURL } = await uploadRes.json();

      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      const updateRes = await apiRequest("PUT", "/api/media", {
        mediaURL: uploadURL.split("?")[0],
      });
      const { objectPath } = await updateRes.json();

      await apiRequest("PATCH", "/api/users/me", { avatarUrl: objectPath });
      updateUser({ avatarUrl: objectPath });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been changed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update avatar",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Banner must be under 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingBanner(true);
    try {
      const uploadRes = await apiRequest("POST", "/api/objects/upload", {});
      const { uploadURL } = await uploadRes.json();

      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      const updateRes = await apiRequest("PUT", "/api/media", {
        mediaURL: uploadURL.split("?")[0],
      });
      const { objectPath } = await updateRes.json();

      await apiRequest("PATCH", "/api/users/me", { bannerUrl: objectPath });
      updateUser({ bannerUrl: objectPath });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });

      toast({
        title: "Banner updated",
        description: "Your profile banner has been changed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update banner",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleRemoveBanner = async () => {
    try {
      await apiRequest("PATCH", "/api/users/me", { bannerUrl: null });
      updateUser({ bannerUrl: null });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
      toast({
        title: "Banner removed",
        description: "Your profile banner has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to remove banner",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 p-6 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" data-testid="text-settings-title">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Customize your profile, appearance & Web3 wallet
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
            <TabsTrigger value="profile" className="gap-2" data-testid="tab-profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2" data-testid="tab-appearance">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-2" data-testid="tab-wallet">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-2" data-testid="tab-moderation">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Moderation</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2" data-testid="tab-business">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* Banner & Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Profile Images
                </CardTitle>
                <CardDescription>
                  Customize your profile banner and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Banner */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Profile Banner</label>
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <div 
                      className="h-32 sm:h-48 bg-muted relative"
                      style={user.bannerUrl ? { 
                        backgroundImage: `url(${user.bannerUrl})`, 
                        backgroundSize: "cover", 
                        backgroundPosition: "center" 
                      } : undefined}
                    >
                      {!user.bannerUrl && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/20" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <input
                          ref={bannerInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="hidden"
                          data-testid="input-banner-file"
                        />
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="gap-2 bg-background/80 backdrop-blur-sm"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={isUploadingBanner}
                          data-testid="button-change-banner"
                        >
                          {isUploadingBanner ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          {isUploadingBanner ? "Uploading..." : user.bannerUrl ? "Change Banner" : "Add Banner"}
                        </Button>
                        {user.bannerUrl && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2 bg-background/80 backdrop-blur-sm"
                            onClick={handleRemoveBanner}
                            data-testid="button-remove-banner"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended size: 1500x500 pixels. Max 5MB. JPG, PNG or GIF.
                  </p>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                      {(user.displayName || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      data-testid="input-avatar-file"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2" 
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      data-testid="button-change-avatar"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {isUploadingAvatar ? "Uploading..." : "Change Avatar"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Square image recommended. Max 2MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Tell the world about yourself
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your display name" data-testid="input-display-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                <Input {...field} className="pl-8" placeholder="username" data-testid="input-username" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Tell us about yourself, your mission, what inspires you..."
                              className="resize-none"
                              rows={4}
                              data-testid="input-bio"
                            />
                          </FormControl>
                          <FormDescription>
                            {(field.value?.length || 0)}/300 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-10" placeholder="City, Country" data-testid="input-location" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-10" placeholder="https://yourwebsite.com" data-testid="input-website" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="pronouns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pronouns</FormLabel>
                          <div className="flex gap-2">
                            <Select
                              value={customPronouns ? "custom" : (field.value || "")}
                              onValueChange={(value) => {
                                if (value === "custom") {
                                  setCustomPronouns(true);
                                  field.onChange("");
                                } else {
                                  setCustomPronouns(false);
                                  field.onChange(value);
                                }
                              }}
                            >
                              <SelectTrigger className="w-[180px]" data-testid="select-pronouns">
                                <SelectValue placeholder="Select pronouns" />
                              </SelectTrigger>
                              <SelectContent>
                                {PRONOUNS_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value || "none"}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {customPronouns && (
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter your pronouns" 
                                  className="flex-1"
                                  data-testid="input-custom-pronouns"
                                />
                              </FormControl>
                            )}
                          </div>
                          <FormDescription>
                            This will be displayed on your profile
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isUpdating} data-testid="button-save-profile">
                      {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Profile Privacy
                </CardTitle>
                <CardDescription>
                  Control what others can see on your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Wallet Address</p>
                    <p className="text-sm text-muted-foreground">Display your connected wallet on your profile</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showWalletOnProfile}
                    onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showWalletOnProfile: checked }))}
                    data-testid="switch-show-wallet"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Badges</p>
                    <p className="text-sm text-muted-foreground">Display your earned badges and achievements</p>
                  </div>
                  <Switch 
                    checked={privacySettings.showBadgesOnProfile}
                    onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showBadgesOnProfile: checked }))}
                    data-testid="switch-show-badges"
                  />
                </div>
                <Button 
                  onClick={handleUpdatePrivacy} 
                  disabled={isUpdatingPrivacy}
                  variant="outline"
                  data-testid="button-save-privacy"
                >
                  {isUpdatingPrivacy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 mt-6">
            {/* Theme Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Profile Theme
                </CardTitle>
                <CardDescription>
                  Choose a color theme for your profile page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PROFILE_THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setThemeSettings(prev => ({ ...prev, profileTheme: theme.value }))}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        themeSettings.profileTheme === theme.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`theme-${theme.value}`}
                    >
                      <div 
                        className="h-12 rounded-md mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`
                        }}
                      />
                      <p className="text-sm font-medium">{theme.label}</p>
                      {themeSettings.profileTheme === theme.value && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Accent Color */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Accent Color
                </CardTitle>
                <CardDescription>
                  Pick an accent color for your profile elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setThemeSettings(prev => ({ ...prev, profileAccentColor: color.value }))}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                        themeSettings.profileAccentColor === color.value
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                      data-testid={`color-${color.label.toLowerCase()}`}
                    >
                      {themeSettings.profileAccentColor === color.value && (
                        <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-lg" />
                      )}
                    </button>
                  ))}
                </div>
                
                <Button 
                  onClick={handleUpdateTheme} 
                  disabled={isUpdating}
                  data-testid="button-save-theme"
                >
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Theme Settings
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                  </div>
                  <Switch data-testid="switch-push-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch data-testid="switch-email-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Followers</p>
                    <p className="text-sm text-muted-foreground">Get notified when someone follows you</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-follower-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tips Received</p>
                    <p className="text-sm text-muted-foreground">Get notified when you receive tips</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-tip-notifications" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Web3 Wallet
                </CardTitle>
                <CardDescription>
                  Connect your wallet to receive tips and rewards on Arbitrum One
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.walletAddress ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono text-sm" data-testid="text-wallet-address">
                            {truncateAddress(user.walletAddress)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {user.walletVerified && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Check className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">Arbitrum One</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnbindWallet}
                        data-testid="button-disconnect-wallet"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!isCorrectNetwork && isConnected && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Wrong Network</p>
                          <p className="text-xs text-muted-foreground">
                            Please switch to Arbitrum One to connect your wallet
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={switchNetwork} data-testid="button-switch-network">
                          Switch
                        </Button>
                      </div>
                    )}

                    <Button
                      className="w-full gap-2 shadow-lg shadow-primary/25"
                      onClick={handleBindWallet}
                      disabled={isBindingWallet}
                      data-testid="button-connect-wallet"
                    >
                      {isBindingWallet ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="h-4 w-4" />
                      )}
                      {isBindingWallet
                        ? "Connecting..."
                        : isConnected
                        ? "Sign & Connect Wallet"
                        : "Connect Wallet"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      You'll be asked to sign a message to verify wallet ownership
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6 mt-6">
            <ModerationSection />
          </TabsContent>

          <TabsContent value="business" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Business Profile
                </CardTitle>
                <CardDescription>
                  Convert to a business account to access professional tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                  <div className="flex-1">
                    <p className="font-medium">Business Account</p>
                    <p className="text-sm text-muted-foreground">
                      Get access to analytics, promotions, and business tools
                    </p>
                  </div>
                  <Switch
                    checked={businessForm.isBusinessAccount}
                    onCheckedChange={(checked) =>
                      setBusinessForm({ ...businessForm, isBusinessAccount: checked })
                    }
                    data-testid="switch-business-account"
                  />
                </div>

                {businessForm.isBusinessAccount && (
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Business Name</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Your business name"
                            className="pl-10"
                            value={businessForm.businessName}
                            onChange={(e) =>
                              setBusinessForm({ ...businessForm, businessName: e.target.value })
                            }
                            data-testid="input-business-name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select
                          value={businessForm.businessCategory || undefined}
                          onValueChange={(value) =>
                            setBusinessForm({ ...businessForm, businessCategory: value })
                          }
                        >
                          <SelectTrigger data-testid="select-business-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Description</label>
                      <Textarea
                        placeholder="Describe your business, products, or services..."
                        className="resize-none"
                        rows={3}
                        value={businessForm.businessDescription}
                        onChange={(e) =>
                          setBusinessForm({ ...businessForm, businessDescription: e.target.value })
                        }
                        data-testid="input-business-description"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Business Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="business@example.com"
                            className="pl-10"
                            value={businessForm.businessEmail}
                            onChange={(e) =>
                              setBusinessForm({ ...businessForm, businessEmail: e.target.value })
                            }
                            data-testid="input-business-email"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="pl-10"
                            value={businessForm.businessPhone}
                            onChange={(e) =>
                              setBusinessForm({ ...businessForm, businessPhone: e.target.value })
                            }
                            data-testid="input-business-phone"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Website</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://yourbusiness.com"
                            className="pl-10"
                            value={businessForm.businessWebsite}
                            onChange={(e) =>
                              setBusinessForm({ ...businessForm, businessWebsite: e.target.value })
                            }
                            data-testid="input-business-website"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="123 Business St, City"
                            className="pl-10"
                            value={businessForm.businessAddress}
                            onChange={(e) =>
                              setBusinessForm({ ...businessForm, businessAddress: e.target.value })
                            }
                            data-testid="input-business-address"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Hours</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          placeholder="Mon-Fri: 9am-5pm&#10;Sat: 10am-2pm&#10;Sun: Closed"
                          className="pl-10 resize-none"
                          rows={3}
                          value={businessForm.businessHours}
                          onChange={(e) =>
                            setBusinessForm({ ...businessForm, businessHours: e.target.value })
                          }
                          data-testid="input-business-hours"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleUpdateBusiness}
                      disabled={isUpdatingBusiness}
                      data-testid="button-save-business"
                    >
                      {isUpdatingBusiness && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Business Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
