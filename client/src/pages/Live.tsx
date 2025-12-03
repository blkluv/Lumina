import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/authContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Radio, 
  Users, 
  Eye, 
  Coins, 
  MessageCircle, 
  Loader2,
  Play,
  Video,
  Monitor,
  Settings,
  Check,
  X,
  Zap,
  Clock,
  Gamepad2,
  Camera,
  HelpCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import type { User } from "@shared/schema";

interface LiveStream {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
  viewerCount: number;
  totalTips: string;
  startedAt: Date | null;
  endedAt: Date | null;
  host?: User;
}

interface StreamingProviders {
  providers: { mux: boolean; cloudflare: boolean };
  methods: { rtmp: boolean; browser: boolean };
  default: "rtmp" | "browser" | null;
}

export default function Live() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [streamingMethod, setStreamingMethod] = useState<"rtmp" | "browser">("rtmp");
  
  const { data: streams = [], isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/streams"],
  });
  
  const { data: providers } = useQuery<StreamingProviders>({
    queryKey: ["/api/streams/providers"],
    enabled: !!user,
  });
  
  const createStreamMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; streamingMethod: string }) => {
      const res = await apiRequest("POST", "/api/streams", data);
      return res.json();
    },
    onSuccess: (stream) => {
      toast({ title: "Stream started! You are now live." });
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      setGoLiveOpen(false);
      setTitle("");
      setDescription("");
      navigate(`/live/${stream.id}`);
    },
    onError: () => {
      toast({ title: "Failed to start stream", variant: "destructive" });
    },
  });
  
  const liveStreams = streams.filter(s => s.status === "live");
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-live-title">Live Streams</h1>
            <p className="text-muted-foreground">
              Watch live streams and support your favorite creators
            </p>
          </div>
          
          {user && (
            <Button onClick={() => setGoLiveOpen(true)} data-testid="button-go-live">
              <Radio className="h-4 w-4 mr-2" />
              Go Live
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : liveStreams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="p-4 rounded-full bg-muted inline-flex mb-4">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No live streams</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to go live and connect with your audience!
              </p>
              {user && (
                <Button onClick={() => setGoLiveOpen(true)}>
                  <Radio className="h-4 w-4 mr-2" />
                  Start Streaming
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {liveStreams.map((stream) => (
              <Link key={stream.id} href={`/live/${stream.id}`}>
                <Card className="overflow-hidden hover-elevate cursor-pointer h-full">
                  <div className="relative aspect-video bg-muted">
                    {stream.thumbnailUrl ? (
                      <img
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-emerald-500/20">
                        <Play className="h-12 w-12 text-primary" />
                      </div>
                    )}
                    
                    <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-600">
                      <span className="relative flex h-2 w-2 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      LIVE
                    </Badge>
                    
                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                      <Badge variant="secondary" className="bg-black/70 text-white border-0">
                        <Eye className="h-3 w-3 mr-1" />
                        {stream.viewerCount}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={stream.host?.avatarUrl || undefined} 
                          alt={stream.host?.displayName || stream.host?.username} 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(stream.host?.displayName || stream.host?.username || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" data-testid={`text-stream-title-${stream.id}`}>
                          {stream.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {stream.host?.displayName || stream.host?.username}
                        </p>
                        {stream.startedAt && (
                          <p className="text-xs text-muted-foreground">
                            Started {formatDistanceToNow(new Date(stream.startedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {parseFloat(stream.totalTips) > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-sm text-primary">
                        <Coins className="h-4 w-4" />
                        <span className="font-medium">{stream.totalTips} AXM earned</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        
        <Dialog open={goLiveOpen} onOpenChange={setGoLiveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a Live Stream</DialogTitle>
              <DialogDescription>
                Go live and connect with your audience in real-time
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Stream Title</Label>
                <Input
                  id="title"
                  placeholder="What's your stream about?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-stream-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell viewers what to expect..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-stream-description"
                />
              </div>
              
              <Tabs defaultValue="choose" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="choose">Choose Method</TabsTrigger>
                  <TabsTrigger value="compare">Compare</TabsTrigger>
                  <TabsTrigger value="help">Instructions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="choose" className="space-y-3 mt-4">
                  <RadioGroup
                    value={streamingMethod}
                    onValueChange={(value) => setStreamingMethod(value as "rtmp" | "browser")}
                    className="grid gap-3"
                  >
                    <div 
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        streamingMethod === "rtmp" 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-muted-foreground/30"
                      )}
                      onClick={() => setStreamingMethod("rtmp")}
                    >
                      <RadioGroupItem value="rtmp" id="rtmp" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="rtmp" className="font-medium cursor-pointer flex items-center gap-2">
                          <Settings className="h-4 w-4 text-primary" />
                          OBS / Streamlabs (Professional)
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Best quality for gaming, tutorials, and professional content.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            <Gamepad2 className="h-3 w-3" /> Best for Gaming
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            <Zap className="h-3 w-3" /> Best Quality
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        streamingMethod === "browser" 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-muted-foreground/30",
                        !providers?.methods.browser && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => providers?.methods.browser && setStreamingMethod("browser")}
                    >
                      <RadioGroupItem value="browser" id="browser" className="mt-1" disabled={!providers?.methods.browser} />
                      <div className="flex-1">
                        <Label htmlFor="browser" className="font-medium cursor-pointer flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-primary" />
                          Browser (Quick Start)
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Go live instantly. Perfect for casual streams and Q&A sessions.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            <Clock className="h-3 w-3" /> Instant Start
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            <Camera className="h-3 w-3" /> Webcam Ready
                          </span>
                        </div>
                        {!providers?.methods.browser && (
                          <p className="text-xs text-amber-600 mt-2">
                            Browser streaming is currently unavailable.
                          </p>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </TabsContent>
                
                <TabsContent value="compare" className="mt-4">
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Feature</th>
                          <th className="text-center p-3 font-medium">
                            <div className="flex items-center justify-center gap-1">
                              <Settings className="h-3 w-3" /> OBS
                            </div>
                          </th>
                          <th className="text-center p-3 font-medium">
                            <div className="flex items-center justify-center gap-1">
                              <Monitor className="h-3 w-3" /> Browser
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-3 text-muted-foreground">Video Quality</td>
                          <td className="p-3 text-center">
                            <span className="text-primary font-medium">Excellent</span>
                          </td>
                          <td className="p-3 text-center">Good</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-muted-foreground">Setup Time</td>
                          <td className="p-3 text-center">5-10 min first time</td>
                          <td className="p-3 text-center">
                            <span className="text-primary font-medium">Instant</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 text-muted-foreground">No Software Needed</td>
                          <td className="p-3 text-center">
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          </td>
                          <td className="p-3 text-center">
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 text-muted-foreground">Game Capture</td>
                          <td className="p-3 text-center">
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-muted-foreground text-xs">Screen only</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 text-muted-foreground">Custom Overlays</td>
                          <td className="p-3 text-center">
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          </td>
                          <td className="p-3 text-center">
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 text-muted-foreground">Multiple Scenes</td>
                          <td className="p-3 text-center">
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          </td>
                          <td className="p-3 text-center">
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 text-muted-foreground">Latency</td>
                          <td className="p-3 text-center">4-7 seconds</td>
                          <td className="p-3 text-center">
                            <span className="text-primary font-medium">&lt;1 second</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 text-muted-foreground">Best For</td>
                          <td className="p-3 text-center text-xs">Gaming, tutorials, professional</td>
                          <td className="p-3 text-center text-xs">Casual, Q&A, quick updates</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="help" className="mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="obs">
                      <AccordionTrigger className="text-sm">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          How to stream with OBS / Streamlabs
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground space-y-3">
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 1: Download Software</p>
                          <p>Download OBS Studio (free) from obsproject.com or Streamlabs from streamlabs.com</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 2: Create Your Stream</p>
                          <p>Click "Go Live" here. After creating, you'll see your RTMP URL and Stream Key.</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 3: Configure OBS</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Open OBS/Streamlabs and go to Settings → Stream</li>
                            <li>Select "Custom..." as the Service</li>
                            <li>Paste the Server URL into the "Server" field</li>
                            <li>Paste the Stream Key into the "Stream Key" field</li>
                            <li>Click Apply and OK to save</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 4: Set Up Your Scene</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Add sources: Game Capture, Display Capture, or Video Capture</li>
                            <li>Add your webcam and microphone</li>
                            <li>Optionally add overlays, alerts, and chat widgets</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 5: Go Live!</p>
                          <p>Click "Start Streaming" in OBS. Your stream will appear on Lumina.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="browser">
                      <AccordionTrigger className="text-sm">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          How to stream from your Browser
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground space-y-3">
                        {!providers?.methods.browser && (
                          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-3">
                            <p className="text-amber-600 dark:text-amber-400 text-xs">
                              <strong>Note:</strong> Browser streaming is currently unavailable. 
                              Platform administrators need to configure Cloudflare Stream to enable this feature.
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 1: Allow Permissions</p>
                          <p>Your browser will ask for camera and microphone access. Click "Allow".</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 2: Check Your Preview</p>
                          <p>You'll see a preview of your camera. Make sure lighting and audio are good.</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 3: Optional - Share Your Screen</p>
                          <p>Click the screen share button to show your screen instead of camera.</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Step 4: Go Live!</p>
                          <p>Click "Go Live" and you're streaming instantly. No software needed!</p>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <p className="text-amber-600 dark:text-amber-400 text-xs">
                            <strong>Tip:</strong> Use Chrome or Edge for best compatibility. 
                            Make sure you have a stable internet connection (5+ Mbps upload).
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="tips">
                      <AccordionTrigger className="text-sm">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Streaming Tips for Success
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground space-y-2">
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span><strong>Good lighting:</strong> Face a window or use a ring light</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span><strong>Stable internet:</strong> Use wired connection if possible</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span><strong>Engage viewers:</strong> Read chat and respond to comments</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span><strong>Consistent schedule:</strong> Stream at the same time regularly</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span><strong>Quality audio:</strong> A good mic matters more than video quality</span>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>
              </Tabs>

              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">All streams include:</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground ml-6">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" /> Live chat
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-3 w-3" /> LUM tips
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> Viewer count
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" /> Auto-recording
                  </span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setGoLiveOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createStreamMutation.mutate({ 
                  title, 
                  description: description || undefined,
                  streamingMethod,
                })}
                disabled={!title.trim() || createStreamMutation.isPending}
                data-testid="button-start-stream"
              >
                {createStreamMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : streamingMethod === "browser" ? (
                  <Monitor className="h-4 w-4 mr-2" />
                ) : (
                  <Radio className="h-4 w-4 mr-2" />
                )}
                {streamingMethod === "browser" ? "Go Live from Browser" : "Go Live"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
