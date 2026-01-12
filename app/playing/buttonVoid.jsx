import { Mic } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function VoiceButton() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const gesture = Gesture.LongPress()
    .minDuration(100)
    .onStart(() => {
      // Khi bắt đầu giữ, cho sóng chạy
      opacity.value = 1;
      scale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    })
    .onEnd(() => {
      // Khi thả ra thì dừng sóng
      cancelAnimation(scale);
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = 1;
    });

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container_mic}>
      <Text style={styles.title_mic}>Press and hold</Text>

      <GestureDetector gesture={gesture}>
        <View style={styles.micContainer}>
          {/* Vòng tròn hiệu ứng */}
          <Animated.View style={[styles.ripple, rippleStyle]} />
          <View style={styles.micButton}>
            <Mic size={36} color="#fff" />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container_mic: {
    alignItems: "center",
    marginTop: 50,
  },
  title_mic: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E14B00",
    marginBottom: 20,
  },
  micContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  ripple: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#4DA6FF55",
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
});