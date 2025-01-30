"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Plus, CheckSquare, BarChart, LineChart } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname === path ? "text-blue-400" : "text-gray-400 hover:text-gray-200";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 md:py-3">
      <div className="max-w-4xl mx-auto flex justify-around items-center">
        <Link href="/track" className={`flex flex-col items-center gap-1 ${isActive('/track')}`}>
          <CheckSquare className="h-6 w-6" />
          <span className="text-xs">Track</span>
        </Link>
        
       
        
        <Link href="/progress" className={`flex flex-col items-center gap-1 ${isActive('/progress')}`}>
          <BarChart className="h-6 w-6" />
          <span className="text-xs">Progress</span>
        </Link>
        <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
          <Plus className="h-6 w-6" />
          <span className="text-xs">Create</span>
        </Link>
        <Link href="/weekly" className={`flex flex-col items-center gap-1 ${isActive('/weekly')}`}>
  <Calendar className="h-6 w-6" />
  <span className="text-xs">Weekly</span>
</Link>
        <Link href="/analytics" className={`flex flex-col items-center gap-1 ${isActive('/analytics')}`}>
          <LineChart className="h-6 w-6" />
          <span className="text-xs">Analytics</span>
        </Link>
      </div>
    </nav>
  );
}
