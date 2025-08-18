import type { NextApiRequest, NextApiResponse } from 'next'

type LoginData = {
  email: string
  password: string
}

type LoginResponse = {
  token: string
  user: {
    id: string
    email: string
    full_name: string
    role: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse | { message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password }: LoginData = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const form = new URLSearchParams({ username: email, password })
    const upstream = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })

    if (!upstream.ok) {
      const msg = await upstream.text()
      return res.status(upstream.status).json({ message: msg || 'Login failed' })
    }

    const data = await upstream.json()

    // Ensure required fields exist; default to empty strings
    const response: LoginResponse = {
      token: data.token || data.access_token || '',
      user: {
        id: data.user?.id || '',
        email: data.user?.email || email,
        full_name: data.user?.full_name || '',
        role: data.user?.role || 'client',
      },
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
