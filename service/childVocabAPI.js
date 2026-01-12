import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://103.163.118.212:30831/api";

export const childVocabAPI = {
  createChildVocab: async (childId, vocabId) => {
    const token = await AsyncStorage.getItem("token");
    try {
      console.log(
        "[childVocabAPI] createChildVocab params:",
        "childId=",
        childId,
        "vocabId=",
        vocabId
      );
      console.log("[childVocabAPI] has token:", !!token);

      const response = await fetch(
        `${BASE_URL}/child-vocab/create?child_id=${childId}&vocab_id=${vocabId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let bodyText = "";
        try {
          bodyText = await response.text();
        } catch {
          bodyText = "<cannot read body>";
        }
        console.log(
          "[childVocabAPI] Error createChildVocab:",
          response.status,
          bodyText
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error createChildVocab:", error);
      return false;
    }
  },
  
addCandy: async (childId, candyNumber) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const response = await fetch(`${BASE_URL}/children/add-candy?childId=${childId}&candyNumber=${candyNumber}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();
      if (!text) {
        console.warn("addCandy: empty response body");
        return null;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("addCandy: non-JSON response body", text);
        return null;
      }

      return data|| null;
    } catch (error) {
      console.error("Error addCandy:", error);
      return null;
    }
  },
};
