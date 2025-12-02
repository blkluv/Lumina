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

export function usePriceOracle() {
  const getAXMPrice = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/api/price/axm');
      if (!response.ok) {
        return 0.001;
      }
      const data = await response.json();
      return data.price || 0.001;
    } catch (error) {
      console.error('Failed to fetch AXM price:', error);
      return 0.001;
    }
  }, []);

  const getETHPrice = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      if (!response.ok) {
        return 2000;
      }
      const data = await response.json();
      return data.ethereum?.usd || 2000;
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

  return { getAXMPrice, getETHPrice, convertToUSD, formatLargeUSD };
}

export const INTEGRATED_CONTRACTS = {
  token: CONTRACT_ADDRESSES.AXM_TOKEN,
  staking: CONTRACT_ADDRESSES.STAKING_EMISSIONS,
  social: CONTRACT_ADDRESSES.COMMUNITY_SOCIAL,
  gamification: CONTRACT_ADDRESSES.GAMIFICATION,
  marketplace: CONTRACT_ADDRESSES.MARKETS_RWA,
  reputation: CONTRACT_ADDRESSES.REPUTATION_ORACLE,
  treasury: CONTRACT_ADDRESSES.TREASURY_VAULT,
};

export const CONTRACT_COUNT = Object.keys(INTEGRATED_CONTRACTS).length;
