import React, { useEffect, useRef } from 'react';

const BALL_SIZE = 48;

const StickyScrollBall: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let animationFrame: number;
    const update = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const p = scrollable > 0 ? window.scrollY / scrollable : 0;
      if (trackRef.current && ballRef.current) {
        const trackWidth = trackRef.current.offsetWidth;
        const x = (trackWidth - BALL_SIZE) * p;
        ballRef.current.style.transform = `translateX(${x}px)`;
      }
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      className="sticky-scroll-ball"
      style={{
        position: 'fixed',
        left: 0,
        bottom: 48,
        width: '100vw',
        zIndex: 1000,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        ref={trackRef}
        className="ball-track"
        style={{
          position: 'relative',
          width: '60vw',
          height: BALL_SIZE,
          maxWidth: 480,
          minWidth: 220,
          background: 'rgba(255,255,255,0.7)',
          borderRadius: BALL_SIZE,
          boxShadow: '0 2px 16px #23252622',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: (BALL_SIZE - 12) / 2,
            height: 12,
            width: '100%',
            background: 'linear-gradient(90deg, #00b894 0%, #00cec9 100%)',
            opacity: 0.18,
            borderRadius: BALL_SIZE,
          }}
        />
        {/* 8Ball image, smooth movement, no shadow */}
        <img
          ref={ballRef}
          src="/Images/8Ball.png"
          alt="Scroll Progress 8 Ball"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: BALL_SIZE,
            height: BALL_SIZE,
            zIndex: 2,
            pointerEvents: 'none',
            userSelect: 'none',
            willChange: 'transform',
            filter: 'drop-shadow(0 2px 8px #23252633)',
          }}
        />
      </div>
    </div>
  );
};

export default StickyScrollBall;