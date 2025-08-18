import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

const ProfileSetup = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: 'client',
        bio: '',
        skills: '',
        portfolio: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const router = useRouter()
    const { updateUser } = useAuth()

    useEffect(() => {
        // Get wallet address from localStorage or URL params
        const address = localStorage.getItem('walletAddress') || router.query.address
        if (address) {
            setWalletAddress(address as string)
        } else {
            // Redirect if no wallet address
            router.push('/signup')
        }
    }, [router])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.fullName || !formData.email) {
            toast.error('Full name and email are required')
            return
        }
        
        setIsLoading(true)
        
        try {
            // Call the wallet registration API
            const response = await fetch('/api/auth/wallet-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    ...formData
                })
            })
            
            if (response.ok) {
                const data = await response.json()
                
                // Store the token and user data
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
                
                // Update the AuthContext
                updateUser(data.user)
                
                toast.success('Profile setup complete!')
                router.push('/dashboard')
            } else {
                const error = await response.json()
                toast.error(error.message || 'Profile setup failed')
            }
        } catch (error) {
            toast.error('Profile setup failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!walletAddress) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Complete Your Profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Connected wallet: {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                            <label htmlFor="bio" className="sr-only">Bio</label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows={3}
                                value={formData.bio}
                                onChange={handleInputChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Tell us about yourself"
                            />
                        </div>
                        {formData.role === 'freelancer' && (
                            <>
                                <div>
                                    <label htmlFor="skills" className="sr-only">Skills</label>
                                    <input
                                        id="skills"
                                        name="skills"
                                        type="text"
                                        value={formData.skills}
                                        onChange={handleInputChange}
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Skills (e.g., React, Python, Design)"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="portfolio" className="sr-only">Portfolio URL</label>
                                    <input
                                        id="portfolio"
                                        name="portfolio"
                                        type="url"
                                        value={formData.portfolio}
                                        onChange={handleInputChange}
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Portfolio URL (optional)"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Setting up profile...' : 'Complete Profile'}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        By completing your profile, you agree to our{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ProfileSetup
