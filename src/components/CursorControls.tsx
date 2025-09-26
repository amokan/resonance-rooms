import React from 'react';

interface CursorControlsProps {
  isViewer: boolean;
  canvasMousePos: { x: number; y: number };
  mousePos: { x: number; y: number };
  cursorHeld: boolean;
  lfoEnabled: boolean;
  lfoType: 'sine' | 'saw' | 'square' | 'triangle' | 'noise' | 'smoothNoise';
  lfoFrequency: number;
  lfoInfluence: number;
  lfoPhase: number;
  setCursorHeld: (held: boolean) => void;
  setLfoEnabled: (enabled: boolean) => void;
  setLfoType: (type: 'sine' | 'saw' | 'square' | 'triangle' | 'noise' | 'smoothNoise') => void;
  setLfoFrequency: (freq: number) => void;
  setLfoInfluence: (influence: number) => void;
  setLfoPhase: (phase: number) => void;
}

export const CursorControls: React.FC<CursorControlsProps> = ({
  isViewer,
  canvasMousePos,
  mousePos,
  cursorHeld,
  lfoEnabled,
  lfoType,
  lfoFrequency,
  lfoInfluence,
  lfoPhase,
  setCursorHeld,
  setLfoEnabled,
  setLfoType,
  setLfoFrequency,
  setLfoInfluence,
  setLfoPhase
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: window.innerWidth <= 768 ? 'auto' : '10px',
      bottom: window.innerWidth <= 768 ? '50px' : 'auto',
      right: '10px',
      color: '#ccc',
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.95)',
      padding: 'min(12px, 2vw)',
      borderRadius: '4px',
      border: '1px solid #333',
      fontSize: 'min(12px, 3vw)',
      textAlign: window.innerWidth <= 768 ? 'left' : 'right',
      maxWidth: window.innerWidth <= 768 ? 'calc(100vw - 20px)' : '250px',
      zIndex: 15
    }}>
      <div style={{ color: '#ff0', marginBottom: '4px' }}>YOUR INPUT</div>
      <div>Canvas: {canvasMousePos.x}, {canvasMousePos.y}</div>
      <div>Screen: {Math.round(mousePos.x)}, {Math.round(mousePos.y)}</div>

      {!isViewer && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
          <div style={{ color: cursorHeld ? '#0f0' : '#888', fontSize: '10px', marginBottom: '4px' }}>
            {cursorHeld ? '⏸ HELD' : '🎯 LIVE'} {window.innerWidth <= 768 ? '' : '[SPACE]'}
          </div>
          {window.innerWidth <= 768 && (
            <button
              onClick={() => setCursorHeld(!cursorHeld)}
              onTouchStart={(e) => {
                e.preventDefault();
                setCursorHeld(!cursorHeld);
              }}
              style={{
                background: cursorHeld ? '#ff4444' : '#44ff44',
                color: '#000',
                border: 'none',
                padding: '4px 8px',
                fontSize: '9px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                borderRadius: '2px',
                width: '100%',
                marginBottom: '6px'
              }}
            >
              {cursorHeld ? 'UNLOCK CURSOR' : 'LOCK CURSOR'}
            </button>
          )}
          <div style={{
            color: lfoEnabled ? '#0f0' : (!cursorHeld ? '#444' : '#888'),
            fontSize: '10px',
            marginBottom: '4px'
          }}>
            {lfoEnabled ? '🌊 LFO ON' : '🌊 LFO OFF'} {window.innerWidth <= 768 ? '' : (cursorHeld ? '[L]' : '(Lock cursor first)')}
          </div>
          {window.innerWidth <= 768 && (
            <button
              onClick={() => setLfoEnabled(!lfoEnabled)}
              onTouchStart={(e) => {
                e.preventDefault();
                setLfoEnabled(!lfoEnabled);
              }}
              disabled={!cursorHeld}
              style={{
                background: !cursorHeld ? '#666' : (lfoEnabled ? '#ff4444' : '#44ff44'),
                color: !cursorHeld ? '#999' : '#000',
                border: 'none',
                padding: '4px 8px',
                fontSize: '9px',
                fontFamily: 'monospace',
                cursor: !cursorHeld ? 'not-allowed' : 'pointer',
                borderRadius: '2px',
                width: '100%',
                marginBottom: '6px'
              }}
            >
              {lfoEnabled ? 'DISABLE LFO' : 'ENABLE LFO'}
            </button>
          )}

          {lfoEnabled && (
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              <div style={{ marginBottom: '2px' }}>
                Type:
                <select
                  value={lfoType}
                  onChange={(e) => setLfoType(e.target.value as 'sine' | 'saw' | 'square' | 'triangle' | 'noise' | 'smoothNoise')}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{
                    background: '#222',
                    color: '#ccc',
                    border: '1px solid #555',
                    fontSize: window.innerWidth <= 768 ? '12px' : '9px',
                    marginLeft: window.innerWidth <= 768 ? '0' : '4px',
                    padding: window.innerWidth <= 768 ? '4px' : '2px',
                    width: window.innerWidth <= 768 ? '100%' : 'auto',
                    cursor: 'pointer'
                  }}
                >
                  <option value="sine">Sine</option>
                  <option value="saw">Saw</option>
                  <option value="square">Square</option>
                  <option value="triangle">Triangle</option>
                  <option value="noise">Noise</option>
                  <option value="smoothNoise">Smooth Noise</option>
                </select>
              </div>
              <div style={{ marginBottom: '2px' }}>
                Rate: {lfoFrequency.toFixed(1)}Hz
                <input
                  type="range"
                  min="0.05"
                  max="10"
                  step="0.05"
                  value={lfoFrequency}
                  onChange={(e) => setLfoFrequency(parseFloat(e.target.value))}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  style={{
                    width: window.innerWidth <= 768 ? '100%' : '60px',
                    marginLeft: window.innerWidth <= 768 ? '0' : '4px',
                    height: window.innerWidth <= 768 ? '20px' : 'auto',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ marginBottom: '2px' }}>
                Depth: {Math.round(lfoInfluence * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={lfoInfluence}
                  onChange={(e) => setLfoInfluence(parseFloat(e.target.value))}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  style={{
                    width: window.innerWidth <= 768 ? '100%' : '60px',
                    marginLeft: window.innerWidth <= 768 ? '0' : '4px',
                    height: window.innerWidth <= 768 ? '20px' : 'auto',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div>
                Phase: {lfoPhase}°
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={lfoPhase}
                  onChange={(e) => setLfoPhase(parseInt(e.target.value))}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  style={{
                    width: window.innerWidth <= 768 ? '100%' : '60px',
                    marginLeft: window.innerWidth <= 768 ? '0' : '4px',
                    height: window.innerWidth <= 768 ? '20px' : 'auto',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
