import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function WalletConnect() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      setProvider(new ethers.providers.Web3Provider((window as any).ethereum));
    }
  }, []);

  const connectWallet = async () => {
    if (!provider) return;
    setConnecting(true);
    try {
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      const bal = await provider.getBalance(addr);
      setBalance(ethers.utils.formatEther(bal));
    } catch (err) {
      setAddress(null);
      setBalance(null);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
  };

  return (
    <div className="flex items-center space-x-2">
      {address ? (
        <>
          <span className="text-gray-700 text-sm truncate max-w-xs">{address.slice(0, 6)}...{address.slice(-4)}</span>
          <span className="text-green-700 text-sm">{balance} ETH</span>
          <button onClick={disconnectWallet} className="bg-gray-200 px-2 py-1 rounded text-xs">Disconnect</button>
        </>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
          disabled={connecting}
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
} 