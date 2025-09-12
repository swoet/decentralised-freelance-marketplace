import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AdminAuthProvider } from '../context/AdminAuthContext';

function AdminApp({ Component, pageProps }: AppProps) {
  return (
    <AdminAuthProvider>
      <Component {...pageProps} />
    </AdminAuthProvider>
  );
}

export default AdminApp;
