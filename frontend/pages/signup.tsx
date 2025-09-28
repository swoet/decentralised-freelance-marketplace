import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [isWalletMode, setIsWalletMode] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const router = useRouter()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await register(formData.email, formData.password, formData.fullName)
      router.push('/dashboard/freelancer')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async () => {
    setLoading(true)
    setError('')

    try {
      // Web3 wallet connection logic would go here
      alert('Web3 wallet connection coming soon!')
    } catch (err: any) {
      setError(err.message || 'Wallet connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <Head>
        <title>Join CraftNexus - Where Artisans Connect</title>
        <meta name="description" content="Create your CraftNexus account and start your creative journey in the premier artisan marketplace" />
      </Head>
      
      <div className="min-h-screen mh-wood mh-allow-pseudo flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="mh-card p-8">
            <div className="text-center mb-8">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-md">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Join CraftNexus</h1>
              <p className="mb-4">
                Create your account and start your creative journey.{' '}
                <Link href="/login" className="text-accent hover:underline font-medium">
                  Already have an account?
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Authentication Mode Toggle */}
            <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden">
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  !isWalletMode ? 'mh-btn-primary' : 'bg-white text-black hover:bg-gray-50'
                }`}
                onClick={() => setIsWalletMode(false)}
              >
                Email & Password
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  isWalletMode ? 'mh-btn-primary' : 'bg-white text-black hover:bg-gray-50'
                }`}
                onClick={() => setIsWalletMode(true)}
              >
                Web3 Wallet
              </button>
            </div>

            {!isWalletMode ? (
              /* Email/Password Registration Form */
              <form className="space-y-6" onSubmit={handleEmailSignup}>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Create a password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                  />
                  <label htmlFor="agree-terms" className="ml-2 block text-sm">
                    I agree to the{' '}
                    <Link href="/terms" className="text-accent hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-accent hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  className="mh-btn mh-btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            ) : (
              /* Web3 Wallet Connection */
              <div className="text-center">
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zM7.707 8.707L10 11l4.293-4.293a1 1 0 111.414 1.414L11 12.828a1 1 0 01-1.414 0L5.293 8.535a1 1 0 011.414-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Use your MetaMask or other Web3 wallet for secure, decentralized authentication
                  </p>
                </div>

                <button
                  onClick={connectWallet}
                  className="mh-btn mh-btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  By connecting your wallet, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
