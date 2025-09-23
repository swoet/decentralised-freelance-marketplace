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
            
            // Store wallet address for profile setup
            if (typeof window !== 'undefined') {
                localStorage.setItem('walletAddress', address)
            }
            
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
            }
            toast.error(message);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Head>
                <title>Join the Artisan Community - Artisan Marketplace</title>
                <meta name="description" content="Create your artisan account and join the decentralized freelance marketplace community" />
                
                {/* Artisan Craft Fonts */}
                <link 
                    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
                    rel="stylesheet"
                />
            </Head>
            
            <div className="min-h-screen bg-neutral-50 bg-craft-texture flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Motion preset="scaleIn" className="max-w-lg w-full">
                    <Card variant="leather" className="shadow-craft-deep">
                        <CardHeader className="text-center">
                            <div className="mb-4">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gold-500 to-copper-600 rounded-organic-craft flex items-center justify-center shadow-craft-soft">
                                    <svg className="w-8 h-8 text-neutral-50" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                                    </svg>
                                </div>
                            </div>
                            <CardTitle className="text-3xl">Join the Artisan Community</CardTitle>
                            <CardDescription>
                                Create your account and start your creative journey.{' '}
                                <Link href="/login" className="text-copper-600 hover:text-mahogany-600 font-medium underline">
                                    Already have an account?
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
                                /* Email/Password Registration Form */
                                <form className="space-y-6" onSubmit={handleEmailSignup}>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Input
                                            variant="craft"
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            name="fullName"
                                            label="Full Name"
                                            required
                                            leftIcon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            }
                                        />
                                        
                                        <Input
                                            variant="craft"
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            name="email"
                                            label="Email Address"
                                            required
                                            leftIcon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                            }
                                        />

                                        <div className="space-y-2">
                                            <label className="body-craft text-sm font-medium text-copper-700">
                                                I want to...
                                            </label>
                                            <ButtonGroup spacing="sm">
                                                <Button
                                                    type="button"
                                                    variant={formData.role === 'client' ? 'primary' : 'ghost'}
                                                    shape="leaf"
                                                    onClick={() => setFormData({...formData, role: 'client'})}
                                                    leftIcon={
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                                                        </svg>
                                                    }
                                                >
                                                    Hire Artisans
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={formData.role === 'freelancer' ? 'primary' : 'ghost'}
                                                    shape="wax"
                                                    onClick={() => setFormData({...formData, role: 'freelancer'})}
                                                    leftIcon={
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                        </svg>
                                                    }
                                                >
                                                    Offer Services
                                                </Button>
                                            </ButtonGroup>
                                        </div>
                                        
                                        <Input
                                            variant="craft"
                                            type="password"
                                            placeholder="Create a secure password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            name="password"
                                            label="Password"
                                            required
                                            leftIcon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            }
                                        />
                                        
                                        <Input
                                            variant="craft"
                                            type="password"
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            name="confirmPassword"
                                            label="Confirm Password"
                                            required
                                            leftIcon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            }
                                        />
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
                                        {isLoading ? 'Creating Account...' : 'Create Account'}
                                    </Button>
                                </form>
                            ) : (
                                /* Wallet Connection */
                                <div className="space-y-6">
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-mahogany-400 to-copper-600 rounded-organic-wax flex items-center justify-center shadow-craft-soft">
                                            <svg className="w-10 h-10 text-neutral-50" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="heading-craft text-xl text-mahogany-800 mb-2">Create Web3 Identity</h3>
                                            <p className="body-craft text-copper-600">
                                                Connect your Web3 wallet to create a decentralized artisan identity and access blockchain features
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
                                By creating an account, you agree to our{' '}
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

export default Signup