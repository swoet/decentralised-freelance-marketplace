import { useState } from 'react'
import { ethers } from 'ethers'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

declare global {
    interface Window {
        ethereum?: any
    }
}

const TestWallet = () => {
    const [account, setAccount] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { user, token, connectWallet } = useAuth()

    const handleConnect = async () => {
        if (!window.ethereum) {
            toast.error('MetaMask not detected')
            return
        }

        try {
            setIsLoading(true)
            console.log('Starting wallet connection...')
            
            // Check if MetaMask is locked
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            console.log('Current accounts:', accounts)
            
            if (!accounts || accounts.length === 0) {
                console.log('No accounts found, requesting access...')
                const requestedAccounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                })
                console.log('Requested accounts:', requestedAccounts)
                
                if (!requestedAccounts || requestedAccounts.length === 0) {
                    throw new Error('No accounts found')
                }
            }
            
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const address = await signer.getAddress()
            console.log('Got address:', address)
            
            setAccount(address)
            
            // Connect wallet in AuthContext
            await connectWallet(address)
            
            toast.success('Wallet connected successfully!')
        } catch (error) {
            console.error('Wallet connection error:', error)
            toast.error('Failed to connect wallet')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8">
                <div>
                    <h1 className="text-2xl font-bold text-center">Wallet Connection Test</h1>
                </div>
                
                <div className="space-y-4">
                    <button
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Connecting...' : 'Connect MetaMask'}
                    </button>
                    
                    {account && (
                        <div className="p-4 bg-green-100 rounded">
                            <p className="text-green-800">Connected: {account}</p>
                        </div>
                    )}
                    
                    <div className="p-4 bg-gray-100 rounded">
                        <h3 className="font-semibold">Auth State:</h3>
                        <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
                        <p>Token: {token ? 'Present' : 'Missing'}</p>
                        {user && (
                            <p>Wallet: {user.wallet_address || 'None'}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TestWallet
