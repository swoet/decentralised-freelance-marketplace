import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import AppShell from '../components/layout/AppShell'

const Home: NextPage = () => {
  return (
    <AppShell>
      <Head>
        <title>Decentralized Freelance Marketplace</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-800">Welcome to the Future of Work</h1>
        <p className="mt-3 text-xl text-gray-600">
          A decentralized marketplace connecting clients and freelancers securely.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/projects" className="p-6 text-left border rounded-xl hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold">Browse Projects →</h3>
          <p className="mt-2 text-gray-600">Find your next project and start bidding.</p>
        </Link>
        <Link href="/dashboard/freelancer" className="p-6 text-left border rounded-xl hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold">Freelancer Dashboard →</h3>
          <p className="mt-2 text-gray-600">Personalized feed, milestones, reputation.</p>
        </Link>
        <Link href="/dashboard/client" className="p-6 text-left border rounded-xl hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold">Client Dashboard →</h3>
          <p className="mt-2 text-gray-600">Project pipeline, recommendations, escrow.</p>
        </Link>
        <Link href="/community" className="p-6 text-left border rounded-xl hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold">Community →</h3>
          <p className="mt-2 text-gray-600">Forums, events, networking.</p>
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Traditional Login</h3>
          <p className="text-gray-600 mb-4">Use email and password for quick access to your account.</p>
          <Link href="/login" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">Sign In</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Web3 Wallet</h3>
          <p className="text-gray-600 mb-4">Connect your MetaMask or other Web3 wallet for decentralized identity.</p>
          <Link href="/signup" className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">Connect Wallet</Link>
        </div>
      </div>
    </AppShell>
  )
}

export default Home 