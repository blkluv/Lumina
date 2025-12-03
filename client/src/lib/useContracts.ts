/**
 * Lumina Smart Contract Hooks
 * 
 * React hooks for interacting with integrated AXIOM Protocol contracts
 * Uses ethers.js for proper ABI encoding and contract interaction
 * Network: Arbitrum One (Chain ID: 42161)
 */

import { useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './walletContext';
import { 
  CONTRACT_ADDRESSES, 
  AXM_TOKEN_ABI, 
  STAKING_ABI, 
  COMMUNITY_SOCIAL_ABI,
  GAMIFICATION_ABI,
  MARKETS_RWA_ABI,
  REPUTATION_ORACLE_ABI,
  ACADEMY_HUB_ABI,
  EXCHANGE_HUB_ABI,
  DEPIN_NODE_SALES_ABI,
  formatTokenAmount,
  parseTokenAmount,
  NETWORK_CONFIG,
  TREASURY_CONFIG
} from './contracts';

function getProvider(): ethers.BrowserProvider | null {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
}

async function getSigner(): Promise<ethers.Signer | null> {
  const provider = getProvider();
  if (!provider) return null;
  try {
    return await provider.getSigner();
  } catch {
    return null;
  }
}

export function useTokenContract() {
  const { address, isConnected, isCorrectNetwork } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.AXM_TOKEN, AXM_TOKEN_ABI, provider);
  }, []);

  const getBalance = useCallback(async (userAddress?: string): Promise<string> => {
    if (!contract) return '0';
    const targetAddress = userAddress || address;
    if (!targetAddress) return '0';
    
    try {
      const balance = await contract.balanceOf(targetAddress);
      return formatTokenAmount(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }, [contract, address]);

  const transfer = useCallback(async (to: string, amount: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.AXM_TOKEN, AXM_TOKEN_ABI, signer);
      const amountWei = parseTokenAmount(amount);
      const tx = await contractWithSigner.transfer(to, amountWei);
      return tx.hash;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const approve = useCallback(async (spender: string, amount: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.AXM_TOKEN, AXM_TOKEN_ABI, signer);
      const amountWei = parseTokenAmount(amount);
      const tx = await contractWithSigner.approve(spender, amountWei);
      return tx.hash;
    } catch (error) {
      console.error('Approve failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const delegate = useCallback(async (delegatee: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.AXM_TOKEN, AXM_TOKEN_ABI, signer);
      const tx = await contractWithSigner.delegate(delegatee);
      return tx.hash;
    } catch (error) {
      console.error('Delegate failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const getVotes = useCallback(async (userAddress?: string): Promise<string> => {
    if (!contract) return '0';
    const targetAddress = userAddress || address;
    if (!targetAddress) return '0';
    
    try {
      const votes = await contract.getVotes(targetAddress);
      return formatTokenAmount(votes);
    } catch (error) {
      console.error('Failed to get votes:', error);
      return '0';
    }
  }, [contract, address]);

  const getTotalSupply = useCallback(async (): Promise<string> => {
    if (!contract) return '0';
    try {
      const supply = await contract.totalSupply();
      return formatTokenAmount(supply);
    } catch (error) {
      console.error('Failed to get total supply:', error);
      return '0';
    }
  }, [contract]);

  const getMaxSupply = useCallback(async (): Promise<string> => {
    if (!contract) return '0';
    try {
      const maxSupply = await contract.MAX_SUPPLY();
      return formatTokenAmount(maxSupply);
    } catch (error) {
      console.error('Failed to get max supply:', error);
      return '0';
    }
  }, [contract]);

  return { getBalance, transfer, approve, delegate, getVotes, getTotalSupply, getMaxSupply };
}

export function useStakingContract() {
  const { address, isCorrectNetwork } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.STAKING_EMISSIONS, STAKING_ABI, provider);
  }, []);

  const stake = useCallback(async (amount: string, lockPeriodDays: number): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.AXM_TOKEN, AXM_TOKEN_ABI, signer);
      const stakingContract = new ethers.Contract(CONTRACT_ADDRESSES.STAKING_EMISSIONS, STAKING_ABI, signer);
      
      const amountWei = parseTokenAmount(amount);
      const lockPeriodSeconds = BigInt(lockPeriodDays * 24 * 60 * 60);
      
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.STAKING_EMISSIONS, amountWei);
      await approveTx.wait();
      
      const stakeTx = await stakingContract.stake(amountWei, lockPeriodSeconds);
      return stakeTx.hash;
    } catch (error) {
      console.error('Stake failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const unstake = useCallback(async (positionId: number): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.STAKING_EMISSIONS, STAKING_ABI, signer);
      const tx = await contractWithSigner.unstake(positionId);
      return tx.hash;
    } catch (error) {
      console.error('Unstake failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const claimRewards = useCallback(async (positionId: number): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.STAKING_EMISSIONS, STAKING_ABI, signer);
      const tx = await contractWithSigner.claimRewards(positionId);
      return tx.hash;
    } catch (error) {
      console.error('Claim rewards failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const getTotalStaked = useCallback(async (userAddress?: string): Promise<string> => {
    if (!contract) return '0';
    const targetAddress = userAddress || address;
    if (!targetAddress) return '0';
    
    try {
      const staked = await contract.getTotalStaked(targetAddress);
      return formatTokenAmount(staked);
    } catch (error) {
      console.error('Failed to get total staked:', error);
      return '0';
    }
  }, [contract, address]);

  const getStakingPositions = useCallback(async (userAddress?: string): Promise<any[]> => {
    if (!contract) return [];
    const targetAddress = userAddress || address;
    if (!targetAddress) return [];
    
    try {
      const positions = await contract.getStakingPositions(targetAddress);
      return positions;
    } catch (error) {
      console.error('Failed to get staking positions:', error);
      return [];
    }
  }, [contract, address]);

  const getPendingRewards = useCallback(async (positionId: number): Promise<string> => {
    if (!contract) return '0';
    
    try {
      const rewards = await contract.getPendingRewards(positionId);
      return formatTokenAmount(rewards);
    } catch (error) {
      console.error('Failed to get pending rewards:', error);
      return '0';
    }
  }, [contract]);

  const getGlobalTotalStaked = useCallback(async (): Promise<string> => {
    if (!contract) return '0';
    
    try {
      const total = await contract.totalStaked();
      return formatTokenAmount(total);
    } catch (error) {
      console.error('Failed to get global total staked:', error);
      return '0';
    }
  }, [contract]);

  return { 
    stake, 
    unstake, 
    claimRewards, 
    getTotalStaked, 
    getStakingPositions,
    getPendingRewards,
    getGlobalTotalStaked 
  };
}

export function useSocialContract() {
  const { address, isCorrectNetwork } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.COMMUNITY_SOCIAL, COMMUNITY_SOCIAL_ABI, provider);
  }, []);

  const tipCreator = useCallback(async (recipient: string, amount: string, contentId: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.AXM_TOKEN, AXM_TOKEN_ABI, signer);
      const socialContract = new ethers.Contract(CONTRACT_ADDRESSES.COMMUNITY_SOCIAL, COMMUNITY_SOCIAL_ABI, signer);
      
      const amountWei = parseTokenAmount(amount);
      const contentIdBytes = ethers.encodeBytes32String(contentId.slice(0, 31));
      
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.COMMUNITY_SOCIAL, amountWei);
      await approveTx.wait();
      
      const tipTx = await socialContract.tipCreator(recipient, amountWei, contentIdBytes);
      return tipTx.hash;
    } catch (error) {
      console.error('Tip failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const claimRewards = useCallback(async (): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.COMMUNITY_SOCIAL, COMMUNITY_SOCIAL_ABI, signer);
      const tx = await contractWithSigner.claimPendingRewards();
      return tx.hash;
    } catch (error) {
      console.error('Claim rewards failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const getPendingRewards = useCallback(async (userAddress?: string): Promise<string> => {
    if (!contract) return '0';
    const targetAddress = userAddress || address;
    if (!targetAddress) return '0';
    
    try {
      const rewards = await contract.getPendingRewards(targetAddress);
      return formatTokenAmount(rewards);
    } catch (error) {
      console.error('Failed to get pending rewards:', error);
      return '0';
    }
  }, [contract, address]);

  const getTotalTipsReceived = useCallback(async (userAddress?: string): Promise<string> => {
    if (!contract) return '0';
    const targetAddress = userAddress || address;
    if (!targetAddress) return '0';
    
    try {
      const tips = await contract.getTotalTipsReceived(targetAddress);
      return formatTokenAmount(tips);
    } catch (error) {
      console.error('Failed to get total tips received:', error);
      return '0';
    }
  }, [contract, address]);

  const getTotalTipsSent = useCallback(async (userAddress?: string): Promise<string> => {
    if (!contract) return '0';
    const targetAddress = userAddress || address;
    if (!targetAddress) return '0';
    
    try {
      const tips = await contract.getTotalTipsSent(targetAddress);
      return formatTokenAmount(tips);
    } catch (error) {
      console.error('Failed to get total tips sent:', error);
      return '0';
    }
  }, [contract, address]);

  return { tipCreator, claimRewards, getPendingRewards, getTotalTipsReceived, getTotalTipsSent };
}

export function useGamificationContract() {
  const { address, isCorrectNetwork } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.GAMIFICATION, GAMIFICATION_ABI, provider);
  }, []);

  const getLevel = useCallback(async (userAddress?: string): Promise<number> => {
    if (!contract) return 1;
    const targetAddress = userAddress || address;
    if (!targetAddress) return 1;
    
    try {
      const level = await contract.getLevel(targetAddress);
      return Number(level);
    } catch (error) {
      console.error('Failed to get level:', error);
      return 1;
    }
  }, [contract, address]);

  const getXP = useCallback(async (userAddress?: string): Promise<number> => {
    if (!contract) return 0;
    const targetAddress = userAddress || address;
    if (!targetAddress) return 0;
    
    try {
      const xp = await contract.getXP(targetAddress);
      return Number(xp);
    } catch (error) {
      console.error('Failed to get XP:', error);
      return 0;
    }
  }, [contract, address]);

  const getCurrentStreak = useCallback(async (userAddress?: string): Promise<number> => {
    if (!contract) return 0;
    const targetAddress = userAddress || address;
    if (!targetAddress) return 0;
    
    try {
      const streak = await contract.getCurrentStreak(targetAddress);
      return Number(streak);
    } catch (error) {
      console.error('Failed to get current streak:', error);
      return 0;
    }
  }, [contract, address]);

  const getLongestStreak = useCallback(async (userAddress?: string): Promise<number> => {
    if (!contract) return 0;
    const targetAddress = userAddress || address;
    if (!targetAddress) return 0;
    
    try {
      const streak = await contract.getLongestStreak(targetAddress);
      return Number(streak);
    } catch (error) {
      console.error('Failed to get longest streak:', error);
      return 0;
    }
  }, [contract, address]);

  const checkInDaily = useCallback(async (): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.GAMIFICATION, GAMIFICATION_ABI, signer);
      const tx = await contractWithSigner.checkInDaily();
      return tx.hash;
    } catch (error) {
      console.error('Daily check-in failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const getRewardPoints = useCallback(async (userAddress?: string): Promise<number> => {
    if (!contract) return 0;
    const targetAddress = userAddress || address;
    if (!targetAddress) return 0;
    
    try {
      const points = await contract.getRewardPoints(targetAddress);
      return Number(points);
    } catch (error) {
      console.error('Failed to get reward points:', error);
      return 0;
    }
  }, [contract, address]);

  const convertPointsToTokens = useCallback(async (points: number): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.GAMIFICATION, GAMIFICATION_ABI, signer);
      const tx = await contractWithSigner.convertPointsToTokens(BigInt(points));
      return tx.hash;
    } catch (error) {
      console.error('Convert points failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  return { getLevel, getXP, getCurrentStreak, getLongestStreak, checkInDaily, getRewardPoints, convertPointsToTokens };
}

export function useMarketplaceContract() {
  const { address, isCorrectNetwork } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.MARKETS_RWA, MARKETS_RWA_ABI, provider);
  }, []);

  const createListing = useCallback(async (tokenAddress: string, tokenId: number, priceInWei: bigint): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.MARKETS_RWA, MARKETS_RWA_ABI, signer);
      const tx = await contractWithSigner.createListing(tokenAddress, BigInt(tokenId), priceInWei);
      return tx.hash;
    } catch (error) {
      console.error('Create listing failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const buyListing = useCallback(async (listingId: number, priceInWei: bigint): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.MARKETS_RWA, MARKETS_RWA_ABI, signer);
      const tx = await contractWithSigner.buyListing(BigInt(listingId), { value: priceInWei });
      return tx.hash;
    } catch (error) {
      console.error('Buy listing failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const cancelListing = useCallback(async (listingId: number): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.MARKETS_RWA, MARKETS_RWA_ABI, signer);
      const tx = await contractWithSigner.cancelListing(listingId);
      return tx.hash;
    } catch (error) {
      console.error('Cancel listing failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const getListing = useCallback(async (listingId: number): Promise<any | null> => {
    if (!contract) return null;
    
    try {
      const listing = await contract.getListing(listingId);
      return listing;
    } catch (error) {
      console.error('Failed to get listing:', error);
      return null;
    }
  }, [contract]);

  const getActiveListings = useCallback(async (): Promise<number[]> => {
    if (!contract) return [];
    
    try {
      const listings = await contract.getActiveListings();
      return listings.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Failed to get active listings:', error);
      return [];
    }
  }, [contract]);

  const getListingsBySeller = useCallback(async (seller?: string): Promise<number[]> => {
    if (!contract) return [];
    const sellerAddress = seller || address;
    if (!sellerAddress) return [];
    
    try {
      const listings = await contract.getListingsBySeller(sellerAddress);
      return listings.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Failed to get listings by seller:', error);
      return [];
    }
  }, [contract, address]);

  return { createListing, buyListing, cancelListing, getListing, getActiveListings, getListingsBySeller };
}

export function useReputationContract() {
  const { address } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.REPUTATION_ORACLE, REPUTATION_ORACLE_ABI, provider);
  }, []);

  const getReputationScore = useCallback(async (userAddress?: string): Promise<number> => {
    if (!contract) return 0;
    const targetAddress = userAddress || address;
    if (!targetAddress) return 0;
    
    try {
      const score = await contract.getReputationScore(targetAddress);
      return Number(score);
    } catch (error) {
      console.error('Failed to get reputation score:', error);
      return 0;
    }
  }, [contract, address]);

  const getBadges = useCallback(async (userAddress?: string): Promise<number[]> => {
    if (!contract) return [];
    const targetAddress = userAddress || address;
    if (!targetAddress) return [];
    
    try {
      const badges = await contract.getBadges(targetAddress);
      return badges.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Failed to get badges:', error);
      return [];
    }
  }, [contract, address]);

  const hasBadge = useCallback(async (badgeId: number, userAddress?: string): Promise<boolean> => {
    if (!contract) return false;
    const targetAddress = userAddress || address;
    if (!targetAddress) return false;
    
    try {
      return await contract.hasBadge(targetAddress, badgeId);
    } catch (error) {
      console.error('Failed to check badge:', error);
      return false;
    }
  }, [contract, address]);

  const getTier = useCallback(async (userAddress?: string): Promise<number> => {
    if (!contract) return 0;
    const targetAddress = userAddress || address;
    if (!targetAddress) return 0;
    
    try {
      const tier = await contract.getTier(targetAddress);
      return Number(tier);
    } catch (error) {
      console.error('Failed to get tier:', error);
      return 0;
    }
  }, [contract, address]);

  const getBadgeInfo = useCallback(async (badgeId: number): Promise<any | null> => {
    if (!contract) return null;
    
    try {
      const info = await contract.getBadgeInfo(badgeId);
      return info;
    } catch (error) {
      console.error('Failed to get badge info:', error);
      return null;
    }
  }, [contract]);

  return { getReputationScore, getBadges, hasBadge, getTier, getBadgeInfo };
}

export function useTreasuryContract() {
  const tokenContract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.AXM_TOKEN, AXM_TOKEN_ABI, provider);
  }, []);

  const getTreasuryBalance = useCallback(async (): Promise<string> => {
    if (!tokenContract) return '0';
    
    try {
      const balance = await tokenContract.balanceOf(TREASURY_CONFIG.TREASURY_VAULT_ADDRESS);
      return formatTokenAmount(balance);
    } catch (error) {
      console.error('Failed to get treasury balance:', error);
      return '0';
    }
  }, [tokenContract]);

  const getRewardsPoolBalance = useCallback(async (): Promise<string> => {
    if (!tokenContract) return '0';
    
    try {
      const balance = await tokenContract.balanceOf(TREASURY_CONFIG.REWARDS_POOL_ADDRESS);
      return formatTokenAmount(balance);
    } catch (error) {
      console.error('Failed to get rewards pool balance:', error);
      return '0';
    }
  }, [tokenContract]);

  const getTotalSupply = useCallback(async (): Promise<string> => {
    if (!tokenContract) return '0';
    
    try {
      const supply = await tokenContract.totalSupply();
      return formatTokenAmount(supply);
    } catch (error) {
      console.error('Failed to get total supply:', error);
      return '0';
    }
  }, [tokenContract]);

  const getMaxSupply = useCallback(async (): Promise<string> => {
    if (!tokenContract) return '0';
    
    try {
      const maxSupply = await tokenContract.MAX_SUPPLY();
      return formatTokenAmount(maxSupply);
    } catch (error) {
      console.error('Failed to get max supply:', error);
      return '0';
    }
  }, [tokenContract]);

  const getCirculatingSupply = useCallback(async (): Promise<string> => {
    if (!tokenContract) return '0';
    
    try {
      const totalSupply = await tokenContract.totalSupply();
      const treasuryBalance = await tokenContract.balanceOf(TREASURY_CONFIG.TREASURY_VAULT_ADDRESS);
      const circulating = BigInt(totalSupply) - BigInt(treasuryBalance);
      return formatTokenAmount(circulating);
    } catch (error) {
      console.error('Failed to get circulating supply:', error);
      return '0';
    }
  }, [tokenContract]);

  return { 
    getTreasuryBalance, 
    getRewardsPoolBalance, 
    getTotalSupply, 
    getMaxSupply,
    getCirculatingSupply,
    treasuryAddress: TREASURY_CONFIG.TREASURY_VAULT_ADDRESS,
    rewardsPoolAddress: TREASURY_CONFIG.REWARDS_POOL_ADDRESS,
    rewardsPoolAllocation: TREASURY_CONFIG.REWARDS_POOL_ALLOCATION
  };
}

export interface PriceData {
  price: number;
  change24h: number;
  marketCap?: number;
  source: string;
  message?: string;
}

export function usePriceOracle() {
  const getAXMPrice = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/api/price/axm');
      if (!response.ok) {
        return 0.001;
      }
      const data: PriceData = await response.json();
      return typeof data.price === 'number' ? data.price : 0.001;
    } catch (error) {
      console.error('Failed to fetch AXM price:', error);
      return 0.001;
    }
  }, []);

  const getAXMPriceData = useCallback(async (): Promise<PriceData> => {
    try {
      const response = await fetch('/api/price/axm');
      if (!response.ok) {
        return { price: 0.001, change24h: 0, source: 'fallback' };
      }
      const data: PriceData = await response.json();
      return {
        price: typeof data.price === 'number' ? data.price : 0.001,
        change24h: typeof data.change24h === 'number' ? data.change24h : 0,
        marketCap: data.marketCap,
        source: data.source || 'fallback',
        message: data.message
      };
    } catch (error) {
      console.error('Failed to fetch AXM price data:', error);
      return { price: 0.001, change24h: 0, source: 'fallback' };
    }
  }, []);

  const getETHPrice = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/api/price/eth');
      if (!response.ok) {
        return 2000;
      }
      const data = await response.json();
      return typeof data.price === 'number' ? data.price : 2000;
    } catch (error) {
      console.error('Failed to fetch ETH price:', error);
      return 2000;
    }
  }, []);

  const convertToUSD = useCallback((amount: string | number, pricePerToken: number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(numAmount)) return '$0.00';
    const usdValue = numAmount * pricePerToken;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdValue);
  }, []);

  const formatLargeUSD = useCallback((amount: string | number, pricePerToken: number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(numAmount)) return '$0';
    const usdValue = numAmount * pricePerToken;
    
    if (usdValue >= 1e9) {
      return `$${(usdValue / 1e9).toFixed(2)}B`;
    } else if (usdValue >= 1e6) {
      return `$${(usdValue / 1e6).toFixed(2)}M`;
    } else if (usdValue >= 1e3) {
      return `$${(usdValue / 1e3).toFixed(2)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdValue);
  }, []);

  return { getAXMPrice, getAXMPriceData, getETHPrice, convertToUSD, formatLargeUSD };
}

export const INTEGRATED_CONTRACTS = {
  token: CONTRACT_ADDRESSES.AXM_TOKEN,
  staking: CONTRACT_ADDRESSES.STAKING_EMISSIONS,
  social: CONTRACT_ADDRESSES.COMMUNITY_SOCIAL,
  gamification: CONTRACT_ADDRESSES.GAMIFICATION,
  marketplace: CONTRACT_ADDRESSES.MARKETS_RWA,
  reputation: CONTRACT_ADDRESSES.REPUTATION_ORACLE,
  treasury: CONTRACT_ADDRESSES.TREASURY_VAULT,
  academy: CONTRACT_ADDRESSES.ACADEMY_HUB,
  exchange: CONTRACT_ADDRESSES.EXCHANGE_HUB,
  depinNodes: CONTRACT_ADDRESSES.DEPIN_NODE_SALES,
};

export const CONTRACT_COUNT = Object.keys(INTEGRATED_CONTRACTS).length;

export interface CourseInfo {
  courseId: number;
  title: string;
  description: string;
  imageURI: string;
  instructor: string;
  level: number;
  status: number;
  moduleCount: number;
  totalLessons: number;
  enrollmentCount: number;
  completionCount: number;
  requiresVerification: boolean;
  createdAt: number;
}

export interface Enrollment {
  student: string;
  courseId: number;
  enrolledAt: number;
  lastAccessedAt: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt: number;
}

export interface Certification {
  certificationId: number;
  recipient: string;
  courseId: number;
  certificationType: number;
  credentialURI: string;
  certifier: string;
  issuedAt: number;
  isRevoked: boolean;
}

export function useAcademyContract() {
  const { address, isCorrectNetwork } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.ACADEMY_HUB, ACADEMY_HUB_ABI, provider);
  }, []);

  const getTotalCourses = useCallback(async (): Promise<number> => {
    if (!contract) return 0;
    try {
      const total = await contract.totalCourses();
      return Number(total);
    } catch (error) {
      console.error('Failed to get total courses:', error);
      return 0;
    }
  }, [contract]);

  const getTotalEnrollments = useCallback(async (): Promise<number> => {
    if (!contract) return 0;
    try {
      const total = await contract.totalEnrollments();
      return Number(total);
    } catch (error) {
      console.error('Failed to get total enrollments:', error);
      return 0;
    }
  }, [contract]);

  const getTotalCertifications = useCallback(async (): Promise<number> => {
    if (!contract) return 0;
    try {
      const total = await contract.totalCertifications();
      return Number(total);
    } catch (error) {
      console.error('Failed to get total certifications:', error);
      return 0;
    }
  }, [contract]);

  const isInstructor = useCallback(async (userAddress?: string): Promise<boolean> => {
    if (!contract) return false;
    const targetAddress = userAddress || address;
    if (!targetAddress) return false;
    try {
      return await contract.isInstructor(targetAddress);
    } catch (error) {
      console.error('Failed to check instructor status:', error);
      return false;
    }
  }, [contract, address]);

  const getCourse = useCallback(async (courseId: number): Promise<CourseInfo | null> => {
    if (!contract) return null;
    try {
      const course = await contract.getCourse(courseId);
      return {
        courseId: Number(course.courseId),
        title: course.title,
        description: course.description,
        imageURI: course.imageURI,
        instructor: course.instructor,
        level: Number(course.level),
        status: Number(course.status),
        moduleCount: Number(course.moduleCount),
        totalLessons: Number(course.totalLessons),
        enrollmentCount: Number(course.enrollmentCount),
        completionCount: Number(course.completionCount),
        requiresVerification: course.requiresVerification,
        createdAt: Number(course.createdAt),
      };
    } catch (error) {
      console.error('Failed to get course:', error);
      return null;
    }
  }, [contract]);

  const getEnrollment = useCallback(async (courseId: number, studentAddress?: string): Promise<Enrollment | null> => {
    if (!contract) return null;
    const targetAddress = studentAddress || address;
    if (!targetAddress) return null;
    try {
      const enrollment = await contract.getEnrollment(targetAddress, courseId);
      return {
        student: enrollment.student,
        courseId: Number(enrollment.courseId),
        enrolledAt: Number(enrollment.enrolledAt),
        lastAccessedAt: Number(enrollment.lastAccessedAt),
        progressPercentage: Number(enrollment.progressPercentage),
        isCompleted: enrollment.isCompleted,
        completedAt: Number(enrollment.completedAt),
      };
    } catch (error) {
      console.error('Failed to get enrollment:', error);
      return null;
    }
  }, [contract, address]);

  const getStudentCourses = useCallback(async (studentAddress?: string): Promise<number[]> => {
    if (!contract) return [];
    const targetAddress = studentAddress || address;
    if (!targetAddress) return [];
    try {
      const courses = await contract.getStudentCourses(targetAddress);
      return courses.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Failed to get student courses:', error);
      return [];
    }
  }, [contract, address]);

  const getStudentCertifications = useCallback(async (studentAddress?: string): Promise<number[]> => {
    if (!contract) return [];
    const targetAddress = studentAddress || address;
    if (!targetAddress) return [];
    try {
      const certs = await contract.getStudentCertifications(targetAddress);
      return certs.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Failed to get student certifications:', error);
      return [];
    }
  }, [contract, address]);

  const getCertification = useCallback(async (certId: number): Promise<Certification | null> => {
    if (!contract) return null;
    try {
      const cert = await contract.getCertification(certId);
      return {
        certificationId: Number(cert.certificationId),
        recipient: cert.recipient,
        courseId: Number(cert.courseId),
        certificationType: Number(cert.certificationType),
        credentialURI: cert.credentialURI,
        certifier: cert.certifier,
        issuedAt: Number(cert.issuedAt),
        isRevoked: cert.isRevoked,
      };
    } catch (error) {
      console.error('Failed to get certification:', error);
      return null;
    }
  }, [contract]);

  const enrollInCourse = useCallback(async (courseId: number): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.ACADEMY_HUB, ACADEMY_HUB_ABI, signer);
      const tx = await contractWithSigner.enrollInCourse(courseId);
      return tx.hash;
    } catch (error) {
      console.error('Enrollment failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const completeLesson = useCallback(async (lessonId: number): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.ACADEMY_HUB, ACADEMY_HUB_ABI, signer);
      const tx = await contractWithSigner.completeLesson(lessonId);
      return tx.hash;
    } catch (error) {
      console.error('Complete lesson failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const registerInstructor = useCallback(async (name: string, bio: string, imageURI: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    try {
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESSES.ACADEMY_HUB, ACADEMY_HUB_ABI, signer);
      const tx = await contractWithSigner.registerInstructor(name, bio, imageURI);
      return tx.hash;
    } catch (error) {
      console.error('Register instructor failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  return {
    getTotalCourses,
    getTotalEnrollments,
    getTotalCertifications,
    isInstructor,
    getCourse,
    getEnrollment,
    getStudentCourses,
    getStudentCertifications,
    getCertification,
    enrollInCourse,
    completeLesson,
    registerInstructor,
  };
}

export interface PoolInfo {
  poolId: number;
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
  totalLiquidity: string;
  lockedLiquidity: string;
  isActive: boolean;
  createdAt: number;
  totalVolume: string;
  totalFees: string;
}

export function useExchangeContract() {
  const { address, isCorrectNetwork } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.EXCHANGE_HUB, EXCHANGE_HUB_ABI, provider);
  }, []);

  const getTotalPools = useCallback(async (): Promise<number> => {
    if (!contract) return 0;
    try {
      const total = await contract.totalPools();
      return Number(total);
    } catch (error) {
      console.error('Failed to get total pools:', error);
      return 0;
    }
  }, [contract]);

  const getTotalSwaps = useCallback(async (): Promise<number> => {
    if (!contract) return 0;
    try {
      const total = await contract.totalSwaps();
      return Number(total);
    } catch (error) {
      console.error('Failed to get total swaps:', error);
      return 0;
    }
  }, [contract]);

  const getSwapFee = useCallback(async (): Promise<number> => {
    if (!contract) return 30;
    try {
      const fee = await contract.swapFee();
      return Number(fee);
    } catch (error) {
      console.error('Failed to get swap fee:', error);
      return 30;
    }
  }, [contract]);

  const getPool = useCallback(async (poolId: number): Promise<PoolInfo | null> => {
    if (!contract) return null;
    try {
      const pool = await contract.pools(poolId);
      return {
        poolId: Number(pool.poolId),
        tokenA: pool.tokenA,
        tokenB: pool.tokenB,
        reserveA: formatTokenAmount(pool.reserveA),
        reserveB: formatTokenAmount(pool.reserveB),
        totalLiquidity: formatTokenAmount(pool.totalLiquidity),
        lockedLiquidity: formatTokenAmount(pool.lockedLiquidity),
        isActive: pool.isActive,
        createdAt: Number(pool.createdAt),
        totalVolume: formatTokenAmount(pool.totalVolume),
        totalFees: formatTokenAmount(pool.totalFees),
      };
    } catch (error) {
      console.error('Failed to get pool:', error);
      return null;
    }
  }, [contract]);

  const getPoolByPair = useCallback(async (tokenA: string, tokenB: string): Promise<number> => {
    if (!contract) return 0;
    try {
      const poolId = await contract.pairToPoolId(tokenA, tokenB);
      return Number(poolId);
    } catch (error) {
      console.error('Failed to get pool by pair:', error);
      return 0;
    }
  }, [contract]);

  const getLiquidityBalance = useCallback(async (poolId: number, provider?: string): Promise<string> => {
    if (!contract) return '0';
    const targetAddress = provider || address;
    if (!targetAddress) return '0';
    try {
      const balance = await contract.liquidityBalances(poolId, targetAddress);
      return formatTokenAmount(balance);
    } catch (error) {
      console.error('Failed to get liquidity balance:', error);
      return '0';
    }
  }, [contract, address]);

  const getAmountOut = useCallback(async (poolId: number, tokenIn: string, amountIn: string): Promise<string> => {
    if (!contract) return '0';
    try {
      const amountInWei = parseTokenAmount(amountIn);
      const amountOut = await contract.getAmountOut(poolId, tokenIn, amountInWei);
      return formatTokenAmount(amountOut);
    } catch (error) {
      console.error('Failed to get amount out:', error);
      return '0';
    }
  }, [contract]);

  const getUserPools = useCallback(async (userAddress?: string): Promise<number[]> => {
    if (!contract) return [];
    const targetAddress = userAddress || address;
    if (!targetAddress) return [];
    try {
      const pools = await contract.userPools(targetAddress);
      return pools.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Failed to get user pools:', error);
      return [];
    }
  }, [contract, address]);

  const swap = useCallback(async (poolId: number, tokenIn: string, amountIn: string, minAmountOut: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    try {
      const tokenContract = new ethers.Contract(tokenIn, AXM_TOKEN_ABI, signer);
      const exchangeContract = new ethers.Contract(CONTRACT_ADDRESSES.EXCHANGE_HUB, EXCHANGE_HUB_ABI, signer);
      
      const amountInWei = parseTokenAmount(amountIn);
      const minAmountOutWei = parseTokenAmount(minAmountOut);
      
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.EXCHANGE_HUB, amountInWei);
      await approveTx.wait();
      
      const swapTx = await exchangeContract.swap(poolId, tokenIn, amountInWei, minAmountOutWei);
      return swapTx.hash;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const addLiquidity = useCallback(async (poolId: number, amountA: string, amountB: string, minLiquidity: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    try {
      const exchangeContract = new ethers.Contract(CONTRACT_ADDRESSES.EXCHANGE_HUB, EXCHANGE_HUB_ABI, signer);
      const amountAWei = parseTokenAmount(amountA);
      const amountBWei = parseTokenAmount(amountB);
      const minLiquidityWei = parseTokenAmount(minLiquidity);
      
      const tx = await exchangeContract.addLiquidity(poolId, amountAWei, amountBWei, minLiquidityWei);
      return tx.hash;
    } catch (error) {
      console.error('Add liquidity failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const removeLiquidity = useCallback(async (poolId: number, liquidity: string, minAmountA: string, minAmountB: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    try {
      const exchangeContract = new ethers.Contract(CONTRACT_ADDRESSES.EXCHANGE_HUB, EXCHANGE_HUB_ABI, signer);
      const liquidityWei = parseTokenAmount(liquidity);
      const minAmountAWei = parseTokenAmount(minAmountA);
      const minAmountBWei = parseTokenAmount(minAmountB);
      
      const tx = await exchangeContract.removeLiquidity(poolId, liquidityWei, minAmountAWei, minAmountBWei);
      return tx.hash;
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  return {
    getTotalPools,
    getTotalSwaps,
    getSwapFee,
    getPool,
    getPoolByPair,
    getLiquidityBalance,
    getAmountOut,
    getUserPools,
    swap,
    addLiquidity,
    removeLiquidity,
  };
}

export interface NodeTier {
  tier: number;
  name: string;
  priceEth: string;
  category: number;
  active: boolean;
}

export interface NodePurchase {
  buyer: string;
  tierId: number;
  category: number;
  paymentType: number;
  ethPaid: string;
  axmPaid: string;
  timestamp: number;
  metadata: string;
}

export function useDePINContract() {
  const { address, isCorrectNetwork } = useWallet();

  const contract = useMemo(() => {
    const provider = getProvider();
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.DEPIN_NODE_SALES, DEPIN_NODE_SALES_ABI, provider);
  }, []);

  const getTotalNodesSold = useCallback(async (): Promise<number> => {
    if (!contract) return 0;
    try {
      const total = await contract.totalNodesSold();
      return Number(total);
    } catch (error) {
      console.error('Failed to get total nodes sold:', error);
      return 0;
    }
  }, [contract]);

  const getTotalEthCollected = useCallback(async (): Promise<string> => {
    if (!contract) return '0';
    try {
      const total = await contract.totalEthCollected();
      return formatTokenAmount(total);
    } catch (error) {
      console.error('Failed to get total ETH collected:', error);
      return '0';
    }
  }, [contract]);

  const getTotalAxmCollected = useCallback(async (): Promise<string> => {
    if (!contract) return '0';
    try {
      const total = await contract.totalAxmCollected();
      return formatTokenAmount(total);
    } catch (error) {
      console.error('Failed to get total AXM collected:', error);
      return '0';
    }
  }, [contract]);

  const getAxmDiscount = useCallback(async (): Promise<number> => {
    if (!contract) return 1500;
    try {
      const discount = await contract.axmDiscountBps();
      return Number(discount);
    } catch (error) {
      console.error('Failed to get AXM discount:', error);
      return 1500;
    }
  }, [contract]);

  const getAllTiers = useCallback(async (): Promise<NodeTier[]> => {
    if (!contract) return [];
    try {
      const tiers = await contract.getAllTiers();
      return tiers.map((tier: any) => ({
        tier: Number(tier.tier),
        name: tier.name,
        priceEth: formatTokenAmount(tier.priceEth),
        category: Number(tier.category),
        active: tier.active,
      }));
    } catch (error) {
      console.error('Failed to get all tiers:', error);
      return [];
    }
  }, [contract]);

  const getEthPrice = useCallback(async (tierId: number): Promise<string> => {
    if (!contract) return '0';
    try {
      const price = await contract.getEthPrice(tierId);
      return formatTokenAmount(price);
    } catch (error) {
      console.error('Failed to get ETH price:', error);
      return '0';
    }
  }, [contract]);

  const getAxmPrice = useCallback(async (tierId: number): Promise<string> => {
    if (!contract) return '0';
    try {
      const price = await contract.getAxmPrice(tierId);
      return formatTokenAmount(price);
    } catch (error) {
      console.error('Failed to get AXM price:', error);
      return '0';
    }
  }, [contract]);

  const getUserPurchases = useCallback(async (userAddress?: string): Promise<NodePurchase[]> => {
    if (!contract) return [];
    const targetAddress = userAddress || address;
    if (!targetAddress) return [];
    try {
      const purchases = await contract.getUserPurchases(targetAddress);
      return purchases.map((p: any) => ({
        buyer: p.buyer,
        tierId: Number(p.tierId),
        category: Number(p.category),
        paymentType: Number(p.paymentType),
        ethPaid: formatTokenAmount(p.ethPaid),
        axmPaid: formatTokenAmount(p.axmPaid),
        timestamp: Number(p.timestamp),
        metadata: p.metadata,
      }));
    } catch (error) {
      console.error('Failed to get user purchases:', error);
      return [];
    }
  }, [contract, address]);

  const purchaseNodeWithETH = useCallback(async (tierId: number, category: number, metadata: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    try {
      const depinContract = new ethers.Contract(CONTRACT_ADDRESSES.DEPIN_NODE_SALES, DEPIN_NODE_SALES_ABI, signer);
      const price = await depinContract.getEthPrice(tierId);
      const tx = await depinContract.purchaseNodeWithETH(tierId, category, metadata, { value: price });
      return tx.hash;
    } catch (error) {
      console.error('Purchase with ETH failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  const purchaseNodeWithAXM = useCallback(async (tierId: number, category: number, metadata: string): Promise<string | null> => {
    if (!isCorrectNetwork) {
      throw new Error('Please switch to Arbitrum One network');
    }
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Please connect your wallet');
    }
    try {
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.AXM_TOKEN, AXM_TOKEN_ABI, signer);
      const depinContract = new ethers.Contract(CONTRACT_ADDRESSES.DEPIN_NODE_SALES, DEPIN_NODE_SALES_ABI, signer);
      
      const price = await depinContract.getAxmPrice(tierId);
      
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.DEPIN_NODE_SALES, price);
      await approveTx.wait();
      
      const tx = await depinContract.purchaseNodeWithAXM(tierId, category, metadata);
      return tx.hash;
    } catch (error) {
      console.error('Purchase with AXM failed:', error);
      throw error;
    }
  }, [isCorrectNetwork]);

  return {
    getTotalNodesSold,
    getTotalEthCollected,
    getTotalAxmCollected,
    getAxmDiscount,
    getAllTiers,
    getEthPrice,
    getAxmPrice,
    getUserPurchases,
    purchaseNodeWithETH,
    purchaseNodeWithAXM,
  };
}
