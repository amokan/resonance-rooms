import { useState, useCallback, useEffect, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BroadcastPayload } from '../types/supabase';

export interface UserData {
  id: string;
  x: number;
  y: number;
  ip?: string;
  userAgent?: string;
  locale?: string;
  timestamp: number;
  isViewer?: boolean;
}

export const useRoom = (supabase: SupabaseClient) => {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string>('');
  const [showRoomSelector, setShowRoomSelector] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isViewer, setIsViewer] = useState(false);
  const [users, setUsers] = useState<Map<string, UserData>>(new Map());
  const [userCount, setUserCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);

  const userIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const getUserMetadata = (): Partial<UserData> => {
    return {
      userAgent: navigator.userAgent,
      locale: navigator.language,
    };
  };

  const updateURL = (roomCode: string | null) => {
    const url = new URL(window.location.href);
    if (roomCode) {
      url.searchParams.set('room', roomCode);
    } else {
      url.searchParams.delete('room');
    }
    window.history.pushState({}, '', url.toString());
  };

  const getRoomFromURL = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room');
  };

  const generateRoomCode = (): string => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const createRoom = () => {
    const roomCode = generateRoomCode();

    setCurrentRoom(roomCode);
    setShowRoomSelector(false);
    updateURL(roomCode);

    console.log(`Created room: ${roomCode}`);
  };

  const checkRoomCapacity = useCallback(async (roomCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const tempChannel = supabase.channel(`room:${roomCode}`, {
        config: { broadcast: { self: false } },
      });

      const userSet = new Set<string>();
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        tempChannel.unsubscribe();
        clearTimeout(timeoutId);
      };

      tempChannel.on('broadcast', { event: 'user_move' }, (payload) => {
        const userData = payload.payload as UserData;
        userSet.add(userData.id);
      });

      tempChannel.on('broadcast', { event: 'user_leave' }, (payload) => {
        const { userId } = payload.payload;
        userSet.delete(userId);
      });

      tempChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          tempChannel.send({
            type: 'broadcast',
            event: 'capacity_check',
            payload: { requesterId: userIdRef.current }
          });

          timeoutId = setTimeout(() => {
            cleanup();
            resolve(userSet.size < 10);
          }, 2000);
        }
      });

      tempChannel.on('broadcast', { event: 'capacity_response' }, () => {
        userSet.add('active_user');
      });
    });
  }, [supabase]);

  const joinRoom = useCallback(async (roomCode: string, forceViewer = false) => {
    if (!roomCode.trim()) return;

    setErrorMessage('');
    const roomCodeUpper = roomCode.toUpperCase();

    if (!forceViewer) {
      const hasCapacity = await checkRoomCapacity(roomCodeUpper);

      if (!hasCapacity) {
        setErrorMessage('Room is full (10/10 participants). Join as viewer instead?');
        return;
      }
    }

    setCurrentRoom(roomCodeUpper);
    setIsViewer(forceViewer);
    setShowRoomSelector(false);
    updateURL(roomCodeUpper);
  }, [checkRoomCapacity]);

  const joinAsViewer = (roomCode: string) => {
    joinRoom(roomCode, true);
  };

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'user_leave',
        payload: { userId: userIdRef.current }
      });
      channelRef.current.unsubscribe();
    }

    setCurrentRoom(null);
    setShowRoomSelector(true);
    setUsers(new Map());
    setUserCount(0);
    setIsViewer(false);
    setParticipantCount(0);
    updateURL(null);
  }, []);

  const broadcastUserData = useCallback((x: number, y: number) => {
    if (!channelRef.current) return;

    const userData: UserData = {
      id: userIdRef.current,
      x,
      y,
      timestamp: Date.now(),
      isViewer,
      ...getUserMetadata()
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'user_move',
      payload: userData
    });
  }, [isViewer]);

  // Auto-join from URL
  useEffect(() => {
    const roomFromURL = getRoomFromURL();
    if (roomFromURL && !currentRoom && showRoomSelector) {
      setJoinCode(roomFromURL);
      joinRoom(roomFromURL);
    }
  }, [currentRoom, showRoomSelector, joinRoom]);

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const roomFromURL = getRoomFromURL();
      if (roomFromURL && roomFromURL !== currentRoom) {
        setJoinCode(roomFromURL);
        joinRoom(roomFromURL);
      } else if (!roomFromURL && currentRoom) {
        leaveRoom();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentRoom, joinRoom, leaveRoom]);

  // Setup realtime channel
  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase.channel(`room:${currentRoom}`, {
      config: { broadcast: { self: true } },
    });

    channelRef.current = channel;
    const currentUserId = userIdRef.current;

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to realtime channel');
        // Send initial broadcast to include current user in counts immediately
        broadcastUserData(320, 240); // Default center position
      }
    });

    channel.on('broadcast', { event: 'user_move' }, (payload: BroadcastPayload) => {
      const userData = payload.payload as unknown as UserData;
      setUsers(prev => {
        const newUsers = new Map(prev);
        newUsers.set(userData.id, userData);
        return newUsers;
      });
    });

    channel.on('broadcast', { event: 'user_leave' }, (payload: BroadcastPayload) => {
      const { userId } = payload.payload as { userId: string };
      setUsers(prev => {
        const newUsers = new Map(prev);
        newUsers.delete(userId);
        return newUsers;
      });
    });

    channel.on('broadcast', { event: 'capacity_check' }, (payload: BroadcastPayload) => {
      const { requesterId } = payload.payload as { requesterId: string };
      if (requesterId !== currentUserId) {
        channel.send({
          type: 'broadcast',
          event: 'capacity_response',
          payload: { responderId: currentUserId }
        });
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'user_leave',
          payload: { userId: currentUserId }
        });
        channelRef.current.unsubscribe();
      }
    };
  }, [currentRoom, supabase, broadcastUserData]);

  // Update user counts
  useEffect(() => {
    const participants = Array.from(users.values()).filter(user => !user.isViewer);
    setUserCount(users.size);
    setParticipantCount(participants.length);
  }, [users]);

  return {
    // State
    currentRoom,
    joinCode,
    setJoinCode,
    showRoomSelector,
    errorMessage,
    isViewer,
    users,
    setUsers,
    userCount,
    participantCount,
    userIdRef,
    channelRef,

    // Actions
    createRoom,
    joinRoom,
    joinAsViewer,
    leaveRoom,
    broadcastUserData,
  };
};