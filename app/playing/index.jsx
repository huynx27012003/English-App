import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import LottieView from "lottie-react-native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import Loading2 from "../loading/loading2";
import { initGameFlow } from "./game-flow";

const { height, width } = Dimensions.get("window");

const UNSPLASH_ACCESS_KEY =
  "xGj_2kYQRrxOl-SXbXuw9DSnJ39lDPSPFJAxSsyNvfo";

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
      "[Unsplash Banner] word=",
      word,
      "url=",
      first,
      "totalResults=",
      json?.results?.length ?? 0
    );

    return first;
  } catch (err) {
    console.log("Error fetching Unsplash image (banner):", err);
    return null;
  }
};

const fetchAndPlayPronunciation = async (word, vocabId) => {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.log("Dictionary API error:", res.status);
      return;
    }

    const data = await res.json();

    // Lấy object đầu tiên trong array
    if (Array.isArray(data) && data.length > 0) {
      const firstEntry = data[0];

      // Tìm audio URL trong phonetics
      const phonetics = firstEntry.phonetics || [];
      let audioUrl = null;

      for (const phonetic of phonetics) {
        if (phonetic.audio && phonetic.audio.trim() !== "") {
          audioUrl = phonetic.audio;
          break;
        }
      }

      if (audioUrl) {
        console.log("Playing pronunciation:", audioUrl);

        // Phát âm thanh
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 }
        );

        // Cập nhật soundUrl vào backend nếu có vocabId
        if (vocabId) {
          vocabAPI.updateSoundUrl(vocabId, audioUrl);
        }

        // Cleanup khi phát xong
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      } else {
        console.log("No audio found in phonetics for word:", word);
      }
    }
  } catch (err) {
    console.log("Error fetching/playing pronunciation:", err);
  }
};

export default function Banner() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [animationData, setAnimationData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const lottieRef = useRef(null);
  const [firstGameRoute, setFirstGameRoute] = useState(null);
  const [bannerText, setBannerText] = useState("Loading...");

  const loadData = async () => {
    try {
      setLoading(true);

      // Ensure audio plays even in silent mode (iOS)
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });
      } catch (e) {
        console.log("Audio mode setup error:", e);
      }

      const levelId = await AsyncStorage.getItem("levelId");

      const [detail] = await Promise.all([
        levelId ? vocabAPI.getVocabDetail(levelId) : Promise.resolve(null),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      if (detail && detail.word) {
        setBannerText(detail.word);

        // Handle playing sound with fallback
        let playedFromSaved = false;
        if (detail.soundUrl) {
          try {
            console.log("Playing from saved soundUrl:", detail.soundUrl);
            const { sound } = await Audio.Sound.createAsync(
              { uri: detail.soundUrl },
              { shouldPlay: true, volume: 1.0 }
            );
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) {
                sound.unloadAsync();
              }
            });
            playedFromSaved = true;
          } catch (err) {
            console.warn("Failed to play saved soundUrl, falling back to API:", err);
            // Fallthrough to fetchAndPlayPronunciation
          }
        }

        if (!playedFromSaved) {
          fetchAndPlayPronunciation(detail.word, detail.mrid);
        }

        const url = detail.url;

        // 1. Nếu url là Lottie (.json)
        if (url && url.toLowerCase().endsWith(".json")) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              setAnimationData(json);
              setImageUrl(null);
              return;
            }
          } catch (err) {
            console.log("Error loading banner Lottie:", err);
          }
        }

        // 2. Nếu url là ảnh
        if (url && !url.toLowerCase().endsWith(".json")) {
          setImageUrl(url);
          setAnimationData(null);
          return;
        }

        // 3. Fallback Unsplash
        const fallback = await fetchUnsplashImage(detail.word);
        if (fallback) {
          setImageUrl(fallback);
          setAnimationData(null);
        }
      }
    } catch (error) {
      console.log("Error loading the banner data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Chuẩn bị thứ tự 3 game cho từ vựng này
    initGameFlow().then((flow) => {
      if (Array.isArray(flow) && flow.length > 0) {
        setFirstGameRoute(flow[0]);
      }
    });
  }, []);

  if (loading) return <Loading2 second={2} />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.bannerWrapper}>
          {animationData ? (
            <LottieView
              ref={lottieRef}
              source={animationData}
              autoPlay
              loop
              style={{
                width: width * 0.6,
                height: height * 0.6,
              }}
              resizeMode="contain"
            />
          ) : imageUrl ? (
            <Image
              style={{
                width: width * 0.6,
                height: height * 0.6,
              }}
              contentFit="contain"
              source={{ uri: imageUrl }}
            />
          ) : (
            <View style={styles.fallbackBox}>
              <Text style={styles.bannerText}>No image</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.bannerText, styles.bannerTextBottom]}>
        {bannerText}
      </Text>
      <TouchableOpacity
        onPress={() => {
          if (!firstGameRoute) {
            // Khởi tạo flow nếu chưa có
            initGameFlow().then((flow) => {
              const first = flow?.[0] || "game-fill";
              setFirstGameRoute(first);
              router.push(`/playing/${first}`);
            });
          } else {
            router.push(`/playing/${firstGameRoute}`);
          }
        }}
        style={styles.button_next}
      >
        <Text style={styles.button_text}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFEFF",
    paddingHorizontal: 20,
    position: "relative",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -60,
  },
  bannerWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    height: height * 0.7,
    overflow: "hidden",
  },
  fallbackBox: {
    width: width * 0.6,
    height: height * 0.6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "#FFEFD5",
  },
  bannerText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#ff7f50",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  bannerTextBottom: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  button_next: {
    position: "absolute",
    bottom: 0,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FFCF25",
    marginBottom: 30,
    borderRadius: 12,
    width: 120,
  },
  button_text: {
    color: "#fff",
    fontSize: 35,
    fontWeight: "600",
    textAlign: "center",
  },
});
