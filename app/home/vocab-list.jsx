import { topicAPI } from "@/service/topicAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import Loading1 from "../loading/loading1";

// Search Bar Component
function SearchBar({ onSearch }) {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchText);
    }
  };

  return (
    <View style={styles.searchBarContainer}>
      <TouchableOpacity 
        style={styles.plusButton}
        onPress={() => router.push("/home/createTopic")}
        activeOpacity={0.7}
      >
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Line 
            x1="12" 
            y1="5" 
            x2="12" 
            y2="19" 
            stroke="#000" 
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Line 
            x1="5" 
            y1="12" 
            x2="19" 
            y2="12" 
            stroke="#000" 
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#A0A0A0"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24">
            <Circle 
              cx="11" 
              cy="11" 
              r="8" 
              stroke="#FFFFFF" 
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <Path 
              d="M21 21l-4.35-4.35" 
              stroke="#FFFFFF" 
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LessonCard({ icon, title, subtitle, progress, topicId, router, onDelete, isCustom }) {
  const pan = useState(() => new Animated.Value(0))[0];
  const SWIPE_THRESHOLD = -80;

  // Chỉ tạo panResponder nếu là custom topic
  const panResponder = isCustom ? PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        pan.setValue(Math.max(gestureState.dx, SWIPE_THRESHOLD));
      } else if (gestureState.dx > 0 && pan._value < 0) {
        pan.setValue(Math.min(gestureState.dx + pan._value, 0));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -40) {
        Animated.spring(pan, {
          toValue: SWIPE_THRESHOLD,
          useNativeDriver: true,
          tension: 50,
          friction: 8
        }).start();
      } else {
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8
        }).start();
      }
    },
  }) : { panHandlers: {} };

  const handlePress = async () => {
    try {
      await AsyncStorage.setItem("topicId", String(topicId));
      await AsyncStorage.setItem("topicName", title);
      console.log('Saved topicId:', topicId, 'topicName:', title);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      router.push("/(tabs)"); 
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async () => {
    try {      
      Animated.spring(pan, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      
      if (onDelete) {
        onDelete(topicId);
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  // Nếu không phải custom, render card đơn giản không có swipe
  if (!isCustom) {
    return (
      <View style={styles.swipeContainer}>
        <TouchableOpacity 
          onPress={handlePress}
          style={styles.card_lesson}
          activeOpacity={0.8}
        >
          <View style={styles.iconWrapper_lesson}>
            <Image source={icon} style={styles.icon_lesson} />
          </View>

          <View style={styles.textBox_lesson}>
            <Text style={styles.title_lesson}>{title}</Text>
            <Text style={styles.subtitle_lesson}>{subtitle} vocabulary words</Text>
          </View>

          {progress !== undefined && (
            <View style={styles.progressCircle_lesson}>
              <Text style={styles.progressText_lesson}>{progress}%</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Custom topic với background #D0EFFF

  // Custom topic với đầy đủ swipe functionality
  return (
    <View style={styles.swipeContainer}>
      {/* Delete Button (Behind) */}
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Card (Front) */}
      <Animated.View
        style={[
          styles.animatedCard,
          {
            transform: [{ translateX: pan }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          onPress={handlePress}
          style={[styles.card_lesson, styles.card_lesson_custom]}
          activeOpacity={0.8}
        >
          <View style={styles.iconWrapper_lesson}>
            <Image source={icon} style={styles.icon_lesson} />
          </View>

          <View style={styles.textBox_lesson}>
            <Text style={styles.title_lesson}>{title}</Text>
            <Text style={styles.subtitle_lesson}>{subtitle} vocabulary words</Text>
          </View>

          {progress !== undefined && (
            <View style={styles.progressCircle_lesson}>
              <Text style={styles.progressText_lesson}>{progress}%</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const VoCabList = () => {
  const router = useRouter();
  const [topics, setTopic] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const childId = await AsyncStorage.getItem("childId");
      const data = await topicAPI.getTopic(childId);
      setTopic(data.items || []);
      setFilteredTopics(data.items || []);
    } catch (error) {
      console.log("Error loading the data", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleSearch = (searchText) => {
    if (!searchText.trim()) {
      setFilteredTopics(topics);
      return;
    }

    const filtered = topics.filter(topic =>
      topic.topicName.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredTopics(filtered);
  };

  const handleDelete = async (topicId) => {
    try {
      await topicAPI.deleteTopic(topicId);
      
      // Update local state
      const updatedTopics = topics.filter(topic => topic.topicId !== topicId);
      setTopic(updatedTopics);
      setFilteredTopics(updatedTopics);
      
      console.log('Deleted topic:', topicId);
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  // Phân loại topics theo topicType
  const defaultTopics = filteredTopics.filter(topic => topic.topicType === 'default');
  const customTopics = filteredTopics.filter(topic => topic.topicType === 'custom');

  if (loading) return <Loading1 />;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/home");
              }
            }}
          >
            <Image source={require('../../assets/icons/Arrow-left.png')} />
          </TouchableOpacity>
          <Text style={styles.title_header}>Topic List</Text>
          <View style={styles.side} />
        </View>
      </SafeAreaView>

      <SearchBar onSearch={handleSearch} />

      <FlatList
        data={defaultTopics}
        keyExtractor={(item, index) => `default-${item.topicId || index}`}
        renderItem={({ item }) => (
          <LessonCard
            icon={require("../../assets/images/Lessons.png")}
            title={item.topicName}
            subtitle={item.toltalVocab}
            progress={item.progressPercent}
            topicId={item.topicId}
            router={router}
            isCustom={false}
          />
        )}
        contentContainerStyle={styles.container_lesson}
        ListFooterComponent={
          <>
            {/* Render custom topics */}
            {customTopics.map((item, index) => (
              <LessonCard
                key={`custom-${item.topicId || index}`}
                icon={require("../../assets/images/Lessons.png")}
                title={item.topicName}
                subtitle={item.toltalVocab}
                progress={item.progressPercent}
                topicId={item.topicId}
                router={router}
                onDelete={() => handleDelete(item.topicId)}
                isCustom={true}
              />
            ))}
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    justifyContent: "space-between",
    backgroundColor: "#F7FCFF",
    paddingHorizontal: 20
  },
  side: { width: 36, alignItems: "center" },
  title_header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 20
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F7FCFF',
    gap: 12,
  },
  plusButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 48,
    paddingLeft: 16,
    paddingRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFA726',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container_lesson: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  swipeContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    width: 60,
    height: '100%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedCard: {
    backgroundColor: '#fff',
  },
  card_lesson: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#3A94E7",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  card_lesson_active: { 
    backgroundColor: "#D0EFFF",
    marginBottom: 15,
  },
  card_lesson_custom: {
    backgroundColor: "#D0EFFF",
  },
  iconWrapper_lesson: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3AE29",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  icon_lesson: { width: 30, height: 30, resizeMode: "contain" },
  textBox_lesson: { flex: 1 },
  title_lesson: { fontSize: 16, fontWeight: "600", color: "#252526" },
  subtitle_lesson: { fontSize: 14, color: "#888", marginTop: 3 },
  progressCircle_lesson: {
    width: 50,
    height: 50,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FFD45A",
    justifyContent: "center",
    alignItems: "center",
  },
  progressText_lesson: { fontSize: 12, fontWeight: "500", color: "#FFD45A" },
  button_premium: {
    position: 'relative',
    padding: 5,
    borderRadius: 50,
    backgroundColor: '#3A94E7',
  },
  button_premium_text: {
    fontSize: 12,
    fontWeight: "800",
    color: '#fff'
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default VoCabList;
