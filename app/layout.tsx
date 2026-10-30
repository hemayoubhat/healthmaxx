import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '../components/ThemeProvider';

export const metadata: Metadata = {
  title: 'HealthMaxx',
  description: 'Science-based health optimization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}