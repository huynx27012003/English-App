import { COLORS } from "@/constants/colors";
import { childAPI } from "@/service/childAPI";
import { topicAPI } from "@/service/topicAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Svg, { Path } from "react-native-svg";
import Loading1 from "../loading/loading1";
import { useStudySession } from "@/app/context/StudySessionContext";

function LessonCard({ icon, title, countTopic, progress, press }) {
  return (
    <TouchableOpacity onPress={press} style={styles.card_lesson}>
      <View style={styles.iconWrapper_lesson}>
        <Image source={icon} style={styles.icon_lesson} contentFit="contain" />
      </View>

      <View style={styles.textBox_lesson}>
        <Text style={styles.title_lesson}>{title}</Text>
        {countTopic != null && (
          <Text style={styles.subtitle_lesson}>{countTopic} common topic</Text>
        )}
      </View>

      {progress != null && (
        <View style={styles.progressCircle_lesson}>
          <Text style={styles.progressText_lesson}>{progress}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const HomeSceen = () => {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [childDetail, setChildDetail] = useState(null);
  const [topics, setTopics] = useState([]);
  const { endSession } = useStudySession();

  const loadData = async () => {
    try {
      setLoading(true);

      const childId = await AsyncStorage.getItem("childId");
      if (!childId) {
        setCount(0);
        setChildDetail(null);
        setTopics([]);
        return;
      }

      const [topicData, childData] = await Promise.all([
        topicAPI.getTopic(childId),
        childAPI.getChildDetail(childId),
      ]);

      setCount(topicData.total || 0);
      setChildDetail(childData || null);
      await AsyncStorage.setItem("candy", String(childData.candyNumber));
      console.log("candy: ", childData.candyNumber);


      // sắp xếp tất cả topic theo % hoàn thành giảm dần (kể cả 0%)
      const items = [...(topicData.items || [])].sort(
        (a, b) =>
          Number(b.progressPercent || 0) - Number(a.progressPercent || 0)
      );
      setTopics(items);
    } catch (error) {
      console.log("Error loading the data", error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <Loading1 />;

  const activeTopic =
    topics.find((t) => Number(t.progressPercent || 0) < 100) || null;
  const activeProgress = activeTopic
    ? Number(activeTopic.progressPercent || 0)
    : 0;
  const isStart = !activeTopic || activeProgress === 0;
  const activeButtonLabel = isStart ? "Start Studying" : "Continue Studying";
  const activeTopicName = activeTopic ? activeTopic.topicName : "No topic yet";

  const handleContinueStudying = async (topic) => {
    try {
      if (!topic) {
        router.push("/home/vocab-list");
        return;
      }
      await AsyncStorage.setItem("topicId", String(topic.topicId));
      await AsyncStorage.setItem("topicName", topic.topicName);
      console.log("Saved topicId from home:", topic.topicId, "topicName:", topic.topicName);
      await new Promise((resolve) => setTimeout(resolve, 200));
      router.push("/(tabs)");
    } catch (error) {
      console.error("Error handleContinueStudying:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={async () => {
            await endSession();
            router.push("/home/child-profiles");
          }}
          style={styles.button_back}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <Path
              d="M15.3479 2.75708L2.75845 15.3439"
              stroke="#68182B"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M15.3517 15.3517L2.75171 2.75171"
              stroke="#68182B"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M15.3517 2.75171L2.75171 15.3517"
              stroke="#FFFEFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M15.3517 15.3517L2.75171 2.75171"
              stroke="#FFFEFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width="36" height="36" viewBox="0 0 30 30" fill="none">
            <Path
              d="M4 7H20"
              stroke="#202244"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <Path
              d="M4 12H20"
              stroke="#202244"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <Path
              d="M4 17H20"
              stroke="#202244"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <View style={[styles.row, { marginBottom: 25 }]}>
        <Text style={styles.text_welcome}>
          Hello {childDetail ? childDetail.fullName : ""}
        </Text>
        <View style={styles.avatarWrapper}>
          <Image
            style={styles.thumbnail}
            source={
              childDetail && childDetail.profileUrl
                ? { uri: childDetail.profileUrl }
                : require("../../assets/images/image-loading.png")
            }
            contentFit="cover"
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <AnimatedCircularProgress
            size={70}
            width={6}
            fill={activeProgress}
            tintColor="#3A94E7"
            backgroundColor="#E0E0E0"
            rotation={0}
          >
            {(fill) => (
              <Text style={styles.progressText}>{`${Math.round(
                fill
              )}%`}</Text>
            )}
          </AnimatedCircularProgress>

          <View style={styles.textBox}>
            <Text style={styles.topic}>Topic: {activeTopicName}</Text>
            <Text style={styles.title}>Discovering English</Text>
            <Text style={styles.subText}>Continue your journey!</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleContinueStudying(activeTopic)}
        >
          <Text style={styles.buttonText}>{activeButtonLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Lesson cards */}
      <View style={styles.container_lesson}>
        <LessonCard
          icon={require("../../assets/images/Lessons.png")}
          title="Vocabulary"
          countTopic={count}
          press={() => router.push("/home/vocab-list")}
        />
        <LessonCard
          icon={require("../../assets/images/Lessons.png")}
          title="Speaking with AI"

          press={() => router.push("/home/speakingAI")}
        />
        <LessonCard
          icon={require("../../assets/images/Lessons.png")}
          title="Dictionary"
          press={() => router.push("/home/dictionary")}
        />
      </View>

      <Image
        style={{ position: "absolute", bottom: 0, left: 0 }}
        source={require("../../assets/images/ThumbnailHome.png")}
      />
      <Image
        style={{ position: "absolute", bottom: 0, right: 0 }}
        source={require("../../assets/images/Thumbnailhome2.png")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    padding: 20,
    paddingTop: 30,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  menuButton: {
    padding: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  text_welcome: {
    fontSize: 30,
    fontWeight: "bold",
    flex: 2,
    textAlign: "center",
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#167F71",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    width: "100%",
    alignSelf: "center",
    marginRight: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3A94E7",
  },
  textBox: {
    marginLeft: 15,
    flex: 1,
  },
  topic: {
    fontSize: 14,
    color: "#666",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 4,
  },
  subText: {
    fontSize: 14,
    color: "#666",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#FFB700",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
    width: "80%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // lesson list
  container_lesson: {
    flex: 1,
    alignItems: "center",
    marginTop: 30,
    width: "100%",
  },
  card_lesson: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    width: "100%",
  },
  iconWrapper_lesson: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: "#F3AE29",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  icon_lesson: {
    width: 25,
    height: 25,
  },
  textBox_lesson: {
    flex: 1,
    justifyContent: "center",
  },
  title_lesson: {
    fontSize: 18,
    fontWeight: "600",
    color: "#252526",
  },
  subtitle_lesson: {
    fontSize: 14,
    color: "#888",
    marginTop: 3,
  },
  progressCircle_lesson: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFD45A",
    justifyContent: "center",
    alignItems: "center",
  },
  progressText_lesson: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFD45A",
  },
  button_back: {
    width: 36,
    height: 36,
    backgroundColor: "#EF3349",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeSceen;

