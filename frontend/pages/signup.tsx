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

const Signup = () => {
    const [isWalletMode, setIsWalletMode] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'client' // 'client' or 'freelancer'
    })
    const [isLoading, setIsLoading] = useState(false)
    const [account, setAccount] = useState<string | null>(null)
    const router = useRouter()
    const { register, connectWallet } = useAuth()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    // Traditional email/password registration
    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        
        setIsLoading(true)
        
        try {
            await register(formData.email, formData.password, formData.fullName, formData.role)
            toast.success('Registration successful!')
            // The AuthContext will handle the redirect to dashboard
        } catch (error) {
            console.error('Registration error:', error);
            let message = 'Registration failed. Please try again.';
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === 'object' && error !== null) {
                if ('detail' in error && typeof error.detail === 'string') {
                    message = error.detail;
                } else if ('message' in error && typeof error.message === 'string') {
                    message = error.message;
                } else {
                    message = JSON.stringify(error);
                }
            }
            toast.error(message);
        } finally {
            setIsLoading(false)
        }
    }

    // Wallet-based registration
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
            
            // Connect wallet in AuthContext with required fields
            await connectWallet(
                address,
                formData.fullName,
                formData.email,
                formData.role
            )
            toast.success('Wallet connected! Please complete your profile.')
            // Redirect to profile completion page
            router.push('/profile-setup')
        } catch (error) {
            console.error("Error connecting to MetaMask", error)
            let message = 'Failed to connect wallet. Please check MetaMask and try again.';
            if (error instanceof Error) {
                if (error.message.includes('User rejected')) {
                    message = 'Wallet connection was rejected. Please try again.';
                } else if (error.message.includes('No accounts found')) {
                    message = 'No wallet accounts found. Please unlock your wallet.';
                } else if (error.message.includes('already pending')) {
                    message = 'MetaMask connection already in progress. Please check MetaMask.';
                } else {
                    message = error.message;
                }
            } else if (typeof error === 'object' && error !== null) {
                if ('detail' in error && typeof error.detail === 'string') {
                    message = error.detail;
                } else if ('message' in error && typeof error.message === 'string') {
                    message = error.message;
                } else {
                    message = JSON.stringify(error);
                }
            }
            toast.error(message);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            sign in to existing account
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
                    /* Email/Password Registration Form */
                    <form className="mt-8 space-y-6" onSubmit={handleEmailSignup}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="fullName" className="sr-only">Full Name</label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label htmlFor="role" className="sr-only">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                >
                                    <option value="client">I want to hire (Client)</option>
                                    <option value="freelancer">I want to work (Freelancer)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm Password"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Creating account...' : 'Create account'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Wallet Connection */
                    <div className="mt-8 space-y-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">
                                Connect your Web3 wallet to create a decentralized identity
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
                                <p className="mt-2 text-sm text-gray-600">
                                    Complete your profile to continue
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        By creating an account, you agree to our{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Signup