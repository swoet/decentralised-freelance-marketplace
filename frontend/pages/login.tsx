import { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Motion
} from '@/components/artisan-craft'

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
            await connectWallet(address, 'Wallet User', '', 'freelancer')
            
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
        <>
            <Head>
                <meta name="description" content="Sign in to your CraftNexus account and connect with the premier artisan marketplace" />
                
                {/* Fonts are now loaded globally in globals.css */}
            </Head>
            
            <div className="flex min-h-screen items-center justify-center bg-wood bg-cover bg-center bg-no-repeat p-4 py-12 sm:px-6 lg:px-8">
                <Motion preset="scaleIn" className="max-w-md w-full">
                    <div className="bg-white p-8 shadow-md">
                        <div className="text-center mb-8">
                            <div className="mb-6">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-md">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Welcome Back to CraftNexus</h1>
                            <p className="mb-4">
                                Sign in to continue your creative journey.{' '}
                                <Link href="/signup" className="text-accent hover:underline font-medium">
                                    Create a new account
                                </Link>
                            </p>
                        </div>

                        <div>
                            {/* Authentication Mode Toggle */}
                            <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                        !isWalletMode ? 'bg-primary-500 text-white' : 'bg-white text-black hover:bg-gray-50'
                                    }`}
                                    onClick={() => setIsWalletMode(false)}
                                >
                                    Email & Password
                                </button>
                                <button
                                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                        isWalletMode ? 'bg-primary-500 text-white' : 'bg-white text-black hover:bg-gray-50'
                                    }`}
                                    onClick={() => setIsWalletMode(true)}
                                >
                                    Web3 Wallet
                                </button>
                            </div>

                            {!isWalletMode ? (
                                /* Email/Password Form */
                                <form className="space-y-6" onSubmit={handleEmailLogin}>
                                    <div className="space-y-4">
{{ ... }
                                                Forgot your password?
                                            </a>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="mh-btn mh-btn-primary w-full"
                                        disabled={loading}
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </form>
                            ) : (
                                /* Wallet Connection */
                                <div className="space-y-6">
                                    <div className="text-center space-y-4">
{{ ... }
                                By signing in, you agree to our{' '}
                                <a href="#" className="text-copper-600 hover:text-mahogany-600 underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="text-copper-600 hover:text-mahogany-600 underline">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </Motion>
            </div>
        </>
    )

export default Login