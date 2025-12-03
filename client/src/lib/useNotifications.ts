import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./authContext";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

interface WebSocketMessage {
  type: string;
  data?: any;
}

const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

// Fetch a one-time WebSocket authentication token
async function fetchWsToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/ws-token", {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("Failed to fetch WebSocket token:", error);
    return null;
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const isConnectingRef = useRef(false);

  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const connect = useCallback(async () => {
    if (!user?.id) return;
    
    // Prevent race conditions with concurrent connect attempts
    if (isConnectingRef.current) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    isConnectingRef.current = true;

    // Get a fresh authentication token
    const token = await fetchWsToken();
    if (!token) {
      isConnectingRef.current = false;
      console.error("Could not get WebSocket authentication token");
      // Retry after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectDelayRef.current);
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      isConnectingRef.current = false;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        console.log("WebSocket disconnected, reconnecting in", reconnectDelayRef.current, "ms");
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelayRef.current);
        
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 2,
          MAX_RECONNECT_DELAY
        );
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      isConnectingRef.current = false;
      console.error("Failed to connect WebSocket:", error);
    }
  }, [user?.id]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "notification":
        const notification = message.data as Notification;
        refetch();
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        
        if (notification?.type === "like") {
          toast({
            title: "New Like",
            description: notification.message,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        } else if (notification?.type === "comment") {
          toast({
            title: "New Comment",
            description: notification.message,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        } else if (notification?.type === "follow") {
          toast({
            title: "New Follower",
            description: notification.message,
          });
        } else if (notification?.type === "tip") {
          toast({
            title: "Tip Received!",
            description: notification.message,
          });
        } else if (notification?.title) {
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
        break;
      case "message":
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        if (message.data?.conversationId) {
          queryClient.invalidateQueries({ queryKey: ["/api/conversations", message.data.conversationId] });
        }
        break;
      case "typing":
        window.dispatchEvent(new CustomEvent("ws:typing", { detail: message.data }));
        break;
      case "read_receipt":
        window.dispatchEvent(new CustomEvent("ws:read_receipt", { detail: message.data }));
        break;
      case "pong":
      case "connected":
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }, [toast, refetch, queryClient]);

  useEffect(() => {
    if (user?.id) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.id, connect]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    refetch,
  };
}
