import type { NextApiRequest, NextApiResponse } from 'next'

type WalletRegisterData = {
  wallet_address: string
  fullName: string
  email: string
  role: string
  bio?: string
  skills?: string
  portfolio?: string
}

type WalletRegisterResponse = {
  token: string
  user: {
    id: string
    email: string
    full_name: string
    role: string
    wallet_address: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WalletRegisterResponse | { message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { wallet_address, fullName, email, role, bio, skills, portfolio }: WalletRegisterData = req.body

    if (!wallet_address || !fullName || !email || !role) {
      return res.status(400).json({ message: 'Wallet address, full name, email, and role are required' })
    }

    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const upstream = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: `${wallet_address}`,
        full_name: fullName,
        role,
        wallet_address,
        bio: bio || null,
        skills: skills || null,
        portfolio: portfolio || null,
      }),
    })

    if (!upstream.ok) {
      const msg = await upstream.text()
      return res.status(upstream.status).json({ message: msg || 'Wallet registration failed' })
    }

    const data = await upstream.json()
    const response: WalletRegisterResponse = {
      token: data.token || data.access_token || '',
      user: {
        id: data.id || data.user?.id || '',
        email: data.email || data.user?.email || email,
        full_name: data.full_name || data.user?.full_name || fullName,
        role: data.role || data.user?.role || role,
        wallet_address: wallet_address,
      },
    }

    return res.status(201).json(response)
  } catch (error) {
    console.error('Wallet registration error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
