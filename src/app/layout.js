import { DM_Sans, Lora, JetBrains_Mono } from 'next/font/google';
import LocalApiInstaller from './LocalApiInstaller';
import './globals.css';
import Navbar from '../components/Navbar';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata = {
  title: 'Habit App',
  description: 'Habits system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${lora.variable} ${jetBrainsMono.variable}`}>
        <LocalApiInstaller />
        <Navbar />
        <main className="pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
