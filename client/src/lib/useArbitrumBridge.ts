/**
 * useArbitrumBridge Hook
 * 
 * React hook for Arbitrum bridge operations using @arbitrum/sdk including:
 * - ETH deposits (L1 → L2) via EthBridger
 * - ETH withdrawals (L2 → L1) via EthBridger
 * - ERC-20 token deposits/withdrawals via Erc20Bridger
 * - Cross-chain message status tracking
 * - Retryable ticket redemption
 * - Withdrawal claiming after challenge period
 */

import { useState, useCallback, useEffect } from 'react';
import { JsonRpcProvider, BrowserProvider, Contract, parseEther, AbiCoder } from 'ethers';
import { useWallet } from './walletContext';
import {
  L1_NETWORK_CONFIG,
  L2_NETWORK_CONFIG,
  BRIDGE_CONTRACTS,
  BRIDGE_STATUS,
  type BridgeTransaction,
  type BridgeStatus,
  type GasEstimate,
  type MessageStatusResult,
  estimateDepositGas,
  estimateWithdrawGas,
  getDepositEstimatedTime,
  getWithdrawEstimatedTime,
  saveBridgeTransaction,
  getBridgeTransactions,
  updateBridgeTransaction,
  generateTransactionId,
  switchToL1,
  switchToL2,
  formatBridgeAmount,
  parseBridgeAmount,
  getL1ToL2MessageStatus,
  getL2ToL1MessageStatus,
  redeemRetryableTicket,
  claimWithdrawal,
  formatChallengePeriod,
  getChallengePeriodRemaining,
} from './arbitrumBridge';
import { CONTRACT_ADDRESSES } from './contracts';

interface UseBridgeState {
  isLoading: boolean;
  error: string | null;
  currentChain: 'L1' | 'L2' | null;
  l1Balance: string;
  l2Balance: string;
  l1TokenBalance: string;
  l2TokenBalance: string;
  pendingTransactions: BridgeTransaction[];
  gasEstimate: GasEstimate | null;
}

interface UseBridgeActions {
  depositETH: (amount: string) => Promise<string | null>;
  withdrawETH: (amount: string) => Promise<string | null>;
  depositToken: (tokenAddress: string, amount: string) => Promise<string | null>;
  withdrawToken: (tokenAddress: string, amount: string) => Promise<string | null>;
  estimateGas: (type: 'deposit' | 'withdraw', amount: string) => Promise<GasEstimate | null>;
  switchChain: (chain: 'L1' | 'L2') => Promise<boolean>;
  refreshBalances: () => Promise<void>;
  refreshTransactions: () => void;
  getEstimatedTime: (type: 'deposit' | 'withdraw') => { min: number; max: number; average: number };
  checkMessageStatus: (txHash: string, type: 'deposit' | 'withdraw') => Promise<MessageStatusResult | null>;
  redeemFailedDeposit: (l1TxHash: string) => Promise<string | null>;
  claimPendingWithdrawal: (l2TxHash: string) => Promise<string | null>;
  updateTransactionStatuses: () => Promise<void>;
}

export function useArbitrumBridge(): UseBridgeState & UseBridgeActions {
  const { address, chainId, isConnected } = useWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [l1Balance, setL1Balance] = useState('0');
  const [l2Balance, setL2Balance] = useState('0');
  const [l1TokenBalance, setL1TokenBalance] = useState('0');
  const [l2TokenBalance, setL2TokenBalance] = useState('0');
  const [pendingTransactions, setPendingTransactions] = useState<BridgeTransaction[]>([]);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  
  const currentChain: 'L1' | 'L2' | null = chainId === L1_NETWORK_CONFIG.chainId 
    ? 'L1' 
    : chainId === L2_NETWORK_CONFIG.chainId 
      ? 'L2' 
      : null;
  
  const refreshBalances = useCallback(async () => {
    if (!address) return;
    
    try {
      const l1Provider = new JsonRpcProvider(L1_NETWORK_CONFIG.rpcUrl);
      const l2Provider = new JsonRpcProvider(L2_NETWORK_CONFIG.rpcUrl);
      
      const [l1Bal, l2Bal] = await Promise.all([
        l1Provider.getBalance(address),
        l2Provider.getBalance(address),
      ]);
      
      setL1Balance(formatBridgeAmount(l1Bal));
      setL2Balance(formatBridgeAmount(l2Bal));
      
      const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
      
      try {
        const l2TokenContract = new Contract(
          CONTRACT_ADDRESSES.AXM_TOKEN,
          tokenAbi,
          l2Provider
        );
        const l2TokenBal = await l2TokenContract.balanceOf(address);
        setL2TokenBalance(formatBridgeAmount(l2TokenBal));
      } catch {
        setL2TokenBalance('0');
      }
      
    } catch (err) {
      console.error('Failed to refresh balances:', err);
    }
  }, [address]);
  
  const refreshTransactions = useCallback(() => {
    const transactions = getBridgeTransactions();
    const pending = transactions.filter(
      tx => tx.status !== BRIDGE_STATUS.COMPLETED && tx.status !== BRIDGE_STATUS.FAILED
    );
    setPendingTransactions(pending);
  }, []);
  
  useEffect(() => {
    if (address) {
      refreshBalances();
      refreshTransactions();
    }
  }, [address, refreshBalances, refreshTransactions]);
  
  useEffect(() => {
    if (address) {
      const interval = setInterval(refreshBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [address, refreshBalances]);
  
  const checkMessageStatus = useCallback(async (
    txHash: string,
    type: 'deposit' | 'withdraw'
  ): Promise<MessageStatusResult | null> => {
    try {
      if (type === 'deposit') {
        return await getL1ToL2MessageStatus(txHash);
      } else {
        return await getL2ToL1MessageStatus(txHash);
      }
    } catch (err) {
      console.error('Failed to check message status:', err);
      return null;
    }
  }, []);
  
  const updateTransactionStatuses = useCallback(async () => {
    const { 
      ParentToChildMessageStatus, 
      ChildToParentMessageStatus,
      ParentTransactionReceipt,
      ChildTransactionReceipt,
    } = await import('@arbitrum/sdk');
    
    const l1Provider = new JsonRpcProvider(L1_NETWORK_CONFIG.rpcUrl);
    const l2Provider = new JsonRpcProvider(L2_NETWORK_CONFIG.rpcUrl);
    
    const transactions = getBridgeTransactions();
    const pendingTxs = transactions.filter(
      tx => tx.status !== BRIDGE_STATUS.COMPLETED && tx.status !== BRIDGE_STATUS.FAILED
    );
    
    for (const tx of pendingTxs) {
      try {
        if (tx.type === 'deposit' && tx.l1TxHash) {
          const receipt = await l1Provider.getTransactionReceipt(tx.l1TxHash);
          if (!receipt) continue;
          
          const parentReceipt = new ParentTransactionReceipt(receipt);
          const messages = await parentReceipt.getParentToChildMessages(l2Provider);
          
          if (messages.length === 0) continue;
          
          const message = messages[0];
          const statusResult = await message.waitForStatus();
          let newStatus: BridgeStatus = tx.status;
          
          const updates: Partial<BridgeTransaction> = { messageIndex: 0 };
          
          if (statusResult.status === ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD) {
            newStatus = BRIDGE_STATUS.RETRYABLE_CREATED;
          } else if (statusResult.status === ParentToChildMessageStatus.REDEEMED) {
            newStatus = BRIDGE_STATUS.COMPLETED;
            if ('childTxReceipt' in statusResult && statusResult.childTxReceipt) {
              updates.l2TxHash = statusResult.childTxReceipt.hash;
            }
          } else if (statusResult.status === ParentToChildMessageStatus.CREATION_FAILED) {
            newStatus = BRIDGE_STATUS.FAILED;
          } else if (statusResult.status === ParentToChildMessageStatus.EXPIRED) {
            newStatus = BRIDGE_STATUS.RETRYABLE_EXPIRED;
          } else if (statusResult.status === ParentToChildMessageStatus.NOT_YET_CREATED) {
            newStatus = BRIDGE_STATUS.L2_PENDING;
          }
          
          updates.status = newStatus;
          updateBridgeTransaction(tx.id, updates);
          
        } else if (tx.type === 'withdraw' && tx.l2TxHash) {
          const receipt = await l2Provider.getTransactionReceipt(tx.l2TxHash);
          if (!receipt) continue;
          
          const childReceipt = new ChildTransactionReceipt(receipt);
          const messages = await childReceipt.getChildToParentMessages(l1Provider);
          
          if (messages.length === 0) continue;
          
          const message = messages[0];
          const status = await message.status(l2Provider);
          let newStatus: BridgeStatus = tx.status;
          
          const l2BlockNumber = await l2Provider.getBlockNumber();
          const txBlockNumber = receipt.blockNumber;
          const confirmations = l2BlockNumber - txBlockNumber;
          const challengePeriodBlocks = 45818;
          const blocksRemaining = Math.max(0, challengePeriodBlocks - confirmations);
          const secondsPerBlock = 0.25;
          const challengePeriodEnd = blocksRemaining > 0 
            ? Date.now() + (blocksRemaining * secondsPerBlock * 1000)
            : Date.now();
          
          if (status === ChildToParentMessageStatus.EXECUTED) {
            newStatus = BRIDGE_STATUS.COMPLETED;
          } else if (status === ChildToParentMessageStatus.CONFIRMED) {
            newStatus = BRIDGE_STATUS.READY_TO_CLAIM;
          } else if (status === ChildToParentMessageStatus.UNCONFIRMED) {
            newStatus = BRIDGE_STATUS.CHALLENGE_PERIOD;
          }
          
          const updates: Partial<BridgeTransaction> = { 
            status: newStatus,
            messageIndex: 0,
            confirmations,
            claimableAt: challengePeriodEnd,
          };
          
          updateBridgeTransaction(tx.id, updates);
        }
      } catch (err) {
        console.error(`Failed to update status for transaction ${tx.id}:`, err);
      }
    }
    
    refreshTransactions();
  }, [refreshTransactions]);
  
  useEffect(() => {
    if (address && pendingTransactions.length > 0) {
      const interval = setInterval(updateTransactionStatuses, 60000);
      return () => clearInterval(interval);
    }
  }, [address, pendingTransactions.length, updateTransactionStatuses]);
  
  const switchChain = useCallback(async (chain: 'L1' | 'L2'): Promise<boolean> => {
    setError(null);
    try {
      if (chain === 'L1') {
        return await switchToL1();
      } else {
        return await switchToL2();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch chain');
      return false;
    }
  }, []);
  
  const estimateGas = useCallback(async (
    type: 'deposit' | 'withdraw',
    amount: string
  ): Promise<GasEstimate | null> => {
    try {
      const amountWei = parseBridgeAmount(amount);
      const estimate = type === 'deposit' 
        ? await estimateDepositGas(amountWei)
        : await estimateWithdrawGas(amountWei);
      setGasEstimate(estimate);
      return estimate;
    } catch (err) {
      console.error('Gas estimation failed:', err);
      return null;
    }
  }, []);
  
  const depositETH = useCallback(async (amount: string): Promise<string | null> => {
    if (!address || !window.ethereum) {
      setError('Wallet not connected');
      return null;
    }
    
    if (currentChain !== 'L1') {
      setError('Please switch to Ethereum mainnet to deposit');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amountWei = parseBridgeAmount(amount);
      
      const inboxAbi = [
        'function depositEth() payable returns (uint256)',
      ];
      
      const inbox = new Contract(BRIDGE_CONTRACTS.INBOX, inboxAbi, signer);
      
      const tx = await inbox.depositEth({ value: amountWei });
      
      const txId = generateTransactionId();
      const bridgeTx: BridgeTransaction = {
        id: txId,
        type: 'deposit',
        asset: 'ETH',
        amount,
        fromChain: 'L1',
        toChain: 'L2',
        status: BRIDGE_STATUS.L1_INITIATED,
        l1TxHash: tx.hash,
        timestamp: Date.now(),
        estimatedArrival: Date.now() + 15 * 60 * 1000,
      };
      
      saveBridgeTransaction(bridgeTx);
      refreshTransactions();
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        updateBridgeTransaction(txId, { status: BRIDGE_STATUS.L2_PENDING });
        refreshTransactions();
        
        setTimeout(() => updateTransactionStatuses(), 30000);
      } else {
        updateBridgeTransaction(txId, { status: BRIDGE_STATUS.FAILED });
        refreshTransactions();
      }
      
      await refreshBalances();
      
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, currentChain, refreshBalances, refreshTransactions, updateTransactionStatuses]);
  
  const withdrawETH = useCallback(async (amount: string): Promise<string | null> => {
    if (!address || !window.ethereum) {
      setError('Wallet not connected');
      return null;
    }
    
    if (currentChain !== 'L2') {
      setError('Please switch to Arbitrum to withdraw');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amountWei = parseBridgeAmount(amount);
      
      const arbSysAbi = [
        'function withdrawEth(address destination) payable returns (uint256)',
      ];
      
      const arbSys = new Contract(
        BRIDGE_CONTRACTS.ARB_SYS,
        arbSysAbi,
        signer
      );
      
      const tx = await arbSys.withdrawEth(address, { value: amountWei });
      
      const txId = generateTransactionId();
      const challengePeriodMs = 7 * 24 * 60 * 60 * 1000;
      const bridgeTx: BridgeTransaction = {
        id: txId,
        type: 'withdraw',
        asset: 'ETH',
        amount,
        fromChain: 'L2',
        toChain: 'L1',
        status: BRIDGE_STATUS.L1_INITIATED,
        l2TxHash: tx.hash,
        timestamp: Date.now(),
        estimatedArrival: Date.now() + challengePeriodMs,
        claimableAt: Date.now() + challengePeriodMs,
        confirmations: 0,
        requiredConfirmations: 45818,
        claimed: false,
      };
      
      saveBridgeTransaction(bridgeTx);
      refreshTransactions();
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        updateBridgeTransaction(txId, { 
          status: BRIDGE_STATUS.CHALLENGE_PERIOD,
          confirmations: 1,
        });
        refreshTransactions();
      } else {
        updateBridgeTransaction(txId, { status: BRIDGE_STATUS.FAILED });
        refreshTransactions();
      }
      
      await refreshBalances();
      
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, currentChain, refreshBalances, refreshTransactions]);
  
  const depositToken = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<string | null> => {
    if (!address || !window.ethereum) {
      setError('Wallet not connected');
      return null;
    }
    
    if (currentChain !== 'L1') {
      setError('Please switch to Ethereum mainnet to deposit tokens');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amountWei = parseBridgeAmount(amount);
      
      const tokenAbi = [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)',
      ];
      
      const token = new Contract(tokenAddress, tokenAbi, signer);
      
      const currentAllowance = await token.allowance(address, BRIDGE_CONTRACTS.L1_GATEWAY_ROUTER);
      if (currentAllowance < amountWei) {
        const approveTx = await token.approve(BRIDGE_CONTRACTS.L1_GATEWAY_ROUTER, amountWei);
        await approveTx.wait();
      }
      
      const gatewayAbi = [
        'function outboundTransfer(address _token, address _to, uint256 _amount, uint256 _maxGas, uint256 _gasPriceBid, bytes calldata _data) payable returns (bytes memory)',
      ];
      
      const gateway = new Contract(BRIDGE_CONTRACTS.L1_GATEWAY_ROUTER, gatewayAbi, signer);
      
      const maxGas = BigInt(300000);
      const feeData = await provider.getFeeData();
      const gasPriceBid = feeData.gasPrice || BigInt(30000000000);
      const maxSubmissionCost = parseEther('0.01');
      
      const abiCoder = new AbiCoder();
      const data = abiCoder.encode(
        ['uint256', 'bytes'],
        [maxSubmissionCost, '0x']
      );
      
      const tx = await gateway.outboundTransfer(
        tokenAddress,
        address,
        amountWei,
        maxGas,
        gasPriceBid,
        data,
        { value: maxSubmissionCost + (gasPriceBid * maxGas) }
      );
      
      const txId = generateTransactionId();
      const bridgeTx: BridgeTransaction = {
        id: txId,
        type: 'deposit',
        asset: 'AXM',
        amount,
        fromChain: 'L1',
        toChain: 'L2',
        status: BRIDGE_STATUS.L1_INITIATED,
        l1TxHash: tx.hash,
        timestamp: Date.now(),
        estimatedArrival: Date.now() + 15 * 60 * 1000,
      };
      
      saveBridgeTransaction(bridgeTx);
      refreshTransactions();
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        updateBridgeTransaction(txId, { status: BRIDGE_STATUS.L2_PENDING });
        refreshTransactions();
        
        setTimeout(() => updateTransactionStatuses(), 30000);
      }
      
      await refreshBalances();
      
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Token deposit failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, currentChain, refreshBalances, refreshTransactions, updateTransactionStatuses]);
  
  const withdrawToken = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<string | null> => {
    if (!address || !window.ethereum) {
      setError('Wallet not connected');
      return null;
    }
    
    if (currentChain !== 'L2') {
      setError('Please switch to Arbitrum to withdraw tokens');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amountWei = parseBridgeAmount(amount);
      
      const gatewayAbi = [
        'function outboundTransfer(address _l1Token, address _to, uint256 _amount, bytes calldata _data) returns (bytes memory)',
      ];
      
      const gateway = new Contract(BRIDGE_CONTRACTS.L2_GATEWAY_ROUTER, gatewayAbi, signer);
      
      const tx = await gateway.outboundTransfer(
        tokenAddress,
        address,
        amountWei,
        '0x'
      );
      
      const txId = generateTransactionId();
      const challengePeriodMs = 7 * 24 * 60 * 60 * 1000;
      const bridgeTx: BridgeTransaction = {
        id: txId,
        type: 'withdraw',
        asset: 'AXM',
        amount,
        fromChain: 'L2',
        toChain: 'L1',
        status: BRIDGE_STATUS.L1_INITIATED,
        l2TxHash: tx.hash,
        timestamp: Date.now(),
        estimatedArrival: Date.now() + challengePeriodMs,
        claimableAt: Date.now() + challengePeriodMs,
        confirmations: 0,
        requiredConfirmations: 45818,
        claimed: false,
      };
      
      saveBridgeTransaction(bridgeTx);
      refreshTransactions();
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        updateBridgeTransaction(txId, { status: BRIDGE_STATUS.CHALLENGE_PERIOD });
        refreshTransactions();
      }
      
      await refreshBalances();
      
      return tx.hash;
    } catch (err: any) {
      setError(err.message || 'Token withdrawal failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, currentChain, refreshBalances, refreshTransactions]);
  
  const redeemFailedDeposit = useCallback(async (l1TxHash: string): Promise<string | null> => {
    if (!address || !window.ethereum) {
      setError('Wallet not connected');
      return null;
    }
    
    if (currentChain !== 'L2') {
      setError('Please switch to Arbitrum to redeem the retryable ticket');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const redeemTxHash = await redeemRetryableTicket(l1TxHash);
      
      if (redeemTxHash) {
        const transactions = getBridgeTransactions();
        const tx = transactions.find(t => t.l1TxHash === l1TxHash);
        if (tx) {
          updateBridgeTransaction(tx.id, { 
            status: BRIDGE_STATUS.COMPLETED,
            l2TxHash: redeemTxHash,
          });
        }
        refreshTransactions();
        await refreshBalances();
      }
      
      return redeemTxHash;
    } catch (err: any) {
      setError(err.message || 'Failed to redeem retryable ticket');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, currentChain, refreshBalances, refreshTransactions]);
  
  const claimPendingWithdrawal = useCallback(async (l2TxHash: string): Promise<string | null> => {
    if (!address || !window.ethereum) {
      setError('Wallet not connected');
      return null;
    }
    
    if (currentChain !== 'L1') {
      setError('Please switch to Ethereum mainnet to claim your withdrawal');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const claimTxHash = await claimWithdrawal(l2TxHash);
      
      if (claimTxHash) {
        const transactions = getBridgeTransactions();
        const tx = transactions.find(t => t.l2TxHash === l2TxHash);
        if (tx) {
          updateBridgeTransaction(tx.id, { 
            status: BRIDGE_STATUS.COMPLETED,
            l1TxHash: claimTxHash,
            claimed: true,
          });
        }
        refreshTransactions();
        await refreshBalances();
      }
      
      return claimTxHash;
    } catch (err: any) {
      setError(err.message || 'Failed to claim withdrawal');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, currentChain, refreshBalances, refreshTransactions]);
  
  const getEstimatedTime = useCallback((type: 'deposit' | 'withdraw') => {
    if (type === 'deposit') {
      return getDepositEstimatedTime();
    }
    const withdrawTime = getWithdrawEstimatedTime();
    return {
      min: withdrawTime.min,
      max: withdrawTime.max,
      average: withdrawTime.average,
    };
  }, []);
  
  return {
    isLoading,
    error,
    currentChain,
    l1Balance,
    l2Balance,
    l1TokenBalance,
    l2TokenBalance,
    pendingTransactions,
    gasEstimate,
    depositETH,
    withdrawETH,
    depositToken,
    withdrawToken,
    estimateGas,
    switchChain,
    refreshBalances,
    refreshTransactions,
    getEstimatedTime,
    checkMessageStatus,
    redeemFailedDeposit,
    claimPendingWithdrawal,
    updateTransactionStatuses,
  };
}
