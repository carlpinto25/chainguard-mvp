import './globals.css';

export const metadata = {
  title: 'ChainGuard — Transaction control room',
  description: 'A working local demo of transaction-level safety for enterprise AI agents.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
