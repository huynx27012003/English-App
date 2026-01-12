import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const loading1 = () => {
  // Tạo animated values cho bounce (sử dụng native driver)
  const bounce1 = useRef(new Animated.Value(0)).current;
  const bounce2 = useRef(new Animated.Value(0)).current;
  const bounce3 = useRef(new Animated.Value(0)).current;
  const bounce4 = useRef(new Animated.Value(0)).current;
  const bounce5 = useRef(new Animated.Value(0)).current;

  // Tạo animated values cho màu sắc (không dùng native driver)
  const colorAnim1 = useRef(new Animated.Value(0)).current;
  const colorAnim2 = useRef(new Animated.Value(0)).current;
  const colorAnim3 = useRef(new Animated.Value(0)).current;
  const colorAnim4 = useRef(new Animated.Value(0)).current;
  const colorAnim5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation nhảy lên tuần tự
    const bounceSequence = Animated.loop(
      Animated.sequence([
        // Circle 1
        Animated.timing(bounce1, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        Animated.timing(bounce1, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        // Circle 2
        Animated.timing(bounce2, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        Animated.timing(bounce2, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        // Circle 3
        Animated.timing(bounce3, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        Animated.timing(bounce3, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        // Circle 4
        Animated.timing(bounce4, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        Animated.timing(bounce4, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        // Circle 5
        Animated.timing(bounce5, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        Animated.timing(bounce5, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        // Delay trước khi lặp lại
        Animated.delay(200),
      ])
    );

    // Animation chuyển màu (không dùng native driver)
    const createColorAnimation = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
    };

    // Start animations
    bounceSequence.start();

    createColorAnimation(colorAnim1, 0).start();
    createColorAnimation(colorAnim2, 400).start();
    createColorAnimation(colorAnim3, 800).start();
    createColorAnimation(colorAnim4, 1200).start();
    createColorAnimation(colorAnim5, 1600).start();
  }, []);

  // Hàm tạo style cho bounce effect
  const createBounceStyle = (animValue) => ({
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -25],
        }),
      },
      {
        scale: animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.15, 1],
        }),
      },
    ],
  });

  // Hàm tạo màu chuyển đổi
  const createColorStyle = (animValue, colors) => ({
    backgroundColor: animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: colors,
    }),
  });
  return (
    <View style={styles.container}>
        <Image
            source={require("../../assets/images/image-loading.png")}
            style={styles.image}
            contentFit="contain"
        />
        <Image
            source={require("../../assets/images/fun-lish.png")}
            style={styles.image_bottom}
            contentFit="contain"
        />

        <View style={styles.boxCircle}>
        {/* Circle 1 - Đỏ */}
        <Animated.View style={createBounceStyle(bounce1)}>
          <Animated.View
            style={[
              styles.circle,
              createColorStyle(colorAnim1, ['#b01616', '#ff4444', '#b01616']),
            ]}
          />
        </Animated.View>

        {/* Circle 2 - Xanh dương */}
        <Animated.View style={createBounceStyle(bounce2)}>
          <Animated.View
            style={[
              styles.circle,
              createColorStyle(colorAnim2, ['#0066cc', '#3399ff', '#0066cc']),
            ]}
          />
        </Animated.View>

        {/* Circle 3 - Xanh lá */}
        <Animated.View style={createBounceStyle(bounce3)}>
          <Animated.View
            style={[
              styles.circle,
              createColorStyle(colorAnim3, ['#2d9e3f', '#4caf50', '#2d9e3f']),
            ]}
          />
        </Animated.View>

        {/* Circle 4 - Vàng */}
        <Animated.View style={createBounceStyle(bounce4)}>
          <Animated.View
            style={[
              styles.circle,
              createColorStyle(colorAnim4, ['#f5a623', '#ffcc00', '#f5a623']),
            ]}
          />
        </Animated.View>

        {/* Circle 5 - Cam */}
        <Animated.View style={createBounceStyle(bounce5)}>
          <Animated.View
            style={[
              styles.circle,
              createColorStyle(colorAnim5, ['#ff6600', '#ff9933', '#ff6600']),
            ]}
          />
        </Animated.View>
      </View>
    </View>
 
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: 280,
    height: 280,
  },
  image_bottom:{
    width: 300,
    height: 300,
    marginTop: -50
  },
  boxCircle:{
    flexDirection: 'row',
    gap: 10
  },
  circle:{
    width: 20,
    height: 20,
    borderRadius: 30
  }
})

export default loading1