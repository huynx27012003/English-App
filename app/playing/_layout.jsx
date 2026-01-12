import { useOrientationContext } from '@/app/context/OrientationContext';
import { Slot, Stack, useRouter } from 'expo-router';
import { StatusBar, StyleSheet } from 'react-native';
import Header from "./header";

export default function _layout() {
  const router = useRouter();

  useOrientationContext('landscape');

  return (
    <>
      <StatusBar hidden />
      <Header onBack={() => router.back()} />
      <Stack screenOptions={{ headerShown: false }}>
        <Slot />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({});