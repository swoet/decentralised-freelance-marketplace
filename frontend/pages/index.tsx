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
        <title>Artisan Marketplace - Handcrafted Excellence in Freelancing</title>
        <meta name="description" content="A decentralized marketplace celebrating the art of freelancing with handcrafted excellence" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Artisan Craft Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+Pro:wght@400;500&family=Crimson+Text:wght@400;600&display=swap" 
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <Motion preset="slideInDown" className="text-center py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="heading-craft text-6xl md:text-7xl font-display font-bold text-mahogany-800 mb-6">
              Welcome to the Future of Work
            </h1>
            <p className="body-craft text-xl md:text-2xl text-copper-700 max-w-3xl mx-auto leading-relaxed">
              A decentralized marketplace celebrating the art of freelancing, where every project is crafted with excellence and every connection is built on trust.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/projects">
                <Button variant="primary" size="lg" shape="wax" className="min-w-48">
                  Explore Projects
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="accent" size="lg" shape="wax" className="min-w-48">
                  Join the Community
                </Button>
              </Link>
            </div>
          </div>
        </Motion>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <Stagger staggerDelay={150} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Motion preset="scaleIn">
              <Link href="/projects">
                <Card variant="leather" interactive="hover" className="h-full group">
                  <CardHeader>
                    <div className="p-3 bg-forest-100 rounded-organic-craft mb-4 w-fit">
                      <svg className="w-8 h-8 text-forest-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <CardTitle className="group-hover:text-copper-600 transition-colors">Browse Projects →</CardTitle>
                    <CardDescription>Find your next project and start bidding.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Motion>

            <Motion preset="scaleIn" transition={{ delay: 100 }}>
              <Link href="/dashboard/freelancer">
                <Card variant="parchment" interactive="hover" className="h-full group">
                  <CardHeader>
                    <div className="p-3 bg-gold-100 rounded-organic-leaf mb-4 w-fit">
                      <svg className="w-8 h-8 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                    <CardTitle className="group-hover:text-copper-600 transition-colors">Freelancer Dashboard →</CardTitle>
                    <CardDescription>Personalized feed, milestones, reputation.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Motion>

            <Motion preset="scaleIn" transition={{ delay: 200 }}>
              <Link href="/dashboard/client">
                <Card variant="elevated" interactive="hover" className="h-full group">
                  <CardHeader>
                    <div className="p-3 bg-copper-100 rounded-organic-wax mb-4 w-fit">
                      <svg className="w-8 h-8 text-copper-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <CardTitle className="group-hover:text-copper-600 transition-colors">Client Dashboard →</CardTitle>
                    <CardDescription>Project pipeline, recommendations, escrow.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Motion>

            <Motion preset="scaleIn" transition={{ delay: 300 }}>
              <Link href="/community">
                <Card variant="default" interactive="hover" className="h-full group">
                  <CardHeader>
                    <div className="p-3 bg-bronze-100 rounded-organic-gentle mb-4 w-fit">
                      <svg className="w-8 h-8 text-bronze-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                    <CardTitle className="group-hover:text-copper-600 transition-colors">Community →</CardTitle>
                    <CardDescription>Forums, events, networking.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Motion>
          </Stagger>
        </div>

        {/* Authentication Section */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Motion preset="slideInUp" className="text-center mb-12">
            <h2 className="heading-craft text-3xl font-display font-bold text-mahogany-800 mb-4">
              Choose Your Path
            </h2>
            <p className="body-craft text-lg text-copper-700">
              Whether you prefer traditional authentication or embrace the future with Web3
            </p>
          </Motion>

          <Stagger staggerDelay={200} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Motion preset="scaleIn" transition={{ delay: 100 }}>
              <Card variant="filled" interactive="hover" className="text-center">
                <CardHeader>
                  <div className="p-4 bg-mahogany-100 rounded-organic-craft mx-auto mb-4 w-fit">
                    <svg className="w-10 h-10 text-mahogany-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <CardTitle>Traditional Login</CardTitle>
                  <CardDescription>Use email and password for quick access to your account.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/login" className="w-full">
                    <Button variant="secondary" size="lg" shape="wax" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </Motion>

            <Motion preset="scaleIn" transition={{ delay: 200 }}>
              <Card variant="filled" interactive="hover" className="text-center">
                <CardHeader>
                  <div className="p-4 bg-gold-100 rounded-organic-leaf mx-auto mb-4 w-fit">
                    <svg className="w-10 h-10 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zM7.707 8.707L10 11l4.293-4.293a1 1 0 111.414 1.414L11 12.828a1 1 0 01-1.414 0L5.293 8.535a1 1 0 011.414-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <CardTitle>Web3 Wallet</CardTitle>
                  <CardDescription>Connect your MetaMask or other Web3 wallet for decentralized identity.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/signup" className="w-full">
                    <Button variant="accent" size="lg" shape="wax" className="w-full">
                      Connect Wallet
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </Motion>
          </Stagger>
        </div>
      </div>
    </AppShell>
  )
}

export default Home 