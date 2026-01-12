import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://103.163.118.212:30831/api";

export const reportAPI = {
  getChildReport: async (childId) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(
        `${BASE_URL}/children/report?childId=${childId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const text = await response.text();
      if (!text) {
        console.warn("getChildReport: empty response body");
        return null;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("getChildReport: non-JSON response body", text);
        return null;
      }
      return data?.data || null;
    } catch (error) {
      console.error("Error getChildReport:", error);
      return null;
    }
  },
};
