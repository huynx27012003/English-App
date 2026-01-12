import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import celebrateAnimation from "../../assets/animations/celebrate.json";
import { moveToNextGameOrComplete } from "./game-flow";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const UNSPLASH_ACCESS_KEY =
  "xGj_2kYQRrxOl-SXbXuw9DSnJ39lDPSPFJAxSsyNvfo";

const isOverlapping = (a, b, padding = 20) => {
  return !(
    a.left + a.size + padding < b.left ||
    b.left + b.size + padding < a.left ||
    a.top + a.size + padding < b.top ||
    b.top + b.size + padding < a.top
  );
};

const generateNonOverlappingPositions = (count, screenWidth, screenHeight) => {
  const positions = [];
  let attempts = 0;

  const SAFE_TOP = 150;
  const SAFE_BOTTOM = 50;

  for (let i = 0; i < count; i++) {
    let valid = false;
    let newPos;

    while (!valid && attempts < 2000) {
      attempts++;
      const size = 100 + Math.random() * 30;
      const top =
        SAFE_TOP +
        Math.random() * (screenHeight - SAFE_TOP - SAFE_BOTTOM - size);
      const left = Math.random() * (screenWidth - size - 20);
      const rotate = Math.random() * 30 - 15;
      newPos = { top, left, size, rotate };

      valid = positions.every((p) => !isOverlapping(p, newPos));
    }

    if (newPos) positions.push(newPos);
  }

  return positions;
};

const fetchUnsplashImage = async (word) => {
  try {
    const query = `${word} english learning object photo`;
    const url =
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}` +
      `&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`;

    const res = await fetch(url);
    const json = await res.json();
    const first = json?.results?.[0]?.urls?.small || null;

    console.log(
      "[Unsplash] word=",
      word,
      "url=",
      first,
      "totalResults=",
      json?.results?.length ?? 0
    );

    return first;
  } catch (err) {
    console.log("Error fetching Unsplash image:", err);
    return null;
  }
};

// Hiển thị 1 con vật: ưu tiên Lottie (url .json), rồi tới ảnh, cuối cùng Unsplash
const AnimalVisual = ({ animal, position, onPress }) => {
  const [animationData, setAnimationData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const lottieRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadVisual = async () => {
      try {
        const url = animal?.url;

        // 1. Nếu url là Lottie (.json)
        if (url && url.toLowerCase().endsWith(".json")) {
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (mounted) {
              setAnimationData(json);
              setLoading(false);
            }
            return;
          }
        }

        // 2. Nếu url là ảnh (png/jpg/webp/...)
        if (url && !url.toLowerCase().endsWith(".json")) {
          if (mounted) {
            setImageUrl(url);
            setLoading(false);
          }
          return;
        }

        // 3. Fallback: Unsplash theo word
        const fallback = await fetchUnsplashImage(animal.word);
        if (mounted) {
          setImageUrl(fallback);
          setLoading(false);
        }
      } catch (err) {
        console.log(`Error loading visual for ${animal.word}:`, err);
        const fallback = await fetchUnsplashImage(animal.word);
        if (mounted) {
          setImageUrl(fallback);
          setLoading(false);
        }
      }
    };

    loadVisual();

    return () => {
      mounted = false;
    };
  }, [animal.url, animal.word]);

  if (loading) {
    return (
      <View
        style={[
          styles.animalContainer,
          {
            top: position.top,
            left: position.left,
            width: position.size,
            height: position.size,
            transform: [{ rotate: `${position.rotate}deg` }],
          },
        ]}
      >
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  // Ưu tiên hiển thị Lottie nếu có
  if (animationData) {
    return (
      <TouchableOpacity
        style={[
          styles.animalContainer,
          {
            top: position.top,
            left: position.left,
            width: position.size,
            height: position.size,
            transform: [{ rotate: `${position.rotate}deg` }],
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LottieView
          ref={lottieRef}
          source={animationData}
          autoPlay
          loop
          style={styles.lottieAnimation}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  }

  // Nếu không có Lottie nhưng có ảnh (url hoặc Unsplash)
  if (imageUrl) {
    return (
      <TouchableOpacity
        style={[
          styles.animalContainer,
          {
            top: position.top,
            left: position.left,
            width: position.size,
            height: position.size,
            transform: [{ rotate: `${position.rotate}deg` }],
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.lottieAnimation}
          contentFit="contain"
        />
      </TouchableOpacity>
    );
  }

  // Trường hợp cuối: khung trống nhưng vẫn click được
  return (
    <TouchableOpacity
      style={[
        styles.animalContainer,
        {
          top: position.top,
          left: position.left,
          width: position.size,
          height: position.size,
          transform: [{ rotate: `${position.rotate}deg` }],
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.lottieAnimation,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f0f0f0",
          },
        ]}
      >
        <Text style={{ fontSize: 12, color: "#999" }}>No image</Text>
      </View>
    </TouchableOpacity>
  );
};

const GameWhere = () => {
  const router = useRouter();
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [targetAnimal, setTargetAnimal] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWrongFlash, setShowWrongFlash] = useState(false);
  const wrongFlashOpacity = useRef(new Animated.Value(0)).current;
  const [yaySound, setYaySound] = useState(null);
  const { width, height } = useWindowDimensions();

  const randomPositions = useMemo(() => {
    if (selectedAnimals.length === 0) return [];
    return generateNonOverlappingPositions(
      selectedAnimals.length,
      width || SCREEN_WIDTH,
      height || SCREEN_HEIGHT
    );
  }, [selectedAnimals.length, width, height]);

  const loadData = async () => {
    try {
      setDataLoading(true);
      const childId = await AsyncStorage.getItem("childId");
      const topicId = await AsyncStorage.getItem("topicId");
      const levelId = await AsyncStorage.getItem("levelId");

      const vocabList = await vocabAPI.getVocab(topicId, childId);

      if (!vocabList || vocabList.length === 0) {
        setSelectedAnimals([]);
        setTargetAnimal(null);
        return;
      }

      // Tìm vocab tương ứng levelId mà user chọn ở Topic List
      const levelIdStr = String(levelId);
      let target = vocabList.find((item) => String(item.id) === levelIdStr);

      // Nếu không tìm thấy (data sai) -> lấy phần tử đầu tiên làm target
      if (!target) {
        target = vocabList[0];
      }

      // Chọn thêm một số vocab khác làm "mồi"
      const others = vocabList.filter((item) => item.id !== target.id);
      const distractors = others
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(4, others.length));

      // Danh sách con vật hiển thị: target + distractors, rồi trộn
      const animals = [target, ...distractors].sort(
        () => Math.random() - 0.5
      );

      setSelectedAnimals(animals);
      setTargetAnimal(target);
    } catch (error) {
      console.log("Error loading data:", error);
      setSelectedAnimals([]);
      setTargetAnimal(null);
      } finally {
        setDataLoading(false);
      }
    };
  
    useEffect(() => {
      loadData();
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
        });
      } else {
        wrongFlashOpacity.setValue(0);
      }
    }, [showWrongFlash, wrongFlashOpacity]);

  const handleAnimalPress = (animal) => {
    if (!targetAnimal) return;

    if (animal.id === targetAnimal.id) {
      setShowWrongFlash(false);
      setShowSuccess(true);
      yaySound?.playAsync();
      setTimeout(() => {
        moveToNextGameOrComplete(router);
      }, 500);
      // Ẩn hiệu ứng sau 1.5s nếu người chơi chưa bấm Next
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    } else {
      setShowSuccess(false);
      setShowWrongFlash(true);
      setTimeout(() => {
        setShowWrongFlash(false);
      }, 1000);
    }
  };

  const noData =
    !dataLoading && (selectedAnimals.length === 0 || !targetAnimal);
  const isReady = !dataLoading && backgroundLoaded && !noData;

  if (noData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No data available!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/bg-where.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
        onLoadEnd={() => setBackgroundLoaded(true)}
      >
        {!isReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

          {isReady && (
            <>
            {/* Câu hỏi */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                Which picture is related to {targetAnimal.word.toLowerCase()}?
              </Text>
            </View>

            {/* Các con vật */}
            {selectedAnimals.map((animal, index) => {
              const pos = randomPositions[index];
              if (!pos) return null;

              return (
                <AnimalVisual
                  key={`${animal.id}-${index}`}
                  animal={animal}
                  position={pos}
                  onPress={() => handleAnimalPress(animal)}
                />
              );
            })}

            </>
          )}

          {}
          {isReady && showSuccess && (
            <View style={styles.successOverlay}>
              <LottieView
                source={celebrateAnimation}
                autoPlay
                loop={false}
                style={styles.successAnimation}
                resizeMode="contain"
                onAnimationFinish={() => setShowSuccess(false)}
              />
            </View>
          )}

          {/* Hiệu ứng sai: màn hình nháy đỏ */}
          {isReady && showWrongFlash && (
            <Animated.View
              style={[styles.wrongOverlay, { opacity: wrongFlashOpacity }]}
            />
          )}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFEFF",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  titleContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    textAlign: "center",
  },
  animalContainer: {
    position: "absolute",
    zIndex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieAnimation: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 20,
  },
  successAnimation: {
    width: "90%",
    height: "90%",
  },
  wrongOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,0,0,0.35)",
    zIndex: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
});

export default GameWhere;
