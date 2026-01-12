import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Mic } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { moveToNextGameOrComplete } from "./game-flow";

const { height, width } = Dimensions.get("window");

function VoiceButton({ targetWord, onScoreReceived }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      console.log("Start recording...");
      
      // Xin quyền microphone
      const { status } = await Audio.requestPermissionsAsync();
      console.log("Permission status:", status);
      
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền microphone để sử dụng tính năng này");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      console.log("Recording created");
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Lỗi", "Không thể bắt đầu ghi âm: " + err.message);
    }
  };

  const stopRecording = async () => {
    console.log("Stop recording...");
    if (!recording) {
      console.log("No recording to stop");
      return;
    }

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("Recording URI:", uri);
      setRecording(null);

      // Gửi file âm thanh lên server để chấm điểm
      await sendAudioForScoring(uri);
    } catch (err) {
      console.error("Failed to stop recording", err);
      Alert.alert("Lỗi", "Không thể dừng ghi âm: " + err.message);
    }
  };

  const sendAudioForScoring = async (audioUri) => {
    try {
      console.log("Sending audio for scoring...");
      // Tạo FormData để upload file
      // const formData = new FormData();
      // formData.append("audio", {
      //   uri: audioUri,
      //   type: "audio/m4a",
      //   name: "recording.m4a",
      // });
      // formData.append("targetWord", targetWord);

      // // Gọi API chấm điểm (thay URL này bằng API endpoint của bạn)
      // const response = await fetch("YOUR_API_ENDPOINT/score-pronunciation", {
      //   method: "POST",
      //   body: formData,
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //   },
      // });

      // const result = await response.json();
      
      // if (result.score !== undefined) {
        onScoreReceived(100);
      // } else {
      //   Alert.alert("Lỗi", "Không thể nhận điểm từ server");
      // }
    } catch (error) {
      console.error("Error scoring audio:", error);
      Alert.alert("Lỗi", "Không thể gửi âm thanh để chấm điểm: " + error.message);
    }
  };

  const handlePressIn = async () => {
    console.log("Press in - starting animation and recording");
    try {
      opacity.value = 1;
      scale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      await startRecording();
    } catch (error) {
      console.error("Error in handlePressIn:", error);
    }
  };

  const handlePressOut = async () => {
    console.log("Press out - stopping animation and recording");
    try {
      cancelAnimation(scale);
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = 1;
      await stopRecording();
    } catch (error) {
      console.error("Error in handlePressOut:", error);
    }
  };

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container_mic}>
      <Text style={styles.title_mic}>Press and hold</Text>

      <View style={styles.micContainer}>
        <Animated.View style={[styles.ripple, rippleStyle]} />
        <TouchableOpacity 
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.micButton, isRecording && styles.micButtonActive]}
        >
          <Mic size={36} color="#fff" />
        </TouchableOpacity>
      </View>

      {isRecording && (
        <Text style={styles.recordingText}>🎙️ Recording...</Text>
      )}
    </View>
  );
}

const GameSpeak = () => {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(null);
  const [targetWord, setTargetWord] = useState("");
  const [score, setScore] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const levelId = await AsyncStorage.getItem("levelId");
        const result = await vocabAPI.getVocabDetail(levelId);
        if (result && result.word) {
          setTargetWord(result.word);
          const rawUrl = result.url || result.imageUrl;
          if (rawUrl && !rawUrl.toLowerCase().endsWith(".json")) {
            setImageUrl(rawUrl);
          } else {
            setImageUrl(null);
          }
        }
      } catch (error) {
        console.log("Error loading speak image:", error);
        setImageUrl(null);
      }
    };

    load();
  }, []);

  const handleScoreReceived = (receivedScore) => {
    setScore(receivedScore);
    
    // Hiển thị thông báo điểm
    let message = "";
    if (receivedScore >= 90) {
      message = "Xuất sắc! 🎉";
    } else if (receivedScore >= 70) {
      message = "Tốt lắm! 👍";
    } else if (receivedScore >= 50) {
      message = "Khá đấy! 😊";
    } else {
      message = "Cố gắng thêm nhé! 💪";
    }
    
    Alert.alert(
      "Kết quả",
      `${message}\nĐiểm số: ${receivedScore}/100`,
      [{ text: "OK" }]
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.content}>
        {/* Phần bên trái - ảnh target word */}
        <View style={styles.leftSection}>
          {imageUrl ? (
            <Image
              style={styles.image}
              contentFit="contain"
              source={{ uri: imageUrl }}
            />
          ) : (
            <View
              style={[
                styles.image,
                { justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text style={{ fontSize: 18, color: "#666" }}>No image</Text>
            </View>
          )}
          
          {/* Hiển thị từ cần phát âm */}
          <Text style={styles.targetWordText}>{targetWord}</Text>
          
          {/* Hiển thị điểm */}
          {score !== null && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score: {score}/100</Text>
            </View>
          )}
        </View>

        {/* Phần bên phải - Button Microphone */}
        <View style={styles.rightSection}>
          <VoiceButton 
            targetWord={targetWord} 
            onScoreReceived={handleScoreReceived}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={async () => {
          await moveToNextGameOrComplete(router);
        }}
        style={styles.button_next}
      >
        <Text style={styles.button_text}>Next</Text>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFEFF",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  leftSection: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 20,
  },
  image: {
    width: "100%",
    height: "70%",
  },
  targetWordText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
  },
  scoreContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#4DA6FF",
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  rightSection: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 20,
  },
  button_next: {
    position: "absolute",
    bottom: 15,
    right: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#FFCF25",
    borderRadius: 12,
    width: 110,
  },
  button_text: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
  },
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
  micButtonActive: {
    backgroundColor: "#E14B00",
  },
  recordingText: {
    marginTop: 15,
    fontSize: 18,
    color: "#E14B00",
    fontWeight: "600",
  },
});

export default GameSpeak;