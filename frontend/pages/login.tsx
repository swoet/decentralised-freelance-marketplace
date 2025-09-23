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
        <>
            <Head>
                <title>Sign In - Artisan Marketplace</title>
                <meta name="description" content="Sign in to your artisan account and access the decentralized freelance marketplace" />
                
                {/* Artisan Craft Fonts */}
                <link 
                    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
                    rel="stylesheet"
                />
            </Head>
            
            <div className="min-h-screen bg-neutral-50 bg-craft-texture flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Motion preset="scaleIn" className="max-w-md w-full">
                    <Card variant="parchment" className="shadow-craft-deep">
                        <CardHeader className="text-center">
                            <div className="mb-4">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-mahogany-600 to-copper-500 rounded-organic-craft flex items-center justify-center shadow-craft-soft">
                                    <svg className="w-8 h-8 text-neutral-50" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <CardTitle className="text-3xl">Welcome Back, Artisan</CardTitle>
                            <CardDescription>
                                Sign in to continue your creative journey.{' '}
                                <Link href="/signup" className="text-copper-600 hover:text-mahogany-600 font-medium underline">
                                    Create a new account
                                </Link>
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {/* Authentication Mode Toggle */}
                            <ButtonGroup spacing="none" className="mb-6">
                                <Button
                                    variant={!isWalletMode ? "primary" : "ghost"}
                                    onClick={() => setIsWalletMode(false)}
                                    shape="square"
                                    className="flex-1 rounded-r-none"
                                >
                                    Email & Password
                                </Button>
                                <Button
                                    variant={isWalletMode ? "primary" : "ghost"}
                                    onClick={() => setIsWalletMode(true)}
                                    shape="square"
                                    className="flex-1 rounded-l-none"
                                >
                                    Web3 Wallet
                                </Button>
                            </ButtonGroup>

                            {!isWalletMode ? (
                                /* Email/Password Form */
                                <form className="space-y-6" onSubmit={handleEmailLogin}>
                                    <div className="space-y-4">
                                        <Input
                                            variant="craft"
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            label="Email Address"
                                            required
                                            leftIcon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                            }
                                        />
                                        <Input
                                            variant="craft"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            label="Password"
                                            required
                                            leftIcon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <input
                                                id="remember-me"
                                                name="remember-me"
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="h-4 w-4 text-mahogany-600 focus:ring-gold-500 border-mahogany-300 rounded"
                                            />
                                            <label htmlFor="remember-me" className="ml-2 block body-craft text-sm text-copper-700">
                                                Remember me
                                            </label>
                                        </div>

                                        <div className="text-sm">
                                            <a href="#" className="body-craft font-medium text-copper-600 hover:text-mahogany-600">
                                                Forgot your password?
                                            </a>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        shape="leaf"
                                        fullWidth
                                        disabled={isLoading}
                                        loading={isLoading}
                                    >
                                        {isLoading ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </form>
                            ) : (
                                /* Wallet Connection */
                                <div className="space-y-6">
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gold-400 to-gold-600 rounded-organic-wax flex items-center justify-center shadow-craft-soft">
                                            <svg className="w-10 h-10 text-neutral-50" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="heading-craft text-xl text-mahogany-800 mb-2">Connect Your Wallet</h3>
                                            <p className="body-craft text-copper-600">
                                                Connect your Web3 wallet to access the decentralized artisan marketplace
                                            </p>
                                        </div>
                                        <Button
                                            variant="accent"
                                            size="lg"
                                            shape="wax"
                                            fullWidth
                                            onClick={handleWalletConnection}
                                            disabled={isLoading}
                                            loading={isLoading}
                                            leftIcon={
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                </svg>
                                            }
                                        >
                                            {isLoading ? 'Connecting...' : 'Connect MetaMask'}
                                        </Button>
                                        
                                        {account && (
                                            <Motion preset="fadeIn">
                                                <Badge variant="success" size="lg" shape="pill" className="mx-auto">
                                                    Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                                                </Badge>
                                            </Motion>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="text-center">
                            <p className="body-craft text-xs text-bronze-600">
                                By signing in, you agree to our{' '}
                                <a href="#" className="text-copper-600 hover:text-mahogany-600 underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="text-copper-600 hover:text-mahogany-600 underline">Privacy Policy</a>
                            </p>
                        </CardFooter>
                    </Card>
                </Motion>
            </div>
        </>
    )
}

export default Login