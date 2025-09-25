"use client";

import { useState, useEffect } from "react";

interface RewardAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function RewardAnimation({ isVisible, onComplete }: RewardAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'hidden' | 'fill' | 'spin' | 'spiral' | 'land'>('hidden');
  const [spiralProgress, setSpiralProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setAnimationPhase('hidden');
      setSpiralProgress(0);
      return;
    }

    // Start the animation sequence
    setAnimationPhase('fill');

    // Phase 1: Fill screen (1 second)
    const fillTimer = setTimeout(() => {
      setAnimationPhase('spin');
    }, 1000);

    // Phase 2: Spin (2 seconds)
    setTimeout(() => {
      setAnimationPhase('spiral');
      // Start spiral animation
      let progress = 0;
      const spiralInterval = setInterval(() => {
        progress += 0.02;
        setSpiralProgress(progress);
        
        if (progress >= 1) {
          clearInterval(spiralInterval);
          setAnimationPhase('land');
          
          // Complete animation after landing
          setTimeout(() => {
            onComplete();
          }, 500);
        }
      }, 16); // ~60fps
    }, 3000);

    return () => {
      clearTimeout(fillTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible || animationPhase === 'hidden') {
    return null;
  }

  // Calculate spiral path
  const getSpiralPosition = (progress: number) => {
    if (progress === 0) return { x: 50, y: 50, scale: 1 }; // Center of screen
    
    // Spiral from center to bottom-right (where creature typically is)
    const angle = progress * Math.PI * 4; // 2 full rotations
    const radius = (1 - progress) * 200; // Shrinking radius
    
    const centerX = 50; // Center of screen
    const centerY = 50;
    const targetX = 85; // Bottom-right area
    const targetY = 80;
    
    const spiralX = centerX + Math.cos(angle) * radius * 0.1;
    const spiralY = centerY + Math.sin(angle) * radius * 0.1;
    
    // Interpolate towards target
    const x = spiralX + (targetX - spiralX) * progress;
    const y = spiralY + (targetY - spiralY) * progress;
    const scale = 1 - progress * 0.8; // Shrink from 1 to 0.2
    
    return { x, y, scale };
  };

  const spiralPos = getSpiralPosition(spiralProgress);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Background overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-yellow-200 via-yellow-100 to-amber-100 transition-opacity duration-1000 ${
          animationPhase === 'fill' ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Main star */}
      <div
        className={`absolute transition-all duration-1000 ${
          animationPhase === 'fill' ? 'opacity-100 scale-100' : 
          animationPhase === 'spin' ? 'opacity-100 scale-100' :
          animationPhase === 'spiral' || animationPhase === 'land' ? 'opacity-100' : 'opacity-0 scale-0'
        }`}
        style={{
          left: `${spiralPos.x}%`,
          top: `${spiralPos.y}%`,
          transform: `translate(-50%, -50%) scale(${spiralPos.scale}) ${
            animationPhase === 'spin' ? 'rotate(720deg)' : 'rotate(0deg)'
          }`,
          transition: animationPhase === 'spiral' || animationPhase === 'land' ? 
            'left 0.1s linear, top 0.1s linear, transform 0.1s linear' : 
            'all 1s ease-out'
        }}
      >
        {/* Large sparkly star */}
        <div className="relative">
          {/* Main star shape */}
          <div className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Outer star */}
              <path
                d="M50 5 L61 35 L95 35 L70 57 L81 87 L50 65 L19 87 L30 57 L5 35 L39 35 Z"
                fill="url(#starGradient)"
                stroke="#FFD700"
                strokeWidth="2"
              />
              {/* Inner star */}
              <path
                d="M50 15 L58 35 L78 35 L62 47 L70 67 L50 55 L30 67 L38 47 L22 35 L42 35 Z"
                fill="url(#innerStarGradient)"
              />
              {/* Center circle */}
              <circle cx="50" cy="50" r="8" fill="#FFD700" />
              
              {/* Gradient definitions */}
              <defs>
                <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFA500" />
                  <stop offset="100%" stopColor="#FF8C00" />
                </radialGradient>
                <radialGradient id="innerStarGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFF00" />
                  <stop offset="100%" stopColor="#FFD700" />
                </radialGradient>
              </defs>
            </svg>
          </div>
          
          {/* Sparkle particles around the star */}
          {[...Array(20)].map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 60 + Math.random() * 40;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-pulse"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            );
          })}
          
          {/* Additional sparkle effects */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 80 + Math.random() * 60;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <div
                key={`sparkle-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random()}s`
                }}
              />
            );
          })}
        </div>
      </div>
      
      {/* Celebration text */}
      {animationPhase === 'fill' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-bold text-yellow-600 mb-4 animate-bounce">
              🌟
            </h2>
            <p className="text-2xl md:text-4xl font-bold text-yellow-700 animate-pulse">
              Amazing Work!
            </p>
            <p className="text-lg md:text-xl text-yellow-600 mt-2 animate-pulse">
              You&apos;ve completed all your flashcards!
            </p>
          </div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
