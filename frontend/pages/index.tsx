import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import AppShell from '../components/layout/AppShell'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Motion,
  Stagger
} from '../components/artisan-craft'

const Home: NextPage = () => {
  return (
    <AppShell>
      <Head>
        <title>CraftNexus - Where Artisans Connect</title>
        <meta name="description" content="CraftNexus: The premier decentralized marketplace where skilled artisans connect with clients for handcrafted excellence" />
        
        {/* Fonts are now loaded globally in globals.css */}
      </Head>

      <div className="min-h-screen bg-white ac-animate-crisp">
        {/* Enhanced Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden mh-wood mh-allow-pseudo">
          {/* Clean mahogany wood background */}
          <div className="absolute inset-0"></div>
          
          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-4 h-4 bg-yellow-400 rounded-full opacity-20 craft-float" style={{left: '10%', top: '20%'}}></div>
            <div className="absolute w-3 h-3 bg-orange-400 rounded-full opacity-30 craft-float" style={{left: '80%', top: '30%', animationDelay: '1s'}}></div>
            <div className="absolute w-2 h-2 bg-yellow-500 rounded-full opacity-40 craft-float" style={{left: '70%', top: '80%', animationDelay: '0.5s'}}></div>
          </div>
          
          <Motion preset="slideInDown" className="max-w-6xl mx-auto relative z-10 text-center px-4">
            {/* Subtitle Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6 craft-shimmer-effect">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              🎨 New Platform Launch
            </div>
            
            {/* Main Title */}
            <h1 className="font-serif font-bold text-6xl md:text-8xl text-amber-900 mb-6 craft-typewriter">
              Welcome to <span className="text-yellow-600">CraftNexus</span>
            </h1>
            
            {/* Description */}
            <p className="text-xl md:text-2xl text-orange-700 max-w-4xl mx-auto leading-relaxed mb-10">
              Where Artisans Connect. The premier decentralized marketplace celebrating handcrafted excellence, where every project is a masterpiece and every connection builds lasting partnerships.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/projects">
                <Button variant="primary" size="lg" shape="wax" className="min-w-48 craft-magnetic craft-btn-interactive">
                  Explore Projects
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="accent" size="lg" shape="wax" className="min-w-48 craft-magnetic craft-btn-interactive">
                  Join the Community
                </Button>
              </Link>
            </div>
          </Motion>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 craft-float">
            <div className="w-6 h-10 border-2 border-yellow-500 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-yellow-500 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Grid */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          {/* Section Header */}
          <div className="mh-section p-8 mb-16">
            <Motion preset="slideInUp" className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Discover Your <span className="text-accent">Creative Path</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto">
                Whether you're seeking exceptional talent or offering your skills, CraftNexus connects you with the perfect match.
              </p>
              <div className="mh-divider-wood mt-8"></div>
            </Motion>
          </div>
          
          <Stagger staggerDelay={150} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 craft-stagger-container">
            <Motion preset="scaleIn">
                <Card variant="leather" interactive="hover" className="h-full group craft-card-hover craft-animate-crisp relative">
                  <div className="craft-card-glow"></div>
                  <CardHeader>
                    <div className="p-4 bg-gradient-to-br from-forest-100 to-forest-200 rounded-organic-craft mb-4 w-fit craft-shimmer-effect group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-forest-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <CardTitle className="group-hover:text-copper-600 transition-colors font-display text-xl">Browse Projects →</CardTitle>
                    <CardDescription className="text-craft-copper-600">Discover exceptional projects and start your creative journey with trusted clients.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Motion>

            <Motion preset="scaleIn" transition={{ delay: 100 }}>
              <Link href="/dashboard/freelancer">
                <Card variant="parchment" interactive="hover" className="h-full group craft-card-hover craft-animate-crisp relative">
                  <div className="craft-card-glow"></div>
                  <CardHeader>
                    <div className="p-4 bg-gradient-to-br from-gold-100 to-gold-200 rounded-organic-leaf mb-4 w-fit craft-shimmer-effect group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                    <CardTitle className="group-hover:text-copper-600 transition-colors font-display text-xl">Freelancer Hub →</CardTitle>
                    <CardDescription className="text-craft-copper-600">Your personalized workspace with project feeds, milestones, and reputation tracking.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Motion>

            <Motion preset="scaleIn" transition={{ delay: 200 }}>
              <Link href="/dashboard/client">
                <Card variant="elevated" interactive="hover" className="h-full group craft-card-hover craft-animate-crisp relative">
                  <div className="craft-card-glow"></div>
                  <CardHeader>
                    <div className="p-4 bg-gradient-to-br from-copper-100 to-copper-200 rounded-organic-wax mb-4 w-fit craft-shimmer-effect group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-copper-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <CardTitle className="group-hover:text-copper-600 transition-colors font-display text-xl">Client Command →</CardTitle>
                    <CardDescription className="text-craft-copper-600">Manage your project pipeline with smart recommendations and secure escrow systems.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Motion>

            <Motion preset="scaleIn" transition={{ delay: 300 }}>
              <Link href="/community">
                <Card variant="default" interactive="hover" className="h-full group craft-card-hover craft-animate-crisp relative">
                  <div className="craft-card-glow"></div>
                  <CardHeader>
                    <div className="p-4 bg-gradient-to-br from-bronze-100 to-bronze-200 rounded-organic-gentle mb-4 w-fit craft-shimmer-effect group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-bronze-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                    <CardTitle className="group-hover:text-copper-600 transition-colors font-display text-xl">Creative Community →</CardTitle>
                    <CardDescription className="text-craft-copper-600">Join vibrant forums, attend exclusive events, and build lasting professional networks.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Motion>
          </Stagger>
        </section>

        {/* Enhanced Authentication Section */}
        <section className="max-w-4xl mx-auto px-4 py-20">
          <div className="mh-section p-12">
            <Motion preset="slideInUp" className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Choose Your <span className="text-accent">Creative Path</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto mb-8">
                Whether you prefer traditional authentication or embrace the future with Web3 wallet connectivity
              </p>
              <div className="mh-divider-thick"></div>
            </Motion>

          <Stagger staggerDelay={200} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Motion preset="scaleIn" transition={{ delay: 100 }}>
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
            </Motion>

            <Motion preset="scaleIn" transition={{ delay: 200 }}>
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
            </Motion>
          </Stagger>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default Home