// src/MetaMaskContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

type MetaMaskContextType = {
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: ethers.BrowserProvider | null;
};

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (!context) throw new Error("useMetaMask must be used within a MetaMaskProvider");
  return context;
};

export const MetaMaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const checkAndSwitchToSepolia = async () => {
    const SEPOLIA_CHAIN_ID = "0xaa36a7"; // hex for 11155111

    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

    if (currentChainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: "Sepolia Test Network",
              nativeCurrency: {
                name: "SepoliaETH",
                symbol: "SEP",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          await checkAndSwitchToSepolia();

          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethProvider);

          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking MetaMask connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      await checkAndSwitchToSepolia();

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);
    } catch (err) {
      console.error("MetaMask connection error:", err);
    }
  };

  const disconnect = () => {
    setAccount(null);
  };

  return (
    <MetaMaskContext.Provider value={{ account, connect, disconnect, provider }}>
      {children}
    </MetaMaskContext.Provider>
  );
};
