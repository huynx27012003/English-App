import { useStudySession } from "@/app/context/StudySessionContext";
import { childAPI } from "@/service/childAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import Loading1 from "../loading/loading1";

const ChildProfiles = () => {
  const router = useRouter();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { startSession } = useStudySession();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await childAPI.getChild();
      setChildren(data);
    } catch (error) {
      console.log("Error loading the data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const checkAuth = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      router.replace("/(auth)/sign-in");
      return;
    }
    loadData();
  };

  checkAuth();
}, []);


  const handleChangeAvatar = async (child) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        console.log("Permission to access media library was denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]?.uri) {
        return;
      }

      const uri = result.assets[0].uri;
      setUpdatingId(child.mrid);

      const updated = await childAPI.uploadAvatar(child.mrid, uri);
      if (!updated) {
        console.log("Upload avatar failed via backend");
        return;
      }

      setChildren((prev) =>
        prev.map((c) =>
          c.mrid === child.mrid
            ? {
                ...c,
                profileUrl: updated.profileUrl,
                cloudinaryPublicId: updated.cloudinaryPublicId,
              }
            : c
        )
      );
    } catch (err) {
      console.log("Error handleChangeAvatar:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <Loading1 />;

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Vui lòng chọn hồ sơ học tập</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push("/profile")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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
      </View>

      {/* ScrollView phần profile */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.boxProfile}>
          {children.map((child) => (
            <View key={child.mrid} style={styles.innerBoxProfile}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={async () => {
                  await AsyncStorage.setItem("childId", String(child.mrid));
                  await startSession(child.mrid);
                  router.push("/home");
                }}
              >
                <Image
                  source={
                    child.profileUrl
                      ? { uri: child.profileUrl }
                      : require("../../assets/images/profile-1.png")
                  }
                  style={styles.avatar}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => handleChangeAvatar(child)}
                disabled={updatingId === child.mrid}
              >
                <Text style={styles.editIconText}>
                  {updatingId === child.mrid ? "..." : "✎"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.profileName}>{child.fullName}</Text>
            </View>
          ))}

          <TouchableOpacity onPress={() => router.push("/home/create-child")} style={styles.innerBoxProfile}>
            <View style={styles.buttonCreate}>
              <Image source={require("../../assets/images/sum.png")} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  menuButton: {
    padding: 8,
  },
  boxProfile: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  innerBoxProfile: {
    backgroundColor: "#F0EFEF",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarWrapper: {
    borderRadius: 999,
    overflow: "hidden",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  editIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
  },
  editIconText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555555",
  },
  profileName: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  buttonCreate: {
    width: 70,
    height: 70,
    backgroundColor: "#D9D9D9",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

export default ChildProfiles;
