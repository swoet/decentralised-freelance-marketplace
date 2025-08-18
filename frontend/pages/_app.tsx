import React from 'react';
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <>
        <Toaster />
        <Component {...pageProps} />
      </>
    </AuthProvider>
  )
} 