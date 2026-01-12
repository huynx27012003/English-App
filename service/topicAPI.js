import AsyncStorage from "@react-native-async-storage/async-storage";
const BASE_URL = "http://103.163.118.212:30831/api";

export const topicAPI = {
  getTopic: async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/children/topics?childId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      if (!text) {
        console.warn("getTopic: empty response body");
        return {
          total: 0,
          items: [],
        };
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("getTopic: non‑JSON response body", text);
        return {
          total: 0,
          items: [],
        };
      }
      const topics = data?.data || [];

      return {
        total: topics.length,
        items: topics,
      };
    } catch (error) {
      console.error("Error getTopic:", error);
      return {
        total: 0,
        items: [],
      };
    }
  },
  createTopic: async (name, childId, vocabList) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/topic/create-topic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          childId,
          vocabList,
        }),
      });

      const text = await response.text();
      if (!text) {
        console.warn("createTopic: empty response body");
        return null;
      }
      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error("Error createTopic:", error);
      return null;
    }
  },
  deleteTopic: async (topicId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/topic/delete?topic_id=${topicId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const text = await response.text();
      if (!text) {
        console.warn("deleteTopic: empty response body");
        return null;
      }
      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error("Error deleteTopic:", error);
      return null;
    }
  },
};
