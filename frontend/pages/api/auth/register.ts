import type { NextApiRequest, NextApiResponse } from 'next'

type RegisterData = {
  email: string
  password: string
  full_name: string
  role: string
}

type RegisterResponse = {
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
  res: NextApiResponse<RegisterResponse | { message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password, full_name, role }: RegisterData = req.body

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const upstream = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, role }),
    }).catch(error => {
      console.error('Fetch error:', error);
      throw new Error('Failed to connect to the registration service.');
    });

    if (!upstream.ok) {
      console.error('Backend response not OK:', upstream.status);
      let errorMessage = 'Registration failed';
      try {
        const errorData = await upstream.json();
        console.error('Backend error details:', errorData);
        errorMessage = errorData.detail || errorData.message || 'Registration failed';
      } catch (e) {
        const text = await upstream.text();
        console.error('Backend error text:', text);
      }
      return res.status(upstream.status).json({ message: errorMessage });
    }

    const data = await upstream.json();

    const response: RegisterResponse = {
      token: data.token || data.access_token || '',
      user: {
        id: data.id || data.user?.id || '',
        email: data.email || data.user?.email || email,
        full_name: data.full_name || data.user?.full_name || full_name,
        role: data.role || data.user?.role || role,
      },
    }

    return res.status(201).json(response)
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}