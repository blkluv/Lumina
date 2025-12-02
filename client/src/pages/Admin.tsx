import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/authContext";
import { 
  Users, FileText, Flag, Shield, Activity, 
  Check, X, Ban, Eye, Settings, Image, Type,
  AlertTriangle, Search, Trash2, UserX, UserCheck, Save,
  Bell, Mail, MessageSquare, Pause, Play, CheckSquare,
  ShieldAlert, BookOpen, Scale, Clock
} from "lucide-react";
import type { User, ContentReport } from "@shared/schema";
import { MainLayout } from "@/components/layout/MainLayout";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingReports: number;
  pendingVerifications: number;
}

interface PlatformSettings {
  platform_name?: string;
  platform_logo?: string;
  platform_tagline?: string;
  platform_about?: string;
  platform_mission?: string;
  platform_introduction?: string;
  [key: string]: string | undefined;
}

function StatCard({ title, value, icon: Icon, variant }: { 
  title: string; 
  value: string | number; 
  icon: any;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantClasses = {
    default: "",
    success: "border-green-500/20 bg-green-500/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    danger: "border-red-500/20 bg-red-500/5",
  };

  return (
    <Card className={variantClasses[variant || "default"]} data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

interface ContentViolation {
  id: string;
  contentType: string;
  contentId: string;
  userId: string;
  violationType: string;
  severity: string;
  confidenceScore: number;
  status: string;
  contentSnapshot: string | null;
  aiExplanation: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  user?: { username: string; displayName: string | null };
}

interface UserWarningAdmin {
  id: string;
  userId: string;
  warningNumber: number;
  reason: string;
  details: string | null;
  acknowledgedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  user?: { username: string; displayName: string | null };
}

interface PlatformGuideline {
  id: number;
  category: string;
  title: string;
  description: string;
  isProhibited: boolean;
  severity: string;
  isActive: boolean;
  orderIndex: number;
}

interface ContentAppeal {
  id: string;
  violationId: string;
  userId: string;
  reason: string;
  additionalInfo: string | null;
  status: string;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  violation?: ContentViolation;
  user?: { username: string; displayName: string | null };
}

function ModerationPanel() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"violations" | "warnings" | "guidelines" | "appeals">("violations");

  const { data: violations, isLoading: violationsLoading } = useQuery<ContentViolation[]>({
    queryKey: ["/api/admin/moderation/violations"],
  });

  const { data: allWarnings, isLoading: warningsLoading } = useQuery<UserWarningAdmin[]>({
    queryKey: ["/api/admin/moderation/warnings"],
  });

  const { data: guidelines, isLoading: guidelinesLoading } = useQuery<PlatformGuideline[]>({
    queryKey: ["/api/admin/guidelines"],
  });

  const { data: appeals, isLoading: appealsLoading } = useQuery<ContentAppeal[]>({
    queryKey: ["/api/admin/moderation/appeals"],
  });

  const reviewViolationMutation = useMutation({
    mutationFn: async ({ violationId, action, notes }: { violationId: string; action: string; notes?: string }) => {
      await apiRequest("POST", `/api/admin/moderation/violations/${violationId}/review`, { action, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/violations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/warnings"] });
      toast({ title: "Violation reviewed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to review violation", variant: "destructive" });
    },
  });

  const reviewAppealMutation = useMutation({
    mutationFn: async ({ appealId, action, notes }: { appealId: string; action: string; notes?: string }) => {
      await apiRequest("POST", `/api/admin/moderation/appeals/${appealId}/review`, { action, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/appeals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/violations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/warnings"] });
      toast({ title: "Appeal reviewed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to review appeal", variant: "destructive" });
    },
  });

  const severityColors: Record<string, string> = {
    low: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    critical: "bg-red-600/10 text-red-600 border-red-600/20",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500",
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
    warning_issued: "bg-orange-500/10 text-orange-500",
  };

  const pendingViolations = violations?.filter(v => v.status === "pending") || [];
  const recentWarnings = allWarnings?.slice(0, 10) || [];
  const pendingAppeals = appeals?.filter(a => a.status === "pending") || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <ShieldAlert className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingViolations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Violations</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Warnings Issued</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allWarnings?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Guidelines</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guidelines?.filter(g => g.isActive).length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Selector */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "violations" ? "default" : "outline"}
          onClick={() => setViewMode("violations")}
          data-testid="view-violations"
        >
          <ShieldAlert className="h-4 w-4 mr-2" />
          Violations ({pendingViolations.length})
        </Button>
        <Button
          variant={viewMode === "warnings" ? "default" : "outline"}
          onClick={() => setViewMode("warnings")}
          data-testid="view-warnings"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Warnings
        </Button>
        <Button
          variant={viewMode === "guidelines" ? "default" : "outline"}
          onClick={() => setViewMode("guidelines")}
          data-testid="view-guidelines"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Guidelines
        </Button>
        <Button
          variant={viewMode === "appeals" ? "default" : "outline"}
          onClick={() => setViewMode("appeals")}
          data-testid="view-appeals"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Appeals {pendingAppeals.length > 0 && `(${pendingAppeals.length})`}
        </Button>
      </div>

      {/* Violations View */}
      {viewMode === "violations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Content Violations
            </CardTitle>
            <CardDescription>
              AI-detected content violations requiring review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {violationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : pendingViolations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No pending violations to review</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {pendingViolations.map((violation) => (
                    <div
                      key={violation.id}
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`violation-${violation.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={severityColors[violation.severity]}>
                            {violation.severity}
                          </Badge>
                          <Badge variant="outline">
                            {violation.violationType?.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline">
                            {violation.contentType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(violation.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">User: </span>
                        <span className="font-medium">
                          @{violation.user?.username || "Unknown"}
                        </span>
                      </div>

                      {violation.contentSnapshot && (
                        <div className="bg-muted rounded-lg p-3 text-sm">
                          <p className="text-muted-foreground mb-1">Content:</p>
                          <p className="line-clamp-3">{violation.contentSnapshot}</p>
                        </div>
                      )}

                      {violation.aiExplanation && (
                        <div className="bg-primary/5 rounded-lg p-3 text-sm">
                          <p className="text-muted-foreground mb-1">AI Analysis:</p>
                          <p>{violation.aiExplanation}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Confidence: {(violation.confidenceScore * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reviewViolationMutation.mutate({
                            violationId: violation.id,
                            action: "approve"
                          })}
                          disabled={reviewViolationMutation.isPending}
                          data-testid={`approve-${violation.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-500 border-orange-500/30"
                          onClick={() => reviewViolationMutation.mutate({
                            violationId: violation.id,
                            action: "warn"
                          })}
                          disabled={reviewViolationMutation.isPending}
                          data-testid={`warn-${violation.id}`}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Issue Warning
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => reviewViolationMutation.mutate({
                            violationId: violation.id,
                            action: "remove"
                          })}
                          disabled={reviewViolationMutation.isPending}
                          data-testid={`remove-${violation.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Content
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Warnings View */}
      {viewMode === "warnings" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              User Warnings
            </CardTitle>
            <CardDescription>
              Recently issued warnings to users (3-strike system)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {warningsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentWarnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No warnings have been issued yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {recentWarnings.map((warning) => (
                    <div
                      key={warning.id}
                      className="border rounded-lg p-4 flex items-center justify-between gap-4"
                      data-testid={`warning-admin-${warning.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={
                              warning.warningNumber === 3 
                                ? "bg-red-500/10 text-red-500" 
                                : warning.warningNumber === 2 
                                ? "bg-orange-500/10 text-orange-500" 
                                : "bg-yellow-500/10 text-yellow-500"
                            }
                          >
                            Strike {warning.warningNumber}/3
                          </Badge>
                          <span className="text-sm font-medium">
                            @{warning.user?.username || "Unknown"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{warning.reason}</p>
                        {warning.details && (
                          <p className="text-xs text-muted-foreground mt-1">{warning.details}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{new Date(warning.createdAt).toLocaleDateString()}</div>
                        {warning.acknowledgedAt && (
                          <Badge variant="outline" className="mt-1 text-green-500">
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guidelines View */}
      {viewMode === "guidelines" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Platform Guidelines
            </CardTitle>
            <CardDescription>
              Manage community guidelines and content policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {guidelinesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !guidelines || guidelines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4" />
                <p>No guidelines configured yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {guidelines.map((guideline) => (
                    <div
                      key={guideline.id}
                      className={`border rounded-lg p-4 ${!guideline.isActive ? "opacity-50" : ""}`}
                      data-testid={`guideline-${guideline.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium">{guideline.title}</h4>
                            <Badge variant="outline">{guideline.category}</Badge>
                            {guideline.isProhibited && (
                              <Badge variant="outline" className={severityColors[guideline.severity]}>
                                {guideline.severity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{guideline.description}</p>
                        </div>
                        <Badge variant={guideline.isActive ? "default" : "secondary"}>
                          {guideline.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appeals View */}
      {viewMode === "appeals" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Content Appeals
            </CardTitle>
            <CardDescription>
              Review user appeals for content violations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appealsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !appeals || appeals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>No appeals submitted</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {appeals.map((appeal) => (
                    <div
                      key={appeal.id}
                      className="border rounded-lg p-4"
                      data-testid={`appeal-${appeal.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium">
                              @{appeal.user?.username || "Unknown"}
                            </span>
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
                              {appeal.status}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Violation:</span>{" "}
                              {appeal.violation?.violationType || "Unknown"}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Reason for Appeal:</span>{" "}
                              {appeal.reason}
                            </p>
                            {appeal.additionalInfo && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Additional Info:</span>{" "}
                                {appeal.additionalInfo}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(appeal.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {appeal.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-500 hover:bg-green-500/10"
                              onClick={() =>
                                reviewAppealMutation.mutate({
                                  appealId: appeal.id,
                                  action: "approve",
                                })
                              }
                              disabled={reviewAppealMutation.isPending}
                              data-testid={`approve-appeal-${appeal.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-500/10"
                              onClick={() =>
                                reviewAppealMutation.mutate({
                                  appealId: appeal.id,
                                  action: "deny",
                                })
                              }
                              disabled={reviewAppealMutation.isPending}
                              data-testid={`deny-appeal-${appeal.id}`}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Deny
                            </Button>
                          </div>
                        )}
                        {appeal.status !== "pending" && appeal.reviewNotes && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Review Notes:</span>{" "}
                            {appeal.reviewNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [settings, setSettings] = useState<PlatformSettings>({});
  
  // User selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Modal states
  const [notificationModal, setNotificationModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [chatModal, setChatModal] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  
  // Modal form states
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  if (!user?.isAdmin) {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Access Denied</h2>
                  <p className="text-muted-foreground mt-2">
                    You don't have permission to access the admin dashboard.
                    This area is restricted to platform administrators.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/extended-stats"],
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", userSearch],
    queryFn: async () => {
      const url = userSearch 
        ? `/api/admin/users?search=${encodeURIComponent(userSearch)}`
        : "/api/admin/users";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: bannedUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users/banned"],
  });

  const { data: pendingVerifications } = useQuery<User[]>({
    queryKey: ["/api/admin/pending-verifications"],
  });

  const { data: reports } = useQuery<ContentReport[]>({
    queryKey: ["/api/admin/reports"],
  });

  const { data: platformSettings, isLoading: settingsLoading } = useQuery<PlatformSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/ban/${userId}`, { reason: "Violation of community guidelines" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/banned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/extended-stats"] });
      toast({ title: "User banned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to ban user", variant: "destructive" });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/unban/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/banned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/extended-stats"] });
      toast({ title: "User unbanned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to unban user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/extended-stats"] });
      setSelectedUsers(new Set());
      toast({ title: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(userIds.map(id => apiRequest("DELETE", `/api/admin/users/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/extended-stats"] });
      setSelectedUsers(new Set());
      setBulkDeleteModal(false);
      toast({ title: `${selectedUsers.size} users deleted successfully` });
    },
    onError: () => {
      toast({ title: "Failed to delete some users", variant: "destructive" });
    },
  });

  const bulkBanMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(userIds.map(id => apiRequest("POST", `/api/admin/ban/${id}`, { reason: "Bulk action by admin" })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/banned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/extended-stats"] });
      setSelectedUsers(new Set());
      toast({ title: `${selectedUsers.size} users paused successfully` });
    },
    onError: () => {
      toast({ title: "Failed to pause some users", variant: "destructive" });
    },
  });

  const bulkUnbanMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(userIds.map(id => apiRequest("POST", `/api/admin/unban/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/banned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/extended-stats"] });
      setSelectedUsers(new Set());
      toast({ title: `${selectedUsers.size} users activated successfully` });
    },
    onError: () => {
      toast({ title: "Failed to activate some users", variant: "destructive" });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ userIds, title, message }: { userIds: string[]; title: string; message: string }) => {
      await apiRequest("POST", "/api/admin/send-notification", { userIds, title, message });
    },
    onSuccess: () => {
      setNotificationModal(false);
      setNotificationTitle("");
      setNotificationMessage("");
      setSelectedUsers(new Set());
      toast({ title: "Notifications sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send notifications", variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ userIds, subject, body }: { userIds: string[]; subject: string; body: string }) => {
      await apiRequest("POST", "/api/admin/send-email", { userIds, subject, body });
    },
    onSuccess: () => {
      setEmailModal(false);
      setEmailSubject("");
      setEmailBody("");
      setSelectedUsers(new Set());
      toast({ title: "Emails queued for delivery" });
    },
    onError: () => {
      toast({ title: "Failed to send emails", variant: "destructive" });
    },
  });

  const sendChatMutation = useMutation({
    mutationFn: async ({ userIds, message }: { userIds: string[]; message: string }) => {
      await apiRequest("POST", "/api/admin/send-chat", { userIds, message });
    },
    onSuccess: () => {
      setChatModal(false);
      setChatMessage("");
      setSelectedUsers(new Set());
      toast({ title: "Messages sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send messages", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await apiRequest("POST", `/api/admin/verify/${userId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/extended-stats"] });
      toast({ title: "Verification updated" });
    },
    onError: () => {
      toast({ title: "Failed to update verification", variant: "destructive" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string; action: string }) => {
      await apiRequest("POST", `/api/admin/reports/${reportId}/resolve`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/extended-stats"] });
      toast({ title: "Report resolved" });
    },
    onError: () => {
      toast({ title: "Failed to resolve report", variant: "destructive" });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: PlatformSettings) => {
      await apiRequest("PUT", "/api/admin/settings", newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    const mergedSettings = { ...platformSettings, ...settings };
    saveSettingsMutation.mutate(mergedSettings);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (!allUsers) return;
    if (selectedUsers.size === allUsers.filter(u => !u.isAdmin).length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(allUsers.filter(u => !u.isAdmin).map(u => u.id)));
    }
  };

  const getSelectedUsersList = () => {
    if (!allUsers) return [];
    return allUsers.filter(u => selectedUsers.has(u.id));
  };

  return (
    <MainLayout>
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500/20 via-purple-500/15 to-cyan-500/20 p-6 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-red-400/20 to-purple-500/20 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" data-testid="admin-title">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Platform management & moderation center
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Users</span>
                </div>
                <p className="text-sm font-medium mt-1">{stats?.totalUsers || 0}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <p className="text-sm font-medium mt-1">{stats?.activeUsers || 0}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">Reports</span>
                </div>
                <p className="text-sm font-medium mt-1">{stats?.pendingReports || 0}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Verify</span>
                </div>
                <p className="text-sm font-medium mt-1">{stats?.pendingVerifications || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="admin-tabs" className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">
              Users
              {bannedUsers && bannedUsers.length > 0 && (
                <Badge variant="destructive" className="ml-2">{bannedUsers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="verifications">
              Verifications
              {pendingVerifications && pendingVerifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingVerifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports
              {reports && reports.length > 0 && (
                <Badge variant="destructive" className="ml-2">{reports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {statsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(7)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                    <CardContent><Skeleton className="h-8 w-16" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} />
                <StatCard title="Active Users" value={stats?.activeUsers || 0} icon={UserCheck} variant="success" />
                <StatCard title="Banned Users" value={stats?.bannedUsers || 0} icon={UserX} variant="danger" />
                <StatCard title="Total Posts" value={stats?.totalPosts || 0} icon={FileText} />
                <StatCard title="Comments" value={stats?.totalComments || 0} icon={Activity} />
                <StatCard title="Pending Reports" value={stats?.pendingReports || 0} icon={Flag} variant="warning" />
                <StatCard title="Pending Verifications" value={stats?.pendingVerifications || 0} icon={Shield} variant="warning" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Select users to perform bulk actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username, email, or display name..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                      data-testid="user-search"
                    />
                  </div>
                </div>

                {selectedUsers.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{selectedUsers.size} selected</span>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotificationModal(true)}
                      data-testid="bulk-notify"
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Notify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEmailModal(true)}
                      data-testid="bulk-email"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setChatModal(true)}
                      data-testid="bulk-chat"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => bulkBanMutation.mutate(Array.from(selectedUsers))}
                      disabled={bulkBanMutation.isPending}
                      data-testid="bulk-pause"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => bulkUnbanMutation.mutate(Array.from(selectedUsers))}
                      disabled={bulkUnbanMutation.isPending}
                      data-testid="bulk-activate"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setBulkDeleteModal(true)}
                      data-testid="bulk-delete"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={allUsers && selectedUsers.size === allUsers.filter(u => !u.isAdmin).length && allUsers.filter(u => !u.isAdmin).length > 0}
                    onCheckedChange={toggleSelectAll}
                    data-testid="select-all"
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>

                <ScrollArea className="h-[400px]">
                  {usersLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                  ) : allUsers && allUsers.length > 0 ? (
                    <div className="space-y-2">
                      {allUsers.map((u) => (
                        <div 
                          key={u.id} 
                          className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                            selectedUsers.has(u.id) ? 'bg-primary/5 border-primary/20' : ''
                          }`}
                          data-testid={`user-row-${u.id}`}
                        >
                          <Checkbox
                            checked={selectedUsers.has(u.id)}
                            onCheckedChange={() => toggleUserSelection(u.id)}
                            disabled={u.isAdmin ?? false}
                            data-testid={`select-user-${u.id}`}
                          />
                          <Avatar>
                            <AvatarImage src={u.avatarUrl || undefined} />
                            <AvatarFallback>{u.displayName?.charAt(0) || u.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{u.displayName || u.username}</p>
                              {!u.isActive && <Badge variant="destructive">Paused</Badge>}
                              {u.isAdmin && <Badge variant="secondary">Admin</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">@{u.username} · {u.email}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {u.isActive ? (
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => banMutation.mutate(u.id)}
                                disabled={banMutation.isPending || (u.isAdmin ?? false)}
                                title="Pause Account"
                                data-testid={`pause-${u.id}`}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => unbanMutation.mutate(u.id)}
                                disabled={unbanMutation.isPending}
                                title="Activate Account"
                                data-testid={`activate-${u.id}`}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  disabled={u.isAdmin ?? false}
                                  title="Delete Account"
                                  data-testid={`delete-${u.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {u.username}'s account and all their content. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUserMutation.mutate(u.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Verifications</CardTitle>
                <CardDescription>Review and approve user verification requests</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {pendingVerifications && pendingVerifications.length > 0 ? (
                    <div className="space-y-2">
                      {pendingVerifications.map((u) => (
                        <div key={u.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={u.avatarUrl || undefined} />
                              <AvatarFallback>{u.displayName?.charAt(0) || u.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{u.displayName || u.username}</p>
                              <p className="text-sm text-muted-foreground">@{u.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => verifyMutation.mutate({ userId: u.id, status: "verified" })}
                              disabled={verifyMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verifyMutation.mutate({ userId: u.id, status: "rejected" })}
                              disabled={verifyMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending verifications
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
                <CardDescription>Review reported content and take action</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {reports && reports.length > 0 ? (
                    <div className="space-y-2">
                      {reports.map((report) => (
                        <div key={report.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge>{report.reportType}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(report.createdAt!).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{report.reason}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveMutation.mutate({ reportId: report.id, action: "dismiss" })}
                              disabled={resolveMutation.isPending}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => resolveMutation.mutate({ reportId: report.id, action: "remove" })}
                              disabled={resolveMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove Content
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending reports
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Platform Branding
                </CardTitle>
                <CardDescription>Customize your platform's appearance and identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="platform_name">Platform Name</Label>
                        <Input
                          id="platform_name"
                          placeholder="Lumina"
                          defaultValue={platformSettings?.platform_name || ""}
                          onChange={(e) => handleSettingChange("platform_name", e.target.value)}
                          data-testid="input-platform-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platform_tagline">Tagline</Label>
                        <Input
                          id="platform_tagline"
                          placeholder="Web3 Social Hub"
                          defaultValue={platformSettings?.platform_tagline || ""}
                          onChange={(e) => handleSettingChange("platform_tagline", e.target.value)}
                          data-testid="input-platform-tagline"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="platform_logo">Logo URL</Label>
                      <Input
                        id="platform_logo"
                        placeholder="https://example.com/logo.png"
                        defaultValue={platformSettings?.platform_logo || ""}
                        onChange={(e) => handleSettingChange("platform_logo", e.target.value)}
                        data-testid="input-platform-logo"
                      />
                    </div>

                    <Button 
                      onClick={handleSaveSettings}
                      disabled={saveSettingsMutation.isPending}
                      data-testid="save-branding"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveSettingsMutation.isPending ? "Saving..." : "Save Branding"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Platform Content
                </CardTitle>
                <CardDescription>Edit About Us, Mission Statement, and Introduction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="platform_introduction">Introduction</Label>
                      <Textarea
                        id="platform_introduction"
                        placeholder="Welcome to our platform..."
                        className="min-h-[100px]"
                        defaultValue={platformSettings?.platform_introduction || ""}
                        onChange={(e) => handleSettingChange("platform_introduction", e.target.value)}
                        data-testid="input-introduction"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="platform_about">About Us</Label>
                      <Textarea
                        id="platform_about"
                        placeholder="Tell your story..."
                        className="min-h-[150px]"
                        defaultValue={platformSettings?.platform_about || ""}
                        onChange={(e) => handleSettingChange("platform_about", e.target.value)}
                        data-testid="input-about"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="platform_mission">Mission Statement</Label>
                      <Textarea
                        id="platform_mission"
                        placeholder="Our mission is..."
                        className="min-h-[100px]"
                        defaultValue={platformSettings?.platform_mission || ""}
                        onChange={(e) => handleSettingChange("platform_mission", e.target.value)}
                        data-testid="input-mission"
                      />
                    </div>

                    <Button 
                      onClick={handleSaveSettings}
                      disabled={saveSettingsMutation.isPending}
                      className="w-full"
                      data-testid="save-settings"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveSettingsMutation.isPending ? "Saving..." : "Save All Settings"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <ModerationPanel />
          </TabsContent>
        </Tabs>

        {/* Send Notification Modal */}
        <Dialog open={notificationModal} onOpenChange={setNotificationModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription>
                Send a notification to {selectedUsers.size} selected user(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="notify-title">Title</Label>
                <Input
                  id="notify-title"
                  placeholder="Notification title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  data-testid="notify-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notify-message">Message</Label>
                <Textarea
                  id="notify-message"
                  placeholder="Enter your message..."
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="notify-message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotificationModal(false)}>Cancel</Button>
              <Button 
                onClick={() => sendNotificationMutation.mutate({
                  userIds: Array.from(selectedUsers),
                  title: notificationTitle,
                  message: notificationMessage
                })}
                disabled={sendNotificationMutation.isPending || !notificationTitle || !notificationMessage}
                data-testid="send-notification"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Email Modal */}
        <Dialog open={emailModal} onOpenChange={setEmailModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email</DialogTitle>
              <DialogDescription>
                Send an email to {selectedUsers.size} selected user(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  data-testid="email-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body">Message</Label>
                <Textarea
                  id="email-body"
                  placeholder="Enter your email content..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="min-h-[150px]"
                  data-testid="email-body"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailModal(false)}>Cancel</Button>
              <Button 
                onClick={() => sendEmailMutation.mutate({
                  userIds: Array.from(selectedUsers),
                  subject: emailSubject,
                  body: emailBody
                })}
                disabled={sendEmailMutation.isPending || !emailSubject || !emailBody}
                data-testid="send-email"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Chat Modal */}
        <Dialog open={chatModal} onOpenChange={setChatModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Direct Message</DialogTitle>
              <DialogDescription>
                Send a direct message to {selectedUsers.size} selected user(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chat-message">Message</Label>
                <Textarea
                  id="chat-message"
                  placeholder="Enter your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="chat-message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChatModal(false)}>Cancel</Button>
              <Button 
                onClick={() => sendChatMutation.mutate({
                  userIds: Array.from(selectedUsers),
                  message: chatMessage
                })}
                disabled={sendChatMutation.isPending || !chatMessage}
                data-testid="send-chat"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation */}
        <AlertDialog open={bulkDeleteModal} onOpenChange={setBulkDeleteModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedUsers.size} Users</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedUsers.size} user account(s) and all their content. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => bulkDeleteMutation.mutate(Array.from(selectedUsers))}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
