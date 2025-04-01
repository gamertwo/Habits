'use client';

import { useState, useEffect } from 'react';

export default function AnimeAvatar({ phase, completedPomodoros }) {
  const [character, setCharacter] = useState('lelouch');
  const [quote, setQuote] = useState('');
  
  // Characters data with images and quotes for different phases
  const characters = {
    lelouch: {
      name: 'Lelouch vi Britannia',
      source: 'Code Geass',
      imageUrl: '/images/lelouch.png', // You would need to add these images
      quotes: {
        planning: "If the king doesn't lead, how can he expect his subordinates to follow?",
        focus: "The only ones who should kill are those prepared to be killed!",
        break: "A chess piece that cannot move is of no use to anyone.",
        review: "You can't change the world without getting your hands dirty."
      }
    },
    L: {
      name: 'L Lawliet',
      source: 'Death Note',
      imageUrl: '/images/L.png',
      quotes: {
        planning: "There's a 97% chance this approach will work.",
        focus: "I'm not doing this because I want to. I'm doing this because I have to.",
        break: "It's not a sense of justice. Figuring out difficult cases is my hobby.",
        review: "Let's use our heads. Together we can accomplish anything."
      }
    },
    shikamaru: {
      name: 'Shikamaru Nara',
      source: 'Naruto',
      imageUrl: '/images/shikamaru.png',
      quotes: {
        planning: "Such a drag... but I'll come up with 200 possible scenarios.",
        focus: "The more complicated something seems, the simpler the answer usually is.",
        break: "Sometimes I wish I was just a cloud, floating along.",
        review: "Focusing on one thing at a time is the quickest path to success."
      }
    },
    senku: {
      name: 'Senku Ishigami',
      source: 'Dr. Stone',
      imageUrl: '/images/senku.png',
      quotes: {
        planning: "I'll solve this problem with the power of science!",
        focus: "One million percent certain this will work!",
        break: "Even scientists need to rest to keep their minds sharp.",
        review: "Every failure is just a step toward success."
      }
    }
  };
  
  // Change character based on completed pomodoros
  useEffect(() => {
    if (completedPomodoros >= 0 && completedPomodoros < 10) {
      setCharacter('lelouch');
    } else if (completedPomodoros >= 10 && completedPomodoros < 20) {
      setCharacter('L');
    } else if (completedPomodoros >= 20 && completedPomodoros < 30) {
      setCharacter('shikamaru');
    } else {
      setCharacter('senku');
    }
  }, [completedPomodoros]);
  
  // Update quote based on phase and character
  useEffect(() => {
    setQuote(characters[character].quotes[phase] || characters[character].quotes.focus);
  }, [phase, character]);
  
  return (
    <div className="flex items-center space-x-3">
      <div>
        <p className="text-right text-xs text-gray-400">Strategic Advisor:</p>
        <p className="text-right font-semibold">{characters[character].name}</p>
        <p className="text-right text-xs text-gray-400">{characters[character].source}</p>
      </div>
      
      <div className="relative">
        {/* Character image - in production, replace with actual anime character images */}
        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
          {/* This would be a real image in production */}
          <div className="text-2xl font-bold">
            {character === 'lelouch' && 'L'}
            {character === 'L' && 'L'}
            {character === 'shikamaru' && 'S'}
            {character === 'senku' && 'S'}
          </div>
        </div>
        
        {/* Quote bubble */}
        {quote && (
          <div className="absolute left-16 top-0 w-64 bg-gray-800 px-3 py-2 rounded-lg text-sm">
            {quote}
            <div className="absolute left-0 top-3 -ml-2 w-0 h-0 border-t-4 border-r-8 border-b-4 border-transparent border-r-gray-800"></div>
          </div>
        )}
      </div>
    </div>
  );
}