"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Calendar, Plus, BarChart, LineChart, Sword, Trophy, FileText, Timer, GitBranch, ChevronUp, Menu } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [dropupOpen, setDropupOpen] = useState(false);
  const dropupRef = useRef(null);

  // Close dropup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropupRef.current && !dropupRef.current.contains(event.target)) {
        setDropupOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropup when route changes
  useEffect(() => {
    setDropupOpen(false);
  }, [pathname]);

  const isActive = (path) => {
    return pathname === path ? "text-blue-400" : "text-gray-400 hover:text-gray-200";
  };

  const toggleDropup = () => {
    setDropupOpen(!dropupOpen);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 md:py-3 z-50">
      <div className="max-w-4xl mx-auto flex justify-around items-center">
        {/* Dropup Menu */}
        <div className="relative" ref={dropupRef}>
          <button
            onClick={toggleDropup}
            className={`flex flex-col items-center gap-1 ${dropupOpen ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Menu className="h-6 w-6" />
            <span className="text-xs">Tools</span>
          </button>
          
          {dropupOpen && (
            <div className="absolute bottom-full mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
              <div className="p-1">
                <Link 
                  href="/pdf-reader" 
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md"
                >
                  <FileText className="h-5 w-5" />
                  <span>PDF Reader</span>
                </Link>
                
                <Link 
                  href="/pomo" 
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md"
                >
                  <Timer className="h-5 w-5" />
                  <span>Pomodoro Timer</span>
                </Link>
                
                <Link 
                  href="/flow" 
                  className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md"
                >
                  <GitBranch className="h-5 w-5" />
                  <span>Strategic Flow</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
          <Plus className="h-6 w-6" />
          <span className="text-xs">Create</span>
        </Link>
        
        <Link href="/weekly" className={`flex flex-col items-center gap-1 ${isActive('/weekly')}`}>
          <Calendar className="h-6 w-6" />
          <span className="text-xs">Weekly</span>
        </Link>
        
        <Link href="/progress" className={`flex flex-col items-center gap-1 ${isActive('/progress')}`}>
          <BarChart className="h-6 w-6" />
          <span className="text-xs">Progress</span>
        </Link>
        
        <Link href="/rpg-progress" className={`flex flex-col items-center gap-1 ${isActive('/rpg-progress')}`}>
          <Sword className="h-6 w-6" />
          <span className="text-xs">RPG</span>
        </Link>

        <Link href="/analytics" className={`flex flex-col items-center gap-1 ${isActive('/analytics')}`}>
          <LineChart className="h-6 w-6" />
          <span className="text-xs">Analytics</span>
        </Link>
      </div>
    </nav>
  );
}