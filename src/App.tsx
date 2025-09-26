import { useRef, useEffect, useState } from 'react';
import './App.css';
import { createClient } from "@supabase/supabase-js";

// Hooks
import { useRoom } from './hooks/useRoom';
import { useAudio } from './hooks/useAudio';
import { useCursor } from './hooks/useCursor';

// Components
import { RoomSelector } from './components/RoomSelector';
import { StatusPanel } from './components/StatusPanel';
import { CursorControls } from './components/CursorControls';
import { UserList } from './components/UserList';
import { AudioControls } from './components/AudioControls';

// WebGL
import { vertexShaderSource, fragmentShaderSource, createShader, createProgram } from './lib/shaders';

// Create Supabase client as module singleton to prevent multiple instances
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const BROADCAST_THROTTLE = 50;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 320, y: 240 });
  const isViewerRef = useRef<boolean>(false);

  // Mobile UI state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activePanel, setActivePanel] = useState<'none' | 'status' | 'controls' | 'audio' | 'users'>('none');

  // Room management
  const room = useRoom(supabase);

  // Audio synthesis
  const audio = useAudio(room.users);

  // Cursor and LFO controls
  const cursor = useCursor(room.currentRoom, room.isViewer, room.broadcastUserData);

  // Update refs with current values for WebGL render loop
  cursorRef.current = cursor.canvasMousePos;
  isViewerRef.current = room.isViewer;

  // Enhanced leave room that also stops audio
  const handleLeaveRoom = () => {
    if (audio.audioEnabled) {
      audio.stopAudio();
    }
    room.leaveRoom();
  };

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setActivePanel('none'); // Show all panels on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!room.currentRoom || room.isViewer) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        cursor.setCursorHeld(!cursor.cursorHeld);
      }
      if (event.code === 'KeyL' && cursor.cursorHeld) {
        event.preventDefault();
        cursor.setLfoEnabled(!cursor.lfoEnabled);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [room.currentRoom, room.isViewer, cursor]);

  // Handle mouse movement
  useEffect(() => {
    if (!room.currentRoom) return;

    let lastBroadcastTime = 0;


    const updateCursorPosition = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (canvas && !cursor.cursorHeld) {
        const rect = canvas.getBoundingClientRect();
        const canvasX = Math.max(0, Math.min(640, (clientX - rect.left) * (640 / rect.width)));
        const canvasY = Math.max(0, Math.min(480, (clientY - rect.top) * (480 / rect.height)));

        cursor.setMousePos({ x: clientX, y: clientY });
        cursor.setCanvasMousePos({ x: Math.round(canvasX), y: Math.round(canvasY) });
        cursor.setHeldPosition({ x: canvasX, y: canvasY });

        // Throttled broadcast on movement
        const now = performance.now();
        if (!room.isViewer && now - lastBroadcastTime > BROADCAST_THROTTLE) {
          const currentPos = cursor.getCurrentCursorPosition(canvasX, canvasY);
          room.broadcastUserData(currentPos.x, currentPos.y);
          lastBroadcastTime = now;
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateCursorPosition(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault(); // Prevent scrolling
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        updateCursorPosition(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault(); // Prevent mouse events from firing
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        updateCursorPosition(touch.clientX, touch.clientY);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && room.channelRef.current) {
        room.channelRef.current.send({
          type: 'broadcast',
          event: 'user_leave',
          payload: { userId: room.userIdRef.current }
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // User cleanup and heartbeat
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      room.setUsers(prev => {
        const newUsers = new Map();
        for (const [id, user] of prev) {
          if (now - user.timestamp < 30000) {
            newUsers.set(id, user);
          }
        }
        return newUsers;
      });
    }, 5000);

    const heartbeatInterval = setInterval(() => {
      if (room.channelRef.current) {
        const basePos = cursor.cursorHeld ? cursor.heldPosition : cursor.canvasMousePos;
        const currentPos = cursor.getCurrentCursorPosition(basePos.x, basePos.y);
        room.broadcastUserData(currentPos.x, currentPos.y);
      }
    }, 10000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(cleanupInterval);
      clearInterval(heartbeatInterval);
    };
  }, [room, cursor]);


  // WebGL rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const usersUniformLocation = gl.getUniformLocation(program, 'u_users');
    const userCountUniformLocation = gl.getUniformLocation(program, 'u_userCount');
    const currentUserPosUniformLocation = gl.getUniformLocation(program, 'u_currentUserPos');
    const isViewerUniformLocation = gl.getUniformLocation(program, 'u_isViewer');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const resizeCanvas = () => {
      canvas.width = 640;
      canvas.height = 480;
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = [
        0, 0,
        canvas.width, 0,
        0, canvas.height,
        0, canvas.height,
        canvas.width, 0,
        canvas.width, canvas.height,
      ];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;

    const render = (time: number) => {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, time * 0.0003);

      const participants = Array.from(room.users.values()).filter(user => !user.isViewer).slice(0, 10);
      const userPositions = new Float32Array(20);

      // Include current user's live position if they're a participant
      if (!room.isViewer && participants.length < 10) {
        const basePos = cursor.cursorHeld ? cursor.heldPosition : cursor.canvasMousePos;
        const currentPos = cursor.getCurrentCursorPosition(basePos.x, basePos.y);
        const currentUserData = {
          id: room.userIdRef.current,
          x: currentPos.x,
          y: currentPos.y,
          timestamp: Date.now(),
          isViewer: false
        };

        // Check if current user is already in participants (from broadcast)
        const currentUserExists = participants.some(p => p.id === room.userIdRef.current);
        if (!currentUserExists) {
          participants.push(currentUserData);
        }
      }

      for (let i = 0; i < participants.length; i++) {
        userPositions[i * 2] = participants[i].x;
        userPositions[i * 2 + 1] = 480 - participants[i].y; // Y-flip for WebGL coordinates
      }

      gl.uniform2fv(usersUniformLocation, userPositions);
      gl.uniform1i(userCountUniformLocation, participants.length);
      gl.uniform2f(currentUserPosUniformLocation, cursorRef.current.x, 480 - cursorRef.current.y);
      gl.uniform1i(isViewerUniformLocation, isViewerRef.current ? 1 : 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [room.users, cursor.canvasMousePos.x, cursor.canvasMousePos.y, room.isViewer, room.userIdRef, cursor]);

  if (room.showRoomSelector) {
    return (
      <RoomSelector
        joinCode={room.joinCode}
        setJoinCode={room.setJoinCode}
        errorMessage={room.errorMessage}
        createRoom={room.createRoom}
        joinRoom={room.joinRoom}
        joinAsViewer={room.joinAsViewer}
      />
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      background: '#111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: 'min(640px, 90vw)',
            height: 'min(480px, 67.5vw)', // Maintain 4:3 aspect ratio
            maxHeight: '60vh',
            border: '2px solid #333',
            cursor: 'none',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            touchAction: 'none' // Prevent default touch behaviors
          }}
        />

        {!room.isViewer && (
          <div style={{
            marginTop: '10px',
            fontSize: 'min(11px, 3vw)',
            color: '#888',
            fontFamily: 'monospace',
            padding: '0 10px'
          }}>
            <span style={{ display: !isMobile ? 'inline' : 'none' }}>
              Press [SPACE] to lock cursor • Press [L] to enable LFO automation (cursor must be locked first)
            </span>
            <span style={{ display: isMobile ? 'inline' : 'none' }}>
              Touch to move cursor • Tap controls to adjust settings
            </span>
          </div>
        )}
      </div>

      {/* Mobile Tab Bar */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.95)',
          border: '1px solid #333',
          display: 'flex',
          zIndex: 20
        }}>
          <button
            onClick={() => {
              console.log('Info button clicked, current activePanel:', activePanel);
              setActivePanel(activePanel === 'status' ? 'none' : 'status');
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              console.log('Info button touched');
              setActivePanel(activePanel === 'status' ? 'none' : 'status');
            }}
            style={{
              flex: 1,
              background: activePanel === 'status' ? '#333' : 'transparent',
              color: '#ccc',
              border: 'none',
              padding: '12px 8px',
              fontFamily: 'monospace',
              fontSize: '10px',
              cursor: 'pointer',
              borderRight: '1px solid #333',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            INFO
          </button>
          {!room.isViewer && (
            <button
              onClick={() => {
                console.log('Input button clicked, current activePanel:', activePanel);
                setActivePanel(activePanel === 'controls' ? 'none' : 'controls');
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                console.log('Input button touched');
                setActivePanel(activePanel === 'controls' ? 'none' : 'controls');
              }}
              style={{
                flex: 1,
                background: activePanel === 'controls' ? '#333' : 'transparent',
                color: '#ccc',
                border: 'none',
                padding: '12px 8px',
                fontFamily: 'monospace',
                fontSize: '10px',
                cursor: 'pointer',
                borderRight: '1px solid #333',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              INPUT
            </button>
          )}
          <button
            onClick={() => {
              console.log('Audio button clicked, current activePanel:', activePanel);
              setActivePanel(activePanel === 'audio' ? 'none' : 'audio');
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              console.log('Audio button touched');
              setActivePanel(activePanel === 'audio' ? 'none' : 'audio');
            }}
            style={{
              flex: 1,
              background: activePanel === 'audio' ? '#333' : 'transparent',
              color: '#ccc',
              border: 'none',
              padding: '12px 8px',
              fontFamily: 'monospace',
              fontSize: '10px',
              cursor: 'pointer',
              borderRight: '1px solid #333',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            AUDIO
          </button>
          <button
            onClick={() => {
              console.log('Users button clicked, current activePanel:', activePanel);
              setActivePanel(activePanel === 'users' ? 'none' : 'users');
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              console.log('Users button touched');
              setActivePanel(activePanel === 'users' ? 'none' : 'users');
            }}
            style={{
              flex: 1,
              background: activePanel === 'users' ? '#333' : 'transparent',
              color: '#ccc',
              border: 'none',
              padding: '12px 8px',
              fontFamily: 'monospace',
              fontSize: '10px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            USERS
          </button>
        </div>
      )}

      {/* Desktop panels or mobile active panel */}
      {(!isMobile || activePanel === 'status') && (
        <StatusPanel
          isViewer={room.isViewer}
          currentRoom={room.currentRoom!}
          participantCount={room.participantCount}
          userCount={room.userCount}
          userId={room.userIdRef.current}
          leaveRoom={handleLeaveRoom}
        />
      )}

      {(!isMobile || activePanel === 'controls') && !room.isViewer && (
        <CursorControls
          isViewer={room.isViewer}
          canvasMousePos={cursor.canvasMousePos}
          mousePos={cursor.mousePos}
          cursorHeld={cursor.cursorHeld}
          lfoEnabled={cursor.lfoEnabled}
          lfoType={cursor.lfoType}
          lfoFrequency={cursor.lfoFrequency}
          lfoInfluence={cursor.lfoInfluence}
          lfoPhase={cursor.lfoPhase}
          setCursorHeld={cursor.setCursorHeld}
          setLfoEnabled={cursor.setLfoEnabled}
          setLfoType={cursor.setLfoType}
          setLfoFrequency={cursor.setLfoFrequency}
          setLfoInfluence={cursor.setLfoInfluence}
          setLfoPhase={cursor.setLfoPhase}
        />
      )}

      {(!isMobile || activePanel === 'users') && (
        <UserList
          users={room.users}
          currentUserId={room.userIdRef.current}
          currentUserPosition={(() => {
            const basePos = cursor.cursorHeld ? cursor.heldPosition : cursor.canvasMousePos;
            return cursor.getCurrentCursorPosition(basePos.x, basePos.y);
          })()}
        />
      )}

      {(!isMobile || activePanel === 'audio') && (
        <AudioControls
          isViewer={room.isViewer}
          audioSupported={audio.audioSupported}
          audioEnabled={audio.audioEnabled}
          startAudio={audio.startAudio}
          stopAudio={audio.stopAudio}
          filterFrequency={audio.filterFrequency}
          setFilterFrequency={audio.setFilterFrequency}
          reverbEnabled={audio.reverbEnabled}
          setReverbEnabled={audio.setReverbEnabled}
          volume={audio.volume}
          setVolume={audio.setVolume}
          reverbDecay={audio.reverbDecay}
          setReverbDecay={audio.setReverbDecay}
          reverbWetness={audio.reverbWetness}
          setReverbWetness={audio.setReverbWetness}
          envelopeEnabled={audio.envelopeEnabled}
          setEnvelopeEnabled={audio.setEnvelopeEnabled}
          attackTime={audio.attackTime}
          setAttackTime={audio.setAttackTime}
          releaseTime={audio.releaseTime}
          setReleaseTime={audio.setReleaseTime}
          triggerRate={audio.triggerRate}
          setTriggerRate={audio.setTriggerRate}
        />
      )}
    </div>
  );
}

export default App;
