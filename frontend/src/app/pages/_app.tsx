import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import socketService from '../utils/socket';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  return <Component {...pageProps} />;
}