import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://103.163.118.212:30831/api";

export const chatAPI = {
  sendMessage: async (message) => {
    const token = await AsyncStorage.getItem("token");

    try {
      const response = await fetch(
        `${BASE_URL}/chat?message=${encodeURIComponent(message)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      return data.data || "";
    } catch (error) {
      console.error("Error sendMessage:", error);
      return "";
    }
  },

  /**
   * Gửi file audio lên BE để STT + chat + TTS.
   * audioUri: đường dẫn local (expo-av Recording.getURI()).
   */
  sendAudio: async (audioUri) => {
    const token = await AsyncStorage.getItem("token");

    const formData = new FormData();
    formData.append("audio", {
      uri: audioUri,
      name: "speech.m4a",
      type: "audio/m4a",
    });

    try {
      const response = await fetch(`${BASE_URL}/chat/audio`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error("Error sendAudio:", error);
      return null;
    }
  },

  clearHistory: async () => {
    const token = await AsyncStorage.getItem("token");

    try {
      await fetch(`${BASE_URL}/chat/clear-history`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error clearHistory:", error);
    }
  },
};
