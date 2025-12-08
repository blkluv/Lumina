import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const postVisibilityEnum = pgEnum("post_visibility", ["public", "followers"]);
export const postTypeEnum = pgEnum("post_type", ["text", "image", "video"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["tip", "reward_claim", "transfer"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "confirmed", "failed"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "resolved", "dismissed"]);
export const reportTypeEnum = pgEnum("report_type", ["spam", "harassment", "inappropriate", "copyright", "other"]);
export const verificationStatusEnum = pgEnum("verification_status", ["none", "pending", "verified", "rejected"]);
export const rewardEventTypeEnum = pgEnum("reward_event_type", [
  "post_created",
  "received_like",
  "received_comment",
  "received_follow",
  "video_watched",
  "tip_sent",
  "tip_received",
  "daily_login",
  "quest_completed",
  "achievement_unlocked",
  "streak_bonus",
  "referral_bonus",
  "live_stream_tip",
  "points_claimed",
  "points_converted"
]);

export const questTypeEnum = pgEnum("quest_type", ["daily", "weekly", "special"]);
export const questStatusEnum = pgEnum("quest_status", ["active", "completed", "expired"]);
export const achievementCategoryEnum = pgEnum("achievement_category", [
  "content", "social", "engagement", "milestone", "special"
]);
export const streamStatusEnum = pgEnum("stream_status", ["live", "ended", "scheduled"]);
export const businessCategoryEnum = pgEnum("business_category", [
  "creator", "brand", "restaurant", "retail", "service", "entertainment", "education", "other"
]);

// Content Moderation Enums
export const violationTypeEnum = pgEnum("violation_type", [
  "nudity",
  "violence", 
  "harassment",
  "hate_speech",
  "inappropriate_dance",
  "explicit_content",
  "spam",
  "misinformation",
  "copyright",
  "other"
]);

export const violationSeverityEnum = pgEnum("violation_severity", [
  "low",
  "medium", 
  "high",
  "critical"
]);

export const moderationStatusEnum = pgEnum("moderation_status", [
  "pending",
  "flagged",
  "approved",
  "removed",
  "appealed"
]);

export const moderationActionTypeEnum = pgEnum("moderation_action_type", [
  "warning_issued",
  "content_removed",
  "account_suspended",
  "account_banned",
  "appeal_approved",
  "appeal_denied"
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  location: text("location"),
  website: text("website"),
  pronouns: text("pronouns"),
  profileTheme: text("profile_theme").default("default"),
  profileAccentColor: text("profile_accent_color"),
  showWalletOnProfile: boolean("show_wallet_on_profile").default(true),
  showBadgesOnProfile: boolean("show_badges_on_profile").default(true),
  walletAddress: text("wallet_address"),
  walletVerified: boolean("wallet_verified").default(false),
  isBusinessAccount: boolean("is_business_account").default(false),
  businessCategory: businessCategoryEnum("business_category"),
  businessName: text("business_name"),
  businessEmail: text("business_email"),
  businessPhone: text("business_phone"),
  businessWebsite: text("business_website"),
  businessAddress: text("business_address"),
  businessHours: jsonb("business_hours"),
  businessDescription: text("business_description"),
  businessLogoUrl: text("business_logo_url"),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastLoginDate: timestamp("last_login_date"),
  referralCode: text("referral_code"),
  referredBy: varchar("referred_by"),
  verificationStatus: verificationStatusEnum("verification_status").default("none"),
  verificationSubmittedAt: timestamp("verification_submitted_at"),
  verifiedAt: timestamp("verified_at"),
  isAdmin: boolean("is_admin").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
  groupMemberships: many(groupMemberships),
  notifications: many(notifications),
  rewardEvents: many(rewardEvents),
}));

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  postType: postTypeEnum("post_type").notNull().default("text"),
  mediaUrl: text("media_url"),
  hlsUrl: text("hls_url"),
  thumbnailUrl: text("thumbnail_url"),
  videoDuration: integer("video_duration"),
  additionalMedia: jsonb("additional_media").$type<PostMediaItem[]>(),
  visibility: postVisibilityEnum("visibility").notNull().default("public"),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
  repostOfId: varchar("repost_of_id"),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export interface PostMediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  hlsUrl?: string;
  duration?: number;
}

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [posts.groupId],
    references: [groups.id],
  }),
  repostOf: one(posts, {
    fields: [posts.repostOfId],
    references: [posts.id],
    relationName: "reposts",
  }),
  reposts: many(posts, { relationName: "reposts" }),
  comments: many(comments),
  likes: many(likes),
}));

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentId: varchar("parent_id"),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "replies",
  }),
  replies: many(comments, { relationName: "replies" }),
}));

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: varchar("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
}));

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "following",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "followers",
  }),
}));

export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  category: text("category"),
  isPrivate: boolean("is_private").default(false),
  memberCount: integer("member_count").default(0),
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [groups.createdById],
    references: [users.id],
  }),
  memberships: many(groupMemberships),
  posts: many(posts),
}));

export const groupMemberships = pgTable("group_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [groupMemberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMemberships.userId],
    references: [users.id],
  }),
}));

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  data: jsonb("data"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const rewardEvents = pgTable("reward_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: rewardEventTypeEnum("event_type").notNull(),
  points: integer("points").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewardEventsRelations = relations(rewardEvents, ({ one }) => ({
  user: one(users, {
    fields: [rewardEvents.userId],
    references: [users.id],
  }),
}));

export const rewardSnapshots = pgTable("reward_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").notNull().default(0),
  estimatedAxm: text("estimated_axm").default("0"),
  claimedAxm: text("claimed_axm").default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const rewardSnapshotsRelations = relations(rewardSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [rewardSnapshots.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  likeCount: true,
  commentCount: true,
  shareCount: true,
  viewCount: true,
  createdAt: true,
});

export const updatePostSchema = z.object({
  content: z.string().optional(),
  visibility: z.enum(["public", "followers", "private"]).optional(),
});

export type UpdatePost = z.infer<typeof updatePostSchema>;

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  likeCount: true,
  createdAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertRewardEventSchema = createInsertSchema(rewardEvents).omit({
  id: true,
  createdAt: true,
});

export const insertRewardSnapshotSchema = createInsertSchema(rewardSnapshots).omit({
  id: true,
  lastUpdated: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;
export type GroupMembership = typeof groupMemberships.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertRewardEvent = z.infer<typeof insertRewardEventSchema>;
export type RewardEvent = typeof rewardEvents.$inferSelect;
export type InsertRewardSnapshot = z.infer<typeof insertRewardSnapshotSchema>;
export type RewardSnapshot = typeof rewardSnapshots.$inferSelect;

export interface PostWithAuthor extends Post {
  author: User;
}

export interface CommentWithAuthor extends Comment {
  author: User;
}

export interface GroupWithCreator extends Group {
  createdBy: User;
}

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantIds: text("participant_ids").array().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  read: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export interface MessageWithSender extends Message {
  sender: User;
}

export interface ConversationWithMessages extends Conversation {
  messages: MessageWithSender[];
  otherParticipant?: User;
  participants: User[];
  lastMessage?: MessageWithSender;
}

// ============= PHASE 1: QUESTS & ACHIEVEMENTS =============

export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questType: questTypeEnum("quest_type").notNull().default("daily"),
  requirement: text("requirement").notNull(),
  targetValue: integer("target_value").notNull().default(1),
  pointsReward: integer("points_reward").notNull(),
  xpReward: integer("xp_reward").notNull().default(0),
  iconName: text("icon_name"),
  isActive: boolean("is_active").default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userQuestProgress = pgTable("user_quest_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questId: varchar("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
  currentValue: integer("current_value").default(0),
  status: questStatusEnum("status").notNull().default("active"),
  completedAt: timestamp("completed_at"),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const userQuestProgressRelations = relations(userQuestProgress, ({ one }) => ({
  user: one(users, {
    fields: [userQuestProgress.userId],
    references: [users.id],
  }),
  quest: one(quests, {
    fields: [userQuestProgress.questId],
    references: [quests.id],
  }),
}));

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: achievementCategoryEnum("category").notNull(),
  requirement: text("requirement").notNull(),
  targetValue: integer("target_value").notNull().default(1),
  pointsReward: integer("points_reward").notNull(),
  xpReward: integer("xp_reward").notNull().default(0),
  badgeUrl: text("badge_url"),
  iconName: text("icon_name"),
  tier: integer("tier").default(1),
  isSecret: boolean("is_secret").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  currentValue: integer("current_value").default(0),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

// ============= PHASE 1: STORIES =============

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull().default("image"),
  caption: text("caption"),
  backgroundColor: text("background_color"),
  viewCount: integer("view_count").default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storiesRelations = relations(stories, ({ one, many }) => ({
  author: one(users, {
    fields: [stories.authorId],
    references: [users.id],
  }),
  views: many(storyViews),
}));

export const storyViews = pgTable("story_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  viewerId: varchar("viewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export const storyViewsRelations = relations(storyViews, ({ one }) => ({
  story: one(stories, {
    fields: [storyViews.storyId],
    references: [stories.id],
  }),
  viewer: one(users, {
    fields: [storyViews.viewerId],
    references: [users.id],
  }),
}));

// ============= PHASE 1: LIVE STREAMING =============

export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  streamKey: text("stream_key"),
  dailyRoomName: text("daily_room_name"),
  dailyRoomUrl: text("daily_room_url"),
  muxLiveStreamId: text("mux_live_stream_id"),
  muxPlaybackId: text("mux_playback_id"),
  muxStreamKey: text("mux_stream_key"),
  rtmpUrl: text("rtmp_url"),
  cloudflareInputId: text("cloudflare_input_id"),
  cloudflareWhipUrl: text("cloudflare_whip_url"),
  cloudflareWhepUrl: text("cloudflare_whep_url"),
  streamingProvider: text("streaming_provider").default("mux"),
  status: streamStatusEnum("status").notNull().default("live"),
  viewerCount: integer("viewer_count").default(0),
  peakViewers: integer("peak_viewers").default(0),
  totalTips: text("total_tips").default("0"),
  tipCount: integer("tip_count").default(0),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveStreamsRelations = relations(liveStreams, ({ one, many }) => ({
  host: one(users, {
    fields: [liveStreams.hostId],
    references: [users.id],
  }),
  tips: many(streamTips),
  messages: many(streamMessages),
}));

export const streamTips = pgTable("stream_tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: text("amount").notNull(),
  message: text("message"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamTipsRelations = relations(streamTips, ({ one }) => ({
  stream: one(liveStreams, {
    fields: [streamTips.streamId],
    references: [liveStreams.id],
  }),
  sender: one(users, {
    fields: [streamTips.senderId],
    references: [users.id],
  }),
}));

export const streamMessages = pgTable("stream_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isTipMessage: boolean("is_tip_message").default(false),
  tipAmount: text("tip_amount"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamMessagesRelations = relations(streamMessages, ({ one }) => ({
  stream: one(liveStreams, {
    fields: [streamMessages.streamId],
    references: [liveStreams.id],
  }),
  sender: one(users, {
    fields: [streamMessages.senderId],
    references: [users.id],
  }),
}));

// ============= INSERT SCHEMAS FOR NEW TABLES =============

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
});

export const insertUserQuestProgressSchema = createInsertSchema(userQuestProgress).omit({
  id: true,
  currentValue: true,
  completedAt: true,
  assignedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  currentValue: true,
  unlockedAt: true,
  createdAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

export const insertStoryViewSchema = createInsertSchema(storyViews).omit({
  id: true,
  viewedAt: true,
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  viewerCount: true,
  peakViewers: true,
  totalTips: true,
  tipCount: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
});

export const insertStreamTipSchema = createInsertSchema(streamTips).omit({
  id: true,
  createdAt: true,
});

export const insertStreamMessageSchema = createInsertSchema(streamMessages).omit({
  id: true,
  createdAt: true,
});

// ============= TYPES FOR NEW TABLES =============

export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;
export type InsertUserQuestProgress = z.infer<typeof insertUserQuestProgressSchema>;
export type UserQuestProgress = typeof userQuestProgress.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStoryView = z.infer<typeof insertStoryViewSchema>;
export type StoryView = typeof storyViews.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertStreamTip = z.infer<typeof insertStreamTipSchema>;
export type StreamTip = typeof streamTips.$inferSelect;
export type InsertStreamMessage = z.infer<typeof insertStreamMessageSchema>;
export type StreamMessage = typeof streamMessages.$inferSelect;

// ============= EXTENDED TYPES =============

export interface StoryWithAuthor extends Story {
  author: User;
  hasViewed?: boolean;
}

export interface QuestWithProgress extends Quest {
  progress?: UserQuestProgress;
}

export interface AchievementWithProgress extends Achievement {
  userProgress?: UserAchievement;
}

export interface LiveStreamWithHost extends LiveStream {
  host: User;
}

export interface StreamMessageWithSender extends StreamMessage {
  sender: User;
}

export interface StreamTipWithSender extends StreamTip {
  sender: User;
}

// ============= PHASE 2: TRANSACTIONS & MODERATION =============

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").references(() => users.id, { onDelete: "set null" }),
  type: transactionTypeEnum("type").notNull(),
  amount: text("amount").notNull(),
  txHash: text("tx_hash"),
  status: transactionStatusEnum("status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  errorMessage: text("error_message"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [transactions.toUserId],
    references: [users.id],
  }),
}));

export const contentReports = pgTable("content_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportedUserId: varchar("reported_user_id").references(() => users.id, { onDelete: "cascade" }),
  reportedPostId: varchar("reported_post_id").references(() => posts.id, { onDelete: "cascade" }),
  reportedCommentId: varchar("reported_comment_id").references(() => comments.id, { onDelete: "cascade" }),
  reportType: reportTypeEnum("report_type").notNull(),
  reason: text("reason"),
  status: reportStatusEnum("status").notNull().default("pending"),
  reviewedById: varchar("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  reporter: one(users, {
    fields: [contentReports.reporterId],
    references: [users.id],
  }),
  reportedUser: one(users, {
    fields: [contentReports.reportedUserId],
    references: [users.id],
  }),
  reportedPost: one(posts, {
    fields: [contentReports.reportedPostId],
    references: [posts.id],
  }),
  reportedComment: one(comments, {
    fields: [contentReports.reportedCommentId],
    references: [comments.id],
  }),
  reviewedBy: one(users, {
    fields: [contentReports.reviewedById],
    references: [users.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  confirmedAt: true,
  createdAt: true,
});

export const insertContentReportSchema = createInsertSchema(contentReports).omit({
  id: true,
  status: true,
  reviewedById: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;
export type ContentReport = typeof contentReports.$inferSelect;

export interface TransactionWithUsers extends Transaction {
  user: User;
  toUser?: User | null;
}

export interface ContentReportWithDetails extends ContentReport {
  reporter: User;
  reportedUser?: User | null;
  reportedPost?: Post | null;
  reportedComment?: Comment | null;
  reviewedBy?: User | null;
}

// ============= PHASE 2: MONETIZATION =============

export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired"]);
export const giftTypeEnum = pgEnum("gift_type", ["heart", "star", "diamond", "rocket", "crown", "fire"]);
export const adStatusEnum = pgEnum("ad_status", ["draft", "pending", "active", "paused", "completed", "rejected"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "sold_out", "archived"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"]);

// Subscription Tiers - creators can set up different tiers
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  priceAxm: text("price_axm").notNull(),
  benefits: text("benefits").array(),
  isActive: boolean("is_active").default(true),
  subscriberCount: integer("subscriber_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptionTiersRelations = relations(subscriptionTiers, ({ one, many }) => ({
  creator: one(users, {
    fields: [subscriptionTiers.creatorId],
    references: [users.id],
  }),
  subscriptions: many(subscriptions),
}));

// User Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tierId: varchar("tier_id").notNull().references(() => subscriptionTiers.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  subscriber: one(users, {
    fields: [subscriptions.subscriberId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
  }),
  tier: one(subscriptionTiers, {
    fields: [subscriptions.tierId],
    references: [subscriptionTiers.id],
  }),
}));

// Virtual Gifts
export const virtualGifts = pgTable("virtual_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "set null" }),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "set null" }),
  giftType: giftTypeEnum("gift_type").notNull(),
  axmValue: text("axm_value").notNull(),
  message: text("message"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const virtualGiftsRelations = relations(virtualGifts, ({ one }) => ({
  sender: one(users, {
    fields: [virtualGifts.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [virtualGifts.recipientId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [virtualGifts.postId],
    references: [posts.id],
  }),
  stream: one(liveStreams, {
    fields: [virtualGifts.streamId],
    references: [liveStreams.id],
  }),
}));

// Advertisements
export const advertisements = pgTable("advertisements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  mediaUrl: text("media_url"),
  linkUrl: text("link_url"),
  callToAction: text("call_to_action"),
  status: adStatusEnum("status").notNull().default("draft"),
  budgetAxm: text("budget_axm").notNull(),
  spentAxm: text("spent_axm").default("0"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  targetAudience: jsonb("target_audience"),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const advertisementsRelations = relations(advertisements, ({ one }) => ({
  advertiser: one(users, {
    fields: [advertisements.advertiserId],
    references: [users.id],
  }),
}));

// Shop Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  priceAxm: text("price_axm").notNull(),
  imageUrls: text("image_urls").array(),
  category: text("category"),
  stock: integer("stock").default(0),
  status: productStatusEnum("status").notNull().default("draft"),
  soldCount: integer("sold_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  orders: many(orders),
}));

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  totalAxm: text("total_axm").notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  shippingAddress: jsonb("shipping_address"),
  txHash: text("tx_hash"),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  seller: one(users, {
    fields: [orders.sellerId],
    references: [users.id],
  }),
}));

// ============= INSERT SCHEMAS FOR PHASE 2 =============

export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers).omit({
  id: true,
  subscriberCount: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  cancelledAt: true,
  createdAt: true,
});

export const insertVirtualGiftSchema = createInsertSchema(virtualGifts).omit({
  id: true,
  createdAt: true,
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({
  id: true,
  spentAxm: true,
  impressions: true,
  clicks: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  soldCount: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  paidAt: true,
  shippedAt: true,
  deliveredAt: true,
  createdAt: true,
});

// ============= TYPES FOR PHASE 2 =============

export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertVirtualGift = z.infer<typeof insertVirtualGiftSchema>;
export type VirtualGift = typeof virtualGifts.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export interface SubscriptionTierWithCreator extends SubscriptionTier {
  creator: User;
}

export interface SubscriptionWithDetails extends Subscription {
  subscriber: User;
  creator: User;
  tier: SubscriptionTier;
}

export interface VirtualGiftWithUsers extends VirtualGift {
  sender: User;
  recipient: User;
}

export interface ProductWithSeller extends Product {
  seller: User;
}

export interface OrderWithDetails extends Order {
  buyer: User;
  seller: User;
  product: Product;
}

// ============= PHASE 3: WEB3 DEEP INTEGRATION =============

export const nftStatusEnum = pgEnum("nft_status", ["minted", "listed", "sold", "burned"]);
export const proposalStatusEnum = pgEnum("proposal_status", ["draft", "active", "passed", "rejected", "executed", "cancelled"]);
export const voteTypeEnum = pgEnum("vote_type", ["for", "against", "abstain"]);
export const stakingStatusEnum = pgEnum("staking_status", ["active", "unstaking", "withdrawn"]);
export const badgeTypeEnum = pgEnum("badge_type", ["achievement", "verified_creator", "early_adopter", "top_contributor", "whale", "diamond_hands"]);

// NFTs - Posts minted as NFTs
export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: text("token_id").unique(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  mediaUrl: text("media_url").notNull(),
  metadataUrl: text("metadata_url"),
  contractAddress: text("contract_address"),
  mintTxHash: text("mint_tx_hash"),
  royaltyPercent: integer("royalty_percent").default(10),
  status: nftStatusEnum("status").notNull().default("minted"),
  mintedAt: timestamp("minted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nftsRelations = relations(nfts, ({ one, many }) => ({
  owner: one(users, {
    fields: [nfts.ownerId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [nfts.creatorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [nfts.postId],
    references: [posts.id],
  }),
  listings: many(nftListings),
}));

// NFT Marketplace Listings
export const nftListings = pgTable("nft_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").notNull().references(() => nfts.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  priceAxm: text("price_axm").notNull(),
  isAuction: boolean("is_auction").default(false),
  minBidAxm: text("min_bid_axm"),
  highestBidAxm: text("highest_bid_axm"),
  highestBidderId: varchar("highest_bidder_id").references(() => users.id, { onDelete: "set null" }),
  auctionEndsAt: timestamp("auction_ends_at"),
  isActive: boolean("is_active").default(true),
  soldAt: timestamp("sold_at"),
  buyerId: varchar("buyer_id").references(() => users.id, { onDelete: "set null" }),
  saleTxHash: text("sale_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nftListingsRelations = relations(nftListings, ({ one }) => ({
  nft: one(nfts, {
    fields: [nftListings.nftId],
    references: [nfts.id],
  }),
  seller: one(users, {
    fields: [nftListings.sellerId],
    references: [users.id],
  }),
  buyer: one(users, {
    fields: [nftListings.buyerId],
    references: [users.id],
  }),
  highestBidder: one(users, {
    fields: [nftListings.highestBidderId],
    references: [users.id],
  }),
}));

// DAO Governance Proposals
export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposerId: varchar("proposer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  status: proposalStatusEnum("status").notNull().default("draft"),
  votesFor: integer("votes_for").default(0),
  votesAgainst: integer("votes_against").default(0),
  votesAbstain: integer("votes_abstain").default(0),
  totalVotingPower: text("total_voting_power").default("0"),
  quorumRequired: text("quorum_required").default("1000"),
  executionData: jsonb("execution_data"),
  executedTxHash: text("executed_tx_hash"),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  proposer: one(users, {
    fields: [proposals.proposerId],
    references: [users.id],
  }),
  votes: many(proposalVotes),
}));

// Proposal Votes
export const proposalVotes = pgTable("proposal_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  voterId: varchar("voter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voteType: voteTypeEnum("vote_type").notNull(),
  votingPower: text("voting_power").notNull(),
  reason: text("reason"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposalVotesRelations = relations(proposalVotes, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalVotes.proposalId],
    references: [proposals.id],
  }),
  voter: one(users, {
    fields: [proposalVotes.voterId],
    references: [users.id],
  }),
}));

// Token Staking Positions
export const stakingPositions = pgTable("staking_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountAxm: text("amount_axm").notNull(),
  stakeTxHash: text("stake_tx_hash"),
  unstakeTxHash: text("unstake_tx_hash"),
  status: stakingStatusEnum("status").notNull().default("active"),
  lockDuration: integer("lock_duration").default(30),
  rewardMultiplier: integer("reward_multiplier").default(100),
  totalRewardsEarned: text("total_rewards_earned").default("0"),
  lastRewardClaim: timestamp("last_reward_claim"),
  stakedAt: timestamp("staked_at").defaultNow(),
  unstakedAt: timestamp("unstaked_at"),
  withdrawableAt: timestamp("withdrawable_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stakingPositionsRelations = relations(stakingPositions, ({ one, many }) => ({
  user: one(users, {
    fields: [stakingPositions.userId],
    references: [users.id],
  }),
  rewards: many(stakingRewards),
}));

// Staking Rewards
export const stakingRewards = pgTable("staking_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  positionId: varchar("position_id").notNull().references(() => stakingPositions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountAxm: text("amount_axm").notNull(),
  txHash: text("tx_hash"),
  claimedAt: timestamp("claimed_at").defaultNow(),
});

export const stakingRewardsRelations = relations(stakingRewards, ({ one }) => ({
  position: one(stakingPositions, {
    fields: [stakingRewards.positionId],
    references: [stakingPositions.id],
  }),
  user: one(users, {
    fields: [stakingRewards.userId],
    references: [users.id],
  }),
}));

// On-chain Reputation Badges (Soulbound)
export const reputationBadges = pgTable("reputation_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeType: badgeTypeEnum("badge_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  tokenId: text("token_id"),
  contractAddress: text("contract_address"),
  mintTxHash: text("mint_tx_hash"),
  metadata: jsonb("metadata"),
  earnedAt: timestamp("earned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reputationBadgesRelations = relations(reputationBadges, ({ one }) => ({
  user: one(users, {
    fields: [reputationBadges.userId],
    references: [users.id],
  }),
}));

// ============= INSERT SCHEMAS FOR PHASE 3 =============

export const insertNftSchema = createInsertSchema(nfts).omit({
  id: true,
  mintedAt: true,
  createdAt: true,
});

export const insertNftListingSchema = createInsertSchema(nftListings).omit({
  id: true,
  soldAt: true,
  createdAt: true,
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  votesFor: true,
  votesAgainst: true,
  votesAbstain: true,
  totalVotingPower: true,
  executedAt: true,
  createdAt: true,
});

export const insertProposalVoteSchema = createInsertSchema(proposalVotes).omit({
  id: true,
  createdAt: true,
});

export const insertStakingPositionSchema = createInsertSchema(stakingPositions).omit({
  id: true,
  totalRewardsEarned: true,
  lastRewardClaim: true,
  unstakedAt: true,
  withdrawableAt: true,
  createdAt: true,
});

export const insertStakingRewardSchema = createInsertSchema(stakingRewards).omit({
  id: true,
  claimedAt: true,
});

export const insertReputationBadgeSchema = createInsertSchema(reputationBadges).omit({
  id: true,
  earnedAt: true,
  createdAt: true,
});

// ============= TYPES FOR PHASE 3 =============

export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = typeof nfts.$inferSelect;
export type InsertNftListing = z.infer<typeof insertNftListingSchema>;
export type NftListing = typeof nftListings.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposalVote = z.infer<typeof insertProposalVoteSchema>;
export type ProposalVote = typeof proposalVotes.$inferSelect;
export type InsertStakingPosition = z.infer<typeof insertStakingPositionSchema>;
export type StakingPosition = typeof stakingPositions.$inferSelect;
export type InsertStakingReward = z.infer<typeof insertStakingRewardSchema>;
export type StakingReward = typeof stakingRewards.$inferSelect;
export type InsertReputationBadge = z.infer<typeof insertReputationBadgeSchema>;
export type ReputationBadge = typeof reputationBadges.$inferSelect;

// ============= EXTENDED TYPES FOR PHASE 3 =============

export interface NftWithDetails extends Nft {
  owner: User;
  creator: User;
  post?: Post | null;
}

export interface NftListingWithDetails extends NftListing {
  nft: NftWithDetails;
  seller: User;
  buyer?: User | null;
  highestBidder?: User | null;
}

export interface ProposalWithDetails extends Proposal {
  proposer: User;
  votes?: ProposalVote[];
  userVote?: ProposalVote | null;
}

export interface ProposalVoteWithDetails extends ProposalVote {
  voter: User;
}

export interface StakingPositionWithDetails extends StakingPosition {
  user: User;
  rewards?: StakingReward[];
}

export interface ReputationBadgeWithUser extends ReputationBadge {
  user: User;
}

// ============= PHASE 4: PLATFORM ENHANCEMENTS =============

// Enums for new features
export const twoFactorMethodEnum = pgEnum("two_factor_method", ["totp", "sms", "email"]);
export const onboardingStepEnum = pgEnum("onboarding_step", [
  "welcome", "profile", "wallet", "explore", "create", "complete"
]);
export const storyTypeEnum = pgEnum("story_type", ["image", "video", "text"]);
export const emailNotificationTypeEnum = pgEnum("email_notification_type", [
  "tip_received", "verification_status", "proposal_vote", "staking_reward",
  "new_follower", "post_liked", "comment_received", "mention", "weekly_digest"
]);
export const scheduledPostStatusEnum = pgEnum("scheduled_post_status", ["pending", "published", "failed", "cancelled"]);
export const fiatOrderStatusEnum = pgEnum("fiat_order_status", ["pending", "processing", "completed", "failed", "refunded"]);
export const adminActionTypeEnum = pgEnum("admin_action_type", [
  "report_reviewed", "user_verified", "user_banned", "content_removed", "badge_issued",
  "user_deleted", "setting_updated", "notification_sent", "email_sent", "chat_sent",
  "moderation_action", "warning_issued", "appeal_reviewed"
]);

// ============= ADMIN DASHBOARD =============

export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actionType: adminActionTypeEnum("action_type").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }),
  targetPostId: varchar("target_post_id").references(() => posts.id, { onDelete: "set null" }),
  targetReportId: varchar("target_report_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminActivityLogsRelations = relations(adminActivityLogs, ({ one }) => ({
  admin: one(users, {
    fields: [adminActivityLogs.adminId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [adminActivityLogs.targetUserId],
    references: [users.id],
  }),
  targetPost: one(posts, {
    fields: [adminActivityLogs.targetPostId],
    references: [posts.id],
  }),
}));

// ============= ONBOARDING =============

export const userOnboarding = pgTable("user_onboarding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentStep: onboardingStepEnum("current_step").notNull().default("welcome"),
  completedSteps: jsonb("completed_steps").default([]),
  isCompleted: boolean("is_completed").default(false),
  skippedAt: timestamp("skipped_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userOnboardingRelations = relations(userOnboarding, ({ one }) => ({
  user: one(users, {
    fields: [userOnboarding.userId],
    references: [users.id],
  }),
}));

// ============= TWO-FACTOR AUTHENTICATION =============

export const userTwoFactor = pgTable("user_two_factor", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  method: twoFactorMethodEnum("method").notNull().default("totp"),
  secret: text("secret").notNull(),
  isEnabled: boolean("is_enabled").default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBackupCodes = pgTable("user_backup_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userTwoFactorRelations = relations(userTwoFactor, ({ one }) => ({
  user: one(users, {
    fields: [userTwoFactor.userId],
    references: [users.id],
  }),
}));

// ============= EMAIL NOTIFICATIONS =============

export const emailNotificationPreferences = pgTable("email_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tipReceived: boolean("tip_received").default(true),
  verificationStatus: boolean("verification_status").default(true),
  proposalVote: boolean("proposal_vote").default(true),
  stakingReward: boolean("staking_reward").default(true),
  newFollower: boolean("new_follower").default(true),
  postLiked: boolean("post_liked").default(false),
  commentReceived: boolean("comment_received").default(true),
  mention: boolean("mention").default(true),
  weeklyDigest: boolean("weekly_digest").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailQueue = pgTable("email_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emailType: emailNotificationTypeEnum("email_type").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at"),
  failedAt: timestamp("failed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailNotificationPreferencesRelations = relations(emailNotificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [emailNotificationPreferences.userId],
    references: [users.id],
  }),
}));

// ============= STORY REACTIONS (uses existing stories table) =============

export const storyReactions = pgTable("story_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyReactionsRelations = relations(storyReactions, ({ one }) => ({
  story: one(stories, {
    fields: [storyReactions.storyId],
    references: [stories.id],
  }),
  user: one(users, {
    fields: [storyReactions.userId],
    references: [users.id],
  }),
}));

// ============= POLLS =============

export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  allowMultiple: boolean("allow_multiple").default(false),
  expiresAt: timestamp("expires_at"),
  totalVotes: integer("total_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollOptions = pgTable("poll_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  voteCount: integer("vote_count").default(0),
  sortOrder: integer("sort_order").default(0),
});

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  optionId: varchar("option_id").notNull().references(() => pollOptions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollsRelations = relations(polls, ({ one, many }) => ({
  post: one(posts, {
    fields: [polls.postId],
    references: [posts.id],
  }),
  options: many(pollOptions),
  votes: many(pollVotes),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  poll: one(polls, {
    fields: [pollVotes.pollId],
    references: [polls.id],
  }),
  option: one(pollOptions, {
    fields: [pollVotes.optionId],
    references: [pollOptions.id],
  }),
  user: one(users, {
    fields: [pollVotes.userId],
    references: [users.id],
  }),
}));

// ============= SCHEDULED POSTS =============

export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  postType: postTypeEnum("post_type").notNull().default("text"),
  mediaUrl: text("media_url"),
  visibility: postVisibilityEnum("visibility").notNull().default("public"),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
  pollData: jsonb("poll_data"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: scheduledPostStatusEnum("status").notNull().default("pending"),
  publishedPostId: varchar("published_post_id").references(() => posts.id, { onDelete: "set null" }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  author: one(users, {
    fields: [scheduledPosts.authorId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [scheduledPosts.groupId],
    references: [groups.id],
  }),
  publishedPost: one(posts, {
    fields: [scheduledPosts.publishedPostId],
    references: [posts.id],
  }),
}));

// ============= REFERRAL PROGRAM =============

export const referralStatusEnum = pgEnum("referral_status", [
  "pending",
  "verified", 
  "rejected",
  "expired"
]);

export const referralEvents = pgTable("referral_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredId: varchar("referred_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: text("referral_code").notNull(),
  bonusAxm: text("bonus_axm"),
  baseReward: text("base_reward").default("10"),
  decayMultiplier: text("decay_multiplier").default("1.0"),
  tierBonus: text("tier_bonus").default("0"),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  status: referralStatusEnum("status").default("pending"),
  verifiedAt: timestamp("verified_at"),
  referredUserIp: text("referred_user_ip"),
  referredUserAgent: text("referred_user_agent"),
  validationScore: integer("validation_score").default(0),
  validationNotes: text("validation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralRewards = pgTable("referral_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalReferrals: integer("total_referrals").default(0),
  verifiedReferrals: integer("verified_referrals").default(0),
  rejectedReferrals: integer("rejected_referrals").default(0),
  totalEarnings: text("total_earnings").default("0"),
  pendingEarnings: text("pending_earnings").default("0"),
  currentTier: integer("current_tier").default(1),
  lifetimeReferrals: integer("lifetime_referrals").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const referralTiers = pgTable("referral_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tierLevel: integer("tier_level").notNull().unique(),
  name: text("name").notNull(),
  minReferrals: integer("min_referrals").notNull(),
  bonusMultiplier: text("bonus_multiplier").notNull().default("1.0"),
  maxDailyReferrals: integer("max_daily_referrals").default(10),
  maxMonthlyReferrals: integer("max_monthly_referrals").default(100),
  specialPerks: jsonb("special_perks"),
  badgeIcon: text("badge_icon"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralProgramSettings = pgTable("referral_program_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseRewardAxm: text("base_reward_axm").notNull().default("10"),
  decayEnabled: boolean("decay_enabled").default(true),
  decayStartDay: integer("decay_start_day").default(30),
  decayRatePerDay: text("decay_rate_per_day").default("0.02"),
  minRewardAxm: text("min_reward_axm").default("2"),
  maxDailyReferralsGlobal: integer("max_daily_referrals_global").default(5),
  maxMonthlyReferralsGlobal: integer("max_monthly_referrals_global").default(50),
  maxLifetimeReferrals: integer("max_lifetime_referrals").default(500),
  antiSybilEnabled: boolean("anti_sybil_enabled").default(true),
  minAccountAgeDays: integer("min_account_age_days").default(1),
  minActivityScore: integer("min_activity_score").default(10),
  requireEmailVerification: boolean("require_email_verification").default(true),
  requireWalletConnection: boolean("require_wallet_connection").default(false),
  blockDisposableEmails: boolean("block_disposable_emails").default(true),
  sameIpCooldownHours: integer("same_ip_cooldown_hours").default(24),
  disclosureText: text("disclosure_text").default('Referral rewards are subject to verification. Rewards decrease over time and are capped to ensure program sustainability. Terms and conditions apply.'),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const referralEventsRelations = relations(referralEvents, ({ one }) => ({
  referrer: one(users, {
    fields: [referralEvents.referrerId],
    references: [users.id],
  }),
  referred: one(users, {
    fields: [referralEvents.referredId],
    references: [users.id],
  }),
}));

// ============= PWA / PUSH NOTIFICATIONS =============

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

// ============= FIAT ON-RAMP =============

export const fiatOrders = pgTable("fiat_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  externalOrderId: text("external_order_id"),
  fiatCurrency: text("fiat_currency").notNull(),
  fiatAmount: text("fiat_amount").notNull(),
  axmAmount: text("axm_amount"),
  exchangeRate: text("exchange_rate"),
  status: fiatOrderStatusEnum("status").notNull().default("pending"),
  walletAddress: text("wallet_address").notNull(),
  txHash: text("tx_hash"),
  metadata: jsonb("metadata"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fiatOrdersRelations = relations(fiatOrders, ({ one }) => ({
  user: one(users, {
    fields: [fiatOrders.userId],
    references: [users.id],
  }),
}));

// ============= INSERT SCHEMAS FOR PHASE 4 =============

export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertUserOnboardingSchema = createInsertSchema(userOnboarding).omit({
  id: true,
  createdAt: true,
});

export const insertUserTwoFactorSchema = createInsertSchema(userTwoFactor).omit({
  id: true,
  verifiedAt: true,
  createdAt: true,
});

export const insertEmailNotificationPreferencesSchema = createInsertSchema(emailNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailQueueSchema = createInsertSchema(emailQueue).omit({
  id: true,
  sentAt: true,
  failedAt: true,
  createdAt: true,
});

export const insertStoryReactionSchema = createInsertSchema(storyReactions).omit({
  id: true,
  createdAt: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  totalVotes: true,
  createdAt: true,
});

export const insertPollOptionSchema = createInsertSchema(pollOptions).omit({
  id: true,
  voteCount: true,
});

export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  publishedPostId: true,
  errorMessage: true,
  createdAt: true,
});

export const insertReferralEventSchema = createInsertSchema(referralEvents).omit({
  id: true,
  isPaid: true,
  paidAt: true,
  verifiedAt: true,
  createdAt: true,
});

export const insertReferralTierSchema = createInsertSchema(referralTiers).omit({
  id: true,
  createdAt: true,
});

export const insertReferralProgramSettingsSchema = createInsertSchema(referralProgramSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertFiatOrderSchema = createInsertSchema(fiatOrders).omit({
  id: true,
  txHash: true,
  completedAt: true,
  createdAt: true,
});

// ============= PLATFORM SETTINGS =============

export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  category: text("category").notNull().default("general"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettings.$inferSelect;

// ============= TYPES FOR PHASE 4 =============

export type InsertAdminActivityLog = z.infer<typeof insertAdminActivityLogSchema>;
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type InsertUserOnboarding = z.infer<typeof insertUserOnboardingSchema>;
export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type InsertUserTwoFactor = z.infer<typeof insertUserTwoFactorSchema>;
export type UserTwoFactor = typeof userTwoFactor.$inferSelect;
export type InsertEmailNotificationPreferences = z.infer<typeof insertEmailNotificationPreferencesSchema>;
export type EmailNotificationPreferences = typeof emailNotificationPreferences.$inferSelect;
export type InsertEmailQueue = z.infer<typeof insertEmailQueueSchema>;
export type EmailQueue = typeof emailQueue.$inferSelect;
export type InsertStoryReaction = z.infer<typeof insertStoryReactionSchema>;
export type StoryReaction = typeof storyReactions.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;
export type InsertPollOption = z.infer<typeof insertPollOptionSchema>;
export type PollOption = typeof pollOptions.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PollVote = typeof pollVotes.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertReferralEvent = z.infer<typeof insertReferralEventSchema>;
export type ReferralEvent = typeof referralEvents.$inferSelect;
export type InsertReferralTier = z.infer<typeof insertReferralTierSchema>;
export type ReferralTier = typeof referralTiers.$inferSelect;
export type InsertReferralProgramSettings = z.infer<typeof insertReferralProgramSettingsSchema>;
export type ReferralProgramSettings = typeof referralProgramSettings.$inferSelect;
export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertFiatOrder = z.infer<typeof insertFiatOrderSchema>;
export type FiatOrder = typeof fiatOrders.$inferSelect;

// ============= EXTENDED TYPES FOR PHASE 4 =============

export interface StoryWithAuthor extends Story {
  author: User;
  views?: StoryView[];
  reactions?: { reaction: string; count: number }[];
  hasViewed?: boolean;
}

export interface PollWithOptions extends Poll {
  options: PollOption[];
  userVote?: PollVote | null;
}

export interface ScheduledPostWithDetails extends ScheduledPost {
  author: User;
  group?: { id: string; name: string } | null;
  poll?: PollWithOptions | null;
}

export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: string;
  pendingEarnings: string;
  recentReferrals: (ReferralEvent & { referred: User })[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalPosts: number;
  newPostsToday: number;
  pendingReports: number;
  pendingVerifications: number;
  totalAXMVolume: string;
  activeStreams: number;
}

// ============= NATIONBUILDER-STYLE FEATURES =============

// Petition status enum
export const petitionStatusEnum = pgEnum("petition_status", ["draft", "active", "completed", "closed"]);

// Campaign status enum
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "active", "completed", "cancelled"]);

// Event status enum
export const eventStatusEnum = pgEnum("event_status", ["draft", "upcoming", "ongoing", "completed", "cancelled"]);

// Petitions table
export const petitions = pgTable("petitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetSignatures: integer("target_signatures").default(1000),
  currentSignatures: integer("current_signatures").default(0),
  category: text("category"),
  imageUrl: text("image_url"),
  status: petitionStatusEnum("status").default("active"),
  targetEntity: text("target_entity"),
  deliveryMethod: text("delivery_method"),
  updates: jsonb("updates").$type<{ date: string; content: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertPetitionSchema = createInsertSchema(petitions).omit({
  id: true,
  currentSignatures: true,
  createdAt: true,
  completedAt: true,
});

export type InsertPetition = z.infer<typeof insertPetitionSchema>;
export type Petition = typeof petitions.$inferSelect;

// Petition signatures
export const petitionSignatures = pgTable("petition_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petitionId: varchar("petition_id").notNull().references(() => petitions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  comment: text("comment"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPetitionSignatureSchema = createInsertSchema(petitionSignatures).omit({
  id: true,
  createdAt: true,
});

export type InsertPetitionSignature = z.infer<typeof insertPetitionSignatureSchema>;
export type PetitionSignature = typeof petitionSignatures.$inferSelect;

// Fundraising campaigns
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  story: text("story"),
  goalAmount: integer("goal_amount").notNull(),
  currentAmount: integer("current_amount").default(0),
  currency: text("currency").default("usd"),
  category: text("category"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  status: campaignStatusEnum("status").default("active"),
  endDate: timestamp("end_date"),
  stripeProductId: text("stripe_product_id"),
  updates: jsonb("updates").$type<{ date: string; content: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  currentAmount: true,
  stripeProductId: true,
  createdAt: true,
  completedAt: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Campaign donations
export const campaignDonations = pgTable("campaign_donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  currency: text("currency").default("usd"),
  donorName: text("donor_name"),
  donorEmail: text("donor_email"),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampaignDonationSchema = createInsertSchema(campaignDonations).omit({
  id: true,
  stripePaymentId: true,
  createdAt: true,
});

export type InsertCampaignDonation = z.infer<typeof insertCampaignDonationSchema>;
export type CampaignDonation = typeof campaignDonations.$inferSelect;

// Events
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  imageUrl: text("image_url"),
  location: text("location"),
  locationDetails: jsonb("location_details").$type<{ address?: string; city?: string; coordinates?: { lat: number; lng: number }; isVirtual?: boolean; virtualLink?: string }>(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  maxAttendees: integer("max_attendees"),
  currentAttendees: integer("current_attendees").default(0),
  status: eventStatusEnum("status").default("upcoming"),
  requiresApproval: boolean("requires_approval").default(false),
  isPublic: boolean("is_public").default(true),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  currentAttendees: true,
  createdAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event RSVPs
export const eventRsvps = pgTable("event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("going"),
  guestCount: integer("guest_count").default(1),
  note: text("note"),
  checkedIn: boolean("checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  checkedIn: true,
  checkedInAt: true,
  createdAt: true,
});

export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;

// Email campaigns for mass outreach
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  recipientType: text("recipient_type").default("all"),
  recipientFilter: jsonb("recipient_filter"),
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  status: text("status").default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  totalRecipients: true,
  sentCount: true,
  openCount: true,
  clickCount: true,
  sentAt: true,
  createdAt: true,
});

export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// Extended types for NationBuilder features
export interface PetitionWithCreator extends Petition {
  creator: User;
  recentSignatures?: PetitionSignature[];
  hasUserSigned?: boolean;
}

export interface CampaignWithCreator extends Campaign {
  creator: User;
  recentDonations?: CampaignDonation[];
  hasUserDonated?: boolean;
  percentComplete: number;
}

export interface EventWithCreator extends Event {
  creator: User;
  group?: { id: string; name: string } | null;
  userRsvp?: EventRsvp | null;
  spotsRemaining?: number | null;
}

// ==========================================
// NATIONBUILDER-INSPIRED FEATURES
// ==========================================

// Enums for new features
export const volunteerOpportunityStatusEnum = pgEnum("volunteer_opportunity_status", ["active", "filled", "cancelled", "completed"]);
export const engagementLevelEnum = pgEnum("engagement_level", ["subscriber", "supporter", "volunteer", "leader", "organizer"]);
export const contactMethodEnum = pgEnum("contact_method", ["phone", "door", "text", "email"]);
export const contactOutcomeEnum = pgEnum("contact_outcome", ["answered", "voicemail", "not_home", "refused", "moved", "wrong_number", "do_not_contact"]);

// Volunteer Opportunities - job postings for volunteers
export const volunteerOpportunities = pgTable("volunteer_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category"),
  location: text("location"),
  isVirtual: boolean("is_virtual").default(false),
  skills: text("skills").array(),
  minCommitmentHours: integer("min_commitment_hours"),
  maxVolunteers: integer("max_volunteers"),
  currentVolunteers: integer("current_volunteers").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: volunteerOpportunityStatusEnum("status").default("active"),
  points: integer("points").default(10),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVolunteerOpportunitySchema = createInsertSchema(volunteerOpportunities).omit({
  id: true,
  currentVolunteers: true,
  createdAt: true,
});

export type InsertVolunteerOpportunity = z.infer<typeof insertVolunteerOpportunitySchema>;
export type VolunteerOpportunity = typeof volunteerOpportunities.$inferSelect;

// Volunteer Shifts - specific time slots for opportunities
export const volunteerShifts = pgTable("volunteer_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id").notNull().references(() => volunteerOpportunities.id, { onDelete: "cascade" }),
  name: text("name"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  maxVolunteers: integer("max_volunteers").default(10),
  currentVolunteers: integer("current_volunteers").default(0),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVolunteerShiftSchema = createInsertSchema(volunteerShifts).omit({
  id: true,
  currentVolunteers: true,
  createdAt: true,
});

export type InsertVolunteerShift = z.infer<typeof insertVolunteerShiftSchema>;
export type VolunteerShift = typeof volunteerShifts.$inferSelect;

// Volunteer Signups - users signing up for opportunities/shifts
export const volunteerSignups = pgTable("volunteer_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id").notNull().references(() => volunteerOpportunities.id, { onDelete: "cascade" }),
  shiftId: varchar("shift_id").references(() => volunteerShifts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("confirmed"),
  notes: text("notes"),
  checkedIn: boolean("checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  checkedOut: boolean("checked_out").default(false),
  checkedOutAt: timestamp("checked_out_at"),
  hoursLogged: integer("hours_logged").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVolunteerSignupSchema = createInsertSchema(volunteerSignups).omit({
  id: true,
  checkedIn: true,
  checkedInAt: true,
  checkedOut: true,
  checkedOutAt: true,
  hoursLogged: true,
  createdAt: true,
});

export type InsertVolunteerSignup = z.infer<typeof insertVolunteerSignupSchema>;
export type VolunteerSignup = typeof volunteerSignups.$inferSelect;

// Volunteer Hours Log - track hours served
export const volunteerHours = pgTable("volunteer_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  opportunityId: varchar("opportunity_id").references(() => volunteerOpportunities.id, { onDelete: "set null" }),
  shiftId: varchar("shift_id").references(() => volunteerShifts.id, { onDelete: "set null" }),
  signupId: varchar("signup_id").references(() => volunteerSignups.id, { onDelete: "set null" }),
  hours: integer("hours").notNull(),
  minutes: integer("minutes").default(0),
  date: timestamp("date").notNull(),
  description: text("description"),
  verified: boolean("verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id, { onDelete: "set null" }),
  pointsAwarded: integer("points_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVolunteerHoursSchema = createInsertSchema(volunteerHours).omit({
  id: true,
  verified: true,
  verifiedBy: true,
  pointsAwarded: true,
  createdAt: true,
});

export type InsertVolunteerHours = z.infer<typeof insertVolunteerHoursSchema>;
export type VolunteerHours = typeof volunteerHours.$inferSelect;

// Supporter Tags - for organizing and segmenting supporters
export const supporterTags = pgTable("supporter_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  category: text("category"),
  isSystem: boolean("is_system").default(false),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupporterTagSchema = createInsertSchema(supporterTags).omit({
  id: true,
  isSystem: true,
  createdAt: true,
});

export type InsertSupporterTag = z.infer<typeof insertSupporterTagSchema>;
export type SupporterTag = typeof supporterTags.$inferSelect;

// User Tags - join table for users and tags
export const userTags = pgTable("user_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => supporterTags.id, { onDelete: "cascade" }),
  addedById: varchar("added_by_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserTagSchema = createInsertSchema(userTags).omit({
  id: true,
  createdAt: true,
});

export type InsertUserTag = z.infer<typeof insertUserTagSchema>;
export type UserTag = typeof userTags.$inferSelect;

// Saved Audiences - saved filters for targeting
export const savedAudiences = pgTable("saved_audiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filters: jsonb("filters").$type<{
    tags?: string[];
    engagementLevel?: string;
    hasWallet?: boolean;
    joinedAfter?: string;
    joinedBefore?: string;
    lastActiveAfter?: string;
    hasDonated?: boolean;
    hasVolunteered?: boolean;
    customFilters?: Record<string, unknown>;
  }>(),
  memberCount: integer("member_count").default(0),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedAudienceSchema = createInsertSchema(savedAudiences).omit({
  id: true,
  memberCount: true,
  lastUpdated: true,
  createdAt: true,
});

export type InsertSavedAudience = z.infer<typeof insertSavedAudienceSchema>;
export type SavedAudience = typeof savedAudiences.$inferSelect;

// Opinion Polls - quick surveys/feedback
export const opinionPolls = pgTable("opinion_polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  description: text("description"),
  options: jsonb("options").$type<{ id: string; text: string; votes: number }[]>().notNull(),
  allowMultiple: boolean("allow_multiple").default(false),
  isAnonymous: boolean("is_anonymous").default(false),
  showResults: boolean("show_results").default(true),
  endsAt: timestamp("ends_at"),
  status: text("status").default("active"),
  totalVotes: integer("total_votes").default(0),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOpinionPollSchema = createInsertSchema(opinionPolls).omit({
  id: true,
  totalVotes: true,
  createdAt: true,
});

export type InsertOpinionPoll = z.infer<typeof insertOpinionPollSchema>;
export type OpinionPoll = typeof opinionPolls.$inferSelect;

// Opinion Poll Votes
export const opinionPollVotes = pgTable("opinion_poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => opinionPolls.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  optionIds: text("option_ids").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOpinionPollVoteSchema = createInsertSchema(opinionPollVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertOpinionPollVote = z.infer<typeof insertOpinionPollVoteSchema>;
export type OpinionPollVote = typeof opinionPollVotes.$inferSelect;

// Contact Officials - lawmaker contact campaigns
export const contactOfficialsCampaigns = pgTable("contact_officials_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  officialType: text("official_type"),
  targetJurisdiction: text("target_jurisdiction"),
  scriptTemplate: text("script_template"),
  talkingPoints: text("talking_points").array(),
  callToAction: text("call_to_action"),
  status: text("status").default("active"),
  contactCount: integer("contact_count").default(0),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
  petitionId: varchar("petition_id").references(() => petitions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactOfficialsCampaignSchema = createInsertSchema(contactOfficialsCampaigns).omit({
  id: true,
  contactCount: true,
  createdAt: true,
});

export type InsertContactOfficialsCampaign = z.infer<typeof insertContactOfficialsCampaignSchema>;
export type ContactOfficialsCampaign = typeof contactOfficialsCampaigns.$inferSelect;

// Contact Officials Submissions - track who contacted officials
export const officialContacts = pgTable("official_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => contactOfficialsCampaigns.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  officialName: text("official_name").notNull(),
  officialTitle: text("official_title"),
  officialEmail: text("official_email"),
  officialPhone: text("official_phone"),
  contactMethod: text("contact_method"),
  message: text("message"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOfficialContactSchema = createInsertSchema(officialContacts).omit({
  id: true,
  response: true,
  createdAt: true,
});

export type InsertOfficialContact = z.infer<typeof insertOfficialContactSchema>;
export type OfficialContact = typeof officialContacts.$inferSelect;

// Engagement Tracker - track user engagement level progression
export const engagementProgress = pgTable("engagement_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentLevel: engagementLevelEnum("current_level").default("subscriber"),
  postsCount: integer("posts_count").default(0),
  commentsCount: integer("comments_count").default(0),
  likesGiven: integer("likes_given").default(0),
  likesReceived: integer("likes_received").default(0),
  petitionsSigned: integer("petitions_signed").default(0),
  donationsCount: integer("donations_count").default(0),
  donationsTotal: integer("donations_total").default(0),
  eventsAttended: integer("events_attended").default(0),
  volunteerHours: integer("volunteer_hours").default(0),
  referralsCount: integer("referrals_count").default(0),
  phoneCallsMade: integer("phone_calls_made").default(0),
  doorKnocks: integer("door_knocks").default(0),
  lastActivityAt: timestamp("last_activity_at"),
  levelUpdatedAt: timestamp("level_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEngagementProgressSchema = createInsertSchema(engagementProgress).omit({
  id: true,
  postsCount: true,
  commentsCount: true,
  likesGiven: true,
  likesReceived: true,
  petitionsSigned: true,
  donationsCount: true,
  donationsTotal: true,
  eventsAttended: true,
  volunteerHours: true,
  referralsCount: true,
  phoneCallsMade: true,
  doorKnocks: true,
  lastActivityAt: true,
  levelUpdatedAt: true,
  createdAt: true,
});

export type InsertEngagementProgress = z.infer<typeof insertEngagementProgressSchema>;
export type EngagementProgress = typeof engagementProgress.$inferSelect;

// Phone Banking Lists - call lists for phone banking
export const phoneBankingLists = pgTable("phone_banking_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  script: text("script"),
  targetAudienceId: varchar("target_audience_id").references(() => savedAudiences.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  petitionId: varchar("petition_id").references(() => petitions.id, { onDelete: "set null" }),
  totalContacts: integer("total_contacts").default(0),
  completedContacts: integer("completed_contacts").default(0),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPhoneBankingListSchema = createInsertSchema(phoneBankingLists).omit({
  id: true,
  totalContacts: true,
  completedContacts: true,
  createdAt: true,
});

export type InsertPhoneBankingList = z.infer<typeof insertPhoneBankingListSchema>;
export type PhoneBankingList = typeof phoneBankingLists.$inferSelect;

// Phone Banking Contacts - individual contacts in a list
export const phoneBankingContacts = pgTable("phone_banking_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listId: varchar("list_id").notNull().references(() => phoneBankingLists.id, { onDelete: "cascade" }),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  priority: integer("priority").default(0),
  assignedToId: varchar("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").default("pending"),
  outcome: contactOutcomeEnum("outcome"),
  callNotes: text("call_notes"),
  calledAt: timestamp("called_at"),
  calledById: varchar("called_by_id").references(() => users.id, { onDelete: "set null" }),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPhoneBankingContactSchema = createInsertSchema(phoneBankingContacts).omit({
  id: true,
  outcome: true,
  callNotes: true,
  calledAt: true,
  calledById: true,
  createdAt: true,
});

export type InsertPhoneBankingContact = z.infer<typeof insertPhoneBankingContactSchema>;
export type PhoneBankingContact = typeof phoneBankingContacts.$inferSelect;

// Canvassing Turfs - geographic areas for door knocking
export const canvassingTurfs = pgTable("canvassing_turfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  boundaries: jsonb("boundaries").$type<{ type: string; coordinates: number[][][] }>(),
  addressList: jsonb("address_list").$type<{ address: string; lat?: number; lng?: number }[]>(),
  script: text("script"),
  campaignId: varchar("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  petitionId: varchar("petition_id").references(() => petitions.id, { onDelete: "set null" }),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "set null" }),
  totalDoors: integer("total_doors").default(0),
  knockedDoors: integer("knocked_doors").default(0),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCanvassingTurfSchema = createInsertSchema(canvassingTurfs).omit({
  id: true,
  totalDoors: true,
  knockedDoors: true,
  createdAt: true,
});

export type InsertCanvassingTurf = z.infer<typeof insertCanvassingTurfSchema>;
export type CanvassingTurf = typeof canvassingTurfs.$inferSelect;

// Canvassing Contacts - door knock results
export const canvassingContacts = pgTable("canvassing_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  turfId: varchar("turf_id").notNull().references(() => canvassingTurfs.id, { onDelete: "cascade" }),
  canvasserId: varchar("canvasser_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }),
  address: text("address").notNull(),
  residentName: text("resident_name"),
  phone: text("phone"),
  email: text("email"),
  outcome: contactOutcomeEnum("outcome"),
  notes: text("notes"),
  supportLevel: integer("support_level"),
  willVolunteer: boolean("will_volunteer").default(false),
  willDonate: boolean("will_donate").default(false),
  signedPetition: boolean("signed_petition").default(false),
  registeredToVote: boolean("registered_to_vote"),
  needsFollowUp: boolean("needs_follow_up").default(false),
  contactedAt: timestamp("contacted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCanvassingContactSchema = createInsertSchema(canvassingContacts).omit({
  id: true,
  contactedAt: true,
  createdAt: true,
});

export type InsertCanvassingContact = z.infer<typeof insertCanvassingContactSchema>;
export type CanvassingContact = typeof canvassingContacts.$inferSelect;

// Recruiter Leaderboard Stats - enhanced referral tracking
export const recruiterStats = pgTable("recruiter_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalRecruits: integer("total_recruits").default(0),
  activeRecruits: integer("active_recruits").default(0),
  weeklyRecruits: integer("weekly_recruits").default(0),
  monthlyRecruits: integer("monthly_recruits").default(0),
  recruitsWhoVolunteered: integer("recruits_who_volunteered").default(0),
  recruitsWhoDonated: integer("recruits_who_donated").default(0),
  totalPointsEarned: integer("total_points_earned").default(0),
  currentRank: integer("current_rank"),
  badgesEarned: text("badges_earned").array(),
  lastRecruitAt: timestamp("last_recruit_at"),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRecruiterStatsSchema = createInsertSchema(recruiterStats).omit({
  id: true,
  totalRecruits: true,
  activeRecruits: true,
  weeklyRecruits: true,
  monthlyRecruits: true,
  recruitsWhoVolunteered: true,
  recruitsWhoDonated: true,
  totalPointsEarned: true,
  currentRank: true,
  badgesEarned: true,
  lastRecruitAt: true,
  updatedAt: true,
  createdAt: true,
});

export type InsertRecruiterStats = z.infer<typeof insertRecruiterStatsSchema>;
export type RecruiterStats = typeof recruiterStats.$inferSelect;

// ============= CONTENT MODERATION TABLES =============

// Platform Guidelines - Store mission statement and content policies
export const platformGuidelines = pgTable("platform_guidelines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlatformGuidelinesSchema = createInsertSchema(platformGuidelines).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

export type InsertPlatformGuidelines = z.infer<typeof insertPlatformGuidelinesSchema>;
export type PlatformGuidelines = typeof platformGuidelines.$inferSelect;

// Content Violations - Track individual content violations detected by AI or reported
export const contentViolations = pgTable("content_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "set null" }),
  commentId: varchar("comment_id").references(() => comments.id, { onDelete: "set null" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  violationType: violationTypeEnum("violation_type").notNull(),
  severity: violationSeverityEnum("severity").notNull().default("medium"),
  status: moderationStatusEnum("status").notNull().default("pending"),
  aiConfidenceScore: integer("ai_confidence_score"),
  aiAnalysis: text("ai_analysis"),
  contentSnapshot: text("content_snapshot"),
  mediaUrl: text("media_url"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentViolationsRelations = relations(contentViolations, ({ one }) => ({
  post: one(posts, {
    fields: [contentViolations.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [contentViolations.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [contentViolations.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [contentViolations.reviewedBy],
    references: [users.id],
  }),
}));

export const insertContentViolationSchema = createInsertSchema(contentViolations).omit({
  id: true,
  reviewedAt: true,
  createdAt: true,
});

export type InsertContentViolation = z.infer<typeof insertContentViolationSchema>;
export type ContentViolation = typeof contentViolations.$inferSelect;

// User Warnings - Track warning strikes per user (3 strikes = banned)
export const userWarnings = pgTable("user_warnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  violationId: varchar("violation_id").references(() => contentViolations.id, { onDelete: "set null" }),
  warningNumber: integer("warning_number").notNull(),
  reason: text("reason").notNull(),
  violationType: violationTypeEnum("violation_type").notNull(),
  issuedBy: varchar("issued_by").references(() => users.id),
  expiresAt: timestamp("expires_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userWarningsRelations = relations(userWarnings, ({ one }) => ({
  user: one(users, {
    fields: [userWarnings.userId],
    references: [users.id],
  }),
  violation: one(contentViolations, {
    fields: [userWarnings.violationId],
    references: [contentViolations.id],
  }),
  issuer: one(users, {
    fields: [userWarnings.issuedBy],
    references: [users.id],
  }),
}));

export const insertUserWarningSchema = createInsertSchema(userWarnings).omit({
  id: true,
  acknowledgedAt: true,
  createdAt: true,
});

export type InsertUserWarning = z.infer<typeof insertUserWarningSchema>;
export type UserWarning = typeof userWarnings.$inferSelect;

// Moderation Actions - Log all moderation actions taken
export const moderationActions = pgTable("moderation_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionType: moderationActionTypeEnum("action_type").notNull(),
  targetUserId: varchar("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  violationId: varchar("violation_id").references(() => contentViolations.id, { onDelete: "set null" }),
  performedBy: varchar("performed_by").references(() => users.id),
  isAutomated: boolean("is_automated").default(false),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moderationActionsRelations = relations(moderationActions, ({ one }) => ({
  targetUser: one(users, {
    fields: [moderationActions.targetUserId],
    references: [users.id],
  }),
  violation: one(contentViolations, {
    fields: [moderationActions.violationId],
    references: [contentViolations.id],
  }),
  performer: one(users, {
    fields: [moderationActions.performedBy],
    references: [users.id],
  }),
}));

export const insertModerationActionSchema = createInsertSchema(moderationActions).omit({
  id: true,
  createdAt: true,
});

export type InsertModerationAction = z.infer<typeof insertModerationActionSchema>;
export type ModerationAction = typeof moderationActions.$inferSelect;

// Content Moderation Queue - Queue for pending AI/human review
export const moderationQueue = pgTable("moderation_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: varchar("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  priority: integer("priority").default(0),
  aiProcessed: boolean("ai_processed").default(false),
  aiResult: jsonb("ai_result"),
  humanReviewRequired: boolean("human_review_required").default(false),
  assignedTo: varchar("assigned_to").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moderationQueueRelations = relations(moderationQueue, ({ one }) => ({
  post: one(posts, {
    fields: [moderationQueue.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [moderationQueue.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [moderationQueue.userId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [moderationQueue.assignedTo],
    references: [users.id],
  }),
}));

export const insertModerationQueueSchema = createInsertSchema(moderationQueue).omit({
  id: true,
  aiProcessed: true,
  processedAt: true,
  createdAt: true,
});

export type InsertModerationQueue = z.infer<typeof insertModerationQueueSchema>;
export type ModerationQueue = typeof moderationQueue.$inferSelect;

// Extended types for content moderation
export interface ContentViolationWithDetails extends ContentViolation {
  user: User;
  reviewer?: User | null;
}

export interface UserWarningWithDetails extends UserWarning {
  user: User;
  violation?: ContentViolation | null;
  issuer?: User | null;
}

export interface ModerationQueueItem extends ModerationQueue {
  user: User;
  assignee?: User | null;
}

// Extended types for NationBuilder features
export interface VolunteerOpportunityWithCreator extends VolunteerOpportunity {
  creator: User;
  shifts?: VolunteerShift[];
  userSignup?: VolunteerSignup | null;
  spotsRemaining?: number | null;
}

export interface OpinionPollWithCreator extends OpinionPoll {
  creator: User;
  userVote?: OpinionPollVote | null;
}

export interface PhoneBankingListWithStats extends PhoneBankingList {
  creator: User;
  percentComplete: number;
}

export interface CanvassingTurfWithStats extends CanvassingTurf {
  creator: User;
  percentComplete: number;
}

export interface UserWithEngagement extends User {
  tags?: SupporterTag[];
  engagement?: EngagementProgress | null;
  volunteerHoursTotal?: number;
  recruiterStats?: RecruiterStats | null;
}

// ============= BUSINESS PROMOTIONS & ANALYTICS =============

export const promotionStatusEnum = pgEnum("promotion_status", ["draft", "active", "paused", "completed", "cancelled"]);
export const promotionTypeEnum = pgEnum("promotion_type", ["boost_post", "sponsored", "discount", "event", "announcement"]);

export const businessPromotions = pgTable("business_promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  promotionType: promotionTypeEnum("promotion_type").notNull(),
  status: promotionStatusEnum("status").default("draft"),
  budget: integer("budget").default(0),
  spent: integer("spent").default(0),
  targetReach: integer("target_reach"),
  actualReach: integer("actual_reach").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetAudience: jsonb("target_audience"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessPromotionsRelations = relations(businessPromotions, ({ one }) => ({
  business: one(users, {
    fields: [businessPromotions.businessId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [businessPromotions.postId],
    references: [posts.id],
  }),
}));

export const businessAnalytics = pgTable("business_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  profileViews: integer("profile_views").default(0),
  postImpressions: integer("post_impressions").default(0),
  postEngagements: integer("post_engagements").default(0),
  websiteClicks: integer("website_clicks").default(0),
  phoneClicks: integer("phone_clicks").default(0),
  emailClicks: integer("email_clicks").default(0),
  newFollowers: integer("new_followers").default(0),
  unfollows: integer("unfollows").default(0),
  directMessages: integer("direct_messages").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const businessAnalyticsRelations = relations(businessAnalytics, ({ one }) => ({
  business: one(users, {
    fields: [businessAnalytics.businessId],
    references: [users.id],
  }),
}));

export const businessLeads = pgTable("business_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  source: text("source"),
  notes: text("notes"),
  status: text("status").default("new"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const businessLeadsRelations = relations(businessLeads, ({ one }) => ({
  business: one(users, {
    fields: [businessLeads.businessId],
    references: [users.id],
  }),
  user: one(users, {
    fields: [businessLeads.userId],
    references: [users.id],
  }),
}));

export const insertBusinessPromotionSchema = createInsertSchema(businessPromotions).omit({
  id: true,
  spent: true,
  actualReach: true,
  clicks: true,
  conversions: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessAnalyticsSchema = createInsertSchema(businessAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessLeadSchema = createInsertSchema(businessLeads).omit({
  id: true,
  createdAt: true,
});

export type InsertBusinessPromotion = z.infer<typeof insertBusinessPromotionSchema>;
export type BusinessPromotion = typeof businessPromotions.$inferSelect;
export type InsertBusinessAnalytics = z.infer<typeof insertBusinessAnalyticsSchema>;
export type BusinessAnalytics = typeof businessAnalytics.$inferSelect;
export type InsertBusinessLead = z.infer<typeof insertBusinessLeadSchema>;
export type BusinessLead = typeof businessLeads.$inferSelect;

export interface BusinessPromotionWithPost extends BusinessPromotion {
  post?: PostWithAuthor | null;
}

// ============= CONTENT APPEALS =============

export const appealStatusEnum = pgEnum("appeal_status", ["pending", "approved", "denied", "under_review"]);

export const contentAppeals = pgTable("content_appeals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  violationId: varchar("violation_id").notNull().references(() => contentViolations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  additionalInfo: text("additional_info"),
  status: appealStatusEnum("status").notNull().default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentAppealsRelations = relations(contentAppeals, ({ one }) => ({
  violation: one(contentViolations, {
    fields: [contentAppeals.violationId],
    references: [contentViolations.id],
  }),
  user: one(users, {
    fields: [contentAppeals.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [contentAppeals.reviewedBy],
    references: [users.id],
  }),
}));

export const insertContentAppealSchema = createInsertSchema(contentAppeals).omit({
  id: true,
  reviewedBy: true,
  reviewNotes: true,
  reviewedAt: true,
  createdAt: true,
});

export type InsertContentAppeal = z.infer<typeof insertContentAppealSchema>;
export type ContentAppeal = typeof contentAppeals.$inferSelect;

export interface ContentAppealWithDetails extends ContentAppeal {
  violation: typeof contentViolations.$inferSelect;
  user: User;
  reviewer?: User;
}

// ============= LUMINA MARKETPLACE - PHASE 1: CORE SHOP & PRODUCTS =============

export const shopStatusEnum = pgEnum("shop_status", ["pending", "active", "suspended", "closed"]);
export const shopProductStatusEnum = pgEnum("shop_product_status", ["draft", "active", "out_of_stock", "discontinued"]);
export const shopOrderStatusEnum = pgEnum("shop_order_status", ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded", "disputed"]);
export const shopProductCategoryEnum = pgEnum("shop_product_category", [
  "fashion", "electronics", "beauty", "home", "food", "services", "digital", "collectibles", "other"
]);
export const shopProductTypeEnum = pgEnum("shop_product_type", ["one_time", "subscription", "auction", "pre_order"]);

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  category: shopProductCategoryEnum("category").default("other"),
  status: shopStatusEnum("status").default("pending"),
  shopNftTokenId: text("shop_nft_token_id"),
  walletAddress: text("wallet_address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  socialLinks: jsonb("social_links"),
  policies: jsonb("policies"),
  shippingInfo: jsonb("shipping_info"),
  totalSales: integer("total_sales").default(0),
  totalRevenue: text("total_revenue").default("0"),
  totalProducts: integer("total_products").default(0),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  isVerified: boolean("is_verified").default(false),
  featuredAt: timestamp("featured_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, {
    fields: [shops.ownerId],
    references: [users.id],
  }),
  products: many(shopProducts),
  orders: many(shopOrders),
  affiliateProgram: one(affiliatePrograms),
}));

export const shopProducts = pgTable("shop_products", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"),
  slug: text("slug").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  mediaUrls: text("media_urls").array(),
  thumbnailUrl: text("thumbnail_url"),
  category: shopProductCategoryEnum("category").default("other"),
  productType: shopProductTypeEnum("product_type").default("one_time"),
  status: shopProductStatusEnum("status").default("draft"),
  priceAxm: text("price_axm").notNull(),
  compareAtPriceAxm: text("compare_at_price_axm"),
  costAxm: text("cost_axm"),
  inventory: integer("inventory"),
  trackInventory: boolean("track_inventory").default(false),
  allowBackorder: boolean("allow_backorder").default(false),
  sku: text("sku"),
  weight: integer("weight"),
  dimensions: jsonb("dimensions"),
  attributes: jsonb("attributes"),
  tags: text("tags").array(),
  isDigital: boolean("is_digital").default(false),
  digitalFileUrl: text("digital_file_url"),
  requiresShipping: boolean("requires_shipping").default(true),
  nftTokenId: text("nft_token_id"),
  provenanceCertId: text("provenance_cert_id"),
  totalSales: integer("total_sales").default(0),
  totalRevenue: text("total_revenue").default("0"),
  viewCount: integer("view_count").default(0),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  affiliateCommissionBps: integer("affiliate_commission_bps").default(1000),
  isFeatured: boolean("is_featured").default(false),
  featuredAt: timestamp("featured_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shopProductsRelations = relations(shopProducts, ({ one, many }) => ({
  shop: one(shops, {
    fields: [shopProducts.shopId],
    references: [shops.id],
  }),
  orderItems: many(shopOrderItems),
  reviews: many(productReviews),
  affiliateLinks: many(affiliateLinks),
}));

export const shopOrders = pgTable("shop_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  shopId: integer("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: shopOrderStatusEnum("status").default("pending"),
  subtotalAxm: text("subtotal_axm").notNull(),
  shippingAxm: text("shipping_axm").default("0"),
  discountAxm: text("discount_axm").default("0"),
  totalAxm: text("total_axm").notNull(),
  platformFeeAxm: text("platform_fee_axm").default("0"),
  affiliateFeeAxm: text("affiliate_fee_axm").default("0"),
  sellerReceivesAxm: text("seller_receives_axm").notNull(),
  paymentTxHash: text("payment_tx_hash"),
  platformFeeTxHash: text("platform_fee_tx_hash"),
  paymentConfirmedAt: timestamp("payment_confirmed_at"),
  affiliateLinkId: integer("affiliate_link_id"),
  shippingAddress: jsonb("shipping_address"),
  shippingMethod: text("shipping_method"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  notes: text("notes"),
  buyerNotes: text("buyer_notes"),
  liveSessionId: varchar("live_session_id"),
  cashbackAmount: text("cashback_amount").default("0"),
  cashbackTxHash: text("cashback_tx_hash"),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shopOrdersRelations = relations(shopOrders, ({ one, many }) => ({
  shop: one(shops, {
    fields: [shopOrders.shopId],
    references: [shops.id],
  }),
  buyer: one(users, {
    fields: [shopOrders.buyerId],
    references: [users.id],
  }),
  items: many(shopOrderItems),
  dispute: one(disputes),
  affiliateLink: one(affiliateLinks, {
    fields: [shopOrders.affiliateLinkId],
    references: [affiliateLinks.id],
  }),
}));

export const shopOrderItems = pgTable("shop_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => shopOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => shopProducts.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  priceAxm: text("price_axm").notNull(),
  totalAxm: text("total_axm").notNull(),
  attributes: jsonb("attributes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shopOrderItemsRelations = relations(shopOrderItems, ({ one }) => ({
  order: one(shopOrders, {
    fields: [shopOrderItems.orderId],
    references: [shopOrders.id],
  }),
  product: one(shopProducts, {
    fields: [shopOrderItems.productId],
    references: [shopProducts.id],
  }),
}));

export const shopPayouts = pgTable("shop_payouts", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => shopOrders.id, { onDelete: "set null" }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientWallet: text("recipient_wallet").notNull(),
  amountAxm: text("amount_axm").notNull(),
  payoutType: text("payout_type").notNull(),
  txHash: text("tx_hash"),
  status: text("status").default("pending"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shopPayoutsRelations = relations(shopPayouts, ({ one }) => ({
  shop: one(shops, {
    fields: [shopPayouts.shopId],
    references: [shops.id],
  }),
  order: one(shopOrders, {
    fields: [shopPayouts.orderId],
    references: [shopOrders.id],
  }),
  recipient: one(users, {
    fields: [shopPayouts.recipientId],
    references: [users.id],
  }),
}));

// ============= LUMINA MARKETPLACE - PHASE 2: AFFILIATES & BOUNTIES =============

export const affiliatePrograms = pgTable("affiliate_programs", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().unique().references(() => shops.id, { onDelete: "cascade" }),
  name: text("name"),
  description: text("description"),
  commissionType: text("commission_type").default("percentage"),
  commissionRate: text("commission_rate").default("10"),
  cookieDuration: integer("cookie_duration").default(30),
  isActive: boolean("is_active").default(true),
  autoApprove: boolean("auto_approve").default(true),
  terms: text("terms"),
  minPayout: text("min_payout").default("10"),
  allowSelfReferral: boolean("allow_self_referral").default(false),
  tierEnabled: boolean("tier_enabled").default(false),
  tierRates: jsonb("tier_rates"),
  totalAffiliates: integer("total_affiliates").default(0),
  totalPayouts: text("total_payouts").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const affiliateProgramsRelations = relations(affiliatePrograms, ({ one, many }) => ({
  shop: one(shops, {
    fields: [affiliatePrograms.shopId],
    references: [shops.id],
  }),
  links: many(affiliateLinks),
  bounties: many(bounties),
}));

export const affiliateLinkStatusEnum = pgEnum("affiliate_link_status", ["active", "paused", "expired"]);

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => affiliatePrograms.id, { onDelete: "cascade" }),
  affiliateUserId: varchar("affiliate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => shopProducts.id, { onDelete: "set null" }),
  code: text("code").notNull().unique(),
  url: text("url"),
  status: affiliateLinkStatusEnum("status").default("active"),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  earnings: text("earnings").default("0"),
  revenue: text("revenue").default("0"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const affiliateLinksRelations = relations(affiliateLinks, ({ one, many }) => ({
  program: one(affiliatePrograms, {
    fields: [affiliateLinks.programId],
    references: [affiliatePrograms.id],
  }),
  affiliateUser: one(users, {
    fields: [affiliateLinks.affiliateUserId],
    references: [users.id],
  }),
  product: one(shopProducts, {
    fields: [affiliateLinks.productId],
    references: [shopProducts.id],
  }),
  earnings: many(affiliateEarnings),
  orders: many(shopOrders),
}));

export const affiliateEarnings = pgTable("affiliate_earnings", {
  id: serial("id").primaryKey(),
  affiliateLinkId: integer("affiliate_link_id").notNull().references(() => affiliateLinks.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => shopOrders.id, { onDelete: "cascade" }),
  amount: text("amount").notNull(),
  status: text("status").default("pending"),
  txHash: text("tx_hash"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const affiliateEarningsRelations = relations(affiliateEarnings, ({ one }) => ({
  link: one(affiliateLinks, {
    fields: [affiliateEarnings.affiliateLinkId],
    references: [affiliateLinks.id],
  }),
  order: one(shopOrders, {
    fields: [affiliateEarnings.orderId],
    references: [shopOrders.id],
  }),
}));

export const bountyStatusEnum = pgEnum("bounty_status", ["open", "in_progress", "completed", "cancelled", "expired"]);

export const bounties = pgTable("bounties", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => affiliatePrograms.id, { onDelete: "set null" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shopId: integer("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => shopProducts.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  bountyType: text("bounty_type").notNull(),
  rewardAmount: text("reward_amount").notNull(),
  totalBudget: text("total_budget").notNull(),
  remainingBudget: text("remaining_budget").notNull(),
  maxClaims: integer("max_claims").default(1),
  claimedCount: integer("claimed_count").default(0),
  requirements: jsonb("requirements"),
  status: bountyStatusEnum("status").default("open"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bountiesRelations = relations(bounties, ({ one, many }) => ({
  program: one(affiliatePrograms, {
    fields: [bounties.programId],
    references: [affiliatePrograms.id],
  }),
  creator: one(users, {
    fields: [bounties.creatorId],
    references: [users.id],
  }),
  shop: one(shops, {
    fields: [bounties.shopId],
    references: [shops.id],
  }),
  product: one(shopProducts, {
    fields: [bounties.productId],
    references: [shopProducts.id],
  }),
  claims: many(bountyClaims),
}));

export const bountyClaims = pgTable("bounty_claims", {
  id: serial("id").primaryKey(),
  bountyId: integer("bounty_id").notNull().references(() => bounties.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("pending"),
  proofUrl: text("proof_url"),
  proofText: text("proof_text"),
  txHash: text("tx_hash"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bountyClaimsRelations = relations(bountyClaims, ({ one }) => ({
  bounty: one(bounties, {
    fields: [bountyClaims.bountyId],
    references: [bounties.id],
  }),
  user: one(users, {
    fields: [bountyClaims.userId],
    references: [users.id],
  }),
}));

// ============= LUMINA MARKETPLACE - PHASE 3: BUY-TO-EARN & REVIEWS =============

export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected", "flagged"]);

export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => shopProducts.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => shopOrders.id, { onDelete: "set null" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: text("title"),
  content: text("content"),
  images: text("images").array(),
  videoUrl: text("video_url"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  isVideoReview: boolean("is_video_review").default(false),
  status: reviewStatusEnum("status").default("pending"),
  helpfulVotes: integer("helpful_votes").default(0),
  notHelpfulVotes: integer("not_helpful_votes").default(0),
  reviewerReputationScore: integer("reviewer_reputation_score").default(0),
  rewardEarned: text("reward_earned").default("0"),
  rewardTx: text("reward_tx"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(shopProducts, {
    fields: [productReviews.productId],
    references: [shopProducts.id],
  }),
  order: one(shopOrders, {
    fields: [productReviews.orderId],
    references: [shopOrders.id],
  }),
  reviewer: one(users, {
    fields: [productReviews.reviewerId],
    references: [users.id],
  }),
}));

// ============= LUMINA MARKETPLACE - PHASE 4: LIVE SHOPPING =============

export const liveShopSessions = pgTable("live_shop_sessions", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").notNull(),
  shopId: integer("shop_id").notNull(),
  hostId: integer("host_id").notNull(),
  title: text("title"),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").default("scheduled"),
  viewerCount: integer("viewer_count").default(0),
  peakViewers: integer("peak_viewers").default(0),
  totalSales: text("total_sales").default("0"),
  orderCount: integer("order_count").default(0),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveShopSessionsRelations = relations(liveShopSessions, ({ one, many }) => ({
  stream: one(liveStreams, {
    fields: [liveShopSessions.streamId],
    references: [liveStreams.id],
  }),
  shop: one(shops, {
    fields: [liveShopSessions.shopId],
    references: [shops.id],
  }),
  host: one(users, {
    fields: [liveShopSessions.hostId],
    references: [users.id],
  }),
  featuredProducts: many(liveProductFeatures),
}));

export const liveProductFeatures = pgTable("live_product_features", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  productId: integer("product_id").notNull(),
  orderPosition: integer("order_position").default(0),
  discountPercent: integer("discount_percent").default(0),
  limitedQuantity: integer("limited_quantity"),
  soldCount: integer("sold_count").default(0),
  isFlashSale: boolean("is_flash_sale").default(false),
  flashSaleEnds: timestamp("flash_sale_ends"),
  isActive: boolean("is_active").default(true),
  featuredAt: timestamp("featured_at").defaultNow(),
});

export const liveProductFeaturesRelations = relations(liveProductFeatures, ({ one }) => ({
  session: one(liveShopSessions, {
    fields: [liveProductFeatures.sessionId],
    references: [liveShopSessions.id],
  }),
  product: one(shopProducts, {
    fields: [liveProductFeatures.productId],
    references: [shopProducts.id],
  }),
}));

// ============= LUMINA MARKETPLACE - PHASE 5: DISPUTES & ARBITRATION =============

export const disputeStatusEnum = pgEnum("dispute_status", ["open", "evidence", "voting", "resolved", "appealed", "closed"]);
export const disputeResolutionEnum = pgEnum("dispute_resolution", ["refund", "partial_refund", "no_refund", "replacement"]);

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().unique().references(() => shopOrders.id, { onDelete: "cascade" }),
  shopId: integer("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  disputeType: text("dispute_type").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  evidenceUrls: text("evidence_urls").array(),
  amountDisputed: text("amount_disputed").notNull(),
  status: disputeStatusEnum("status").default("open"),
  resolution: disputeResolutionEnum("resolution"),
  arbitrators: integer("arbitrators").array(),
  votesForBuyer: integer("votes_for_buyer").default(0),
  votesForSeller: integer("votes_for_seller").default(0),
  buyerRefund: text("buyer_refund"),
  sellerPayout: text("seller_payout"),
  resolutionTx: text("resolution_tx"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disputesRelations = relations(disputes, ({ one }) => ({
  order: one(shopOrders, {
    fields: [disputes.orderId],
    references: [shopOrders.id],
  }),
  shop: one(shops, {
    fields: [disputes.shopId],
    references: [shops.id],
  }),
  buyer: one(users, {
    fields: [disputes.buyerId],
    references: [users.id],
    relationName: "disputeBuyer",
  }),
  seller: one(users, {
    fields: [disputes.sellerId],
    references: [users.id],
    relationName: "disputeSeller",
  }),
}));

export const disputeEvidence = pgTable("dispute_evidence", {
  id: serial("id").primaryKey(),
  disputeId: integer("dispute_id").notNull().references(() => disputes.id, { onDelete: "cascade" }),
  submittedBy: varchar("submitted_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  evidenceType: text("evidence_type").notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  ipfsHash: text("ipfs_hash"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disputeEvidenceRelations = relations(disputeEvidence, ({ one }) => ({
  dispute: one(disputes, {
    fields: [disputeEvidence.disputeId],
    references: [disputes.id],
  }),
  submitter: one(users, {
    fields: [disputeEvidence.submittedBy],
    references: [users.id],
  }),
}));

export const arbitrators = pgTable("arbitrators", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  stakingAmount: text("staking_amount").notNull(),
  stakingTx: text("staking_tx"),
  isActive: boolean("is_active").default(true),
  casesResolved: integer("cases_resolved").default(0),
  accuracyScore: text("accuracy_score").default("100"),
  reputationTier: integer("reputation_tier").default(1),
  slashingCount: integer("slashing_count").default(0),
  totalRewards: text("total_rewards").default("0"),
  lastCaseAt: timestamp("last_case_at"),
  suspendedUntil: timestamp("suspended_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arbitratorsRelations = relations(arbitrators, ({ one, many }) => ({
  user: one(users, {
    fields: [arbitrators.userId],
    references: [users.id],
  }),
  votes: many(arbitratorVotes),
}));

export const arbitratorVotes = pgTable("arbitrator_votes", {
  id: serial("id").primaryKey(),
  disputeId: integer("dispute_id").notNull().references(() => disputes.id, { onDelete: "cascade" }),
  arbitratorId: integer("arbitrator_id").notNull().references(() => arbitrators.id, { onDelete: "cascade" }),
  vote: text("vote").notNull(),
  reasoning: text("reasoning"),
  stakedAmount: text("staked_amount"),
  rewardEarned: text("reward_earned"),
  slashed: boolean("slashed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arbitratorVotesRelations = relations(arbitratorVotes, ({ one }) => ({
  dispute: one(disputes, {
    fields: [arbitratorVotes.disputeId],
    references: [disputes.id],
  }),
  arbitrator: one(arbitrators, {
    fields: [arbitratorVotes.arbitratorId],
    references: [arbitrators.id],
  }),
}));

export const productProvenance = pgTable("product_provenance", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  eventType: text("event_type").notNull(),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  eventData: jsonb("event_data"),
  ipfsHash: text("ipfs_hash"),
  verified: boolean("verified").default(false),
  verifierSignature: text("verifier_signature"),
  previousEventId: integer("previous_event_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const productProvenanceRelations = relations(productProvenance, ({ one }) => ({
  product: one(shopProducts, {
    fields: [productProvenance.productId],
    references: [shopProducts.id],
  }),
  previousEvent: one(productProvenance, {
    fields: [productProvenance.previousEventId],
    references: [productProvenance.id],
  }),
}));

// ============= MARKETPLACE INSERT SCHEMAS & TYPES =============

export const insertShopSchema = createInsertSchema(shops).omit({
  id: true,
  totalSales: true,
  totalRevenue: true,
  totalProducts: true,
  rating: true,
  reviewCount: true,
  featuredAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopProductSchema = createInsertSchema(shopProducts).omit({
  id: true,
  totalSales: true,
  totalRevenue: true,
  viewCount: true,
  rating: true,
  reviewCount: true,
  featuredAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopOrderSchema = createInsertSchema(shopOrders).omit({
  id: true,
  orderNumber: true,
  paymentConfirmedAt: true,
  cashbackTxHash: true,
  paidAt: true,
  shippedAt: true,
  deliveredAt: true,
  cancelledAt: true,
  refundedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopOrderItemSchema = createInsertSchema(shopOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertShopPayoutSchema = createInsertSchema(shopPayouts).omit({
  id: true,
  processedAt: true,
  createdAt: true,
});

export const insertAffiliateProgramSchema = createInsertSchema(affiliatePrograms).omit({
  id: true,
  totalAffiliates: true,
  totalPayouts: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({
  id: true,
  clicks: true,
  conversions: true,
  earnings: true,
  revenue: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBountySchema = createInsertSchema(bounties).omit({
  id: true,
  claimedCount: true,
  createdAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  helpfulVotes: true,
  notHelpfulVotes: true,
  reviewerReputationScore: true,
  rewardEarned: true,
  rewardTx: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  resolution: true,
  arbitrators: true,
  votesForBuyer: true,
  votesForSeller: true,
  buyerRefund: true,
  sellerPayout: true,
  resolutionTx: true,
  resolvedAt: true,
  createdAt: true,
});

export const insertArbitratorSchema = createInsertSchema(arbitrators).omit({
  id: true,
  casesResolved: true,
  accuracyScore: true,
  reputationTier: true,
  slashingCount: true,
  totalRewards: true,
  lastCaseAt: true,
  suspendedUntil: true,
  createdAt: true,
});

// ============= MARKETPLACE TYPES =============

export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shops.$inferSelect;
export type InsertShopProduct = z.infer<typeof insertShopProductSchema>;
export type ShopProduct = typeof shopProducts.$inferSelect;
export type InsertShopOrder = z.infer<typeof insertShopOrderSchema>;
export type ShopOrder = typeof shopOrders.$inferSelect;
export type InsertShopOrderItem = z.infer<typeof insertShopOrderItemSchema>;
export type ShopOrderItem = typeof shopOrderItems.$inferSelect;
export type InsertShopPayout = z.infer<typeof insertShopPayoutSchema>;
export type ShopPayout = typeof shopPayouts.$inferSelect;
export type InsertAffiliateProgram = z.infer<typeof insertAffiliateProgramSchema>;
export type AffiliateProgram = typeof affiliatePrograms.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertBounty = z.infer<typeof insertBountySchema>;
export type Bounty = typeof bounties.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertArbitrator = z.infer<typeof insertArbitratorSchema>;
export type Arbitrator = typeof arbitrators.$inferSelect;

// Extended marketplace types
export interface ShopWithOwner extends Shop {
  owner: User;
}

export interface ShopProductWithShop extends ShopProduct {
  shop: ShopWithOwner;
}

export interface ShopOrderWithDetails extends ShopOrder {
  shop: Shop;
  buyer: User;
  items: (ShopOrderItem & { product: ShopProduct })[];
  affiliateLink?: AffiliateLink | null;
}

export interface ProductReviewWithReviewer extends ProductReview {
  reviewer: User;
  product: ShopProduct;
}

export interface DisputeWithParties extends Dispute {
  order: ShopOrder;
  initiator: User;
  respondent: User;
  evidence: (typeof disputeEvidence.$inferSelect)[];
}

export interface ArbitratorWithUser extends Arbitrator {
  user: User;
}

export interface AffiliateLinkWithDetails extends AffiliateLink {
  creator: User;
  program: AffiliateProgram & { shop: Shop };
  product?: ShopProduct | null;
}

export interface BountyWithDetails extends Bounty {
  program: AffiliateProgram & { shop: Shop };
  product?: ShopProduct | null;
  claims: (typeof bountyClaims.$inferSelect & { creator: User })[];
}

// ============= FEEDBACK/BETA REPORTS =============

export const feedbackTypeEnum = pgEnum("feedback_type", ["bug", "suggestion", "general"]);

export const feedbackReports = pgTable("feedback_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  type: feedbackTypeEnum("type").notNull().default("general"),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackReportSchema = createInsertSchema(feedbackReports).omit({
  id: true,
  createdAt: true,
});

export type InsertFeedbackReport = z.infer<typeof insertFeedbackReportSchema>;
export type FeedbackReport = typeof feedbackReports.$inferSelect;

// ============= PHASE 1 GROWTH: CREATOR GUILD =============

export const guildApplicationStatusEnum = pgEnum("guild_application_status", ["pending", "approved", "rejected", "waitlisted"]);
export const guildMemberTierEnum = pgEnum("guild_member_tier", ["founding", "pioneer", "creator", "rising"]);

export const guildApplications = pgTable("guild_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: guildApplicationStatusEnum("status").notNull().default("pending"),
  creatorType: text("creator_type").notNull(), // content type they create
  socialLinks: jsonb("social_links"), // twitter, youtube, etc.
  followerCount: integer("follower_count").default(0),
  whyJoin: text("why_join").notNull(),
  portfolioUrls: text("portfolio_urls").array(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guildMembers = pgTable("guild_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  tier: guildMemberTierEnum("tier").notNull().default("rising"),
  vestingAmount: text("vesting_amount").default("0"), // total AXM allocated
  vestedAmount: text("vested_amount").default("0"), // AXM already vested
  claimedAmount: text("claimed_amount").default("0"), // AXM claimed
  vestingStartDate: timestamp("vesting_start_date"),
  vestingEndDate: timestamp("vesting_end_date"),
  weeklyReward: text("weekly_reward").default("0"), // weekly AXM allocation
  contributionScore: integer("contribution_score").default(0),
  specialBadges: text("special_badges").array(),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guildPerks = pgTable("guild_perks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name"),
  requiredTier: guildMemberTierEnum("required_tier").notNull().default("rising"),
  perkType: text("perk_type").notNull(), // "boost", "access", "reward", "badge"
  perkValue: jsonb("perk_value"), // specific perk data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guildSyncs = pgTable("guild_syncs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  meetingUrl: text("meeting_url"),
  hostId: varchar("host_id").references(() => users.id),
  attendeeCount: integer("attendee_count").default(0),
  recordingUrl: text("recording_url"),
  notes: text("notes"),
  status: text("status").default("scheduled"), // scheduled, live, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const guildSyncAttendees = pgTable("guild_sync_attendees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncId: varchar("sync_id").notNull().references(() => guildSyncs.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rsvpStatus: text("rsvp_status").default("pending"), // pending, attending, declined
  attendedAt: timestamp("attended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============= PHASE 1 GROWTH: REFERRAL SYSTEM =============

export const referralTierEnum = pgEnum("referral_tier", ["bronze", "silver", "gold", "platinum", "diamond"]);

export const referralStats = pgTable("referral_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  referralCode: text("referral_code").notNull().unique(),
  tier: referralTierEnum("tier").notNull().default("bronze"),
  totalReferrals: integer("total_referrals").default(0),
  activeReferrals: integer("active_referrals").default(0), // referrals who are still active
  totalEarnings: text("total_earnings").default("0"), // total AXM earned from referrals
  pendingEarnings: text("pending_earnings").default("0"), // unclaimed AXM
  revenueShareEarnings: text("revenue_share_earnings").default("0"), // from tip revenue share
  lifetimeValue: text("lifetime_value").default("0"), // value generated by all referrals
  lastReferralAt: timestamp("last_referral_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Note: referralEvents table already exists above, using the existing one

export const referralMilestones = pgTable("referral_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  requiredReferrals: integer("required_referrals").notNull(),
  rewardAmount: text("reward_amount").notNull(), // AXM reward
  badgeName: text("badge_name"),
  badgeIcon: text("badge_icon"),
  tier: referralTierEnum("tier").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralLeaderboard = pgTable("referral_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  period: text("period").notNull(), // "weekly", "monthly", "alltime"
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  referralCount: integer("referral_count").default(0),
  earnings: text("earnings").default("0"),
  rank: integer("rank"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============= PHASE 1 GROWTH: ENHANCED QUEST/MISSION SYSTEM =============

export const missionFrequencyEnum = pgEnum("mission_frequency", ["onboarding", "daily", "weekly", "special", "achievement"]);
export const missionCategoryEnum = pgEnum("mission_category", ["social", "content", "web3", "community", "engagement"]);

export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  frequency: missionFrequencyEnum("frequency").notNull().default("daily"),
  category: missionCategoryEnum("category").notNull().default("engagement"),
  requirement: text("requirement").notNull(), // action required (e.g., "create_post", "follow_user")
  targetValue: integer("target_value").notNull().default(1),
  pointsReward: integer("points_reward").notNull().default(10),
  xpReward: integer("xp_reward").notNull().default(5),
  axmReward: text("axm_reward").default("0"),
  badgeReward: text("badge_reward"), // badge name if mission unlocks a badge
  iconName: text("icon_name"),
  iconColor: text("icon_color"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userMissionProgress = pgTable("user_mission_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  missionId: varchar("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  currentValue: integer("current_value").default(0),
  isCompleted: boolean("is_completed").default(false),
  rewardClaimed: boolean("reward_claimed").default(false),
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  periodStart: timestamp("period_start"), // for daily/weekly tracking
  periodEnd: timestamp("period_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  streakMultiplier: integer("streak_multiplier").default(100), // percentage bonus
  freezesAvailable: integer("freezes_available").default(0), // streak freeze tokens
  totalDaysActive: integer("total_days_active").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streakRewards = pgTable("streak_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayNumber: integer("day_number").notNull().unique(),
  pointsReward: integer("points_reward").notNull(),
  xpReward: integer("xp_reward").notNull().default(0),
  axmReward: text("axm_reward").default("0"),
  bonusMultiplier: integer("bonus_multiplier").default(100),
  specialReward: text("special_reward"), // badge or special item
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============= PHASE 1 GROWTH: EVENTS CALENDAR =============

export const communityEventTypeEnum = pgEnum("community_event_type", ["ama", "trading_session", "creator_spotlight", "town_hall", "workshop", "launch", "community"]);
export const communityEventStatusEnum = pgEnum("community_event_status", ["draft", "scheduled", "live", "completed", "cancelled"]);

export const communityEvents = pgTable("community_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: communityEventTypeEnum("event_type").notNull().default("community"),
  status: communityEventStatusEnum("status").notNull().default("scheduled"),
  coverImageUrl: text("cover_image_url"),
  hostId: varchar("host_id").notNull().references(() => users.id),
  coHostIds: text("co_host_ids").array(),
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  timezone: text("timezone").default("UTC"),
  location: text("location"), // "online", or physical location
  meetingUrl: text("meeting_url"),
  streamId: varchar("stream_id").references(() => liveStreams.id),
  maxAttendees: integer("max_attendees"),
  rsvpCount: integer("rsvp_count").default(0),
  attendeeCount: integer("attendee_count").default(0),
  pointsForAttending: integer("points_for_attending").default(50),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: jsonb("recurring_pattern"), // weekly, biweekly, etc.
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(true),
  recordingUrl: text("recording_url"),
  highlights: text("highlights"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityEventRsvps = pgTable("community_event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => communityEvents.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("going"), // going, interested, not_going
  notifyBefore: boolean("notify_before").default(true),
  attendedAt: timestamp("attended_at"),
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityEventReminders = pgTable("community_event_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => communityEvents.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reminderTime: timestamp("reminder_time").notNull(),
  reminderType: text("reminder_type").default("push"), // push, email, both
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============= PHASE 1 GROWTH: REWARDS LEDGER =============

export const rewardTypeEnum = pgEnum("reward_type", [
  "daily_checkin", "mission_complete", "referral_bonus", "event_attendance",
  "guild_reward", "streak_bonus", "achievement", "tip_received", "content_bonus"
]);

export const rewardsLedger = pgTable("rewards_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardType: rewardTypeEnum("reward_type").notNull(),
  axmAmount: text("axm_amount").default("0"),
  xpAmount: integer("xp_amount").default(0),
  pointsAmount: integer("points_amount").default(0),
  sourceType: text("source_type"), // e.g., "mission", "referral", "event", "checkin"
  sourceId: text("source_id"), // the ID of the mission, event, etc.
  description: text("description"),
  isClaimed: boolean("is_claimed").default(false),
  claimedAt: timestamp("claimed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewardsLedgerRelations = relations(rewardsLedger, ({ one }) => ({
  user: one(users, { fields: [rewardsLedger.userId], references: [users.id] }),
}));

// ============= PHASE 1 GROWTH: RELATIONS =============

export const guildApplicationsRelations = relations(guildApplications, ({ one }) => ({
  user: one(users, { fields: [guildApplications.userId], references: [users.id] }),
  reviewer: one(users, { fields: [guildApplications.reviewedBy], references: [users.id] }),
}));

export const guildMembersRelations = relations(guildMembers, ({ one }) => ({
  user: one(users, { fields: [guildMembers.userId], references: [users.id] }),
}));

export const guildSyncsRelations = relations(guildSyncs, ({ one, many }) => ({
  host: one(users, { fields: [guildSyncs.hostId], references: [users.id] }),
  attendees: many(guildSyncAttendees),
}));

export const guildSyncAttendeesRelations = relations(guildSyncAttendees, ({ one }) => ({
  sync: one(guildSyncs, { fields: [guildSyncAttendees.syncId], references: [guildSyncs.id] }),
  user: one(users, { fields: [guildSyncAttendees.userId], references: [users.id] }),
}));

export const referralStatsRelations = relations(referralStats, ({ one }) => ({
  user: one(users, { fields: [referralStats.userId], references: [users.id] }),
}));

// Note: referralEventsRelations already defined above

export const missionsRelations = relations(missions, ({ many }) => ({
  progress: many(userMissionProgress),
}));

export const userMissionProgressRelations = relations(userMissionProgress, ({ one }) => ({
  user: one(users, { fields: [userMissionProgress.userId], references: [users.id] }),
  mission: one(missions, { fields: [userMissionProgress.missionId], references: [missions.id] }),
}));

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, { fields: [userStreaks.userId], references: [users.id] }),
}));

export const communityEventsRelations = relations(communityEvents, ({ one, many }) => ({
  host: one(users, { fields: [communityEvents.hostId], references: [users.id] }),
  stream: one(liveStreams, { fields: [communityEvents.streamId], references: [liveStreams.id] }),
  rsvps: many(communityEventRsvps),
  reminders: many(communityEventReminders),
}));

export const communityEventRsvpsRelations = relations(communityEventRsvps, ({ one }) => ({
  event: one(communityEvents, { fields: [communityEventRsvps.eventId], references: [communityEvents.id] }),
  user: one(users, { fields: [communityEventRsvps.userId], references: [users.id] }),
}));

export const communityEventRemindersRelations = relations(communityEventReminders, ({ one }) => ({
  event: one(communityEvents, { fields: [communityEventReminders.eventId], references: [communityEvents.id] }),
  user: one(users, { fields: [communityEventReminders.userId], references: [users.id] }),
}));

// ============= PHASE 1 GROWTH: INSERT SCHEMAS =============

export const insertGuildApplicationSchema = createInsertSchema(guildApplications).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  reviewedAt: true,
  createdAt: true,
});

export const insertGuildMemberSchema = createInsertSchema(guildMembers).omit({
  id: true,
  vestedAmount: true,
  claimedAmount: true,
  joinedAt: true,
  createdAt: true,
});

export const insertGuildPerkSchema = createInsertSchema(guildPerks).omit({
  id: true,
  createdAt: true,
});

export const insertGuildSyncSchema = createInsertSchema(guildSyncs).omit({
  id: true,
  attendeeCount: true,
  createdAt: true,
});

export const insertReferralStatsSchema = createInsertSchema(referralStats).omit({
  id: true,
  totalReferrals: true,
  activeReferrals: true,
  totalEarnings: true,
  pendingEarnings: true,
  revenueShareEarnings: true,
  lifetimeValue: true,
  lastReferralAt: true,
  createdAt: true,
});

// Note: insertReferralEventSchema already exists above

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
});

export const insertUserMissionProgressSchema = createInsertSchema(userMissionProgress).omit({
  id: true,
  isCompleted: true,
  rewardClaimed: true,
  completedAt: true,
  claimedAt: true,
  createdAt: true,
});

export const insertUserStreakSchema = createInsertSchema(userStreaks).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityEventSchema = createInsertSchema(communityEvents).omit({
  id: true,
  status: true,
  actualStart: true,
  actualEnd: true,
  rsvpCount: true,
  attendeeCount: true,
  recordingUrl: true,
  createdAt: true,
});

export const insertCommunityEventRsvpSchema = createInsertSchema(communityEventRsvps).omit({
  id: true,
  attendedAt: true,
  pointsEarned: true,
  createdAt: true,
});

export const insertCommunityEventReminderSchema = createInsertSchema(communityEventReminders).omit({
  id: true,
  sent: true,
  sentAt: true,
  createdAt: true,
});

export const insertRewardsLedgerSchema = createInsertSchema(rewardsLedger).omit({
  id: true,
  isClaimed: true,
  claimedAt: true,
  createdAt: true,
});

// ============= PHASE 1 GROWTH: TYPES =============

export type InsertRewardsLedger = z.infer<typeof insertRewardsLedgerSchema>;
export type RewardsLedgerEntry = typeof rewardsLedger.$inferSelect;

export type InsertGuildApplication = z.infer<typeof insertGuildApplicationSchema>;
export type GuildApplication = typeof guildApplications.$inferSelect;
export type InsertGuildMember = z.infer<typeof insertGuildMemberSchema>;
export type GuildMember = typeof guildMembers.$inferSelect;
export type InsertGuildPerk = z.infer<typeof insertGuildPerkSchema>;
export type GuildPerk = typeof guildPerks.$inferSelect;
export type InsertGuildSync = z.infer<typeof insertGuildSyncSchema>;
export type GuildSync = typeof guildSyncs.$inferSelect;
export type InsertReferralStatsRecord = z.infer<typeof insertReferralStatsSchema>;
export type ReferralStatsRecord = typeof referralStats.$inferSelect;
// Note: InsertReferralEvent and ReferralEvent types already exist above
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;
export type InsertUserMissionProgress = z.infer<typeof insertUserMissionProgressSchema>;
export type UserMissionProgress = typeof userMissionProgress.$inferSelect;
export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;
export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertCommunityEvent = z.infer<typeof insertCommunityEventSchema>;
export type CommunityEvent = typeof communityEvents.$inferSelect;
export type InsertCommunityEventRsvp = z.infer<typeof insertCommunityEventRsvpSchema>;
export type CommunityEventRsvp = typeof communityEventRsvps.$inferSelect;
export type InsertCommunityEventReminder = z.infer<typeof insertCommunityEventReminderSchema>;
export type CommunityEventReminder = typeof communityEventReminders.$inferSelect;

// ============= PHASE 1 GROWTH: EXTENDED TYPES =============

export interface GuildApplicationWithUser extends GuildApplication {
  user: User;
  reviewer?: User | null;
}

export interface GuildMemberWithUser extends GuildMember {
  user: User;
}

export interface GuildSyncWithDetails extends GuildSync {
  host?: User | null;
  attendees: { user: User; rsvpStatus: string }[];
}

export interface ReferralStatsWithUser extends ReferralStatsRecord {
  user: User;
}

// Note: ReferralEventWithUsers type already exists above as ReferralEventWithParties

export interface MissionWithProgress extends Mission {
  progress?: UserMissionProgress | null;
}

export interface CommunityEventWithHost extends CommunityEvent {
  host: User;
  rsvps?: CommunityEventRsvp[];
  userRsvp?: CommunityEventRsvp | null;
}
