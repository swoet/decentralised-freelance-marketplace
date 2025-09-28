import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import AppShell from '../components/layout/AppShell'

const Home: NextPage = () => {
  return (
    <AppShell>
      <Head>
        <title>CraftNexus - Where Artisans Connect</title>
        <meta name="description" content="CraftNexus: The premier decentralized marketplace where skilled artisans connect with clients for handcrafted excellence" />
      </Head>

      <div className="min-h-screen mh-surface">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden mh-wood mh-allow-pseudo">
          <div className="absolute inset-0"></div>
          
          <div className="max-w-6xl mx-auto relative z-10 text-center px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              🎨 New Platform Launch
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="block">Where</span>
              <span className="block text-accent">Artisans</span>
              <span className="block">Connect</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              The premier decentralized marketplace where skilled artisans connect with clients for handcrafted excellence and creative collaboration
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/projects">
                <div className="mh-btn mh-btn-primary">
                  Explore Projects
                </div>
              </Link>
              <Link href="/signup">
                <div className="mh-btn mh-btn-ghost">
                  Join as Artisan
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="mh-section p-8 mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Your <span className="text-accent">Creative Path</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto">
              Whether you're seeking exceptional talent or offering your skills, CraftNexus connects you with the perfect match.
            </p>
            <div className="mh-divider-wood mt-8"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link href="/projects">
              <div className="mh-card h-full group p-6">
                <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-4 w-fit">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Browse Projects →</h3>
                <p className="text-sm">Discover exceptional projects and start your creative journey with trusted clients.</p>
              </div>
            </Link>

            <Link href="/dashboard/freelancer">
              <div className="mh-card h-full group p-6">
                <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl mb-4 w-fit">
                  <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Freelancer Hub →</h3>
                <p className="text-sm">Your personalized workspace with project feeds, milestones, and reputation tracking.</p>
              </div>
            </Link>

            <Link href="/dashboard/client">
              <div className="mh-card h-full group p-6">
                <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl mb-4 w-fit">
                  <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Client Command →</h3>
                <p className="text-sm">Manage projects, track progress, and collaborate with talented freelancers.</p>
              </div>
            </Link>

            <Link href="/community">
              <div className="mh-card h-full group p-6">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mb-4 w-fit">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Creative Community →</h3>
                <p className="text-sm">Join vibrant forums, attend exclusive events, and build lasting professional networks.</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Authentication Section */}
        <section className="max-w-4xl mx-auto px-4 py-20">
          <div className="mh-section p-12">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Choose Your <span className="text-accent">Creative Path</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto mb-8">
                Whether you prefer traditional authentication or embrace the future with Web3 wallet connectivity
              </p>
              <div className="mh-divider-thick"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="mh-card text-center p-8">
                <div className="mb-6">
                  <div className="p-6 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl mx-auto mb-6 w-fit">
                    <svg className="w-12 h-12 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Traditional Access</h3>
                  <p className="mb-6">Secure email and password authentication for instant access to your CraftNexus workspace.</p>
                </div>
                <div className="mt-auto">
                  <Link href="/login" className="w-full">
                    <div className="mh-btn mh-btn-ghost w-full text-center">
                      Sign In Securely
                    </div>
                  </Link>
                </div>
              </div>

              <div className="mh-card text-center p-8">
                <div className="mb-6">
                  <div className="p-6 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl mx-auto mb-6 w-fit">
                    <svg className="w-12 h-12 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zM7.707 8.707L10 11l4.293-4.293a1 1 0 111.414 1.414L11 12.828a1 1 0 01-1.414 0L5.293 8.535a1 1 0 011.414-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Web3 Connection</h3>
                  <p className="mb-6">Connect your MetaMask or Web3 wallet for decentralized identity and blockchain-powered security.</p>
                </div>
                <div className="mt-auto">
                  <Link href="/signup" className="w-full">
                    <div className="mh-btn mh-btn-primary w-full text-center">
                      Connect Wallet
                    </div>
                  </Link>
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
