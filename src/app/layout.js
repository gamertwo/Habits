import { Inter } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import './globals.css';
import Navbar from '../components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Habit App',
  description: 'Habits system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="pb-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
