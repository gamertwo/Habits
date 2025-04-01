'use client';

export default function MastermindInsights({ insights }) {
  // Calculate INTJ-specific metrics
  const calculateMastermindRank = (level) => {
    if (level <= 1) return 'Tactical Beginner';
    if (level <= 3) return 'Strategic Thinker';
    if (level <= 5) return 'Master Planner';
    if (level <= 7) return 'Visionary Architect';
    return 'Supreme Strategist';
  };
  
  const mastermindRank = calculateMastermindRank(insights.mastermindLevel);
  
  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Mastermind Insights</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Completion Rate</p>
          <p className="text-2xl font-bold">{insights.completionRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Focus Efficiency</p>
          <p className="text-2xl font-bold">{insights.focusEfficiency} min</p>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Vision Progress</p>
          <p className="text-2xl font-bold">{insights.visionProgress.toFixed(1)}%</p>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Mastermind Level</p>
          <p className="text-2xl font-bold">{insights.mastermindLevel}</p>
        </div>
      </div>
      
      <div className="bg-indigo-900 bg-opacity-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-indigo-300">Strategic Rank</h3>
          <div className="bg-indigo-700 px-2 py-1 rounded text-xs">INTJ</div>
        </div>
        <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600">{mastermindRank}</p>
        
        <div className="mt-4 text-sm text-gray-300">
          <p>INTJ Strategic Analysis:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
            <li>Your systematic approach is yielding consistent results</li>
            <li>Current efficiency pattern indicates long-term success</li>
            <li>Consider allocating more time to vision refinement</li>
          </ul>
        </div>
      </div>
      
      {/* Additional insights section */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm">Efficiency Optimization</h3>
        <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full" 
            style={{ width: `${insights.completionRate}%` }}
          ></div>
        </div>
        
        <h3 className="font-bold text-sm">Strategic Clarity</h3>
        <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full" 
            style={{ width: `${Math.min(insights.focusEfficiency * 1.5, 100)}%` }}
          ></div>
        </div>
        
        <h3 className="font-bold text-sm">Implementation Progress</h3>
        <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full" 
            style={{ width: `${insights.visionProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}