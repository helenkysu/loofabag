import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'myloofabag - Finding Made Fun',
  description: 'Wear your loofa and meet your people with a fun, modern landing page.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
