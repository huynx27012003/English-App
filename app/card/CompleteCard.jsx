import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, G, LinearGradient, Path, Stop } from "react-native-svg";
import { initGameFlow } from "../playing/game-flow";

const { width, height } = Dimensions.get('window');


const StarIcon = ({ width = 60, height = 60, style }) => {
  return (
    <Svg 
      width={width} 
      height={height} 
      viewBox="0 0 82 83" 
      fill="none"
      style={style}
    >
      <Defs>
        <LinearGradient 
          id="paint0_linear" 
          x1="40.9205" 
          y1="3.85141" 
          x2="40.9205" 
          y2="65.6467"
        >
          <Stop offset="0" stopColor="#FFCF25" />
          <Stop offset="1" stopColor="#FFCF25" />
        </LinearGradient>
      </Defs>
      
      <G>
        {/* Main star path */}
        <Path
          d="M31.0289 18.8459C35.1112 6.28198 37.1523 2.95639e-05 40.9205 2.95639e-05C44.6888 2.86102e-05 46.7299 6.28198 50.8121 18.8459C51.9398 22.3163 52.5036 24.0515 53.8669 25.042C55.2303 26.0326 57.0548 26.0326 60.7038 26.0326C73.9142 26.0326 80.5195 26.0326 81.6839 29.6164C82.8484 33.2002 77.5046 37.0826 66.8171 44.8475C63.865 46.9924 62.389 48.0648 61.8682 49.6675C61.3475 51.2702 61.9113 53.0054 63.0389 56.4759C67.1211 69.0397 69.1623 75.3217 66.1137 77.5366C63.0651 79.7515 57.7214 75.8691 47.0339 68.1042C44.0818 65.9593 42.6057 64.8869 40.9205 64.8869C39.2353 64.8869 37.7593 65.9593 34.8072 68.1042C24.1197 75.8691 18.7759 79.7515 15.7274 77.5366C12.6788 75.3217 14.7199 69.0397 18.8022 56.4759C19.9298 53.0054 20.4936 51.2702 19.9728 49.6675C19.4521 48.0648 17.976 46.9924 15.0239 44.8475C4.33643 37.0826 -1.00732 33.2002 0.157131 29.6164C1.32158 26.0326 7.92681 26.0326 21.1373 26.0326C24.7863 26.0326 26.6108 26.0326 27.9741 25.042C29.3375 24.0515 29.9013 22.3163 31.0289 18.8459Z"
          fill="url(#paint0_linear)"
        />
      </G>
    </Svg>
  );
};


const CrownBanner = () => (
  <Svg width={320} height={120} viewBox="0 0 320 120">
    <Defs>
      <LinearGradient id="crownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
        <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Path
      d="M 30 60 Q 30 30, 60 30 L 260 30 Q 290 30, 290 60 L 280 100 Q 280 110, 270 110 L 50 110 Q 40 110, 40 100 Z"
      fill="url(#crownGradient)"
    />
  </Svg>
);

const Sparkle = ({ style }) => (
  <View style={[styles.sparkle, style]}>
    <Text style={styles.sparkleText}>✨</Text>
  </View>
);

export default function CompleteCard() {
  const router = useRouter();
  const [celebrateSound, setCelebrateSound] = useState(null);

  const [sparkles] = useState(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * width,
      top: Math.random() * height,
    }))
  );

  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const star1Anim = useRef(new Animated.Value(0)).current;
  const star2Anim = useRef(new Animated.Value(0)).current;
  const star3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Card entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Stars bounce animation
    const starAnimations = [
      { anim: star1Anim, delay: 0 },
      { anim: star2Anim, delay: 200 },
      { anim: star3Anim, delay: 400 },
    ];

    starAnimations.forEach(({ anim, delay }) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: -10,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    });
  }, []);

  useEffect(() => {
    const loadAndPlaySound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(require("../../assets/sounds/celebrate.wav"));
        setCelebrateSound(sound);
        await sound.playAsync();
      } catch (error) {
        console.log("Error loading celebrate sound:", error);
      }
    };

    loadAndPlaySound();

    return () => {
      celebrateSound?.unloadAsync();
    };
  }, []);

  const handleNext = async () => {
    try {
      const [topicId, childId, currentLevelId] = await Promise.all([
        AsyncStorage.getItem("topicId"),
        AsyncStorage.getItem("childId"),
        AsyncStorage.getItem("levelId"),
      ]);

      if (!topicId || !childId || !currentLevelId) {
        router.replace("/(tabs)");
        return;
      }

      const levels = await vocabAPI.getVocab(topicId, childId);
      const list = Array.isArray(levels) ? levels : [];

      const currentIndex = list.findIndex(
        (item) => String(item.id) === String(currentLevelId)
      );

      const nextItem =
        currentIndex >= 0 && currentIndex < list.length - 1
          ? list[currentIndex + 1]
          : null;

      if (nextItem) {
        await AsyncStorage.setItem("levelId", String(nextItem.id));
        await initGameFlow();
        router.replace("/playing");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.log("Error moving to next vocab from CompleteCard:", err);
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Sparkles */}
      {sparkles.map((sparkle) => (
        <Sparkle
          key={sparkle.id}
          style={{
            position: 'absolute',
            left: sparkle.left,
            top: sparkle.top,
          }}
        />
      ))}

      {/* Radial Glow */}
      <View style={styles.glowEffect} />

      {/* Main Card */}
      <Animated.View
        style={[
          styles.mainCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Crown Section */}
        <View style={styles.crownSection}>
          {/* Stars */}
          <View style={styles.starsContainer}>
            <Animated.View style={{ transform: [{ translateY: star1Anim }] }}>
              <StarIcon size={48} />
            </Animated.View>
            <Animated.View style={{ transform: [{ translateY: star2Anim }] }}>
              <StarIcon size={56} />
            </Animated.View>
            <Animated.View style={{ transform: [{ translateY: star3Anim }] }}>
              <StarIcon size={48} />
            </Animated.View>
          </View>

          {/* Crown Banner */}
          <View style={styles.crownBanner}>
            <CrownBanner />
            <View style={styles.crownTextContainer}>
              <Text style={styles.crownSubtext}>Animal</Text>
              <Text style={styles.crownMainText}>COMPLETE</Text>
            </View>
          </View>
        </View>

        {/* White Card */}
        <View style={styles.whiteCard}>
          <Text style={styles.congratsText}>Good job, Oliver!</Text>

          {/* Reward Section */}
          <View style={styles.rewardSection}>
            <Text style={styles.rewardLabel}>Reward</Text>
            <View style={styles.rewardContent}>
              <Image style={{ width: 50, height: 50 }} 
                source={ require("../../assets/images/candy.png")} />
              <Text style={styles.rewardNumber}>10</Text>
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>YAY, OK!</Text>
          </TouchableOpacity>
        </View>
        
      </Animated.View>
      <Image style={{ position: "absolute", bottom: 0, right: 0, zIndex: 1000, width: 100, height: 100 }} 
        source={ require("../../assets/images/animals/linhduong.png")} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  sparkle: {
    opacity: 0.3,
  },
  sparkleText: {
    fontSize: 20,
  },
  glowEffect: {
    position: 'absolute',
    width: 400,
    height: 400,
    backgroundColor: '#FCA5A5',
    opacity: 0.3,
    borderRadius: 200,
    blur: 100,
  },
  mainCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative'
  },
  crownSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: -20,
    zIndex: 10,
  },
  crownBanner: {
    position: 'relative',
    width: 320,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownSubtext: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  crownMainText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 2,
  },
  whiteCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  rewardSection: {
    alignItems: 'center',
  },
  rewardLabel: {
    color: '#FB923C',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardNumber: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F97316',
  },
  button: {
    backgroundColor: '#FBBF24',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#92400E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  duoPosition: {
    position: 'absolute',
    bottom: -120,
    right: 20,
  },
  duoContainer: {
    alignItems: 'center',
  },
  antlersContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: -8,
  },
  duoHead: {
    width: 96,
    height: 112,
    backgroundColor: '#92400E',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  ear: {
    position: 'absolute',
    width: 32,
    height: 48,
    backgroundColor: '#92400E',
    borderRadius: 16,
    top: 32,
  },
  earLeft: {
    left: -8,
    transform: [{ rotate: '-20deg' }],
  },
  earRight: {
    right: -8,
    transform: [{ rotate: '20deg' }],
  },
  innerEar: {
    position: 'absolute',
    width: 20,
    height: 32,
    backgroundColor: '#FCA5A5',
    borderRadius: 10,
    top: 40,
  },
  innerEarLeft: {
    left: -4,
    transform: [{ rotate: '-20deg' }],
  },
  innerEarRight: {
    right: -4,
    transform: [{ rotate: '20deg' }],
  },
  eyesContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  eyeWrapper: {
    position: 'relative',
  },
  eyeWhite: {
    width: 28,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  eyePupil: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 16,
    height: 20,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  eyeShine: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  nose: {
    position: 'absolute',
    bottom: 32,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 12,
    backgroundColor: '#78350F',
    borderRadius: 8,
  },
  smile: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    marginLeft: -15,
  },
});
