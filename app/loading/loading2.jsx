import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const Loading2 = ({ second = 2 }) => {
  const moveAnim = useRef(new Animated.Value(-150)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);

  useEffect(() => {
    const moveCrab = () => {
      Animated.sequence([
        Animated.timing(moveAnim, {
          toValue: 150,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: -150,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => moveCrab());
    };
    moveCrab();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: second * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [second]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Cây hai bên */}
      <Image style={styles.treeBigLeft} contentFit="contain" source={require("../../assets/images/tree/Tree 06-1.png")} />
      <Image style={styles.treeSmallLeft} contentFit="contain" source={require("../../assets/images/tree/Tree 06-3.png")} />

      {/* 🦀 LOTTIE CRAB */}
      <Animated.View style={{ transform: [{ translateX: moveAnim }] }}>
        <LottieView
          ref={lottieRef}
          source={{ uri: "https://lottie.host/a1cd7723-375a-4303-8190-883b23153fce/me8oPDkQCH.json" }}
          autoPlay
          loop
          style={styles.lottie}
        />
      </Animated.View>

      <Text style={styles.textLoading}>Loading ...</Text>

      {/* Progress */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <Image style={styles.treeBigRight} contentFit="contain" source={require("../../assets/images/tree/Tree 04-2.png")} />
      <Image style={styles.treeSmallRight} contentFit="contain" source={require("../../assets/images/tree/Tree 08-1.png")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  treeBigLeft: {
    width: 200,
    height: 200,
    position: 'absolute',
    left: -10,
    bottom: 40,
  },
  treeSmallLeft: {
    width: 100,
    height: 100,
    position: 'absolute',
    left: 70,
    bottom: 70,
  },
  treeBigRight: {
    width: 200,
    height: 200,
    position: 'absolute',
    right: -10,
    bottom: 40,
  },
  treeSmallRight: {
    width: 100,
    height: 100,
    position: 'absolute',
    right: 70,
    bottom: 70,
  },
  lottie: {
    width: 180,
    height: 180,
  },
  textLoading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 20
  },
  progressBarContainer: {
    height: 35,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#00D4D4',
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '70%',
  },
  progressFill: {
    backgroundColor: '#FFB366',
    height: '100%',
  },
});

export default Loading2;
