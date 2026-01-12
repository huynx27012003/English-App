import { useOrientationContext } from "@/app/context/OrientationContext";
import { Stack } from "expo-router";

const ProfileLayout = () => {
  useOrientationContext("portrait");

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="editProfile" />
      <Stack.Screen name="report" />
    </Stack>
  );
};

export default ProfileLayout;
