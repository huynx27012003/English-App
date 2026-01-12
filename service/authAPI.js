const BASE_URL = "http://103.163.118.212:30831/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const text = await response.text();
      if (!text) {
        console.error("Login: empty response body");
        return null;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Login: response is not JSON, raw=", text);
        return null;
      }

      if (response.ok && data.success) {
        return data.data;
      }
      console.error("Login failed:", data);
      return null;
    } catch (error) {
      console.error("Error login:", error);
      return null;
    }
  },
  register: async (username, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const text = await response.text();
    if (!text) {
      return { success: false, message: "Empty response" };
    }

    const data = JSON.parse(text);

    return data;

  } catch (error) {
    console.error("register error:", error);
    return {
      success: false,
      message: "Network error",
    };
  }
},
  clerkLogin: async ({ email, fullName, avatarUrl, token }) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/clerk-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, avatarUrl, token }),
      });

      const text = await response.text();
      if (!text) {
        console.error(
          "Clerk login: empty response body",
          "status=",
          response.status,
          "url=",
          response.url
        );
        return null;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error(
          "Clerk login: response is not JSON",
          "status=",
          response.status,
          "url=",
          response.url,
          "raw=",
          text
        );
        return null;
      }

      if (response.ok && data?.success) {
        return data.data;
      }
      console.error(
        "Clerk login failed:",
        "status=",
        response.status,
        "url=",
        response.url,
        data
      );
      return null;
    } catch (error) {
      console.error("Error clerkLogin:", error);
      return null;
    }
  },
  myProfile: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/auth/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      if (!text) {
        console.error("Get profile: empty response body");
        return null;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Get profile: response is not JSON, raw=", text);
        return null;
      }
      if (response.ok && data.success) {
        return data.data;
      }
      console.error("Get profile failed:", data);
      return null;
    } catch (error) {
      console.error("Error get profile:", error);
      return null;
    }
  },
  updateProfile: async (fullName, email, phone) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/auth/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, email, phone }),
      });
      const text = await response.text();
      if (!text) {
        console.warn("updateProfile: empty response body");
        return null;
      }
      const data = JSON.parse(text);
      return data?.data || null;
    } catch (error) {
      console.error("Error update profile:", error);
      return null;
    }
  },
  changePassword: async (newPassword, confirmPassword) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const text = await response.text();
      if (!text) {
        return { success: false, message: "Empty response" };
      }

      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error("Error change password:", error);
      return {
        success: false,
        message: "Network error",
      };
    }
  },
  uploadAvatar: async (fileUri) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: "avatar.jpg",
        type: "image/jpeg",
      });

      const response = await fetch(`${BASE_URL}/auth/upload-avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      if (!text) {
        console.warn("uploadAvatar (user): empty response body");
        return null;
      }
      const data = JSON.parse(text);
      return data?.data || null;
    } catch (error) {
      console.error("Error upload user avatar:", error);
      return null;
    }
  },
  checkToken: async (token) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/introspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const text = await response.text();
      if (!text) {
        console.warn("introspect: empty response body");
        return null;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("introspect: response is not JSON, raw=", text);
        return null;
      }

      return data?.data?.valid ?? null;
    } catch (error) {
      console.error("Error introspect token:", error);
      return null;
    }
  },
  googleUrl: async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/google/url`, {
        method: "GET",
      });
      const data = await response.json();
      return data;

    } catch (error) {
      console.error("Error get loginUrl:", error);
      return null;
    }
  },
};
