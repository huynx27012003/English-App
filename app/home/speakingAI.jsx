import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { chatAPI } from "@/service/chatAPI";
import { COLORS } from "@/constants/colors";

export default function SpeakingAI() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const scrollViewRef = useRef(null);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const typingIntervalRef = useRef(null);

  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (e) {
        console.log("Audio init error:", e);
      }
    };

    initAudio();

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      try {
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync();
        }
      } catch (_) { }
      recordingRef.current = null;

      try {
        if (soundRef.current) {
          soundRef.current.unloadAsync();
        }
      } catch (_) { }
      soundRef.current = null;

      chatAPI.clearHistory();
    };
  }, []);

  useEffect(() => {
    if (isBotSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isBotSpeaking]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const showReplyTextWithTyping = async (fullText, messageId) => {
    setIsBotSpeaking(true);
    const words = fullText.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, text: currentText } : msg
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 200)); 
    }
    setIsBotSpeaking(false);
  };

  const playReplyAudio = async (audioBase64) => {
    if (!audioBase64) return;

    try {
      const filePath = `${FileSystem.cacheDirectory}chat-bot-${Date.now()}.mp3`;
      const encoding =
        (FileSystem.EncodingType && FileSystem.EncodingType.Base64) ||
        "base64";
      await FileSystem.writeAsStringAsync(filePath, audioBase64, {
        encoding,
      });

      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (_) { }
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: filePath },
        { volume: 1.0, isMuted: false }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          try {
            await sound.unloadAsync();
          } catch (_) { }
          soundRef.current = null;
          try {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
          } catch (_) { }
          setIsBotSpeaking(false);
        }
      });

      try {
        await sound.setVolumeAsync(1.0);
      } catch (_) { }
      await sound.playAsync();
    } catch (e) {
      console.log("Error playing reply audio:", e);
      setIsBotSpeaking(false);
    }
  };

  const startRecording = async () => {
    if (isProcessing || isRecording || isBotSpeaking) return;

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.log("Microphone permission not granted");
        return;
      }

      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (e) {
      console.log("startRecording error:", e);
      setIsRecording(false);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recordingRef.current || !isRecording) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        setIsProcessing(false);
        return;
      }

      const result = await chatAPI.sendAudio(uri);
      if (!result) {
        setIsProcessing(false);
        return;
      }

      const { userText, replyText, audioBase64 } = result;

      if (userText) {
        const userMsg = {
          id: `${Date.now()}-u`,
          from: "user",
          text: userText,
        };
        setMessages((prev) => [...prev, userMsg]);
      }

      if (replyText) {
        const botMsgId = `${Date.now()}-b`;
        const botMsg = {
          id: botMsgId,
          from: "bot",
          text: "",
        };
        setMessages((prev) => [...prev, botMsg]);

        showReplyTextWithTyping(replyText, botMsgId);
      }

      if (audioBase64) {
        await playReplyAudio(audioBase64);
      }
    } catch (error) {
      console.log("stopRecordingAndSend error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  };

  const handleEndConversation = async () => {
    try {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (_) { }
        soundRef.current = null;
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      await chatAPI.clearHistory();
    } finally {
      router.back();
    }
  };

  const renderMessageBubble = (msg) => {
    const isUser = msg.from === "user";
    return (
      <View
        key={msg.id}
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
        ]}
      >
        <Text style={styles.bubbleText}>{msg.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleEndConversation}
            style={styles.backButton}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Speaking with AI</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessageBubble)}
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.voiceWrapper}>
            <Animated.View
              style={[
                styles.micButtonContainer,
                { transform: [{ scale: isBotSpeaking ? scaleAnim : 1 }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonRecording,
                  isBotSpeaking && styles.micButtonSpeaking,
                ]}
                onPress={handleMicPress}
                disabled={isProcessing || isBotSpeaking}
              >
                <Text style={styles.micButtonText}>
                  {isRecording
                    ? "Tap to stop"
                    : isBotSpeaking
                      ? "AI Speaking..."
                      : isProcessing
                        ? "Processing..."
                        : "Tap to speak"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndConversation}
            >
              <Text style={styles.endButtonText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0D4BF",
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 4,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#FFCF25",
  },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "#E5D3B7",
  },
  bubbleText: {
    color: COLORS.text,
    fontSize: 15,
  },
  bottomBar: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 18 : 22,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0D4BF",
    backgroundColor: COLORS.background,
  },
  voiceWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  micButtonContainer: {
    flex: 1,
    marginRight: 8,
  },
  micButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#3A94E7",
  },
  micButtonRecording: {
    backgroundColor: "#FF9B4B",
  },
  micButtonSpeaking: {
    backgroundColor: "#8B5CF6",
  },
  micButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  endButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#FF4B4B",
  },
  endButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
