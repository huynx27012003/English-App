import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import Svg, { Path } from "react-native-svg";
import { moveToNextGameOrComplete } from "./game-flow";

const { height, width } = Dimensions.get("window");

// SVG Icons
const PencilIcon = ({ size = 24, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"
      fill={color}
    />
  </Svg>
);

const TrashIcon = ({ size = 24, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
      fill={color}
    />
  </Svg>
);

const CheckIcon = ({ size = 24, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SparklesIcon = ({ size = 24, color = "#FFCF25" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22l-.394-1.433a2.25 2.25 0 00-1.423-1.423L13.5 19l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 16l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 19l-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      fill={color}
    />
  </Svg>
);

const GameDraw = () => {
  const ref = useRef();
  const router = useRouter();
  const animationRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [targetImage, setTargetImage] = useState(null);
  const [drawnImage, setDrawnImage] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showWrongFlash, setShowWrongFlash] = useState(false);
  const wrongFlashOpacity = useRef(new Animated.Value(0)).current;

  const loadAnswer = async () => {
    try {
      setLoading(true);
      const levelId = await AsyncStorage.getItem("levelId");
      const result = await vocabAPI.getVocabDetail(levelId);
      
      if (result && result.word) {
        setCorrectAnswer(result.word);
        if (result.imageUrl) {
          setTargetImage(result.imageUrl);
        }
      }
    } catch (error) {
      console.log("Error loading answer:", error);
      setCorrectAnswer("TIGER");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnswer();
  }, []);

  const handleSubmit = () => {
    if (!hasDrawn) {
      Alert.alert("⚠️ Chưa vẽ", "Hãy vẽ gì đó trước khi nộp bài!");
      return;
    }
    ref.current.readSignature();
  };

  const handleOK = async (signature) => {
    if (!signature) return;

    const dataUri = signature.startsWith("data:")
      ? signature
      : `data:image/png;base64,${signature}`;

    setDrawnImage(dataUri);
    setEvaluating(true);

    try {
      const result = await evaluateDrawing(signature, correctAnswer);
      
      setScore(result.score);
      setFeedback(result.feedback);

      if (result.score >= 70) {
        setShowResult(true);
        animationRef.current?.play();
      } else {
        setShowWrongFlash(true);
        Animated.sequence([
          Animated.timing(wrongFlashOpacity, {
            toValue: 0.7,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(wrongFlashOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          wrongFlashOpacity.setValue(0);
          setShowWrongFlash(false);
          handleClear();
        });
      }
      
    } catch (error) {
      console.log("Error evaluating drawing:", error);
      Alert.alert("Lỗi", "Không thể đánh giá bức vẽ. Vui lòng thử lại!");
    } finally {
      setEvaluating(false);
    }
  };

  const evaluateDrawing = async (base64Image, targetWord) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const randomScore = Math.floor(Math.random() * 30) + 70;
      
      let feedback = "";
      if (randomScore >= 90) {
        feedback = "Excellent! Your drawing is amazing!";
      } else if (randomScore >= 70) {
        feedback = "Good job! Keep practicing!";
      } else {
        feedback = "Nice try! Let's practice more!";
      }
      
      return {
        score: randomScore,
        feedback: feedback
      };
      
    } catch (error) {
      throw error;
    }
  };

  const handleClear = () => {
    ref.current.clearSignature();
    setHasDrawn(false);
    setDrawnImage(null);
  };

  const handleBegin = () => {
    setHasDrawn(true);
  };

  const handleContinueFlow = async () => {
    setShowResult(false);
    await moveToNextGameOrComplete(router);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4AA378" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      
      <View style={styles.content}>
        {/* Left Section - Reference Image */}
        <View style={styles.leftSection}>
          <View style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <PencilIcon size={28} color="#4AA378" />
              <Text style={styles.instructionTitle}>Draw the word</Text>
            </View>
            
            <View style={styles.wordBadge}>
              <SparklesIcon size={24} color="#FFCF25" />
              <Text style={styles.instructionWord}>{correctAnswer}</Text>
              <SparklesIcon size={24} color="#FFCF25" />
            </View>
          </View>
          
          <View style={styles.imageCard}>
            {targetImage ? (
              <Image 
                style={styles.image} 
                contentFit="contain" 
                source={{ uri: targetImage }}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>Reference Image</Text>
              </View>
            )}
            <View style={styles.imageLabel}>
              <Text style={styles.imageLabelText}>Reference</Text>
            </View>
          </View>
        </View>

        {/* Right Section - Drawing Canvas */}
        <View style={styles.rightSection}>
          <View style={styles.canvasCard}>
            <View style={styles.canvasHeader}>
              <Text style={styles.canvasTitle}>Your Drawing</Text>
              {hasDrawn && (
                <View style={styles.drawingIndicator}>
                  <View style={styles.drawingDot} />
                  <Text style={styles.drawingText}>Drawing...</Text>
                </View>
              )}
            </View>

            <View style={styles.canvas}>
              <SignatureScreen
                ref={ref}
                onOK={handleOK}
                onBegin={handleBegin}
                onEmpty={() => console.log("Empty")}
                autoClear={false}
                descriptionText=""
                clearText="Clear"
                confirmText="Save"
                webStyle={`
                  .m-signature-pad { 
                    box-shadow: none; 
                    border: none; 
                  }
                  .m-signature-pad--footer { 
                    display: none; 
                    margin: 0px; 
                  }
                  body, html {
                    margin: 0;
                    padding: 0;
                  }
                  canvas {
                    background-color: white;
                  }
                `}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClear}
                activeOpacity={0.8}
              >
                <TrashIcon size={20} color="#fff" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  evaluating && styles.submitButtonDisabled
                ]} 
                onPress={handleSubmit}
                disabled={evaluating}
                activeOpacity={0.8}
              >
                {evaluating ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitButtonText}>Checking...</Text>
                  </>
                ) : (
                  <>
                    <CheckIcon size={22} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Wrong Answer Flash */}
        {showWrongFlash && (
          <Animated.View
            pointerEvents="none"
            style={[styles.wrongOverlay, { opacity: wrongFlashOpacity }]}
          />
        )}
      </View>

      {/* Success Modal */}
      {showResult && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultBox}>
            <LottieView
              ref={animationRef}
              source={require('../../assets/animations/celebrate.json')}
              autoPlay
              loop={false}
              style={styles.celebrationAnimation}
            />

            <View style={styles.resultContent}>
              <View style={styles.resultHeader}>
                <SparklesIcon size={40} color="#FFCF25" />
                <Text style={styles.resultTitle}>Fantastic!</Text>
                <SparklesIcon size={40} color="#FFCF25" />
              </View>

              <View style={styles.scoreCircle}>
                <Text style={styles.resultScore}>{score}</Text>
                <Text style={styles.scoreLabel}>points</Text>
              </View>

              <Text style={styles.resultFeedback}>{feedback}</Text>

              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleContinueFlow}
                activeOpacity={0.9}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    stroke="#fff"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FFFE",
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E8F5F1',
    top: -100,
    right: -100,
    opacity: 0.5,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF9E6',
    bottom: -50,
    left: -50,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 24,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFFE',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },

  // Left Section
  leftSection: {
    flex: 0.35,
    gap: 20,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#4AA378',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '700',
  },
  wordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9F4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#4AA378',
  },
  instructionWord: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4AA378',
    letterSpacing: 1,
  },
  imageCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  imageLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(74, 163, 120, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  imageLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Right Section
  rightSection: {
    flex: 0.65,
  },
  canvasCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  canvasTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  drawingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drawingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4AA378',
  },
  drawingText: {
    fontSize: 14,
    color: '#4AA378',
    fontWeight: '600',
  },
  canvas: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: "#EF4444",
    borderRadius: 14,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
    paddingVertical: 14,
    backgroundColor: "#4AA378",
    borderRadius: 14,
    shadowColor: "#4AA378",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 160,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  // Result Modal
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  resultBox: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    width: width * 0.5,
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 15,
  },
  celebrationAnimation: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -80,
  },
  resultContent: {
    alignItems: 'center',
    width: '100%',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#333',
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0F9F4',
    borderWidth: 6,
    borderColor: '#4AA378',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultScore: {
    fontSize: 48,
    color: '#4AA378',
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
  },
  resultFeedback: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFCF25',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#FFCF25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  wrongOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(239, 68, 68, 0.4)",
    zIndex: 50,
  },
});

export default GameDraw;