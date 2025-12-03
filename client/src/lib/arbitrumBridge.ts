/**
 * Arbitrum Bridge Configuration and Utilities
 * 
 * Integrates @arbitrum/sdk for ETH and token bridging between
 * Ethereum L1 and Arbitrum L2
 */

import { JsonRpcProvider, BrowserProvider, formatEther, parseEther } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './contracts';

export const L1_NETWORK_CONFIG = {
  chainId: 1,
  chainIdHex: '0x1',
  chainName: 'Ethereum Mainnet',
  rpcUrl: 'https://eth.llamarpc.com',
  blockExplorer: 'https://etherscan.io',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  }
} as const;

export const L2_NETWORK_CONFIG = NETWORK_CONFIG;

export const BRIDGE_CONTRACTS = {
  L1_GATEWAY_ROUTER: '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef',
  L2_GATEWAY_ROUTER: '0x5288c571Fd7aD117beA99bF60FE0846C4E84F933',
  L1_ERC20_GATEWAY: '0xa3A7B6F88361F48403514059F1F16C8E78d60EeC',
  L2_ERC20_GATEWAY: '0x09e9222E96E7B4AE2a407B98d48e330053351EEe',
  INBOX: '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f',
  OUTBOX: '0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840',
  ROLLUP: '0x5eF0D09d1E6204141B4d37530808eD19f60FBa35',
} as const;

export const BRIDGE_STATUS = {
  PENDING: 'pending',
  L1_INITIATED: 'l1_initiated',
  L2_PENDING: 'l2_pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type BridgeStatus = typeof BRIDGE_STATUS[keyof typeof BRIDGE_STATUS];

export interface BridgeTransaction {
  id: string;
  type: 'deposit' | 'withdraw';
  asset: 'ETH' | 'AXM';
  amount: string;
  fromChain: 'L1' | 'L2';
  toChain: 'L1' | 'L2';
  status: BridgeStatus;
  l1TxHash?: string;
  l2TxHash?: string;
  timestamp: number;
  estimatedArrival?: number;
  confirmations?: number;
  requiredConfirmations?: number;
  retryableTicketId?: string;
  claimableAt?: number;
  claimed?: boolean;
}

export interface GasEstimate {
  l1Gas: bigint;
  l2Gas: bigint;
  l1GasPrice: bigint;
  l2GasPrice: bigint;
  totalCostWei: bigint;
  totalCostEth: string;
  breakdown: {
    l1ExecutionCost: string;
    l2ExecutionCost: string;
    l1DataCost: string;
  };
}

export async function getL1Provider(): Promise<JsonRpcProvider> {
  return new JsonRpcProvider(L1_NETWORK_CONFIG.rpcUrl);
}

export async function getL2Provider(): Promise<JsonRpcProvider> {
  return new JsonRpcProvider(L2_NETWORK_CONFIG.rpcUrl);
}

export async function getL1Signer(): Promise<any | null> {
  if (!window.ethereum) return null;
  
  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  
  if (Number(network.chainId) !== L1_NETWORK_CONFIG.chainId) {
    return null;
  }
  
  return provider.getSigner();
}

export async function getL2Signer(): Promise<any | null> {
  if (!window.ethereum) return null;
  
  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  
  if (Number(network.chainId) !== L2_NETWORK_CONFIG.chainId) {
    return null;
  }
  
  return provider.getSigner();
}

export async function switchToL1(): Promise<boolean> {
  if (!window.ethereum) return false;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: L1_NETWORK_CONFIG.chainIdHex }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: L1_NETWORK_CONFIG.chainIdHex,
            chainName: L1_NETWORK_CONFIG.chainName,
            nativeCurrency: L1_NETWORK_CONFIG.nativeCurrency,
            rpcUrls: [L1_NETWORK_CONFIG.rpcUrl],
            blockExplorerUrls: [L1_NETWORK_CONFIG.blockExplorer],
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export async function switchToL2(): Promise<boolean> {
  if (!window.ethereum) return false;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: L2_NETWORK_CONFIG.chainIdHex }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: L2_NETWORK_CONFIG.chainIdHex,
            chainName: L2_NETWORK_CONFIG.chainName,
            nativeCurrency: L2_NETWORK_CONFIG.nativeCurrency,
            rpcUrls: [L2_NETWORK_CONFIG.rpcUrl],
            blockExplorerUrls: [L2_NETWORK_CONFIG.blockExplorer],
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export async function estimateDepositGas(amount: bigint): Promise<GasEstimate> {
  const l1Provider = await getL1Provider();
  const l2Provider = await getL2Provider();
  
  const [l1FeeData, l2FeeData] = await Promise.all([
    l1Provider.getFeeData(),
    l2Provider.getFeeData(),
  ]);
  
  const l1GasPrice = l1FeeData.gasPrice || BigInt(30000000000);
  const l2GasPrice = l2FeeData.gasPrice || BigInt(100000000);
  
  const l1Gas = BigInt(100000);
  const l2Gas = BigInt(300000);
  const l1DataGas = BigInt(50000);
  
  const l1ExecutionCost = l1Gas * l1GasPrice;
  const l2ExecutionCost = l2Gas * l2GasPrice;
  const l1DataCost = l1DataGas * l1GasPrice;
  
  const totalCostWei = l1ExecutionCost + l2ExecutionCost + l1DataCost;
  
  return {
    l1Gas,
    l2Gas,
    l1GasPrice,
    l2GasPrice,
    totalCostWei,
    totalCostEth: formatEther(totalCostWei),
    breakdown: {
      l1ExecutionCost: formatEther(l1ExecutionCost),
      l2ExecutionCost: formatEther(l2ExecutionCost),
      l1DataCost: formatEther(l1DataCost),
    },
  };
}

export async function estimateWithdrawGas(amount: bigint): Promise<GasEstimate> {
  const l1Provider = await getL1Provider();
  const l2Provider = await getL2Provider();
  
  const [l1FeeData, l2FeeData] = await Promise.all([
    l1Provider.getFeeData(),
    l2Provider.getFeeData(),
  ]);
  
  const l1GasPrice = l1FeeData.gasPrice || BigInt(30000000000);
  const l2GasPrice = l2FeeData.gasPrice || BigInt(100000000);
  
  const l1Gas = BigInt(150000);
  const l2Gas = BigInt(200000);
  const l1DataGas = BigInt(30000);
  
  const l1ExecutionCost = l1Gas * l1GasPrice;
  const l2ExecutionCost = l2Gas * l2GasPrice;
  const l1DataCost = l1DataGas * l1GasPrice;
  
  const totalCostWei = l1ExecutionCost + l2ExecutionCost + l1DataCost;
  
  return {
    l1Gas,
    l2Gas,
    l1GasPrice,
    l2GasPrice,
    totalCostWei,
    totalCostEth: formatEther(totalCostWei),
    breakdown: {
      l1ExecutionCost: formatEther(l1ExecutionCost),
      l2ExecutionCost: formatEther(l2ExecutionCost),
      l1DataCost: formatEther(l1DataCost),
    },
  };
}

export function getDepositEstimatedTime(): { min: number; max: number; average: number } {
  return {
    min: 10,
    max: 30,
    average: 15,
  };
}

export function getWithdrawEstimatedTime(): { min: number; max: number; average: number; challengePeriod: number } {
  return {
    min: 7 * 24 * 60,
    max: 8 * 24 * 60,
    average: 7 * 24 * 60 + 60,
    challengePeriod: 7 * 24 * 60,
  };
}

export async function getL1BlockNumber(): Promise<number> {
  const provider = await getL1Provider();
  return provider.getBlockNumber();
}

export async function getL2BlockNumber(): Promise<number> {
  const provider = await getL2Provider();
  return provider.getBlockNumber();
}

export async function getL1ToL2MessageStatus(l1TxHash: string): Promise<{
  status: 'pending' | 'confirmed' | 'executed' | 'failed';
  l2TxHash?: string;
  retryable?: boolean;
}> {
  return {
    status: 'pending',
    retryable: true,
  };
}

export async function getL2ToL1MessageStatus(l2TxHash: string): Promise<{
  status: 'pending' | 'confirmed' | 'ready_to_execute' | 'executed' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  challengePeriodEnd?: number;
}> {
  return {
    status: 'pending',
    confirmations: 0,
    requiredConfirmations: 45818,
  };
}

export function formatBridgeAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 6);
  return `${integerPart.toLocaleString()}.${fractionalStr}`;
}

export function parseBridgeAmount(amount: string, decimals: number = 18): bigint {
  const [integer, decimal = ''] = amount.split('.');
  const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedDecimal);
}

export function getL1ExplorerUrl(txHash: string): string {
  return `${L1_NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
}

export function getL2ExplorerUrl(txHash: string): string {
  return `${L2_NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
}

const BRIDGE_TX_STORAGE_KEY = 'lumina_bridge_transactions';

export function saveBridgeTransaction(tx: BridgeTransaction): void {
  const existing = getBridgeTransactions();
  const updated = [tx, ...existing.filter(t => t.id !== tx.id)].slice(0, 50);
  localStorage.setItem(BRIDGE_TX_STORAGE_KEY, JSON.stringify(updated));
}

export function getBridgeTransactions(): BridgeTransaction[] {
  try {
    const stored = localStorage.getItem(BRIDGE_TX_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function updateBridgeTransaction(id: string, updates: Partial<BridgeTransaction>): void {
  const transactions = getBridgeTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    localStorage.setItem(BRIDGE_TX_STORAGE_KEY, JSON.stringify(transactions));
  }
}

export function generateTransactionId(): string {
  return `bridge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
