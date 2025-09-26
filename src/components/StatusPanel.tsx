import React from 'react';

interface StatusPanelProps {
  isViewer: boolean;
  currentRoom: string;
  participantCount: number;
  userCount: number;
  userId: string;
  leaveRoom: () => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  isViewer,
  currentRoom,
  participantCount,
  userCount,
  userId,
  leaveRoom
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: window.innerWidth <= 768 ? 'auto' : '10px',
      bottom: window.innerWidth <= 768 ? '50px' : 'auto',
      left: '10px',
      color: '#ccc',
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.95)',
      padding: 'min(12px, 2vw)',
      borderRadius: '4px',
      border: '1px solid #333',
      fontSize: 'min(12px, 3vw)',
      maxWidth: window.innerWidth <= 768 ? 'calc(100vw - 20px)' : '200px',
      zIndex: 15
    }}>
      <div style={{ color: isViewer ? '#888' : '#0f0', marginBottom: '4px' }}>
        {isViewer ? '👁 VIEWER' : '● PARTICIPANT'}
      </div>
      <div>Room: {currentRoom}</div>
      <div>Participants: {participantCount}/10</div>
      <div>Total Users: {userCount}</div>
      <div>ID: {userId}</div>
      <button
        onClick={leaveRoom}
        style={{
          background: '#ff4444',
          color: '#000',
          border: 'none',
          padding: '4px 8px',
          fontSize: '10px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          borderRadius: '2px',
          marginTop: '8px'
        }}
      >
        LEAVE ROOM
      </button>
      {isViewer && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
          <div style={{ color: '#888', fontSize: '10px' }}>
            👁 VIEWER MODE
            <br />
            Watch-only • No synthesis input
          </div>
        </div>
      )}
    </div>
  );
};