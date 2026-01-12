import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Pattern,
  Rect,
  Image as SvgImage,
  Use,
} from "react-native-svg";
import LottieView from "lottie-react-native";
import { moveToNextGameOrComplete } from "./game-flow";

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
      "[Unsplash Choose] word=",
      word,
      "url=",
      first,
      "totalResults=",
      json?.results?.length ?? 0
    );

    return first;
  } catch (err) {
    console.log("Error fetching Unsplash image (choose):", err);
    return null;
  }
};

const gameChoose = () => {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [question, setQuestion] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [animationUrl, setAnimationUrl] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showWrongFlash, setShowWrongFlash] = useState(false);
  const wrongFlashOpacity = useRef(new Animated.Value(0)).current;
  const celebrateRef = useRef(null);
  const [yaySound, setYaySound] = useState(null);

  // Load dữ liệu từ API
  const loadData = async () => {
    try {
      setLoading(true);
      const levelId = await AsyncStorage.getItem("levelId");
      const result = await vocabAPI.getVocabDetail(levelId);
      
      if (result && result.word) {
        const word = result.word;
        setCorrectAnswer(word);
        setQuestion(`What is this?`);
        
        // Lấy image nếu có từ API
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
        
        // Tạo các đáp án (1 đúng + 3 sai)
        const generatedAnswers = generateAnswers(word);
        setAnswers(generatedAnswers);
      }
    } catch (error) {
      console.log("Error loading data:", error);
      // Fallback nếu API lỗi
      setCorrectAnswer("TIGER");
      setQuestion("Which animal is this?");
      setAnswers(["CAT", "FOX", "DOG", "TIGER"]);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tạo các đáp án
  const generateAnswers = (correctWord) => {
    // Danh sách các từ phổ biến để tạo đáp án sai
    const commonWords = [
      "CAT", "DOG", "FOX", "BEAR", "LION", "WOLF", 
      "DEER", "BIRD", "FISH", "FROG", "SNAKE", "MOUSE"
    ];
    
    const wrongAnswers = [];
    const correctWordUpper = correctWord.toUpperCase();
    
    // Lọc các từ không trùng với đáp án đúng
    const availableWords = commonWords.filter(w => w !== correctWordUpper);
    
    // Chọn ngẫu nhiên 3 đáp án sai
    while (wrongAnswers.length < 3 && availableWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      wrongAnswers.push(` ${availableWords[randomIndex]}`);
      availableWords.splice(randomIndex, 1);
    }
    
    // Thêm đáp án đúng
    const allAnswers = [...wrongAnswers, ` ${correctWordUpper}`];
    
    // Shuffle array để đáp án đúng không luôn ở vị trí cuối
    return allAnswers.sort(() => Math.random() - 0.5);
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
        setShowWrongFlash(false);
      });
    } else {
      wrongFlashOpacity.setValue(0);
    }
  }, [showWrongFlash, wrongFlashOpacity]);

  const handleSpeak = () => {
    Speech.speak(correctAnswer, {
      language: "en",  
      pitch: 1.0,
      rate: 1.0,
    });
  };

  // Khi chọn 1 đáp án thì set selected, kiểm tra và auto next nếu đúng
  const handleAnswerPress = async (index) => {
    setSelected(index);

    const selectedAnswer = answers[index];
    const isCorrect = selectedAnswer.includes(correctAnswer.toUpperCase());

    if (isCorrect) {
      setShowWrongFlash(false);
      setShowSuccess(true);
      celebrateRef.current?.play();
      yaySound?.playAsync();

      setTimeout(async () => {
        setShowSuccess(false);
        await moveToNextGameOrComplete(router);
      }, 500);
    } else {
      setShowSuccess(false);
      setShowWrongFlash(true);
      setTimeout(() => {
        setShowWrongFlash(false);
      }, 800);
    }
  };

  // Flow mới: dùng hiệu ứng + chuyển game random
  const handleFinishFlow = async () => {
    if (selected === null) {
      alert("Please select an answer!");
      return;
    }

    const selectedAnswer = answers[selected];
    const isCorrect = selectedAnswer.includes(correctAnswer.toUpperCase());

    if (isCorrect) {
      setShowWrongFlash(false);
      setShowSuccess(true);

      setTimeout(async () => {
        setShowSuccess(false);
        await moveToNextGameOrComplete(router);
      }, 1200);
    } else {
      setShowSuccess(false);
      setShowWrongFlash(true);
      setTimeout(() => setShowWrongFlash(false), 800);
    }
  };

  const handleFinish = () => {
    if (selected === null) {
      alert("Please select an answer!");
      return;
    }
    
    const selectedAnswer = answers[selected];
    const isCorrect = selectedAnswer.includes(correctAnswer.toUpperCase());
    
    if (isCorrect) {
      alert("Correct! 🎉");
    } else {
      alert(`Wrong! The correct answer is: A ${correctAnswer.toUpperCase()}`);
    }
    
    router.push("/(tabs)");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCF25" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Layout chính chia 2 cột khi ngang */}
      <View style={[styles.mainContent, isLandscape && styles.mainContentLandscape]}>
        
        {/* Cột trái: Question + Hình ảnh */}
        <View style={[styles.leftColumn, isLandscape && styles.leftColumnLandscape]}>
          <View style={styles.box_question}>
            <Text style={[styles.questionText, isLandscape && styles.questionTextLandscape]}>
              {question}
            </Text>
            <TouchableOpacity style={styles.button_listen} onPress={handleSpeak}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" href="http://www.w3.org/1999/xlink">
                <Rect width="24" height="24" fill="url(#pattern0_2105_6274)"/>
                <Defs>
                <Pattern id="pattern0_2105_6274" patternContentUnits="objectBoundingBox" width="1" height="1">
                <Use href="#image0_2105_6274" transform="scale(0.00195312)"/>
                </Pattern>
                <SvgImage id="image0_2105_6274" width="512" height="512" preserveAspectRatio="none" href="data:image/png;base64,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h4EXjTEBh/MR6RBUAIhEyFo7BJgHFDudi7TIAh8Qesz/rDFmu8P5iHQ4KgBEomCtzQOeAr7jdC7SyBLa1XEO8IIxZrPD+Yh0aCoARKLUsIHQZOBOIMPhdFLVfmAxobX7Lxpjtjicj8gRQwWASDtZa48jNDlwpNO5pIAK4F1gEaH3+p/onb5IdFQAiMSAtdYNXANMA3wOp5NMqgg16FlEaMD/yBhT72hGIklCBYBIDFlrC4FbgcsA92F+Xb6uktDkvcXAQmCJMabO2ZREkpMKAJE4sNYeS6gQOB913GxNGaE7/MXAe8BSY4zf2ZREUoMKAJE4stYOBaYClwBpDqfTEWzj/wf7xcBKY0zQ2ZREUpMKAJEEsNb2AK4ArgL6OJxOogSBL4ElhAb7d40x65xNSUTCVACIJJC11gWcBEwAJgH5zmYUU9uBpU2O940xZc6mJCItUQEg4hBrbRpwCjCOUEOhIc5m1GZ+Qnf2y4HPgGXAZ8aYnY5mJSIRUQEg0kFYa7sDYwgVBcOAoUAPB1PaA6wBVjcc4e+/0Mx8kSOfCgCRDsxa243Qk4Hw0RfIa3JE8wqhouEoIzQpbxuwhdAj/M0N/16nx/ciyU0FgMgRrKEBUR6Q1fCj9Cbfh1U2HBXGmL0JTE9EREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREYuT/AE0C9vQfJIr8AAAAAElFTkSuQmCC"/>
                </Defs>
              </Svg>
            </TouchableOpacity>
          </View>
          
          {/* Placeholder cho hình ảnh */}
          <View style={[styles.imageContainer, isLandscape && styles.imageContainerLandscape]}>
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
                source={{ uri: imageUrl }}
                style={styles.image} 
                contentFit="contain" 
              />
            ) : (
              <View style={[styles.image, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: 18, color: "#666" }}>No image</Text>
              </View>
            )}
          </View>
        </View>

        {/* Cột phải: Answers */}
        <View style={[styles.rightColumn, isLandscape && styles.rightColumnLandscape]}>
          <View style={[styles.box_answer, isLandscape && styles.box_answerLandscape]}>
            {answers.map((ans, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.answer, 
                  selected === index && styles.answerSelected,
                  isLandscape && styles.answerLandscape
                ]} 
                onPress={() => handleAnswerPress(index)}
              >
                <Text style={[
                  styles.answerText, 
                  selected === index && styles.answerTextSelected,
                  isLandscape && styles.answerTextLandscape
                ]}>
                  {ans}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Nút Finish */}
      {false && (
      <TouchableOpacity  onPress={handleFinishFlow} style={[styles.button_next, isLandscape && styles.button_nextLandscape]}>
        <Text style={[styles.button_text, isLandscape && styles.button_textLandscape]}>
          Finish
        </Text>
      </TouchableOpacity>
      )}

      {showSuccess && (
        <View style={styles.successOverlay}>
          <LottieView
            ref={celebrateRef}
            source={require("../../assets/animations/celebrate.json")}
            autoPlay
            loop={false}
            style={styles.successAnimation}
            resizeMode="contain"
          />
        </View>
      )}

      {showWrongFlash && (
        <Animated.View
          style={[styles.wrongOverlay, { opacity: wrongFlashOpacity }]}
          pointerEvents="none"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: 10,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 15,
    marginTop: 35
  },
  mainContentLandscape: {
    flexDirection: 'row',
    gap: 20,
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  leftColumnLandscape: {
    flex: 1,
    justifyContent: 'center',
  },
  rightColumn: {
    flex: 1,
  },
  rightColumnLandscape: {
    flex: 1,
    justifyContent: 'center',
  },
  box_question: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    flex: 1,
  },
  questionTextLandscape: {
    fontSize: 20,
  },
  button_listen: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFCF25',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  imageContainerLandscape: {
    flex: 1,
  },
  imageContainerLandscape: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  box_answer: {
    flexDirection: 'column',
    gap: 12,
    flex: 1,
  },
  box_answerLandscape: {
    justifyContent: 'center',
    gap: 15,
  },
  answer: {
    borderWidth: 2, 
    borderColor: '#A7A4A4', 
    borderRadius: 12, 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  answerLandscape: {
    paddingVertical: 12,
  },
  answerSelected: {
    backgroundColor: "#FFCF25",
    borderColor: "#FFCF25",
  },
  answerText: {
    fontSize: 26, 
    fontWeight: '700',
    color: "#333",
  },
  answerTextLandscape: {
    fontSize: 22,
  },
  answerTextSelected: {
    color: "#fff",
  },
  button_next: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#FFCF25",
    borderRadius: 20,
    marginTop: 15,
  },
  button_nextLandscape: {
    paddingVertical: 6,
    marginTop: 10,
  },
  button_text: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
  },
  button_textLandscape: {
    fontSize: 28,
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
});

export default gameChoose;
