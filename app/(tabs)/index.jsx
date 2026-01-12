import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Loading1 from "../loading/loading1";
import { CustomNavBar } from "./CustomNavBar";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topicName, setTopicName] = useState('');


  const router = useRouter();

  const vw = width || SCREEN_WIDTH;
  const vh = height || SCREEN_HEIGHT;
  const totalScrollWidth = vw * 4;

  const loadData = async () => {
    const childId = await AsyncStorage.getItem("childId");
    const topicId = await AsyncStorage.getItem("topicId");
    const topicName = await AsyncStorage.getItem("topicName");

    try {
      // Chỉ show loading lần đầu khi chưa có data
      if (levels.length === 0) {
        setLoading(true);
      }
      
      // Fetch data mà không delay
      const data = await vocabAPI.getVocab(topicId, childId);
      
      setLevels(data || []);
      setTopicName(topicName || '');
      
    } catch (error) {
      console.log("Error loading the data", error);
    } finally {
      setLoading(false);
    }
  };

  // Lần đầu mount và mỗi lần focus vào tab
  useFocusEffect(() => {
    loadData();
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const progress = (offsetX / (totalScrollWidth - vw)) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      },
    }
  );

  const calculateLevelPositions = () => {
    const positions = [];
    const spacing = 220; 
    const topY = vh - 280; 
    const bottomY = vh - 150; 
    
    levels.forEach((level, index) => {
      const x = 100 + (index * spacing);
      const y = index % 2 === 0 ? bottomY : topY;
      
      positions.push({
        x,
        y,
        level,
        index,
      });
    });
    
    return positions;
  };

  const levelPositions = calculateLevelPositions();

  // Tạo đường SVG path nối các điểm bằng đường cong
  const createSmoothPath = () => {
    if (levelPositions.length === 0) return '';
    
    let path = `M ${levelPositions[0].x} ${levelPositions[0].y}`;
    
    for (let i = 0; i < levelPositions.length - 1; i++) {
      const current = levelPositions[i];
      const next = levelPositions[i + 1];
      
      // Tính điểm control cho bezier curve
      const controlX = (current.x + next.x) / 2;
      const controlY1 = current.y;
      const controlY2 = next.y;
      
      // Sử dụng cubic bezier curve để tạo đường cong mượt
      path += ` C ${controlX} ${controlY1}, ${controlX} ${controlY2}, ${next.x} ${next.y}`;
    }
    
    return path;
  };

  const handleNavigateToPlaying = async (levelId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      await AsyncStorage.setItem("levelId", String(levelId));
      router.push("/playing");
      
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (loading) return <Loading1 />;

  return (
    <>
    <View style={styles.container}>
      {/* Scrollable Background */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={styles.backgroundScroll}
        contentContainerStyle={{ height: vh, width: vw * 4 }}
        bounces={false}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
        scrollEnabled={true}
        directionalLockEnabled={true}
        overScrollMode="never"
        scrollsToTop={false}
      >
        {/* Background images */}
        <Image
          source={require('../../assets/images/bg-pick.png')}
          style={[styles.backgroundImage, { width: vw, height: vh }]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/images/bg-pick.png')}
          style={[styles.backgroundImage, { width: vw, height: vh }]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/images/bg-pick.png')}
          style={[styles.backgroundImage, { width: vw, height: vh }]}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/images/bg-pick.png')}
          style={[styles.backgroundImage, { width: vw, height: vh }]}
          resizeMode="cover"
        />
        
        {/* Đường nối mượt giữa các level */}
        <View style={[styles.pathContainer, { height: vh, width: vw * 4 }]}>
          <Svg height={vh} width={vw * 4}>
            <Path
              d={createSmoothPath()}
              stroke="#87CEEB"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        
        {/* Levels với số */}
        {levelPositions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.levelCircle,
              {
                left: item.x - 50,
                top: item.y - 50,
              },
            ]}
            onPress={() => {
              if (!item.level.locked) {
                setSelectedLevelIndex(index);
                handleNavigateToPlaying(item.level.id);
              }
            }}
            activeOpacity={0.7}
            disabled={item.level.locked}
          >
            {/* Circle chính */}
            <View style={[
              styles.levelInner,
              item.level.locked && styles.levelInnerLocked,
              !item.level.locked && styles.levelInnerUnlocked,
              selectedLevelIndex === index && styles.levelSelected,
            ]}>
              <Text style={[
                styles.levelNumber,
                item.level.locked && styles.levelNumberLocked,
              ]}>
                {item.level.number}
              </Text>
            </View>
            
            {item.level.locked && (
              <View style={styles.lockIcon}>
                <View style={styles.lockBody}>
                  <View style={styles.lockShackle} />
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.contentLayer} pointerEvents="box-none">
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{topicName}</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${scrollProgress}%` }]} />
          </View>
        </View>
      </View>
    </View>
    <CustomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  backgroundScroll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundContent: {
    // set dynamically via contentContainerStyle
  },
  backgroundImage: {
    // width/height set dynamically inline
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
  titleContainer: {
    position: 'absolute',
    top: 20,
    left: 30,
    zIndex: 10,
  },
  titleText: {
    fontSize: 48,
    fontWeight: '500',
    color: '#fff',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: [{ translateX: -200 }],
    zIndex: 10,
  },
  progressBarBackground: {
    width: 400,
    height: 30,
    backgroundColor: '#E26B1E',
    borderRadius: 10,
    elevation: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF7F1',
    borderRadius: 10
  },
  pathContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    // size set dynamically inline
  },
  levelCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  levelInnerLocked: {
    backgroundColor: '#6CB4E8',
  },
  levelInnerUnlocked: {
    backgroundColor: '#FF6B4A',
  },
  levelSelected: {
    transform: [{ scale: 1.15 }],
    borderWidth: 6,
  },
  levelNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelNumberLocked: {
    color: '#fff',
  },
  lockIcon: {
    position: 'absolute',
    top: -10,
    right: 5,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#87CEEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  lockBody: {
    width: 14,
    height: 12,
    backgroundColor: '#87CEEB',
    borderRadius: 2,
    marginTop: 5,
  },
  lockShackle: {
    position: 'absolute',
    top: -10,
    left: 3,
    width: 8,
    height: 10,
    borderWidth: 2.5,
    borderColor: '#87CEEB',
    borderRadius: 4,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
});

