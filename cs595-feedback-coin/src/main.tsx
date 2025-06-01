import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Buffer } from "buffer";
import { MetaMaskProvider } from "./MetaMaskContext";
import { ClassProvider } from './ClassContext';

window.Buffer = Buffer;

declare global {
  interface Window {
    ethereum?: any;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MetaMaskProvider>
      <ClassProvider>
        <App />
      </ClassProvider>
    </MetaMaskProvider>
  </StrictMode>,
);
