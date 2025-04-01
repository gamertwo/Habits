'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  ConnectionLineType,
  MarkerType,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node component with handles and editable content
const CustomNode = ({ data, id, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nodeLabel, setNodeLabel] = useState(data.label || '');
  const [nodeSubline, setNodeSubline] = useState(data.subline || '');
  const [nodeProgress, setNodeProgress] = useState(data.progress || 0);
  const inputRef = useRef(null);

  // Apply node changes when editing is complete
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleLabelChange = (e) => {
    setNodeLabel(e.target.value);
    data.label = e.target.value;
  };

  const handleSublineChange = (e) => {
    setNodeSubline(e.target.value);
    data.subline = e.target.value;
  };

  const handleProgressChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.min(100, Math.max(0, value));
    setNodeProgress(clampedValue);
    data.progress = clampedValue;
  };

  const startEditing = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const stopEditing = () => {
    setIsEditing(false);
  };

  return (
    <div 
      className={`px-4 py-3 shadow-lg rounded-md ${data.nodeColor || 'bg-gray-800'} border-2 ${
        selected ? 'border-white' : data.borderColor || 'border-indigo-500'
      } transition-all duration-200 ${selected ? 'scale-105' : ''}`}
      onDoubleClick={startEditing}
      onBlur={stopEditing}
      style={{ minWidth: '150px' }}
    >
      {/* Top handle (input connection) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      
      {/* Bottom handle (output connection) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      
      {/* Left handle (alternative input) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      
      {/* Right handle (alternative output) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      {data.icon && (
        <div className="flex justify-center mb-2">
          <span className={`text-xl ${data.iconColor || 'text-indigo-400'}`}>{data.icon}</span>
        </div>
      )}
      
      {isEditing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            value={nodeLabel}
            onChange={handleLabelChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm text-center"
            placeholder="Node title"
          />
          
          <input
            type="text"
            value={nodeSubline}
            onChange={handleSublineChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs text-center"
            placeholder="Description (optional)"
          />
          
          {data.progress !== undefined && (
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="100"
                value={nodeProgress}
                onChange={handleProgressChange}
                className="w-full"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={nodeProgress}
                onChange={handleProgressChange}
                className="w-14 bg-gray-700 text-white border border-gray-600 rounded px-1 py-0.5 text-xs"
              />
            </div>
          )}
          
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-1 text-xs font-medium"
            onClick={stopEditing}
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="font-bold text-center text-white">{data.label}</div>
          {data.subline && (
            <div className="text-xs text-center text-gray-300 mt-1">{data.subline}</div>
          )}
          {data.progress !== undefined && (
            <div className="mt-3">
              <div className="h-1.5 bg-gray-700 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                  style={{ width: `${data.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-right mt-1">{data.progress}%</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Node types definition
const nodeTypes = {
  custom: CustomNode,
};

export default function StrategicFlowPage() {
  const router = useRouter();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeDragging, setNodeDragging] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showNodePanel, setShowNodePanel] = useState(true);
  const [flowName, setFlowName] = useState('My Strategic Flow');
  const [savedFlows, setSavedFlows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadPrompt, setLoadPrompt] = useState(false);
  const [editNodePanel, setEditNodePanel] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Node templates for dragging
  const nodeTemplates = [
    { 
      type: 'custom', 
      data: { 
        label: 'Strategic Goal',
        subline: 'Main objective',
        icon: '🎯',
        nodeColor: 'bg-indigo-900',
        borderColor: 'border-indigo-400',
        iconColor: 'text-indigo-300'
      } 
    },
    { 
      type: 'custom', 
      data: { 
        label: 'Milestone',
        subline: 'Key achievement',
        icon: '🏁',
        nodeColor: 'bg-purple-900',
        borderColor: 'border-purple-400',
        iconColor: 'text-purple-300',
        progress: 0
      } 
    },
    { 
      type: 'custom', 
      data: { 
        label: 'Task',
        subline: 'Action item',
        icon: '✓',
        nodeColor: 'bg-blue-900',
        borderColor: 'border-blue-400',
        iconColor: 'text-blue-300',
        progress: 0
      } 
    },
    { 
      type: 'custom', 
      data: { 
        label: 'Resource',
        subline: 'Required asset',
        icon: '📊',
        nodeColor: 'bg-emerald-900',
        borderColor: 'border-emerald-400',
        iconColor: 'text-emerald-300'
      } 
    },
    { 
      type: 'custom', 
      data: { 
        label: 'Blocker',
        subline: 'Potential obstacle',
        icon: '⚠️',
        nodeColor: 'bg-rose-900',
        borderColor: 'border-rose-400',
        iconColor: 'text-rose-300'
      } 
    },
    { 
      type: 'custom', 
      data: { 
        label: 'Decision Point',
        subline: 'Strategic choice',
        icon: '🔄',
        nodeColor: 'bg-amber-900',
        borderColor: 'border-amber-400',
        iconColor: 'text-amber-300'
      } 
    },
  ];

  // Load flows from local storage
  useEffect(() => {
    const loadFlows = () => {
      try {
        const savedFlowsData = localStorage.getItem('strategicFlows');
        if (savedFlowsData) {
          setSavedFlows(JSON.parse(savedFlowsData));
        }
      } catch (error) {
        console.error('Error loading saved flows:', error);
      }
    };

    const loadCurrentFlow = () => {
      try {
        const currentFlow = localStorage.getItem('currentFlow');
        if (currentFlow) {
          const { name, nodes: savedNodes, edges: savedEdges } = JSON.parse(currentFlow);
          setFlowName(name || 'My Strategic Flow');
          setNodes(savedNodes || []);
          setEdges(savedEdges || []);
        }
      } catch (error) {
        console.error('Error loading current flow:', error);
      }
    };

    loadFlows();
    loadCurrentFlow();
  }, [setNodes, setEdges]);

  // Auto save current flow
  useEffect(() => {
    const autoSave = () => {
      try {
        const flowData = {
          name: flowName,
          nodes,
          edges,
          lastSaved: new Date().toISOString(),
        };
        localStorage.setItem('currentFlow', JSON.stringify(flowData));
      } catch (error) {
        console.error('Error auto-saving flow:', error);
      }
    };

    const timerId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timerId);
  }, [nodes, edges, flowName]);

  // Update selected node when selection changes
  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        setSelectedNode(node);
      }
    } else {
      setSelectedNode(null);
      setEditNodePanel(false);
    }
  }, [selectedNodeId, nodes]);

  // Handle edge connections
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#4338CA' },
      type: 'smoothstep',
      markerEnd: { 
        type: MarkerType.ArrowClosed,
        color: '#4338CA',
      }
    }, eds)),
    [setEdges]
  );
  
  // Handle node drag from template panel
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
    setNodeDragging(true);
  };
  
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setNodeDragging(false);
      
      // Get drop position and node data
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      try {
        const nodeType = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const id = `node_${Date.now()}`;
        
        // Create new node
        const newNode = {
          id,
          type: nodeType.type,
          position,
          data: { 
            ...nodeType.data,
            label: `${nodeType.data.label}` 
          },
        };
        
        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error('Error adding new node:', error);
      }
    },
    [reactFlowInstance, setNodes]
  );

  // Handle node selection
  const onSelectionChange = useCallback(({ nodes }) => {
    if (nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  // Handle node deletion
  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) => eds.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      ));
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, setNodes, setEdges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === 'Delete') && selectedNodeId) {
        deleteSelectedNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteSelectedNode, selectedNodeId]);

  // Update node data
  const updateNodeData = (key, value) => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              [key]: value,
            },
          };
        }
        return node;
      })
    );
  };

  // Save current flow
  const saveFlow = () => {
    try {
      setSaving(true);
      
      // Create flow data object
      const flowData = {
        id: `flow_${Date.now()}`,
        name: flowName,
        nodes,
        edges,
        created: new Date().toISOString(),
      };
      
      // Add to saved flows
      const newSavedFlows = [...savedFlows, flowData];
      setSavedFlows(newSavedFlows);
      
      // Update localStorage
      localStorage.setItem('strategicFlows', JSON.stringify(newSavedFlows));
      
      // Show success message
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error('Error saving flow:', error);
      setSaving(false);
    }
  };

  // Load a saved flow
  const loadFlow = (flowId) => {
    try {
      const flowToLoad = savedFlows.find(flow => flow.id === flowId);
      if (flowToLoad) {
        setFlowName(flowToLoad.name);
        setNodes(flowToLoad.nodes);
        setEdges(flowToLoad.edges);
      }
      setLoadPrompt(false);
    } catch (error) {
      console.error('Error loading flow:', error);
    }
  };

  // Delete a saved flow
  const deleteFlow = (flowId, e) => {
    e.stopPropagation();
    try {
      const updatedFlows = savedFlows.filter(flow => flow.id !== flowId);
      setSavedFlows(updatedFlows);
      localStorage.setItem('strategicFlows', JSON.stringify(updatedFlows));
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  // Create a new flow
  const createNewFlow = () => {
    setFlowName('New Strategic Flow');
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top navigation bar */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-4">Strategic Flow Builder</h1>
            <input 
              type="text" 
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Save button */}
            <button 
              onClick={saveFlow}
              disabled={saving}
              className={`px-4 py-2 rounded-md font-medium ${
                saving ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } transition-colors`}
            >
              {saving ? '✓ Saved' : 'Save Flow'}
            </button>
            
            {/* Load button */}
            <button 
              onClick={() => setLoadPrompt(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
            >
              Load Flow
            </button>
            
            {/* New button */}
            <button 
              onClick={createNewFlow}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-white font-medium"
            >
              New Flow
            </button>

            {/* Return to dashboard */}
            <Link href="/" className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium">
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main flow editor */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          snapToGrid={true}
          snapGrid={[10, 10]}
          defaultZoom={1}
          fitView
          attributionPosition="bottom-right"
          style={{ background: '#111827' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            color="#334155" 
            gap={20} 
            size={1} 
            variant="dots" 
          />
          <Controls 
            position="bottom-left"
            showInteractive={false}
            className="bg-gray-800 border border-gray-700 rounded-md"
          />
          
          
          {/* Node template panel */}
          <Panel 
            position="top-center" 
            className={`${showNodePanel ? 'bg-gray-800' : 'bg-gray-800 bg-opacity-50'} p-3 rounded-lg shadow-xl border border-gray-700 mt-2 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-sm">Drag nodes to the canvas</h3>
              <button 
                onClick={() => setShowNodePanel(!showNodePanel)}
                className="text-gray-400 hover:text-white text-sm"
              >
                {showNodePanel ? 'Minimize' : 'Expand'}
              </button>
            </div>
            
            {showNodePanel && (
              <>
                <div className="flex gap-3 justify-center flex-wrap">
                  {nodeTemplates.map((nodeTemplate, index) => (
                    <div
                      key={index}
                      onDragStart={(event) => onDragStart(event, nodeTemplate)}
                      draggable
                      className={`cursor-grab px-3 py-2 rounded-md ${nodeTemplate.data.nodeColor} ${nodeTemplate.data.borderColor} border-2 text-center shadow-lg transform hover:scale-105 transition-transform`}
                      style={{ opacity: nodeDragging ? 0.6 : 1 }}
                    >
                      <div className={`text-lg ${nodeTemplate.data.iconColor}`}>{nodeTemplate.data.icon}</div>
                      <div className="text-xs font-medium text-white mt-1">{nodeTemplate.data.label}</div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                  <p>Double-click on a node to edit its properties</p>
                  {selectedNodeId && (
                    <button 
                      onClick={deleteSelectedNode}
                      className="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-100 rounded"
                    >
                      Delete Selected
                    </button>
                  )}
                </div>
              </>
            )}
          </Panel>
          
          {/* Node edit panel - appears when a node is selected */}
          {selectedNode && (
            <Panel 
              position="top-right" 
              className="bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 mt-2 mr-2 max-w-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm">Edit Node</h3>
                <button 
                  onClick={() => setEditNodePanel(!editNodePanel)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  {editNodePanel ? 'Minimize' : 'Expand'}
                </button>
              </div>
              
              {editNodePanel ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Node Title</label>
                    <input
                      type="text"
                      value={selectedNode.data.label}
                      onChange={(e) => updateNodeData('label', e.target.value)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={selectedNode.data.subline || ''}
                      onChange={(e) => updateNodeData('subline', e.target.value)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  {selectedNode.data.progress !== undefined && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Progress: {selectedNode.data.progress}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedNode.data.progress}
                        onChange={(e) => updateNodeData('progress', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <button 
                      onClick={deleteSelectedNode}
                      className="w-full px-2 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
                    >
                      Delete Node
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-300">
                  <p>{selectedNode.data.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedNode.data.subline || 'No description'}</p>
                </div>
              )}
            </Panel>
          )}
          
          {/* Helpful tips panel */}
          <Panel position="bottom-right" className="bg-gray-800 bg-opacity-75 p-3 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-300 space-y-1">
              <p>✏️ <strong>Edit:</strong> Double-click any node</p>
              <p>🖱️ <strong>Delete:</strong> Select node + press Delete</p>
              <p>🔄 <strong>Connect:</strong> Drag between connection points</p>
              <p>🧲 <strong>Pan:</strong> Drag empty space | <strong>Zoom:</strong> Scroll wheel</p>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Load flow modal */}
      {loadPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Load Saved Flow</h2>
            
            {savedFlows.length === 0 ? (
              <p className="text-gray-400">You donot have any saved flows yet.</p>
            ) : (
              <div className="space-y-3">
                {savedFlows.map((flow) => (
                  <div 
                    key={flow.id} 
                    className="p-3 border border-gray-700 rounded-lg hover:bg-gray-700 cursor-pointer"
                    onClick={() => loadFlow(flow.id)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{flow.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => loadFlow(flow.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                          Load
                        </button>
                        <button 
                          onClick={(e) => deleteFlow(flow.id, e)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Created: {formatDate(flow.created)}</p>
                    <p className="text-xs text-gray-400">{flow.nodes.length} nodes, {flow.edges.length} connections</p>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6 space-x-3">
              <button 
                onClick={() => setLoadPrompt(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}