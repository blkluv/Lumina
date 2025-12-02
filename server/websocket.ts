import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { Notification } from "@shared/schema";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
}

class NotificationHub {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const userId = url.searchParams.get("userId");

      if (!userId) {
        ws.close(4001, "Missing userId");
        return;
      }

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      console.log(`WebSocket connected: user ${userId}`);

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
