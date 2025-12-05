import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, ArrowLeft, Loader2, Search, Shield, Zap } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ConversationWithMessages, MessageWithSender, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

function ConversationList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: conversations = [], isLoading } = useQuery<ConversationWithMessages[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: searchResults } = useQuery<{ users: User[] }>({
    queryKey: ["/api/search", searchQuery, "users"],
    queryFn: async () => {
      if (searchQuery.length < 2) return { users: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const res = await apiRequest("POST", "/api/conversations", { recipientId });
      return res.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation(`/messages/${conversation.id}`);
    },
  });

  const handleUserClick = (userId: string) => {
    createConversationMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users to message..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-message-search"
        />
      </div>

      {searchQuery.length >= 2 && searchResults?.users && searchResults.users.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Start a conversation with:</p>
          {searchResults.users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer transition-all"
              disabled={createConversationMutation.isPending}
              data-testid={`user-search-result-${user.id}`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium">{user.displayName || user.username}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No conversations yet</p>
          <p className="text-sm text-muted-foreground mt-1">Search for users to start messaging</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((convo) => (
            <Link key={convo.id} href={`/messages/${convo.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer transition-all" data-testid={`conversation-${convo.id}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={convo.otherParticipant?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {(convo.otherParticipant?.displayName || convo.otherParticipant?.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">
                      {convo.otherParticipant?.displayName || convo.otherParticipant?.username || "Unknown"}
                    </p>
                    {convo.lastMessageAt && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {convo.messages[0] && (
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.messages[0].content}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatView({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [lastRead, setLastRead] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const otherTypingTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  const { data: conversation, isLoading } = useQuery<ConversationWithMessages>({
    queryKey: ["/api/conversations", conversationId],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (conversationId) {
      apiRequest("POST", `/api/conversations/${conversationId}/read`, {}).catch(() => {});
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  useEffect(() => {
    const handleTypingEvent = (e: CustomEvent) => {
      if (e.detail?.conversationId === conversationId && e.detail?.senderId !== user?.id) {
        setOtherUserTyping(e.detail.isTyping);
        if (e.detail.isTyping) {
          if (otherTypingTimeoutRef.current) {
            clearTimeout(otherTypingTimeoutRef.current);
          }
          otherTypingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 5000);
        }
      }
    };

    const handleReadReceipt = (e: CustomEvent) => {
      if (e.detail?.conversationId === conversationId) {
        setLastRead(e.detail.readAt);
      }
    };

    window.addEventListener("ws:typing", handleTypingEvent as EventListener);
    window.addEventListener("ws:read_receipt", handleReadReceipt as EventListener);

    return () => {
      window.removeEventListener("ws:typing", handleTypingEvent as EventListener);
      window.removeEventListener("ws:read_receipt", handleReadReceipt as EventListener);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (otherTypingTimeoutRef.current) {
        clearTimeout(otherTypingTimeoutRef.current);
      }
    };
  }, [conversationId, user?.id]);

  const sendTypingIndicator = useCallback((typing: boolean) => {
    apiRequest("POST", `/api/conversations/${conversationId}/typing`, { isTyping: typing }).catch(() => {});
  }, [conversationId]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator(false);
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.otherParticipant?.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {(conversation.otherParticipant?.displayName || conversation.otherParticipant?.username || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {conversation.otherParticipant?.displayName || conversation.otherParticipant?.username || "Unknown"}
          </p>
          <p className="text-sm text-muted-foreground">@{conversation.otherParticipant?.username}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversation.messages.map((msg, index) => {
            const isOwn = msg.senderId === user?.id;
            const isLastOwnMessage = isOwn && index === conversation.messages.length - 1;
            return (
              <div
                key={msg.id}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "flex items-end gap-2 max-w-[80%]",
                  isOwn && "flex-row-reverse"
                )}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.sender.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(msg.sender.displayName || msg.sender.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "rounded-2xl px-4 py-2",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={cn(
                      "flex items-center gap-1 text-xs mt-1",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <span>{formatDistanceToNow(new Date(msg.createdAt!), { addSuffix: true })}</span>
                      {isLastOwnMessage && lastRead && (
                        <span className="ml-1 text-green-400">Read</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {otherUserTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={conversation.otherParticipant?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {(conversation.otherParticipant?.displayName || conversation.otherParticipant?.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-2 bg-muted rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            data-testid="input-message"
          />
          <Button 
            onClick={handleSend} 
            disabled={!message.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const params = useParams<{ id?: string }>();
  const conversationId = params.id;

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-4 py-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 p-4 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-2 right-2 h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Messages
                </h1>
                <p className="text-xs text-muted-foreground">Secure Web3 messaging</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background/50 backdrop-blur-sm rounded-lg px-2 py-1 border border-primary/20">
                <Shield className="h-3 w-3 text-green-400" />
                <span className="text-xs text-muted-foreground">E2E Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-14rem)]">
        <Card className="h-full flex flex-col overflow-hidden border-primary/10">
          <CardHeader className="flex-shrink-0 py-2 px-4 border-b bg-background/50">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="flex h-full">
              <div className={cn(
                "w-full lg:w-80 border-r overflow-y-auto p-4",
                conversationId && "hidden lg:block"
              )}>
                <ConversationList />
              </div>
              <div className={cn(
                "flex-1 flex-col",
                conversationId ? "flex" : "hidden lg:flex"
              )}>
                {conversationId ? (
                  <ChatView conversationId={conversationId} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </MainLayout>
  );
}
