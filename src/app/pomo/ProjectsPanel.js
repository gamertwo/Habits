'use client';

import { useState } from 'react';

export default function ProjectsPanel({ onProjectSelect, currentProject }) {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  // Sample projects data - in a real app, this would come from a database
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Master Plan Implementation',
      description: 'Execute the strategic vision for world domination',
      estimatedPomodoros: 20,
      completedPomodoros: 5,
      milestones: [
        {
          name: 'Initial Research',
          progress: 75,
          tasks: [
            { name: 'Gather intelligence', completed: true },
            { name: 'Analyze weaknesses', completed: false }
          ]
        },
        {
          name: 'Strategic Development',
          progress: 30,
          tasks: [
            { name: 'Create blueprint', completed: false },
            { name: 'Develop contingencies', completed: false }
          ]
        },
        {
          name: 'Execution Phase',
          progress: 0,
          tasks: [
            { name: 'Deploy resources', completed: false },
            { name: 'Monitor outcomes', completed: false }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Knowledge Acquisition',
      description: 'Expand intellectual framework for future endeavors',
      estimatedPomodoros: 15,
      completedPomodoros: 3,
      milestones: [
        {
          name: 'Core Concept Mastery',
          progress: 50,
          tasks: [
            { name: 'Study fundamentals', completed: true },
            { name: 'Apply concepts', completed: false }
          ]
        },
        {
          name: 'Advanced Applications',
          progress: 10,
          tasks: [
            { name: 'Experimental testing', completed: false },
            { name: 'Refine approach', completed: false }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'System Architecture',
      description: 'Design and implement optimal efficiency systems',
      estimatedPomodoros: 25,
      completedPomodoros: 0,
      milestones: [
        {
          name: 'Blueprint Creation',
          progress: 5,
          tasks: [
            { name: 'Draft initial design', completed: false },
            { name: 'Review and optimize', completed: false }
          ]
        },
        {
          name: 'Component Integration',
          progress: 0,
          tasks: [
            { name: 'Develop modules', completed: false },
            { name: 'Test integration', completed: false }
          ]
        },
        {
          name: 'Deployment Strategy',
          progress: 0,
          tasks: [
            { name: 'Create rollout plan', completed: false },
            { name: 'Execute implementation', completed: false }
          ]
        }
      ]
    }
  ]);
  
  const handleAddProject = () => {
    if (newProjectName.trim() === '') return;
    
    const newProject = {
      id: projects.length + 1,
      name: newProjectName,
      description: 'New strategic initiative',
      estimatedPomodoros: 10,
      completedPomodoros: 0,
      milestones: [
        {
          name: 'Initial Phase',
          progress: 0,
          tasks: [
            { name: 'First task', completed: false },
            { name: 'Second task', completed: false }
          ]
        }
      ]
    };
    
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setIsAddingProject(false);
  };
  
  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Strategic Projects</h2>
        <button 
          onClick={() => setIsAddingProject(!isAddingProject)}
          className="p-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
        >
          {isAddingProject ? 'Cancel' : '+ New'}
        </button>
      </div>
      
      {isAddingProject && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            className="w-full p-2 mb-2 bg-gray-900 border border-gray-600 rounded-md text-white"
          />
          <button
            onClick={handleAddProject}
            className="w-full p-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white"
          >
            Add Project
          </button>
        </div>
      )}
      
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => onProjectSelect(project)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              currentProject?.id === project.id 
                ? 'bg-indigo-900 border border-indigo-600' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-bold">{project.name}</h3>
              <span className="text-xs bg-gray-900 px-2 py-1 rounded-md">
                {Math.floor((project.completedPomodoros / project.estimatedPomodoros) * 100) || 0}%
              </span>
            </div>
            
            <p className="text-sm text-gray-400 mt-1">{project.description}</p>
            
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${(project.completedPomodoros / project.estimatedPomodoros) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>{project.completedPomodoros} / {project.estimatedPomodoros} pomodoros</span>
                <span>{project.milestones.length} milestones</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}