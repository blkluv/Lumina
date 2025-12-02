import { db, pool } from "./db";
import { users, posts, groups, groupMemberships, follows } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  try {
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const [user1] = await db.insert(users).values({
      email: "alex@example.com",
      username: "alexchen",
      password: hashedPassword,
      displayName: "Alex Chen",
      bio: "Web3 developer and DeFi enthusiast. Building the future of decentralized social media.",
      avatarUrl: null,
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f3d842",
      walletVerified: true,
    }).returning();

    const [user2] = await db.insert(users).values({
      email: "sarah@example.com",
      username: "sarahk",
      password: hashedPassword,
      displayName: "Sarah Kim",
      bio: "Digital artist and NFT creator. Exploring the intersection of art and blockchain.",
      avatarUrl: null,
      walletAddress: "0x892d35Cc6634C0532925a3b844Bc9e7595f3d843",
      walletVerified: true,
    }).returning();

    const [user3] = await db.insert(users).values({
      email: "marcus@example.com",
      username: "marcusj",
      password: hashedPassword,
      displayName: "Marcus Johnson",
      bio: "Crypto trader and blockchain educator. Sharing knowledge about DeFi and tokenomics.",
      avatarUrl: null,
      walletAddress: null,
      walletVerified: false,
    }).returning();

    console.log("Created users:", user1.id, user2.id, user3.id);

    await db.insert(posts).values([
      {
        authorId: user1.id,
        content: "Just deployed my first smart contract on Arbitrum One! The gas fees are incredibly low compared to mainnet. Excited to build more DeFi protocols on L2. Who else is building on Arbitrum?",
        postType: "text",
        visibility: "public",
        likeCount: 42,
        commentCount: 8,
        shareCount: 5,
      },
      {
        authorId: user2.id,
        content: "New digital art piece dropping tomorrow! This one explores the theme of decentralization through abstract patterns. Can't wait to share it with the community.",
        postType: "text",
        visibility: "public",
        likeCount: 89,
        commentCount: 15,
        shareCount: 12,
      },
      {
        authorId: user3.id,
        content: "Thread on understanding tokenomics and why it matters for your investments.\n\n1/ Supply dynamics - total supply, circulating supply, and emission schedules all affect price.\n\n2/ Utility - what can you actually DO with the token?\n\n3/ Governance - does holding give you voting power?",
        postType: "text",
        visibility: "public",
        likeCount: 156,
        commentCount: 34,
        shareCount: 45,
      },
      {
        authorId: user1.id,
        content: "Web3 social platforms are the future. Traditional social media profits from YOUR content while giving you nothing. On platforms like Lumina, creators earn rewards for engagement. This is how it should be.",
        postType: "text",
        visibility: "public",
        likeCount: 78,
        commentCount: 22,
        shareCount: 18,
      },
    ]);

    console.log("Created posts");

    const [group1] = await db.insert(groups).values({
      name: "DeFi Traders",
      description: "A community for DeFi traders to share strategies, discuss protocols, and help each other navigate the decentralized finance ecosystem.",
      category: "Finance",
      isPrivate: false,
      memberCount: 2340,
      createdById: user3.id,
    }).returning();

    const [group2] = await db.insert(groups).values({
      name: "NFT Collectors",
      description: "Connect with fellow NFT enthusiasts, share your collections, and discover new artists in the Web3 art space.",
      category: "Art",
      isPrivate: false,
      memberCount: 1876,
      createdById: user2.id,
    }).returning();

    const [group3] = await db.insert(groups).values({
      name: "Smart Contract Devs",
      description: "Technical discussions about smart contract development, security audits, and best practices for building on EVM chains.",
      category: "Tech",
      isPrivate: false,
      memberCount: 3102,
      createdById: user1.id,
    }).returning();

    console.log("Created groups:", group1.id, group2.id, group3.id);

    await db.insert(groupMemberships).values([
      { groupId: group1.id, userId: user1.id, role: "member" },
      { groupId: group1.id, userId: user2.id, role: "member" },
      { groupId: group2.id, userId: user1.id, role: "member" },
      { groupId: group3.id, userId: user2.id, role: "member" },
      { groupId: group3.id, userId: user3.id, role: "member" },
    ]);

    console.log("Created group memberships");

    await db.insert(follows).values([
      { followerId: user1.id, followingId: user2.id },
      { followerId: user1.id, followingId: user3.id },
      { followerId: user2.id, followingId: user1.id },
      { followerId: user2.id, followingId: user3.id },
      { followerId: user3.id, followingId: user1.id },
    ]);

    console.log("Created follows");

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
