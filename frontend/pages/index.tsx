import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'

const Home: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <Head>
        <title>Decentralized Freelance Marketplace</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-gray-800">
          Welcome to the Future of Work
        </h1>

        <p className="mt-3 text-2xl text-gray-600">
          A decentralized marketplace connecting clients and freelancers securely.
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link href="/projects"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-2xl font-bold">Browse Projects &rarr;</h3>
            <p className="mt-4 text-xl">
              Find your next project and start bidding.
            </p>
          </Link>

          <Link href="/signup"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-2xl font-bold">Get Started &rarr;</h3>
            <p className="mt-4 text-xl">
              Create your account and join the marketplace.
            </p>
          </Link>

          <Link href="/login"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-2xl font-bold">Sign In &rarr;</h3>
            <p className="mt-4 text-xl">
              Access your dashboard and manage your work.
            </p>
          </Link>

          <a
            href="https://github.com/your-repo/decentralized-freelance-marketplace"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-2xl font-bold">Documentation &rarr;</h3>
            <p className="mt-4 text-xl">
              Learn about the architecture and how to contribute.
            </p>
          </a>
        </div>

        {/* Authentication Options */}
        <div className="mt-12 max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Choose Your Authentication Method
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Traditional Login</h3>
              <p className="text-gray-600 mb-4">
                Use email and password for quick access to your account.
              </p>
              <Link href="/login" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                Sign In
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Web3 Wallet</h3>
              <p className="text-gray-600 mb-4">
                Connect your MetaMask or other Web3 wallet for decentralized identity.
              </p>
              <Link href="/signup" className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Connect Wallet
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home 