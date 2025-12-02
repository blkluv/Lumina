import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { ARBITRUM_CHAIN_ID, AXM_TOKEN_ADDRESS, AXM_TOKEN_ABI, formatAxmBalance, switchToArbitrum } from "./web3Config";
import { useAuth } from "./authContext";
import { apiRequest } from "./queryClient";

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  axmBalance: string;
  ethBalance: string;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<boolean>;
  bindWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [axmBalance, setAxmBalance] = useState("0");
  const [ethBalance, setEthBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!address;
  const isCorrectNetwork = chainId === ARBITRUM_CHAIN_ID;

  const fetchBalances = useCallback(async () => {
    if (!address || !window.ethereum) return;
    
    try {
      const ethBalanceHex = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      const ethWei = BigInt(ethBalanceHex);
      setEthBalance(formatAxmBalance(ethWei));

      if (isCorrectNetwork) {
        const data = `0x70a08231000000000000000000000000${address.slice(2)}`;
        const result = await window.ethereum.request({
          method: "eth_call",
          params: [{ to: AXM_TOKEN_ADDRESS, data }, "latest"],
        });
        if (result && result !== "0x") {
          setAxmBalance(formatAxmBalance(BigInt(result)));
        }
      }
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    }
  }, [address, isCorrectNetwork]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        setAddress(null);
        setAxmBalance("0");
        setEthBalance("0");
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    });

    window.ethereum.request({ method: "eth_chainId" }).then((chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
    });

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (address && chainId) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [address, chainId, fetchBalances]);

  async function connect() {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnect() {
    setAddress(null);
    setAxmBalance("0");
    setEthBalance("0");
  }

  async function switchNetwork() {
    return switchToArbitrum();
  }

  async function bindWallet() {
    if (!address || !user) return;
    
    try {
      const message = `Bind wallet ${address} to Lumina account ${user.username}`;
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });
      
      await apiRequest("POST", "/api/wallet/bind", {
        address,
        signature,
        message,
      });
      
      updateUser({ walletAddress: address, walletVerified: true });
    } catch (error) {
      console.error("Failed to bind wallet:", error);
      throw error;
    }
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnected,
        isCorrectNetwork,
        axmBalance,
        ethBalance,
        isConnecting,
        connect,
        disconnect,
        switchNetwork,
        bindWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
