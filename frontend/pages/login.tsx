import { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

declare global {
    interface Window {
        ethereum?: any
    }
}

const Login = () => {
    const [isWalletMode, setIsWalletMode] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [account, setAccount] = useState<string | null>(null)
    const router = useRouter()
    const { login, connectWallet } = useAuth()

    // Traditional email/password login
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        
        try {
            await login(email, password, rememberMe)
            toast.success('Login successful!')
            // The AuthContext will handle the redirect to dashboard
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Login failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Wallet connection
    const handleWalletConnection = async () => {
        if (!window.ethereum) {
            toast.error('MetaMask not detected. Please install it.')
            return
        }

        try {
            setIsLoading(true)
            
            // Check if MetaMask is locked
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (!accounts || accounts.length === 0) {
                // Request account access
                const requestedAccounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                })
                if (!requestedAccounts || requestedAccounts.length === 0) {
                    throw new Error('No accounts found')
                }
            }
            
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const address = await signer.getAddress()
            setAccount(address)
            
            // Connect wallet in AuthContext
            await connectWallet(address)
            
            toast.success('Wallet connected!')
            router.push('/dashboard')
        } catch (error) {
            console.error("Error connecting to MetaMask", error)
            if (error instanceof Error && error.message.includes('User rejected')) {
                toast.error('Wallet connection was rejected. Please try again.')
            } else if (error instanceof Error && error.message.includes('No accounts found')) {
                toast.error('No wallet accounts found. Please unlock your wallet.')
            } else if (error instanceof Error && error.message.includes('already pending')) {
                toast.error('MetaMask connection already in progress. Please check MetaMask.')
            } else {
                toast.error('Failed to connect wallet. Please check MetaMask and try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                            create a new account
                        </Link>
                    </p>
                </div>

                {/* Authentication Mode Toggle */}
                <div className="flex rounded-md shadow-sm">
                    <button
                        onClick={() => setIsWalletMode(false)}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
                            !isWalletMode 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Email & Password
                    </button>
                    <button
                        onClick={() => setIsWalletMode(true)}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border ${
                            isWalletMode 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Web3 Wallet
                    </button>
                </div>

                {!isWalletMode ? (
                    /* Email/Password Form */
                    <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Wallet Connection */
                    <div className="mt-8 space-y-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">
                                Connect your Web3 wallet to access the decentralized marketplace
                            </p>
                            <button
                                onClick={handleWalletConnection}
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Connecting...' : 'Connect MetaMask'}
                            </button>
                        </div>
                        
                        {account && (
                            <div className="text-center">
                                <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-md">
                                    Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        By signing in, you agree to our{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login