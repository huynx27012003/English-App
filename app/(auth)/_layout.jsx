import { authAPI } from '@/service/authAPI';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function AuthRoutesLayout() {
  const [isSignedIn, setIsSignedIn] = useState(false); 

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const check = await authAPI.checkToken(token);
        setIsSignedIn(check);
      } catch (error) {
        console.error("Error checking token:", error);
        setIsSignedIn(false);
      }
    };
    checkLogin();
  }, []);

  if (isSignedIn) {
    return <Redirect href="/home/child-profiles" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
