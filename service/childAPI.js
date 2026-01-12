import AsyncStorage from "@react-native-async-storage/async-storage";
const BASE_URL = "http://103.163.118.212:30831/api";

export const childAPI = {
  getChild: async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(`${BASE_URL}/children/get-all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      if (!text) {
        console.warn("getChild: empty response body");
        return [];
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("getChild: non‑JSON response body", text);
        return [];
      }
      return data?.data || [];
    } catch (error) {
      console.error("Error getChild:", error);
      return [];
    }
  },
  getChildDetail: async (id) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(`${BASE_URL}/children/detail?childId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      if (!text) {
        console.warn("getChildDetail: empty response body");
        return null;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("getChildDetail: non‑JSON response body", text);
        return null;
      }
      return data?.data || null;
    } catch (error) {
      console.error("Error getChildDetail:", error);
      return [];
    }
  },

  uploadAvatar: async (childId, fileUri) => {
    const token = await AsyncStorage.getItem("token");
    const formData = new FormData();
    formData.append("childId", String(childId));
    formData.append("file", {
      uri: fileUri,
      name: "avatar.jpg",
      type: "image/jpeg",
    });

    try {
      const response = await fetch(
        `${BASE_URL}/children/upload-avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      const text = await response.text();
      if (!text) {
        console.warn("uploadAvatar: empty response body");
        return null;
      }
      const data = JSON.parse(text);
      return data?.data || null;
    } catch (error) {
      console.error("Error uploadAvatar:", error);
      return null;
    }
  },
  addChild: async (childData) => {
    const token = await AsyncStorage.getItem("token");

    try {
      const response = await fetch(`${BASE_URL}/children/addChild`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(childData),
      });

      const text = await response.text();
      if (!text) {
        console.warn("addChild: empty response body");
        return null;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("addChild: non-JSON response body", text);
        return null;
      }

      return data?.data || null;
    } catch (error) {
      console.error("Error addChild:", error);
      return null;
    }
  },

};
