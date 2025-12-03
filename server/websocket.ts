import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { Notification } from "@shared/schema";
import crypto from "crypto";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
}

// Token storage for WebSocket authentication
// Maps token -> { userId, createdAt }
const wsTokens = new Map<string, { userId: string; createdAt: number }>();

// Token expiry time (5 minutes)
const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

// Clean expired tokens periodically
setInterval(() => {
  const now = Date.now();
  const tokensToDelete: string[] = [];
  wsTokens.forEach((data, token) => {
    if (now - data.createdAt > TOKEN_EXPIRY_MS) {
      tokensToDelete.push(token);
    }
  });
  tokensToDelete.forEach(token => wsTokens.delete(token));
}, 60 * 1000); // Clean every minute

// Generate a one-time token for WebSocket authentication
export function generateWsToken(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  wsTokens.set(token, { userId, createdAt: Date.now() });
  return token;
}

// Validate and consume a WebSocket token
function validateWsToken(token: string): string | null {
  const data = wsTokens.get(token);
  if (!data) return null;
  
  const now = Date.now();
  if (now - data.createdAt > TOKEN_EXPIRY_MS) {
    wsTokens.delete(token);
    return null;
  }
  
  // Consume the token (one-time use)
  wsTokens.delete(token);
  return data.userId;
}

class NotificationHub {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      // Require a valid authentication token
      if (!token) {
        ws.close(4001, "Missing authentication token");
        return;
      }

      // Validate and consume the token
      const userId = validateWsToken(token);
      if (!userId) {
        ws.close(4002, "Invalid or expired authentication token");
        return;
      }

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      console.log(`WebSocket connected: user ${userId} (authenticated)`);

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch (e) {
        }
      });

      ws.on("close", () => {
        const userClients = this.clients.get(userId);
        if (userClients) {
          userClients.delete(ws);
          if (userClients.size === 0) {
            this.clients.delete(userId);
          }
        }
        console.log(`WebSocket disconnected: user ${userId}`);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });

      ws.send(JSON.stringify({ type: "connected", userId }));
    });

    console.log("WebSocket server initialized on /ws");
  }

  sendToUser(userId: string, event: { type: string; data: any }) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify(event);
      userClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  pushNotification(userId: string, notification: Notification) {
    this.sendToUser(userId, {
      type: "notification",
      data: notification,
    });
  }

  pushLike(userId: string, data: { postId: string; likerId: string; likerName: string }) {
    this.sendToUser(userId, {
      type: "like",
      data,
    });
  }

  pushComment(userId: string, data: { postId: string; commentId: string; authorId: string; authorName: string; content: string }) {
    this.sendToUser(userId, {
      type: "comment",
      data,
    });
  }

  pushFollow(userId: string, data: { followerId: string; followerName: string }) {
    this.sendToUser(userId, {
      type: "follow",
      data,
    });
  }

  pushTip(userId: string, data: { from: string; fromName: string; amount: string; postId?: string }) {
    this.sendToUser(userId, {
      type: "tip",
      data,
    });
  }

  pushMessage(userId: string, data: { 
    conversationId: string; 
    messageId: string;
    senderId: string; 
    senderName: string; 
    content: string;
    createdAt: string;
  }) {
    this.sendToUser(userId, {
      type: "message",
      data,
    });
  }

  pushTypingIndicator(userId: string, data: { 
    conversationId: string; 
    senderId: string; 
    senderName: string;
    isTyping: boolean;
  }) {
    this.sendToUser(userId, {
      type: "typing",
      data,
    });
  }

  pushReadReceipt(userId: string, data: { 
    conversationId: string; 
    readerId: string;
    readAt: string;
  }) {
    this.sendToUser(userId, {
      type: "read_receipt",
      data,
    });
  }

  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.clients.has(userId);
  }
}

export const notificationHub = new NotificationHub();
