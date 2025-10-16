import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import AppShell from '../components/layout/AppShell'
import PlatformStats from '../components/PlatformStats'
import TestimonialsSection from '../components/TestimonialsSection'
import HowItWorksSection from '../components/HowItWorksSection'

const Home: NextPage = () => {
  return (
    <AppShell>
      <Head>
        <title>CraftNexus - Decentralized Freelance Marketplace</title>
        <meta name="description" content="Secure freelance marketplace powered by blockchain technology. Smart contracts, escrow payments, and decentralized reputation systems." />
      </Head>

      <div className="w-full flex flex-col items-center justify-center min-h-screen">
        {/* Hero Section */}
        <section className="relative w-full py-8 md:py-12 flex items-center justify-center overflow-hidden mh-wood mh-allow-pseudo min-h-[60vh]">
          <div className="absolute inset-0"></div>
          
          <div className="w-full max-w-6xl mx-auto relative z-10 text-center px-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              🚀 Powered by Blockchain Technology
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <span className="block">Decentralized</span>
              <span className="block text-accent">Freelance</span>
              <span className="block">Marketplace</span>
            </h1>
            
            <p className="text-base md:text-lg mb-6 max-w-2xl mx-auto leading-relaxed text-gray-700">
              Connect freelancers and clients through smart contracts, escrow payments, and decentralized reputation systems for secure, transparent project collaboration
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/projects">
                <div className="mh-btn mh-btn-primary px-6 py-3">
                  Explore Projects
                </div>
              </Link>
              <Link href="/signup">
                <div className="mh-btn mh-btn-ghost px-6 py-3">
                  Join as Freelancer
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full flex justify-center px-6 py-6">
          <div className="w-full max-w-6xl mx-auto">
            <div className="mh-section p-6 mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Secure <span className="text-accent">Blockchain-Powered</span> Freelancing
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto text-gray-700">
                Smart contracts ensure secure payments, transparent project management, and decentralized dispute resolution for both freelancers and clients.
              </p>
              <div className="mh-divider-wood mt-4"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
              <Link href="/projects">
                <div className="mh-card h-full group p-6">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mb-4 w-fit">
                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Smart Contracts →</h3>
                  <p className="text-sm">Automated escrow payments and milestone-based releases ensure secure transactions for all parties.</p>
                </div>
              </Link>

              <Link href="/dashboard/freelancer">
                <div className="mh-card h-full group p-6">
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-4 w-fit">
                    <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Crypto Payments →</h3>
                  <p className="text-sm">Accept payments in multiple cryptocurrencies with instant settlement and low transaction fees.</p>
                </div>
              </Link>

              <Link href="/dashboard/client">
                <div className="mh-card h-full group p-6">
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mb-4 w-fit">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Reputation System →</h3>
                  <p className="text-sm">Decentralized reviews and ratings stored on blockchain ensure transparent, tamper-proof reputation tracking.</p>
                </div>
              </Link>

              <Link href="/community">
                <div className="mh-card h-full group p-6">
                  <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl mb-4 w-fit">
                    <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Dispute Resolution →</h3>
                  <p className="text-sm">Decentralized arbitration system with community voting ensures fair resolution of project disputes.</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Platform Statistics */}
        <PlatformStats />

        {/* How It Works Section */}
        <div className="-mt-4">
          <HowItWorksSection />
        </div>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Authentication Section */}
        <section className="w-full flex justify-center px-6 py-6">
          <div className="w-full max-w-5xl mx-auto">
            <div className="mh-section p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Start Your <span className="text-accent">Blockchain Journey</span>
                </h2>
                <p className="text-sm md:text-base max-w-2xl mx-auto mb-4 text-gray-700">
                  Connect your Web3 wallet or create an account to access secure, decentralized freelancing with smart contract protection
                </p>
                <div className="mh-divider-thick"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mh-card text-center p-4">
                  <div className="mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mx-auto mb-3 w-fit">
                      <svg className="w-8 h-8 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zM7.707 8.707L10 11l4.293-4.293a1 1 0 111.414 1.414L11 12.828a1 1 0 01-1.414 0L5.293 8.535a1 1 0 011.414-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Web3 Wallet</h3>
                    <p className="mb-3 text-sm text-gray-700">Connect MetaMask, WalletConnect, or other Web3 wallets for full decentralized access and crypto payments.</p>
                  </div>
                  <div className="mt-auto">
                    <Link href="/signup" className="w-full">
                      <div className="mh-btn mh-btn-primary w-full text-center">
                        Connect Wallet
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="mh-card text-center p-4">
                  <div className="mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mx-auto mb-3 w-fit">
                      <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Traditional Login</h3>
                    <p className="mb-3 text-sm text-gray-700">Create an account with email and password while still accessing blockchain features and smart contracts.</p>
                  </div>
                  <div className="mt-auto">
                    <Link href="/login" className="w-full">
                      <div className="mh-btn mh-btn-ghost w-full text-center">
                        Sign In
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default Home
