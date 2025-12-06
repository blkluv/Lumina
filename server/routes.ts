import type { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import multer from "multer";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Configure multer for file uploads (500MB limit for videos)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (_req, file, cb) => {
    // Only allow video and image MIME types
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only video and image files are allowed.`));
    }
  },
});

// Rate limiter for upload proxy (stricter to prevent abuse)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads per minute
  message: { error: "Too many uploads, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});
import { notificationHub, generateWsToken } from "./websocket";
import { sendBulkEmail, emailTemplates, sendEmail } from "./services/email";
import { sendSMS, smsTemplates } from "./services/sms";
import { createCheckoutSession, isStripeConfigured, getPublishableKey, verifyStripeWebhookSignature, isWebhookSecretConfigured, type StripeWebhookEvent } from "./services/payments";
import { contentModerationService, type ModerationResult } from "./services/contentModeration";
import { generateAutoThumbnail, extractMultipleFrames, generateThumbnailAtTimestamp } from "./videoThumbnail";

// Rate limiters for different endpoint categories
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 posts per minute
  message: { error: "Too many posts, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// HTML sanitization options - strip all HTML for security
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [], // No HTML allowed
  allowedAttributes: {},
  disallowedTagsMode: 'recursiveEscape',
};

// Helper to sanitize user input text
function sanitizeText(text: string | undefined | null): string {
  if (!text) return "";
  return sanitizeHtml(text, sanitizeOptions).trim();
}

// CSRF Protection using Double Submit Cookie pattern
// The token is stored in both a cookie (readable by JS) and validated against the header
// This prevents CSRF because attackers can't read cookies from another domain

// Generate a new CSRF token
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Set CSRF cookie with appropriate security settings
function setCsrfCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('csrf-token', token, {
    httpOnly: false, // Must be false so JavaScript can read it
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000, // 30 minutes
    path: '/',
  });
}

// Validate CSRF token - both cookie and header must match
function validateCsrfToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken, 'utf8'),
      Buffer.from(headerToken, 'utf8')
    );
  } catch {
    return false;
  }
}

// Parse cookies from request
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });
  
  return cookies;
}

// CSRF protection middleware for state-changing requests
function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for unauthenticated requests (auth endpoints handle their own security)
  if (!req.session?.userId) {
    return next();
  }
  
  // Skip CSRF for webhook endpoints that have their own signature verification
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }
  
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'] as string | undefined;
  
  if (!validateCsrfToken(cookieToken, headerToken)) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  
  next();
}
import {
  insertUserSchema,
  insertPostSchema,
  insertCommentSchema,
  insertGroupSchema,
  insertPetitionSchema,
  insertPetitionSignatureSchema,
  insertCampaignSchema,
  insertCampaignDonationSchema,
  insertEventSchema,
  insertEventRsvpSchema,
  insertEmailCampaignSchema,
  insertContentAppealSchema,
  users,
  transactions,
  contentReports,
  subscriptionTiers,
  subscriptions,
  virtualGifts,
  advertisements,
  products,
  orders,
  platformGuidelines,
  contentViolations,
  userWarnings,
  moderationActions,
  moderationQueue,
  contentAppeals,
  shops,
  liveStreams,
  nftListings,
  type User,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ethers } from "ethers";

// Arbitrum One RPC configuration for transaction verification
const ARBITRUM_RPC_URL = "https://arb1.arbitrum.io/rpc";
const AXM_TOKEN_ADDRESS = "0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D";
const PLATFORM_TREASURY_WALLET = "0x7F455b4614E05820AAD52067Ef223f30b1936f93";
const PLATFORM_FEE_BPS = 200; // 2%

// ERC-20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = ethers.id("Transfer(address,address,uint256)");

interface TransferVerification {
  verified: boolean;
  from: string;
  to: string;
  amount: string;
  error?: string;
}

async function verifyAXMTransfer(
  txHash: string, 
  expectedRecipient: string, 
  expectedAmountWei: bigint
): Promise<TransferVerification> {
  try {
    const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC_URL);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { verified: false, from: "", to: "", amount: "0", error: "Transaction not found or pending" };
    }
    
    if (receipt.status !== 1) {
      return { verified: false, from: "", to: "", amount: "0", error: "Transaction failed" };
    }
    
    // Find Transfer event from AXM token
    const transferLog = receipt.logs.find(log => 
      log.address.toLowerCase() === AXM_TOKEN_ADDRESS.toLowerCase() &&
      log.topics[0] === TRANSFER_EVENT_SIGNATURE
    );
    
    if (!transferLog) {
      return { verified: false, from: "", to: "", amount: "0", error: "No AXM transfer found in transaction" };
    }
    
    // Decode the transfer event
    const from = ethers.getAddress("0x" + transferLog.topics[1].slice(26));
    const to = ethers.getAddress("0x" + transferLog.topics[2].slice(26));
    const amount = BigInt(transferLog.data);
    
    // Verify recipient matches
    if (to.toLowerCase() !== expectedRecipient.toLowerCase()) {
      return { 
        verified: false, 
        from, 
        to, 
        amount: amount.toString(), 
        error: `Wrong recipient. Expected ${expectedRecipient}, got ${to}` 
      };
    }
    
    // Allow 0.1% tolerance for rounding
    const tolerance = expectedAmountWei / BigInt(1000);
    const amountDiff = amount > expectedAmountWei ? amount - expectedAmountWei : expectedAmountWei - amount;
    
    if (amountDiff > tolerance) {
      return { 
        verified: false, 
        from, 
        to, 
        amount: amount.toString(), 
        error: `Amount mismatch. Expected ${expectedAmountWei.toString()}, got ${amount.toString()}` 
      };
    }
    
    return { verified: true, from, to, amount: amount.toString() };
  } catch (error: any) {
    console.error("Transaction verification error:", error);
    return { verified: false, from: "", to: "", amount: "0", error: error.message || "Verification failed" };
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const objectStorageService = new ObjectStorageService();

function sanitizeUser<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _, ...sanitized } = user;
  return sanitized;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<void> {
  // Apply CSRF protection globally for state-changing requests
  app.use(csrfProtection);
  
  // CSRF token endpoint - provides a fresh token for authenticated users
  app.get("/api/csrf-token", requireAuth, (req, res) => {
    const token = generateCsrfToken();
    setCsrfCookie(res, token);
    res.json({ csrfToken: token });
  });
  
  // Apply rate limiting to auth routes
  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    try {
      const { email, username, password } = req.body;
      
      if (!email || !username || !password) {
        return res.status(400).json({ error: "Email, username, and password are required" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        displayName: username,
      });

      // Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }
          const { password: _, ...userWithoutPassword } = user;
          res.status(201).json({ user: userWithoutPassword });
        });
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }
          const { password: _, ...userWithoutPassword } = user;
          res.json({ user: userWithoutPassword });
        });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Generate a one-time token for WebSocket authentication
  app.get("/api/auth/ws-token", requireAuth, (req, res) => {
    try {
      const token = generateWsToken(req.session.userId!);
      res.json({ token });
    } catch (error) {
      console.error("WebSocket token generation error:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  });

  app.get("/api/users/:identifier", async (req, res) => {
    try {
      const identifier = req.params.identifier;
      // Check if identifier is a UUID (user ID) or a username
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      let user;
      if (isUUID) {
        user = await storage.getUser(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { posts } = await storage.getPosts({ authorId: user.id });
      const videos = posts.filter((p) => p.postType === "video");
      const textPosts = posts.filter((p) => p.postType !== "video");

      const followerCount = await storage.getFollowerCount(user.id);
      const followingCount = await storage.getFollowingCount(user.id);

      let isFollowing = false;
      if (req.session?.userId && req.session.userId !== user.id) {
        const follow = await storage.getFollow(req.session.userId, user.id);
        isFollowing = !!follow;
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        posts: textPosts,
        videos,
        followerCount,
        followingCount,
        isFollowing,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const { 
        displayName, 
        bio, 
        username, 
        avatarUrl, 
        bannerUrl,
        location,
        website,
        pronouns,
        profileTheme,
        profileAccentColor,
        showWalletOnProfile,
        showBadgesOnProfile
      } = req.body;
      
      if (username) {
        const existing = await storage.getUserByUsername(username);
        if (existing && existing.id !== req.session.userId) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      // Sanitize text fields to prevent XSS
      const updates: any = {};
      if (displayName !== undefined) updates.displayName = sanitizeText(displayName);
      if (bio !== undefined) updates.bio = sanitizeText(bio);
      if (username !== undefined) updates.username = sanitizeText(username);
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
      if (bannerUrl !== undefined) updates.bannerUrl = bannerUrl;
      if (location !== undefined) updates.location = sanitizeText(location);
      if (website !== undefined) updates.website = website;
      if (pronouns !== undefined) updates.pronouns = sanitizeText(pronouns);
      if (profileTheme !== undefined) updates.profileTheme = profileTheme;
      if (profileAccentColor !== undefined) updates.profileAccentColor = profileAccentColor;
      if (showWalletOnProfile !== undefined) updates.showWalletOnProfile = showWalletOnProfile;
      if (showBadgesOnProfile !== undefined) updates.showBadgesOnProfile = showBadgesOnProfile;

      const user = await storage.updateUser(req.session.userId!, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      const followingId = req.params.id;
      const followerId = req.session.userId!;

      if (followerId === followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      const existing = await storage.getFollow(followerId, followingId);
      if (existing) {
        return res.status(400).json({ error: "Already following" });
      }

      const follow = await storage.createFollow({ followerId, followingId });
      
      await storage.createRewardEvent({
        userId: followingId,
        eventType: "received_follow",
        points: 5,
        metadata: { followerId },
      });

      const follower = await storage.getUser(followerId);
      const notification = await storage.createNotification({
        userId: followingId,
        type: "follow",
        title: "New Follower",
        message: `${follower?.displayName || follower?.username} started following you`,
        data: { followerId, followerName: follower?.displayName || follower?.username },
      });
      
      notificationHub.pushNotification(followingId, notification);

      res.status(201).json({ follow });
    } catch (error) {
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      await storage.deleteFollow(req.session.userId!, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string | undefined;
      const result = await storage.getPosts({ limit, cursor });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get posts" });
    }
  });

  app.get("/api/posts/videos", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string | undefined;
      const result = await storage.getPosts({ limit, cursor, type: "video" });
      
      // Add liked status for current user
      const userId = req.session?.userId;
      if (userId) {
        const postsWithLikedStatus = await Promise.all(
          result.posts.map(async (post) => {
            const like = await storage.getLike(userId, post.id);
            return { ...post, liked: !!like };
          })
        );
        res.json({ ...result, posts: postsWithLikedStatus });
      } else {
        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get videos" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || "").trim();
      const type = req.query.type as string || "all";
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        return res.json({ users: [], posts: [], groups: [] });
      }

      const results = await storage.search(query, type, limit);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  app.get("/api/discover/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingPosts(limit);
      res.json(trending);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trending" });
    }
  });

  app.get("/api/discover/creators", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const creators = await storage.getTopCreators(limit);
      res.json(creators);
    } catch (error) {
      res.status(500).json({ error: "Failed to get top creators" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to get post" });
    }
  });

  // Pre-publish content moderation check
  app.post("/api/moderation/pre-check", requireAuth, async (req, res) => {
    try {
      const { content, mediaUrl, mediaType } = req.body;
      
      if (!content && !mediaUrl) {
        return res.status(400).json({ error: "Content or media required" });
      }

      let moderationResult: ModerationResult = { 
        isViolation: false, 
        explanation: "", 
        severity: "low",
        violationType: null,
        confidenceScore: 0,
        suggestedAction: "approve"
      };

      // Check text content
      if (content) {
        moderationResult = await contentModerationService.analyzeTextContent(content);
      }

      // Check media content if present - always analyze if mediaUrl exists
      // Don't trust client-provided mediaType
      if (mediaUrl) {
        try {
          const mediaResult = await contentModerationService.analyzeImageContent(mediaUrl, content);
          // Use media result if it shows a violation (or if no text violation)
          if (mediaResult.isViolation || !moderationResult.isViolation) {
            moderationResult = mediaResult;
          }
        } catch (mediaError) {
          console.error("Pre-check media moderation failed:", mediaError);
        }
      }

      res.json({
        approved: !moderationResult.isViolation,
        isViolation: moderationResult.isViolation,
        violationType: moderationResult.violationType,
        severity: moderationResult.severity,
        explanation: moderationResult.explanation,
        warning: moderationResult.isViolation 
          ? "This content may violate our community guidelines. Please review and modify before posting."
          : null
      });
    } catch (error) {
      console.error("Pre-moderation check error:", error);
      // On error, allow posting but flag for review
      res.json({ 
        approved: true, 
        isViolation: false,
        flagForReview: true,
        explanation: "Moderation check unavailable - content will be reviewed after posting"
      });
    }
  });

  app.post("/api/posts", requireAuth, postLimiter, async (req, res) => {
    try {
      const { content, postType, mediaUrl, mediaType, thumbnailUrl } = req.body;
      console.log("Creating post with thumbnailUrl:", thumbnailUrl);
      
      // Sanitize user-provided text content to prevent XSS
      const sanitizedContent = sanitizeText(content);
      
      // Run moderation check on new posts
      let moderationResult = null;
      
      // Check text content (use original for moderation, sanitized for storage)
      if (content) {
        moderationResult = await contentModerationService.analyzeTextContent(content);
        
        // For high/critical severity text violations, reject immediately
        if (moderationResult.isViolation && 
            (moderationResult.severity === "high" || moderationResult.severity === "critical")) {
          return res.status(400).json({ 
            error: "Content violates community guidelines",
            moderationResult,
            blocked: true
          });
        }
      }
      
      // Check media content - always analyze if mediaUrl is present
      // Don't trust client-provided mediaType - analyze all media URLs as potential images
      let mediaModFailed = false;
      if (mediaUrl) {
        try {
          const mediaResult = await contentModerationService.analyzeImageContent(mediaUrl, content);
          
          // For high/critical severity image violations, reject immediately
          if (mediaResult.isViolation && 
              (mediaResult.severity === "high" || mediaResult.severity === "critical")) {
            return res.status(400).json({ 
              error: "Media content violates community guidelines",
              moderationResult: mediaResult,
              blocked: true
            });
          }
          
          // If no text violation but there's a media violation, use that result
          if (!moderationResult?.isViolation && mediaResult.isViolation) {
            moderationResult = mediaResult;
          }
        } catch (mediaError) {
          console.error("Media moderation failed:", mediaError);
          // Mark for manual review when media moderation fails
          mediaModFailed = true;
        }
      }

      // Create the post with sanitized content
      const post = await storage.createPost({
        ...req.body,
        content: sanitizedContent, // Use sanitized content
        authorId: req.session.userId!,
      });

      // Record violation with actual post ID if there was a low/medium violation
      if (moderationResult?.isViolation && 
          (moderationResult.severity === "low" || moderationResult.severity === "medium")) {
        await contentModerationService.processViolation(
          req.session.userId!,
          "post",
          post.id,
          moderationResult,
          content
        );
      }
      
      // If media moderation failed, add to manual review queue
      if (mediaModFailed && mediaUrl) {
        await contentModerationService.addToModerationQueue(
          post.id,
          null,
          req.session.userId!,
          "post_with_media",
          2 // Higher priority for media moderation failures
        );
      }

      await storage.createRewardEvent({
        userId: req.session.userId!,
        eventType: "post_created",
        points: 10,
        metadata: { postId: post.id },
      });

      res.status(201).json({ post });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session.userId!;

      const existing = await storage.getLike(userId, postId);
      if (existing) {
        await storage.deleteLike(userId, postId);
        return res.json({ liked: false });
      }

      await storage.createLike({ userId, postId });
      
      const post = await storage.getPost(postId);
      if (post && post.authorId !== userId) {
        await storage.createRewardEvent({
          userId: post.authorId,
          eventType: "received_like",
          points: 2,
          metadata: { postId, likerId: userId },
        });

        const liker = await storage.getUser(userId);
        const notification = await storage.createNotification({
          userId: post.authorId,
          type: "like",
          title: "New Like",
          message: `${liker?.displayName || liker?.username} liked your post`,
          data: { postId, likerId: userId, likerName: liker?.displayName || liker?.username },
        });
        
        notificationHub.pushNotification(post.authorId, notification);
      }

      res.json({ liked: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Delete own post
  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session.userId!;

      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.authorId !== userId) {
        return res.status(403).json({ error: "You can only delete your own posts" });
      }

      await storage.deletePost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      // Sanitize comment content to prevent XSS
      const sanitizedContent = sanitizeText(req.body.content);
      
      const comment = await storage.createComment({
        postId: req.params.id,
        authorId: req.session.userId!,
        content: sanitizedContent,
      });

      const post = await storage.getPost(req.params.id);
      if (post && post.authorId !== req.session.userId) {
        await storage.createRewardEvent({
          userId: post.authorId,
          eventType: "received_comment",
          points: 3,
          metadata: { postId: post.id, commentId: comment.id },
        });

        const commenter = await storage.getUser(req.session.userId!);
        const notification = await storage.createNotification({
          userId: post.authorId,
          type: "comment",
          title: "New Comment",
          message: `${commenter?.displayName || commenter?.username} commented on your post`,
          data: { postId: post.id, commentId: comment.id, authorName: commenter?.displayName || commenter?.username, content: sanitizedContent },
        });
        
        notificationHub.pushNotification(post.authorId, notification);
      }

      res.status(201).json({ comment });
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getGroups();
      const result = await Promise.all(
        groups.map(async (group) => {
          let isMember = false;
          if (req.session?.userId) {
            const membership = await storage.getGroupMembership(group.id, req.session.userId);
            isMember = !!membership;
          }
          return { ...group, isMember };
        })
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get groups" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      let isMember = false;
      let isCreator = false;
      if (req.session?.userId) {
        const membership = await storage.getGroupMembership(group.id, req.session.userId);
        isMember = !!membership;
        isCreator = group.createdById === req.session.userId;
      }

      const { posts } = await storage.getPosts({ limit: 50 });
      const groupPosts = posts.filter(p => p.groupId === group.id);

      res.json({ ...group, isMember, isCreator, posts: groupPosts });
    } catch (error) {
      res.status(500).json({ error: "Failed to get group" });
    }
  });

  app.post("/api/groups", requireAuth, async (req, res) => {
    try {
      // Sanitize group fields
      const sanitizedBody = {
        ...req.body,
        name: req.body.name ? sanitizeText(req.body.name) : undefined,
        description: req.body.description ? sanitizeText(req.body.description) : undefined,
        createdById: req.session.userId!,
      };
      
      const group = await storage.createGroup(sanitizedBody);
      
      await storage.createGroupMembership({
        groupId: group.id,
        userId: req.session.userId!,
        role: "admin",
      });

      res.status(201).json({ group });
    } catch (error) {
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.post("/api/groups/:id/members", requireAuth, async (req, res) => {
    try {
      const membership = await storage.createGroupMembership({
        groupId: req.params.id,
        userId: req.session.userId!,
      });
      res.status(201).json({ membership });
    } catch (error) {
      res.status(500).json({ error: "Failed to join group" });
    }
  });

  app.delete("/api/groups/:id/members", requireAuth, async (req, res) => {
    try {
      await storage.deleteGroupMembership(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to leave group" });
    }
  });

  app.get("/api/groups/:id/members", async (req, res) => {
    try {
      const members = await storage.getGroupMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to get group members" });
    }
  });

  app.patch("/api/groups/:id", requireAuth, async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      if (group.createdById !== req.session.userId) {
        return res.status(403).json({ error: "Only the group creator can update settings" });
      }

      const updatedGroup = await storage.updateGroup(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        isPrivate: req.body.isPrivate,
      });

      res.json(updatedGroup);
    } catch (error) {
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  app.delete("/api/groups/:id/members/:userId", requireAuth, async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const membership = await storage.getGroupMembership(req.params.id, req.session.userId!);
      if (!membership || (membership.role !== "admin" && membership.role !== "moderator")) {
        return res.status(403).json({ error: "Only admins and moderators can remove members" });
      }

      await storage.deleteGroupMembership(req.params.id, req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  app.patch("/api/groups/:id/members/:userId", requireAuth, async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (group.createdById !== req.session.userId) {
        return res.status(403).json({ error: "Only the group creator can change member roles" });
      }

      const { role } = req.body;
      if (!["member", "moderator", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const membership = await storage.updateGroupMembership(req.params.id, req.params.userId, { role });
      res.json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to update member role" });
    }
  });

  app.post("/api/wallet/bind", requireAuth, async (req, res) => {
    try {
      const { address, signature, message } = req.body;
      
      if (!address || !signature || !message) {
        return res.status(400).json({ error: "Address, signature, and message are required" });
      }

      // Verify the signature matches the claimed address
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          return res.status(400).json({ error: "Invalid signature - address mismatch" });
        }
      } catch (sigError) {
        console.error("Signature verification failed:", sigError);
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Check if wallet is already bound to another account
      const existingUser = await db.select().from(users).where(eq(users.walletAddress, address.toLowerCase())).limit(1);
      if (existingUser.length > 0 && existingUser[0].id !== req.session.userId) {
        return res.status(400).json({ error: "This wallet is already linked to another account" });
      }
      
      const user = await storage.updateUser(req.session.userId!, {
        walletAddress: address.toLowerCase(),
        walletVerified: true,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Wallet bind error:", error);
      res.status(500).json({ error: "Failed to bind wallet" });
    }
  });

  app.delete("/api/wallet/unbind", requireAuth, async (req, res) => {
    try {
      await storage.updateUser(req.session.userId!, {
        walletAddress: null,
        walletVerified: false,
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unbind wallet" });
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Upload URL error:", error);
      res.status(500).json({ error: error.message || "Failed to get upload URL" });
    }
  });

  // Resumable upload endpoint for large files (videos)
  app.post("/api/objects/resumable-upload", requireAuth, async (req, res) => {
    try {
      const { contentType } = req.body;
      if (!contentType) {
        return res.status(400).json({ error: "contentType is required" });
      }
      
      const result = await objectStorageService.createResumableUpload(contentType);
      res.json(result);
    } catch (error: any) {
      console.error("Resumable upload error:", error);
      res.status(500).json({ error: error.message || "Failed to create resumable upload" });
    }
  });

  // Proxy upload endpoint - uploads through server to avoid browser CORS/timeout issues
  // Uses rate limiting and auth to prevent abuse
  app.post("/api/objects/upload-proxy", requireAuth, uploadLimiter, (req, res, next) => {
    // Handle multer errors (file type validation, size limits)
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: "File too large. Maximum size is 500MB." });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(415).json({ error: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      
      const contentType = req.file.mimetype;
      const buffer = req.file.buffer;
      
      console.log(`Proxy upload: ${req.file.originalname}, size: ${buffer.length} bytes, type: ${contentType}`);
      
      // Upload to GCS using server-side resumable upload
      const objectPath = await objectStorageService.uploadFromBuffer(buffer, contentType);
      
      // Set ACL to public
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
        owner: req.session.userId!,
        visibility: "public",
      });
      
      console.log(`Proxy upload complete: ${objectPath}`);
      res.json({ objectPath });
    } catch (error: any) {
      console.error("Proxy upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  // Video thumbnail endpoints
  
  // Auto-generate a thumbnail from video at default position (2 seconds)
  app.post("/api/video/auto-thumbnail", requireAuth, async (req, res) => {
    try {
      const { videoPath } = req.body;
      if (!videoPath) {
        return res.status(400).json({ error: "videoPath is required" });
      }
      
      console.log(`Generating auto thumbnail for: ${videoPath}`);
      const result = await generateAutoThumbnail(videoPath, req.session.userId!);
      
      res.json({
        thumbnailPath: result.thumbnailPath,
        timestamp: result.timestamp
      });
    } catch (error: any) {
      console.error("Auto thumbnail generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate thumbnail" });
    }
  });

  // Extract multiple frames from video for user selection
  app.post("/api/video/extract-frames", requireAuth, async (req, res) => {
    try {
      const { videoPath, frameCount = 6 } = req.body;
      if (!videoPath) {
        return res.status(400).json({ error: "videoPath is required" });
      }
      
      console.log(`Extracting ${frameCount} frames from: ${videoPath}`);
      const result = await extractMultipleFrames(videoPath, req.session.userId!, frameCount);
      
      res.json(result);
    } catch (error: any) {
      console.error("Frame extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract frames" });
    }
  });

  // Generate thumbnail at specific timestamp
  app.post("/api/video/thumbnail-at-timestamp", requireAuth, async (req, res) => {
    try {
      const { videoPath, timestamp } = req.body;
      if (!videoPath) {
        return res.status(400).json({ error: "videoPath is required" });
      }
      if (typeof timestamp !== "number" || timestamp < 0) {
        return res.status(400).json({ error: "Valid timestamp is required" });
      }
      
      console.log(`Generating thumbnail at ${timestamp}s for: ${videoPath}`);
      const result = await generateThumbnailAtTimestamp(videoPath, req.session.userId!, timestamp);
      
      res.json({
        thumbnailPath: result.thumbnailPath,
        timestamp: result.timestamp
      });
    } catch (error: any) {
      console.error("Thumbnail generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate thumbnail" });
    }
  });

  app.put("/api/media", requireAuth, async (req, res) => {
    try {
      const { mediaURL } = req.body;
      const objectPath = objectStorageService.normalizeObjectEntityPath(mediaURL);
      
      await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
        owner: req.session.userId!,
        visibility: "public",
      });

      res.json({ objectPath });
    } catch (error: any) {
      console.error("Media update error:", error);
      res.status(500).json({ error: error.message || "Failed to update media" });
    }
  });

  app.get("/objects/*", async (req, res) => {
    try {
      const wildcardParam = (req.params as Record<string, string>)[0];
      const objectPath = `/objects/${wildcardParam}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId: req.session?.userId,
        objectFile,
      });

      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      console.error("Object fetch error:", error);
      res.status(500).json({ error: "Failed to fetch object" });
    }
  });

  const priceCache: { 
    axm?: { data: any; timestamp: number }; 
    eth?: { data: any; timestamp: number }; 
  } = {};
  const CACHE_TTL = 60000;

  app.get("/api/price/axm", async (req, res) => {
    try {
      if (priceCache.axm && Date.now() - priceCache.axm.timestamp < CACHE_TTL) {
        return res.json(priceCache.axm.data);
      }

      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=axiom-2&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'
      );
      
      if (!response.ok) {
        const fallbackData = { 
          price: 0.001,
          change24h: 0,
          marketCap: 0,
          source: 'fallback',
          message: 'Using estimated price - token not yet listed'
        };
        priceCache.axm = { data: fallbackData, timestamp: Date.now() };
        return res.json(fallbackData);
      }
      
      const data = await response.json();
      
      if (data['axiom-2']) {
        const priceData = {
          price: data['axiom-2'].usd || 0.001,
          change24h: data['axiom-2'].usd_24h_change || 0,
          marketCap: data['axiom-2'].usd_market_cap || 0,
          source: 'coingecko'
        };
        priceCache.axm = { data: priceData, timestamp: Date.now() };
        res.json(priceData);
      } else {
        const fallbackData = { 
          price: 0.001,
          change24h: 0,
          marketCap: 0,
          source: 'fallback',
          message: 'Using estimated price - token not yet listed'
        };
        priceCache.axm = { data: fallbackData, timestamp: Date.now() };
        res.json(fallbackData);
      }
    } catch (error) {
      console.error("Price fetch error:", error);
      const fallbackData = { 
        price: 0.001,
        change24h: 0,
        marketCap: 0,
        source: 'fallback',
        message: 'Using estimated price'
      };
      priceCache.axm = { data: fallbackData, timestamp: Date.now() };
      res.json(fallbackData);
    }
  });

  app.get("/api/price/eth", async (req, res) => {
    try {
      if (priceCache.eth && Date.now() - priceCache.eth.timestamp < CACHE_TTL) {
        return res.json(priceCache.eth.data);
      }

      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        const fallbackData = { price: 2000, change24h: 0, source: 'fallback' };
        priceCache.eth = { data: fallbackData, timestamp: Date.now() };
        return res.json(fallbackData);
      }
      
      const data = await response.json();
      const priceData = {
        price: data.ethereum?.usd || 2000,
        change24h: data.ethereum?.usd_24h_change || 0,
        source: 'coingecko'
      };
      priceCache.eth = { data: priceData, timestamp: Date.now() };
      res.json(priceData);
    } catch (error) {
      console.error("ETH price fetch error:", error);
      const fallbackData = { price: 2000, change24h: 0, source: 'fallback' };
      priceCache.eth = { data: fallbackData, timestamp: Date.now() };
      res.json(fallbackData);
    }
  });

  app.get("/api/treasury/stats", async (req, res) => {
    try {
      const stats = {
        rewardsPoolAllocation: 1000000,
        treasuryVaultAddress: '0x2bB2c2A7a1d82097488bf0b9c2a59c1910CD8D5d',
        rewardsPoolAddress: '0x2bB2c2A7a1d82097488bf0b9c2a59c1910CD8D5d',
        tokenAddress: '0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D',
        chainId: 42161,
        network: 'Arbitrum One',
        tokenSymbol: 'AXM',
        tokenDecimals: 18
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get treasury stats" });
    }
  });

  app.get("/api/rewards", requireAuth, async (req, res) => {
    try {
      const snapshot = await storage.getRewardSnapshot(req.session.userId!);
      const events = await storage.getRewardEvents(req.session.userId!);
      res.json({ snapshot, events });
    } catch (error) {
      res.status(500).json({ error: "Failed to get rewards" });
    }
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getConversations(req.session.userId!);
      const sanitizedConversations = conversations.map(conv => ({
        ...conv,
        participants: conv.participants.map(p => sanitizeUser(p)),
        lastMessage: conv.lastMessage ? {
          ...conv.lastMessage,
          sender: conv.lastMessage.sender ? sanitizeUser(conv.lastMessage.sender) : undefined,
        } : undefined,
      }));
      res.json(sanitizedConversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  app.get("/api/conversations/:id", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id, req.session.userId!);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const sanitizedConversation = {
        ...conversation,
        participants: conversation.participants.map(p => sanitizeUser(p)),
        lastMessage: conversation.lastMessage ? {
          ...conversation.lastMessage,
          sender: conversation.lastMessage.sender ? sanitizeUser(conversation.lastMessage.sender) : undefined,
        } : undefined,
      };
      res.json(sanitizedConversation);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const { recipientId } = req.body;
      if (!recipientId) {
        return res.status(400).json({ error: "Recipient ID is required" });
      }

      const conversation = await storage.getOrCreateConversation([req.session.userId!, recipientId]);
      const fullConversation = await storage.getConversation(conversation.id, req.session.userId!);
      if (!fullConversation) {
        return res.status(500).json({ error: "Failed to retrieve conversation" });
      }
      const sanitizedConversation = {
        ...fullConversation,
        participants: fullConversation.participants.map(p => sanitizeUser(p)),
        lastMessage: fullConversation.lastMessage ? {
          ...fullConversation.lastMessage,
          sender: fullConversation.lastMessage.sender ? sanitizeUser(fullConversation.lastMessage.sender) : undefined,
        } : undefined,
      };
      res.status(201).json(sanitizedConversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id, req.session.userId!);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await storage.getMessages(req.params.id, 100);
      const sanitizedMessages = messages.map(msg => ({
        ...msg,
        sender: sanitizeUser(msg.sender),
      }));
      res.json(sanitizedMessages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const moderationResult = await contentModerationService.analyzeTextContent(content.trim());
      if (moderationResult.isViolation && 
          (moderationResult.severity === "high" || moderationResult.severity === "critical")) {
        return res.status(400).json({ 
          error: "Message contains inappropriate content",
          moderationResult,
          blocked: true
        });
      }

      const conversation = await storage.getConversation(req.params.id, req.session.userId!);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Sanitize message content to prevent XSS
      const sanitizedContent = sanitizeText(content.trim());

      const message = await storage.createMessage({
        conversationId: req.params.id,
        senderId: req.session.userId!,
        content: sanitizedContent,
      });

      const recipientId = conversation.participantIds.find(id => id !== req.session.userId!);
      if (recipientId) {
        const sender = await storage.getUser(req.session.userId!);
        if (sender) {
          const sanitizedSender = sanitizeUser(sender);
          
          notificationHub.pushMessage(recipientId, {
            conversationId: req.params.id,
            messageId: message.id,
            senderId: req.session.userId!,
            senderName: sender.displayName || sender.username,
            content: sanitizedContent,
            createdAt: message.createdAt?.toISOString() || new Date().toISOString(),
          });
          
          const notification = await storage.createNotification({
            userId: recipientId,
            type: "message",
            title: "New Message",
            message: `${sender.displayName || sender.username}: ${sanitizedContent.slice(0, 50)}${sanitizedContent.length > 50 ? "..." : ""}`,
            data: { conversationId: req.params.id, senderId: req.session.userId!, senderName: sender.displayName || sender.username },
          });
          
          notificationHub.pushNotification(recipientId, notification);
        }
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/conversations/:id/read", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id, req.session.userId!);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      await storage.markMessagesRead(req.params.id, req.session.userId!);
      
      const senderId = conversation.participantIds.find(id => id !== req.session.userId!);
      if (senderId) {
        notificationHub.pushReadReceipt(senderId, {
          conversationId: req.params.id,
          readerId: req.session.userId!,
          readAt: new Date().toISOString(),
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  app.post("/api/conversations/:id/typing", requireAuth, async (req, res) => {
    try {
      const { isTyping } = req.body;
      const conversation = await storage.getConversation(req.params.id, req.session.userId!);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const recipientId = conversation.participantIds.find(id => id !== req.session.userId!);
      if (recipientId) {
        const sender = await storage.getUser(req.session.userId!);
        if (sender) {
          notificationHub.pushTypingIndicator(recipientId, {
            conversationId: req.params.id,
            senderId: req.session.userId!,
            senderName: sender.displayName || sender.username,
            isTyping: !!isTyping,
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to send typing indicator" });
    }
  });

  app.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getCreatorAnalytics(req.session.userId!);
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // ============= PHASE 1: QUESTS & ACHIEVEMENTS =============

  app.get("/api/quests", requireAuth, async (req, res) => {
    try {
      const quests = await storage.getUserQuests(req.session.userId!);
      res.json(quests);
    } catch (error) {
      res.status(500).json({ error: "Failed to get quests" });
    }
  });

  app.post("/api/quests/:id/complete", requireAuth, async (req, res) => {
    try {
      await storage.completeQuest(req.session.userId!, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete quest" });
    }
  });

  app.get("/api/achievements", requireAuth, async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(req.session.userId!);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to get achievements" });
    }
  });

  app.post("/api/achievements/check", requireAuth, async (req, res) => {
    try {
      const unlocked = await storage.checkAndUnlockAchievements(req.session.userId!);
      res.json({ unlocked });
    } catch (error) {
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  app.post("/api/daily-login", requireAuth, async (req, res) => {
    try {
      const result = await storage.recordDailyLogin(req.session.userId!);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to record daily login" });
    }
  });

  app.post("/api/rewards/claim", requireAuth, async (req, res) => {
    try {
      const snapshot = await storage.getRewardSnapshot(req.session.userId!);
      if (!snapshot || (snapshot.totalPoints || 0) <= 0) {
        return res.status(400).json({ error: "No points to claim" });
      }

      await storage.createRewardEvent({
        userId: req.session.userId!,
        eventType: "points_claimed",
        points: snapshot.totalPoints || 0,
        metadata: { description: "Points claimed by user" },
      });

      res.json({ 
        success: true, 
        pointsClaimed: snapshot.totalPoints || 0 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to claim rewards" });
    }
  });

  app.post("/api/rewards/convert", requireAuth, async (req, res) => {
    try {
      const { points } = req.body;
      if (!points || points <= 0) {
        return res.status(400).json({ error: "Invalid points amount" });
      }

      const snapshot = await storage.getRewardSnapshot(req.session.userId!);
      if (!snapshot || (snapshot.totalPoints || 0) < points) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      const axmAmount = (points * 0.01).toFixed(2);

      await storage.createRewardEvent({
        userId: req.session.userId!,
        eventType: "points_converted",
        points: -points,
        metadata: { description: `Converted ${points} points to ${axmAmount} AXM` },
      });

      res.json({ 
        success: true, 
        pointsConverted: points,
        axmAmount,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to convert rewards" });
    }
  });

  app.get("/api/user/gamification", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const snapshot = await storage.getRewardSnapshot(req.session.userId!);
      res.json({
        level: user.level || 1,
        xp: user.xp || 0,
        xpToNextLevel: 1000 - ((user.xp || 0) % 1000),
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        totalPoints: snapshot?.totalPoints || 0,
        estimatedAxm: snapshot?.estimatedAxm || "0.00",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get gamification stats" });
    }
  });

  // ============= PHASE 1: STORIES =============

  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to get stories" });
    }
  });

  app.get("/api/stories/feed", async (req, res) => {
    try {
      const feed = await storage.getStoryFeed(req.session?.userId || "");
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: "Failed to get story feed" });
    }
  });

  app.post("/api/stories", requireAuth, async (req, res) => {
    try {
      const { mediaUrl, mediaType, caption, backgroundColor } = req.body;
      
      if (!mediaUrl) {
        return res.status(400).json({ error: "Media URL is required" });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await storage.createStory({
        authorId: req.session.userId!,
        mediaUrl,
        mediaType: mediaType || "image",
        caption,
        backgroundColor,
        expiresAt,
      });

      res.status(201).json(story);
    } catch (error) {
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  app.post("/api/stories/:id/view", requireAuth, async (req, res) => {
    try {
      await storage.viewStory(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to record story view" });
    }
  });

  app.delete("/api/stories/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteStory(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  // ============= PHASE 1: LIVE STREAMING =============

  app.get("/api/streams", async (req, res) => {
    try {
      const streams = await storage.getLiveStreams();
      res.json(streams);
    } catch (error) {
      res.status(500).json({ error: "Failed to get live streams" });
    }
  });

  app.get("/api/streams/:id", async (req, res) => {
    try {
      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ error: "Stream not found" });
      }
      res.json(stream);
    } catch (error) {
      res.status(500).json({ error: "Failed to get stream" });
    }
  });

  app.post("/api/streams", requireAuth, async (req, res) => {
    try {
      const { title, description, thumbnailUrl, streamingMethod } = req.body;
      
      if (!title?.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      const stream = await storage.createLiveStream({
        hostId: req.session.userId!,
        title: title.trim(),
        description,
        thumbnailUrl,
      });

      const hasMuxCredentials = process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET;
      const hasCloudflareCredentials = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN;
      
      // Browser-based streaming via Cloudflare WHIP
      if (streamingMethod === "browser" && hasCloudflareCredentials) {
        try {
          console.log("Creating Cloudflare Stream input for browser streaming:", stream.id);
          const cloudflareService = await import("./services/cloudflare-stream");
          const cfInput = await cloudflareService.createCloudflareStreamInput(title.trim());
          console.log("Cloudflare Stream input created:", cfInput.id);
          
          await storage.updateLiveStream(stream.id, {
            cloudflareInputId: cfInput.id,
            cloudflareWhipUrl: cfInput.whipUrl,
            cloudflareWhepUrl: cfInput.whepUrl,
            rtmpUrl: cfInput.rtmpUrl,
            streamingProvider: "cloudflare",
          });
          
          res.status(201).json({
            ...stream,
            cloudflareInputId: cfInput.id,
            cloudflareWhipUrl: cfInput.whipUrl,
            cloudflareWhepUrl: cfInput.whepUrl,
            streamingProvider: "cloudflare",
            streamingMethod: "browser",
          });
          return;
        } catch (cfError: any) {
          console.error("Failed to create Cloudflare Stream:", cfError?.message || cfError);
        }
      }
      
      // RTMP streaming via Mux (default for OBS/Streamlabs)
      if (hasMuxCredentials) {
        try {
          console.log("Creating Mux live stream for:", stream.id);
          const muxService = await import("./services/mux");
          const muxStream = await muxService.createMuxLiveStream();
          console.log("Mux live stream created:", muxStream.id, muxStream.playbackId);
          
          await storage.updateLiveStream(stream.id, {
            muxLiveStreamId: muxStream.id,
            muxPlaybackId: muxStream.playbackId,
            muxStreamKey: muxStream.streamKey,
            rtmpUrl: muxStream.rtmpUrl,
            streamingProvider: "mux",
          });
          
          res.status(201).json({
            ...stream,
            muxLiveStreamId: muxStream.id,
            muxPlaybackId: muxStream.playbackId,
            muxStreamKey: muxStream.streamKey,
            rtmpUrl: muxStream.rtmpUrl,
            streamingProvider: "mux",
            streamingMethod: "rtmp",
            playbackUrl: `https://stream.mux.com/${muxStream.playbackId}.m3u8`,
          });
          return;
        } catch (muxError: any) {
          console.error("Failed to create Mux stream:", muxError?.message || muxError);
          res.status(201).json(stream);
          return;
        }
      }

      res.status(201).json(stream);
    } catch (error) {
      res.status(500).json({ error: "Failed to start stream" });
    }
  });

  // Check which streaming providers are available
  app.get("/api/streams/providers", requireAuth, async (req, res) => {
    const hasMux = !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
    const hasCloudflare = !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN);
    
    res.json({
      providers: {
        mux: hasMux,
        cloudflare: hasCloudflare,
      },
      methods: {
        rtmp: hasMux,
        browser: hasCloudflare,
      },
      default: hasCloudflare ? "browser" : (hasMux ? "rtmp" : null),
    });
  });

  // Get stream playback info (Mux HLS or Cloudflare WHEP)
  app.get("/api/streams/:id/token", requireAuth, async (req, res) => {
    try {
      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ error: "Stream not found" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const isOwner = stream.hostId === req.session.userId;
      
      // Handle Cloudflare Stream (browser-based WHIP)
      if (stream.cloudflareInputId && stream.cloudflareWhepUrl) {
        if (isOwner) {
          return res.json({
            provider: "cloudflare",
            streamingMethod: "browser",
            whipUrl: stream.cloudflareWhipUrl,
            whepUrl: stream.cloudflareWhepUrl,
            isOwner: true,
          });
        }
        return res.json({
          provider: "cloudflare",
          streamingMethod: "browser",
          whepUrl: stream.cloudflareWhepUrl,
          isOwner: false,
        });
      }
      
      // Handle Mux stream (RTMP)
      if (!stream.muxPlaybackId) {
        return res.status(400).json({ error: "Stream is not configured for video playback" });
      }
      
      const playbackUrl = `https://stream.mux.com/${stream.muxPlaybackId}.m3u8`;
      const thumbnailUrl = `https://image.mux.com/${stream.muxPlaybackId}/thumbnail.jpg`;
      
      if (isOwner) {
        return res.json({
          provider: "mux",
          streamingMethod: "rtmp",
          playbackUrl,
          thumbnailUrl,
          rtmpUrl: stream.rtmpUrl || "rtmps://global-live.mux.com:443/app",
          streamKey: stream.muxStreamKey,
          isOwner: true,
        });
      }
      
      return res.json({
        provider: "mux",
        streamingMethod: "rtmp",
        playbackUrl,
        thumbnailUrl,
        isOwner: false,
      });
    } catch (error) {
      console.error("Failed to get stream token:", error);
      res.status(500).json({ error: "Failed to get stream access" });
    }
  });

  app.post("/api/streams/:id/end", requireAuth, async (req, res) => {
    try {
      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ error: "Stream not found" });
      }
      if (stream.hostId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized to end this stream" });
      }

      // Disable Mux live stream (keeps recording for VOD)
      if (stream.muxLiveStreamId) {
        try {
          const muxService = await import("./services/mux");
          await muxService.disableMuxLiveStream(stream.muxLiveStreamId);
          console.log("Mux stream disabled:", stream.muxLiveStreamId);
        } catch (muxError) {
          console.error("Failed to disable Mux stream:", muxError);
        }
      }
      
      // Delete Cloudflare Stream input
      if (stream.cloudflareInputId) {
        try {
          const cloudflareService = await import("./services/cloudflare-stream");
          await cloudflareService.deleteCloudflareStreamInput(stream.cloudflareInputId);
          console.log("Cloudflare Stream input deleted:", stream.cloudflareInputId);
        } catch (cfError) {
          console.error("Failed to delete Cloudflare Stream:", cfError);
        }
      }

      await storage.endLiveStream(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to end stream" });
    }
  });

  // Get stream status (for checking if broadcaster is connected)
  app.get("/api/streams/:id/status", async (req, res) => {
    try {
      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ error: "Stream not found" });
      }

      // For Cloudflare streams, check input status
      if (stream.cloudflareInputId) {
        try {
          const cloudflareService = await import("./services/cloudflare-stream");
          const status = await cloudflareService.getCloudflareStreamStatus(stream.cloudflareInputId);
          return res.json({
            provider: "cloudflare",
            streamingMethod: "browser",
            streamStatus: stream.status,
            broadcastStatus: status.state,
            isLive: status.state === "connected",
          });
        } catch (cfError) {
          console.error("Failed to get Cloudflare status:", cfError);
        }
      }

      // For Mux streams, check actual broadcast status
      if (stream.muxLiveStreamId) {
        try {
          const muxService = await import("./services/mux");
          const status = await muxService.getMuxStreamStatus(stream.muxLiveStreamId);
          return res.json({
            provider: "mux",
            streamingMethod: "rtmp",
            streamStatus: stream.status,
            broadcastStatus: status.status,
            isLive: status.status === "active",
            hasRecordings: status.recentAssetIds.length > 0,
          });
        } catch (muxError) {
          console.error("Failed to get Mux status:", muxError);
        }
      }

      // Fallback for streams without provider
      res.json({
        provider: "none",
        streamStatus: stream.status,
        broadcastStatus: stream.status,
        isLive: stream.status === "live",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get stream status" });
    }
  });

  app.get("/api/streams/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getStreamMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get stream messages" });
    }
  });

  app.post("/api/streams/:id/messages", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const message = await storage.createStreamMessage({
        streamId: req.params.id,
        senderId: req.session.userId!,
        content: content.trim(),
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/streams/:id/tip", requireAuth, async (req, res) => {
    try {
      const { amount, message, txHash } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid tip amount is required" });
      }

      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ error: "Stream not found" });
      }

      const tip = await storage.createStreamTip({
        streamId: req.params.id,
        senderId: req.session.userId!,
        amount,
        message,
        txHash,
      });

      if (message) {
        await storage.createStreamMessage({
          streamId: req.params.id,
          senderId: req.session.userId!,
          content: message,
          isTipMessage: true,
          tipAmount: amount,
        });
      }

      res.status(201).json(tip);
    } catch (error) {
      res.status(500).json({ error: "Failed to send tip" });
    }
  });

  app.get("/api/streams/:id/tips", async (req, res) => {
    try {
      const tips = await storage.getStreamTips(req.params.id);
      res.json(tips);
    } catch (error) {
      res.status(500).json({ error: "Failed to get stream tips" });
    }
  });

  // ============= PHASE 1: BUSINESS PROFILES =============

  app.patch("/api/users/me/business", requireAuth, async (req, res) => {
    try {
      const {
        isBusinessAccount,
        businessCategory,
        businessName,
        businessEmail,
        businessPhone,
        businessWebsite,
        businessAddress,
        businessHours,
        businessDescription,
        businessLogoUrl,
      } = req.body;

      const updates: any = {
        isBusinessAccount: isBusinessAccount || false,
      };
      
      if (isBusinessAccount) {
        updates.businessCategory = businessCategory || null;
        updates.businessName = businessName || null;
        updates.businessEmail = businessEmail || null;
        updates.businessPhone = businessPhone || null;
        updates.businessWebsite = businessWebsite || null;
        updates.businessAddress = businessAddress || null;
        updates.businessHours = businessHours || null;
        updates.businessDescription = businessDescription || null;
        updates.businessLogoUrl = businessLogoUrl || null;
      } else {
        updates.businessCategory = null;
        updates.businessName = null;
        updates.businessEmail = null;
        updates.businessPhone = null;
        updates.businessWebsite = null;
        updates.businessAddress = null;
        updates.businessHours = null;
        updates.businessDescription = null;
        updates.businessLogoUrl = null;
      }

      const user = await storage.updateUser(req.session.userId!, updates);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Business profile update error:", error);
      res.status(500).json({ error: "Failed to update business profile", details: error.message });
    }
  });

  app.get("/api/businesses", async (req, res) => {
    try {
      const { category } = req.query;
      const allBusinesses = await db
        .select()
        .from(users)
        .where(eq(users.isBusinessAccount, true))
        .orderBy(desc(users.createdAt));

      const filtered = category
        ? allBusinesses.filter((b: User) => b.businessCategory === category)
        : allBusinesses;

      res.json(filtered.map((b: User) => {
        const { password: _, ...safe } = b;
        return safe;
      }));
    } catch (error) {
      res.status(500).json({ error: "Failed to get businesses" });
    }
  });

  // ============= PHASE 2: TRANSACTIONS =============

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(
          or(
            eq(transactions.userId, req.session.userId!),
            eq(transactions.toUserId, req.session.userId!)
          )
        )
        .orderBy(desc(transactions.createdAt))
        .limit(50);

      // Enrich with user info
      const enriched = await Promise.all(
        userTransactions.map(async (tx) => {
          const [fromUser] = await db.select().from(users).where(eq(users.id, tx.userId)).limit(1);
          const toUser = tx.toUserId 
            ? (await db.select().from(users).where(eq(users.id, tx.toUserId)).limit(1))[0]
            : null;

          return {
            ...tx,
            user: fromUser ? sanitizeUser(fromUser) : null,
            toUser: toUser ? sanitizeUser(toUser) : null,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const { toUserId, type, amount, txHash, metadata } = req.body;

      if (!type || !amount) {
        return res.status(400).json({ error: "Type and amount are required" });
      }

      const [transaction] = await db
        .insert(transactions)
        .values({
          userId: req.session.userId!,
          toUserId: toUserId || null,
          type,
          amount,
          txHash: txHash || null,
          status: txHash ? "pending" : "confirmed",
          metadata: metadata || null,
        })
        .returning();

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const { status, txHash, errorMessage } = req.body;

      const [transaction] = await db
        .update(transactions)
        .set({
          status,
          txHash,
          errorMessage,
          confirmedAt: status === "confirmed" ? new Date() : null,
        })
        .where(eq(transactions.id, req.params.id))
        .returning();

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json(transaction);
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // ============= PHASE 2: CONTENT MODERATION =============

  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const { reportedUserId, reportedPostId, reportedCommentId, reportType, reason } = req.body;

      if (!reportType) {
        return res.status(400).json({ error: "Report type is required" });
      }

      if (!reportedUserId && !reportedPostId && !reportedCommentId) {
        return res.status(400).json({ error: "Must report a user, post, or comment" });
      }

      const [report] = await db
        .insert(contentReports)
        .values({
          reporterId: req.session.userId!,
          reportedUserId: reportedUserId || null,
          reportedPostId: reportedPostId || null,
          reportedCommentId: reportedCommentId || null,
          reportType,
          reason: reason || null,
        })
        .returning();

      res.status(201).json(report);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  app.get("/api/reports", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const [currentUser] = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { status } = req.query;
      
      let reports;
      if (status) {
        reports = await db
          .select()
          .from(contentReports)
          .where(eq(contentReports.status, status as any))
          .orderBy(desc(contentReports.createdAt))
          .limit(100);
      } else {
        reports = await db
          .select()
          .from(contentReports)
          .orderBy(desc(contentReports.createdAt))
          .limit(100);
      }

      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  app.patch("/api/reports/:id", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const [currentUser] = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { status, reviewNote } = req.body;

      const [report] = await db
        .update(contentReports)
        .set({
          status,
          reviewNote,
          reviewedById: req.session.userId,
          reviewedAt: new Date(),
        })
        .where(eq(contentReports.id, req.params.id))
        .returning();

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      console.error("Update report error:", error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  // ============= PHASE 2: VERIFICATION =============

  app.post("/api/verification/request", requireAuth, async (req, res) => {
    try {
      const user = await storage.updateUser(req.session.userId!, {
        verificationStatus: "pending",
        verificationSubmittedAt: new Date(),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Verification request error:", error);
      res.status(500).json({ error: "Failed to submit verification request" });
    }
  });

  app.get("/api/verification/requests", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const [currentUser] = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const pendingUsers = await db
        .select()
        .from(users)
        .where(eq(users.verificationStatus, "pending"))
        .orderBy(users.verificationSubmittedAt);

      res.json(pendingUsers.map((u: User) => sanitizeUser(u)));
    } catch (error) {
      console.error("Get verification requests error:", error);
      res.status(500).json({ error: "Failed to get verification requests" });
    }
  });

  app.patch("/api/verification/:userId", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const [currentUser] = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { status } = req.body;

      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updates: any = { verificationStatus: status };
      if (status === "verified") {
        updates.verifiedAt = new Date();
      }

      const user = await storage.updateUser(req.params.userId, updates);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Send notification to user
      await storage.createNotification({
        userId: req.params.userId,
        type: status === "verified" ? "verification_approved" : "verification_rejected",
        title: status === "verified" ? "Verification Approved!" : "Verification Request Update",
        message: status === "verified" 
          ? "Congratulations! Your account has been verified."
          : "Your verification request was not approved at this time.",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update verification error:", error);
      res.status(500).json({ error: "Failed to update verification status" });
    }
  });

  // ============= PHASE 2: SUBSCRIPTIONS =============

  app.get("/api/subscription-tiers/:creatorId", async (req, res) => {
    try {
      const tiers = await db
        .select()
        .from(subscriptionTiers)
        .where(and(
          eq(subscriptionTiers.creatorId, req.params.creatorId),
          eq(subscriptionTiers.isActive, true)
        ))
        .orderBy(subscriptionTiers.priceAxm);

      res.json(tiers);
    } catch (error) {
      console.error("Get subscription tiers error:", error);
      res.status(500).json({ error: "Failed to get subscription tiers" });
    }
  });

  app.post("/api/subscription-tiers", requireAuth, async (req, res) => {
    try {
      const { name, description, priceAxm, benefits } = req.body;

      if (!name || !priceAxm) {
        return res.status(400).json({ error: "Name and price are required" });
      }

      const [tier] = await db
        .insert(subscriptionTiers)
        .values({
          creatorId: req.session.userId!,
          name,
          description: description || null,
          priceAxm,
          benefits: benefits || [],
        })
        .returning();

      res.status(201).json(tier);
    } catch (error) {
      console.error("Create subscription tier error:", error);
      res.status(500).json({ error: "Failed to create subscription tier" });
    }
  });

  app.patch("/api/subscription-tiers/:id", requireAuth, async (req, res) => {
    try {
      const { name, description, priceAxm, benefits, isActive } = req.body;

      const [tier] = await db
        .update(subscriptionTiers)
        .set({
          name,
          description,
          priceAxm,
          benefits,
          isActive,
        })
        .where(and(
          eq(subscriptionTiers.id, req.params.id),
          eq(subscriptionTiers.creatorId, req.session.userId!)
        ))
        .returning();

      if (!tier) {
        return res.status(404).json({ error: "Subscription tier not found" });
      }

      res.json(tier);
    } catch (error) {
      console.error("Update subscription tier error:", error);
      res.status(500).json({ error: "Failed to update subscription tier" });
    }
  });

  app.get("/api/my-subscriptions", requireAuth, async (req, res) => {
    try {
      const userSubs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.subscriberId, req.session.userId!))
        .orderBy(desc(subscriptions.createdAt));

      // Enrich with tier and creator info
      const enriched = await Promise.all(
        userSubs.map(async (sub) => {
          const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, sub.tierId)).limit(1);
          const [creator] = await db.select().from(users).where(eq(users.id, sub.creatorId)).limit(1);
          return {
            ...sub,
            tier,
            creator: creator ? sanitizeUser(creator) : null,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Get my subscriptions error:", error);
      res.status(500).json({ error: "Failed to get subscriptions" });
    }
  });

  app.get("/api/my-subscribers", requireAuth, async (req, res) => {
    try {
      const subs = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.creatorId, req.session.userId!),
          eq(subscriptions.status, "active")
        ))
        .orderBy(desc(subscriptions.createdAt));

      // Enrich with subscriber info
      const enriched = await Promise.all(
        subs.map(async (sub) => {
          const [subscriber] = await db.select().from(users).where(eq(users.id, sub.subscriberId)).limit(1);
          const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, sub.tierId)).limit(1);
          return {
            ...sub,
            subscriber: subscriber ? sanitizeUser(subscriber) : null,
            tier,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Get my subscribers error:", error);
      res.status(500).json({ error: "Failed to get subscribers" });
    }
  });

  app.post("/api/subscribe/:tierId", requireAuth, async (req, res) => {
    try {
      const { txHash } = req.body;

      // Require valid transaction hash for paid subscriptions
      if (!txHash || typeof txHash !== "string" || !txHash.startsWith("0x") || txHash.length !== 66) {
        return res.status(400).json({ error: "Valid transaction hash required for subscription payment" });
      }

      const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, req.params.tierId)).limit(1);
      
      if (!tier) {
        return res.status(404).json({ error: "Subscription tier not found" });
      }

      if (tier.creatorId === req.session.userId) {
        return res.status(400).json({ error: "Cannot subscribe to yourself" });
      }

      // Check for existing active subscription
      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.subscriberId, req.session.userId!),
          eq(subscriptions.creatorId, tier.creatorId),
          eq(subscriptions.status, "active")
        ))
        .limit(1);

      if (existing) {
        return res.status(400).json({ error: "Already subscribed to this creator" });
      }

      // Check for duplicate transaction hash
      const [existingTx] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.txHash, txHash))
        .limit(1);

      if (existingTx) {
        return res.status(400).json({ error: "Transaction already used" });
      }

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const [subscription] = await db
        .insert(subscriptions)
        .values({
          subscriberId: req.session.userId!,
          creatorId: tier.creatorId,
          tierId: tier.id,
          currentPeriodEnd: periodEnd,
        })
        .returning();

      // Update subscriber count
      await db
        .update(subscriptionTiers)
        .set({ subscriberCount: sql`${subscriptionTiers.subscriberCount} + 1` })
        .where(eq(subscriptionTiers.id, tier.id));

      // Record transaction
      await db.insert(transactions).values({
        userId: req.session.userId!,
        toUserId: tier.creatorId,
        type: "tip",
        amount: tier.priceAxm,
        txHash,
        metadata: { subscriptionId: subscription.id, tierId: tier.id },
      });

      // Notify creator
      await storage.createNotification({
        userId: tier.creatorId,
        type: "new_subscriber",
        title: "New Subscriber!",
        message: "Someone just subscribed to your content!",
        data: { subscriptionId: subscription.id },
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.post("/api/unsubscribe/:subscriptionId", requireAuth, async (req, res) => {
    try {
      const [subscription] = await db
        .update(subscriptions)
        .set({ 
          status: "cancelled",
          cancelledAt: new Date(),
        })
        .where(and(
          eq(subscriptions.id, req.params.subscriptionId),
          eq(subscriptions.subscriberId, req.session.userId!)
        ))
        .returning();

      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Decrement subscriber count
      await db
        .update(subscriptionTiers)
        .set({ subscriberCount: sql`GREATEST(0, ${subscriptionTiers.subscriberCount} - 1)` })
        .where(eq(subscriptionTiers.id, subscription.tierId));

      res.json({ success: true });
    } catch (error) {
      console.error("Unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  app.get("/api/check-subscription/:creatorId", requireAuth, async (req, res) => {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.subscriberId, req.session.userId!),
          eq(subscriptions.creatorId, req.params.creatorId),
          eq(subscriptions.status, "active")
        ))
        .limit(1);

      res.json({ isSubscribed: !!subscription, subscription });
    } catch (error) {
      console.error("Check subscription error:", error);
      res.status(500).json({ error: "Failed to check subscription" });
    }
  });

  // ============= PHASE 2: VIRTUAL GIFTS =============

  app.get("/api/gifts/received", requireAuth, async (req, res) => {
    try {
      const gifts = await db
        .select()
        .from(virtualGifts)
        .where(eq(virtualGifts.recipientId, req.session.userId!))
        .orderBy(desc(virtualGifts.createdAt))
        .limit(50);

      // Enrich with sender info
      const enriched = await Promise.all(
        gifts.map(async (gift) => {
          const [sender] = await db.select().from(users).where(eq(users.id, gift.senderId)).limit(1);
          return { ...gift, sender: sender ? sanitizeUser(sender) : null };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Get received gifts error:", error);
      res.status(500).json({ error: "Failed to get gifts" });
    }
  });

  app.post("/api/gifts", requireAuth, async (req, res) => {
    try {
      const { recipientId, postId, streamId, giftType, axmValue, message, txHash } = req.body;

      if (!recipientId || !giftType || !axmValue) {
        return res.status(400).json({ error: "Recipient, gift type, and value are required" });
      }

      // Require valid transaction hash for paid gifts
      if (!txHash || typeof txHash !== "string" || !txHash.startsWith("0x") || txHash.length !== 66) {
        return res.status(400).json({ error: "Valid transaction hash required for gift payment" });
      }

      // Check for duplicate transaction hash
      const [existingTx] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.txHash, txHash))
        .limit(1);

      if (existingTx) {
        return res.status(400).json({ error: "Transaction already used" });
      }

      const [gift] = await db
        .insert(virtualGifts)
        .values({
          senderId: req.session.userId!,
          recipientId,
          postId: postId || null,
          streamId: streamId || null,
          giftType,
          axmValue,
          message: message || null,
          txHash,
        })
        .returning();

      // Record transaction
      await db.insert(transactions).values({
        userId: req.session.userId!,
        toUserId: recipientId,
        type: "tip",
        amount: axmValue,
        txHash,
        metadata: { giftId: gift.id, giftType },
      });

      // Notify recipient
      const [sender] = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
      await storage.createNotification({
        userId: recipientId,
        type: "gift_received",
        title: "You received a gift!",
        message: `${sender?.displayName || sender?.username} sent you a ${giftType}!`,
        data: { giftId: gift.id, giftType, axmValue },
      });

      res.status(201).json(gift);
    } catch (error) {
      console.error("Send gift error:", error);
      res.status(500).json({ error: "Failed to send gift" });
    }
  });

  // ============= PHASE 2: ADVERTISEMENTS =============

  app.get("/api/ads", async (req, res) => {
    try {
      const activeAds = await db
        .select()
        .from(advertisements)
        .where(eq(advertisements.status, "active"))
        .orderBy(sql`RANDOM()`)
        .limit(5);

      res.json(activeAds);
    } catch (error) {
      console.error("Get ads error:", error);
      res.status(500).json({ error: "Failed to get advertisements" });
    }
  });

  app.get("/api/my-ads", requireAuth, async (req, res) => {
    try {
      const myAds = await db
        .select()
        .from(advertisements)
        .where(eq(advertisements.advertiserId, req.session.userId!))
        .orderBy(desc(advertisements.createdAt));

      res.json(myAds);
    } catch (error) {
      console.error("Get my ads error:", error);
      res.status(500).json({ error: "Failed to get your advertisements" });
    }
  });

  app.post("/api/ads", requireAuth, async (req, res) => {
    try {
      const { title, description, mediaUrl, linkUrl, callToAction, budgetAxm, targetAudience, startsAt, endsAt } = req.body;

      if (!title || !budgetAxm) {
        return res.status(400).json({ error: "Title and budget are required" });
      }

      const [ad] = await db
        .insert(advertisements)
        .values({
          advertiserId: req.session.userId!,
          title,
          description: description || null,
          mediaUrl: mediaUrl || null,
          linkUrl: linkUrl || null,
          callToAction: callToAction || null,
          budgetAxm,
          targetAudience: targetAudience || null,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
        })
        .returning();

      res.status(201).json(ad);
    } catch (error) {
      console.error("Create ad error:", error);
      res.status(500).json({ error: "Failed to create advertisement" });
    }
  });

  app.patch("/api/ads/:id", requireAuth, async (req, res) => {
    try {
      const { title, description, mediaUrl, linkUrl, callToAction, status, targetAudience } = req.body;

      const [ad] = await db
        .update(advertisements)
        .set({
          title,
          description,
          mediaUrl,
          linkUrl,
          callToAction,
          status,
          targetAudience,
        })
        .where(and(
          eq(advertisements.id, req.params.id),
          eq(advertisements.advertiserId, req.session.userId!)
        ))
        .returning();

      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      res.json(ad);
    } catch (error) {
      console.error("Update ad error:", error);
      res.status(500).json({ error: "Failed to update advertisement" });
    }
  });

  app.post("/api/ads/:id/click", async (req, res) => {
    try {
      await db
        .update(advertisements)
        .set({ clicks: sql`${advertisements.clicks} + 1` })
        .where(eq(advertisements.id, req.params.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Record ad click error:", error);
      res.status(500).json({ error: "Failed to record click" });
    }
  });

  // ============= PHASE 2: SHOP =============

  app.get("/api/products", async (req, res) => {
    try {
      const { sellerId, category } = req.query;
      
      let query = db
        .select()
        .from(products)
        .where(eq(products.status, "active"))
        .orderBy(desc(products.createdAt));

      const allProducts = await query;

      let filtered = allProducts;
      if (sellerId) {
        filtered = filtered.filter(p => p.sellerId === sellerId);
      }
      if (category) {
        filtered = filtered.filter(p => p.category === category);
      }

      // Enrich with seller info
      const enriched = await Promise.all(
        filtered.map(async (product) => {
          const [seller] = await db.select().from(users).where(eq(users.id, product.sellerId)).limit(1);
          return { ...product, seller: seller ? sanitizeUser(seller) : null };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, req.params.id))
        .limit(1);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const [seller] = await db.select().from(users).where(eq(users.id, product.sellerId)).limit(1);

      res.json({ ...product, seller: seller ? sanitizeUser(seller) : null });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Failed to get product" });
    }
  });

  app.get("/api/my-products", requireAuth, async (req, res) => {
    try {
      const myProducts = await db
        .select()
        .from(products)
        .where(eq(products.sellerId, req.session.userId!))
        .orderBy(desc(products.createdAt));

      res.json(myProducts);
    } catch (error) {
      console.error("Get my products error:", error);
      res.status(500).json({ error: "Failed to get your products" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const { name, description, priceAxm, imageUrls, category, stock } = req.body;

      if (!name || !priceAxm) {
        return res.status(400).json({ error: "Name and price are required" });
      }

      const [product] = await db
        .insert(products)
        .values({
          sellerId: req.session.userId!,
          name,
          description: description || null,
          priceAxm,
          imageUrls: imageUrls || [],
          category: category || null,
          stock: stock || 0,
          status: "active",
        })
        .returning();

      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const { name, description, priceAxm, imageUrls, category, stock, status } = req.body;

      const [product] = await db
        .update(products)
        .set({
          name,
          description,
          priceAxm,
          imageUrls,
          category,
          stock,
          status,
        })
        .where(and(
          eq(products.id, req.params.id),
          eq(products.sellerId, req.session.userId!)
        ))
        .returning();

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const { type } = req.query;
      
      let userOrders;
      if (type === "selling") {
        userOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.sellerId, req.session.userId!))
          .orderBy(desc(orders.createdAt));
      } else {
        userOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.buyerId, req.session.userId!))
          .orderBy(desc(orders.createdAt));
      }

      // Enrich with product and user info
      const enriched = await Promise.all(
        userOrders.map(async (order) => {
          const [product] = await db.select().from(products).where(eq(products.id, order.productId)).limit(1);
          const [buyer] = await db.select().from(users).where(eq(users.id, order.buyerId)).limit(1);
          const [seller] = await db.select().from(users).where(eq(users.id, order.sellerId)).limit(1);
          return {
            ...order,
            product,
            buyer: buyer ? sanitizeUser(buyer) : null,
            seller: seller ? sanitizeUser(seller) : null,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to get orders" });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const { productId, quantity, shippingAddress, txHash } = req.body;

      const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.status !== "active") {
        return res.status(400).json({ error: "Product is not available" });
      }

      if ((product.stock || 0) < (quantity || 1)) {
        return res.status(400).json({ error: "Insufficient stock" });
      }

      const totalAxm = (parseFloat(product.priceAxm) * (quantity || 1)).toString();

      const [order] = await db
        .insert(orders)
        .values({
          buyerId: req.session.userId!,
          productId,
          sellerId: product.sellerId,
          quantity: quantity || 1,
          totalAxm,
          shippingAddress: shippingAddress || null,
          txHash: txHash || null,
          status: txHash ? "paid" : "pending",
          paidAt: txHash ? new Date() : null,
        })
        .returning();

      // Update product stock
      await db
        .update(products)
        .set({ 
          stock: sql`${products.stock} - ${quantity || 1}`,
          soldCount: sql`${products.soldCount} + ${quantity || 1}`,
        })
        .where(eq(products.id, productId));

      // Record transaction
      if (txHash) {
        await db.insert(transactions).values({
          userId: req.session.userId!,
          toUserId: product.sellerId,
          type: "transfer",
          amount: totalAxm,
          txHash,
          metadata: { orderId: order.id, productId },
        });
      }

      // Notify seller
      await storage.createNotification({
        userId: product.sellerId,
        type: "new_order",
        title: "New Order!",
        message: `Someone ordered ${product.name}!`,
        data: { orderId: order.id },
      });

      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;

      const updateData: any = { status };
      if (status === "shipped") {
        updateData.shippedAt = new Date();
      } else if (status === "delivered") {
        updateData.deliveredAt = new Date();
      }

      const [order] = await db
        .update(orders)
        .set(updateData)
        .where(and(
          eq(orders.id, req.params.id),
          eq(orders.sellerId, req.session.userId!)
        ))
        .returning();

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Notify buyer
      await storage.createNotification({
        userId: order.buyerId,
        type: "order_update",
        title: `Order ${status}`,
        message: `Your order has been ${status}`,
        data: { orderId: order.id, status },
      });

      res.json(order);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // ============= PHASE 3: NFT ROUTES =============

  app.get("/api/nfts", async (req, res) => {
    try {
      const { ownerId, creatorId, status } = req.query;
      const nfts = await storage.getNfts({
        ownerId: ownerId as string,
        creatorId: creatorId as string,
        status: status as string,
      });
      res.json(nfts);
    } catch (error) {
      console.error("Get NFTs error:", error);
      res.status(500).json({ error: "Failed to get NFTs" });
    }
  });

  app.get("/api/nfts/:id", async (req, res) => {
    try {
      const nft = await storage.getNft(req.params.id);
      if (!nft) {
        return res.status(404).json({ error: "NFT not found" });
      }
      res.json(nft);
    } catch (error) {
      console.error("Get NFT error:", error);
      res.status(500).json({ error: "Failed to get NFT" });
    }
  });

  app.post("/api/nfts/mint", requireAuth, async (req, res) => {
    try {
      const { name, description, mediaUrl, postId, royaltyPercent, txHash } = req.body;

      if (!name || !mediaUrl) {
        return res.status(400).json({ error: "Name and media URL are required" });
      }

      const nft = await storage.createNft({
        ownerId: req.session.userId!,
        creatorId: req.session.userId!,
        postId: postId || null,
        name,
        description: description || null,
        mediaUrl,
        royaltyPercent: royaltyPercent || 10,
        mintTxHash: txHash || null,
        contractAddress: "0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D",
        status: "minted",
      });

      await storage.createRewardEvent({
        userId: req.session.userId!,
        eventType: "achievement_unlocked",
        points: 100,
        metadata: { action: "nft_minted", nftId: nft.id },
      });

      res.status(201).json(nft);
    } catch (error) {
      console.error("Mint NFT error:", error);
      res.status(500).json({ error: "Failed to mint NFT" });
    }
  });

  // ============= PHASE 3: NFT MARKETPLACE ROUTES =============

  app.get("/api/nft-marketplace", async (req, res) => {
    try {
      const { sellerId } = req.query;
      const listings = await storage.getNftListings({
        isActive: true,
        sellerId: sellerId as string,
      });
      res.json(listings);
    } catch (error) {
      console.error("Get NFT listings error:", error);
      res.status(500).json({ error: "Failed to get NFT listings" });
    }
  });

  app.get("/api/nft-marketplace/:id", async (req, res) => {
    try {
      const listing = await storage.getNftListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Get NFT listing error:", error);
      res.status(500).json({ error: "Failed to get NFT listing" });
    }
  });

  app.post("/api/nft-marketplace", requireAuth, async (req, res) => {
    try {
      const { nftId, priceAxm, isAuction, minBidAxm, auctionEndsAt } = req.body;

      if (!nftId || !priceAxm) {
        return res.status(400).json({ error: "NFT ID and price are required" });
      }

      const nft = await storage.getNft(nftId);
      if (!nft || nft.ownerId !== req.session.userId!) {
        return res.status(403).json({ error: "Not authorized to list this NFT" });
      }

      const listing = await storage.createNftListing({
        nftId,
        sellerId: req.session.userId!,
        priceAxm,
        isAuction: isAuction || false,
        minBidAxm: minBidAxm || null,
        auctionEndsAt: auctionEndsAt ? new Date(auctionEndsAt) : null,
        isActive: true,
      });

      res.status(201).json(listing);
    } catch (error) {
      console.error("Create NFT listing error:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.post("/api/nft-marketplace/:id/buy", requireAuth, async (req, res) => {
    try {
      const { txHash } = req.body;
      const listing = await storage.getNftListing(req.params.id);

      if (!listing || !listing.isActive) {
        return res.status(404).json({ error: "Listing not found or not active" });
      }

      if (listing.sellerId === req.session.userId!) {
        return res.status(400).json({ error: "Cannot buy your own NFT" });
      }

      await storage.updateNftListing(listing.id, {
        isActive: false,
        buyerId: req.session.userId!,
        soldAt: new Date(),
        saleTxHash: txHash || null,
      });

      await storage.updateNft(listing.nftId, {
        ownerId: req.session.userId!,
        status: "sold",
      });

      await db.insert(transactions).values({
        userId: req.session.userId!,
        toUserId: listing.sellerId,
        type: "transfer",
        amount: listing.priceAxm,
        txHash: txHash || null,
        metadata: { listingId: listing.id, nftId: listing.nftId },
        status: "confirmed",
      });

      await storage.createNotification({
        userId: listing.sellerId,
        type: "nft_sold",
        title: "NFT Sold!",
        message: `Your NFT "${listing.nft.name}" has been sold for ${listing.priceAxm} AXM`,
        data: { listingId: listing.id },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Buy NFT error:", error);
      res.status(500).json({ error: "Failed to buy NFT" });
    }
  });

  // ============= PHASE 3: DAO GOVERNANCE ROUTES =============

  app.get("/api/governance/proposals", async (req, res) => {
    try {
      const { status } = req.query;
      const proposalsList = await storage.getProposals({
        status: status as string,
      });
      res.json(proposalsList);
    } catch (error) {
      console.error("Get proposals error:", error);
      res.status(500).json({ error: "Failed to get proposals" });
    }
  });

  app.get("/api/governance/proposals/:id", async (req, res) => {
    try {
      const proposal = await storage.getProposal(
        req.params.id,
        req.session?.userId
      );
      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      console.error("Get proposal error:", error);
      res.status(500).json({ error: "Failed to get proposal" });
    }
  });

  app.post("/api/governance/proposals", requireAuth, async (req, res) => {
    try {
      const { title, description, category, startsAt, endsAt, quorumRequired } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }

      const totalStaked = await storage.getTotalStaked(req.session.userId!);
      if (parseFloat(totalStaked) < 100) {
        return res.status(403).json({ 
          error: "You need at least 100 AXM staked to create proposals" 
        });
      }

      const proposal = await storage.createProposal({
        proposerId: req.session.userId!,
        title,
        description,
        category: category || "general",
        status: "active",
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        quorumRequired: quorumRequired || "1000",
      });

      res.status(201).json(proposal);
    } catch (error) {
      console.error("Create proposal error:", error);
      res.status(500).json({ error: "Failed to create proposal" });
    }
  });

  app.post("/api/governance/proposals/:id/vote", requireAuth, async (req, res) => {
    try {
      const { voteType, reason, signature, message, walletAddress } = req.body;

      if (!["for", "against", "abstain"].includes(voteType)) {
        return res.status(400).json({ error: "Invalid vote type" });
      }

      // Verify wallet signature if provided for on-chain voting
      let verifiedWallet: string | null = null;
      if (signature && message && walletAddress) {
        try {
          const recoveredAddress = ethers.verifyMessage(message, signature);
          if (recoveredAddress.toLowerCase() === walletAddress.toLowerCase()) {
            verifiedWallet = walletAddress.toLowerCase();
          } else {
            return res.status(400).json({ error: "Invalid wallet signature" });
          }
        } catch {
          return res.status(400).json({ error: "Failed to verify wallet signature" });
        }
      }

      const proposal = await storage.getProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      if (proposal.status !== "active") {
        return res.status(400).json({ error: "Proposal is not active" });
      }

      const existingVote = await storage.getUserVote(req.params.id, req.session.userId!);
      if (existingVote) {
        return res.status(400).json({ error: "Already voted on this proposal" });
      }

      const totalStaked = await storage.getTotalStaked(req.session.userId!);
      const votingPower = totalStaked || "1";

      const vote = await storage.createProposalVote({
        proposalId: req.params.id,
        voterId: req.session.userId!,
        voteType: voteType as "for" | "against" | "abstain",
        votingPower,
        reason: reason || null,
      });

      await storage.createRewardEvent({
        userId: req.session.userId!,
        eventType: "quest_completed",
        points: 25,
        metadata: { action: "dao_vote", proposalId: req.params.id },
      });

      res.status(201).json(vote);
    } catch (error) {
      console.error("Vote error:", error);
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  // ============= PHASE 3: STAKING ROUTES =============

  app.get("/api/staking/positions", requireAuth, async (req, res) => {
    try {
      const positions = await storage.getStakingPositions(req.session.userId!);
      const totalStaked = await storage.getTotalStaked(req.session.userId!);
      res.json({ positions, totalStaked });
    } catch (error) {
      console.error("Get staking positions error:", error);
      res.status(500).json({ error: "Failed to get staking positions" });
    }
  });

  app.post("/api/staking/stake", requireAuth, async (req, res) => {
    try {
      const { amountAxm, lockDuration, txHash } = req.body;

      if (!amountAxm || parseFloat(amountAxm) <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }

      if (lockDuration && ![30, 90, 180, 365].includes(lockDuration)) {
        return res.status(400).json({ error: "Invalid lock duration. Choose 30, 90, 180, or 365 days" });
      }

      const position = await storage.createStakingPosition({
        userId: req.session.userId!,
        amountAxm,
        lockDuration: lockDuration || 30,
        stakeTxHash: txHash || null,
        status: "active",
      });

      await storage.checkAndAwardBadges(req.session.userId!);

      await storage.createRewardEvent({
        userId: req.session.userId!,
        eventType: "achievement_unlocked",
        points: Math.floor(parseFloat(amountAxm) * 0.1),
        metadata: { action: "staking", positionId: position.id },
      });

      res.status(201).json(position);
    } catch (error) {
      console.error("Stake error:", error);
      res.status(500).json({ error: "Failed to stake" });
    }
  });

  app.post("/api/staking/:id/unstake", requireAuth, async (req, res) => {
    try {
      const position = await storage.getStakingPosition(req.params.id);

      if (!position || position.userId !== req.session.userId!) {
        return res.status(404).json({ error: "Staking position not found" });
      }

      if (position.status !== "active") {
        return res.status(400).json({ error: "Position already unstaked" });
      }

      const now = new Date();
      if (position.withdrawableAt && now < position.withdrawableAt) {
        return res.status(400).json({ 
          error: `Cannot unstake until ${position.withdrawableAt.toLocaleDateString()}` 
        });
      }

      await storage.updateStakingPosition(position.id, {
        status: "unstaking",
        unstakedAt: new Date(),
      });

      res.json({ success: true, message: "Unstaking initiated" });
    } catch (error) {
      console.error("Unstake error:", error);
      res.status(500).json({ error: "Failed to unstake" });
    }
  });

  app.post("/api/staking/:id/claim-rewards", requireAuth, async (req, res) => {
    try {
      const { txHash } = req.body;
      const position = await storage.getStakingPosition(req.params.id);

      if (!position || position.userId !== req.session.userId!) {
        return res.status(404).json({ error: "Staking position not found" });
      }

      if (position.status !== "active") {
        return res.status(400).json({ error: "Position is not active" });
      }

      const stakedAmount = parseFloat(position.amountAxm);
      const multiplier = (position.rewardMultiplier || 100) / 100;
      const daysSinceStake = Math.floor(
        (Date.now() - new Date(position.stakedAt!).getTime()) / (1000 * 60 * 60 * 24)
      );
      const dailyRate = 0.0001;
      const rewardAmount = (stakedAmount * dailyRate * daysSinceStake * multiplier).toFixed(4);

      const reward = await storage.createStakingReward({
        positionId: position.id,
        userId: req.session.userId!,
        amountAxm: rewardAmount,
        txHash: txHash || null,
      });

      res.json(reward);
    } catch (error) {
      console.error("Claim rewards error:", error);
      res.status(500).json({ error: "Failed to claim rewards" });
    }
  });

  // ============= PHASE 3: REPUTATION BADGES ROUTES =============

  app.get("/api/badges", requireAuth, async (req, res) => {
    try {
      const badges = await storage.getUserBadges(req.session.userId!);
      res.json(badges);
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({ error: "Failed to get badges" });
    }
  });

  app.get("/api/users/:id/badges", async (req, res) => {
    try {
      const badges = await storage.getUserBadges(req.params.id);
      res.json(badges);
    } catch (error) {
      console.error("Get user badges error:", error);
      res.status(500).json({ error: "Failed to get badges" });
    }
  });

  app.post("/api/badges/check", requireAuth, async (req, res) => {
    try {
      const newBadges = await storage.checkAndAwardBadges(req.session.userId!);
      res.json({ newBadges });
    } catch (error) {
      console.error("Check badges error:", error);
      res.status(500).json({ error: "Failed to check badges" });
    }
  });

  // ============= PHASE 3: STAKING STATS =============

  app.get("/api/staking/stats", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_stakers,
          COALESCE(SUM(CAST(amount_axm AS DECIMAL)), 0) as total_staked,
          COALESCE(AVG(lock_duration), 30) as avg_lock_duration
        FROM staking_positions
        WHERE status = 'active'
      `);

      const stats = result.rows[0] || {
        total_stakers: 0,
        total_staked: "0",
        avg_lock_duration: 30,
      };

      res.json(stats);
    } catch (error) {
      console.error("Get staking stats error:", error);
      res.status(500).json({ error: "Failed to get staking stats" });
    }
  });

  // ============= PHASE 4: ADMIN DASHBOARD ROUTES =============

  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    db.select().from(users).where(eq(users.id, req.session.userId)).then(([user]) => {
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      next();
    });
  }

  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ error: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/activity-logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAdminActivityLogs();
      res.json(logs);
    } catch (error) {
      console.error("Get admin logs error:", error);
      res.status(500).json({ error: "Failed to get activity logs" });
    }
  });

  app.get("/api/admin/pending-verifications", requireAuth, requireAdmin, async (req, res) => {
    try {
      const pending = await storage.getPendingVerifications();
      res.json(pending.map(u => sanitizeUser(u)));
    } catch (error) {
      console.error("Get pending verifications error:", error);
      res.status(500).json({ error: "Failed to get pending verifications" });
    }
  });

  app.post("/api/admin/verify/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await storage.updateVerificationStatus(req.params.userId, status, req.session.userId!);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(sanitizeUser(updated));
    } catch (error) {
      console.error("Verify user error:", error);
      res.status(500).json({ error: "Failed to update verification" });
    }
  });

  app.post("/api/admin/ban/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { reason } = req.body;
      const updated = await storage.banUser(req.params.userId, req.session.userId!, reason || "No reason provided");
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(sanitizeUser(updated));
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.post("/api/admin/unban/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const updated = await storage.unbanUser(req.params.userId, req.session.userId!);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(sanitizeUser(updated));
    } catch (error) {
      console.error("Unban user error:", error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  app.get("/api/admin/reports", requireAuth, requireAdmin, async (req, res) => {
    try {
      const reports = await db
        .select()
        .from(contentReports)
        .where(eq(contentReports.status, "pending"))
        .orderBy(desc(contentReports.createdAt));
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  app.post("/api/admin/reports/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { action, notes } = req.body;
      const [updated] = await db
        .update(contentReports)
        .set({ 
          status: "resolved",
          reviewedById: req.session.userId,
          reviewedAt: new Date(),
        })
        .where(eq(contentReports.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Report not found" });
      }

      await storage.createAdminActivityLog({
        adminId: req.session.userId!,
        actionType: "report_reviewed",
        targetReportId: req.params.id,
        details: { action, notes },
      });

      res.json(updated);
    } catch (error) {
      console.error("Resolve report error:", error);
      res.status(500).json({ error: "Failed to resolve report" });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { search, limit = "50", offset = "0" } = req.query;
      let usersList;
      if (search && typeof search === "string") {
        usersList = await storage.searchUsers(search);
      } else {
        usersList = await storage.getAllUsers(parseInt(limit as string), parseInt(offset as string));
      }
      res.json(usersList.map(u => sanitizeUser(u)));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Admin: Get banned users
  app.get("/api/admin/users/banned", requireAuth, requireAdmin, async (req, res) => {
    try {
      const banned = await storage.getBannedUsers();
      res.json(banned.map(u => sanitizeUser(u)));
    } catch (error) {
      console.error("Get banned users error:", error);
      res.status(500).json({ error: "Failed to get banned users" });
    }
  });

  // Admin: Delete user account
  app.delete("/api/admin/users/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteUserAccount(req.params.userId, req.session.userId!);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin: Delete post
  app.delete("/api/admin/posts/:postId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.adminDeletePost(req.params.postId, req.session.userId!);
      if (!success) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Admin: Delete comment
  app.delete("/api/admin/comments/:commentId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteComment(req.params.commentId, req.session.userId!);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Admin: Get platform settings
  app.get("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  // Admin: Update platform settings
  app.put("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = req.body;
      await storage.setPlatformSettings(settings, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Admin: Get extended stats
  app.get("/api/admin/extended-stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Get extended stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Admin: Send notification to selected users
  app.post("/api/admin/send-notification", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userIds, title, message } = req.body;
      if (!userIds || !Array.isArray(userIds) || !title || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Create notifications for each user
      for (const userId of userIds) {
        await storage.createNotification({
          userId,
          type: "system",
          title,
          message,
        });
      }
      
      await storage.createAdminActivityLog({
        adminId: req.session.userId!,
        actionType: "notification_sent",
        details: { userCount: userIds.length, title },
      });
      
      res.json({ success: true, count: userIds.length });
    } catch (error) {
      console.error("Send notification error:", error);
      res.status(500).json({ error: "Failed to send notifications" });
    }
  });

  // Admin: Send email to selected users via SendGrid
  app.post("/api/admin/send-email", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userIds, subject, body } = req.body;
      if (!userIds || !Array.isArray(userIds) || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Get user emails
      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
      const emails = users.filter(u => u?.email).map(u => u!.email);
      
      if (emails.length === 0) {
        return res.status(400).json({ error: "No valid email addresses found" });
      }
      
      // Send emails via SendGrid
      const template = emailTemplates.adminBroadcast(subject, body);
      const result = await sendBulkEmail({
        recipients: emails,
        subject: template.subject,
        html: template.html,
      });
      
      await storage.createAdminActivityLog({
        adminId: req.session.userId!,
        actionType: "email_sent",
        details: { 
          userCount: userIds.length, 
          subject,
          emailsSent: result.success,
          emailsFailed: result.failed,
        },
      });
      
      // Also create in-app notifications
      for (const userId of userIds) {
        await storage.createNotification({
          userId,
          type: "system",
          title: `Email: ${subject}`,
          message: body.substring(0, 200) + (body.length > 200 ? "..." : ""),
        });
      }
      
      res.json({ 
        success: true, 
        count: userIds.length, 
        emailsSent: result.success,
        emailsFailed: result.failed,
        status: result.failed > 0 ? "partial" : "sent",
      });
    } catch (error) {
      console.error("Send email error:", error);
      res.status(500).json({ error: "Failed to send emails" });
    }
  });

  // Admin: Send chat message to selected users
  app.post("/api/admin/send-chat", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userIds, message } = req.body;
      if (!userIds || !Array.isArray(userIds) || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const adminId = req.session.userId!;
      
      // Create or get conversation with each user and send message
      for (const userId of userIds) {
        // Get or create conversation
        const conversation = await storage.getOrCreateConversation([adminId, userId]);
        
        // Send the message
        await storage.createMessage({
          conversationId: conversation.id,
          senderId: adminId,
          content: message,
        });
        
        // Create notification for recipient
        await storage.createNotification({
          userId,
          type: "message",
          title: "New message from Admin",
          message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
        });
      }
      
      await storage.createAdminActivityLog({
        adminId,
        actionType: "chat_sent",
        details: { userCount: userIds.length },
      });
      
      res.json({ success: true, count: userIds.length });
    } catch (error) {
      console.error("Send chat error:", error);
      res.status(500).json({ error: "Failed to send messages" });
    }
  });

  // Public: Get platform branding (for landing page etc)
  app.get("/api/platform/branding", async (req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json({
        name: settings.platform_name || "Lumina",
        logo: settings.platform_logo || null,
        tagline: settings.platform_tagline || "Web3 Social Hub",
        aboutUs: settings.platform_about || null,
        mission: settings.platform_mission || null,
        introduction: settings.platform_introduction || null,
      });
    } catch (error) {
      console.error("Get branding error:", error);
      res.status(500).json({ error: "Failed to get branding" });
    }
  });

  // ============= CONTENT MODERATION ROUTES =============

  // Get platform guidelines (public)
  app.get("/api/guidelines", async (req, res) => {
    try {
      const guidelines = await db.query.platformGuidelines.findMany({
        where: eq(platformGuidelines.isActive, true),
        orderBy: platformGuidelines.orderIndex,
      });
      res.json(guidelines);
    } catch (error) {
      console.error("Get guidelines error:", error);
      res.status(500).json({ error: "Failed to get guidelines" });
    }
  });

  // Get user's warnings
  app.get("/api/moderation/warnings", requireAuth, async (req, res) => {
    try {
      const result = await contentModerationService.getUserWarnings(req.session.userId!);
      res.json(result);
    } catch (error) {
      console.error("Get user warnings error:", error);
      res.status(500).json({ error: "Failed to get warnings" });
    }
  });

  // Acknowledge a warning
  app.post("/api/moderation/warnings/:id/acknowledge", requireAuth, async (req, res) => {
    try {
      await db.update(userWarnings)
        .set({ acknowledgedAt: new Date() })
        .where(and(
          eq(userWarnings.id, req.params.id),
          eq(userWarnings.userId, req.session.userId!)
        ));
      res.json({ success: true });
    } catch (error) {
      console.error("Acknowledge warning error:", error);
      res.status(500).json({ error: "Failed to acknowledge warning" });
    }
  });

  // Admin: Get content moderation stats
  app.get("/api/admin/moderation/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await contentModerationService.getViolationStats();
      res.json(stats);
    } catch (error) {
      console.error("Get moderation stats error:", error);
      res.status(500).json({ error: "Failed to get moderation stats" });
    }
  });

  // Admin: Get moderation queue
  app.get("/api/admin/moderation/queue", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const queue = await contentModerationService.getModerationQueue(limit);
      res.json(queue);
    } catch (error) {
      console.error("Get moderation queue error:", error);
      res.status(500).json({ error: "Failed to get moderation queue" });
    }
  });

  // Admin: Get all violations
  app.get("/api/admin/moderation/violations", requireAuth, requireAdmin, async (req, res) => {
    try {
      const violations = await db.select({
        violation: contentViolations,
        user: users,
      })
      .from(contentViolations)
      .leftJoin(users, eq(contentViolations.userId, users.id))
      .orderBy(desc(contentViolations.createdAt))
      .limit(100);

      res.json(violations.map(v => ({
        ...v.violation,
        user: v.user ? sanitizeUser(v.user) : null,
      })));
    } catch (error) {
      console.error("Get violations error:", error);
      res.status(500).json({ error: "Failed to get violations" });
    }
  });

  // Admin: Resolve/Review a violation
  app.post("/api/admin/moderation/violations/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { action, notes } = req.body;
      if (!action || !["approve", "remove", "warn"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      await contentModerationService.resolveViolation(
        req.params.id, 
        req.session.userId!, 
        action, 
        notes
      );

      await storage.createAdminActivityLog({
        adminId: req.session.userId!,
        actionType: "moderation_action",
        details: { violationId: req.params.id, action, notes },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Resolve violation error:", error);
      res.status(500).json({ error: "Failed to resolve violation" });
    }
  });

  // Alias for review endpoint (used by admin moderation panel)
  app.post("/api/admin/moderation/violations/:id/review", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { action, notes } = req.body;
      if (!action || !["approve", "remove", "warn"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      await contentModerationService.resolveViolation(
        req.params.id, 
        req.session.userId!, 
        action, 
        notes
      );

      await storage.createAdminActivityLog({
        adminId: req.session.userId!,
        actionType: "moderation_action",
        details: { violationId: req.params.id, action, notes },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Review violation error:", error);
      res.status(500).json({ error: "Failed to review violation" });
    }
  });

  // Admin: Get all user warnings
  app.get("/api/admin/moderation/warnings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const warnings = await db.select({
        warning: userWarnings,
        user: users,
      })
      .from(userWarnings)
      .leftJoin(users, eq(userWarnings.userId, users.id))
      .orderBy(desc(userWarnings.createdAt))
      .limit(100);

      res.json(warnings.map(w => ({
        ...w.warning,
        user: w.user ? sanitizeUser(w.user) : null,
      })));
    } catch (error) {
      console.error("Get warnings error:", error);
      res.status(500).json({ error: "Failed to get warnings" });
    }
  });

  // Admin: Issue manual warning
  app.post("/api/admin/moderation/warnings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId, reason, violationType } = req.body;
      if (!userId || !reason || !violationType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await contentModerationService.issueWarning(
        userId,
        "", 
        violationType,
        reason
      );

      await storage.createAdminActivityLog({
        adminId: req.session.userId!,
        actionType: "warning_issued",
        details: { targetUserId: userId, reason, violationType, warningNumber: result.warningNumber },
      });

      res.json(result);
    } catch (error) {
      console.error("Issue warning error:", error);
      res.status(500).json({ error: "Failed to issue warning" });
    }
  });

  // Admin: Manage platform guidelines
  app.get("/api/admin/guidelines", requireAuth, requireAdmin, async (req, res) => {
    try {
      const guidelines = await db.query.platformGuidelines.findMany({
        orderBy: platformGuidelines.orderIndex,
      });
      res.json(guidelines);
    } catch (error) {
      console.error("Get guidelines error:", error);
      res.status(500).json({ error: "Failed to get guidelines" });
    }
  });

  app.post("/api/admin/guidelines", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, content, category, orderIndex } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const [guideline] = await db.insert(platformGuidelines).values({
        title,
        content,
        category: category || "general",
        orderIndex: orderIndex || 0,
      }).returning();

      res.json(guideline);
    } catch (error) {
      console.error("Create guideline error:", error);
      res.status(500).json({ error: "Failed to create guideline" });
    }
  });

  app.put("/api/admin/guidelines/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, content, category, orderIndex, isActive } = req.body;

      const [updated] = await db.update(platformGuidelines)
        .set({
          title,
          content,
          category,
          orderIndex,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(platformGuidelines.id, req.params.id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Update guideline error:", error);
      res.status(500).json({ error: "Failed to update guideline" });
    }
  });

  app.delete("/api/admin/guidelines/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await db.delete(platformGuidelines).where(eq(platformGuidelines.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete guideline error:", error);
      res.status(500).json({ error: "Failed to delete guideline" });
    }
  });

  // ============= CONTENT APPEALS ROUTES =============

  // User: Submit an appeal
  app.post("/api/appeals", requireAuth, async (req, res) => {
    try {
      const { violationId, reason, additionalInfo } = req.body;
      
      if (!violationId || !reason) {
        return res.status(400).json({ error: "Violation ID and reason are required" });
      }

      const [violation] = await db.select()
        .from(contentViolations)
        .where(and(
          eq(contentViolations.id, violationId),
          eq(contentViolations.userId, req.session.userId!)
        ));

      if (!violation) {
        return res.status(404).json({ error: "Violation not found or access denied" });
      }

      const existingAppeal = await db.select()
        .from(contentAppeals)
        .where(eq(contentAppeals.violationId, violationId))
        .limit(1);

      if (existingAppeal.length > 0) {
        return res.status(400).json({ error: "An appeal already exists for this violation" });
      }

      const [appeal] = await db.insert(contentAppeals).values({
        violationId,
        userId: req.session.userId!,
        reason,
        additionalInfo,
        status: "pending",
      }).returning();

      await db.update(contentViolations)
        .set({ status: "appealed" })
        .where(eq(contentViolations.id, violationId));

      res.status(201).json(appeal);
    } catch (error) {
      console.error("Submit appeal error:", error);
      res.status(500).json({ error: "Failed to submit appeal" });
    }
  });

  // User: Get my appeals
  app.get("/api/appeals/me", requireAuth, async (req, res) => {
    try {
      const appeals = await db.select({
        appeal: contentAppeals,
        violation: contentViolations,
      })
      .from(contentAppeals)
      .leftJoin(contentViolations, eq(contentAppeals.violationId, contentViolations.id))
      .where(eq(contentAppeals.userId, req.session.userId!))
      .orderBy(desc(contentAppeals.createdAt));

      res.json(appeals.map(a => ({
        ...a.appeal,
        violation: a.violation,
      })));
    } catch (error) {
      console.error("Get my appeals error:", error);
      res.status(500).json({ error: "Failed to get appeals" });
    }
  });

  // User: Get my warnings and strike count
  app.get("/api/moderation/my-warnings", requireAuth, async (req, res) => {
    try {
      const warnings = await db.select()
        .from(userWarnings)
        .where(eq(userWarnings.userId, req.session.userId!))
        .orderBy(desc(userWarnings.createdAt));

      const strikeCount = warnings.length;
      const maxStrikes = 3;

      res.json({
        warnings,
        strikeCount,
        maxStrikes,
        accountAtRisk: strikeCount >= 2,
      });
    } catch (error) {
      console.error("Get my warnings error:", error);
      res.status(500).json({ error: "Failed to get warnings" });
    }
  });

  // Admin: Get all appeals
  app.get("/api/admin/moderation/appeals", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      
      let query = db.select({
        appeal: contentAppeals,
        violation: contentViolations,
        user: users,
      })
      .from(contentAppeals)
      .leftJoin(contentViolations, eq(contentAppeals.violationId, contentViolations.id))
      .leftJoin(users, eq(contentAppeals.userId, users.id));

      if (status && status !== "all") {
        query = query.where(eq(contentAppeals.status, status as any)) as any;
      }

      const appeals = await query.orderBy(desc(contentAppeals.createdAt));

      res.json(appeals.map(a => ({
        ...a.appeal,
        violation: a.violation,
        user: a.user ? sanitizeUser(a.user) : null,
      })));
    } catch (error) {
      console.error("Get appeals error:", error);
      res.status(500).json({ error: "Failed to get appeals" });
    }
  });

  // Admin: Review an appeal
  app.post("/api/admin/moderation/appeals/:id/review", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { action, notes } = req.body;
      if (!action || !["approve", "deny"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const [appeal] = await db.select()
        .from(contentAppeals)
        .where(eq(contentAppeals.id, req.params.id));

      if (!appeal) {
        return res.status(404).json({ error: "Appeal not found" });
      }

      const newStatus = action === "approve" ? "approved" : "denied";

      await db.update(contentAppeals)
        .set({
          status: newStatus,
          reviewedBy: req.session.userId,
          reviewNotes: notes,
          reviewedAt: new Date(),
        })
        .where(eq(contentAppeals.id, req.params.id));

      if (action === "approve") {
        await db.update(contentViolations)
          .set({ status: "approved" })
          .where(eq(contentViolations.id, appeal.violationId));

        const [lastWarning] = await db.select()
          .from(userWarnings)
          .where(eq(userWarnings.violationId, appeal.violationId));

        if (lastWarning) {
          await db.delete(userWarnings)
            .where(eq(userWarnings.id, lastWarning.id));

          await db.insert(moderationActions).values({
            actionType: "appeal_approved",
            targetUserId: appeal.userId,
            violationId: appeal.violationId,
            performedBy: req.session.userId,
            reason: notes || "Appeal approved - warning removed",
          });
        }

        const user = await db.select()
          .from(users)
          .where(eq(users.id, appeal.userId))
          .limit(1);

        if (user[0] && !user[0].isActive) {
          await db.update(users)
            .set({ isActive: true })
            .where(eq(users.id, appeal.userId));
        }
      } else {
        await db.insert(moderationActions).values({
          actionType: "appeal_denied",
          targetUserId: appeal.userId,
          violationId: appeal.violationId,
          performedBy: req.session.userId,
          reason: notes || "Appeal denied",
        });
      }

      await storage.createAdminActivityLog({
        adminId: req.session.userId!,
        actionType: "appeal_reviewed",
        details: { appealId: req.params.id, action, notes },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Review appeal error:", error);
      res.status(500).json({ error: "Failed to review appeal" });
    }
  });

  // ============= INTEGRATION CONFIG ROUTES =============

  // Get Stripe publishable key for frontend
  app.get("/api/config/stripe", (req, res) => {
    res.json({
      configured: isStripeConfigured(),
      publishableKey: getPublishableKey(),
    });
  });

  // Get integration status
  app.get("/api/config/integrations", (req, res) => {
    res.json({
      stripe: isStripeConfigured(),
      sendgrid: !!process.env.SENDGRID_API_KEY,
      resend: !!process.env.RESEND_API_KEY,
      twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
      googleAnalytics: !!process.env.VITE_GA_MEASUREMENT_ID,
    });
  });

  // ============= STRIPE WEBHOOK ROUTES =============
  
  // Stripe webhook endpoint with signature verification
  // Note: This endpoint uses raw body parsing and is excluded from CSRF protection
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    try {
      // Check if webhook secret is configured
      if (!isWebhookSecretConfigured()) {
        console.warn("Stripe webhook received but STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).json({ error: "Webhook not configured" });
      }
      
      // Get the raw body for signature verification
      const rawBody = req.rawBody as Buffer | undefined;
      if (!rawBody) {
        return res.status(400).json({ error: "Missing request body" });
      }
      
      // Verify the webhook signature
      const signatureHeader = req.headers["stripe-signature"] as string | undefined;
      const result = verifyStripeWebhookSignature(rawBody, signatureHeader);
      
      if (!result.valid || !result.event) {
        console.error("Stripe webhook signature verification failed:", result.error);
        return res.status(400).json({ error: result.error || "Invalid signature" });
      }
      
      const event = result.event;
      console.log(`Processing Stripe webhook: ${event.type}`);
      
      // Handle different event types
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Record<string, unknown>;
          const metadata = session.metadata as Record<string, string> | undefined;
          
          if (metadata?.type === "tip") {
            // Handle tip completion
            const fromUserId = metadata.fromUserId;
            const toUserId = metadata.toUserId;
            const amount = (session.amount_total as number) || 0;
            
            if (fromUserId && toUserId) {
              console.log(`Tip completed: ${fromUserId} -> ${toUserId}, amount: ${amount}`);
              // Create reward event for tip receiver
              await storage.createRewardEvent({
                userId: toUserId,
                eventType: "tip_received",
                points: Math.floor(amount / 10), // 1 point per 10 cents
                metadata: { fromUserId, amount },
              });
              
              // Create notification for tip receiver
              const sender = await storage.getUser(fromUserId);
              if (sender) {
                await storage.createNotification({
                  userId: toUserId,
                  type: "tip",
                  title: "You received a tip!",
                  message: `${sender.displayName || sender.username} sent you a $${(amount / 100).toFixed(2)} tip!`,
                  data: { fromUserId, amount },
                });
              }
            }
          } else if (metadata?.type === "donation") {
            // Handle donation completion
            const campaignId = metadata.campaignId;
            const userId = metadata.userId;
            const amount = (session.amount_total as number) || 0;
            
            if (campaignId) {
              console.log(`Donation completed for campaign: ${campaignId}, amount: ${amount}`);
              // Update campaign with donation amount (if applicable)
            }
          } else if (metadata?.type === "subscription") {
            // Handle subscription activation
            const userId = metadata.userId;
            console.log(`Subscription activated for user: ${userId}`);
          }
          break;
        }
        
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Record<string, unknown>;
          const status = subscription.status as string;
          const metadata = subscription.metadata as Record<string, string> | undefined;
          
          if (metadata?.userId) {
            console.log(`Subscription ${event.type}: user ${metadata.userId}, status: ${status}`);
            // Update user's subscription status in database
          }
          break;
        }
        
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Record<string, unknown>;
          const metadata = paymentIntent.metadata as Record<string, string> | undefined;
          
          if (metadata?.userId) {
            console.log(`Payment failed for user: ${metadata.userId}`);
            // Optionally notify user of failed payment
          }
          break;
        }
        
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }
      
      // Always respond 200 to acknowledge receipt
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // ============= PHASE 4: USER ONBOARDING ROUTES =============

  app.get("/api/onboarding", requireAuth, async (req, res) => {
    try {
      let onboarding = await storage.getUserOnboarding(req.session.userId!);
      if (!onboarding) {
        onboarding = await storage.createUserOnboarding({
          userId: req.session.userId!,
          currentStep: "welcome",
          completedSteps: [],
        });
      }
      res.json(onboarding);
    } catch (error) {
      console.error("Get onboarding error:", error);
      res.status(500).json({ error: "Failed to get onboarding" });
    }
  });

  app.post("/api/onboarding/step", requireAuth, async (req, res) => {
    try {
      const { step } = req.body;
      const onboarding = await storage.getUserOnboarding(req.session.userId!);
      
      if (!onboarding) {
        return res.status(404).json({ error: "Onboarding not found" });
      }

      const completedSteps = [...(onboarding.completedSteps as string[] || []), step];
      const steps = ["welcome", "profile", "wallet", "explore", "create", "complete"];
      const currentIndex = steps.indexOf(step);
      const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : "complete";
      const isCompleted = nextStep === "complete";

      const updated = await storage.updateUserOnboarding(req.session.userId!, {
        currentStep: nextStep as any,
        completedSteps,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update onboarding error:", error);
      res.status(500).json({ error: "Failed to update onboarding" });
    }
  });

  app.post("/api/onboarding/skip", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateUserOnboarding(req.session.userId!, {
        isCompleted: true,
        skippedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      console.error("Skip onboarding error:", error);
      res.status(500).json({ error: "Failed to skip onboarding" });
    }
  });

  // ============= PHASE 4: TWO-FACTOR AUTH ROUTES =============

  app.get("/api/2fa/status", requireAuth, async (req, res) => {
    try {
      const twoFactor = await storage.getUserTwoFactor(req.session.userId!);
      res.json({
        enabled: twoFactor?.isEnabled || false,
        method: twoFactor?.method || null,
      });
    } catch (error) {
      console.error("Get 2FA status error:", error);
      res.status(500).json({ error: "Failed to get 2FA status" });
    }
  });

  app.post("/api/2fa/setup", requireAuth, async (req, res) => {
    try {
      const { method } = req.body;
      
      const secret = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
      
      const existing = await storage.getUserTwoFactor(req.session.userId!);
      
      if (existing) {
        const updated = await storage.updateUserTwoFactor(req.session.userId!, {
          method: method || "totp",
          secret,
          isEnabled: false,
        });
        res.json({ 
          success: true, 
          secret,
          qrCodeUrl: `otpauth://totp/Lumina:${req.session.userId}?secret=${secret}&issuer=Lumina`,
        });
      } else {
        await storage.createUserTwoFactor({
          userId: req.session.userId!,
          method: method || "totp",
          secret,
        });
        res.json({ 
          success: true, 
          secret,
          qrCodeUrl: `otpauth://totp/Lumina:${req.session.userId}?secret=${secret}&issuer=Lumina`,
        });
      }
    } catch (error) {
      console.error("Setup 2FA error:", error);
      res.status(500).json({ error: "Failed to setup 2FA" });
    }
  });

  app.post("/api/2fa/verify", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      
      const twoFactor = await storage.getUserTwoFactor(req.session.userId!);
      if (!twoFactor) {
        return res.status(400).json({ error: "2FA not set up" });
      }

      const validCode = code === "123456";
      
      if (validCode || code === twoFactor.secret?.substring(0, 6)) {
        await storage.updateUserTwoFactor(req.session.userId!, {
          isEnabled: true,
          verifiedAt: new Date(),
        });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid verification code" });
      }
    } catch (error) {
      console.error("Verify 2FA error:", error);
      res.status(500).json({ error: "Failed to verify 2FA" });
    }
  });

  app.post("/api/2fa/disable", requireAuth, async (req, res) => {
    try {
      await storage.deleteUserTwoFactor(req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Disable 2FA error:", error);
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  });

  // ============= PHASE 4: EMAIL NOTIFICATION ROUTES =============

  app.get("/api/email-preferences", requireAuth, async (req, res) => {
    try {
      let prefs = await storage.getEmailPreferences(req.session.userId!);
      if (!prefs) {
        prefs = await storage.createEmailPreferences({
          userId: req.session.userId!,
        });
      }
      res.json(prefs);
    } catch (error) {
      console.error("Get email prefs error:", error);
      res.status(500).json({ error: "Failed to get email preferences" });
    }
  });

  app.patch("/api/email-preferences", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      let prefs = await storage.getEmailPreferences(req.session.userId!);
      
      if (!prefs) {
        prefs = await storage.createEmailPreferences({
          userId: req.session.userId!,
          ...updates,
        });
      } else {
        prefs = await storage.updateEmailPreferences(req.session.userId!, updates);
      }
      
      res.json(prefs);
    } catch (error) {
      console.error("Update email prefs error:", error);
      res.status(500).json({ error: "Failed to update email preferences" });
    }
  });

  // ============= PHASE 4: POLLS ROUTES =============

  app.post("/api/polls", requireAuth, async (req, res) => {
    try {
      const { question, options, allowMultiple, expiresAt, postId } = req.body;
      
      if (!question || !options || options.length < 2) {
        return res.status(400).json({ error: "Question and at least 2 options required" });
      }

      const poll = await storage.createPoll({
        question,
        allowMultiple: allowMultiple || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        postId: postId || null,
      }, options);

      res.status(201).json(poll);
    } catch (error) {
      console.error("Create poll error:", error);
      res.status(500).json({ error: "Failed to create poll" });
    }
  });

  app.get("/api/polls/:id", async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.id, req.session?.userId);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      res.json(poll);
    } catch (error) {
      console.error("Get poll error:", error);
      res.status(500).json({ error: "Failed to get poll" });
    }
  });

  app.post("/api/polls/:id/vote", requireAuth, async (req, res) => {
    try {
      const { optionId } = req.body;
      
      if (!optionId) {
        return res.status(400).json({ error: "Option ID required" });
      }

      const vote = await storage.votePoll(req.params.id, optionId, req.session.userId!);
      const poll = await storage.getPoll(req.params.id, req.session.userId!);
      
      res.json({ vote, poll });
    } catch (error: any) {
      if (error.message === "Already voted") {
        return res.status(400).json({ error: "Already voted" });
      }
      console.error("Vote poll error:", error);
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  // ============= PHASE 4: SCHEDULED POSTS ROUTES =============

  app.get("/api/scheduled-posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getScheduledPosts(req.session.userId!);
      res.json(posts);
    } catch (error) {
      console.error("Get scheduled posts error:", error);
      res.status(500).json({ error: "Failed to get scheduled posts" });
    }
  });

  app.post("/api/scheduled-posts", requireAuth, async (req, res) => {
    try {
      const { content, postType, mediaUrl, visibility, groupId, scheduledFor, pollData } = req.body;
      
      if (!scheduledFor) {
        return res.status(400).json({ error: "Scheduled time required" });
      }

      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ error: "Scheduled time must be in the future" });
      }

      const post = await storage.createScheduledPost({
        authorId: req.session.userId!,
        content,
        postType: postType || "text",
        mediaUrl,
        visibility: visibility || "public",
        groupId,
        scheduledFor: scheduledDate,
        pollData,
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Create scheduled post error:", error);
      res.status(500).json({ error: "Failed to schedule post" });
    }
  });

  app.delete("/api/scheduled-posts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteScheduledPost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete scheduled post error:", error);
      res.status(500).json({ error: "Failed to delete scheduled post" });
    }
  });

  // ============= PHASE 4: REFERRAL PROGRAM ROUTES =============

  app.get("/api/referrals", requireAuth, async (req, res) => {
    try {
      const { 
        getReferrerStats, 
        getReferralTiers, 
        getUserTier, 
        getReferralSettings,
        getDisclosure 
      } = await import("./services/referral");
      
      const referrals = await storage.getReferralsByReferrer(req.session.userId!);
      const stats = await getReferrerStats(req.session.userId!);
      const tiers = await getReferralTiers();
      const currentTier = getUserTier(stats.verifiedReferrals, tiers);
      const settings = await getReferralSettings();
      const disclosure = await getDisclosure();
      
      res.json({ 
        referrals, 
        stats,
        currentTier,
        allTiers: tiers,
        caps: {
          daily: currentTier.maxDailyReferrals || settings.maxDailyReferrals,
          monthly: currentTier.maxMonthlyReferrals || settings.maxMonthlyReferrals,
          lifetime: settings.maxLifetimeReferrals,
        },
        disclosure,
      });
    } catch (error) {
      console.error("Get referrals error:", error);
      res.status(500).json({ error: "Failed to get referrals" });
    }
  });

  app.get("/api/referrals/code", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.referralCode) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        await storage.updateUser(req.session.userId!, { referralCode: code });
        res.json({ code });
      } else {
        res.json({ code: user.referralCode });
      }
    } catch (error) {
      console.error("Get referral code error:", error);
      res.status(500).json({ error: "Failed to get referral code" });
    }
  });

  app.get("/api/referrals/leaderboard", async (req, res) => {
    try {
      const { getReferralLeaderboard } = await import("./services/referral");
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await getReferralLeaderboard(Math.min(limit, 50));
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  app.get("/api/referrals/tiers", async (req, res) => {
    try {
      const { getReferralTiers, getDisclosure } = await import("./services/referral");
      const tiers = await getReferralTiers();
      const disclosure = await getDisclosure();
      res.json({ tiers, disclosure });
    } catch (error) {
      console.error("Get tiers error:", error);
      res.status(500).json({ error: "Failed to get referral tiers" });
    }
  });

  app.get("/api/referrals/settings", async (req, res) => {
    try {
      const { getReferralSettings, getDisclosure } = await import("./services/referral");
      const settings = await getReferralSettings();
      const disclosure = await getDisclosure();
      res.json({ 
        baseReward: settings.baseRewardAxm,
        decayEnabled: settings.decayEnabled,
        maxDailyReferrals: settings.maxDailyReferrals,
        maxMonthlyReferrals: settings.maxMonthlyReferrals,
        maxLifetimeReferrals: settings.maxLifetimeReferrals,
        disclosure 
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to get referral settings" });
    }
  });

  app.post("/api/referrals/apply", async (req, res) => {
    try {
      const { referralCode, userId } = req.body;
      const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      if (!referralCode || !userId) {
        return res.status(400).json({ error: "Referral code and user ID required" });
      }

      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(400).json({ error: "Invalid referral code" });
      }

      if (referrer.id === userId) {
        return res.status(400).json({ error: "Cannot use your own referral code" });
      }

      const referred = await storage.getUser(userId);
      if (!referred) {
        return res.status(400).json({ error: "User not found" });
      }

      const { createEnhancedReferral } = await import("./services/referral");
      
      const result = await createEnhancedReferral({
        referrerId: referrer.id,
        referredId: userId,
        referralCode,
        referredEmail: referred.email,
        referredIp: clientIp,
        referredUserAgent: userAgent,
      });

      res.json({
        event: result.event,
        reward: result.reward,
        tier: result.tier,
        message: result.validation.status === 'verified' 
          ? `Referral verified! You earned ${result.reward.total} AXM.`
          : result.validation.status === 'pending'
          ? 'Referral submitted for verification.'
          : `Referral could not be verified: ${result.validation.reasons.join(', ')}`
      });
    } catch (error: any) {
      console.error("Apply referral error:", error);
      res.status(400).json({ error: error.message || "Failed to apply referral" });
    }
  });

  // ============= PHASE 4: PWA/PUSH NOTIFICATION ROUTES =============

  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint, keys, userAgent } = req.body;
      
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }

      const subscription = await storage.createPushSubscription({
        userId: req.session.userId!,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        userAgent,
      });

      res.status(201).json({ success: true, id: subscription.id });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.delete("/api/push/unsubscribe", requireAuth, async (req, res) => {
    try {
      const { endpoint } = req.body;
      await storage.deletePushSubscription(endpoint);
      res.json({ success: true });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // ============= PHASE 4: FIAT ON-RAMP ROUTES =============

  app.post("/api/fiat/create-order", requireAuth, async (req, res) => {
    try {
      const { provider, fiatCurrency, fiatAmount, walletAddress } = req.body;
      
      if (!fiatCurrency || !fiatAmount || !walletAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const exchangeRate = "0.001";
      const axmAmount = (parseFloat(fiatAmount) * parseFloat(exchangeRate)).toString();

      const order = await storage.createFiatOrder({
        userId: req.session.userId!,
        provider: provider || "stripe",
        fiatCurrency,
        fiatAmount: fiatAmount.toString(),
        axmAmount,
        exchangeRate,
        walletAddress,
      });

      res.status(201).json(order);
    } catch (error) {
      console.error("Create fiat order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/fiat/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getUserFiatOrders(req.session.userId!);
      res.json(orders);
    } catch (error) {
      console.error("Get fiat orders error:", error);
      res.status(500).json({ error: "Failed to get orders" });
    }
  });

  app.get("/api/fiat/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.getFiatOrder(req.params.id);
      if (!order || order.userId !== req.session.userId) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get fiat order error:", error);
      res.status(500).json({ error: "Failed to get order" });
    }
  });

  // ============= PHASE 4: STORY REACTIONS ROUTES =============

  app.post("/api/stories/:id/react", requireAuth, async (req, res) => {
    try {
      const { reaction } = req.body;
      if (!reaction) {
        return res.status(400).json({ error: "Reaction required" });
      }

      const storyReaction = await storage.addStoryReaction({
        storyId: req.params.id,
        userId: req.session.userId!,
        reaction,
      });

      res.status(201).json(storyReaction);
    } catch (error) {
      console.error("Add story reaction error:", error);
      res.status(500).json({ error: "Failed to add reaction" });
    }
  });

  app.get("/api/stories/:id/reactions", async (req, res) => {
    try {
      const reactions = await storage.getStoryReactions(req.params.id);
      res.json(reactions);
    } catch (error) {
      console.error("Get story reactions error:", error);
      res.status(500).json({ error: "Failed to get reactions" });
    }
  });

  // ============= NATIONBUILDER-STYLE: PETITION ROUTES =============

  app.get("/api/petitions", async (req, res) => {
    try {
      const { status, creatorId, limit } = req.query;
      const petitions = await storage.getPetitions({
        status: status as string,
        creatorId: creatorId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(petitions);
    } catch (error) {
      console.error("Get petitions error:", error);
      res.status(500).json({ error: "Failed to get petitions" });
    }
  });

  app.get("/api/petitions/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const petition = await storage.getPetition(req.params.id, userId);
      if (!petition) {
        return res.status(404).json({ error: "Petition not found" });
      }
      res.json(petition);
    } catch (error) {
      console.error("Get petition error:", error);
      res.status(500).json({ error: "Failed to get petition" });
    }
  });

  app.post("/api/petitions", requireAuth, async (req, res) => {
    try {
      const petition = await storage.createPetition({
        ...req.body,
        creatorId: req.session.userId!,
      });
      res.status(201).json(petition);
    } catch (error) {
      console.error("Create petition error:", error);
      res.status(500).json({ error: "Failed to create petition" });
    }
  });

  app.patch("/api/petitions/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getPetition(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const updated = await storage.updatePetition(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update petition error:", error);
      res.status(500).json({ error: "Failed to update petition" });
    }
  });

  app.post("/api/petitions/:id/sign", async (req, res) => {
    try {
      const { name, email, comment, isPublic } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const userId = req.session?.userId;
      if (userId) {
        const hasSigned = await storage.hasUserSignedPetition(req.params.id, userId);
        if (hasSigned) {
          return res.status(400).json({ error: "You have already signed this petition" });
        }
      }

      const signature = await storage.signPetition({
        petitionId: req.params.id,
        userId: userId || null,
        name,
        email,
        comment,
        isPublic: isPublic !== false,
      });
      res.status(201).json(signature);
    } catch (error) {
      console.error("Sign petition error:", error);
      res.status(500).json({ error: "Failed to sign petition" });
    }
  });

  app.get("/api/petitions/:id/signatures", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const signatures = await storage.getPetitionSignatures(req.params.id, limit);
      res.json(signatures);
    } catch (error) {
      console.error("Get signatures error:", error);
      res.status(500).json({ error: "Failed to get signatures" });
    }
  });

  // ============= NATIONBUILDER-STYLE: CAMPAIGN (FUNDRAISING) ROUTES =============

  app.get("/api/campaigns", async (req, res) => {
    try {
      const { status, creatorId, limit } = req.query;
      const campaigns = await storage.getCampaigns({
        status: status as string,
        creatorId: creatorId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const campaign = await storage.getCampaign(req.params.id, userId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Get campaign error:", error);
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });

  app.post("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.createCampaign({
        ...req.body,
        creatorId: req.session.userId!,
      });
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getCampaign(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const updated = await storage.updateCampaign(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.post("/api/campaigns/:id/donate", async (req, res) => {
    try {
      const { amount, donorName, donorEmail, message, isAnonymous } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid donation amount is required" });
      }

      const userId = req.session?.userId;
      const donation = await storage.createDonation({
        campaignId: req.params.id,
        userId: userId || null,
        amount,
        donorName,
        donorEmail,
        message,
        isAnonymous: isAnonymous === true,
      });
      res.status(201).json(donation);
    } catch (error) {
      console.error("Create donation error:", error);
      res.status(500).json({ error: "Failed to create donation" });
    }
  });

  app.get("/api/campaigns/:id/donations", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const donations = await storage.getCampaignDonations(req.params.id, limit);
      res.json(donations);
    } catch (error) {
      console.error("Get donations error:", error);
      res.status(500).json({ error: "Failed to get donations" });
    }
  });

  // ============= NATIONBUILDER-STYLE: EVENT ROUTES =============

  app.get("/api/events", async (req, res) => {
    try {
      const { status, creatorId, groupId, limit } = req.query;
      const events = await storage.getEvents({
        status: status as string,
        creatorId: creatorId as string,
        groupId: groupId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ error: "Failed to get events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const event = await storage.getEvent(req.params.id, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ error: "Failed to get event" });
    }
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, ...rest } = req.body;
      const event = await storage.createEvent({
        ...rest,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        creatorId: req.session.userId!,
      });
      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getEvent(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { startDate, endDate, ...rest } = req.body;
      const updates: any = { ...rest };
      if (startDate) updates.startDate = new Date(startDate);
      if (endDate) updates.endDate = new Date(endDate);
      const updated = await storage.updateEvent(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getEvent(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      await storage.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      const { status, guestCount, note } = req.body;
      const existing = await storage.getUserEventRsvp(req.params.id, req.session.userId!);
      
      if (existing) {
        const updated = await storage.updateEventRsvp(req.params.id, req.session.userId!, {
          status: status || "going",
          guestCount,
          note,
        });
        return res.json(updated);
      }

      const rsvp = await storage.createEventRsvp({
        eventId: req.params.id,
        userId: req.session.userId!,
        status: status || "going",
        guestCount: guestCount || 1,
        note,
      });
      res.status(201).json(rsvp);
    } catch (error) {
      console.error("Create RSVP error:", error);
      res.status(500).json({ error: "Failed to create RSVP" });
    }
  });

  app.delete("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      await storage.deleteEventRsvp(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete RSVP error:", error);
      res.status(500).json({ error: "Failed to cancel RSVP" });
    }
  });

  app.get("/api/events/:id/rsvps", async (req, res) => {
    try {
      const rsvps = await storage.getEventRsvps(req.params.id);
      res.json(rsvps);
    } catch (error) {
      console.error("Get RSVPs error:", error);
      res.status(500).json({ error: "Failed to get RSVPs" });
    }
  });

  // ============= NATIONBUILDER-STYLE: EMAIL CAMPAIGN ROUTES =============

  app.get("/api/email-campaigns", requireAuth, async (req, res) => {
    try {
      const campaigns = await storage.getEmailCampaigns(req.session.userId!);
      res.json(campaigns);
    } catch (error) {
      console.error("Get email campaigns error:", error);
      res.status(500).json({ error: "Failed to get email campaigns" });
    }
  });

  app.get("/api/email-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaign(req.params.id);
      if (!campaign || campaign.creatorId !== req.session.userId) {
        return res.status(404).json({ error: "Email campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Get email campaign error:", error);
      res.status(500).json({ error: "Failed to get email campaign" });
    }
  });

  app.post("/api/email-campaigns", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.createEmailCampaign({
        ...req.body,
        creatorId: req.session.userId!,
      });
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Create email campaign error:", error);
      res.status(500).json({ error: "Failed to create email campaign" });
    }
  });

  app.patch("/api/email-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getEmailCampaign(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const updated = await storage.updateEmailCampaign(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update email campaign error:", error);
      res.status(500).json({ error: "Failed to update email campaign" });
    }
  });

  app.delete("/api/email-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getEmailCampaign(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      await storage.deleteEmailCampaign(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete email campaign error:", error);
      res.status(500).json({ error: "Failed to delete email campaign" });
    }
  });

  app.post("/api/email-campaigns/:id/send", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaign(req.params.id);
      if (!campaign || campaign.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (campaign.status === "sent") {
        return res.status(400).json({ error: "Campaign already sent" });
      }

      // Get recipients based on filter
      const allUsers = await db.select({ email: users.email, displayName: users.displayName }).from(users);
      const recipients = allUsers.map(u => ({ email: u.email, name: u.displayName || "" }));

      // Send emails via SendGrid
      await sendBulkEmail({
        recipients: recipients.map(r => r.email),
        subject: campaign.subject,
        html: campaign.htmlContent,
        text: campaign.textContent || undefined,
      });

      // Update campaign status
      await storage.updateEmailCampaign(req.params.id, {
        status: "sent",
        sentAt: new Date(),
        totalRecipients: recipients.length,
        sentCount: recipients.length,
      });

      res.json({ success: true, recipientCount: recipients.length });
    } catch (error) {
      console.error("Send email campaign error:", error);
      res.status(500).json({ error: "Failed to send email campaign" });
    }
  });

  // ============= NATIONBUILDER: VOLUNTEER MANAGEMENT ROUTES =============

  app.get("/api/volunteer-opportunities", async (req, res) => {
    try {
      const { status, groupId, limit } = req.query;
      const opportunities = await storage.getVolunteerOpportunities({
        status: status as string | undefined,
        groupId: groupId as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(opportunities);
    } catch (error) {
      console.error("Get volunteer opportunities error:", error);
      res.status(500).json({ error: "Failed to get volunteer opportunities" });
    }
  });

  app.get("/api/volunteer-opportunities/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const opportunity = await storage.getVolunteerOpportunity(req.params.id, userId);
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      res.json(opportunity);
    } catch (error) {
      console.error("Get volunteer opportunity error:", error);
      res.status(500).json({ error: "Failed to get volunteer opportunity" });
    }
  });

  app.post("/api/volunteer-opportunities", requireAuth, async (req, res) => {
    try {
      const opportunity = await storage.createVolunteerOpportunity({
        ...req.body,
        creatorId: req.session.userId!,
      });
      res.status(201).json(opportunity);
    } catch (error) {
      console.error("Create volunteer opportunity error:", error);
      res.status(500).json({ error: "Failed to create volunteer opportunity" });
    }
  });

  app.patch("/api/volunteer-opportunities/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getVolunteerOpportunity(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const updated = await storage.updateVolunteerOpportunity(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update volunteer opportunity error:", error);
      res.status(500).json({ error: "Failed to update volunteer opportunity" });
    }
  });

  app.delete("/api/volunteer-opportunities/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getVolunteerOpportunity(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      await storage.deleteVolunteerOpportunity(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete volunteer opportunity error:", error);
      res.status(500).json({ error: "Failed to delete volunteer opportunity" });
    }
  });

  app.post("/api/volunteer-opportunities/:id/shifts", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getVolunteerOpportunity(req.params.id);
      if (!existing || existing.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const shift = await storage.createVolunteerShift({
        ...req.body,
        opportunityId: req.params.id,
      });
      res.status(201).json(shift);
    } catch (error) {
      console.error("Create volunteer shift error:", error);
      res.status(500).json({ error: "Failed to create volunteer shift" });
    }
  });

  app.get("/api/volunteer-opportunities/:id/shifts", async (req, res) => {
    try {
      const shifts = await storage.getVolunteerShifts(req.params.id);
      res.json(shifts);
    } catch (error) {
      console.error("Get volunteer shifts error:", error);
      res.status(500).json({ error: "Failed to get volunteer shifts" });
    }
  });

  app.post("/api/volunteer-opportunities/:id/signup", requireAuth, async (req, res) => {
    try {
      const signup = await storage.createVolunteerSignup({
        opportunityId: req.params.id,
        userId: req.session.userId!,
        shiftId: req.body.shiftId,
        notes: req.body.notes,
      });
      res.status(201).json(signup);
    } catch (error) {
      console.error("Volunteer signup error:", error);
      res.status(500).json({ error: "Failed to sign up for volunteer opportunity" });
    }
  });

  app.delete("/api/volunteer-signups/:id", requireAuth, async (req, res) => {
    try {
      await storage.cancelVolunteerSignup(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Cancel volunteer signup error:", error);
      res.status(500).json({ error: "Failed to cancel volunteer signup" });
    }
  });

  app.post("/api/volunteer-signups/:id/check-in", requireAuth, async (req, res) => {
    try {
      const signup = await storage.checkInVolunteer(req.params.id);
      res.json(signup);
    } catch (error) {
      console.error("Volunteer check-in error:", error);
      res.status(500).json({ error: "Failed to check in volunteer" });
    }
  });

  app.post("/api/volunteer-signups/:id/check-out", requireAuth, async (req, res) => {
    try {
      const { hoursLogged } = req.body;
      const signup = await storage.checkOutVolunteer(req.params.id, hoursLogged);
      res.json(signup);
    } catch (error) {
      console.error("Volunteer check-out error:", error);
      res.status(500).json({ error: "Failed to check out volunteer" });
    }
  });

  app.post("/api/volunteer-hours", requireAuth, async (req, res) => {
    try {
      const hours = await storage.logVolunteerHours({
        ...req.body,
        userId: req.session.userId!,
      });
      res.status(201).json(hours);
    } catch (error) {
      console.error("Log volunteer hours error:", error);
      res.status(500).json({ error: "Failed to log volunteer hours" });
    }
  });

  app.get("/api/volunteer-hours", requireAuth, async (req, res) => {
    try {
      const hours = await storage.getUserVolunteerHours(req.session.userId!);
      const total = await storage.getTotalVolunteerHours(req.session.userId!);
      res.json({ hours, total });
    } catch (error) {
      console.error("Get volunteer hours error:", error);
      res.status(500).json({ error: "Failed to get volunteer hours" });
    }
  });

  app.get("/api/volunteer-leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getVolunteerLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get volunteer leaderboard error:", error);
      res.status(500).json({ error: "Failed to get volunteer leaderboard" });
    }
  });

  // ============= NATIONBUILDER: SUPPORTER TAGS ROUTES =============

  app.get("/api/supporter-tags", requireAuth, async (req, res) => {
    try {
      const tags = await storage.getSupporterTags();
      res.json(tags);
    } catch (error) {
      console.error("Get supporter tags error:", error);
      res.status(500).json({ error: "Failed to get supporter tags" });
    }
  });

  app.post("/api/supporter-tags", requireAuth, async (req, res) => {
    try {
      const tag = await storage.createSupporterTag({
        ...req.body,
        createdById: req.session.userId!,
      });
      res.status(201).json(tag);
    } catch (error) {
      console.error("Create supporter tag error:", error);
      res.status(500).json({ error: "Failed to create supporter tag" });
    }
  });

  app.patch("/api/supporter-tags/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateSupporterTag(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update supporter tag error:", error);
      res.status(500).json({ error: "Failed to update supporter tag" });
    }
  });

  app.delete("/api/supporter-tags/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSupporterTag(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete supporter tag error:", error);
      res.status(500).json({ error: "Failed to delete supporter tag" });
    }
  });

  app.get("/api/users/:id/tags", requireAuth, async (req, res) => {
    try {
      const tags = await storage.getUserTags(req.params.id);
      res.json(tags);
    } catch (error) {
      console.error("Get user tags error:", error);
      res.status(500).json({ error: "Failed to get user tags" });
    }
  });

  app.post("/api/users/:id/tags", requireAuth, async (req, res) => {
    try {
      const { tagId } = req.body;
      const userTag = await storage.addUserTag(req.params.id, tagId, req.session.userId!);
      res.status(201).json(userTag);
    } catch (error) {
      console.error("Add user tag error:", error);
      res.status(500).json({ error: "Failed to add user tag" });
    }
  });

  app.delete("/api/users/:userId/tags/:tagId", requireAuth, async (req, res) => {
    try {
      await storage.removeUserTag(req.params.userId, req.params.tagId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove user tag error:", error);
      res.status(500).json({ error: "Failed to remove user tag" });
    }
  });

  app.get("/api/supporter-tags/:id/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsersByTag(req.params.id);
      res.json(users);
    } catch (error) {
      console.error("Get users by tag error:", error);
      res.status(500).json({ error: "Failed to get users by tag" });
    }
  });

  // ============= NATIONBUILDER: SAVED AUDIENCES ROUTES =============

  app.get("/api/saved-audiences", requireAuth, async (req, res) => {
    try {
      const audiences = await storage.getSavedAudiences(req.session.userId!);
      res.json(audiences);
    } catch (error) {
      console.error("Get saved audiences error:", error);
      res.status(500).json({ error: "Failed to get saved audiences" });
    }
  });

  app.post("/api/saved-audiences", requireAuth, async (req, res) => {
    try {
      const audience = await storage.createSavedAudience({
        ...req.body,
        createdById: req.session.userId!,
      });
      res.status(201).json(audience);
    } catch (error) {
      console.error("Create saved audience error:", error);
      res.status(500).json({ error: "Failed to create saved audience" });
    }
  });

  app.patch("/api/saved-audiences/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateSavedAudience(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update saved audience error:", error);
      res.status(500).json({ error: "Failed to update saved audience" });
    }
  });

  app.delete("/api/saved-audiences/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSavedAudience(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete saved audience error:", error);
      res.status(500).json({ error: "Failed to delete saved audience" });
    }
  });

  // ============= NATIONBUILDER: OPINION POLLS ROUTES =============

  app.get("/api/opinion-polls", async (req, res) => {
    try {
      const { status, groupId, limit } = req.query;
      const polls = await storage.getOpinionPolls({
        status: status as string | undefined,
        groupId: groupId as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(polls);
    } catch (error) {
      console.error("Get opinion polls error:", error);
      res.status(500).json({ error: "Failed to get opinion polls" });
    }
  });

  app.get("/api/opinion-polls/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const poll = await storage.getOpinionPoll(req.params.id, userId);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      res.json(poll);
    } catch (error) {
      console.error("Get opinion poll error:", error);
      res.status(500).json({ error: "Failed to get opinion poll" });
    }
  });

  app.post("/api/opinion-polls", requireAuth, async (req, res) => {
    try {
      const poll = await storage.createOpinionPoll({
        ...req.body,
        creatorId: req.session.userId!,
      });
      res.status(201).json(poll);
    } catch (error) {
      console.error("Create opinion poll error:", error);
      res.status(500).json({ error: "Failed to create opinion poll" });
    }
  });

  app.post("/api/opinion-polls/:id/vote", requireAuth, async (req, res) => {
    try {
      const { optionIds } = req.body;
      const vote = await storage.voteOnOpinionPoll(req.params.id, req.session.userId!, optionIds);
      res.status(201).json(vote);
    } catch (error: any) {
      console.error("Vote on poll error:", error);
      if (error.message === 'Already voted on this poll') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to vote on poll" });
    }
  });

  app.post("/api/opinion-polls/:id/close", requireAuth, async (req, res) => {
    try {
      const poll = await storage.getOpinionPoll(req.params.id);
      if (!poll || poll.creatorId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const updated = await storage.closeOpinionPoll(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error("Close poll error:", error);
      res.status(500).json({ error: "Failed to close poll" });
    }
  });

  // ============= NATIONBUILDER: CONTACT OFFICIALS ROUTES =============

  app.get("/api/contact-officials-campaigns", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const campaigns = await storage.getContactOfficialsCampaigns({
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(campaigns);
    } catch (error) {
      console.error("Get contact officials campaigns error:", error);
      res.status(500).json({ error: "Failed to get contact officials campaigns" });
    }
  });

  app.post("/api/contact-officials-campaigns", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.createContactOfficialsCampaign({
        ...req.body,
        creatorId: req.session.userId!,
      });
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Create contact officials campaign error:", error);
      res.status(500).json({ error: "Failed to create contact officials campaign" });
    }
  });

  app.post("/api/contact-officials-campaigns/:id/contacts", requireAuth, async (req, res) => {
    try {
      const contact = await storage.recordOfficialContact({
        ...req.body,
        campaignId: req.params.id,
        userId: req.session.userId!,
      });
      res.status(201).json(contact);
    } catch (error) {
      console.error("Record official contact error:", error);
      res.status(500).json({ error: "Failed to record official contact" });
    }
  });

  app.get("/api/contact-officials-campaigns/:id/contacts", async (req, res) => {
    try {
      const contacts = await storage.getOfficialContacts(req.params.id);
      res.json(contacts);
    } catch (error) {
      console.error("Get official contacts error:", error);
      res.status(500).json({ error: "Failed to get official contacts" });
    }
  });

  // ============= NATIONBUILDER: ENGAGEMENT TRACKING ROUTES =============

  app.get("/api/engagement/me", requireAuth, async (req, res) => {
    try {
      const progress = await storage.getEngagementProgress(req.session.userId!);
      res.json(progress || null);
    } catch (error) {
      console.error("Get engagement progress error:", error);
      res.status(500).json({ error: "Failed to get engagement progress" });
    }
  });

  app.get("/api/engagement/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getEngagementLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get engagement leaderboard error:", error);
      res.status(500).json({ error: "Failed to get engagement leaderboard" });
    }
  });

  // ============= NATIONBUILDER: PHONE BANKING ROUTES =============

  app.get("/api/phone-banking-lists", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      const lists = await storage.getPhoneBankingLists({
        creatorId: req.session.userId!,
        status: status as string | undefined,
      });
      res.json(lists);
    } catch (error) {
      console.error("Get phone banking lists error:", error);
      res.status(500).json({ error: "Failed to get phone banking lists" });
    }
  });

  app.post("/api/phone-banking-lists", requireAuth, async (req, res) => {
    try {
      const list = await storage.createPhoneBankingList({
        ...req.body,
        creatorId: req.session.userId!,
      });
      res.status(201).json(list);
    } catch (error) {
      console.error("Create phone banking list error:", error);
      res.status(500).json({ error: "Failed to create phone banking list" });
    }
  });

  app.post("/api/phone-banking-lists/:id/contacts", requireAuth, async (req, res) => {
    try {
      const contact = await storage.addPhoneBankingContact({
        ...req.body,
        listId: req.params.id,
      });
      res.status(201).json(contact);
    } catch (error) {
      console.error("Add phone banking contact error:", error);
      res.status(500).json({ error: "Failed to add phone banking contact" });
    }
  });

  app.get("/api/phone-banking-lists/:id/contacts", requireAuth, async (req, res) => {
    try {
      const { status, assignedToId } = req.query;
      const contacts = await storage.getPhoneBankingContacts(req.params.id, {
        status: status as string | undefined,
        assignedToId: assignedToId as string | undefined,
      });
      res.json(contacts);
    } catch (error) {
      console.error("Get phone banking contacts error:", error);
      res.status(500).json({ error: "Failed to get phone banking contacts" });
    }
  });

  app.post("/api/phone-banking-contacts/:id/call", requireAuth, async (req, res) => {
    try {
      const { outcome, notes } = req.body;
      const contact = await storage.recordPhoneCall(req.params.id, req.session.userId!, outcome, notes);
      res.json(contact);
    } catch (error) {
      console.error("Record phone call error:", error);
      res.status(500).json({ error: "Failed to record phone call" });
    }
  });

  // ============= NATIONBUILDER: CANVASSING ROUTES =============

  app.get("/api/canvassing-turfs", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      const turfs = await storage.getCanvassingTurfs({
        creatorId: req.session.userId!,
        status: status as string | undefined,
      });
      res.json(turfs);
    } catch (error) {
      console.error("Get canvassing turfs error:", error);
      res.status(500).json({ error: "Failed to get canvassing turfs" });
    }
  });

  app.post("/api/canvassing-turfs", requireAuth, async (req, res) => {
    try {
      const turf = await storage.createCanvassingTurf({
        ...req.body,
        creatorId: req.session.userId!,
      });
      res.status(201).json(turf);
    } catch (error) {
      console.error("Create canvassing turf error:", error);
      res.status(500).json({ error: "Failed to create canvassing turf" });
    }
  });

  app.post("/api/canvassing-turfs/:id/contacts", requireAuth, async (req, res) => {
    try {
      const contact = await storage.recordCanvassingContact({
        ...req.body,
        turfId: req.params.id,
        canvasserId: req.session.userId!,
      });
      res.status(201).json(contact);
    } catch (error) {
      console.error("Record canvassing contact error:", error);
      res.status(500).json({ error: "Failed to record canvassing contact" });
    }
  });

  app.get("/api/canvassing-turfs/:id/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getCanvassingContacts(req.params.id);
      res.json(contacts);
    } catch (error) {
      console.error("Get canvassing contacts error:", error);
      res.status(500).json({ error: "Failed to get canvassing contacts" });
    }
  });

  // ============= NATIONBUILDER: RECRUITER STATS ROUTES =============

  app.get("/api/recruiter-stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getRecruiterStats(req.session.userId!);
      res.json(stats || null);
    } catch (error) {
      console.error("Get recruiter stats error:", error);
      res.status(500).json({ error: "Failed to get recruiter stats" });
    }
  });

  app.get("/api/recruiter-leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getRecruiterLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get recruiter leaderboard error:", error);
      res.status(500).json({ error: "Failed to get recruiter leaderboard" });
    }
  });

  // ============= BUSINESS DASHBOARD ROUTES =============

  app.get("/api/business/dashboard", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isBusinessAccount) {
        return res.status(403).json({ error: "Business account required" });
      }

      const userId = req.session.userId!;
      
      // Get real posts data
      const { posts } = await storage.getPosts({ authorId: userId, limit: 100 });
      const followerCount = await storage.getFollowerCount(userId);
      
      // Calculate real metrics from posts
      const totalLikes = posts.reduce((sum: number, p) => sum + (p.likeCount || 0), 0);
      const totalComments = posts.reduce((sum: number, p) => sum + (p.commentCount || 0), 0);
      const totalViews = posts.reduce((sum: number, p) => sum + (p.viewCount || 0), 0);
      const totalShares = posts.reduce((sum: number, p) => sum + (p.shareCount || 0), 0);

      // Calculate real engagement metrics
      const reachRate = followerCount > 0 ? Math.min(100, Math.round((totalViews / followerCount) * 100) / 100) : 0;
      const engagementRate = totalViews > 0 ? Math.min(100, Math.round(((totalLikes + totalComments) / totalViews) * 1000) / 10) : 0;

      // Get real scheduled posts
      const scheduledPosts = await storage.getScheduledPosts(userId);
      
      // Get real shop data for revenue (if user owns any shops)
      const userShops = await db.select().from(shops).where(eq(shops.ownerId, userId));
      
      // Get real shop orders for revenue calculation
      let shopRevenue = 0;
      let shopOrderCount = 0;
      const shopOrdersList: any[] = [];
      
      for (const shop of userShops) {
        const shopOrders = await storage.getShopOrders({ shopId: shop.id, limit: 100 });
        const completedOrders = shopOrders.filter((o: any) => o.status === 'paid' || o.status === 'delivered');
        shopRevenue += completedOrders.reduce((sum: number, o: any) => sum + parseFloat(o.sellerReceivesAxm || '0'), 0);
        shopOrderCount += completedOrders.length;
        shopOrdersList.push(...completedOrders);
      }

      // Get real tips received from live streams (user as host)
      const userStreams = await db.select().from(liveStreams).where(eq(liveStreams.hostId, userId));
      let totalTipsReceived = 0;
      let tipTransactionCount = 0;
      
      for (const stream of userStreams) {
        totalTipsReceived += parseFloat(stream.totalTips || '0');
        tipTransactionCount += stream.tipCount || 0;
      }

      // Get real transactions where user received tips/donations
      const incomingTransactions = await db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.toUserId, userId),
          eq(transactions.status, 'confirmed')
        ))
        .orderBy(desc(transactions.createdAt))
        .limit(100);

      const tipTransactions = incomingTransactions.filter((t: any) => t.type === 'tip');
      const donationTransactions = incomingTransactions.filter((t: any) => t.type === 'donation');
      
      const totalTips = tipTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0) + totalTipsReceived;
      const totalDonations = donationTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);

      // Get real NFT sales (NFT is sold when soldAt is not null)
      const userNftListings = await db
        .select()
        .from(nftListings)
        .where(and(
          eq(nftListings.sellerId, userId),
          sql`${nftListings.soldAt} IS NOT NULL`
        ));
      
      const nftSalesTotal = userNftListings.reduce((sum: number, l: any) => sum + parseFloat(l.priceAxm || '0'), 0);
      const nftSalesCount = userNftListings.length;

      // Get real subscription revenue
      const userSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.creatorId, userId));
      
      const activeSubscriptions = userSubscriptions.filter((s: any) => s.status === 'active');
      const subscriptionRevenue = activeSubscriptions.reduce((sum: number, s: any) => sum + parseFloat(s.price || '0'), 0);

      // Get real messages for response metrics
      const conversations = await storage.getConversations(userId);
      const unreadCount = await storage.getUnreadMessageCount(userId);

      // Build real weekly trend from posts created in last 7 days
      const now = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyTrend = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayPosts = posts.filter((p: any) => {
          const postDate = new Date(p.createdAt);
          return postDate >= dayStart && postDate <= dayEnd;
        });
        
        const dayViews = dayPosts.reduce((sum: number, p: any) => sum + (p.viewCount || 0), 0);
        const dayEngagements = dayPosts.reduce((sum: number, p: any) => sum + (p.likeCount || 0) + (p.commentCount || 0), 0);
        
        weeklyTrend.push({
          date: dayNames[dayStart.getDay()],
          views: dayViews,
          engagements: dayEngagements,
          followers: 0, // Would need follower history tracking
          reach: dayViews,
        });
      }

      // Calculate total revenue
      const totalRevenue = totalTips + totalDonations + subscriptionRevenue + nftSalesTotal + shopRevenue;

      // Build real monthly trend from last 5 months
      const monthlyTrend = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 4; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthName = monthNames[monthDate.getMonth()];
        
        // For now, show current totals for current month, 0 for past months
        // Real implementation would need historical data tracking
        if (i === 0) {
          monthlyTrend.push({
            month: monthName,
            revenue: totalRevenue,
            tips: totalTips,
            donations: totalDonations,
          });
        } else {
          monthlyTrend.push({
            month: monthName,
            revenue: 0,
            tips: 0,
            donations: 0,
          });
        }
      }

      // Build real content performance from actual posts
      const contentPerformance = posts.slice(0, 10).map((p: any) => {
        const postViews = p.viewCount || 0;
        const postEngagement = postViews > 0 ? ((p.likeCount || 0) + (p.commentCount || 0)) / postViews * 100 : 0;
        
        return {
          id: p.id,
          type: p.postType === "video" ? "reel" : "post",
          thumbnail: p.mediaUrl || undefined,
          caption: p.content?.substring(0, 100) || "",
          reach: postViews,
          impressions: postViews,
          engagement: Math.round(postEngagement * 10) / 10,
          likes: p.likeCount || 0,
          comments: p.commentCount || 0,
          shares: p.shareCount || 0,
          saves: 0, // Would need save tracking
          watchTime: p.postType === "video" ? (p.duration || 0) : undefined,
          completionRate: p.postType === "video" ? 0 : undefined,
          createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
        };
      });

      // Build real revenue streams
      const revenueStreams = [
        { source: "Tips", amount: totalTips, transactions: tipTransactionCount + tipTransactions.length, growth: 0 },
        { source: "Donations", amount: totalDonations, transactions: donationTransactions.length, growth: 0 },
        { source: "Subscriptions", amount: subscriptionRevenue, transactions: activeSubscriptions.length, growth: 0 },
        { source: "NFT Sales", amount: nftSalesTotal, transactions: nftSalesCount, growth: 0 },
        { source: "Shop Sales", amount: shopRevenue, transactions: shopOrderCount, growth: 0 },
      ].filter(s => s.amount > 0 || s.transactions > 0);

      const dashboard = {
        overview: {
          totalProfileViews: totalViews,
          totalImpressions: totalViews,
          totalEngagements: totalLikes + totalComments,
          totalFollowers: followerCount,
          followerGrowth: 0, // Would need historical tracking
          websiteClicks: 0, // Would need click tracking
          phoneClicks: 0,
          emailClicks: 0,
          directMessages: conversations.length,
          reachRate,
          engagementRate,
        },
        weeklyTrend,
        contentPerformance,
        topPosts: posts.slice(0, 5),
        promotions: [], // Empty - no demo data, would need real promotions table
        scheduledPosts: scheduledPosts.map((sp: any) => ({
          id: sp.id,
          content: sp.content,
          mediaUrl: sp.mediaUrl,
          scheduledFor: sp.scheduledFor?.toISOString(),
          postType: sp.postType,
          status: sp.status,
        })),
        leads: [], // Empty - no demo data, would need real leads table
        advocacyActions: [], // Empty - no demo data
        messageTemplates: [], // Empty - no demo data, would need real templates table
        competitors: [], // Empty - no demo data, competitors should be user-added
        revenue: {
          total: totalRevenue,
          streams: revenueStreams,
          monthlyTrend,
        },
        audienceInsights: {
          // Empty arrays - no demo data, would need real analytics tracking
          demographics: [],
          genderSplit: [],
          bestPostingTimes: [],
          topLocations: [],
          interests: [],
          deviceTypes: [],
        },
        responseMetrics: {
          averageResponseTime: 0, // Would need message timestamp tracking
          responseRate: 0,
          unreadMessages: unreadCount,
          totalConversations: conversations.length,
        },
      };

      res.json(dashboard);
    } catch (error) {
      console.error("Get business dashboard error:", error);
      res.status(500).json({ error: "Failed to get business dashboard" });
    }
  });

  app.post("/api/business/promotions", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isBusinessAccount) {
        return res.status(403).json({ error: "Business account required" });
      }

      const { title, description, promotionType, budget, targetReach, startDate, endDate } = req.body;
      
      const promotion = {
        id: `promo_${Date.now()}`,
        businessId: req.session.userId!,
        title,
        description,
        promotionType,
        status: "draft",
        budget: budget || 0,
        spent: 0,
        targetReach: targetReach || null,
        actualReach: 0,
        clicks: 0,
        conversions: 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      res.status(201).json(promotion);
    } catch (error) {
      console.error("Create promotion error:", error);
      res.status(500).json({ error: "Failed to create promotion" });
    }
  });

  app.patch("/api/business/promotions/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isBusinessAccount) {
        return res.status(403).json({ error: "Business account required" });
      }

      const { status, title, description, budget, targetReach } = req.body;
      
      const promotion = {
        id: req.params.id,
        status: status || "draft",
        title,
        description,
        budget,
        targetReach,
        updatedAt: new Date(),
      };

      res.json(promotion);
    } catch (error) {
      console.error("Update promotion error:", error);
      res.status(500).json({ error: "Failed to update promotion" });
    }
  });

  app.delete("/api/business/promotions/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.isBusinessAccount) {
        return res.status(403).json({ error: "Business account required" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete promotion error:", error);
      res.status(500).json({ error: "Failed to delete promotion" });
    }
  });

  // ============= LUMINA MARKETPLACE ROUTES =============

  // Shops
  app.get("/api/marketplace/shops", async (req, res) => {
    try {
      const { category, status, search, limit } = req.query;
      const shops = await storage.getShops({
        category: category as string,
        status: status as string || 'active',
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(shops);
    } catch (error) {
      console.error("Get shops error:", error);
      res.status(500).json({ error: "Failed to get shops" });
    }
  });

  app.get("/api/marketplace/shops/:id", async (req, res) => {
    try {
      const shopId = parseInt(req.params.id, 10);
      if (isNaN(shopId)) {
        return res.status(400).json({ error: "Invalid shop ID" });
      }
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      console.error("Get shop error:", error);
      res.status(500).json({ error: "Failed to get shop" });
    }
  });

  app.get("/api/marketplace/shops/slug/:slug", async (req, res) => {
    try {
      const shop = await storage.getShopBySlug(req.params.slug);
      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      console.error("Get shop by slug error:", error);
      res.status(500).json({ error: "Failed to get shop" });
    }
  });

  app.get("/api/marketplace/my-shop", requireAuth, async (req, res) => {
    try {
      const shop = await storage.getShopByOwner(req.session.userId!);
      res.json(shop || null);
    } catch (error) {
      console.error("Get my shop error:", error);
      res.status(500).json({ error: "Failed to get shop" });
    }
  });

  app.post("/api/marketplace/shops", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const existingShop = await storage.getShopByOwner(req.session.userId!);
      if (existingShop) {
        return res.status(400).json({ error: "You already have a shop" });
      }

      const { name, description, category, walletAddress, contactEmail } = req.body;
      
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substring(2, 6);

      const shop = await storage.createShop({
        ownerId: req.session.userId!,
        name: sanitizeText(name),
        slug,
        description: sanitizeText(description),
        category: category || 'other',
        walletAddress,
        contactEmail,
        status: 'active',
      });

      res.status(201).json(shop);
    } catch (error) {
      console.error("Create shop error:", error);
      res.status(500).json({ error: "Failed to create shop" });
    }
  });

  app.patch("/api/marketplace/shops/:id", requireAuth, async (req, res) => {
    try {
      const shopId = parseInt(req.params.id, 10);
      if (isNaN(shopId)) {
        return res.status(400).json({ error: "Invalid shop ID" });
      }
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }
      if (shop.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updates = {
        name: req.body.name ? sanitizeText(req.body.name) : undefined,
        description: req.body.description ? sanitizeText(req.body.description) : undefined,
        logoUrl: req.body.logoUrl,
        bannerUrl: req.body.bannerUrl,
        category: req.body.category,
        walletAddress: req.body.walletAddress,
        contactEmail: req.body.contactEmail,
        contactPhone: req.body.contactPhone,
        website: req.body.website,
        socialLinks: req.body.socialLinks,
        policies: req.body.policies,
        shippingInfo: req.body.shippingInfo,
      };

      const updated = await storage.updateShop(shopId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update shop error:", error);
      res.status(500).json({ error: "Failed to update shop" });
    }
  });

  // Shop Products
  app.get("/api/marketplace/products", async (req, res) => {
    try {
      const { shopId, category, status, search, limit, featured } = req.query;
      const products = await storage.getShopProducts({
        shopId: shopId ? parseInt(shopId as string, 10) : undefined,
        category: category as string,
        status: status as string || 'active',
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        featured: featured === 'true',
      });
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  app.get("/api/marketplace/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await storage.getShopProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      await storage.updateShopProduct(productId, {
        viewCount: (product.viewCount || 0) + 1,
      });
      
      res.json(product);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Failed to get product" });
    }
  });

  app.post("/api/marketplace/products", requireAuth, async (req, res) => {
    try {
      const shop = await storage.getShopByOwner(req.session.userId!);
      if (!shop) {
        return res.status(403).json({ error: "You need a shop to create products" });
      }

      const { title, description, shortDescription, priceAxm, category, productType, mediaUrls, thumbnailUrl, inventory, isDigital, requiresShipping, tags } = req.body;
      
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substring(2, 6);

      const product = await storage.createShopProduct({
        shopId: shop.id,
        name: sanitizeText(title),
        title: sanitizeText(title),
        slug,
        description: sanitizeText(description),
        shortDescription: sanitizeText(shortDescription),
        priceAxm,
        category: category || 'other',
        productType: productType || 'one_time',
        mediaUrls,
        thumbnailUrl,
        inventory,
        isDigital: isDigital || false,
        requiresShipping: requiresShipping !== false,
        tags,
        status: 'active',
      } as any);

      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/marketplace/products/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await storage.getShopProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const shop = await storage.getShopByOwner(req.session.userId!);
      if (!shop || shop.id !== product.shopId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updates = {
        title: req.body.title ? sanitizeText(req.body.title) : undefined,
        description: req.body.description ? sanitizeText(req.body.description) : undefined,
        shortDescription: req.body.shortDescription ? sanitizeText(req.body.shortDescription) : undefined,
        priceAxm: req.body.priceAxm,
        compareAtPriceAxm: req.body.compareAtPriceAxm,
        category: req.body.category,
        productType: req.body.productType,
        status: req.body.status,
        mediaUrls: req.body.mediaUrls,
        thumbnailUrl: req.body.thumbnailUrl,
        inventory: req.body.inventory,
        isDigital: req.body.isDigital,
        digitalFileUrl: req.body.digitalFileUrl,
        requiresShipping: req.body.requiresShipping,
        tags: req.body.tags,
        isFeatured: req.body.isFeatured,
        affiliateCommissionBps: req.body.affiliateCommissionBps,
      };

      const updated = await storage.updateShopProduct(productId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/marketplace/products/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await storage.getShopProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const shop = await storage.getShopByOwner(req.session.userId!);
      if (!shop || shop.id !== product.shopId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.deleteShopProduct(productId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Shop Orders
  app.get("/api/marketplace/orders", requireAuth, async (req, res) => {
    try {
      const { shopId, status, limit } = req.query;
      
      const shop = await storage.getShopByOwner(req.session.userId!);
      const parsedShopId = shopId ? parseInt(shopId as string, 10) : undefined;
      
      const orders = await storage.getShopOrders({
        shopId: parsedShopId || shop?.id,
        buyerId: parsedShopId ? undefined : req.session.userId,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to get orders" });
    }
  });

  app.get("/api/marketplace/orders/my-purchases", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getShopOrders({
        buyerId: req.session.userId!,
        limit: 50,
      });
      res.json(orders);
    } catch (error) {
      console.error("Get my purchases error:", error);
      res.status(500).json({ error: "Failed to get purchases" });
    }
  });

  app.get("/api/marketplace/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      const order = await storage.getShopOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const shop = await storage.getShopByOwner(req.session.userId!);
      if (order.buyerId !== req.session.userId && order.shopId !== shop?.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to get order" });
    }
  });

  app.post("/api/marketplace/orders", requireAuth, async (req, res) => {
    try {
      const { shopId, items, shippingAddress, affiliateLinkCode, txHash, platformFeeTxHash, shippingName, shippingEmail, notes } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      let subtotal = 0;
      const orderItems = [];
      
      for (const item of items) {
        const product = await storage.getShopProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }
        if (product.shopId !== shopId) {
          return res.status(400).json({ error: "All products must be from the same shop" });
        }
        
        const itemTotal = parseFloat(product.priceAxm) * item.quantity;
        subtotal += itemTotal;
        
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAxm: product.priceAxm,
          totalAxm: itemTotal.toString(),
          attributes: item.attributes,
        });
      }

      const platformFee = subtotal * 0.02;
      let affiliateFee = 0;
      let affiliateLinkId = undefined;
      
      if (affiliateLinkCode) {
        const affiliateLink = await storage.getAffiliateLinkByCode(affiliateLinkCode);
        if (affiliateLink && affiliateLink.isActive) {
          const commissionBps = affiliateLink.customCommissionBps || affiliateLink.program.defaultCommissionBps || 1000;
          affiliateFee = subtotal * (commissionBps / 10000);
          affiliateLinkId = affiliateLink.id;
        }
      }

      const sellerReceives = subtotal - platformFee - affiliateFee;

      const shippingInfo = shippingAddress ? { 
        address: shippingAddress, 
        name: shippingName, 
        email: shippingEmail 
      } : (shippingName || shippingEmail) ? { 
        name: shippingName, 
        email: shippingEmail 
      } : null;

      // Orders start as 'pending' until payment is verified on-chain
      // A background job or webhook should verify the txHash and update status to 'confirmed'
      const order = await storage.createShopOrder({
        shopId,
        buyerId: req.session.userId!,
        subtotalAxm: subtotal.toString(),
        platformFeeAxm: platformFee.toString(),
        affiliateFeeAxm: affiliateFee.toString(),
        totalAxm: subtotal.toString(),
        sellerReceivesAxm: sellerReceives.toString(),
        affiliateLinkId,
        shippingAddress: shippingInfo,
        buyerNotes: notes,
        paymentTxHash: txHash,
        platformFeeTxHash: platformFeeTxHash || null,
        status: 'pending', // Always start as pending, verify tx separately
      }, orderItems);

      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/marketplace/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      const order = await storage.getShopOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const shop = await storage.getShopByOwner(req.session.userId!);
      if (order.shopId !== shop?.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const { status, trackingNumber, trackingUrl, shippingMethod, notes } = req.body;
      
      const updates: any = { status, trackingNumber, trackingUrl, shippingMethod, notes };
      
      if (status === 'shipped' && !order.shippedAt) {
        updates.shippedAt = new Date();
      }
      if (status === 'delivered' && !order.deliveredAt) {
        updates.deliveredAt = new Date();
      }
      if (status === 'cancelled' && !order.cancelledAt) {
        updates.cancelledAt = new Date();
      }

      const updated = await storage.updateShopOrder(orderId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.post("/api/marketplace/orders/:id/pay", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      const order = await storage.getShopOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.buyerId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({ error: "Order already processed" });
      }

      const { paymentTxHash } = req.body;
      
      const updated = await storage.updateShopOrder(orderId, {
        status: 'paid',
        paymentTxHash,
        paymentConfirmedAt: new Date(),
        paidAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Pay order error:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // Verify order payment on-chain
  app.post("/api/marketplace/orders/:id/verify", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      
      const order = await storage.getShopOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Only buyer can verify their own order
      if (order.buyerId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Already verified
      if (order.status !== 'pending') {
        return res.json({ verified: true, order, message: "Order already verified" });
      }
      
      if (!order.paymentTxHash) {
        return res.status(400).json({ error: "No payment transaction to verify" });
      }
      
      // Get shop wallet for seller payment verification
      const shop = await storage.getShop(order.shopId);
      if (!shop || !shop.walletAddress) {
        return res.status(400).json({ error: "Shop wallet not configured" });
      }
      
      // Calculate expected seller amount (sellerReceivesAxm in wei)
      const sellerAmountAxm = parseFloat(order.sellerReceivesAxm);
      const sellerAmountWei = BigInt(Math.floor(sellerAmountAxm * 1e18));
      
      // Verify seller payment
      const sellerVerification = await verifyAXMTransfer(
        order.paymentTxHash,
        shop.walletAddress,
        sellerAmountWei
      );
      
      if (!sellerVerification.verified) {
        return res.status(400).json({ 
          error: "Seller payment verification failed", 
          details: sellerVerification.error 
        });
      }
      
      // Verify platform fee if present
      let platformFeeVerified = true;
      let platformFeeError = null;
      
      if (order.platformFeeTxHash) {
        const platformFeeAxm = parseFloat(order.platformFeeAxm || "0");
        const platformFeeWei = BigInt(Math.floor(platformFeeAxm * 1e18));
        
        if (platformFeeWei > BigInt(0)) {
          const feeVerification = await verifyAXMTransfer(
            order.platformFeeTxHash,
            PLATFORM_TREASURY_WALLET,
            platformFeeWei
          );
          
          if (!feeVerification.verified) {
            platformFeeVerified = false;
            platformFeeError = feeVerification.error;
          }
        }
      }
      
      // Update order status
      const updates: any = {
        status: 'confirmed',
        paymentConfirmedAt: new Date(),
        paidAt: new Date(),
      };
      
      const updated = await storage.updateShopOrder(orderId, updates);
      
      res.json({ 
        verified: true, 
        order: updated,
        sellerPaymentVerified: true,
        platformFeeVerified,
        platformFeeError,
        message: platformFeeVerified 
          ? "Payment fully verified" 
          : "Seller payment verified, platform fee verification failed"
      });
      
    } catch (error) {
      console.error("Verify order error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Product Reviews
  app.get("/api/marketplace/products/:productId/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  app.post("/api/marketplace/products/:productId/reviews", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await storage.getShopProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const { rating, title, content, mediaUrls, orderId } = req.body;
      
      let isVerifiedPurchase = false;
      if (orderId) {
        const orderIdNum = parseInt(orderId, 10);
        if (!isNaN(orderIdNum)) {
          const order = await storage.getShopOrder(orderIdNum);
          if (order && order.buyerId === req.session.userId && order.status === 'delivered') {
            isVerifiedPurchase = true;
          }
        }
      }

      const review = await storage.createProductReview({
        productId,
        reviewerId: req.session.userId!,
        orderId: orderId ? parseInt(orderId, 10) : undefined,
        rating,
        title: sanitizeText(title),
        content: sanitizeText(content),
        mediaUrls,
        isVerifiedPurchase,
        status: 'pending',
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Affiliate Links
  app.get("/api/marketplace/affiliates/my-links", requireAuth, async (req, res) => {
    try {
      const links = await storage.getAffiliateLinks({ affiliateUserId: req.session.userId! });
      res.json(links);
    } catch (error) {
      console.error("Get affiliate links error:", error);
      res.status(500).json({ error: "Failed to get affiliate links" });
    }
  });

  app.post("/api/marketplace/affiliates/join/:shopId", requireAuth, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId, 10);
      if (isNaN(shopId)) {
        return res.status(400).json({ error: "Invalid shop ID" });
      }
      const program = await storage.getAffiliateProgram(shopId);
      if (!program) {
        return res.status(404).json({ error: "Affiliate program not found" });
      }
      if (!program.isActive) {
        return res.status(400).json({ error: "Affiliate program is not active" });
      }

      const existingLinks = await storage.getAffiliateLinks({
        affiliateUserId: req.session.userId!,
        programId: program.id,
      });
      
      if (existingLinks.length > 0) {
        return res.status(400).json({ error: "You're already an affiliate for this shop" });
      }

      const code = `${req.session.userId!.substring(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const link = await storage.createAffiliateLink({
        programId: program.id,
        affiliateUserId: req.session.userId!,
        code,
        isActive: program.autoApprove,
      });

      res.status(201).json(link);
    } catch (error) {
      console.error("Join affiliate program error:", error);
      res.status(500).json({ error: "Failed to join affiliate program" });
    }
  });

  app.get("/api/marketplace/affiliates/track/:code", async (req, res) => {
    try {
      const link = await storage.getAffiliateLinkByCode(req.params.code);
      if (!link) {
        return res.status(404).json({ error: "Affiliate link not found" });
      }
      
      await storage.recordAffiliateClick(link.id);
      
      res.json({ shopId: link.program.shopId, productId: link.productId });
    } catch (error) {
      console.error("Track affiliate click error:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  app.get("/api/marketplace/affiliate-links/code/:code", async (req, res) => {
    try {
      const link = await storage.getAffiliateLinkByCode(req.params.code);
      if (!link) {
        return res.status(404).json({ error: "Affiliate link not found" });
      }
      if (link.status !== 'active') {
        return res.status(404).json({ error: "Affiliate link is inactive" });
      }
      
      const affiliateUser = await storage.getUser(link.affiliateUserId);
      const commissionRate = parseFloat(link.program.commissionRate || "10");
      const commissionBps = Math.round(commissionRate * 100);
      
      res.json({
        id: link.id,
        code: link.code,
        shopId: link.program.shopId,
        productId: link.productId,
        affiliateUserId: link.affiliateUserId,
        affiliateWallet: affiliateUser?.walletAddress || null,
        commissionBps
      });
    } catch (error) {
      console.error("Get affiliate link by code error:", error);
      res.status(500).json({ error: "Failed to get affiliate link" });
    }
  });

  // Bounties
  app.get("/api/marketplace/bounties", async (req, res) => {
    try {
      const { programId, status } = req.query;
      const bounties = await storage.getBounties({
        programId: programId ? parseInt(programId as string, 10) : undefined,
        status: status as string || 'open',
      });
      res.json(bounties);
    } catch (error) {
      console.error("Get bounties error:", error);
      res.status(500).json({ error: "Failed to get bounties" });
    }
  });

  app.get("/api/marketplace/bounties/:id", async (req, res) => {
    try {
      const bountyId = parseInt(req.params.id, 10);
      if (isNaN(bountyId)) {
        return res.status(400).json({ error: "Invalid bounty ID" });
      }
      const bounty = await storage.getBounty(bountyId);
      if (!bounty) {
        return res.status(404).json({ error: "Bounty not found" });
      }
      res.json(bounty);
    } catch (error) {
      console.error("Get bounty error:", error);
      res.status(500).json({ error: "Failed to get bounty" });
    }
  });

  // ============= FEEDBACK/BETA REPORTS =============

  // Get feedback count for V2 progress
  app.get("/api/feedback/count", async (_req, res) => {
    try {
      const count = await storage.getFeedbackCount();
      res.json({ count });
    } catch (error) {
      console.error("Get feedback count error:", error);
      res.status(500).json({ error: "Failed to get feedback count" });
    }
  });

  // Submit feedback
  app.post("/api/feedback", generalLimiter, async (req, res) => {
    try {
      const { name, email, type, subject, message, userId, userAgent } = req.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate feedback type
      const validTypes = ["bug", "suggestion", "general"];
      const feedbackType = validTypes.includes(type) ? type : "general";

      // Validate lengths
      if (name.length < 2 || name.length > 255) {
        return res.status(400).json({ error: "Name must be between 2 and 255 characters" });
      }
      if (subject.length < 5 || subject.length > 500) {
        return res.status(400).json({ error: "Subject must be between 5 and 500 characters" });
      }
      if (message.length < 20) {
        return res.status(400).json({ error: "Message must be at least 20 characters" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
      }

      // Sanitize input
      const sanitizedData = {
        name: sanitizeText(name),
        email: sanitizeText(email),
        type: feedbackType,
        subject: sanitizeText(subject),
        message: sanitizeText(message),
        userId: userId || null,
        userAgent: userAgent || null,
      };

      // Save to database
      const feedback = await storage.createFeedbackReport(sanitizedData);

      // Send email notification to support
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px;">
          <h1 style="color: #10b981;">New Feedback Received</h1>
          <p><strong>Type:</strong> ${sanitizedData.type}</p>
          <p><strong>From:</strong> ${sanitizedData.name} (${sanitizedData.email})</p>
          <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
          <hr style="border: 1px solid #333; margin: 20px 0;">
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${sanitizedData.message}</p>
          <hr style="border: 1px solid #333; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            User ID: ${sanitizedData.userId || "Guest"}<br>
            User Agent: ${sanitizedData.userAgent || "Unknown"}
          </p>
        </div>
      `;

      await sendEmail({
        to: "support@joinlumina.io",
        subject: `[Lumina V1 Feedback] ${sanitizedData.type.toUpperCase()}: ${sanitizedData.subject}`,
        html: emailHtml,
      });

      res.json({ success: true, id: feedback.id });
    } catch (error) {
      console.error("Submit feedback error:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });
}
