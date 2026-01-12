import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import LottieView from "lottie-react-native";
import Loading2 from "../loading/loading2";
import { moveToNextGameOrComplete } from "./game-flow";

const { width: INIT_WIDTH, height: INIT_HEIGHT } = Dimensions.get("window");
const TARGET_CORRECT = 6;

const gamePick = () => {
  const { width, height } = useWindowDimensions();
  const [balloons, setBalloons] = useState([]);
  const nextBalloonId = useRef(0);
  const intervalRef = useRef(null);
  const router = useRouter();

  const [balloonTexts, setBalloonTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWrongFlash, setShowWrongFlash] = useState(false);

  const wrongFlashOpacity = useRef(new Animated.Value(0)).current;
  const celebrateRef = useRef(null);
  const [yaySound, setYaySound] = useState(null);

  const balloonImages = [
    require("../../assets/images/Blue balloon - 1.png"),
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const childId = await AsyncStorage.getItem("childId");
      const topicId = await AsyncStorage.getItem("topicId");

      const [data] = await Promise.all([
        vocabAPI.getVocab(topicId, childId),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      const words = (data || []).map((item) => item.word);

      setBalloonTexts(words);
    } catch (error) {
      console.log("Error loading the data", error);
      setBalloonTexts(["Dog", "Cat", "Fish", "Bird", "Lion", "Bear"]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnswer = async () => {
    const levelId = await AsyncStorage.getItem("levelId");
    const result = await vocabAPI.getVocabDetail(levelId);
    if (result && result.word) {
      setCorrectAnswer(result.word);
      console.log("Correct answer:", result.word);
    }
  };

  const createBalloons = () => {
    if (balloonTexts.length === 0) {
      return [];
    }

    const newBalloons = [];
    const balloonWidth = 80;

    // Tăng tỉ lệ xuất hiện từ đúng: mỗi lượt spawn luôn có ít nhất 1 bóng là correctAnswer
    const lowerTarget = (correctAnswer || "").toLowerCase();
    const incorrectPool = balloonTexts.filter(
      (w) => (w || "").toLowerCase() !== lowerTarget
    );

    const textsForBatch = [];
    if (correctAnswer) {
      textsForBatch.push(correctAnswer);
    }

    // Thêm các từ sai vào batch
    while (textsForBatch.length < 4 && incorrectPool.length > 0) {
      const idx = Math.floor(Math.random() * incorrectPool.length);
      textsForBatch.push(incorrectPool[idx]);
      incorrectPool.splice(idx, 1);
    }

    // Nếu chưa đủ 4 (vd ít từ), lấp đầy bằng correctAnswer
    while (textsForBatch.length < 4 && correctAnswer) {
      textsForBatch.push(correctAnswer);
    }

    // Shuffle để vị trí từ đúng random
    for (let i = textsForBatch.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [textsForBatch[i], textsForBatch[j]] = [textsForBatch[j], textsForBatch[i]];
    }

    for (let i = 0; i < textsForBatch.length; i += 1) {
      const leftPosition =
        Math.random() * ((width || INIT_WIDTH) - balloonWidth);
      const duration = 5000 + Math.random() * 3000;
      const randomImage =
        balloonImages[Math.floor(Math.random() * balloonImages.length)];
      const textForBalloon = textsForBatch[i];

      newBalloons.push({
        id: nextBalloonId.current++,
        animatedValue: new Animated.Value((height || INIT_HEIGHT) + 100),
        scaleValue: new Animated.Value(1),
        opacityValue: new Animated.Value(1),
        left: leftPosition,
        duration,
        image: randomImage,
        text: textForBalloon,
        popped: false,
      });
    }

    return newBalloons;
  };

  const animateBalloons = (balloonSet) => {
    balloonSet.forEach((balloon) => {
      Animated.timing(balloon.animatedValue, {
        toValue: -200,
        duration: balloon.duration,
        useNativeDriver: true,
      }).start(() => {
        setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
      });
    });
  };

  const handleBalloonPress = (balloon) => {
    if (balloon.popped || gameOver) return;

    // Đánh dấu đã nổ
    balloon.popped = true;

    const isCorrect =
      balloon.text.toLowerCase() === correctAnswer.toLowerCase();
    if (isCorrect) {
      // Chỉ cộng điểm / tăng correctCount, không celebrate tại đây
      setCorrectCount((prev) => prev + 1);
      setScore((prev) => prev + 10);
      setShowWrongFlash(false);
    } else {
      setShowSuccess(false);
      setShowWrongFlash(true);
      Animated.sequence([
        Animated.timing(wrongFlashOpacity, {
          toValue: 0.6,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(wrongFlashOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        wrongFlashOpacity.setValue(0);
        setShowWrongFlash(false);
      });
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(balloon.scaleValue, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(balloon.scaleValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(balloon.opacityValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
    });
  };

  useEffect(() => {
    loadData();
    loadAnswer();
  }, []);

  useEffect(() => {
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(require("../../assets/sounds/yay.mp3"));
        setYaySound(sound);
      } catch (error) {
        console.log("Error loading yay sound:", error);
      }
    };

    loadSound();

    return () => {
      yaySound?.unloadAsync();
    };
  }, []);

  // Spawn bóng bay liên tục cho tới khi đạt đủ điểm
  useEffect(() => {
    if (loading || balloonTexts.length === 0 || gameOver) {
      return;
    }

    const firstSet = createBalloons();
    setBalloons(firstSet);
    animateBalloons(firstSet);

    const id = setInterval(() => {
      const newSet = createBalloons();
      setBalloons((prev) => [...prev, ...newSet]);
      animateBalloons(newSet);
    }, 3000);

    intervalRef.current = id;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [balloonTexts, loading, gameOver]);

  // Đủ số lần chọn đúng thì kết thúc game
  useEffect(() => {
    if (gameOver) return;
    if (correctCount >= TARGET_CORRECT) {
      setGameOver(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setShowSuccess(true);
      if (celebrateRef.current) {
        celebrateRef.current.play();
      }
      yaySound?.playAsync();
    }
  }, [correctCount, gameOver]);

  // Khi gameOver thì tự động chuyển sang game tiếp theo trong flow
  useEffect(() => {
    if (!gameOver) return;

    const timer = setTimeout(() => {
      moveToNextGameOrComplete(router);
    }, 1200);

    return () => clearTimeout(timer);
  }, [gameOver, router]);

  if (loading) return <Loading2 second={2} />;

  if (balloonTexts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không có từ vựng!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/bg-pick.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Header với tiến độ */}
        <View style={styles.headerContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Correct</Text>
            <Text style={styles.infoValue}>
              {correctCount}/{TARGET_CORRECT}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Score</Text>
            <Text style={styles.infoValue}>{score}</Text>
          </View>
        </View>

        {/* Game Over Overlay */}
        {false && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverBox}>
              <Text style={styles.gameOverTitle}>Great job!</Text>
              <Text style={styles.gameOverScore}>Score: {score}</Text>
              <Text style={styles.gameOverCorrect}>
                Correct: {correctCount}/{TARGET_CORRECT}
              </Text>
            </View>
          </View>
        )}

        {/* Hiệu ứng celebrate khi chọn đúng */}
        {showSuccess && (
          <View style={styles.successOverlay} pointerEvents="none">
            <LottieView
              ref={celebrateRef}
              source={require("../../assets/animations/celebrate.json")}
              autoPlay
              loop={false}
              style={styles.successAnimation}
              resizeMode="cover"
              onAnimationFinish={() => setShowSuccess(false)}
            />
          </View>
        )}

        {/* Nhấp nháy đỏ khi chọn sai */}
        {showWrongFlash && (
          <Animated.View
            pointerEvents="none"
            style={[styles.wrongOverlay, { opacity: wrongFlashOpacity }]}
          />
        )}

        {/* Bóng bay */}
        {!gameOver &&
          balloons.map((balloon) => (
            <Animated.View
              key={balloon.id}
              style={[
                styles.balloon,
                {
                  left: balloon.left,
                  transform: [
                    { translateY: balloon.animatedValue },
                    { scale: balloon.scaleValue },
                  ],
                  opacity: balloon.opacityValue,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => handleBalloonPress(balloon)}
                style={styles.touchArea}
              >
                <Image
                  source={balloon.image}
                  style={styles.balloonImage}
                  contentFit="contain"
                />
                <View style={styles.textContainer}>
                  <Text style={styles.balloonText}>{balloon.text}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  balloon: {
    position: "absolute",
    bottom: 0,
    width: 250,
    height: 250,
  },
  touchArea: {
    width: "100%",
    height: "100%",
  },
  balloonImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    position: "absolute",
    top: "15%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  balloonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 100,
  },
  infoBox: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: "center",
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  gameOverBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  gameOverScore: {
    fontSize: 24,
    color: "#666",
    marginBottom: 8,
  },
  gameOverCorrect: {
    fontSize: 20,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 10,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1200,
  },
  successAnimation: {
    width: "90%",
    height: "90%",
  },
  wrongOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,0,0,0.35)",
    zIndex: 1100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "600",
  },
});

export default gamePick;
