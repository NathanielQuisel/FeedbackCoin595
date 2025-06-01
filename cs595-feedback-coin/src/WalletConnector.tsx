// src/components/WalletConnector.tsx
import React, { useEffect } from "react";
import { useMetaMask } from "./MetaMaskContext";
import { useNavigate } from "react-router-dom";

const WalletConnector: React.FC = () => {
  const { account, connect, disconnect } = useMetaMask();
  const navigate = useNavigate();

  useEffect(() => {
    if (account) {
      navigate("/dashboard"); // 👈 Redirect when connected
    }
  }, [account, navigate]);

  return (
    <div>
      {account ? (
        <div>
          <p>Connected: {account}</p>
          <button
            onClick={disconnect}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
        >
          Connect MetaMask
        </button>
      )}
    </div>
  );
};

export default WalletConnector;
