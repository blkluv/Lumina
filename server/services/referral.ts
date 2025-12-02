import { db } from "../db";
import { 
  referralEvents, 
  referralRewards, 
  referralTiers, 
  referralProgramSettings,
  users 
} from "@shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'sharklasers.com', 'getairmail.com'
];

interface ReferralSettings {
  baseRewardAxm: number;
  decayEnabled: boolean;
  decayStartDay: number;
  decayRatePerDay: number;
  minRewardAxm: number;
  maxDailyReferrals: number;
  maxMonthlyReferrals: number;
  maxLifetimeReferrals: number;
  antiSybilEnabled: boolean;
  minAccountAgeDays: number;
  minActivityScore: number;
  requireEmailVerification: boolean;
  requireWalletConnection: boolean;
  blockDisposableEmails: boolean;
  sameIpCooldownHours: number;
  disclosureText: string;
}

const DEFAULT_SETTINGS: ReferralSettings = {
  baseRewardAxm: 10,
  decayEnabled: true,
  decayStartDay: 30,
  decayRatePerDay: 0.02,
  minRewardAxm: 2,
  maxDailyReferrals: 5,
  maxMonthlyReferrals: 50,
  maxLifetimeReferrals: 500,
  antiSybilEnabled: true,
  minAccountAgeDays: 1,
  minActivityScore: 10,
  requireEmailVerification: true,
  requireWalletConnection: false,
  blockDisposableEmails: true,
  sameIpCooldownHours: 24,
  disclosureText: 'Referral rewards are subject to verification. Rewards decrease over time and are capped to ensure program sustainability. Terms and conditions apply.'
};

export async function getReferralSettings(): Promise<ReferralSettings> {
  try {
    const [settings] = await db.select().from(referralProgramSettings).limit(1);
    if (!settings) {
      return DEFAULT_SETTINGS;
    }
    return {
      baseRewardAxm: parseFloat(settings.baseRewardAxm || '10'),
      decayEnabled: settings.decayEnabled ?? true,
      decayStartDay: settings.decayStartDay ?? 30,
      decayRatePerDay: parseFloat(settings.decayRatePerDay || '0.02'),
      minRewardAxm: parseFloat(settings.minRewardAxm || '2'),
      maxDailyReferrals: settings.maxDailyReferralsGlobal ?? 5,
      maxMonthlyReferrals: settings.maxMonthlyReferralsGlobal ?? 50,
      maxLifetimeReferrals: settings.maxLifetimeReferrals ?? 500,
      antiSybilEnabled: settings.antiSybilEnabled ?? true,
      minAccountAgeDays: settings.minAccountAgeDays ?? 1,
      minActivityScore: settings.minActivityScore ?? 10,
      requireEmailVerification: settings.requireEmailVerification ?? true,
      requireWalletConnection: settings.requireWalletConnection ?? false,
      blockDisposableEmails: settings.blockDisposableEmails ?? true,
      sameIpCooldownHours: settings.sameIpCooldownHours ?? 24,
      disclosureText: settings.disclosureText || DEFAULT_SETTINGS.disclosureText,
    };
  } catch (error) {
    console.error('Failed to get referral settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function getReferralTiers() {
  try {
    const tiers = await db
      .select()
      .from(referralTiers)
      .where(eq(referralTiers.isActive, true))
      .orderBy(referralTiers.tierLevel);
    
    if (tiers.length === 0) {
      return getDefaultTiers();
    }
    return tiers;
  } catch (error) {
    console.error('Failed to get referral tiers:', error);
    return getDefaultTiers();
  }
}

function getDefaultTiers() {
  return [
    { tierLevel: 1, name: 'Starter', minReferrals: 0, bonusMultiplier: '1.0', maxDailyReferrals: 5, maxMonthlyReferrals: 50, badgeIcon: 'star' },
    { tierLevel: 2, name: 'Bronze', minReferrals: 10, bonusMultiplier: '1.1', maxDailyReferrals: 7, maxMonthlyReferrals: 75, badgeIcon: 'award' },
    { tierLevel: 3, name: 'Silver', minReferrals: 25, bonusMultiplier: '1.25', maxDailyReferrals: 10, maxMonthlyReferrals: 100, badgeIcon: 'trophy' },
    { tierLevel: 4, name: 'Gold', minReferrals: 50, bonusMultiplier: '1.5', maxDailyReferrals: 15, maxMonthlyReferrals: 150, badgeIcon: 'crown' },
    { tierLevel: 5, name: 'Diamond', minReferrals: 100, bonusMultiplier: '2.0', maxDailyReferrals: 25, maxMonthlyReferrals: 250, badgeIcon: 'gem' },
  ];
}

export function getUserTier(verifiedReferrals: number, tiers: any[]) {
  let userTier = tiers[0];
  for (const tier of tiers) {
    if (verifiedReferrals >= tier.minReferrals) {
      userTier = tier;
    }
  }
  return userTier;
}

export function calculateDecayMultiplier(
  programStartDate: Date,
  settings: ReferralSettings
): number {
  if (!settings.decayEnabled) return 1.0;
  
  const daysSinceStart = Math.floor(
    (Date.now() - programStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceStart < settings.decayStartDay) return 1.0;
  
  const decayDays = daysSinceStart - settings.decayStartDay;
  const decayMultiplier = Math.max(
    settings.minRewardAxm / settings.baseRewardAxm,
    1 - (decayDays * settings.decayRatePerDay)
  );
  
  return Math.max(0.2, decayMultiplier);
}

export function calculateReferralReward(
  baseReward: number,
  decayMultiplier: number,
  tierBonusMultiplier: number
): { total: number; breakdown: { base: number; decay: number; tierBonus: number } } {
  const decayedReward = baseReward * decayMultiplier;
  const tierBonus = decayedReward * (tierBonusMultiplier - 1);
  const total = decayedReward + tierBonus;
  
  return {
    total: Math.round(total * 100) / 100,
    breakdown: {
      base: baseReward,
      decay: Math.round(decayedReward * 100) / 100,
      tierBonus: Math.round(tierBonus * 100) / 100,
    }
  };
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  status: 'pending' | 'verified' | 'rejected';
}

export async function validateReferral(
  referrerId: string,
  referredId: string,
  referredEmail: string,
  referredIp?: string,
  referredUserAgent?: string
): Promise<ValidationResult> {
  const settings = await getReferralSettings();
  const reasons: string[] = [];
  let score = 100;
  
  if (!settings.antiSybilEnabled) {
    return { isValid: true, score: 100, reasons: [], status: 'verified' };
  }

  if (referrerId === referredId) {
    return { isValid: false, score: 0, reasons: ['Self-referral not allowed'], status: 'rejected' };
  }

  const referrer = await db.select().from(users).where(eq(users.id, referrerId)).limit(1);
  const referred = await db.select().from(users).where(eq(users.id, referredId)).limit(1);
  
  if (!referrer[0] || !referred[0]) {
    return { isValid: false, score: 0, reasons: ['User not found'], status: 'rejected' };
  }

  if (settings.blockDisposableEmails) {
    const emailDomain = referredEmail.split('@')[1]?.toLowerCase();
    if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
      score -= 50;
      reasons.push('Disposable email detected');
    }
  }

  if (settings.minAccountAgeDays > 0 && referred[0].createdAt) {
    const accountAge = Math.floor(
      (Date.now() - new Date(referred[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (accountAge < settings.minAccountAgeDays) {
      score -= 30;
      reasons.push(`Account age (${accountAge} days) below minimum (${settings.minAccountAgeDays} days)`);
    }
  }

  if (settings.requireWalletConnection && !referred[0].walletAddress) {
    score -= 20;
    reasons.push('Wallet not connected');
  }

  if (referredIp && settings.sameIpCooldownHours > 0) {
    const cooldownTime = new Date(Date.now() - settings.sameIpCooldownHours * 60 * 60 * 1000);
    const recentFromSameIp = await db
      .select()
      .from(referralEvents)
      .where(
        and(
          eq(referralEvents.referrerId, referrerId),
          eq(referralEvents.referredUserIp, referredIp),
          gte(referralEvents.createdAt, cooldownTime)
        )
      );
    
    if (recentFromSameIp.length > 0) {
      score -= 40;
      reasons.push('Recent referral from same IP address');
    }
  }

  const stats = await getReferrerStats(referrerId);
  const tiers = await getReferralTiers();
  const userTier = getUserTier(stats.verifiedReferrals, tiers);
  
  if (stats.dailyReferrals >= (userTier.maxDailyReferrals || settings.maxDailyReferrals)) {
    return { 
      isValid: false, 
      score: 0, 
      reasons: ['Daily referral limit reached'], 
      status: 'rejected' 
    };
  }
  
  if (stats.monthlyReferrals >= (userTier.maxMonthlyReferrals || settings.maxMonthlyReferrals)) {
    return { 
      isValid: false, 
      score: 0, 
      reasons: ['Monthly referral limit reached'], 
      status: 'rejected' 
    };
  }
  
  if (stats.lifetimeReferrals >= settings.maxLifetimeReferrals) {
    return { 
      isValid: false, 
      score: 0, 
      reasons: ['Lifetime referral limit reached'], 
      status: 'rejected' 
    };
  }

  let status: 'pending' | 'verified' | 'rejected' = 'pending';
  if (score >= 80) {
    status = 'verified';
  } else if (score < 30) {
    status = 'rejected';
  }

  return {
    isValid: score >= 30,
    score,
    reasons,
    status
  };
}

export async function getReferrerStats(referrerId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const allReferrals = await db
    .select()
    .from(referralEvents)
    .where(eq(referralEvents.referrerId, referrerId));
  
  const dailyReferrals = allReferrals.filter(
    r => r.createdAt && new Date(r.createdAt) >= startOfDay
  ).length;
  
  const monthlyReferrals = allReferrals.filter(
    r => r.createdAt && new Date(r.createdAt) >= startOfMonth
  ).length;
  
  const verifiedReferrals = allReferrals.filter(r => r.status === 'verified').length;
  const pendingReferrals = allReferrals.filter(r => r.status === 'pending').length;
  const rejectedReferrals = allReferrals.filter(r => r.status === 'rejected').length;
  
  const totalEarnings = allReferrals
    .filter(r => r.isPaid)
    .reduce((sum, r) => sum + parseFloat(r.bonusAxm || '0'), 0);
  
  const pendingEarnings = allReferrals
    .filter(r => !r.isPaid && r.status === 'verified')
    .reduce((sum, r) => sum + parseFloat(r.bonusAxm || '0'), 0);

  return {
    totalReferrals: allReferrals.length,
    dailyReferrals,
    monthlyReferrals,
    lifetimeReferrals: allReferrals.length,
    verifiedReferrals,
    pendingReferrals,
    rejectedReferrals,
    totalEarnings: totalEarnings.toString(),
    pendingEarnings: pendingEarnings.toString(),
  };
}

export async function createEnhancedReferral(data: {
  referrerId: string;
  referredId: string;
  referralCode: string;
  referredEmail: string;
  referredIp?: string;
  referredUserAgent?: string;
}) {
  const settings = await getReferralSettings();
  const tiers = await getReferralTiers();
  
  const validation = await validateReferral(
    data.referrerId,
    data.referredId,
    data.referredEmail,
    data.referredIp,
    data.referredUserAgent
  );
  
  if (!validation.isValid) {
    throw new Error(validation.reasons.join(', '));
  }

  const stats = await getReferrerStats(data.referrerId);
  const userTier = getUserTier(stats.verifiedReferrals, tiers);
  
  const programStartDate = new Date('2025-01-01');
  const decayMultiplier = calculateDecayMultiplier(programStartDate, settings);
  const tierBonusMultiplier = parseFloat(userTier.bonusMultiplier || '1.0');
  
  const reward = calculateReferralReward(
    settings.baseRewardAxm,
    decayMultiplier,
    tierBonusMultiplier
  );

  const [event] = await db.insert(referralEvents).values({
    referrerId: data.referrerId,
    referredId: data.referredId,
    referralCode: data.referralCode,
    bonusAxm: reward.total.toString(),
    baseReward: settings.baseRewardAxm.toString(),
    decayMultiplier: decayMultiplier.toString(),
    tierBonus: reward.breakdown.tierBonus.toString(),
    status: validation.status,
    verifiedAt: validation.status === 'verified' ? new Date() : null,
    referredUserIp: data.referredIp,
    referredUserAgent: data.referredUserAgent,
    validationScore: validation.score,
    validationNotes: validation.reasons.join('; '),
  }).returning();

  return {
    event,
    reward,
    validation,
    tier: userTier,
  };
}

export async function getReferralLeaderboard(limit: number = 10) {
  const leaderboard = await db
    .select({
      referrerId: referralEvents.referrerId,
      totalReferrals: sql<number>`count(*)::int`,
      verifiedReferrals: sql<number>`count(*) filter (where ${referralEvents.status} = 'verified')::int`,
      totalEarnings: sql<string>`coalesce(sum(case when ${referralEvents.isPaid} then cast(${referralEvents.bonusAxm} as numeric) else 0 end), 0)::text`,
    })
    .from(referralEvents)
    .groupBy(referralEvents.referrerId)
    .orderBy(desc(sql`count(*) filter (where ${referralEvents.status} = 'verified')`))
    .limit(limit);
  
  const enrichedLeaderboard = await Promise.all(
    leaderboard.map(async (entry) => {
      const [user] = await db.select({
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      }).from(users).where(eq(users.id, entry.referrerId));
      
      const tiers = await getReferralTiers();
      const tier = getUserTier(entry.verifiedReferrals, tiers);
      
      return {
        ...entry,
        user,
        tier: tier.name,
        tierLevel: tier.tierLevel,
      };
    })
  );
  
  return enrichedLeaderboard;
}

export async function getDisclosure(): Promise<string> {
  const settings = await getReferralSettings();
  return settings.disclosureText;
}
