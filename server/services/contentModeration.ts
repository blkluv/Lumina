import OpenAI from "openai";
import { db } from "../db";
import { 
  contentViolations, 
  userWarnings, 
  moderationActions, 
  moderationQueue,
  users,
  posts,
  comments,
  notifications
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Lumina Platform Content Policy
const CONTENT_POLICY = `
You are a content moderation AI for Lumina, a Web3 social media platform.

Lumina's MISSION:
The platform is designed to uplift humanity through righteous, moral, noble, religious, ethical, educational, financial, technological, scientific, and crypto-focused content.

STRICTLY PROHIBITED CONTENT:
1. NUDITY - Any naked or sexually explicit imagery
2. VIOLENCE - Violent content, threats, or content promoting harm
3. INAPPROPRIATE_DANCE - Twerking or sexually suggestive dance content
4. EXPLICIT_CONTENT - Sexual content, pornography, or adult material
5. HARASSMENT - Bullying, personal attacks, or targeted harassment
6. HATE_SPEECH - Discrimination, racism, or hateful content toward any group
7. MISINFORMATION - Deliberately false or misleading information
8. SPAM - Repetitive, promotional, or deceptive content

ENCOURAGED CONTENT:
- Educational and informational content
- Religious and spiritual growth discussions
- Financial literacy and crypto education
- Scientific discoveries and technology
- Moral and ethical discussions
- Community building and positive engagement

RESPONSE FORMAT (JSON):
{
  "isViolation": boolean,
  "violationType": "nudity" | "violence" | "harassment" | "hate_speech" | "inappropriate_dance" | "explicit_content" | "spam" | "misinformation" | "copyright" | "other" | null,
  "severity": "low" | "medium" | "high" | "critical",
  "confidenceScore": number (0-100),
  "explanation": string,
  "suggestedAction": "approve" | "flag_for_review" | "remove" | "warn_user"
}
`;

interface ModerationResult {
  isViolation: boolean;
  violationType: string | null;
  severity: "low" | "medium" | "high" | "critical";
  confidenceScore: number;
  explanation: string;
  suggestedAction: "approve" | "flag_for_review" | "remove" | "warn_user";
}

export class ContentModerationService {
  
  async analyzeTextContent(text: string): Promise<ModerationResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: CONTENT_POLICY },
          { 
            role: "user", 
            content: `Analyze the following content for policy violations:\n\n"${text}"\n\nRespond ONLY with valid JSON matching the specified format.`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      return {
        isViolation: result.isViolation || false,
        violationType: result.violationType || null,
        severity: result.severity || "low",
        confidenceScore: result.confidenceScore || 0,
        explanation: result.explanation || "",
        suggestedAction: result.suggestedAction || "approve"
      };
    } catch (error) {
      console.error("Error analyzing text content:", error);
      return {
        isViolation: false,
        violationType: null,
        severity: "low",
        confidenceScore: 0,
        explanation: "Analysis failed - defaulting to manual review",
        suggestedAction: "flag_for_review"
      };
    }
  }

  async analyzeImageContent(imageUrl: string, caption?: string): Promise<ModerationResult> {
    try {
      const messages: any[] = [
        { role: "system", content: CONTENT_POLICY },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl }
            },
            {
              type: "text",
              text: `Analyze this image for content policy violations. ${caption ? `Caption: "${caption}"` : ""}\n\nCheck specifically for: nudity, violence, inappropriate dancing (twerking), explicit content, or any content that doesn't align with uplifting, moral, and educational values.\n\nRespond ONLY with valid JSON matching the specified format.`
            }
          ]
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages,
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      return {
        isViolation: result.isViolation || false,
        violationType: result.violationType || null,
        severity: result.severity || "low",
        confidenceScore: result.confidenceScore || 0,
        explanation: result.explanation || "",
        suggestedAction: result.suggestedAction || "approve"
      };
    } catch (error) {
      console.error("Error analyzing image content:", error);
      return {
        isViolation: false,
        violationType: null,
        severity: "low",
        confidenceScore: 0,
        explanation: "Image analysis failed - defaulting to manual review",
        suggestedAction: "flag_for_review"
      };
    }
  }

  async moderatePost(postId: string, userId: string, content: string, mediaUrl?: string): Promise<{
    approved: boolean;
    violationId?: string;
    warningIssued?: boolean;
  }> {
    let result: ModerationResult;

    if (mediaUrl) {
      result = await this.analyzeImageContent(mediaUrl, content);
    } else {
      result = await this.analyzeTextContent(content);
    }

    if (!result.isViolation) {
      return { approved: true };
    }

    const violationRecord = await db.insert(contentViolations).values({
      postId,
      userId,
      violationType: result.violationType as any || "other",
      severity: result.severity,
      status: result.suggestedAction === "remove" ? "removed" : "flagged",
      aiConfidenceScore: result.confidenceScore,
      aiAnalysis: result.explanation,
      contentSnapshot: content,
      mediaUrl,
    }).returning();

    const violation = violationRecord[0];

    if (result.suggestedAction === "remove") {
      await this.issueWarning(userId, violation.id, result.violationType || "other", result.explanation);
      await db.delete(posts).where(eq(posts.id, postId));
      
      return { 
        approved: false, 
        violationId: violation.id,
        warningIssued: true 
      };
    }

    if (result.suggestedAction === "warn_user") {
      await this.issueWarning(userId, violation.id, result.violationType || "other", result.explanation);
      
      return { 
        approved: false, 
        violationId: violation.id,
        warningIssued: true 
      };
    }

    return { 
      approved: true, 
      violationId: violation.id 
    };
  }

  async moderateComment(commentId: string, userId: string, content: string): Promise<{
    approved: boolean;
    violationId?: string;
    warningIssued?: boolean;
  }> {
    const result = await this.analyzeTextContent(content);

    if (!result.isViolation) {
      return { approved: true };
    }

    const violationRecord = await db.insert(contentViolations).values({
      commentId,
      userId,
      violationType: result.violationType as any || "other",
      severity: result.severity,
      status: result.suggestedAction === "remove" ? "removed" : "flagged",
      aiConfidenceScore: result.confidenceScore,
      aiAnalysis: result.explanation,
      contentSnapshot: content,
    }).returning();

    const violation = violationRecord[0];

    if (result.suggestedAction === "remove") {
      await this.issueWarning(userId, violation.id, result.violationType || "other", result.explanation);
      await db.delete(comments).where(eq(comments.id, commentId));
      
      return { 
        approved: false, 
        violationId: violation.id,
        warningIssued: true 
      };
    }

    if (result.suggestedAction === "warn_user") {
      await this.issueWarning(userId, violation.id, result.violationType || "other", result.explanation);
      
      return { 
        approved: false, 
        violationId: violation.id,
        warningIssued: true 
      };
    }

    return { 
      approved: true, 
      violationId: violation.id 
    };
  }

  async issueWarning(userId: string, violationId: string, violationType: string, reason: string): Promise<{
    warningNumber: number;
    accountBanned: boolean;
  }> {
    const existingWarnings = await db.select()
      .from(userWarnings)
      .where(eq(userWarnings.userId, userId))
      .orderBy(desc(userWarnings.warningNumber));

    const warningNumber = (existingWarnings[0]?.warningNumber || 0) + 1;

    await db.insert(userWarnings).values({
      userId,
      violationId,
      warningNumber,
      reason,
      violationType: violationType as any,
    });

    await db.insert(moderationActions).values({
      actionType: "warning_issued",
      targetUserId: userId,
      violationId,
      isAutomated: true,
      reason: `Automated warning #${warningNumber}: ${reason}`,
    });

    await db.insert(notifications).values({
      userId,
      type: "moderation_warning",
      title: `Content Warning #${warningNumber}`,
      message: `Your content has been flagged for violating our community guidelines: ${reason}. You have ${3 - warningNumber} warning(s) remaining before account suspension.`,
      data: { warningNumber, violationType, violationId },
    });

    if (warningNumber >= 3) {
      await db.update(users)
        .set({ isActive: false })
        .where(eq(users.id, userId));

      await db.insert(moderationActions).values({
        actionType: "account_banned",
        targetUserId: userId,
        violationId,
        isAutomated: true,
        reason: "Account banned after 3 content violations",
      });

      await db.insert(notifications).values({
        userId,
        type: "account_banned",
        title: "Account Suspended",
        message: "Your account has been suspended due to repeated content policy violations. You may appeal this decision through our support system.",
        data: { warningNumber: 3 },
      });

      return { warningNumber: 3, accountBanned: true };
    }

    return { warningNumber, accountBanned: false };
  }

  async getUserWarnings(userId: string): Promise<{
    totalWarnings: number;
    warnings: any[];
    remainingStrikes: number;
  }> {
    const warnings = await db.select()
      .from(userWarnings)
      .where(eq(userWarnings.userId, userId))
      .orderBy(desc(userWarnings.createdAt));

    return {
      totalWarnings: warnings.length,
      warnings,
      remainingStrikes: Math.max(0, 3 - warnings.length),
    };
  }

  async getViolationStats(): Promise<{
    totalViolations: number;
    pendingReview: number;
    byType: Record<string, number>;
    recentViolations: any[];
  }> {
    const allViolations = await db.select()
      .from(contentViolations)
      .orderBy(desc(contentViolations.createdAt));

    const pendingViolations = allViolations.filter(v => v.status === "pending" || v.status === "flagged");

    const byType: Record<string, number> = {};
    allViolations.forEach(v => {
      byType[v.violationType] = (byType[v.violationType] || 0) + 1;
    });

    return {
      totalViolations: allViolations.length,
      pendingReview: pendingViolations.length,
      byType,
      recentViolations: allViolations.slice(0, 10),
    };
  }

  async resolveViolation(violationId: string, reviewerId: string, action: "approve" | "remove" | "warn", notes?: string): Promise<void> {
    const [violation] = await db.select()
      .from(contentViolations)
      .where(eq(contentViolations.id, violationId));

    if (!violation) return;

    let status: "pending" | "flagged" | "approved" | "removed" | "appealed";
    switch (action) {
      case "approve":
        status = "approved";
        break;
      case "warn":
        status = "flagged";
        break;
      case "remove":
        status = "removed";
        break;
      default:
        status = "approved";
    }

    await db.update(contentViolations)
      .set({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      })
      .where(eq(contentViolations.id, violationId));

    if (action === "warn") {
      await this.issueWarning(
        violation.userId, 
        violationId, 
        violation.violationType,
        notes || `Warning issued: ${violation.violationType} violation detected`
      );
    }

    if (action === "remove") {
      if (violation.postId) {
        await db.delete(posts).where(eq(posts.id, violation.postId));
      }
      if (violation.commentId) {
        await db.delete(comments).where(eq(comments.id, violation.commentId));
      }

      await this.issueWarning(
        violation.userId, 
        violationId, 
        violation.violationType,
        notes || `Content removed by moderator: ${violation.violationType} violation`
      );
    }
  }

  async addToModerationQueue(postId: string | null, commentId: string | null, userId: string, contentType: string, priority: number = 0): Promise<void> {
    await db.insert(moderationQueue).values({
      postId,
      commentId,
      userId,
      contentType,
      priority,
      humanReviewRequired: true,
    });
  }

  async getModerationQueue(limit: number = 50): Promise<any[]> {
    const queue = await db.select({
      queue: moderationQueue,
      user: users,
    })
    .from(moderationQueue)
    .leftJoin(users, eq(moderationQueue.userId, users.id))
    .where(eq(moderationQueue.aiProcessed, false))
    .orderBy(desc(moderationQueue.priority), moderationQueue.createdAt)
    .limit(limit);

    return queue;
  }
}

export const contentModerationService = new ContentModerationService();
