"use client";

import { useState, useEffect } from "react";

interface SparkleButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  target?: string;
  rel?: string;
}

export default function SparkleButton({ 
  href, 
  children, 
  className = "", 
  title,
  target = "_blank",
  rel = "noopener noreferrer"
}: SparkleButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [autoSparkle, setAutoSparkle] = useState(false);

  // Auto sparkle effect every 5-10 seconds
  useEffect(() => {
    const scheduleNextSparkle = () => {
      const delay = 5000 + Math.random() * 5000; // 5-10 seconds
      setTimeout(() => {
        setAutoSparkle(true);
        setTimeout(() => setAutoSparkle(false), 1000); // Reset after 1 second
        scheduleNextSparkle(); // Schedule the next one
      }, delay);
    };

    scheduleNextSparkle();
  }, []);

  const handleClick = () => {
    // Trigger click animation
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 1000); // Reset after 1 second
  };

  return (
    <div className="relative inline-block">
      {/* Click Sparkle Effect - shoots out from border (outside button) */}
      {isClicked && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => {
            const side = Math.floor(i / 5); // 0=top, 1=right, 2=bottom, 3=left
            const position = (i % 5) / 4; // 0 to 1 along the side
            
            let startX, startY, endX, endY;
            
            switch (side) {
              case 0: // Top
                startX = position * 100;
                startY = 0;
                endX = startX + (Math.random() - 0.5) * 150;
                endY = -80 - Math.random() * 80;
                break;
              case 1: // Right
                startX = 100;
                startY = position * 100;
                endX = 200 + Math.random() * 100;
                endY = startY + (Math.random() - 0.5) * 150;
                break;
              case 2: // Bottom
                startX = position * 100;
                startY = 100;
                endX = startX + (Math.random() - 0.5) * 150;
                endY = 200 + Math.random() * 100;
                break;
              case 3: // Left
                startX = 0;
                startY = position * 100;
                endX = -100 - Math.random() * 100;
                endY = startY + (Math.random() - 0.5) * 150;
                break;
            }
            
            return (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
                style={{
                  left: `${startX}%`,
                  top: `${startY}%`,
                  animationDelay: `${Math.random() * 0.2}s`,
                  animationDuration: `${0.6 + Math.random() * 0.3}s`,
                  animation: `clickSparkle ${0.6 + Math.random() * 0.3}s ease-out forwards`,
                  '--start-x': `${startX}%`,
                  '--start-y': `${startY}%`,
                  '--end-x': `${endX}%`,
                  '--end-y': `${endY}%`
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      <a
        href={href}
        target={target}
        rel={rel}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${className} relative overflow-hidden`}
        title={title}
      >
        {/* Gold Sparkle Effect on Hover or Auto */}
        {(isHovered || autoSparkle) && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.8 + Math.random() * 0.4}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Button content */}
        <span className="relative z-10">
          {children}
        </span>
      </a>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes clickSparkle {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(calc(var(--end-x) - var(--start-x, 0%)), calc(var(--end-y) - var(--start-y, 0%))) scale(0.5);
          }
        }
        
        .animate-sparkle {
          animation: sparkle ease-out forwards;
        }
      `}</style>
    </div>
  );
}
