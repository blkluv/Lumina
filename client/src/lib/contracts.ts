/**
 * Lumina Smart Contracts Configuration
 * 
 * Integrated from AXIOM Protocol GitHub Repository
 * Network: Arbitrum One (Chain ID: 42161)
 * Source: https://github.com/AxiomProtocol/AXIOM
 * 
 * Total Contracts Integrated: 9
 * - AxiomV2 (AXM Token)
 * - AxiomStakingAndEmissionsHub  
 * - CommunitySocialHub
 * - GamificationHub
 * - MarketsAndListingsHub
 * - CitizenReputationOracle
 * - AxiomAcademyHub (NEW)
 * - AxiomExchangeHub (NEW)
 * - DePINNodeSales (NEW)
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
  TREASURY_VAULT: '0x2bB2c2A7a1d82097488bf0b9c2a59c1910CD8D5d',
  REWARDS_POOL: '0x2bB2c2A7a1d82097488bf0b9c2a59c1910CD8D5d',
  ACADEMY_HUB: '0x30667931BEe54a58B76D387D086A975aB37206F4',
  EXCHANGE_HUB: '0xF660d260a0bBC690a8ab0f1e6A41049FC919A34D',
  DEPIN_NODE_SALES: '0x876951CaE4Ad48bdBfba547Ef4316Db576A9Edbd',
} as const;

export const TREASURY_CONFIG = {
  REWARDS_POOL_ALLOCATION: 1000000,
  REWARDS_POOL_ADDRESS: CONTRACT_ADDRESSES.REWARDS_POOL,
  TREASURY_VAULT_ADDRESS: CONTRACT_ADDRESSES.TREASURY_VAULT,
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

export const ACADEMY_HUB_ABI = [
  "function totalCourses() view returns (uint256)",
  "function totalEnrollments() view returns (uint256)",
  "function totalCertifications() view returns (uint256)",
  "function totalInstructors() view returns (uint256)",
  "function isInstructor(address) view returns (bool)",
  "function registerInstructor(string name, string bio, string imageURI)",
  "function createCourse(string title, string description, string imageURI, uint8 level, bool requiresVerification) returns (uint256)",
  "function addModule(uint256 courseId, string title, string description, bool isRequired) returns (uint256)",
  "function addLesson(uint256 moduleId, string title, string contentURI, uint256 estimatedMinutes) returns (uint256)",
  "function publishCourse(uint256 courseId)",
  "function enrollInCourse(uint256 courseId)",
  "function completeLesson(uint256 lessonId)",
  "function getCourse(uint256 courseId) view returns (tuple(uint256 courseId, string title, string description, string imageURI, address instructor, uint8 level, uint8 status, uint256 moduleCount, uint256 totalLessons, uint256 enrollmentCount, uint256 completionCount, bool requiresVerification, uint256 createdAt))",
  "function getEnrollment(address student, uint256 courseId) view returns (tuple(address student, uint256 courseId, uint256 enrolledAt, uint256 lastAccessedAt, uint256 progressPercentage, bool isCompleted, uint256 completedAt))",
  "function getStudentCourses(address student) view returns (uint256[])",
  "function getCertification(uint256 certId) view returns (tuple(uint256 certificationId, address recipient, uint256 courseId, uint8 certificationType, string credentialURI, address certifier, uint256 issuedAt, bool isRevoked))",
  "function getStudentCertifications(address student) view returns (uint256[])",
  "event CourseCreated(uint256 indexed courseId, address indexed instructor, string title, uint8 level)",
  "event StudentEnrolled(address indexed student, uint256 indexed courseId, uint256 timestamp)",
  "event LessonCompleted(address indexed student, uint256 indexed lessonId, uint256 timestamp)",
  "event CourseCompleted(address indexed student, uint256 indexed courseId, uint256 timestamp)",
  "event CertificationIssued(uint256 indexed certificationId, address indexed recipient, uint256 indexed courseId, uint8 certificationType)",
] as const;

export const EXCHANGE_HUB_ABI = [
  "function totalPools() view returns (uint256)",
  "function totalSwaps() view returns (uint256)",
  "function swapFee() view returns (uint256)",
  "function pools(uint256 poolId) view returns (tuple(uint256 poolId, address tokenA, address tokenB, uint256 reserveA, uint256 reserveB, uint256 totalLiquidity, uint256 lockedLiquidity, bool isActive, uint256 createdAt, uint256 totalVolume, uint256 totalFees))",
  "function pairToPoolId(address tokenA, address tokenB) view returns (uint256)",
  "function liquidityBalances(uint256 poolId, address provider) view returns (uint256)",
  "function createPool(address tokenA, address tokenB, uint256 amountA, uint256 amountB) returns (uint256)",
  "function addLiquidity(uint256 poolId, uint256 amountA, uint256 amountB, uint256 minLiquidity) returns (uint256)",
  "function removeLiquidity(uint256 poolId, uint256 liquidity, uint256 minAmountA, uint256 minAmountB) returns (uint256, uint256)",
  "function swap(uint256 poolId, address tokenIn, uint256 amountIn, uint256 minAmountOut) returns (uint256)",
  "function getAmountOut(uint256 poolId, address tokenIn, uint256 amountIn) view returns (uint256)",
  "function userPools(address user) view returns (uint256[])",
  "event PoolCreated(uint256 indexed poolId, address indexed tokenA, address indexed tokenB, uint256 initialLiquidityA, uint256 initialLiquidityB)",
  "event LiquidityAdded(uint256 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity)",
  "event LiquidityRemoved(uint256 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity)",
  "event Swap(uint256 indexed swapId, uint256 indexed poolId, address indexed trader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee)",
] as const;

export const DEPIN_NODE_SALES_ABI = [
  "function treasurySafe() view returns (address)",
  "function axmToken() view returns (address)",
  "function totalNodesSold() view returns (uint256)",
  "function totalEthCollected() view returns (uint256)",
  "function totalAxmCollected() view returns (uint256)",
  "function axmDiscountBps() view returns (uint256)",
  "function fallbackAxmPerEth() view returns (uint256)",
  "function nodeTiers(uint256 tierId) view returns (tuple(uint256 tier, string name, uint256 priceEth, uint8 category, bool active))",
  "function activeTierIds(uint256 index) view returns (uint256)",
  "function purchaseNodeWithETH(uint256 tierId, uint8 category, string metadata) payable",
  "function purchaseNodeWithAXM(uint256 tierId, uint8 category, string metadata)",
  "function getAxmPrice(uint256 tierId) view returns (uint256)",
  "function getEthPrice(uint256 tierId) view returns (uint256)",
  "function getUserPurchases(address user) view returns (tuple(address buyer, uint256 tierId, uint8 category, uint8 paymentType, uint256 ethPaid, uint256 axmPaid, uint256 timestamp, string metadata)[])",
  "function getAllTiers() view returns (tuple(uint256 tier, string name, uint256 priceEth, uint8 category, bool active)[])",
  "event NodePurchasedWithETH(address indexed buyer, uint256 indexed tierId, uint8 indexed category, uint256 ethPaid, uint256 purchaseId, uint256 timestamp)",
  "event NodePurchasedWithAXM(address indexed buyer, uint256 indexed tierId, uint8 indexed category, uint256 axmPaid, uint256 discountApplied, uint256 purchaseId, uint256 timestamp)",
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
  ACADEMY: {
    address: CONTRACT_ADDRESSES.ACADEMY_HUB,
    abi: ACADEMY_HUB_ABI,
    name: 'Axiom Academy Hub',
  },
  EXCHANGE: {
    address: CONTRACT_ADDRESSES.EXCHANGE_HUB,
    abi: EXCHANGE_HUB_ABI,
    name: 'Axiom Exchange Hub',
  },
  DEPIN_NODES: {
    address: CONTRACT_ADDRESSES.DEPIN_NODE_SALES,
    abi: DEPIN_NODE_SALES_ABI,
    name: 'DePIN Node Sales',
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

export const INTEGRATED_CONTRACT_COUNT = 9;

export const AXM_TOKEN_DECIMALS = 18;
