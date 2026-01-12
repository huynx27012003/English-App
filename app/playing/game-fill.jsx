import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { moveToNextGameOrComplete } from "./game-flow";

const { height, width } = Dimensions.get("window");
const UNSPLASH_ACCESS_KEY =
  "xGj_2kYQRrxOl-SXbXuw9DSnJ39lDPSPFJAxSsyNvfo";

const fetchUnsplashImage = async (word) => {
  try {
    const query = `${word}`;
    const url =
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}` +
      `&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`;

    const res = await fetch(url);
    const json = await res.json();
    const first = json?.results?.[0]?.urls?.small || null;

    console.log(
      "[Unsplash Fill] word=",
      word,
      "url=",
      first,
      "totalResults=",
      json?.results?.length ?? 0
    );

    return first;
  } catch (err) {
    console.log("Error fetching Unsplash image (fill):", err);
    return null;
  }
};

const generateDistractors = (correctLetters) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const distractors = [];
  const neededCount = Math.max(8 - correctLetters.length, 3);

  let attempts = 0;
  while (distractors.length < neededCount && attempts < 50) {
    const randomLetter =
      alphabet[Math.floor(Math.random() * alphabet.length)];
    if (
      !correctLetters.includes(randomLetter) &&
      !distractors.includes(randomLetter)
    ) {
      distractors.push(randomLetter);
    }
    attempts++;
  }

  return distractors;
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const GameFill = () => {
  const router = useRouter();

  const [correctAnswer, setCorrectAnswer] = useState("");
  const [letters, setLetters] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);
  const [animationUrl, setAnimationUrl] = useState(null);

  const [inputs, setInputs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [usedIndices, setUsedIndices] = useState([]);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showWrongFlash, setShowWrongFlash] = useState(false);

  const wrongFlashOpacity = useRef(new Animated.Value(0)).current;
  const celebrateRef = useRef(null);
  const [yaySound, setYaySound] = useState(null);

  const loadAnswer = async () => {
    try {
      setLoading(true);
      const levelId = await AsyncStorage.getItem("levelId");
      const result = await vocabAPI.getVocabDetail(levelId);

      if (result && result.word) {
        const word = result.word.toUpperCase();
        setCorrectAnswer(word);

        const wordLetters = word.split("");
        setLetters(wordLetters);
        setInputs(Array(wordLetters.length).fill(""));

        const distractorLetters = generateDistractors(wordLetters);
        setAvailableLetters(
          shuffleArray([...wordLetters, ...distractorLetters])
        );

        const rawUrl = result.url || result.imageUrl;
        if (rawUrl) {
          if (rawUrl.toLowerCase().endsWith(".json")) {
            setAnimationUrl(rawUrl);
          } else {
            setImageUrl(rawUrl);
          }
        } else {
          const fallback = await fetchUnsplashImage(result.word);
          setImageUrl(fallback);
        }
      }
    } catch (error) {
      console.log("Error loading answer:", error);
      const fallbackWord = "TIGER";
      setCorrectAnswer(fallbackWord);
      const wordLetters = fallbackWord.split("");
      setLetters(wordLetters);
      setInputs(Array(wordLetters.length).fill(""));
      const distractorLetters = generateDistractors(wordLetters);
      setAvailableLetters(
        shuffleArray([...wordLetters, ...distractorLetters])
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnswer();
  }, []);

  useEffect(() => {
    if (showWrongFlash) {
      wrongFlashOpacity.setValue(0);

      const pulse = Animated.sequence([
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
      ]);

      Animated.loop(pulse, { iterations: 3 }).start(() => {
        wrongFlashOpacity.setValue(0);
        setShowWrongFlash(false);
      });
    } else {
      wrongFlashOpacity.setValue(0);
    }
  }, [showWrongFlash, wrongFlashOpacity]);

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

  const handleLetterPress = (letter, index) => {
    if (currentIndex >= letters.length) return;

    const newInputs = [...inputs];
    newInputs[currentIndex] = letter;
    setInputs(newInputs);
    setUsedIndices([...usedIndices, index]);
    setCurrentIndex(currentIndex + 1);
  };

  const handleDelete = () => {
    if (currentIndex <= 0) return;

    const newInputs = [...inputs];
    newInputs[currentIndex - 1] = "";

    const newUsed = [...usedIndices];
    newUsed.pop(); // remove last used index

    setInputs(newInputs);
    setUsedIndices(newUsed);
    setCurrentIndex(currentIndex - 1);
  };

  useEffect(() => {
    if (!correctAnswer || inputs.length === 0) return;

    const userAnswer = inputs.join("");
    if (userAnswer.length === letters.length && !inputs.includes("")) {
      setTimeout(() => {
        if (userAnswer === correctAnswer) {
          Vibration.vibrate([0, 200, 100, 200]);
          setShowWrongFlash(false);
          setShowSuccess(true);
          celebrateRef.current?.play();
          yaySound?.playAsync();

          // Sau 0.5s tự động sang game tiếp theo
          setTimeout(() => {
            moveToNextGameOrComplete(router);
          }, 500);
        } else {
          setShowSuccess(false);
          setShowWrongFlash(true);
          setInputs(Array(letters.length).fill(""));
          setUsedIndices([]);
          setCurrentIndex(0);
        }
      }, 250);
    }
  }, [inputs, correctAnswer, letters.length]);

  const isLetterUsed = (index) => usedIndices.includes(index);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4AA378" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Bên trái: hình ảnh từ vựng */}
        <View style={styles.leftSection}>
          {animationUrl ? (
            <LottieView
              source={{ uri: animationUrl }}
              autoPlay
              loop
              style={styles.image}
              resizeMode="contain"
            />
          ) : imageUrl ? (
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
        </View>

        {/* Bên phải: game điền chữ */}
        <View style={styles.rightSection}>
          <View style={styles.word}>
            {letters.map((_, index) => (
              <View key={index} style={styles.letterBox}>
                <View
                  style={[
                    styles.letterDisplay,
                    currentIndex === index && styles.letterDisplayActive,
                  ]}
                >
                  <Text style={styles.letterText}>{inputs[index]}</Text>
                </View>
                <View style={styles.underline} />
              </View>
            ))}
          </View>

          <View style={styles.keyboardContainer}>
            <View style={styles.keyboardRow}>
              {availableLetters
                .slice(0, Math.ceil(availableLetters.length / 2))
                .map((letter, index) => (
                  <TouchableOpacity
                    key={`top-${index}`}
                    style={[
                      styles.letterButton,
                      isLetterUsed(index)
                        ? styles.letterButtonUsed
                        : styles.letterButtonUnused,
                    ]}
                    onPress={() => handleLetterPress(letter, index)}
                    disabled={currentIndex >= letters.length}
                  >
                    <Text
                      style={[
                        styles.letterButtonText,
                        isLetterUsed(index)
                          ? styles.letterButtonTextUsed
                          : styles.letterButtonTextUnused,
                      ]}
                    >
                      {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
            <View style={styles.keyboardRow}>
              {availableLetters
                .slice(Math.ceil(availableLetters.length / 2))
                .map((letter, index) => {
                  const actualIndex = index + Math.ceil(availableLetters.length / 2);
                  return (
                    <TouchableOpacity
                      key={`bottom-${index}`}
                      style={[
                        styles.letterButton,
                        isLetterUsed(actualIndex)
                          ? styles.letterButtonUsed
                          : styles.letterButtonUnused,
                      ]}
                      onPress={() => handleLetterPress(letter, actualIndex)}
                      disabled={currentIndex >= letters.length}
                    >
                    <Text
                      style={[
                        styles.letterButtonText,
                        isLetterUsed(actualIndex)
                          ? styles.letterButtonTextUsed
                          : styles.letterButtonTextUnused,
                      ]}
                    >
                      {letter}
                    </Text>
                  </TouchableOpacity>
                );
                })}
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Nút Next chuyển game theo flow random */}
      {false && (
      <TouchableOpacity
        onPress={async () => {
          await moveToNextGameOrComplete(router);
        }}
        style={styles.button_next}
        >
          <Text style={styles.button_text}>Next</Text>
        </TouchableOpacity>
      )}

      {/* Hiệu ứng đúng: celebrate Lottie với overlay xám */}
      {showSuccess && (
        <View style={styles.fireworksContainer} pointerEvents="none">
          <LottieView
            ref={celebrateRef}
            source={require("../../assets/animations/celebrate.json")}
            autoPlay
            loop={false}
            style={styles.fireworksAnimation}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Hiệu ứng sai: màn hình nhấp nháy đỏ */}
      {showWrongFlash && (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrongOverlay, { opacity: wrongFlashOpacity }]}
        />
      )}
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFEFF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  leftSection: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 20,
  },
  image: {
    width: "100%",
    height: "80%",
  },
  rightSection: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    gap: 25,
  },

  word: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  letterBox: {
    alignItems: "center",
    width: 45,
  },
  letterDisplay: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: "#CBE2D7",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  letterDisplayActive: {
    borderColor: "#4AA378",
    backgroundColor: "#F0F9F4",
  },
  letterText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4AA378",
  },
  underline: {
    marginTop: 4,
    width: "100%",
    height: 3,
    backgroundColor: "#CBE2D7",
    borderRadius: 2,
  },

  keyboardContainer: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  keyboardRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  letterButton: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  letterButtonUsed: {
    backgroundColor: "#EF3349",
  },
  letterButtonUnused: {
    backgroundColor: "#F3F3F3",
  },
  letterButtonText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  letterButtonTextUsed: {
    color: "#FFFFFF",
  },
  letterButtonTextUnused: {
    color: "#EF3349",
  },
  deleteButton: {
    marginTop: 6,
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: "#95A5A6",
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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

  fireworksContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 999,
  },
  fireworksAnimation: {
    width: "90%",
    height: "90%",
  },
  wrongOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,0,0,0.35)",
    zIndex: 998,
  },
});

export default GameFill;
