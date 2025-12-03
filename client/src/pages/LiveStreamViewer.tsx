import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Radio, 
  Eye, 
  Coins, 
  Send, 
  Loader2,
  Gift,
  MessageCircle,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface LiveStream {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  dailyRoomName: string | null;
  dailyRoomUrl: string | null;
  status: string;
  viewerCount: number;
  totalTips: string;
  startedAt: Date | null;
  endedAt: Date | null;
  host?: User;
}

interface StreamMessage {
  id: string;
  streamId: string;
  senderId: string;
  content: string;
  isTipMessage: boolean;
  tipAmount: string | null;
  createdAt: Date;
  sender?: User;
}

interface StreamToken {
  token: string;
  roomUrl: string;
  isOwner: boolean;
}

const TIP_AMOUNTS = [
  { amount: "1", label: "1 AXM" },
  { amount: "5", label: "5 AXM" },
  { amount: "10", label: "10 AXM" },
  { amount: "25", label: "25 AXM" },
  { amount: "50", label: "50 AXM" },
  { amount: "100", label: "100 AXM" },
];

function DailyVideoPlayer({ 
  streamId, 
  isHost, 
  onLeave 
}: { 
  streamId: string; 
  isHost: boolean; 
  onLeave: () => void;
}) {
  const { toast } = useToast();
  const callRef = useRef<DailyCall | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery<StreamToken>({
    queryKey: [`/api/streams/${streamId}/token`],
    enabled: !!streamId,
    retry: false,
  });

  const joinCall = useCallback(async () => {
    if (!tokenData || !containerRef.current || hasJoined) return;

    try {
      setIsJoining(true);
      setError(null);

      // Create call instance
      const call = DailyIframe.createCallObject({
        showLeaveButton: false,
        showFullscreenButton: false,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "12px",
        },
      });

      callRef.current = call;

      // Set up event listeners
      call.on("joined-meeting", () => {
        setIsJoining(false);
        setHasJoined(true);
      });

      call.on("left-meeting", () => {
        setHasJoined(false);
        onLeave();
      });

      call.on("error", (event) => {
        console.error("Daily.co error:", event);
        setError("Video connection error. Please try again.");
        setIsJoining(false);
      });

      call.on("camera-error", () => {
        toast({
          title: "Camera Error",
          description: "Could not access your camera. Please check permissions.",
          variant: "destructive",
        });
      });

      // Join the call
      await call.join({
        url: tokenData.roomUrl,
        token: tokenData.token,
        startVideoOff: !isHost,
        startAudioOff: !isHost,
      });

      // Attach to container
      if (containerRef.current) {
        const iframe = call.iframe();
        if (iframe) {
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(iframe);
        }
      }

    } catch (err) {
      console.error("Failed to join call:", err);
      setError("Failed to connect to stream. Please try again.");
      setIsJoining(false);
    }
  }, [tokenData, isHost, hasJoined, onLeave, toast]);

  useEffect(() => {
    if (tokenData && !hasJoined) {
      joinCall();
    }

    return () => {
      if (callRef.current) {
        callRef.current.leave();
        callRef.current.destroy();
      }
    };
  }, [tokenData, joinCall, hasJoined]);

  const toggleVideo = async () => {
    if (callRef.current) {
      await callRef.current.setLocalVideo(!isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = async () => {
    if (callRef.current) {
      await callRef.current.setLocalAudio(!isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  };

  const leaveCall = async () => {
    if (callRef.current) {
      await callRef.current.leave();
    }
    onLeave();
  };

  if (tokenLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tokenError || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-emerald-500/20 p-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-white text-center mb-4">
          {error || "Failed to load stream. Please try again."}
        </p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full bg-black rounded-xl" />
      
      {isJoining && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-white">Connecting to stream...</p>
          </div>
        </div>
      )}

      {isHost && hasJoined && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/70 rounded-full backdrop-blur-sm">
          <Button
            variant={isVideoOn ? "secondary" : "destructive"}
            size="icon"
            onClick={toggleVideo}
            data-testid="button-toggle-video"
          >
            {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button
            variant={isAudioOn ? "secondary" : "destructive"}
            size="icon"
            onClick={toggleAudio}
            data-testid="button-toggle-audio"
          >
            {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={leaveCall}
            data-testid="button-leave-call"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function LiveStreamViewer() {
  const [, params] = useRoute("/live/:id");
  const [, navigate] = useLocation();
  const streamId = params?.id;
  const { user } = useAuth();
  const { isConnected, axmBalance } = useWallet();
  const { toast } = useToast();
  
  const [message, setMessage] = useState("");
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState("5");
  const [tipMessage, setTipMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: stream, isLoading, refetch: refetchStream } = useQuery<LiveStream>({
    queryKey: [`/api/streams/${streamId}`],
    enabled: !!streamId,
    refetchInterval: 5000,
  });
  
  const { data: messages = [], refetch: refetchMessages } = useQuery<StreamMessage[]>({
    queryKey: [`/api/streams/${streamId}/messages`],
    enabled: !!streamId && stream?.status === "live",
    refetchInterval: 2000,
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/streams/${streamId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });
  
  const sendTipMutation = useMutation({
    mutationFn: async (data: { amount: string; message?: string }) => {
      const res = await apiRequest("POST", `/api/streams/${streamId}/tip`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Tip sent successfully!" });
      setTipOpen(false);
      setTipAmount("5");
      setTipMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/streams/${streamId}`] });
      refetchMessages();
    },
    onError: () => {
      toast({ title: "Failed to send tip", variant: "destructive" });
    },
  });
  
  const endStreamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/streams/${streamId}/end`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Stream ended" });
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      navigate("/live");
    },
  });
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleLeaveStream = () => {
    refetchStream();
  };
  
  const isHost = user?.id === stream?.hostId;
  const hasVideoRoom = !!stream?.dailyRoomName;
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (!stream) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Stream not found</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              {stream.status === "live" && hasVideoRoom && user ? (
                <DailyVideoPlayer 
                  streamId={streamId!} 
                  isHost={isHost}
                  onLeave={handleLeaveStream}
                />
              ) : stream.status === "live" && !hasVideoRoom ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-emerald-500/20 p-6">
                  <div className="p-4 rounded-full bg-primary/20 mb-4">
                    <Radio className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isHost ? "You're Live!" : "Live Stream"}
                  </h3>
                  <p className="text-white/70 text-center max-w-md">
                    {isHost 
                      ? "Video room not available. Chat and tips are still active!"
                      : "Video is not available for this stream. Enjoy the chat!"}
                  </p>
                </div>
              ) : stream.status === "live" && !user ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-emerald-500/20 p-6">
                  <div className="p-4 rounded-full bg-primary/20 mb-4">
                    <Radio className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Live Now</h3>
                  <p className="text-white/70 text-center max-w-md mb-4">
                    Sign in to watch this stream and interact with chat
                  </p>
                  <Button onClick={() => navigate("/auth")}>
                    Sign In to Watch
                  </Button>
                </div>
              ) : stream.thumbnailUrl ? (
                <img
                  src={stream.thumbnailUrl}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-emerald-500/30">
                  <Radio className="h-20 w-20 text-primary" />
                </div>
              )}
              
              {stream.status === "live" && (
                <Badge className="absolute top-4 left-4 bg-red-600 hover:bg-red-600">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  LIVE
                </Badge>
              )}
              
              {stream.status !== "live" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white mb-2">Stream Ended</p>
                    <p className="text-white/70">
                      {stream.endedAt && `Ended ${formatDistanceToNow(new Date(stream.endedAt), { addSuffix: true })}`}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-black/70 text-white border-0">
                    <Eye className="h-3 w-3 mr-1" />
                    {stream.viewerCount} viewers
                  </Badge>
                </div>
                
                {isHost && stream.status === "live" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="pointer-events-auto"
                    onClick={() => endStreamMutation.mutate()}
                    disabled={endStreamMutation.isPending}
                    data-testid="button-end-stream"
                  >
                    End Stream
                  </Button>
                )}
              </div>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={stream.host?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(stream.host?.displayName || stream.host?.username || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h1 className="text-xl font-bold" data-testid="text-stream-title">
                      {stream.title}
                    </h1>
                    <p className="text-muted-foreground">
                      {stream.host?.displayName || stream.host?.username}
                    </p>
                    {stream.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {stream.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {parseFloat(stream.totalTips) > 0 && (
                      <div className="flex items-center gap-1.5 text-primary">
                        <Coins className="h-5 w-5" />
                        <span className="font-bold">{stream.totalTips} AXM</span>
                      </div>
                    )}
                    
                    {!isHost && stream.status === "live" && isConnected && (
                      <Button onClick={() => setTipOpen(true)} data-testid="button-tip">
                        <Gift className="h-4 w-4 mr-2" />
                        Tip
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="lg:h-[calc(100vh-12rem)] flex flex-col">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Live Chat
              </CardTitle>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.isTipMessage && "p-2 rounded-lg bg-primary/10 border border-primary/20"
                      )}
                    >
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={msg.sender?.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {(msg.sender?.displayName || msg.sender?.username || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {msg.sender?.displayName || msg.sender?.username}
                          </span>
                          {msg.isTipMessage && msg.tipAmount && (
                            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                              <Coins className="h-3 w-3 mr-1" />
                              {msg.tipAmount} AXM
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {user && stream.status === "live" && (
              <div className="p-3 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Send a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-chat-message"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </div>
      </div>
      
      <Dialog open={tipOpen} onOpenChange={setTipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a Tip</DialogTitle>
            <DialogDescription>
              Support {stream.host?.displayName || stream.host?.username} with AXM tokens
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Amount</Label>
              <div className="grid grid-cols-3 gap-2">
                {TIP_AMOUNTS.map((tip) => (
                  <Button
                    key={tip.amount}
                    variant={tipAmount === tip.amount ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setTipAmount(tip.amount)}
                    data-testid={`tip-amount-${tip.amount}`}
                  >
                    {tip.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tip-message">Message (optional)</Label>
              <Input
                id="tip-message"
                placeholder="Add a message with your tip..."
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                data-testid="input-tip-message"
              />
            </div>
            
            <div className="p-3 rounded-lg bg-muted text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Balance</span>
                <span className="font-mono font-medium">{axmBalance} AXM</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Tip Amount</span>
                <span className="font-mono font-medium text-primary">{tipAmount} AXM</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTipOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendTipMutation.mutate({
                amount: tipAmount,
                message: tipMessage || undefined,
              })}
              disabled={sendTipMutation.isPending || parseFloat(axmBalance) < parseFloat(tipAmount)}
              data-testid="button-confirm-tip"
            >
              {sendTipMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Coins className="h-4 w-4 mr-2" />
              )}
              Send {tipAmount} AXM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
