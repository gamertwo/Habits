'use client';

import { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Define custom node types
const nodeTypes = {};

export default function StrategicFlowChart({ currentProject, completedPomodoros }) {
  // Generate nodes and edges based on the current project
  const generateNodesAndEdges = useCallback(() => {
    if (!currentProject) {
      // Default nodes when no project is selected
      return {
        nodes: [
          {
            id: 'no-project',
            type: 'default',
            data: { label: 'Select a project to visualize your strategic flow' },
            position: { x: 150, y: 100 },
            style: {
              background: '#1E293B',
              color: 'white',
              border: '1px solid #3B82F6',
              borderRadius: '8px',
              padding: '10px',
              width: 300,
            }
          }
        ],
        edges: []
      };
    }

    // When a project is selected, create a strategic flow chart
    let generatedNodes = [];
    let generatedEdges = [];
    
    // Main goal node
    generatedNodes.push({
      id: 'goal',
      type: 'default',
      data: { label: currentProject.name },
      position: { x: 150, y: 0 },
      style: {
        background: 'linear-gradient(135deg, #4338CA, #6366F1)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
        width: 180,
      },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom
    });
    
    // Create milestone nodes
    const milestoneCount = currentProject.milestones?.length || 3;
    
    for (let i = 0; i < milestoneCount; i++) {
      const milestoneName = currentProject.milestones?.[i]?.name || `Milestone ${i+1}`;
      const milestoneProgress = currentProject.milestones?.[i]?.progress || 0;
      
      // Determine color based on progress or completion
      let bgColor = "#1F2937"; // default dark color
      
      if (completedPomodoros >= (i+1) * 4) {
        bgColor = "linear-gradient(135deg, #047857, #10B981)"; // completed
      } else if (i === Math.floor(completedPomodoros / 4)) {
        bgColor = "linear-gradient(135deg, #B45309, #F59E0B)"; // in progress
      }
      
      generatedNodes.push({
        id: `milestone-${i}`,
        type: 'default',
        data: { 
          label: (
            <>
              <div>{milestoneName}</div>
              <div className="text-xs mt-1">{Math.min(100, milestoneProgress + (completedPomodoros * 5))}% complete</div>
            </>
          ) 
        },
        position: { x: 150, y: 100 + (i * 100) },
        style: {
          background: bgColor,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px',
          width: 180,
        },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom
      });
      
      // Connect to previous node
      if (i === 0) {
        generatedEdges.push({
          id: `edge-goal-milestone-${i}`,
          source: 'goal',
          target: `milestone-${i}`,
          animated: completedPomodoros >= (i+1) * 4,
          style: { stroke: '#4338CA' }
        });
      } else {
        generatedEdges.push({
          id: `edge-milestone-${i-1}-${i}`,
          source: `milestone-${i-1}`,
          target: `milestone-${i}`,
          animated: completedPomodoros >= (i+1) * 4,
          style: { stroke: '#4338CA' }
        });
      }
      
      // Create task nodes for each milestone
      const taskCount = currentProject.milestones?.[i]?.tasks?.length || 2;
      
      for (let j = 0; j < taskCount; j++) {
        const taskName = currentProject.milestones?.[i]?.tasks?.[j]?.name || `Task ${j+1}`;
        const isCompleted = completedPomodoros >= (i * 4) + j + 1;
        
        generatedNodes.push({
          id: `task-${i}-${j}`,
          type: 'default',
          data: { 
            label: (
              <>
                <div>{taskName}</div>
                <div className="text-xs mt-1">{isCompleted ? "Completed" : "Pending"}</div>
              </>
            ) 
          },
          position: { x: 300 + (j * 160), y: 100 + (i * 100) },
          style: {
            background: isCompleted ? "#1E40AF" : "#374151",
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            width: 150,
          },
          targetPosition: Position.Left
        });
        
        generatedEdges.push({
          id: `edge-milestone-${i}-task-${i}-${j}`,
          source: `milestone-${i}`,
          target: `task-${i}-${j}`,
          animated: isCompleted,
          style: { stroke: isCompleted ? '#10B981' : '#6B7280' }
        });
      }
    }
    
    return { nodes: generatedNodes, edges: generatedEdges };
  }, [currentProject, completedPomodoros]);
  
  const { nodes: initialNodes, edges: initialEdges } = generateNodesAndEdges();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Strategic Vision Map</h2>
      
      <div style={{ height: 400 }} className="rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#64748B" gap={16} />
          <Controls />
          <MiniMap 
            nodeStrokeColor={(n) => {
              return '#fff';
            }}
            nodeColor={(n) => {
              return n.style?.background || '#1E293B';
            }}
            nodeBorderRadius={8}
          />
        </ReactFlow>
      </div>
    </div>
  );
}