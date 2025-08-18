import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

declare global {
    interface Window {
        ethereum?: any
    }
}

const WalletConnector = () => {
    const [account, setAccount] = useState<string | null>(null)

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address)
                toast.success('Wallet connected!')
            } catch (error) {
                console.error("Error connecting to MetaMask", error)
                toast.error('Failed to connect wallet.')
            }
        } else {
            toast.error('MetaMask not detected. Please install it.')
        }
    }

    return (
        <div>
            {account ? (
                <div className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md">
                    Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                </div>
            ) : (
                <button
                    onClick={connectWallet}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Connect Wallet
                </button>
            )}
        </div>
    )
}

export default WalletConnector 