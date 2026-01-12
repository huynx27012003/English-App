import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { studySessionAPI } from '@/service/studySessionAPI';

const StudySessionContext = createContext(null);

export const StudySessionProvider = ({ children }) => {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentChildId, setCurrentChildId] = useState(null);

  const startSession = async (childId) => {
    try {
      if (!childId) return null;
      const resp = await studySessionAPI.start(childId);
      if (resp && resp.mrid) {
        setCurrentSessionId(resp.mrid);
        setCurrentChildId(childId);
        await AsyncStorage.setItem('currentSessionId', String(resp.mrid));
        await AsyncStorage.setItem('currentSessionChildId', String(childId));
        return resp.mrid;
      }
      return null;
    } catch (error) {
      console.error('startSession error:', error);
      return null;
    }
  };

  const endSession = async () => {
    if (!currentSessionId) return;
    const sessionId = currentSessionId;
    setCurrentSessionId(null);
    setCurrentChildId(null);
    await AsyncStorage.removeItem('currentSessionId');
    await AsyncStorage.removeItem('currentSessionChildId');
    try {
      await studySessionAPI.end(sessionId);
    } catch (error) {
      console.error('endSession error:', error);
    }
  };

  // Khôi phục trạng thái session (nếu còn) khi app mở lại
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedId = await AsyncStorage.getItem('currentSessionId');
        const savedChildId = await AsyncStorage.getItem('currentSessionChildId');
        if (savedId && savedChildId) {
          setCurrentSessionId(Number(savedId));
          setCurrentChildId(Number(savedChildId));
        }
      } catch (error) {
        console.error('restoreSession error:', error);
      }
    };
    restoreSession();
  }, []);

  // Gửi heartbeat định kỳ khi có session
  useEffect(() => {
    if (!currentSessionId) return undefined;
    const intervalId = setInterval(() => {
      studySessionAPI.heartbeat(currentSessionId).catch((e) =>
        console.warn('heartbeat error', e)
      );
    }, 60_000); // 60s
    return () => clearInterval(intervalId);
  }, [currentSessionId]);

  // Khi app vào background/inactive thì end session
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        if (currentSessionId) {
          endSession();
        }
      }
    });
    return () => sub.remove();
  }, [currentSessionId]);

  const value = {
    currentSessionId,
    currentChildId,
    startSession,
    endSession,
  };

  return (
    <StudySessionContext.Provider value={value}>
      {children}
    </StudySessionContext.Provider>
  );
};

export const useStudySession = () => {
  const ctx = useContext(StudySessionContext);
  if (!ctx) {
    throw new Error('useStudySession must be used within StudySessionProvider');
  }
  return ctx;
};

