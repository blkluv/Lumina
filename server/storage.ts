import {
  users,
  posts,
  comments,
  likes,
  follows,
  groups,
  groupMemberships,
  notifications,
  rewardEvents,
  rewardSnapshots,
  conversations,
  messages,
  quests,
  userQuestProgress,
  achievements,
  userAchievements,
  stories,
  storyViews,
  liveStreams,
  streamTips,
  streamMessages,
  nfts,
  nftListings,
  proposals,
  proposalVotes,
  stakingPositions,
  stakingRewards,
  reputationBadges,
  adminActivityLogs,
  userOnboarding,
  userTwoFactor,
  emailNotificationPreferences,
  emailQueue,
  storyReactions,
  polls,
  pollOptions,
  pollVotes,
  scheduledPosts,
  referralEvents,
  pushSubscriptions,
  fiatOrders,
  platformSettings,
  contentReports,
  petitions,
  petitionSignatures,
  campaigns,
  campaignDonations,
  events,
  eventRsvps,
  emailCampaigns,
  volunteerOpportunities,
  volunteerShifts,
  volunteerSignups,
  volunteerHours,
  supporterTags,
  userTags,
  savedAudiences,
  opinionPolls,
  opinionPollVotes,
  contactOfficialsCampaigns,
  officialContacts,
  engagementProgress,
  phoneBankingLists,
  phoneBankingContacts,
  canvassingTurfs,
  canvassingContacts,
  recruiterStats,
  type User,
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type Follow,
  type InsertFollow,
  type Group,
  type InsertGroup,
  type GroupMembership,
  type InsertGroupMembership,
  type Notification,
  type InsertNotification,
  type RewardEvent,
  type InsertRewardEvent,
  type RewardSnapshot,
  type InsertRewardSnapshot,
  type PostWithAuthor,
  type CommentWithAuthor,
  type GroupWithCreator,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type MessageWithSender,
  type ConversationWithMessages,
  type Quest,
  type InsertQuest,
  type UserQuestProgress,
  type InsertUserQuestProgress,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type Story,
  type InsertStory,
  type StoryView,
  type InsertStoryView,
  type LiveStream,
  type InsertLiveStream,
  type StreamTip,
  type InsertStreamTip,
  type StreamMessage,
  type InsertStreamMessage,
  type StoryWithAuthor,
  type QuestWithProgress,
  type AchievementWithProgress,
  type LiveStreamWithHost,
  type StreamMessageWithSender,
  type StreamTipWithSender,
  type Nft,
  type InsertNft,
  type NftListing,
  type InsertNftListing,
  type Proposal,
  type InsertProposal,
  type ProposalVote,
  type InsertProposalVote,
  type StakingPosition,
  type InsertStakingPosition,
  type StakingReward,
  type InsertStakingReward,
  type ReputationBadge,
  type InsertReputationBadge,
  type NftWithDetails,
  type NftListingWithDetails,
  type ProposalWithDetails,
  type StakingPositionWithDetails,
  type ReputationBadgeWithUser,
  type AdminActivityLog,
  type InsertAdminActivityLog,
  type UserOnboarding,
  type InsertUserOnboarding,
  type UserTwoFactor,
  type InsertUserTwoFactor,
  type EmailNotificationPreferences,
  type InsertEmailNotificationPreferences,
  type EmailQueue,
  type InsertEmailQueue,
  type StoryReaction,
  type InsertStoryReaction,
  type Poll,
  type InsertPoll,
  type PollOption,
  type InsertPollOption,
  type PollVote,
  type InsertPollVote,
  type ScheduledPost,
  type InsertScheduledPost,
  type ReferralEvent,
  type InsertReferralEvent,
  type PushSubscription,
  type InsertPushSubscription,
  type FiatOrder,
  type InsertFiatOrder,
  type PollWithOptions,
  type ScheduledPostWithDetails,
  type AdminDashboardStats,
  type Petition,
  type InsertPetition,
  type PetitionSignature,
  type InsertPetitionSignature,
  type Campaign,
  type InsertCampaign,
  type CampaignDonation,
  type InsertCampaignDonation,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertEventRsvp,
  type EmailCampaign,
  type InsertEmailCampaign,
  type PetitionWithCreator,
  type CampaignWithCreator,
  type EventWithCreator,
  type VolunteerOpportunity,
  type InsertVolunteerOpportunity,
  type VolunteerShift,
  type InsertVolunteerShift,
  type VolunteerSignup,
  type InsertVolunteerSignup,
  type VolunteerHours,
  type InsertVolunteerHours,
  type SupporterTag,
  type InsertSupporterTag,
  type UserTag,
  type InsertUserTag,
  type SavedAudience,
  type InsertSavedAudience,
  type OpinionPoll,
  type InsertOpinionPoll,
  type OpinionPollVote,
  type InsertOpinionPollVote,
  type ContactOfficialsCampaign,
  type InsertContactOfficialsCampaign,
  type OfficialContact,
  type InsertOfficialContact,
  type EngagementProgress,
  type InsertEngagementProgress,
  type PhoneBankingList,
  type InsertPhoneBankingList,
  type PhoneBankingContact,
  type InsertPhoneBankingContact,
  type CanvassingTurf,
  type InsertCanvassingTurf,
  type CanvassingContact,
  type InsertCanvassingContact,
  type RecruiterStats,
  type InsertRecruiterStats,
  type VolunteerOpportunityWithCreator,
  type OpinionPollWithCreator,
  type PhoneBankingListWithStats,
  type CanvassingTurfWithStats,
  type UserWithEngagement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, inArray, ilike } from "drizzle-orm";

// Helper to remove password from user objects
function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  getPosts(options?: { limit?: number; cursor?: string; authorId?: string; type?: string }): Promise<{ posts: PostWithAuthor[]; nextCursor?: string }>;
  getPost(id: string): Promise<PostWithAuthor | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: string): Promise<void>;
  
  getComments(postId: string): Promise<CommentWithAuthor[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  getLike(userId: string, postId: string): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: string, postId: string): Promise<void>;
  
  getFollow(followerId: string, followingId: string): Promise<Follow | undefined>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  
  getGroups(): Promise<GroupWithCreator[]>;
  getGroup(id: string): Promise<GroupWithCreator | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  
  getGroupMembership(groupId: string, userId: string): Promise<GroupMembership | undefined>;
  getGroupMembers(groupId: string): Promise<(User & { role: string; joinedAt: string })[]>;
  createGroupMembership(membership: InsertGroupMembership): Promise<GroupMembership>;
  updateGroupMembership(groupId: string, userId: string, update: { role: string }): Promise<GroupMembership | undefined>;
  deleteGroupMembership(groupId: string, userId: string): Promise<void>;
  updateGroup(groupId: string, update: { name?: string; description?: string; isPrivate?: boolean }): Promise<GroupWithCreator | undefined>;
  
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  search(query: string, type: string, limit: number): Promise<{ users: User[]; posts: PostWithAuthor[]; groups: GroupWithCreator[] }>;
  getTrendingPosts(limit: number): Promise<PostWithAuthor[]>;
  getTopCreators(limit: number): Promise<User[]>;
  
  createRewardEvent(event: InsertRewardEvent): Promise<RewardEvent>;
  getRewardEvents(userId: string): Promise<RewardEvent[]>;
  getRewardSnapshot(userId: string): Promise<RewardSnapshot | undefined>;
  updateRewardSnapshot(userId: string, updates: Partial<RewardSnapshot>): Promise<RewardSnapshot>;
  
  getConversations(userId: string): Promise<ConversationWithMessages[]>;
  getConversation(id: string, userId: string): Promise<ConversationWithMessages | undefined>;
  getOrCreateConversation(participantIds: string[]): Promise<Conversation>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(conversationId: string, limit?: number): Promise<MessageWithSender[]>;
  markMessagesRead(conversationId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  getCreatorAnalytics(userId: string): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalViews: number;
    totalFollowers: number;
    totalRewardPoints: number;
    estimatedAxm: string;
    topPosts: PostWithAuthor[];
    recentActivity: { date: string; likes: number; comments: number; views: number }[];
  }>;

  // Quests
  getQuests(type?: string): Promise<Quest[]>;
  getUserQuests(userId: string): Promise<QuestWithProgress[]>;
  assignQuestsToUser(userId: string): Promise<void>;
  updateQuestProgress(userId: string, requirement: string, increment?: number): Promise<void>;
  completeQuest(userId: string, questId: string): Promise<void>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<AchievementWithProgress[]>;
  checkAndUnlockAchievements(userId: string): Promise<Achievement[]>;

  // Stories
  getStories(userId?: string): Promise<StoryWithAuthor[]>;
  getStoryFeed(userId: string): Promise<{ userId: string; user: User; stories: Story[] }[]>;
  createStory(story: InsertStory): Promise<Story>;
  viewStory(storyId: string, viewerId: string): Promise<void>;
  deleteStory(storyId: string, authorId: string): Promise<void>;

  // Live Streams
  getLiveStreams(): Promise<LiveStreamWithHost[]>;
  getLiveStream(id: string): Promise<LiveStreamWithHost | undefined>;
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  updateLiveStream(id: string, updates: Partial<LiveStream>): Promise<LiveStream | undefined>;
  endLiveStream(id: string): Promise<void>;
  getStreamMessages(streamId: string, limit?: number): Promise<StreamMessageWithSender[]>;
  createStreamMessage(message: InsertStreamMessage): Promise<StreamMessage>;
  createStreamTip(tip: InsertStreamTip): Promise<StreamTip>;
  getStreamTips(streamId: string): Promise<StreamTipWithSender[]>;

  // Daily login and streaks
  recordDailyLogin(userId: string): Promise<{ isNewDay: boolean; streak: number; pointsEarned: number }>;

  // Phase 3: NFTs
  getNfts(options?: { ownerId?: string; creatorId?: string; status?: string }): Promise<NftWithDetails[]>;
  getNft(id: string): Promise<NftWithDetails | undefined>;
  createNft(nft: InsertNft): Promise<Nft>;
  updateNft(id: string, updates: Partial<Nft>): Promise<Nft | undefined>;

  // Phase 3: NFT Marketplace
  getNftListings(options?: { isActive?: boolean; sellerId?: string }): Promise<NftListingWithDetails[]>;
  getNftListing(id: string): Promise<NftListingWithDetails | undefined>;
  createNftListing(listing: InsertNftListing): Promise<NftListing>;
  updateNftListing(id: string, updates: Partial<NftListing>): Promise<NftListing | undefined>;

  // Phase 3: DAO Governance
  getProposals(options?: { status?: string }): Promise<ProposalWithDetails[]>;
  getProposal(id: string, userId?: string): Promise<ProposalWithDetails | undefined>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal | undefined>;
  getProposalVotes(proposalId: string): Promise<ProposalVote[]>;
  createProposalVote(vote: InsertProposalVote): Promise<ProposalVote>;
  getUserVote(proposalId: string, voterId: string): Promise<ProposalVote | undefined>;

  // Phase 3: Token Staking
  getStakingPositions(userId: string): Promise<StakingPositionWithDetails[]>;
  getStakingPosition(id: string): Promise<StakingPosition | undefined>;
  createStakingPosition(position: InsertStakingPosition): Promise<StakingPosition>;
  updateStakingPosition(id: string, updates: Partial<StakingPosition>): Promise<StakingPosition | undefined>;
  getStakingRewards(positionId: string): Promise<StakingReward[]>;
  createStakingReward(reward: InsertStakingReward): Promise<StakingReward>;
  getTotalStaked(userId: string): Promise<string>;

  // Phase 3: Reputation Badges
  getUserBadges(userId: string): Promise<ReputationBadge[]>;
  createReputationBadge(badge: InsertReputationBadge): Promise<ReputationBadge>;
  checkAndAwardBadges(userId: string): Promise<ReputationBadge[]>;

  // NationBuilder-style: Petitions
  getPetitions(options?: { status?: string; creatorId?: string; limit?: number }): Promise<PetitionWithCreator[]>;
  getPetition(id: string, userId?: string): Promise<PetitionWithCreator | undefined>;
  createPetition(petition: InsertPetition): Promise<Petition>;
  updatePetition(id: string, updates: Partial<Petition>): Promise<Petition | undefined>;
  signPetition(signature: InsertPetitionSignature): Promise<PetitionSignature>;
  getPetitionSignatures(petitionId: string, limit?: number): Promise<PetitionSignature[]>;
  hasUserSignedPetition(petitionId: string, userId: string): Promise<boolean>;

  // NationBuilder-style: Campaigns (Fundraising)
  getCampaigns(options?: { status?: string; creatorId?: string; limit?: number }): Promise<CampaignWithCreator[]>;
  getCampaign(id: string, userId?: string): Promise<CampaignWithCreator | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  createDonation(donation: InsertCampaignDonation): Promise<CampaignDonation>;
  getCampaignDonations(campaignId: string, limit?: number): Promise<CampaignDonation[]>;

  // NationBuilder-style: Events
  getEvents(options?: { status?: string; creatorId?: string; groupId?: string; limit?: number }): Promise<EventWithCreator[]>;
  getEvent(id: string, userId?: string): Promise<EventWithCreator | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  updateEventRsvp(eventId: string, userId: string, updates: Partial<EventRsvp>): Promise<EventRsvp | undefined>;
  deleteEventRsvp(eventId: string, userId: string): Promise<void>;
  getEventRsvps(eventId: string): Promise<(EventRsvp & { user: User })[]>;
  getUserEventRsvp(eventId: string, userId: string): Promise<EventRsvp | undefined>;

  // NationBuilder-style: Email Campaigns
  getEmailCampaigns(creatorId?: string): Promise<EmailCampaign[]>;
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getPosts(options?: { limit?: number; cursor?: string; authorId?: string; type?: string }): Promise<{ posts: PostWithAuthor[]; nextCursor?: string }> {
    const limit = options?.limit || 20;
    
    const conditions: any[] = [];
    
    if (options?.authorId) {
      conditions.push(eq(posts.authorId, options.authorId));
    }
    
    if (options?.type === "video") {
      conditions.push(eq(posts.postType, "video"));
    }
    
    if (options?.cursor) {
      const cursorPost = await db.select().from(posts).where(eq(posts.id, options.cursor)).limit(1);
      if (cursorPost[0]) {
        conditions.push(sql`${posts.createdAt} < ${cursorPost[0].createdAt}`);
      }
    }
    
    let query = db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const results = await query;
    
    const postsWithAuthors: PostWithAuthor[] = results.slice(0, limit).map((row) => ({
      ...row.post,
      author: sanitizeUser(row.author) as any,
    }));
    
    const nextCursor = results.length > limit ? results[limit - 1].post.id : undefined;
    
    return { posts: postsWithAuthors, nextCursor };
  }

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const [result] = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.post,
      author: sanitizeUser(result.author) as any,
    };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const [post] = await db.update(posts).set(updates).where(eq(posts.id, id)).returning();
    return post || undefined;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getComments(postId: string): Promise<CommentWithAuthor[]> {
    const results = await db
      .select({
        comment: comments,
        author: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
    
    return results.map((row) => ({
      ...row.comment,
      author: sanitizeUser(row.author) as any,
    }));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    await db.update(posts).set({
      commentCount: sql`${posts.commentCount} + 1`,
    }).where(eq(posts.id, insertComment.postId));
    return comment;
  }

  async getLike(userId: string, postId: string): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return like || undefined;
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db.insert(likes).values(insertLike).returning();
    if (insertLike.postId) {
      await db.update(posts).set({
        likeCount: sql`${posts.likeCount} + 1`,
      }).where(eq(posts.id, insertLike.postId));
    }
    return like;
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    await db.update(posts).set({
      likeCount: sql`${posts.likeCount} - 1`,
    }).where(eq(posts.id, postId));
  }

  async getFollow(followerId: string, followingId: string): Promise<Follow | undefined> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return follow || undefined;
  }

  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const [follow] = await db.insert(follows).values(insertFollow).returning();
    return follow;
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );
  }

  async getFollowerCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));
    return result[0]?.count || 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return result[0]?.count || 0;
  }

  async getGroups(): Promise<GroupWithCreator[]> {
    const results = await db
      .select({
        group: groups,
        createdBy: users,
      })
      .from(groups)
      .innerJoin(users, eq(groups.createdById, users.id))
      .orderBy(desc(groups.memberCount));
    
    return results.map((row) => ({
      ...row.group,
      createdBy: sanitizeUser(row.createdBy) as any,
    }));
  }

  async getGroup(id: string): Promise<GroupWithCreator | undefined> {
    const [result] = await db
      .select({
        group: groups,
        createdBy: users,
      })
      .from(groups)
      .innerJoin(users, eq(groups.createdById, users.id))
      .where(eq(groups.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.group,
      createdBy: sanitizeUser(result.createdBy) as any,
    };
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  async getGroupMembership(groupId: string, userId: string): Promise<GroupMembership | undefined> {
    const [membership] = await db
      .select()
      .from(groupMemberships)
      .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, userId)));
    return membership || undefined;
  }

  async createGroupMembership(insertMembership: InsertGroupMembership): Promise<GroupMembership> {
    const [membership] = await db.insert(groupMemberships).values(insertMembership).returning();
    await db.update(groups).set({
      memberCount: sql`${groups.memberCount} + 1`,
    }).where(eq(groups.id, insertMembership.groupId));
    return membership;
  }

  async deleteGroupMembership(groupId: string, userId: string): Promise<void> {
    await db.delete(groupMemberships).where(
      and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, userId))
    );
    await db.update(groups).set({
      memberCount: sql`${groups.memberCount} - 1`,
    }).where(eq(groups.id, groupId));
  }

  async getGroupMembers(groupId: string): Promise<(User & { role: string; joinedAt: string })[]> {
    const results = await db
      .select({
        membership: groupMemberships,
        user: users,
      })
      .from(groupMemberships)
      .innerJoin(users, eq(users.id, groupMemberships.userId))
      .where(eq(groupMemberships.groupId, groupId))
      .orderBy(groupMemberships.createdAt);

    return results.map(({ membership, user }) => ({
      ...sanitizeUser(user) as any,
      role: membership.role || "member",
      joinedAt: membership.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  async updateGroupMembership(groupId: string, userId: string, update: { role: string }): Promise<GroupMembership | undefined> {
    const [membership] = await db
      .update(groupMemberships)
      .set({ role: update.role })
      .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, userId)))
      .returning();
    return membership;
  }

  async updateGroup(groupId: string, update: { name?: string; description?: string; isPrivate?: boolean }): Promise<GroupWithCreator | undefined> {
    await db
      .update(groups)
      .set({
        name: update.name,
        description: update.description,
        isPrivate: update.isPrivate,
      })
      .where(eq(groups.id, groupId));
    return this.getGroup(groupId);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async search(query: string, type: string, limit: number): Promise<{ users: User[]; posts: PostWithAuthor[]; groups: GroupWithCreator[] }> {
    const searchPattern = `%${query}%`;
    
    let searchUsers: User[] = [];
    let searchPosts: PostWithAuthor[] = [];
    let searchGroups: GroupWithCreator[] = [];

    if (type === "all" || type === "users") {
      searchUsers = await db
        .select()
        .from(users)
        .where(
          or(
            ilike(users.username, searchPattern),
            ilike(users.displayName, searchPattern),
            ilike(users.bio, searchPattern)
          )
        )
        .limit(limit);
    }

    if (type === "all" || type === "posts") {
      const postResults = await db
        .select({
          post: posts,
          author: users,
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(ilike(posts.content, searchPattern))
        .orderBy(desc(posts.createdAt))
        .limit(limit);

      searchPosts = postResults.map((row) => ({
        ...row.post,
        author: sanitizeUser(row.author) as any,
      }));
    }

    if (type === "all" || type === "groups") {
      const groupResults = await db
        .select({
          group: groups,
          createdBy: users,
        })
        .from(groups)
        .innerJoin(users, eq(groups.createdById, users.id))
        .where(
          or(
            ilike(groups.name, searchPattern),
            ilike(groups.description, searchPattern),
            ilike(groups.category, searchPattern)
          )
        )
        .limit(limit);

      searchGroups = groupResults.map((row) => ({
        ...row.group,
        createdBy: sanitizeUser(row.createdBy) as any,
      }));
    }

    // Sanitize users list as well
    const safeUsers = searchUsers.map(u => sanitizeUser(u) as any);
    return { users: safeUsers, posts: searchPosts, groups: searchGroups };
  }

  async getTrendingPosts(limit: number): Promise<PostWithAuthor[]> {
    const results = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(
        desc(sql`(${posts.likeCount} * 2 + ${posts.commentCount} * 3 + ${posts.viewCount})`)
      )
      .limit(limit);

    return results.map((row) => ({
      ...row.post,
      author: sanitizeUser(row.author) as any,
    }));
  }

  async getTopCreators(limit: number): Promise<User[]> {
    const results = await db
      .select({
        user: users,
        totalEngagement: sql<number>`COALESCE(SUM(${posts.likeCount} + ${posts.commentCount}), 0)`.as("total_engagement"),
      })
      .from(users)
      .leftJoin(posts, eq(users.id, posts.authorId))
      .groupBy(users.id)
      .orderBy(desc(sql`total_engagement`))
      .limit(limit);

    return results.map((row) => sanitizeUser(row.user) as any);
  }

  async createRewardEvent(insertEvent: InsertRewardEvent): Promise<RewardEvent> {
    const [event] = await db.insert(rewardEvents).values(insertEvent).returning();
    
    let snapshot = await this.getRewardSnapshot(insertEvent.userId);
    if (!snapshot) {
      snapshot = await db.insert(rewardSnapshots).values({
        userId: insertEvent.userId,
        totalPoints: insertEvent.points,
        estimatedAxm: (insertEvent.points * 0.01).toFixed(4),
      }).returning().then(r => r[0]);
    } else {
      const newTotal = (snapshot.totalPoints || 0) + insertEvent.points;
      await db.update(rewardSnapshots).set({
        totalPoints: newTotal,
        estimatedAxm: (newTotal * 0.01).toFixed(4),
        lastUpdated: new Date(),
      }).where(eq(rewardSnapshots.userId, insertEvent.userId));
    }
    
    return event;
  }

  async getRewardEvents(userId: string): Promise<RewardEvent[]> {
    return db
      .select()
      .from(rewardEvents)
      .where(eq(rewardEvents.userId, userId))
      .orderBy(desc(rewardEvents.createdAt))
      .limit(100);
  }

  async getRewardSnapshot(userId: string): Promise<RewardSnapshot | undefined> {
    const [snapshot] = await db
      .select()
      .from(rewardSnapshots)
      .where(eq(rewardSnapshots.userId, userId));
    return snapshot || undefined;
  }

  async updateRewardSnapshot(userId: string, updates: Partial<RewardSnapshot>): Promise<RewardSnapshot> {
    let [snapshot] = await db
      .update(rewardSnapshots)
      .set(updates)
      .where(eq(rewardSnapshots.userId, userId))
      .returning();
    
    if (!snapshot) {
      [snapshot] = await db.insert(rewardSnapshots).values({
        userId,
        ...updates,
      }).returning();
    }
    
    return snapshot;
  }

  async getConversations(userId: string): Promise<ConversationWithMessages[]> {
    const convos = await db
      .select()
      .from(conversations)
      .where(sql`${conversations.participantIds} @> ARRAY[${userId}]::text[]`)
      .orderBy(desc(conversations.lastMessageAt));

    const result: ConversationWithMessages[] = [];
    
    for (const convo of convos) {
      const msgs = await this.getMessages(convo.id, 1);
      const participants: User[] = [];
      let otherParticipant: User | undefined;
      
      for (const pid of convo.participantIds) {
        const participant = await this.getUser(pid);
        if (participant) {
          participants.push(participant);
          if (pid !== userId) {
            otherParticipant = participant;
          }
        }
      }
      
      result.push({
        ...convo,
        messages: msgs,
        participants,
        otherParticipant,
        lastMessage: msgs[msgs.length - 1],
      });
    }
    
    return result;
  }

  async getConversation(id: string, userId: string): Promise<ConversationWithMessages | undefined> {
    const [convo] = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.id, id),
        sql`${conversations.participantIds} @> ARRAY[${userId}]::text[]`
      ));

    if (!convo) return undefined;

    const msgs = await this.getMessages(id, 50);
    const participants: User[] = [];
    let otherParticipant: User | undefined;
    
    for (const pid of convo.participantIds) {
      const participant = await this.getUser(pid);
      if (participant) {
        participants.push(participant);
        if (pid !== userId) {
          otherParticipant = participant;
        }
      }
    }

    return {
      ...convo,
      messages: msgs,
      participants,
      otherParticipant,
      lastMessage: msgs[msgs.length - 1],
    };
  }

  async getOrCreateConversation(participantIds: string[]): Promise<Conversation> {
    const sortedIds = [...participantIds].sort();
    
    const existing = await db
      .select()
      .from(conversations)
      .where(sql`${conversations.participantIds} = ARRAY[${sql.join(sortedIds.map(id => sql`${id}`), sql`, `)}]::text[]`);

    if (existing.length > 0) {
      return existing[0];
    }

    const [convo] = await db
      .insert(conversations)
      .values({ participantIds: sortedIds })
      .returning();

    return convo;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(message).returning();
    
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    
    return msg;
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<MessageWithSender[]> {
    const msgs = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return msgs.map(row => ({
      ...row.message,
      sender: sanitizeUser(row.sender) as any,
    })).reverse();
  }

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        sql`${messages.senderId} != ${userId}`,
        eq(messages.read, false)
      ));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const convos = await db
      .select()
      .from(conversations)
      .where(sql`${conversations.participantIds} @> ARRAY[${userId}]::text[]`);

    if (convos.length === 0) return 0;

    const convoIds = convos.map(c => c.id);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, convoIds),
        sql`${messages.senderId} != ${userId}`,
        eq(messages.read, false)
      ));

    return Number(result[0]?.count) || 0;
  }

  async getCreatorAnalytics(userId: string): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalViews: number;
    totalFollowers: number;
    totalRewardPoints: number;
    estimatedAxm: string;
    topPosts: PostWithAuthor[];
    recentActivity: { date: string; likes: number; comments: number; views: number }[];
  }> {
    const [postStats] = await db
      .select({
        totalPosts: sql<number>`count(*)`,
        totalLikes: sql<number>`COALESCE(sum(${posts.likeCount}), 0)`,
        totalComments: sql<number>`COALESCE(sum(${posts.commentCount}), 0)`,
        totalViews: sql<number>`COALESCE(sum(${posts.viewCount}), 0)`,
      })
      .from(posts)
      .where(eq(posts.authorId, userId));

    const totalFollowers = await this.getFollowerCount(userId);
    const rewardSnapshot = await this.getRewardSnapshot(userId);

    const topPostsResult = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(sql`${posts.likeCount} + ${posts.commentCount}`))
      .limit(5);

    const topPosts: PostWithAuthor[] = topPostsResult.map(row => ({
      ...row.post,
      author: sanitizeUser(row.author) as any,
    }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await db
      .select({
        date: sql<string>`DATE(${posts.createdAt})::text`,
        likes: sql<number>`COALESCE(sum(${posts.likeCount}), 0)`,
        comments: sql<number>`COALESCE(sum(${posts.commentCount}), 0)`,
        views: sql<number>`COALESCE(sum(${posts.viewCount}), 0)`,
      })
      .from(posts)
      .where(and(
        eq(posts.authorId, userId),
        sql`${posts.createdAt} >= ${thirtyDaysAgo}`
      ))
      .groupBy(sql`DATE(${posts.createdAt})`)
      .orderBy(sql`DATE(${posts.createdAt})`);

    return {
      totalPosts: Number(postStats.totalPosts) || 0,
      totalLikes: Number(postStats.totalLikes) || 0,
      totalComments: Number(postStats.totalComments) || 0,
      totalViews: Number(postStats.totalViews) || 0,
      totalFollowers,
      totalRewardPoints: rewardSnapshot?.totalPoints || 0,
      estimatedAxm: rewardSnapshot?.estimatedAxm || "0.00",
      topPosts,
      recentActivity: dailyActivity.map(d => ({
        date: d.date,
        likes: Number(d.likes),
        comments: Number(d.comments),
        views: Number(d.views),
      })),
    };
  }

  // ============= QUESTS =============

  async getQuests(type?: string): Promise<Quest[]> {
    if (type) {
      return db.select().from(quests).where(and(eq(quests.questType, type as any), eq(quests.isActive, true)));
    }
    return db.select().from(quests).where(eq(quests.isActive, true));
  }

  async getUserQuests(userId: string): Promise<any[]> {
    const allQuests = await this.getQuests();
    const userProgress = await db
      .select()
      .from(userQuestProgress)
      .where(eq(userQuestProgress.userId, userId));

    const progressMap = new Map(userProgress.map(p => [p.questId, p]));

    return allQuests.map(quest => {
      const prog = progressMap.get(quest.id);
      return {
        ...quest,
        progress: prog?.currentValue ?? 0,
        completed: prog?.status === 'completed',
        completedAt: prog?.completedAt ?? null,
        resetAt: prog?.assignedAt ?? null,
      };
    });
  }

  async assignQuestsToUser(userId: string): Promise<void> {
    const dailyQuests = await this.getQuests("daily");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const quest of dailyQuests) {
      const existing = await db
        .select()
        .from(userQuestProgress)
        .where(and(
          eq(userQuestProgress.userId, userId),
          eq(userQuestProgress.questId, quest.id),
          sql`DATE(${userQuestProgress.assignedAt}) = DATE(${today})`
        ));

      if (existing.length === 0) {
        await db.insert(userQuestProgress).values({
          userId,
          questId: quest.id,
          status: "active",
        });
      }
    }
  }

  async updateQuestProgress(userId: string, requirement: string, increment: number = 1): Promise<void> {
    const relevantQuests = await db
      .select()
      .from(quests)
      .where(and(eq(quests.requirement, requirement), eq(quests.isActive, true)));

    for (const quest of relevantQuests) {
      const [progress] = await db
        .select()
        .from(userQuestProgress)
        .where(and(
          eq(userQuestProgress.userId, userId),
          eq(userQuestProgress.questId, quest.id),
          eq(userQuestProgress.status, "active")
        ));

      if (progress) {
        const newValue = (progress.currentValue || 0) + increment;
        if (newValue >= quest.targetValue) {
          await this.completeQuest(userId, quest.id);
        } else {
          await db
            .update(userQuestProgress)
            .set({ currentValue: newValue })
            .where(eq(userQuestProgress.id, progress.id));
        }
      }
    }
  }

  async completeQuest(userId: string, questId: string): Promise<void> {
    const [quest] = await db.select().from(quests).where(eq(quests.id, questId));
    if (!quest) return;

    await db
      .update(userQuestProgress)
      .set({
        status: "completed",
        currentValue: quest.targetValue,
        completedAt: new Date(),
      })
      .where(and(
        eq(userQuestProgress.userId, userId),
        eq(userQuestProgress.questId, questId)
      ));

    await this.createRewardEvent({
      userId,
      eventType: "quest_completed",
      points: quest.pointsReward,
      metadata: { questId, questTitle: quest.title },
    });

    if (quest.xpReward > 0) {
      const user = await this.getUser(userId);
      if (user) {
        const newXp = (user.xp || 0) + quest.xpReward;
        const newLevel = Math.floor(newXp / 1000) + 1;
        await this.updateUser(userId, { xp: newXp, level: newLevel });
      }
    }
  }

  // ============= ACHIEVEMENTS =============

  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements).orderBy(achievements.tier);
  }

  async getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
    const allAchievements = await this.getAchievements();
    const userProgress = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const progressMap = new Map(userProgress.map(p => [p.achievementId, p]));

    return allAchievements.map(achievement => ({
      ...achievement,
      userProgress: progressMap.get(achievement.id),
    }));
  }

  async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const allAchievements = await this.getAchievements();
    const unlockedAchievements: Achievement[] = [];

    const [postStats] = await db
      .select({
        totalPosts: sql<number>`count(*)`,
        maxLikes: sql<number>`COALESCE(max(${posts.likeCount}), 0)`,
      })
      .from(posts)
      .where(eq(posts.authorId, userId));

    const followerCount = await this.getFollowerCount(userId);
    const [likeStats] = await db
      .select({ totalLikes: sql<number>`COALESCE(sum(${posts.likeCount}), 0)` })
      .from(posts)
      .where(eq(posts.authorId, userId));

    const stats: Record<string, number> = {
      total_posts: Number(postStats?.totalPosts) || 0,
      total_followers: followerCount,
      total_likes_received: Number(likeStats?.totalLikes) || 0,
      single_post_likes: Number(postStats?.maxLikes) || 0,
      login_streak: user.currentStreak || 0,
      wallet_connected: user.walletVerified ? 1 : 0,
    };

    for (const achievement of allAchievements) {
      const existing = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id)
        ));

      const currentValue = stats[achievement.requirement] || 0;

      if (existing.length === 0) {
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
          currentValue,
          unlockedAt: currentValue >= achievement.targetValue ? new Date() : null,
        });

        if (currentValue >= achievement.targetValue) {
          unlockedAchievements.push(achievement);
          await this.createRewardEvent({
            userId,
            eventType: "achievement_unlocked",
            points: achievement.pointsReward,
            metadata: { achievementId: achievement.id, achievementTitle: achievement.title },
          });
        }
      } else if (!existing[0].unlockedAt && currentValue >= achievement.targetValue) {
        await db
          .update(userAchievements)
          .set({ currentValue, unlockedAt: new Date() })
          .where(eq(userAchievements.id, existing[0].id));

        unlockedAchievements.push(achievement);
        await this.createRewardEvent({
          userId,
          eventType: "achievement_unlocked",
          points: achievement.pointsReward,
          metadata: { achievementId: achievement.id, achievementTitle: achievement.title },
        });
      } else {
        await db
          .update(userAchievements)
          .set({ currentValue })
          .where(eq(userAchievements.id, existing[0].id));
      }
    }

    return unlockedAchievements;
  }

  // ============= STORIES =============

  async getStories(userId?: string): Promise<StoryWithAuthor[]> {
    const now = new Date();
    const conditions = [sql`${stories.expiresAt} > ${now}`];
    
    if (userId) {
      conditions.push(eq(stories.authorId, userId));
    }

    const results = await db
      .select({
        story: stories,
        author: users,
      })
      .from(stories)
      .innerJoin(users, eq(stories.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(stories.createdAt));

    return results.map(row => ({
      ...row.story,
      author: sanitizeUser(row.author) as any,
    }));
  }

  async getStoryFeed(userId: string): Promise<{ userId: string; user: User; stories: Story[] }[]> {
    const now = new Date();
    
    const activeStories = await db
      .select({
        story: stories,
        author: users,
      })
      .from(stories)
      .innerJoin(users, eq(stories.authorId, users.id))
      .where(sql`${stories.expiresAt} > ${now}`)
      .orderBy(desc(stories.createdAt));

    const userStoriesMap = new Map<string, { user: User; stories: Story[] }>();
    
    for (const row of activeStories) {
      const authorId = row.author.id;
      if (!userStoriesMap.has(authorId)) {
        userStoriesMap.set(authorId, {
          user: sanitizeUser(row.author) as any,
          stories: [],
        });
      }
      userStoriesMap.get(authorId)!.stories.push(row.story);
    }

    return Array.from(userStoriesMap.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const [story] = await db.insert(stories).values(insertStory).returning();
    return story;
  }

  async viewStory(storyId: string, viewerId: string): Promise<void> {
    const existing = await db
      .select()
      .from(storyViews)
      .where(and(eq(storyViews.storyId, storyId), eq(storyViews.viewerId, viewerId)));

    if (existing.length === 0) {
      await db.insert(storyViews).values({ storyId, viewerId });
      await db.update(stories).set({
        viewCount: sql`${stories.viewCount} + 1`,
      }).where(eq(stories.id, storyId));
    }
  }

  async deleteStory(storyId: string, authorId: string): Promise<void> {
    await db.delete(stories).where(and(eq(stories.id, storyId), eq(stories.authorId, authorId)));
  }

  // ============= LIVE STREAMS =============

  async getLiveStreams(): Promise<LiveStreamWithHost[]> {
    const results = await db
      .select({
        stream: liveStreams,
        host: users,
      })
      .from(liveStreams)
      .innerJoin(users, eq(liveStreams.hostId, users.id))
      .where(eq(liveStreams.status, "live"))
      .orderBy(desc(liveStreams.viewerCount));

    return results.map(row => ({
      ...row.stream,
      host: sanitizeUser(row.host) as any,
    }));
  }

  async getLiveStream(id: string): Promise<LiveStreamWithHost | undefined> {
    const [result] = await db
      .select({
        stream: liveStreams,
        host: users,
      })
      .from(liveStreams)
      .innerJoin(users, eq(liveStreams.hostId, users.id))
      .where(eq(liveStreams.id, id));

    if (!result) return undefined;

    return {
      ...result.stream,
      host: sanitizeUser(result.host) as any,
    };
  }

  async createLiveStream(insertStream: InsertLiveStream): Promise<LiveStream> {
    const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [stream] = await db.insert(liveStreams).values({
      ...insertStream,
      streamKey,
      startedAt: new Date(),
    }).returning();
    return stream;
  }

  async updateLiveStream(id: string, updates: Partial<LiveStream>): Promise<LiveStream | undefined> {
    const [stream] = await db
      .update(liveStreams)
      .set(updates)
      .where(eq(liveStreams.id, id))
      .returning();
    return stream || undefined;
  }

  async endLiveStream(id: string): Promise<void> {
    await db.update(liveStreams).set({
      status: "ended",
      endedAt: new Date(),
    }).where(eq(liveStreams.id, id));
  }

  async getStreamMessages(streamId: string, limit: number = 100): Promise<StreamMessageWithSender[]> {
    const results = await db
      .select({
        message: streamMessages,
        sender: users,
      })
      .from(streamMessages)
      .innerJoin(users, eq(streamMessages.senderId, users.id))
      .where(eq(streamMessages.streamId, streamId))
      .orderBy(desc(streamMessages.createdAt))
      .limit(limit);

    return results.map(row => ({
      ...row.message,
      sender: sanitizeUser(row.sender) as any,
    })).reverse();
  }

  async createStreamMessage(insertMessage: InsertStreamMessage): Promise<StreamMessage> {
    const [message] = await db.insert(streamMessages).values(insertMessage).returning();
    return message;
  }

  async createStreamTip(insertTip: InsertStreamTip): Promise<StreamTip> {
    const [tip] = await db.insert(streamTips).values(insertTip).returning();
    
    const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.id, insertTip.streamId));
    if (stream) {
      const newTotal = (parseFloat(stream.totalTips || "0") + parseFloat(insertTip.amount)).toString();
      await db.update(liveStreams).set({
        totalTips: newTotal,
        tipCount: sql`${liveStreams.tipCount} + 1`,
      }).where(eq(liveStreams.id, insertTip.streamId));
    }

    await this.createRewardEvent({
      userId: stream?.hostId || "",
      eventType: "live_stream_tip",
      points: Math.floor(parseFloat(insertTip.amount) * 10),
      metadata: { streamId: insertTip.streamId, amount: insertTip.amount },
    });

    return tip;
  }

  async getStreamTips(streamId: string): Promise<StreamTipWithSender[]> {
    const results = await db
      .select({
        tip: streamTips,
        sender: users,
      })
      .from(streamTips)
      .innerJoin(users, eq(streamTips.senderId, users.id))
      .where(eq(streamTips.streamId, streamId))
      .orderBy(desc(streamTips.createdAt));

    return results.map(row => ({
      ...row.tip,
      sender: sanitizeUser(row.sender) as any,
    }));
  }

  // ============= DAILY LOGIN & STREAKS =============

  async recordDailyLogin(userId: string): Promise<{ isNewDay: boolean; streak: number; pointsEarned: number }> {
    const user = await this.getUser(userId);
    if (!user) return { isNewDay: false, streak: 0, pointsEarned: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0);
    }

    if (lastLogin && lastLogin.getTime() === today.getTime()) {
      return { isNewDay: false, streak: user.currentStreak || 0, pointsEarned: 0 };
    }

    let newStreak = 1;
    let streakBonus = 0;

    if (lastLogin) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastLogin.getTime() === yesterday.getTime()) {
        newStreak = (user.currentStreak || 0) + 1;
        
        if (newStreak === 7) streakBonus = 100;
        else if (newStreak === 30) streakBonus = 500;
        else if (newStreak % 7 === 0) streakBonus = 50;
      }
    }

    const longestStreak = Math.max(user.longestStreak || 0, newStreak);

    await this.updateUser(userId, {
      currentStreak: newStreak,
      longestStreak,
      lastLoginDate: new Date(),
    });

    const basePoints = 10;
    const totalPoints = basePoints + streakBonus;

    await this.createRewardEvent({
      userId,
      eventType: "daily_login",
      points: basePoints,
      metadata: { streak: newStreak },
    });

    if (streakBonus > 0) {
      await this.createRewardEvent({
        userId,
        eventType: "streak_bonus",
        points: streakBonus,
        metadata: { streak: newStreak },
      });
    }

    await this.assignQuestsToUser(userId);

    return { isNewDay: true, streak: newStreak, pointsEarned: totalPoints };
  }

  // ============= PHASE 3: NFTs =============

  async getNfts(options?: { ownerId?: string; creatorId?: string; status?: string }): Promise<NftWithDetails[]> {
    const conditions: any[] = [];
    
    if (options?.ownerId) {
      conditions.push(eq(nfts.ownerId, options.ownerId));
    }
    if (options?.creatorId) {
      conditions.push(eq(nfts.creatorId, options.creatorId));
    }
    if (options?.status) {
      conditions.push(eq(nfts.status, options.status as any));
    }

    let query = db
      .select()
      .from(nfts)
      .orderBy(desc(nfts.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    
    const nftsWithDetails: NftWithDetails[] = [];
    for (const nft of results) {
      const owner = await this.getUser(nft.ownerId);
      const creator = await this.getUser(nft.creatorId);
      const post = nft.postId ? await this.getPost(nft.postId) : null;
      
      if (owner && creator) {
        nftsWithDetails.push({
          ...nft,
          owner: sanitizeUser(owner) as any,
          creator: sanitizeUser(creator) as any,
          post,
        });
      }
    }

    return nftsWithDetails;
  }

  async getNft(id: string): Promise<NftWithDetails | undefined> {
    const [nft] = await db.select().from(nfts).where(eq(nfts.id, id));
    if (!nft) return undefined;

    const owner = await this.getUser(nft.ownerId);
    const creator = await this.getUser(nft.creatorId);
    const post = nft.postId ? await this.getPost(nft.postId) : null;

    if (!owner || !creator) return undefined;

    return {
      ...nft,
      owner: sanitizeUser(owner) as any,
      creator: sanitizeUser(creator) as any,
      post,
    };
  }

  async createNft(insertNft: InsertNft): Promise<Nft> {
    const tokenId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [nft] = await db.insert(nfts).values({
      ...insertNft,
      tokenId,
    }).returning();
    return nft;
  }

  async updateNft(id: string, updates: Partial<Nft>): Promise<Nft | undefined> {
    const [nft] = await db.update(nfts).set(updates).where(eq(nfts.id, id)).returning();
    return nft || undefined;
  }

  // ============= PHASE 3: NFT MARKETPLACE =============

  async getNftListings(options?: { isActive?: boolean; sellerId?: string }): Promise<NftListingWithDetails[]> {
    const conditions: any[] = [];
    
    if (options?.isActive !== undefined) {
      conditions.push(eq(nftListings.isActive, options.isActive));
    }
    if (options?.sellerId) {
      conditions.push(eq(nftListings.sellerId, options.sellerId));
    }

    let query = db
      .select()
      .from(nftListings)
      .orderBy(desc(nftListings.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    
    const listingsWithDetails: NftListingWithDetails[] = [];
    for (const listing of results) {
      const nft = await this.getNft(listing.nftId);
      const seller = await this.getUser(listing.sellerId);
      const buyer = listing.buyerId ? await this.getUser(listing.buyerId) : null;
      const highestBidder = listing.highestBidderId ? await this.getUser(listing.highestBidderId) : null;
      
      if (nft && seller) {
        listingsWithDetails.push({
          ...listing,
          nft,
          seller: sanitizeUser(seller) as any,
          buyer: buyer ? sanitizeUser(buyer) as any : null,
          highestBidder: highestBidder ? sanitizeUser(highestBidder) as any : null,
        });
      }
    }

    return listingsWithDetails;
  }

  async getNftListing(id: string): Promise<NftListingWithDetails | undefined> {
    const [listing] = await db.select().from(nftListings).where(eq(nftListings.id, id));
    if (!listing) return undefined;

    const nft = await this.getNft(listing.nftId);
    const seller = await this.getUser(listing.sellerId);
    const buyer = listing.buyerId ? await this.getUser(listing.buyerId) : null;
    const highestBidder = listing.highestBidderId ? await this.getUser(listing.highestBidderId) : null;

    if (!nft || !seller) return undefined;

    return {
      ...listing,
      nft,
      seller: sanitizeUser(seller) as any,
      buyer: buyer ? sanitizeUser(buyer) as any : null,
      highestBidder: highestBidder ? sanitizeUser(highestBidder) as any : null,
    };
  }

  async createNftListing(insertListing: InsertNftListing): Promise<NftListing> {
    const [listing] = await db.insert(nftListings).values(insertListing).returning();
    await this.updateNft(insertListing.nftId, { status: "listed" });
    return listing;
  }

  async updateNftListing(id: string, updates: Partial<NftListing>): Promise<NftListing | undefined> {
    const [listing] = await db.update(nftListings).set(updates).where(eq(nftListings.id, id)).returning();
    return listing || undefined;
  }

  // ============= PHASE 3: DAO GOVERNANCE =============

  async getProposals(options?: { status?: string }): Promise<ProposalWithDetails[]> {
    const conditions: any[] = [];
    
    if (options?.status) {
      conditions.push(eq(proposals.status, options.status as any));
    }

    let query = db
      .select()
      .from(proposals)
      .orderBy(desc(proposals.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    
    const proposalsWithDetails: ProposalWithDetails[] = [];
    for (const proposal of results) {
      const proposer = await this.getUser(proposal.proposerId);
      
      if (proposer) {
        proposalsWithDetails.push({
          ...proposal,
          proposer: sanitizeUser(proposer) as any,
        });
      }
    }

    return proposalsWithDetails;
  }

  async getProposal(id: string, userId?: string): Promise<ProposalWithDetails | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    if (!proposal) return undefined;

    const proposer = await this.getUser(proposal.proposerId);
    if (!proposer) return undefined;

    const votes = await this.getProposalVotes(id);
    let userVote: ProposalVote | undefined;
    
    if (userId) {
      userVote = await this.getUserVote(id, userId);
    }

    return {
      ...proposal,
      proposer: sanitizeUser(proposer) as any,
      votes,
      userVote: userVote || null,
    };
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db.insert(proposals).values(insertProposal).returning();
    return proposal;
  }

  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal | undefined> {
    const [proposal] = await db.update(proposals).set(updates).where(eq(proposals.id, id)).returning();
    return proposal || undefined;
  }

  async getProposalVotes(proposalId: string): Promise<ProposalVote[]> {
    return db
      .select()
      .from(proposalVotes)
      .where(eq(proposalVotes.proposalId, proposalId))
      .orderBy(desc(proposalVotes.createdAt));
  }

  async createProposalVote(insertVote: InsertProposalVote): Promise<ProposalVote> {
    const [vote] = await db.insert(proposalVotes).values(insertVote).returning();
    
    const votingPower = parseFloat(insertVote.votingPower);
    const updateField = insertVote.voteType === "for" ? "votesFor" 
      : insertVote.voteType === "against" ? "votesAgainst" 
      : "votesAbstain";
    
    await db.update(proposals).set({
      [updateField]: sql`${proposals[updateField as keyof typeof proposals]} + 1`,
      totalVotingPower: sql`CAST(CAST(${proposals.totalVotingPower} AS DECIMAL) + ${votingPower} AS TEXT)`,
    }).where(eq(proposals.id, insertVote.proposalId));

    return vote;
  }

  async getUserVote(proposalId: string, voterId: string): Promise<ProposalVote | undefined> {
    const [vote] = await db
      .select()
      .from(proposalVotes)
      .where(and(eq(proposalVotes.proposalId, proposalId), eq(proposalVotes.voterId, voterId)));
    return vote || undefined;
  }

  // ============= PHASE 3: TOKEN STAKING =============

  async getStakingPositions(userId: string): Promise<StakingPositionWithDetails[]> {
    const positions = await db
      .select()
      .from(stakingPositions)
      .where(eq(stakingPositions.userId, userId))
      .orderBy(desc(stakingPositions.createdAt));

    const positionsWithDetails: StakingPositionWithDetails[] = [];
    for (const position of positions) {
      const user = await this.getUser(position.userId);
      const rewards = await this.getStakingRewards(position.id);
      
      if (user) {
        positionsWithDetails.push({
          ...position,
          user: sanitizeUser(user) as any,
          rewards,
        });
      }
    }

    return positionsWithDetails;
  }

  async getStakingPosition(id: string): Promise<StakingPosition | undefined> {
    const [position] = await db.select().from(stakingPositions).where(eq(stakingPositions.id, id));
    return position || undefined;
  }

  async createStakingPosition(insertPosition: InsertStakingPosition): Promise<StakingPosition> {
    const lockDuration = insertPosition.lockDuration || 30;
    const multiplier = lockDuration >= 365 ? 200 
      : lockDuration >= 180 ? 150 
      : lockDuration >= 90 ? 125 
      : 100;
    
    const withdrawableAt = new Date();
    withdrawableAt.setDate(withdrawableAt.getDate() + lockDuration);

    const [position] = await db.insert(stakingPositions).values({
      ...insertPosition,
      rewardMultiplier: multiplier,
      withdrawableAt,
    }).returning();
    return position;
  }

  async updateStakingPosition(id: string, updates: Partial<StakingPosition>): Promise<StakingPosition | undefined> {
    const [position] = await db.update(stakingPositions).set(updates).where(eq(stakingPositions.id, id)).returning();
    return position || undefined;
  }

  async getStakingRewards(positionId: string): Promise<StakingReward[]> {
    return db
      .select()
      .from(stakingRewards)
      .where(eq(stakingRewards.positionId, positionId))
      .orderBy(desc(stakingRewards.claimedAt));
  }

  async createStakingReward(insertReward: InsertStakingReward): Promise<StakingReward> {
    const [reward] = await db.insert(stakingRewards).values(insertReward).returning();
    
    const position = await this.getStakingPosition(insertReward.positionId);
    if (position) {
      const newTotal = (parseFloat(position.totalRewardsEarned || "0") + parseFloat(insertReward.amountAxm)).toString();
      await this.updateStakingPosition(insertReward.positionId, {
        totalRewardsEarned: newTotal,
        lastRewardClaim: new Date(),
      });
    }

    return reward;
  }

  async getTotalStaked(userId: string): Promise<string> {
    const positions = await db
      .select()
      .from(stakingPositions)
      .where(and(eq(stakingPositions.userId, userId), eq(stakingPositions.status, "active")));

    const total = positions.reduce((sum, pos) => sum + parseFloat(pos.amountAxm), 0);
    return total.toString();
  }

  // ============= PHASE 3: REPUTATION BADGES =============

  async getUserBadges(userId: string): Promise<ReputationBadge[]> {
    return db
      .select()
      .from(reputationBadges)
      .where(eq(reputationBadges.userId, userId))
      .orderBy(desc(reputationBadges.earnedAt));
  }

  async createReputationBadge(insertBadge: InsertReputationBadge): Promise<ReputationBadge> {
    const [badge] = await db.insert(reputationBadges).values(insertBadge).returning();
    return badge;
  }

  async checkAndAwardBadges(userId: string): Promise<ReputationBadge[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const existingBadges = await this.getUserBadges(userId);
    const existingTypes = new Set(existingBadges.map(b => b.badgeType));
    const newBadges: ReputationBadge[] = [];

    // Early Adopter badge - first 1000 users
    if (!existingTypes.has("early_adopter")) {
      const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
      if ((userCount[0]?.count || 0) <= 1000) {
        const badge = await this.createReputationBadge({
          userId,
          badgeType: "early_adopter",
          name: "Early Adopter",
          description: "One of the first 1000 users on Lumina",
          imageUrl: "/badges/early-adopter.png",
        });
        newBadges.push(badge);
      }
    }

    // Verified Creator badge
    if (!existingTypes.has("verified_creator") && user.verificationStatus === "verified") {
      const badge = await this.createReputationBadge({
        userId,
        badgeType: "verified_creator",
        name: "Verified Creator",
        description: "Officially verified content creator",
        imageUrl: "/badges/verified-creator.png",
      });
      newBadges.push(badge);
    }

    // Top Contributor badge - over 100 posts
    if (!existingTypes.has("top_contributor")) {
      const postCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(eq(posts.authorId, userId));
      
      if ((postCount[0]?.count || 0) >= 100) {
        const badge = await this.createReputationBadge({
          userId,
          badgeType: "top_contributor",
          name: "Top Contributor",
          description: "Created over 100 posts",
          imageUrl: "/badges/top-contributor.png",
        });
        newBadges.push(badge);
      }
    }

    // Whale badge - over 10000 AXM staked
    if (!existingTypes.has("whale")) {
      const totalStaked = await this.getTotalStaked(userId);
      if (parseFloat(totalStaked) >= 10000) {
        const badge = await this.createReputationBadge({
          userId,
          badgeType: "whale",
          name: "AXM Whale",
          description: "Staked over 10,000 AXM tokens",
          imageUrl: "/badges/whale.png",
        });
        newBadges.push(badge);
      }
    }

    // Diamond Hands badge - staked for over 180 days
    if (!existingTypes.has("diamond_hands")) {
      const longStakes = await db
        .select()
        .from(stakingPositions)
        .where(and(
          eq(stakingPositions.userId, userId),
          eq(stakingPositions.status, "active"),
          sql`${stakingPositions.lockDuration} >= 180`
        ));
      
      if (longStakes.length > 0) {
        const badge = await this.createReputationBadge({
          userId,
          badgeType: "diamond_hands",
          name: "Diamond Hands",
          description: "Committed to long-term staking (180+ days)",
          imageUrl: "/badges/diamond-hands.png",
        });
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  // ============= PHASE 4: ADMIN DASHBOARD =============

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= ${today} THEN 1 END) as new_users_today
      FROM users
    `);

    const postStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN created_at >= ${today} THEN 1 END) as new_posts_today
      FROM posts
    `);

    const reportStats = await db.execute(sql`
      SELECT COUNT(*) as pending_reports
      FROM content_reports
      WHERE status = 'pending'
    `);

    const verificationStats = await db.execute(sql`
      SELECT COUNT(*) as pending_verifications
      FROM users
      WHERE verification_status = 'pending'
    `);

    const volumeStats = await db.execute(sql`
      SELECT COALESCE(SUM(CAST(amount_axm AS DECIMAL)), 0) as total_volume
      FROM staking_positions
    `);

    const streamStats = await db.execute(sql`
      SELECT COUNT(*) as active_streams
      FROM live_streams
      WHERE status = 'live'
    `);

    const userRow = userStats.rows[0] as any || {};
    const postRow = postStats.rows[0] as any || {};
    const reportRow = reportStats.rows[0] as any || {};
    const verificationRow = verificationStats.rows[0] as any || {};
    const volumeRow = volumeStats.rows[0] as any || {};
    const streamRow = streamStats.rows[0] as any || {};

    return {
      totalUsers: Number(userRow.total_users) || 0,
      newUsersToday: Number(userRow.new_users_today) || 0,
      totalPosts: Number(postRow.total_posts) || 0,
      newPostsToday: Number(postRow.new_posts_today) || 0,
      pendingReports: Number(reportRow.pending_reports) || 0,
      pendingVerifications: Number(verificationRow.pending_verifications) || 0,
      totalAXMVolume: String(volumeRow.total_volume) || "0",
      activeStreams: Number(streamRow.active_streams) || 0,
    };
  }

  async getAdminActivityLogs(limit = 50): Promise<AdminActivityLog[]> {
    return db
      .select()
      .from(adminActivityLogs)
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(limit);
  }

  async createAdminActivityLog(log: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const [created] = await db.insert(adminActivityLogs).values(log).returning();
    return created;
  }

  async getPendingVerifications(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.verificationStatus, "pending"))
      .orderBy(desc(users.createdAt));
  }

  async updateVerificationStatus(userId: string, status: "none" | "pending" | "verified" | "rejected", adminId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ verificationStatus: status })
      .where(eq(users.id, userId))
      .returning();

    if (updated) {
      await this.createAdminActivityLog({
        adminId,
        actionType: "user_verified",
        targetUserId: userId,
        details: { status },
      });
    }

    return updated;
  }

  async banUser(userId: string, adminId: string, reason: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, userId))
      .returning();

    if (updated) {
      await this.createAdminActivityLog({
        adminId,
        actionType: "user_banned",
        targetUserId: userId,
        details: { reason },
      });
    }

    return updated;
  }

  async unbanUser(userId: string, adminId: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ isActive: true })
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  // ============= PHASE 4: USER ONBOARDING =============

  async getUserOnboarding(userId: string): Promise<UserOnboarding | undefined> {
    const [onboarding] = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, userId));
    return onboarding;
  }

  async createUserOnboarding(data: InsertUserOnboarding): Promise<UserOnboarding> {
    const [created] = await db.insert(userOnboarding).values(data).returning();
    return created;
  }

  async updateUserOnboarding(userId: string, updates: Partial<UserOnboarding>): Promise<UserOnboarding | undefined> {
    const [updated] = await db
      .update(userOnboarding)
      .set(updates)
      .where(eq(userOnboarding.userId, userId))
      .returning();
    return updated;
  }

  // ============= PHASE 4: TWO-FACTOR AUTHENTICATION =============

  async getUserTwoFactor(userId: string): Promise<UserTwoFactor | undefined> {
    const [twoFactor] = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, userId));
    return twoFactor;
  }

  async createUserTwoFactor(data: InsertUserTwoFactor): Promise<UserTwoFactor> {
    const [created] = await db.insert(userTwoFactor).values(data).returning();
    return created;
  }

  async updateUserTwoFactor(userId: string, updates: Partial<UserTwoFactor>): Promise<UserTwoFactor | undefined> {
    const [updated] = await db
      .update(userTwoFactor)
      .set(updates)
      .where(eq(userTwoFactor.userId, userId))
      .returning();
    return updated;
  }

  async deleteUserTwoFactor(userId: string): Promise<void> {
    await db.delete(userTwoFactor).where(eq(userTwoFactor.userId, userId));
  }

  // ============= PHASE 4: EMAIL NOTIFICATIONS =============

  async getEmailPreferences(userId: string): Promise<EmailNotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(emailNotificationPreferences)
      .where(eq(emailNotificationPreferences.userId, userId));
    return prefs;
  }

  async createEmailPreferences(data: InsertEmailNotificationPreferences): Promise<EmailNotificationPreferences> {
    const [created] = await db.insert(emailNotificationPreferences).values(data).returning();
    return created;
  }

  async updateEmailPreferences(userId: string, updates: Partial<EmailNotificationPreferences>): Promise<EmailNotificationPreferences | undefined> {
    const [updated] = await db
      .update(emailNotificationPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailNotificationPreferences.userId, userId))
      .returning();
    return updated;
  }

  async queueEmail(data: InsertEmailQueue): Promise<EmailQueue> {
    const [created] = await db.insert(emailQueue).values(data).returning();
    return created;
  }

  async getUnsentEmails(limit = 100): Promise<EmailQueue[]> {
    return db
      .select()
      .from(emailQueue)
      .where(and(
        sql`${emailQueue.sentAt} IS NULL`,
        sql`${emailQueue.failedAt} IS NULL`
      ))
      .orderBy(emailQueue.createdAt)
      .limit(limit);
  }

  async markEmailSent(id: string): Promise<void> {
    await db
      .update(emailQueue)
      .set({ sentAt: new Date() })
      .where(eq(emailQueue.id, id));
  }

  async markEmailFailed(id: string, errorMessage: string): Promise<void> {
    await db
      .update(emailQueue)
      .set({ failedAt: new Date(), errorMessage })
      .where(eq(emailQueue.id, id));
  }

  // ============= PHASE 4: STORY REACTIONS =============

  async addStoryReaction(data: InsertStoryReaction): Promise<StoryReaction> {
    const [created] = await db.insert(storyReactions).values(data).returning();
    return created;
  }

  async getStoryReactions(storyId: string): Promise<{ reaction: string; count: number }[]> {
    const reactions = await db.execute(sql`
      SELECT reaction, COUNT(*) as count
      FROM story_reactions
      WHERE story_id = ${storyId}
      GROUP BY reaction
    `);
    return (reactions.rows as any[]).map(r => ({ reaction: r.reaction, count: Number(r.count) }));
  }

  // ============= PHASE 4: POLLS =============

  async createPoll(pollData: InsertPoll, options: string[]): Promise<PollWithOptions> {
    const [poll] = await db.insert(polls).values(pollData).returning();

    const pollOptionData = options.map((text, index) => ({
      pollId: poll.id,
      text,
      sortOrder: index,
    }));

    const createdOptions = await db.insert(pollOptions).values(pollOptionData).returning();

    return {
      ...poll,
      options: createdOptions,
      userVote: null,
    };
  }

  async getPoll(pollId: string, userId?: string): Promise<PollWithOptions | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
    if (!poll) return undefined;

    const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, pollId)).orderBy(pollOptions.sortOrder);

    let userVote = null;
    if (userId) {
      const [vote] = await db.select().from(pollVotes).where(and(
        eq(pollVotes.pollId, pollId),
        eq(pollVotes.userId, userId)
      ));
      userVote = vote || null;
    }

    return { ...poll, options, userVote };
  }

  async votePoll(pollId: string, optionId: string, userId: string): Promise<PollVote> {
    // Check if already voted
    const [existingVote] = await db.select().from(pollVotes).where(and(
      eq(pollVotes.pollId, pollId),
      eq(pollVotes.userId, userId)
    ));

    if (existingVote) {
      throw new Error("Already voted");
    }

    const [vote] = await db.insert(pollVotes).values({
      pollId,
      optionId,
      userId,
    }).returning();

    // Update vote counts
    await db.execute(sql`
      UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ${optionId}
    `);
    await db.execute(sql`
      UPDATE polls SET total_votes = total_votes + 1 WHERE id = ${pollId}
    `);

    return vote;
  }

  // ============= PHASE 4: SCHEDULED POSTS =============

  async createScheduledPost(data: InsertScheduledPost): Promise<ScheduledPost> {
    const [created] = await db.insert(scheduledPosts).values(data).returning();
    return created;
  }

  async getScheduledPosts(authorId: string): Promise<ScheduledPostWithDetails[]> {
    const scheduled = await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.authorId, authorId))
      .orderBy(scheduledPosts.scheduledFor);

    const result: ScheduledPostWithDetails[] = [];
    for (const post of scheduled) {
      const [author] = await db.select().from(users).where(eq(users.id, post.authorId));
      let group = null;
      if (post.groupId) {
        const [g] = await db.select().from(groups).where(eq(groups.id, post.groupId));
        if (g) group = { id: g.id, name: g.name };
      }
      result.push({ ...post, author, group, poll: null });
    }

    return result;
  }

  async getDueScheduledPosts(): Promise<ScheduledPost[]> {
    return db
      .select()
      .from(scheduledPosts)
      .where(and(
        eq(scheduledPosts.status, "pending"),
        sql`${scheduledPosts.scheduledFor} <= NOW()`
      ));
  }

  async updateScheduledPost(id: string, updates: Partial<ScheduledPost>): Promise<ScheduledPost | undefined> {
    const [updated] = await db
      .update(scheduledPosts)
      .set(updates)
      .where(eq(scheduledPosts.id, id))
      .returning();
    return updated;
  }

  async deleteScheduledPost(id: string): Promise<void> {
    await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
  }

  // ============= PHASE 4: REFERRAL PROGRAM =============

  async createReferralEvent(data: InsertReferralEvent): Promise<ReferralEvent> {
    const [created] = await db.insert(referralEvents).values(data).returning();
    return created;
  }

  async getReferralsByReferrer(referrerId: string): Promise<ReferralEvent[]> {
    return db
      .select()
      .from(referralEvents)
      .where(eq(referralEvents.referrerId, referrerId))
      .orderBy(desc(referralEvents.createdAt));
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code));
    return user;
  }

  async getReferralStats(userId: string): Promise<{ totalReferrals: number; totalEarnings: string; pendingEarnings: string }> {
    const referrals = await db
      .select()
      .from(referralEvents)
      .where(eq(referralEvents.referrerId, userId));

    const totalReferrals = referrals.length;
    const paidReferrals = referrals.filter(r => r.isPaid);
    const pendingReferrals = referrals.filter(r => !r.isPaid);

    const totalEarnings = paidReferrals.reduce((sum, r) => sum + parseFloat(r.bonusAxm || "0"), 0);
    const pendingEarnings = pendingReferrals.reduce((sum, r) => sum + parseFloat(r.bonusAxm || "0"), 0);

    return {
      totalReferrals,
      totalEarnings: totalEarnings.toString(),
      pendingEarnings: pendingEarnings.toString(),
    };
  }

  // ============= PHASE 4: PUSH SUBSCRIPTIONS =============

  async createPushSubscription(data: InsertPushSubscription): Promise<PushSubscription> {
    const [created] = await db.insert(pushSubscriptions).values(data).returning();
    return created;
  }

  async getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db
      .select()
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      ));
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  // ============= PHASE 4: FIAT ORDERS =============

  async createFiatOrder(data: InsertFiatOrder): Promise<FiatOrder> {
    const [created] = await db.insert(fiatOrders).values(data).returning();
    return created;
  }

  async getFiatOrder(id: string): Promise<FiatOrder | undefined> {
    const [order] = await db.select().from(fiatOrders).where(eq(fiatOrders.id, id));
    return order;
  }

  async getFiatOrderByExternalId(externalId: string): Promise<FiatOrder | undefined> {
    const [order] = await db.select().from(fiatOrders).where(eq(fiatOrders.externalOrderId, externalId));
    return order;
  }

  async getUserFiatOrders(userId: string): Promise<FiatOrder[]> {
    return db
      .select()
      .from(fiatOrders)
      .where(eq(fiatOrders.userId, userId))
      .orderBy(desc(fiatOrders.createdAt));
  }

  async updateFiatOrder(id: string, updates: Partial<FiatOrder>): Promise<FiatOrder | undefined> {
    const [updated] = await db
      .update(fiatOrders)
      .set(updates)
      .where(eq(fiatOrders.id, id))
      .returning();
    return updated;
  }

  // ============= ADMIN: USER MANAGEMENT (Extended) =============

  async deleteUserAccount(userId: string, adminId: string): Promise<boolean> {
    try {
      // Get user info before deletion for logging
      const [userToDelete] = await db.select().from(users).where(eq(users.id, userId));
      if (!userToDelete) return false;
      
      // Log the action first (without targetUserId to avoid FK constraint)
      await this.createAdminActivityLog({
        adminId,
        actionType: "user_deleted",
        details: { 
          reason: "Deleted by admin",
          deletedUserId: userId,
          deletedUsername: userToDelete.username,
          deletedEmail: userToDelete.email
        },
      });
      
      // Delete user - cascades should handle related data
      await db.delete(users).where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Delete user account error:", error);
      return false;
    }
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchUsers(query: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        or(
          sql`${users.username} ILIKE ${'%' + query + '%'}`,
          sql`${users.email} ILIKE ${'%' + query + '%'}`,
          sql`${users.displayName} ILIKE ${'%' + query + '%'}`
        )
      )
      .limit(50);
  }

  async getBannedUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.isActive, false))
      .orderBy(desc(users.createdAt));
  }

  // ============= ADMIN: CONTENT MODERATION (Extended) =============

  async adminDeletePost(postId: string, adminId: string): Promise<boolean> {
    try {
      await this.createAdminActivityLog({
        adminId,
        actionType: "content_removed",
        targetPostId: postId,
        details: { reason: "Deleted by admin" },
      });
      await db.delete(posts).where(eq(posts.id, postId));
      return true;
    } catch {
      return false;
    }
  }

  async deleteComment(commentId: string, adminId: string): Promise<boolean> {
    try {
      await this.createAdminActivityLog({
        adminId,
        actionType: "content_removed",
        details: { commentId, reason: "Deleted by admin" },
      });
      await db.delete(comments).where(eq(comments.id, commentId));
      return true;
    } catch {
      return false;
    }
  }

  // ============= ADMIN: PLATFORM SETTINGS =============

  async getPlatformSetting(key: string): Promise<string | null> {
    const [setting] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, key));
    return setting?.value ?? null;
  }

  async getAllPlatformSettings(): Promise<Record<string, string>> {
    const settings = await db.select().from(platformSettings);
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value ?? "";
      return acc;
    }, {} as Record<string, string>);
  }

  async setPlatformSetting(key: string, value: string, adminId: string): Promise<void> {
    const existing = await this.getPlatformSetting(key);
    if (existing !== null) {
      await db
        .update(platformSettings)
        .set({ value, updatedAt: new Date(), updatedBy: adminId })
        .where(eq(platformSettings.key, key));
    } else {
      await db.insert(platformSettings).values({
        key,
        value,
        updatedBy: adminId,
        category: key.split("_")[0] || "general",
      });
    }
    
    await this.createAdminActivityLog({
      adminId,
      actionType: "setting_updated",
      details: { key, value },
    });
  }

  async setPlatformSettings(settings: Record<string, string>, adminId: string): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.setPlatformSetting(key, value, adminId);
    }
  }

  // ============= ADMIN: STATS (Extended) =============

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    totalPosts: number;
    totalComments: number;
    pendingReports: number;
    pendingVerifications: number;
  }> {
    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [activeUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true));
    const [bannedUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, false));
    const [totalPostsResult] = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const [totalCommentsResult] = await db.select({ count: sql<number>`count(*)` }).from(comments);
    const [pendingReportsResult] = await db.select({ count: sql<number>`count(*)` }).from(contentReports).where(eq(contentReports.status, "pending"));
    const [pendingVerificationsResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.verificationStatus, "pending"));

    return {
      totalUsers: Number(totalUsersResult?.count || 0),
      activeUsers: Number(activeUsersResult?.count || 0),
      bannedUsers: Number(bannedUsersResult?.count || 0),
      totalPosts: Number(totalPostsResult?.count || 0),
      totalComments: Number(totalCommentsResult?.count || 0),
      pendingReports: Number(pendingReportsResult?.count || 0),
      pendingVerifications: Number(pendingVerificationsResult?.count || 0),
    };
  }

  // ============= NATIONBUILDER-STYLE: PETITIONS =============

  async getPetitions(options?: { status?: string; creatorId?: string; limit?: number }): Promise<PetitionWithCreator[]> {
    const limit = options?.limit || 20;
    const conditions: any[] = [];

    if (options?.status) {
      conditions.push(eq(petitions.status, options.status as any));
    }
    if (options?.creatorId) {
      conditions.push(eq(petitions.creatorId, options.creatorId));
    }

    let query = db
      .select({ petition: petitions, creator: users })
      .from(petitions)
      .innerJoin(users, eq(petitions.creatorId, users.id))
      .orderBy(desc(petitions.createdAt))
      .limit(limit);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.petition,
      creator: sanitizeUser(row.creator) as any,
    }));
  }

  async getPetition(id: string, userId?: string): Promise<PetitionWithCreator | undefined> {
    const [result] = await db
      .select({ petition: petitions, creator: users })
      .from(petitions)
      .innerJoin(users, eq(petitions.creatorId, users.id))
      .where(eq(petitions.id, id));

    if (!result) return undefined;

    const recentSignatures = await this.getPetitionSignatures(id, 5);
    const hasUserSigned = userId ? await this.hasUserSignedPetition(id, userId) : false;

    return {
      ...result.petition,
      creator: sanitizeUser(result.creator) as any,
      recentSignatures,
      hasUserSigned,
    };
  }

  async createPetition(petition: InsertPetition): Promise<Petition> {
    const [created] = await db.insert(petitions).values(petition as any).returning();
    return created;
  }

  async updatePetition(id: string, updates: Partial<Petition>): Promise<Petition | undefined> {
    const [updated] = await db.update(petitions).set(updates).where(eq(petitions.id, id)).returning();
    return updated || undefined;
  }

  async signPetition(signature: InsertPetitionSignature): Promise<PetitionSignature> {
    const [created] = await db.insert(petitionSignatures).values(signature).returning();
    await db.update(petitions).set({
      currentSignatures: sql`${petitions.currentSignatures} + 1`,
    }).where(eq(petitions.id, signature.petitionId));
    return created;
  }

  async getPetitionSignatures(petitionId: string, limit?: number): Promise<PetitionSignature[]> {
    let query = db
      .select()
      .from(petitionSignatures)
      .where(eq(petitionSignatures.petitionId, petitionId))
      .orderBy(desc(petitionSignatures.createdAt));

    if (limit) {
      query = query.limit(limit) as any;
    }

    return await query;
  }

  async hasUserSignedPetition(petitionId: string, userId: string): Promise<boolean> {
    const [signature] = await db
      .select()
      .from(petitionSignatures)
      .where(and(eq(petitionSignatures.petitionId, petitionId), eq(petitionSignatures.userId, userId)));
    return !!signature;
  }

  // ============= NATIONBUILDER-STYLE: CAMPAIGNS (FUNDRAISING) =============

  async getCampaigns(options?: { status?: string; creatorId?: string; limit?: number }): Promise<CampaignWithCreator[]> {
    const limit = options?.limit || 20;
    const conditions: any[] = [];

    if (options?.status) {
      conditions.push(eq(campaigns.status, options.status as any));
    }
    if (options?.creatorId) {
      conditions.push(eq(campaigns.creatorId, options.creatorId));
    }

    let query = db
      .select({ campaign: campaigns, creator: users })
      .from(campaigns)
      .innerJoin(users, eq(campaigns.creatorId, users.id))
      .orderBy(desc(campaigns.createdAt))
      .limit(limit);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.campaign,
      creator: sanitizeUser(row.creator) as any,
      percentComplete: row.campaign.goalAmount > 0 
        ? Math.round(((row.campaign.currentAmount || 0) / row.campaign.goalAmount) * 100) 
        : 0,
    }));
  }

  async getCampaign(id: string, userId?: string): Promise<CampaignWithCreator | undefined> {
    const [result] = await db
      .select({ campaign: campaigns, creator: users })
      .from(campaigns)
      .innerJoin(users, eq(campaigns.creatorId, users.id))
      .where(eq(campaigns.id, id));

    if (!result) return undefined;

    const recentDonations = await this.getCampaignDonations(id, 5);
    let hasUserDonated = false;
    if (userId) {
      const [donation] = await db
        .select()
        .from(campaignDonations)
        .where(and(eq(campaignDonations.campaignId, id), eq(campaignDonations.userId, userId)));
      hasUserDonated = !!donation;
    }

    return {
      ...result.campaign,
      creator: sanitizeUser(result.creator) as any,
      recentDonations,
      hasUserDonated,
      percentComplete: result.campaign.goalAmount > 0 
        ? Math.round(((result.campaign.currentAmount || 0) / result.campaign.goalAmount) * 100) 
        : 0,
    };
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [created] = await db.insert(campaigns).values(campaign as any).returning();
    return created;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const [updated] = await db.update(campaigns).set(updates).where(eq(campaigns.id, id)).returning();
    return updated || undefined;
  }

  async createDonation(donation: InsertCampaignDonation): Promise<CampaignDonation> {
    const [created] = await db.insert(campaignDonations).values(donation).returning();
    await db.update(campaigns).set({
      currentAmount: sql`${campaigns.currentAmount} + ${donation.amount}`,
    }).where(eq(campaigns.id, donation.campaignId));
    return created;
  }

  async getCampaignDonations(campaignId: string, limit?: number): Promise<CampaignDonation[]> {
    let query = db
      .select()
      .from(campaignDonations)
      .where(eq(campaignDonations.campaignId, campaignId))
      .orderBy(desc(campaignDonations.createdAt));

    if (limit) {
      query = query.limit(limit) as any;
    }

    return await query;
  }

  // ============= NATIONBUILDER-STYLE: EVENTS =============

  async getEvents(options?: { status?: string; creatorId?: string; groupId?: string; limit?: number }): Promise<EventWithCreator[]> {
    const limit = options?.limit || 20;
    const conditions: any[] = [];

    if (options?.status) {
      conditions.push(eq(events.status, options.status as any));
    }
    if (options?.creatorId) {
      conditions.push(eq(events.creatorId, options.creatorId));
    }
    if (options?.groupId) {
      conditions.push(eq(events.groupId, options.groupId));
    }

    let query = db
      .select({ event: events, creator: users })
      .from(events)
      .innerJoin(users, eq(events.creatorId, users.id))
      .orderBy(desc(events.startDate))
      .limit(limit);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.event,
      creator: sanitizeUser(row.creator) as any,
      spotsRemaining: row.event.maxAttendees 
        ? row.event.maxAttendees - (row.event.currentAttendees || 0) 
        : null,
    }));
  }

  async getEvent(id: string, userId?: string): Promise<EventWithCreator | undefined> {
    const [result] = await db
      .select({ event: events, creator: users })
      .from(events)
      .innerJoin(users, eq(events.creatorId, users.id))
      .where(eq(events.id, id));

    if (!result) return undefined;

    let userRsvp = null;
    if (userId) {
      userRsvp = await this.getUserEventRsvp(id, userId);
    }

    let group = null;
    if (result.event.groupId) {
      const [g] = await db.select({ id: groups.id, name: groups.name }).from(groups).where(eq(groups.id, result.event.groupId));
      group = g || null;
    }

    return {
      ...result.event,
      creator: sanitizeUser(result.creator) as any,
      group,
      userRsvp: userRsvp || null,
      spotsRemaining: result.event.maxAttendees 
        ? result.event.maxAttendees - (result.event.currentAttendees || 0) 
        : null,
    };
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event as any).returning();
    return created;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return updated || undefined;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const [created] = await db.insert(eventRsvps).values(rsvp).returning();
    const guestCount = rsvp.guestCount || 1;
    await db.update(events).set({
      currentAttendees: sql`${events.currentAttendees} + ${guestCount}`,
    }).where(eq(events.id, rsvp.eventId));
    return created;
  }

  async updateEventRsvp(eventId: string, userId: string, updates: Partial<EventRsvp>): Promise<EventRsvp | undefined> {
    const [updated] = await db
      .update(eventRsvps)
      .set(updates)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteEventRsvp(eventId: string, userId: string): Promise<void> {
    const [rsvp] = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    
    if (rsvp) {
      await db.delete(eventRsvps).where(eq(eventRsvps.id, rsvp.id));
      const guestCount = rsvp.guestCount || 1;
      await db.update(events).set({
        currentAttendees: sql`${events.currentAttendees} - ${guestCount}`,
      }).where(eq(events.id, eventId));
    }
  }

  async getEventRsvps(eventId: string): Promise<(EventRsvp & { user: User })[]> {
    const results = await db
      .select({ rsvp: eventRsvps, user: users })
      .from(eventRsvps)
      .innerJoin(users, eq(eventRsvps.userId, users.id))
      .where(eq(eventRsvps.eventId, eventId))
      .orderBy(desc(eventRsvps.createdAt));

    return results.map((row) => ({
      ...row.rsvp,
      user: sanitizeUser(row.user) as any,
    }));
  }

  async getUserEventRsvp(eventId: string, userId: string): Promise<EventRsvp | undefined> {
    const [rsvp] = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    return rsvp || undefined;
  }

  // ============= NATIONBUILDER-STYLE: EMAIL CAMPAIGNS =============

  async getEmailCampaigns(creatorId?: string): Promise<EmailCampaign[]> {
    let query = db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
    
    if (creatorId) {
      query = query.where(eq(emailCampaigns.creatorId, creatorId)) as any;
    }

    return await query;
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return campaign || undefined;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [created] = await db.insert(emailCampaigns).values(campaign).returning();
    return created;
  }

  async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const [updated] = await db.update(emailCampaigns).set(updates).where(eq(emailCampaigns.id, id)).returning();
    return updated || undefined;
  }

  async deleteEmailCampaign(id: string): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }

  // ============= NATIONBUILDER: VOLUNTEER MANAGEMENT =============

  async getVolunteerOpportunities(options?: { status?: string; creatorId?: string; groupId?: string; limit?: number }): Promise<VolunteerOpportunityWithCreator[]> {
    const limit = options?.limit || 20;
    const conditions: any[] = [];

    if (options?.status) {
      conditions.push(eq(volunteerOpportunities.status, options.status as any));
    }
    if (options?.creatorId) {
      conditions.push(eq(volunteerOpportunities.creatorId, options.creatorId));
    }
    if (options?.groupId) {
      conditions.push(eq(volunteerOpportunities.groupId, options.groupId));
    }

    let query = db
      .select({ opportunity: volunteerOpportunities, creator: users })
      .from(volunteerOpportunities)
      .innerJoin(users, eq(volunteerOpportunities.creatorId, users.id))
      .orderBy(desc(volunteerOpportunities.createdAt))
      .limit(limit);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.opportunity,
      creator: sanitizeUser(row.creator) as any,
      spotsRemaining: row.opportunity.maxVolunteers 
        ? row.opportunity.maxVolunteers - (row.opportunity.currentVolunteers || 0) 
        : null,
    }));
  }

  async getVolunteerOpportunity(id: string, userId?: string): Promise<VolunteerOpportunityWithCreator | undefined> {
    const [result] = await db
      .select({ opportunity: volunteerOpportunities, creator: users })
      .from(volunteerOpportunities)
      .innerJoin(users, eq(volunteerOpportunities.creatorId, users.id))
      .where(eq(volunteerOpportunities.id, id));

    if (!result) return undefined;

    const shifts = await db.select().from(volunteerShifts).where(eq(volunteerShifts.opportunityId, id)).orderBy(volunteerShifts.startTime);
    
    let userSignup = null;
    if (userId) {
      const [signup] = await db.select().from(volunteerSignups).where(and(eq(volunteerSignups.opportunityId, id), eq(volunteerSignups.userId, userId)));
      userSignup = signup || null;
    }

    return {
      ...result.opportunity,
      creator: sanitizeUser(result.creator) as any,
      shifts,
      userSignup,
      spotsRemaining: result.opportunity.maxVolunteers 
        ? result.opportunity.maxVolunteers - (result.opportunity.currentVolunteers || 0) 
        : null,
    };
  }

  async createVolunteerOpportunity(opportunity: InsertVolunteerOpportunity): Promise<VolunteerOpportunity> {
    const [created] = await db.insert(volunteerOpportunities).values(opportunity).returning();
    return created;
  }

  async updateVolunteerOpportunity(id: string, updates: Partial<VolunteerOpportunity>): Promise<VolunteerOpportunity | undefined> {
    const [updated] = await db.update(volunteerOpportunities).set(updates).where(eq(volunteerOpportunities.id, id)).returning();
    return updated || undefined;
  }

  async deleteVolunteerOpportunity(id: string): Promise<void> {
    await db.delete(volunteerOpportunities).where(eq(volunteerOpportunities.id, id));
  }

  async createVolunteerShift(shift: InsertVolunteerShift): Promise<VolunteerShift> {
    const [created] = await db.insert(volunteerShifts).values(shift).returning();
    return created;
  }

  async getVolunteerShifts(opportunityId: string): Promise<VolunteerShift[]> {
    return await db.select().from(volunteerShifts).where(eq(volunteerShifts.opportunityId, opportunityId)).orderBy(volunteerShifts.startTime);
  }

  async deleteVolunteerShift(id: string): Promise<void> {
    await db.delete(volunteerShifts).where(eq(volunteerShifts.id, id));
  }

  async createVolunteerSignup(signup: InsertVolunteerSignup): Promise<VolunteerSignup> {
    const [created] = await db.insert(volunteerSignups).values(signup).returning();
    await db.update(volunteerOpportunities).set({
      currentVolunteers: sql`${volunteerOpportunities.currentVolunteers} + 1`,
    }).where(eq(volunteerOpportunities.id, signup.opportunityId));
    if (signup.shiftId) {
      await db.update(volunteerShifts).set({
        currentVolunteers: sql`${volunteerShifts.currentVolunteers} + 1`,
      }).where(eq(volunteerShifts.id, signup.shiftId));
    }
    return created;
  }

  async cancelVolunteerSignup(signupId: string): Promise<void> {
    const [signup] = await db.select().from(volunteerSignups).where(eq(volunteerSignups.id, signupId));
    if (signup) {
      await db.update(volunteerSignups).set({ status: 'cancelled' }).where(eq(volunteerSignups.id, signupId));
      await db.update(volunteerOpportunities).set({
        currentVolunteers: sql`${volunteerOpportunities.currentVolunteers} - 1`,
      }).where(eq(volunteerOpportunities.id, signup.opportunityId));
      if (signup.shiftId) {
        await db.update(volunteerShifts).set({
          currentVolunteers: sql`${volunteerShifts.currentVolunteers} - 1`,
        }).where(eq(volunteerShifts.id, signup.shiftId));
      }
    }
  }

  async checkInVolunteer(signupId: string): Promise<VolunteerSignup | undefined> {
    const [updated] = await db.update(volunteerSignups).set({
      checkedIn: true,
      checkedInAt: new Date(),
    }).where(eq(volunteerSignups.id, signupId)).returning();
    return updated || undefined;
  }

  async checkOutVolunteer(signupId: string, hoursLogged: number): Promise<VolunteerSignup | undefined> {
    const [updated] = await db.update(volunteerSignups).set({
      checkedOut: true,
      checkedOutAt: new Date(),
      hoursLogged,
    }).where(eq(volunteerSignups.id, signupId)).returning();
    return updated || undefined;
  }

  async logVolunteerHours(hours: InsertVolunteerHours): Promise<VolunteerHours> {
    const [created] = await db.insert(volunteerHours).values(hours).returning();
    return created;
  }

  async getUserVolunteerHours(userId: string): Promise<VolunteerHours[]> {
    return await db.select().from(volunteerHours).where(eq(volunteerHours.userId, userId)).orderBy(desc(volunteerHours.date));
  }

  async getTotalVolunteerHours(userId: string): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${volunteerHours.hours}), 0)` }).from(volunteerHours).where(eq(volunteerHours.userId, userId));
    return result[0]?.total || 0;
  }

  async getVolunteerLeaderboard(limit: number = 10): Promise<{ userId: string; user: any; totalHours: number }[]> {
    const results = await db
      .select({
        userId: volunteerHours.userId,
        totalHours: sql<number>`SUM(${volunteerHours.hours})`,
      })
      .from(volunteerHours)
      .groupBy(volunteerHours.userId)
      .orderBy(desc(sql`SUM(${volunteerHours.hours})`))
      .limit(limit);

    const leaderboard = [];
    for (const row of results) {
      const [user] = await db.select().from(users).where(eq(users.id, row.userId));
      if (user) {
        leaderboard.push({
          userId: row.userId,
          user: sanitizeUser(user),
          totalHours: Number(row.totalHours),
        });
      }
    }
    return leaderboard;
  }

  // ============= NATIONBUILDER: SUPPORTER TAGS =============

  async getSupporterTags(): Promise<SupporterTag[]> {
    return await db.select().from(supporterTags).orderBy(supporterTags.name);
  }

  async createSupporterTag(tag: InsertSupporterTag): Promise<SupporterTag> {
    const [created] = await db.insert(supporterTags).values(tag).returning();
    return created;
  }

  async updateSupporterTag(id: string, updates: Partial<SupporterTag>): Promise<SupporterTag | undefined> {
    const [updated] = await db.update(supporterTags).set(updates).where(eq(supporterTags.id, id)).returning();
    return updated || undefined;
  }

  async deleteSupporterTag(id: string): Promise<void> {
    await db.delete(supporterTags).where(eq(supporterTags.id, id));
  }

  async addUserTag(userId: string, tagId: string, addedById?: string): Promise<UserTag> {
    const [created] = await db.insert(userTags).values({ userId, tagId, addedById }).returning();
    return created;
  }

  async removeUserTag(userId: string, tagId: string): Promise<void> {
    await db.delete(userTags).where(and(eq(userTags.userId, userId), eq(userTags.tagId, tagId)));
  }

  async getUserTags(userId: string): Promise<SupporterTag[]> {
    const results = await db
      .select({ tag: supporterTags })
      .from(userTags)
      .innerJoin(supporterTags, eq(userTags.tagId, supporterTags.id))
      .where(eq(userTags.userId, userId));
    return results.map((r) => r.tag);
  }

  async getUsersByTag(tagId: string): Promise<User[]> {
    const results = await db
      .select({ user: users })
      .from(userTags)
      .innerJoin(users, eq(userTags.userId, users.id))
      .where(eq(userTags.tagId, tagId));
    return results.map((r) => sanitizeUser(r.user) as any);
  }

  // ============= NATIONBUILDER: SAVED AUDIENCES =============

  async getSavedAudiences(createdById?: string): Promise<SavedAudience[]> {
    let query = db.select().from(savedAudiences).orderBy(desc(savedAudiences.createdAt));
    if (createdById) {
      query = query.where(eq(savedAudiences.createdById, createdById)) as any;
    }
    return await query;
  }

  async createSavedAudience(audience: InsertSavedAudience): Promise<SavedAudience> {
    const [created] = await db.insert(savedAudiences).values(audience as any).returning();
    return created;
  }

  async updateSavedAudience(id: string, updates: Partial<SavedAudience>): Promise<SavedAudience | undefined> {
    const [updated] = await db.update(savedAudiences).set({ ...updates, lastUpdated: new Date() }).where(eq(savedAudiences.id, id)).returning();
    return updated || undefined;
  }

  async deleteSavedAudience(id: string): Promise<void> {
    await db.delete(savedAudiences).where(eq(savedAudiences.id, id));
  }

  // ============= NATIONBUILDER: OPINION POLLS =============

  async getOpinionPolls(options?: { groupId?: string; status?: string; limit?: number }): Promise<OpinionPollWithCreator[]> {
    const limit = options?.limit || 20;
    const conditions: any[] = [];

    if (options?.status) {
      conditions.push(eq(opinionPolls.status, options.status));
    }
    if (options?.groupId) {
      conditions.push(eq(opinionPolls.groupId, options.groupId));
    }

    let query = db
      .select({ poll: opinionPolls, creator: users })
      .from(opinionPolls)
      .innerJoin(users, eq(opinionPolls.creatorId, users.id))
      .orderBy(desc(opinionPolls.createdAt))
      .limit(limit);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.poll,
      creator: sanitizeUser(row.creator) as any,
    }));
  }

  async getOpinionPoll(id: string, userId?: string): Promise<OpinionPollWithCreator | undefined> {
    const [result] = await db
      .select({ poll: opinionPolls, creator: users })
      .from(opinionPolls)
      .innerJoin(users, eq(opinionPolls.creatorId, users.id))
      .where(eq(opinionPolls.id, id));

    if (!result) return undefined;

    let userVote = null;
    if (userId) {
      const [vote] = await db.select().from(opinionPollVotes).where(and(eq(opinionPollVotes.pollId, id), eq(opinionPollVotes.userId, userId)));
      userVote = vote || null;
    }

    return {
      ...result.poll,
      creator: sanitizeUser(result.creator) as any,
      userVote,
    };
  }

  async createOpinionPoll(poll: InsertOpinionPoll): Promise<OpinionPoll> {
    const [created] = await db.insert(opinionPolls).values(poll as any).returning();
    return created;
  }

  async voteOnOpinionPoll(pollId: string, userId: string, optionIds: string[]): Promise<OpinionPollVote> {
    const [existingVote] = await db.select().from(opinionPollVotes).where(and(eq(opinionPollVotes.pollId, pollId), eq(opinionPollVotes.userId, userId)));
    if (existingVote) {
      throw new Error('Already voted on this poll');
    }

    const [vote] = await db.insert(opinionPollVotes).values({ pollId, userId, optionIds }).returning();
    
    await db.update(opinionPolls).set({
      totalVotes: sql`${opinionPolls.totalVotes} + 1`,
    }).where(eq(opinionPolls.id, pollId));

    return vote;
  }

  async closeOpinionPoll(id: string): Promise<OpinionPoll | undefined> {
    const [updated] = await db.update(opinionPolls).set({ status: 'closed' }).where(eq(opinionPolls.id, id)).returning();
    return updated || undefined;
  }

  // ============= NATIONBUILDER: CONTACT OFFICIALS =============

  async getContactOfficialsCampaigns(options?: { status?: string; limit?: number }): Promise<ContactOfficialsCampaign[]> {
    const limit = options?.limit || 20;
    let query = db.select().from(contactOfficialsCampaigns).orderBy(desc(contactOfficialsCampaigns.createdAt)).limit(limit);
    
    if (options?.status) {
      query = query.where(eq(contactOfficialsCampaigns.status, options.status)) as any;
    }

    return await query;
  }

  async createContactOfficialsCampaign(campaign: InsertContactOfficialsCampaign): Promise<ContactOfficialsCampaign> {
    const [created] = await db.insert(contactOfficialsCampaigns).values(campaign).returning();
    return created;
  }

  async recordOfficialContact(contact: InsertOfficialContact): Promise<OfficialContact> {
    const [created] = await db.insert(officialContacts).values(contact).returning();
    await db.update(contactOfficialsCampaigns).set({
      contactCount: sql`${contactOfficialsCampaigns.contactCount} + 1`,
    }).where(eq(contactOfficialsCampaigns.id, contact.campaignId));
    return created;
  }

  async getOfficialContacts(campaignId: string): Promise<OfficialContact[]> {
    return await db.select().from(officialContacts).where(eq(officialContacts.campaignId, campaignId)).orderBy(desc(officialContacts.createdAt));
  }

  // ============= NATIONBUILDER: ENGAGEMENT TRACKING =============

  async getEngagementProgress(userId: string): Promise<EngagementProgress | undefined> {
    const [progress] = await db.select().from(engagementProgress).where(eq(engagementProgress.userId, userId));
    return progress || undefined;
  }

  async createOrUpdateEngagementProgress(userId: string, updates: Partial<EngagementProgress>): Promise<EngagementProgress> {
    const existing = await this.getEngagementProgress(userId);
    
    if (existing) {
      const [updated] = await db.update(engagementProgress).set({
        ...updates,
        lastActivityAt: new Date(),
      }).where(eq(engagementProgress.userId, userId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(engagementProgress).values({
        userId,
        ...updates,
        lastActivityAt: new Date(),
      }).returning();
      return created;
    }
  }

  async updateEngagementLevel(userId: string, level: string): Promise<EngagementProgress | undefined> {
    const [updated] = await db.update(engagementProgress).set({
      currentLevel: level as any,
      levelUpdatedAt: new Date(),
    }).where(eq(engagementProgress.userId, userId)).returning();
    return updated || undefined;
  }

  async getEngagementLeaderboard(limit: number = 10): Promise<EngagementProgress[]> {
    return await db.select().from(engagementProgress)
      .orderBy(desc(engagementProgress.volunteerHours), desc(engagementProgress.eventsAttended))
      .limit(limit);
  }

  // ============= NATIONBUILDER: PHONE BANKING =============

  async getPhoneBankingLists(options?: { creatorId?: string; status?: string }): Promise<PhoneBankingListWithStats[]> {
    let query = db
      .select({ list: phoneBankingLists, creator: users })
      .from(phoneBankingLists)
      .innerJoin(users, eq(phoneBankingLists.creatorId, users.id))
      .orderBy(desc(phoneBankingLists.createdAt));

    const conditions: any[] = [];
    if (options?.creatorId) {
      conditions.push(eq(phoneBankingLists.creatorId, options.creatorId));
    }
    if (options?.status) {
      conditions.push(eq(phoneBankingLists.status, options.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.list,
      creator: sanitizeUser(row.creator) as any,
      percentComplete: row.list.totalContacts ? (row.list.completedContacts || 0) / row.list.totalContacts * 100 : 0,
    }));
  }

  async createPhoneBankingList(list: InsertPhoneBankingList): Promise<PhoneBankingList> {
    const [created] = await db.insert(phoneBankingLists).values(list).returning();
    return created;
  }

  async addPhoneBankingContact(contact: InsertPhoneBankingContact): Promise<PhoneBankingContact> {
    const [created] = await db.insert(phoneBankingContacts).values(contact).returning();
    await db.update(phoneBankingLists).set({
      totalContacts: sql`${phoneBankingLists.totalContacts} + 1`,
    }).where(eq(phoneBankingLists.id, contact.listId));
    return created;
  }

  async getPhoneBankingContacts(listId: string, options?: { status?: string; assignedToId?: string }): Promise<PhoneBankingContact[]> {
    const conditions: any[] = [eq(phoneBankingContacts.listId, listId)];
    
    if (options?.status) {
      conditions.push(eq(phoneBankingContacts.status, options.status));
    }
    if (options?.assignedToId) {
      conditions.push(eq(phoneBankingContacts.assignedToId, options.assignedToId));
    }

    return await db.select().from(phoneBankingContacts).where(and(...conditions)).orderBy(desc(phoneBankingContacts.priority));
  }

  async recordPhoneCall(contactId: string, callerId: string, outcome: string, notes?: string): Promise<PhoneBankingContact | undefined> {
    const [updated] = await db.update(phoneBankingContacts).set({
      status: 'completed',
      outcome: outcome as any,
      callNotes: notes,
      calledAt: new Date(),
      calledById: callerId,
    }).where(eq(phoneBankingContacts.id, contactId)).returning();

    if (updated) {
      await db.update(phoneBankingLists).set({
        completedContacts: sql`${phoneBankingLists.completedContacts} + 1`,
      }).where(eq(phoneBankingLists.id, updated.listId));
    }

    return updated || undefined;
  }

  // ============= NATIONBUILDER: CANVASSING =============

  async getCanvassingTurfs(options?: { creatorId?: string; status?: string }): Promise<CanvassingTurfWithStats[]> {
    let query = db
      .select({ turf: canvassingTurfs, creator: users })
      .from(canvassingTurfs)
      .innerJoin(users, eq(canvassingTurfs.creatorId, users.id))
      .orderBy(desc(canvassingTurfs.createdAt));

    const conditions: any[] = [];
    if (options?.creatorId) {
      conditions.push(eq(canvassingTurfs.creatorId, options.creatorId));
    }
    if (options?.status) {
      conditions.push(eq(canvassingTurfs.status, options.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.turf,
      creator: sanitizeUser(row.creator) as any,
      percentComplete: row.turf.totalDoors ? (row.turf.knockedDoors || 0) / row.turf.totalDoors * 100 : 0,
    }));
  }

  async createCanvassingTurf(turf: InsertCanvassingTurf): Promise<CanvassingTurf> {
    const [created] = await db.insert(canvassingTurfs).values(turf as any).returning();
    return created;
  }

  async recordCanvassingContact(contact: InsertCanvassingContact): Promise<CanvassingContact> {
    const [created] = await db.insert(canvassingContacts).values(contact).returning();
    await db.update(canvassingTurfs).set({
      knockedDoors: sql`${canvassingTurfs.knockedDoors} + 1`,
    }).where(eq(canvassingTurfs.id, contact.turfId));
    return created;
  }

  async getCanvassingContacts(turfId: string): Promise<CanvassingContact[]> {
    return await db.select().from(canvassingContacts).where(eq(canvassingContacts.turfId, turfId)).orderBy(desc(canvassingContacts.contactedAt));
  }

  // ============= NATIONBUILDER: RECRUITER STATS =============

  async getRecruiterStats(userId: string): Promise<RecruiterStats | undefined> {
    const [stats] = await db.select().from(recruiterStats).where(eq(recruiterStats.userId, userId));
    return stats || undefined;
  }

  async updateRecruiterStats(userId: string, updates: Partial<RecruiterStats>): Promise<RecruiterStats> {
    const existing = await this.getRecruiterStats(userId);
    
    if (existing) {
      const [updated] = await db.update(recruiterStats).set({
        ...updates,
        updatedAt: new Date(),
      }).where(eq(recruiterStats.userId, userId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(recruiterStats).values({
        userId,
        ...updates,
        updatedAt: new Date(),
      }).returning();
      return created;
    }
  }

  async getRecruiterLeaderboard(limit: number = 10): Promise<(RecruiterStats & { user: any })[]> {
    const results = await db.select().from(recruiterStats)
      .orderBy(desc(recruiterStats.totalRecruits))
      .limit(limit);

    const leaderboard = [];
    for (const row of results) {
      const [user] = await db.select().from(users).where(eq(users.id, row.userId));
      if (user) {
        leaderboard.push({
          ...row,
          user: sanitizeUser(user),
        });
      }
    }
    return leaderboard;
  }

  async recordRecruitment(recruiterId: string): Promise<void> {
    const stats = await this.getRecruiterStats(recruiterId);
    
    await this.updateRecruiterStats(recruiterId, {
      totalRecruits: (stats?.totalRecruits || 0) + 1,
      weeklyRecruits: (stats?.weeklyRecruits || 0) + 1,
      monthlyRecruits: (stats?.monthlyRecruits || 0) + 1,
      lastRecruitAt: new Date(),
    });
  }
}

export const storage = new DatabaseStorage();
