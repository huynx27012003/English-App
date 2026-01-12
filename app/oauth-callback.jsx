import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

const OAuthCallbackScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, error } = params;

  useEffect(() => {
    const handleToken = async () => {
      if (token) {
        await AsyncStorage.setItem("token", String(token));
        router.replace("/home/child-profiles");
      } else {
        // Nếu có lỗi hoặc không có token thì quay lại màn sign-in
        router.replace("/(auth)/sign-in");
      }
    };

    handleToken();
  }, [token, error]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default OAuthCallbackScreen;

