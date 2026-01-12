import { useOrientationContext } from '@/app/context/OrientationContext';
import { authAPI } from '@/service/authAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

const HomeLayout = () => {
  const [isSignedIn, setIsSignedIn] = useState(true);

  // Toàn bộ stack /home luôn dọc
  useOrientationContext('portrait');

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

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}

export default HomeLayout;
