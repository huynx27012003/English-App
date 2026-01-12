import { useOrientationContext } from '@/app/context/OrientationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

const tabLayout = () => {
  const [isSignedIn, setIsSignedIn] = useState(true); 

  // Màn tabs (home) luôn dọc
  useOrientationContext('landscape');

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("token", !!token);
        
        setIsSignedIn(!!token);
      } catch (error) {
        console.error("Error checking token:", error);
        setIsSignedIn(false);
      }
    };
    checkLogin();
  }, []);

  

  // Avoid returning before all hooks are called
  if (!isSignedIn) return <Redirect href={'/(auth)/sign-in'} />

  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}

export default tabLayout;
