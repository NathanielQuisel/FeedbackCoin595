// src/Login.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import WalletConnector from './WalletConnector';

const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '20vh', fontSize: '2rem' }}>
      <p>This is the login page.</p>
      <WalletConnector />

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '2rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Back to Welcome
      </button>
    </div>
  );
};

export default Login;
