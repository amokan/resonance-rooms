import React from 'react';
import type { UserData } from '../hooks/useRoom';

interface UserListProps {
  users: Map<string, UserData>;
  currentUserId: string;
}

export const UserList: React.FC<UserListProps> = ({ users, currentUserId }) => {
  if (users.size === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: window.innerWidth <= 768 ? '50px' : '10px',
      left: '10px',
      color: '#ccc',
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.95)',
      padding: 'min(12px, 2vw)',
      borderRadius: '4px',
      border: '1px solid #333',
      fontSize: 'min(11px, 2.8vw)',
      maxWidth: window.innerWidth <= 768 ? 'calc(100vw - 20px)' : 'min(300px, 40vw)',
      maxHeight: '150px',
      overflow: 'auto',
      zIndex: 15
    }}>
      <div style={{ color: '#0ff', marginBottom: '6px' }}>PARTICIPANTS</div>
      {Array.from(users.entries()).map(([id, user], index) => (
        <div key={id} style={{
          marginBottom: '2px',
          color: user.isViewer ? '#888' : `hsl(${index * 137.5 % 360}, 70%, 70%)`
        }}>
          {user.isViewer ? '👁' : '●'} {id === currentUserId ? 'Me' : id.slice(0, 8)}: ({Math.round(user.x)}, {Math.round(user.y)})
        </div>
      ))}
    </div>
  );
};