import React from 'react';

interface RoomSelectorProps {
  joinCode: string;
  setJoinCode: (code: string) => void;
  errorMessage: string;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  joinAsViewer: (code: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
  joinCode,
  setJoinCode,
  errorMessage,
  createRoom,
  joinRoom,
  joinAsViewer
}) => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      background: '#111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      color: '#ccc'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        padding: '40px',
        borderRadius: '8px',
        border: '2px solid #333',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ color: '#0f0', marginBottom: '30px', fontSize: '24px' }}>
          ResonanceRooms
        </h1>
        <h2 style={{ color: '#ff0', marginBottom: '30px', fontSize: '16px' }}>
          Collaborative Audio/Video Synthesis
        </h2>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#ff0', marginBottom: '15px' }}>CREATE NEW ROOM</h3>
          <button
            onClick={createRoom}
            style={{
              background: '#44ff44',
              color: '#000',
              border: 'none',
              padding: '12px 20px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              fontSize: '14px',
              borderRadius: '4px'
            }}
          >
            CREATE ROOM
          </button>
        </div>

        <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
          <h3 style={{ color: '#0ff', marginBottom: '15px' }}>JOIN EXISTING ROOM</h3>
          <input
            type="text"
            placeholder="Room code..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            style={{
              background: '#222',
              border: '1px solid #555',
              color: '#ccc',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '14px',
              width: '200px',
              marginBottom: '10px'
            }}
          />
          <br />
          <button
            onClick={() => joinRoom(joinCode)}
            disabled={!joinCode.trim()}
            style={{
              background: joinCode.trim() ? '#4444ff' : '#666',
              color: '#000',
              border: 'none',
              padding: '8px 16px',
              fontFamily: 'monospace',
              cursor: joinCode.trim() ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            JOIN ROOM
          </button>
        </div>

        {errorMessage && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            background: 'rgba(255, 68, 68, 0.2)',
            border: '1px solid #ff4444',
            borderRadius: '4px',
            color: '#ff4444',
            fontSize: '12px'
          }}>
            {errorMessage}
            {errorMessage.includes('Join as viewer instead?') && (
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => joinAsViewer(joinCode)}
                  style={{
                    background: '#888',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 8px',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    fontSize: '10px',
                    borderRadius: '2px'
                  }}
                >
                  JOIN AS VIEWER
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '20px', fontSize: '11px', color: '#888' }}>
          Up to 10 users per room • Audio-visual collaboration
        </div>
      </div>
    </div>
  );
};