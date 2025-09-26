import React, { useEffect } from 'react';

interface AudioControlsProps {
  isViewer: boolean;
  audioSupported: boolean;
  audioEnabled: boolean;
  startAudio: () => void;
  stopAudio: () => void;
  filterFrequency: number;
  setFilterFrequency: (freq: number) => void;
  reverbEnabled: boolean;
  setReverbEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  reverbDecay: number;
  setReverbDecay: (decay: number) => void;
  reverbWetness: number;
  setReverbWetness: (wetness: number) => void;
  envelopeEnabled: boolean;
  setEnvelopeEnabled: (enabled: boolean) => void;
  attackTime: number;
  setAttackTime: (time: number) => void;
  releaseTime: number;
  setReleaseTime: (time: number) => void;
  triggerRate: number;
  setTriggerRate: (rate: number) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isViewer,
  audioSupported,
  audioEnabled,
  startAudio,
  stopAudio,
  filterFrequency,
  setFilterFrequency,
  reverbEnabled,
  setReverbEnabled,
  volume,
  setVolume,
  reverbDecay,
  setReverbDecay,
  reverbWetness,
  setReverbWetness,
  envelopeEnabled,
  setEnvelopeEnabled,
  attackTime,
  setAttackTime,
  releaseTime,
  setReleaseTime,
  triggerRate,
  setTriggerRate
}) => {
  // Auto-start audio when component mounts and audio is supported
  useEffect(() => {
    if (audioSupported && !isViewer) {
      startAudio();
    }
  }, [audioSupported, isViewer, startAudio]); // Include all dependencies

  return (
    <div style={{
      position: 'absolute',
      bottom: window.innerWidth <= 768 ? '50px' : '10px',
      right: '10px',
      color: '#ccc',
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.95)',
      padding: 'min(12px, 2vw)',
      borderRadius: '4px',
      border: '1px solid #333',
      fontSize: 'min(12px, 3vw)',
      minWidth: window.innerWidth <= 768 ? 'calc(100vw - 20px)' : 'min(200px, 40vw)',
      maxWidth: window.innerWidth <= 768 ? 'calc(100vw - 20px)' : '300px',
      zIndex: 15
    }}>
      <div style={{ color: '#f0f', marginBottom: '8px', fontWeight: 'bold' }}>GENERATIVE AUDIO</div>

      {isViewer ? (
        <div style={{ color: '#888', fontSize: '10px' }}>
          👁 VIEWER MODE
          <br />
          Audio disabled for viewers
        </div>
      ) : !audioSupported ? (
        <div style={{ color: '#f44', fontSize: '10px' }}>
          ♪ AUDIO NOT SUPPORTED
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: audioEnabled ? '#0f0' : '#f90', marginBottom: '4px' }}>
              {audioEnabled ? '♪ ENABLED' : '♪ DISABLED'}
            </div>
            <button
              onClick={audioEnabled ? stopAudio : startAudio}
              style={{
                background: audioEnabled ? '#ff4444' : '#44ff44',
                color: '#000',
                border: 'none',
                padding: '4px 8px',
                fontSize: '10px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                borderRadius: '2px',
                width: '100%'
              }}
            >
              {audioEnabled ? 'STOP' : 'START'}
            </button>
          </div>

          {audioEnabled && (
            <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ marginBottom: '4px', fontSize: '10px' }}>
                  Volume: {Math.round(volume * 100)}%
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    height: window.innerWidth <= 768 ? '20px' : '4px',
                    background: '#333',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '10px',
                  cursor: 'pointer',
                  gap: '6px',
                  marginBottom: '4px'
                }}>
                  <input
                    type="checkbox"
                    checked={envelopeEnabled}
                    onChange={(e) => setEnvelopeEnabled(e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ color: envelopeEnabled ? '#0f0' : '#888' }}>
                    AR Envelope {envelopeEnabled ? 'ON' : 'OFF'}
                  </span>
                </label>

                {envelopeEnabled && (
                  <>
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ marginBottom: '2px', fontSize: '9px' }}>
                        Rate: {triggerRate.toFixed(1)} Hz
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={triggerRate}
                        onChange={(e) => setTriggerRate(parseFloat(e.target.value))}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          height: window.innerWidth <= 768 ? '20px' : '3px',
                          background: '#333',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ marginBottom: '2px', fontSize: '9px' }}>
                        Attack: {(attackTime * 1000).toFixed(0)}ms
                      </div>
                      <input
                        type="range"
                        min="0.001"
                        max="1"
                        step="0.001"
                        value={attackTime}
                        onChange={(e) => setAttackTime(parseFloat(e.target.value))}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          height: window.innerWidth <= 768 ? '20px' : '3px',
                          background: '#333',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ marginBottom: '2px', fontSize: '9px' }}>
                        Release: {(releaseTime * 1000).toFixed(0)}ms
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="2"
                        step="0.01"
                        value={releaseTime}
                        onChange={(e) => setReleaseTime(parseFloat(e.target.value))}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          height: window.innerWidth <= 768 ? '20px' : '3px',
                          background: '#333',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={{ marginBottom: '4px', fontSize: '10px' }}>
                  Low-pass Filter: {Math.round(filterFrequency)}Hz
                </div>
                <input
                  type="range"
                  min="500"
                  max="8000"
                  step="100"
                  value={filterFrequency}
                  onChange={(e) => setFilterFrequency(parseInt(e.target.value))}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    height: window.innerWidth <= 768 ? '20px' : '4px',
                    background: '#333',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '10px',
                  cursor: 'pointer',
                  gap: '6px',
                  marginBottom: '4px'
                }}>
                  <input
                    type="checkbox"
                    checked={reverbEnabled}
                    onChange={(e) => setReverbEnabled(e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ color: reverbEnabled ? '#0f0' : '#888' }}>
                    Reverb {reverbEnabled ? 'ON' : 'OFF'}
                  </span>
                </label>

                {reverbEnabled && (
                  <>
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ marginBottom: '2px', fontSize: '9px' }}>
                        Decay: {reverbDecay.toFixed(1)}s
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={reverbDecay}
                        onChange={(e) => setReverbDecay(parseFloat(e.target.value))}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          height: window.innerWidth <= 768 ? '20px' : '3px',
                          background: '#333',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: '2px', fontSize: '9px' }}>
                        Wetness: {Math.round(reverbWetness * 100)}%
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={reverbWetness}
                        onChange={(e) => setReverbWetness(parseFloat(e.target.value))}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          height: window.innerWidth <= 768 ? '20px' : '3px',
                          background: '#333',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {audioEnabled && (
            <div style={{ fontSize: '9px', color: '#666', marginTop: '6px' }}>
              Audio synthesis from user positions
            </div>
          )}
        </>
      )}
    </div>
  );
};