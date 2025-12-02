import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  AlertTriangle, 
  BookOpen, 
  Heart, 
  Ban, 
  Scale, 
  Users,
  Sparkles,
  Target,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { MainLayout } from "@/components/layout/MainLayout";

interface PlatformGuideline {
  id: number;
  category: string;
  title: string;
  description: string;
  isProhibited: boolean;
  severity: string;
  isActive: boolean;
}

interface UserWarning {
  id: number;
  warningNumber: number;
  reason: string;
  details: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

const categoryIcons: Record<string, any> = {
  platform_mission: Sparkles,
  prohibited_content: Ban,
  community_standards: Heart,
  content_quality: Target,
  respect: Users,
  integrity: Scale,
};

const severityColors: Record<string, string> = {
  low: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  critical: "bg-red-600/10 text-red-600 border-red-600/20",
};

export default function Guidelines() {
  const { user } = useAuth();
  
  const { data: guidelines, isLoading: guidelinesLoading } = useQuery<PlatformGuideline[]>({
    queryKey: ["/api/guidelines"],
  });

  const { data: warningsData, isLoading: warningsLoading } = useQuery<{
    totalWarnings: number;
    warnings: UserWarning[];
    remainingStrikes: number;
  }>({
    queryKey: ["/api/moderation/warnings"],
    enabled: !!user,
  });
  
  const warnings = warningsData?.warnings || [];

  const activeWarnings = warnings?.filter(w => !w.expiresAt || new Date(w.expiresAt) > new Date()) || [];

  const groupedGuidelines = guidelines?.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {} as Record<string, PlatformGuideline[]>) || {};

  const categoryTitles: Record<string, string> = {
    platform_mission: "Platform Mission",
    prohibited_content: "Prohibited Content",
    community_standards: "Community Standards",
    content_quality: "Content Quality",
    respect: "Respect & Dignity",
    integrity: "Integrity & Honesty",
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-guidelines-title">
              Community Guidelines
            </h1>
            <p className="text-muted-foreground">
              Building a righteous, uplifting community together
            </p>
          </div>
        </div>

        {/* User Warning Status */}
        {user && activeWarnings.length > 0 && (
          <Alert variant="destructive" className="mb-6" data-testid="alert-user-warnings">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Warnings</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                You have {activeWarnings.length} active warning{activeWarnings.length > 1 ? "s" : ""} 
                on your account. After 3 warnings, your account may be suspended.
              </p>
              <div className="space-y-2 mt-3">
                {activeWarnings.map((warning) => (
                  <div 
                    key={warning.id} 
                    className="bg-destructive/10 rounded-lg p-3"
                    data-testid={`warning-item-${warning.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="destructive">Warning #{warning.warningNumber}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(warning.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1 font-medium">{warning.reason}</p>
                    {warning.details && (
                      <p className="text-xs text-muted-foreground mt-1">{warning.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Platform Mission Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg leading-relaxed">
              Lumina exists to <strong className="text-primary">uplift humanity</strong>. 
              We are building more than a social network—we are cultivating a movement of individuals 
              committed to making the world a better place, one post at a time.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              In a digital landscape often dominated by negativity and division, Lumina stands as a 
              beacon of light. Here, creators are rewarded for sharing content that educates, inspires, 
              and empowers. Every interaction matters. Every contribution shapes our collective future.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">Inspire</div>
                <div className="text-xs text-muted-foreground">Positive Change</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">Educate</div>
                <div className="text-xs text-muted-foreground">Share Knowledge</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">Empower</div>
                <div className="text-xs text-muted-foreground">Build Community</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">Earn</div>
                <div className="text-xs text-muted-foreground">Get Rewarded</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Three Strike System Explanation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Scale className="h-6 w-6" />
              Three-Strike Warning System
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              We believe in second chances, but we also believe in protecting our community. 
              Our progressive discipline system is designed to educate first and enforce when necessary.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/20 rounded-full h-10 w-10 flex items-center justify-center">
                    <span className="text-yellow-500 font-bold text-lg">1</span>
                  </div>
                  <h4 className="font-semibold text-yellow-500">First Warning</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    A friendly reminder that helps you understand what went wrong.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Content may be removed</li>
                    <li>• Educational guidance provided</li>
                    <li>• No account restrictions</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/20 rounded-full h-10 w-10 flex items-center justify-center">
                    <span className="text-orange-500 font-bold text-lg">2</span>
                  </div>
                  <h4 className="font-semibold text-orange-500">Second Warning</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    A serious notice indicating a pattern of behavior that needs to change.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Content removed immediately</li>
                    <li>• 24-hour posting cooldown</li>
                    <li>• Final warning before ban</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 rounded-full h-10 w-10 flex items-center justify-center">
                    <span className="text-red-500 font-bold text-lg">3</span>
                  </div>
                  <h4 className="font-semibold text-red-500">Third Strike</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Account action is taken to protect the community from repeated violations.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Temporary or permanent ban</li>
                    <li>• All content under review</li>
                    <li>• Appeal process available</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Severe violations such as illegal content, 
                extreme violence, or content endangering minors may result in immediate account termination 
                without prior warnings. We take the safety of our community seriously.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guidelines by Category */}
        <ScrollArea className="h-auto">
          {guidelinesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedGuidelines).map(([category, items]) => {
                const Icon = categoryIcons[category] || BookOpen;
                return (
                  <Card key={category} data-testid={`category-${category}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {categoryTitles[category] || category.replace(/_/g, " ")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {items.map((guideline, index) => (
                          <div key={guideline.id}>
                            <div className="flex items-start gap-3">
                              {guideline.isProhibited ? (
                                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium">{guideline.title}</h4>
                                  {guideline.isProhibited && (
                                    <Badge 
                                      variant="outline" 
                                      className={severityColors[guideline.severity]}
                                    >
                                      {guideline.severity}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {guideline.description}
                                </p>
                              </div>
                            </div>
                            {index < items.length - 1 && <Separator className="mt-4" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Appeal Information */}
        <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-6 w-6 text-blue-500" />
              Appeals Process
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              We're human, and sometimes mistakes happen. If you believe a decision was made in error, 
              we want to hear from you.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <div className="text-3xl font-bold text-blue-500 mb-1">48h</div>
                <div className="text-sm font-medium">Review Time</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Our team reviews all appeals within 48 hours of submission.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <div className="text-3xl font-bold text-blue-500 mb-1">Fair</div>
                <div className="text-sm font-medium">Human Review</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Every appeal is reviewed by a real person, not just AI.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <div className="text-3xl font-bold text-blue-500 mb-1">Open</div>
                <div className="text-sm font-medium">Transparent Process</div>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll receive a detailed explanation of our final decision.
                </p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">How to Submit an Appeal</h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  Go to Settings and select "Account Status"
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  Click "Appeal" next to the warning you wish to contest
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  Provide context and any evidence supporting your case
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">4.</span>
                  Submit and wait for our team to review your appeal
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* AI Moderation Transparency */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6" />
              AI-Powered Moderation
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              We use advanced artificial intelligence to help keep our community safe, 
              but we believe in transparency about how it works.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  What Our AI Does
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Scans images and videos for policy violations</li>
                  <li>• Analyzes text for harmful content patterns</li>
                  <li>• Provides confidence scores for human reviewers</li>
                  <li>• Operates 24/7 to protect the community</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Human Oversight
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• All AI flags are reviewed by human moderators</li>
                  <li>• Context and intent are always considered</li>
                  <li>• Educational or artistic content is protected</li>
                  <li>• Decisions can always be appealed</li>
                </ul>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm">
                <strong className="text-primary">Our Commitment:</strong> Technology should serve humanity, 
                not the other way around. Our AI is a tool to help moderators work efficiently, but every 
                significant decision affecting your account involves human judgment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
