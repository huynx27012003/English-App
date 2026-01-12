import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://103.163.118.212:30831/api';

export const studySessionAPI = {
  start: async (childId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`${BASE_URL}/child/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ childId }),
      });
      const text = await response.text();
      if (!text) {
        console.warn('studySession.start: empty response body');
        return null;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn('studySession.start: non-JSON response body', text);
        return null;
      }
      return data?.data || null;
    } catch (error) {
      console.error('studySession.start error:', error);
      return null;
    }
  },

  end: async (sessionId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`${BASE_URL}/child/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      const text = await response.text();
      if (!text) {
        console.warn('studySession.end: empty response body');
        return null;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn('studySession.end: non-JSON response body', text);
        return null;
      }
      return data?.data || null;
    } catch (error) {
      console.error('studySession.end error:', error);
      return null;
    }
  },

  heartbeat: async (sessionId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await fetch(`${BASE_URL}/child/session/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error('studySession.heartbeat error:', error);
    }
  },
};

