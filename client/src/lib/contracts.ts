/**
 * Lumina Smart Contracts Configuration
 * 
 * Integrated from AXIOM Protocol GitHub Repository
 * Network: Arbitrum One (Chain ID: 42161)
 * Source: https://github.com/AxiomProtocol/AXIOM
 * 
 * Total Contracts Integrated: 6
 * - AxiomV2 (AXM Token)
 * - AxiomStakingAndEmissionsHub  
 * - CommunitySocialHub
 * - GamificationHub
 * - MarketsAndListingsHub
 * - CitizenReputationOracle
 */

export const NETWORK_CONFIG = {
  chainId: 42161,
  chainIdHex: '0xa4b1',
  chainName: 'Arbitrum One',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  blockExplorer: 'https://arbitrum.blockscout.com',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  }
} as const;

export const CONTRACT_ADDRESSES = {
  AXM_TOKEN: '0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D',
  STAKING_EMISSIONS: '0x8b99cDeefB3116cA87AF24A9E10D5580dA07B885',
  COMMUNITY_SOCIAL: '0xC2f82eD5C2585B525E01F19eA5C28811AB43aF49',
  GAMIFICATION: '0x7F455b4614E05820AAD52067Ef223f30b1936f93',
  MARKETS_RWA: '0x98a59D4fb5Fa974879E9F043C3174Ae82Fb9D830',
  REPUTATION_ORACLE: '0x649a0F1bd204b6f23A92f1CDbb2F1838D691B643',
  IDENTITY_COMPLIANCE: '0xf88bb44511E5752Ee69953166C5d5dC0cfC8B3ED',
  TREASURY_REVENUE: '0x3fD63728288546AC41dAe3bf25ca383061c3A929',
} as const;

export const AXM_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function burn(uint256 value)",
  "function burnFrom(address account, uint256 value)",
  "function delegate(address delegatee)",
  "function delegates(address account) view returns (address)",
  "function getVotes(address account) view returns (uint256)",
  "function getPastVotes(address account, uint256 timepoint) view returns (uint256)",
  "function getPastTotalSupply(uint256 timepoint) view returns (uint256)",
  "function nonces(address owner) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)",
  "event DelegateVotesChanged(address indexed delegate, uint256 previousVotes, uint256 newVotes)",
] as const;

export const STAKING_ABI = [
  "function stake(uint256 amount, uint256 lockPeriod) returns (uint256 positionId)",
  "function unstake(uint256 positionId)",
  "function claimRewards(uint256 positionId) returns (uint256 rewards)",
  "function getStakingPositions(address user) view returns (tuple(uint256 id, uint256 amount, uint256 startTime, uint256 lockPeriod, uint256 rewardDebt, bool isActive)[])",
  "function getTotalStaked(address user) view returns (uint256)",
  "function getPendingRewards(uint256 positionId) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function stakingToken() view returns (address)",
  "event Staked(address indexed user, uint256 indexed positionId, uint256 amount, uint256 lockPeriod)",
  "event Unstaked(address indexed user, uint256 indexed positionId, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 indexed positionId, uint256 rewards)",
] as const;

export const COMMUNITY_SOCIAL_ABI = [
  "function tipCreator(address recipient, uint256 amount, bytes32 contentId)",
  "function rewardContent(bytes32 contentId, uint256 amount)",
  "function getTotalTipsReceived(address user) view returns (uint256)",
  "function getTotalTipsSent(address user) view returns (uint256)",
  "function getContentRewards(address user) view returns (uint256)",
  "function claimPendingRewards() returns (uint256 amount)",
  "function getPendingRewards(address user) view returns (uint256)",
  "event TipSent(address indexed from, address indexed to, uint256 amount, bytes32 indexed contentId)",
  "event RewardsClaimed(address indexed user, uint256 amount)",
] as const;

export const GAMIFICATION_ABI = [
  "function getLevel(address user) view returns (uint256)",
  "function getXP(address user) view returns (uint256)",
  "function getCurrentStreak(address user) view returns (uint256)",
  "function getLongestStreak(address user) view returns (uint256)",
  "function getCompletedQuests(address user) view returns (uint256[])",
  "function getUnlockedAchievements(address user) view returns (uint256[])",
  "function completeQuest(uint256 questId) returns (uint256 xpEarned)",
  "function checkInDaily() returns (uint256 streakBonus)",
  "function getRewardPoints(address user) view returns (uint256)",
  "function convertPointsToTokens(uint256 points) returns (uint256 tokens)",
  "event QuestCompleted(address indexed user, uint256 indexed questId, uint256 xpEarned)",
  "event AchievementUnlocked(address indexed user, uint256 indexed achievementId)",
  "event LevelUp(address indexed user, uint256 newLevel)",
  "event DailyCheckIn(address indexed user, uint256 streak, uint256 bonus)",
] as const;

export const MARKETS_RWA_ABI = [
  "function createListing(address tokenAddress, uint256 tokenId, uint256 price) returns (uint256 listingId)",
  "function cancelListing(uint256 listingId)",
  "function buyListing(uint256 listingId) payable",
  "function updateListingPrice(uint256 listingId, uint256 newPrice)",
  "function getListing(uint256 listingId) view returns (tuple(uint256 id, address seller, address tokenAddress, uint256 tokenId, uint256 price, bool isActive, uint256 createdAt))",
  "function getActiveListings() view returns (uint256[])",
  "function getListingsBySeller(address seller) view returns (uint256[])",
  "function totalListings() view returns (uint256)",
  "function platformFee() view returns (uint256)",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, address tokenAddress, uint256 tokenId, uint256 price)",
  "event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 price)",
  "event ListingCancelled(uint256 indexed listingId)",
] as const;

export const REPUTATION_ORACLE_ABI = [
  "function getReputationScore(address user) view returns (uint256)",
  "function getBadges(address user) view returns (uint256[])",
  "function hasBadge(address user, uint256 badgeId) view returns (bool)",
  "function getBadgeInfo(uint256 badgeId) view returns (tuple(uint256 id, string name, string description, string imageURI, uint256 requirement, uint8 category))",
  "function getTier(address user) view returns (uint8)",
  "function totalBadges() view returns (uint256)",
  "event BadgeAwarded(address indexed user, uint256 indexed badgeId)",
  "event ReputationUpdated(address indexed user, uint256 oldScore, uint256 newScore)",
] as const;

export const ALL_CONTRACTS = {
  AXM_TOKEN: {
    address: CONTRACT_ADDRESSES.AXM_TOKEN,
    abi: AXM_TOKEN_ABI,
    name: 'Axiom Protocol Token',
    symbol: 'AXM',
    decimals: 18,
  },
  STAKING: {
    address: CONTRACT_ADDRESSES.STAKING_EMISSIONS,
    abi: STAKING_ABI,
    name: 'Staking & Emissions Hub',
  },
  SOCIAL: {
    address: CONTRACT_ADDRESSES.COMMUNITY_SOCIAL,
    abi: COMMUNITY_SOCIAL_ABI,
    name: 'Community Social Hub',
  },
  GAMIFICATION: {
    address: CONTRACT_ADDRESSES.GAMIFICATION,
    abi: GAMIFICATION_ABI,
    name: 'Gamification Hub',
  },
  MARKETPLACE: {
    address: CONTRACT_ADDRESSES.MARKETS_RWA,
    abi: MARKETS_RWA_ABI,
    name: 'Markets & Listings Hub',
  },
  REPUTATION: {
    address: CONTRACT_ADDRESSES.REPUTATION_ORACLE,
    abi: REPUTATION_ORACLE_ABI,
    name: 'Citizen Reputation Oracle',
  },
} as const;

export function getExplorerUrl(address: string): string {
  return `${NETWORK_CONFIG.blockExplorer}/address/${address}`;
}

export function getTransactionUrl(txHash: string): string {
  return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
}

export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 4);
  return `${integerPart.toLocaleString()}.${fractionalStr}`;
}

export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [integer, decimal = ''] = amount.split('.');
  const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedDecimal);
}

export function ethToWei(eth: string): bigint {
  return parseTokenAmount(eth, 18);
}

export function weiToEth(wei: bigint): string {
  return formatTokenAmount(wei, 18);
}

export function formatInteger(value: bigint): string {
  return Number(value).toLocaleString();
}

export const INTEGRATED_CONTRACT_COUNT = 6;

export const AXM_TOKEN_DECIMALS = 18;
