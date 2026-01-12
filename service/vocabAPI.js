import AsyncStorage from "@react-native-async-storage/async-storage";

// Base URL backend English service
const BASE_URL = "http://103.163.118.212:30831/api";

export const vocabAPI = {
  getVocab: async (topicId, childId) => {
    const token = await AsyncStorage.getItem("token");

    try {
      const response = await fetch(
        `${BASE_URL}/topic/get-vocab?topicId=${topicId}&childId=${childId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const text = await response.text();
      if (!text) {
        console.warn("getVocab: empty response body");
        return [];
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("getVocab: non-JSON response body", text);
        return [];
      }

      const rawItems = data?.data || [];

   
      const mappedLevels = rawItems.map((item, index) => ({
        id: item.mrid,
        number: index + 1,
        word: item.word,
        meaning: item.meaning,
        url: item.url,
        type: item.type,
        completed: !!item.completed,
        locked: true,
      }));

      if (mappedLevels.length > 0) {
        mappedLevels[0].locked = false;

        for (let i = 1; i < mappedLevels.length; i += 1) {
          const prev = mappedLevels[i - 1];
          const current = mappedLevels[i];

      
          current.locked = !(prev.completed || current.completed);
        }
      }

      return mappedLevels;
    } catch (error) {
      console.error("Error getVocab:", error);
      return [];
    }
  },

  generateVocab: async (message) => {
    const token = await AsyncStorage.getItem("token");

    try {
      const response = await fetch(
        `${BASE_URL}/chat?message=${encodeURIComponent(message)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error generateVocab:", error);
      return [];
    }
  },

  getVocabDetail: async (vocabId) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(
        `${BASE_URL}/vocab/detail?vocab_id=${vocabId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const text = await response.text();
      if (!text) {
        console.warn("getVocabDetail: empty response body");
        return null;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("getVocabDetail: non-JSON response body", text);
        return null;
      }
      return data?.data || null;
    } catch (error) {
      console.error("Error getChildDetail:", error);
      return null;
    }
  },

  updateSoundUrl: async (vocabId, soundUrl) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(
        `${BASE_URL}/vocab/update-sound?vocab_id=${vocabId}&sound_url=${encodeURIComponent(soundUrl)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const text = await response.text();
        console.warn("updateSoundUrl failed:", text);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error updateSoundUrl:", error);
      return false;
    }
  },
};
