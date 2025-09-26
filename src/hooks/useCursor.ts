import { useState, useCallback, useEffect } from 'react';

export const useCursor = (
  currentRoom: string | null,
  isViewer: boolean,
  broadcastUserData: (x: number, y: number) => void
) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canvasMousePos, setCanvasMousePos] = useState({ x: 0, y: 0 });
  const [cursorHeld, setCursorHeld] = useState(false);
  const [heldPosition, setHeldPosition] = useState({ x: 320, y: 240 });
  const [lfoEnabled, setLfoEnabled] = useState(false);
  const [lfoType, setLfoType] = useState<'sine' | 'saw' | 'square' | 'triangle' | 'noise' | 'smoothNoise'>('sine');
  const [lfoFrequency, setLfoFrequency] = useState(1.0);
  const [lfoInfluence, setLfoInfluence] = useState(0.5);
  const [lfoPhase, setLfoPhase] = useState(0);

  const calculateLFO = (time: number, type: 'sine' | 'saw' | 'square' | 'triangle' | 'noise' | 'smoothNoise', frequency: number, phaseOffset: number = 0): number => {
    const phase = ((time * frequency) + phaseOffset) % (2 * Math.PI);

    switch (type) {
      case 'sine':
        return Math.sin(phase);
      case 'saw':
        return (2 * (phase / (2 * Math.PI))) - 1;
      case 'square':
        return Math.sin(phase) > 0 ? 1 : -1;
      case 'triangle': {
        const normalizedPhase = phase / (2 * Math.PI);
        return normalizedPhase < 0.5
          ? (normalizedPhase * 4) - 1
          : 3 - (normalizedPhase * 4);
      }
      case 'noise':
        // Pseudo-random noise based on time
        return (Math.sin(time * frequency * 12.9898) * Math.cos(time * frequency * 78.233)) * 2 - 1;
      case 'smoothNoise':
        // Smooth noise using multiple sine waves
        return (Math.sin(phase) + Math.sin(phase * 2.1) * 0.5 + Math.sin(phase * 3.7) * 0.25) / 1.75;
      default:
        return 0;
    }
  };

  const getCurrentCursorPosition = useCallback((baseX: number, baseY: number): { x: number, y: number } => {
    if (!lfoEnabled) {
      return { x: baseX, y: baseY };
    }

    const time = performance.now() / 1000;
    const phaseOffsetRadians = (lfoPhase / 360) * (2 * Math.PI);
    const lfoX = calculateLFO(time, lfoType, lfoFrequency, 0); // X axis starts at 0
    const lfoY = calculateLFO(time, lfoType, lfoFrequency, phaseOffsetRadians); // Y axis uses the phase control

    const influencePixels = lfoInfluence * 50; // Max 50px influence

    return {
      x: Math.max(0, Math.min(640, baseX + (lfoX * influencePixels))),
      y: Math.max(0, Math.min(480, baseY + (lfoY * influencePixels)))
    };
  }, [lfoEnabled, lfoType, lfoFrequency, lfoInfluence, lfoPhase]);

  // Cursor automation loop
  useEffect(() => {
    if (!currentRoom || isViewer) return;

    let animationId: number;
    let intervalId: number;
    const BROADCAST_FREQUENCY = 50; // 20 Hz - same as mouse movement

    const updateCursor = () => {
      // Only update base position if not held and not using LFO
      if (!cursorHeld && !lfoEnabled) {
        return; // Let mouse movement handle updates
      }

      // Use current base position - held position if locked, otherwise current mouse position
      const currentBase = cursorHeld ? heldPosition : canvasMousePos;
      const currentPos = getCurrentCursorPosition(currentBase.x, currentBase.y);
      setCanvasMousePos({ x: Math.round(currentPos.x), y: Math.round(currentPos.y) });

      animationId = requestAnimationFrame(updateCursor);
    };

    const broadcastPosition = () => {
      if (cursorHeld || lfoEnabled) {
        // Use current base position - held position if locked, otherwise current mouse position
        const currentBase = cursorHeld ? heldPosition : canvasMousePos;
        const currentPos = getCurrentCursorPosition(currentBase.x, currentBase.y);
        broadcastUserData(currentPos.x, currentPos.y);
      }
    };

    if (lfoEnabled || cursorHeld) {
      animationId = requestAnimationFrame(updateCursor);
      intervalId = setInterval(broadcastPosition, BROADCAST_FREQUENCY);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentRoom, isViewer, lfoEnabled, cursorHeld, lfoType, lfoFrequency, lfoInfluence, broadcastUserData, getCurrentCursorPosition, canvasMousePos, heldPosition]);

  // Disable LFO when cursor becomes unlocked
  useEffect(() => {
    if (!cursorHeld && lfoEnabled) {
      setLfoEnabled(false);
    }
  }, [cursorHeld, lfoEnabled]);

  return {
    // State
    mousePos,
    setMousePos,
    canvasMousePos,
    setCanvasMousePos,
    cursorHeld,
    setCursorHeld,
    heldPosition,
    setHeldPosition,
    lfoEnabled,
    setLfoEnabled,
    lfoType,
    setLfoType,
    lfoFrequency,
    setLfoFrequency,
    lfoInfluence,
    setLfoInfluence,
    lfoPhase,
    setLfoPhase,

    // Utils
    getCurrentCursorPosition,
  };
};