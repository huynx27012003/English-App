import { OrientationProvider } from '@/app/context/OrientationContext';
import { StudySessionProvider } from '@/app/context/StudySessionContext';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { Platform } from 'react-native';

// Polyfills for React Native (non-web) to satisfy Clerk OAuth internals
if (Platform.OS !== 'web') {
  // CustomEvent
  if (typeof global.CustomEvent === 'undefined') {
    global.CustomEvent = function CustomEvent(type, eventInitDict) {
      return { type, ...eventInitDict };
    };
  }
  // window and dispatchEvent stubs
  if (typeof global.window === 'undefined') {
    global.window = global;
  }
  if (typeof global.window.dispatchEvent !== 'function') {
    global.window.dispatchEvent = () => false;
  }
  if (typeof global.window.addEventListener !== 'function') {
    global.window.addEventListener = () => {};
  }
  if (typeof global.window.removeEventListener !== 'function') {
    global.window.removeEventListener = () => {};
  }
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey="pk_test_Zm9uZC1kb3J5LTI1LmNsZXJrLmFjY291bnRzLmRldiQ">
      <OrientationProvider>
        <StudySessionProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 200,
            }}
          />
        </StudySessionProvider>
      </OrientationProvider>
    </ClerkProvider>
  );
}
