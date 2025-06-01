import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const styles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '4rem',
    textAlign: 'center',
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: '2rem',
    padding: '1rem 2rem',
    fontSize: '1.5rem',
    cursor: 'pointer',
  };

  return (
    <div style={styles}>
      <h1>Welcome!</h1>
      <button style={buttonStyle} onClick={() => navigate('/login')}>
        Login
      </button>
      <button style={buttonStyle} onClick={() => navigate('/createAcc')}>
        Create Account
      </button>
    </div>
  );
};

export default Welcome;
