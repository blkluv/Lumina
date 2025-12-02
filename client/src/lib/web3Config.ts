import { CONTRACT_ADDRESSES, NETWORK_CONFIG, AXM_TOKEN_ABI as FULL_AXM_ABI } from './contracts';

export const ARBITRUM_CHAIN_ID = NETWORK_CONFIG.chainId;

export const ARBITRUM_CONFIG = {
  chainId: ARBITRUM_CHAIN_ID,
  chainName: NETWORK_CONFIG.chainName,
  nativeCurrency: NETWORK_CONFIG.nativeCurrency,
  rpcUrls: [NETWORK_CONFIG.rpcUrl],
  blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
};

export const AXM_TOKEN_ADDRESS = CONTRACT_ADDRESSES.AXM_TOKEN;

export const AXM_TOKEN_ABI = FULL_AXM_ABI;

export function formatAxmBalance(balance: string | bigint): string {
  const value = typeof balance === "string" ? BigInt(balance) : balance;
  const decimals = 18;
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0").slice(0, 2);
  return `${integerPart.toLocaleString()}.${fractionalStr}`;
}

export function parseAxmAmount(amount: string): bigint {
  const [integer, decimal = ""] = amount.split(".");
  const paddedDecimal = decimal.padEnd(18, "0").slice(0, 18);
  return BigInt(integer + paddedDecimal);
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function switchToArbitrum(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) return false;
  
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}` }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}`,
              chainName: ARBITRUM_CONFIG.chainName,
              nativeCurrency: ARBITRUM_CONFIG.nativeCurrency,
              rpcUrls: ARBITRUM_CONFIG.rpcUrls,
              blockExplorerUrls: ARBITRUM_CONFIG.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
