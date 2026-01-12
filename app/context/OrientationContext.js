import * as ScreenOrientation from 'expo-screen-orientation';
import { AppState } from 'react-native';
import { createContext, useContext, useEffect, useRef } from 'react';

const OrientationContext = createContext();

export const OrientationProvider = ({ children }) => {
  const currentOrientationRef = useRef(null);

  const lockOrientation = async (orientation) => {
    // Avoid relocking if already at desired orientation
    if (currentOrientationRef.current === orientation) {
      return;
    }

    try {
      await ScreenOrientation.unlockAsync();

      if (orientation === 'landscape') {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      }

      currentOrientationRef.current = orientation;
    } catch (error) {
      console.error('Error locking orientation:', error);
    }
  };

  // Re-lock orientation when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && currentOrientationRef.current) {
        lockOrientation(currentOrientationRef.current);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <OrientationContext.Provider value={{ lockOrientation }}>
      {children}
    </OrientationContext.Provider>
  );
};

export const useOrientationContext = (orientation) => {
  const context = useContext(OrientationContext);

  if (!context) {
    throw new Error(
      'useOrientationContext must be used within OrientationProvider'
    );
  }

  useEffect(() => {
    if (orientation) {
      context.lockOrientation(orientation);
    }
  }, [orientation, context]);

  return context;
};

