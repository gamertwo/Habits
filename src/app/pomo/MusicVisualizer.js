'use client';

import { useState, useEffect, useRef } from 'react';

export default function SimplifiedMusicVisualizer() {
  const [isListening, setIsListening] = useState(false);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialize audio context
  useEffect(() => {
    // Clean up function
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Setup audio analyzer and start visualization
  const startListening = async () => {
    try {
      // If we already have an active audio context, close it
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      // Get audio from microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create new audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyzer node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Create data array for frequency data
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // Create source from microphone stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Connect source to analyzer
      sourceRef.current.connect(analyserRef.current);
      
      // Set state to listening
      setIsListening(true);
      
      // Start visualization loop
      requestAnimationFrame(drawVisualizer);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };
  
  // Stop audio visualization
  const stopListening = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsListening(false);
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  
  // Draw visualization on canvas
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(drawVisualizer);
      return;
    }
    
    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with semi-transparent background for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate center of canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate average frequency value for the RGB color
    const frequencyData = dataArrayRef.current;
    const avgFrequency = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
    
    // Calculate separate frequency bands for RGB
    const lowEnd = frequencyData.slice(0, 8).reduce((sum, value) => sum + value, 0) / 8;
    const midRange = frequencyData.slice(8, 24).reduce((sum, value) => sum + value, 0) / 16;
    const highEnd = frequencyData.slice(24, 64).reduce((sum, value) => sum + value, 0) / 40;
    
    // Map frequencies to RGB
    const r = Math.min(255, lowEnd * 2);
    const g = Math.min(255, midRange * 1.5);
    const b = Math.min(255, highEnd * 1.5);
    
    // Calculate circle radius based on average frequency
    const baseRadius = 50;
    const radiusModulation = Math.max(0, avgFrequency / 2);
    
    // Draw animated circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius + radiusModulation, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();
    
    // Add glow effect
    const glowSize = baseRadius + radiusModulation + 20;
    const gradient = ctx.createRadialGradient(
      centerX, 
      centerY, 
      baseRadius + radiusModulation, 
      centerX, 
      centerY, 
      glowSize
    );
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw frequency bars in circular pattern
    const barCount = 32;
    const radius = baseRadius + radiusModulation + 10;
    
    for (let i = 0; i < barCount; i++) {
      const barIndex = Math.floor(i / barCount * frequencyData.length);
      const value = frequencyData[barIndex];
      const barHeight = value * 0.5;
      
      const angle = (i / barCount) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.stroke();
    }
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(drawVisualizer);
  };
  
  // Resize canvas to match window size
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
      />
      
      {/* Controls for visualizer */}
      <div className="fixed bottom-4 left-4 z-10 pointer-events-auto">
        {!isListening ? (
          <button
            onClick={startListening}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
          >
            Enable Music Visualizer
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
          >
            Disable Music Visualizer
          </button>
        )}
      </div>
    </div>
  );
}