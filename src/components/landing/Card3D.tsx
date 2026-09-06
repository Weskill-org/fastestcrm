import { useState, useRef, ReactNode, MouseEvent } from 'react';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
  scaleOnHover?: number;
  depth?: number;
}

export function Card3D({
  children,
  className = '',
  glowColor = 'rgba(20, 184, 166, 0.25)',
  maxTilt = 12,
  scaleOnHover = 1.02,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, 1)`
    );

    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative transform-style-3d transition-transform ${isHovered ? 'duration-75' : 'duration-500 ease-out'} ${className}`}
      style={{
        transform,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? `0 20px 40px -15px ${glowColor}, 0 0 25px -5px ${glowColor}`
          : '0 4px 20px -5px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Specular Glare Layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-30"
        style={{
          background: `radial-gradient(circle 320px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, ${glarePosition.opacity}), transparent 70%)`,
          borderRadius: 'inherit'
        }}
        aria-hidden="true"
      />

      {/* Card Content with 3D Depth */}
      <div className="relative z-10 w-full h-full transform-style-3d">
        {children}
      </div>
    </div>
  );
}

export default Card3D;
