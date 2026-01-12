import { authAPI } from "@/service/authAPI";
import { useClerk } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const MenuItem = ({ icon, title, value, onPress }) => {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.left}>
        {icon}
        <Text style={styles.item_title}>{title}</Text>
      </View>
      <View style={styles.right}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        <Svg
          width="11"
          height="18"
          viewBox="0 0 11 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.2748 8.98886C10.2748 9.33613 10.1333 9.65767 9.9018 9.90204L2.18478 17.6191C1.68317 18.1078 0.872885 18.0949 0.38414 17.5933C-0.117466 17.1046 -0.130328 16.2943 0.358417 15.7927L7.13653 8.92455L0.358417 2.18502C-0.130328 1.68342 -0.117466 0.873129 0.38414 0.384384C0.872885 -0.117222 1.67031 -0.130084 2.18478 0.358661L9.9018 8.07568C10.0176 8.2043 10.1076 8.34577 10.1719 8.50012C10.2362 8.65446 10.2748 8.82166 10.2748 8.98886Z"
            fill="#1D1D1B"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
};

const ProfileScreen = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const [data, setData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    const profile = await authAPI.myProfile();
    if (profile) {
      setData(profile);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChangeAvatar = async () => {
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
      setUploading(true);

      const updated = await authAPI.uploadAvatar(uri);
      if (!updated) {
        console.log("Upload user avatar failed via backend");
        return;
      }

      setData((prev) =>
        prev ? { ...prev, profileUrl: updated.profileUrl } : updated
      );
    } catch (error) {
      console.log("Error handleChangeAvatar (user):", error);
    } finally {
      setUploading(false);
    }
  };

  const handleEditProfile = () => {
    router.push("/profile/editProfile");
  };

  const handleReport = () => {
    router.push("/profile/report");
  };
  const handleChangePassowrd = () => {
    router.push("/profile/changePassword");
  };
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await signOut();
            await AsyncStorage.clear();
            router.replace("/(auth)/sign-in");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View
      style={{
        flex: 1,
        paddingLeft: 20,
        paddingRight: 20,
        backgroundColor: "#F5F9FF",
      }}
    >
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require("../../assets/icons/Arrow-left.png")} />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
        </View>
      </SafeAreaView>

      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <View style={styles.box_profile}>
          {/* Avatar */}
          <View style={styles.inner_avatar}>
            <Image
              style={styles.avatar}
              source={
                data?.profileUrl
                  ? { uri: data.profileUrl }
                  : require("../../assets/images/image-loading.png")
              }
            />
            <TouchableOpacity
              style={styles.editIcon}
              onPress={handleChangeAvatar}
              disabled={uploading}
            >
              <Text style={styles.editIconText}>{uploading ? "..." : "✎"}</Text>
            </TouchableOpacity>
          </View>

          {/* Basic info (read-only) */}
          <View style={styles.infoContainer}>
            <Text style={styles.user_name}>
              {data?.fullName || data?.username || "User"}
            </Text>
            <Text style={styles.email}>{data?.email || ""}</Text>
          </View>

          {/* Menu items */}
          <View style={styles.container}>
            <MenuItem
              icon={
                <Svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M3 3H17V17H3V3Z"
                    stroke="#202244"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M6 9H14"
                    stroke="#202244"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M6 13H11"
                    stroke="#202244"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Báo cáo học tập"
              onPress={handleReport}
            />
            <MenuItem
              icon={
                <Svg
                  width="18"
                  height="20"
                  viewBox="0 0 18 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 10.5C7.067 10.5 5.5 8.933 5.5 7C5.5 5.067 7.067 3.5 9 3.5C10.933 3.5 12.5 5.067 12.5 7C12.5 8.933 10.933 10.5 9 10.5ZM3.5 7C3.5 4.239 5.739 2 8.5 2H9.5C12.261 2 14.5 4.239 14.5 7C14.5 9.761 12.261 12 9.5 12H8.5C5.739 12 3.5 9.761 3.5 7Z"
                    fill="#202244"
                  />
                </Svg>
              }
              title="Edit Profile"
              onPress={handleEditProfile}
            />

            <MenuItem
              icon={
                <Svg
                  width="20"
                  height="16"
                  viewBox="0 0 20 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M2 2C1.44772 2 1 2.44772 1 3V13C1 13.5523 1.44772 14 2 14H18C18.5523 14 19 13.5523 19 13V3C19 2.44772 18.5523 2 18 2H2ZM3 4H17V6H3V4Z"
                    fill="#202244"
                  />
                </Svg>
              }
              title="Change password"
              onPress={handleChangePassowrd}
            />

            <MenuItem
              icon={
                <Svg
                  width="18"
                  height="20"
                  viewBox="0 0 18 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M9 2C7.34315 2 6 3.34315 6 5V6.17071C4.27477 6.58254 3 8.13623 3 9.93934V13L2 14V15H16V14L15 13V9.93934C15 8.13623 13.7252 6.58254 12 6.17071V5C12 3.34315 10.6569 2 9 2ZM8 17C8 17.5523 8.44772 18 9 18C9.55228 18 10 17.5523 10 17H8Z"
                    fill="#202244"
                  />
                </Svg>
              }
              title="Notifications"
              onPress={() => { }}
            />

            <MenuItem
              icon={
                <Svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M10 1.5C5.85786 1.5 2.5 4.85786 2.5 9C2.5 13.1421 5.85786 16.5 10 16.5C14.1421 16.5 17.5 13.1421 17.5 9C17.5 4.85786 14.1421 1.5 10 1.5ZM4 9C4 8.37868 4.10133 7.78091 4.28769 7.22288L6.5 9.43519V10.5C6.5 11.0523 6.94772 11.5 7.5 11.5H8V12.5H7.5C5.84315 12.5 4.5 11.1569 4.5 9.5L4 9ZM10 15C9.29757 15 8.62719 14.8583 8.01 14.6033L9.5 13.1133V12.5H10.5C11.0523 12.5 11.5 12.0523 11.5 11.5V10C11.5 9.72386 11.2761 9.5 11 9.5H9V8H11C12.1046 8 13 8.89543 13 10V11.5C13 12.6046 12.1046 13.5 11 13.5H11.1133L9.27635 15.337C9.51438 15.3797 9.75583 15.403 10 15.403V15Z"
                    fill="#202244"
                  />
                </Svg>
              }
              title="Language"
              value="English (US)"
              onPress={() => { }}
            />

            <MenuItem
              icon={
                <Svg
                  width="18"
                  height="20"
                  viewBox="0 0 18 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M4 2C3.44772 2 3 2.44772 3 3V17C3 17.5523 3.44772 18 4 18H14C14.5523 18 15 17.5523 15 17V7.41421C15 7.148 14.8946 6.892 14.7071 6.70711L10.2929 2.29289C10.108 2.10536 9.85199 2 9.58579 2H4Z"
                    fill="#202244"
                  />
                </Svg>
              }
              title="Terms & Conditions"
              onPress={() => { }}
            />

            <MenuItem
              icon={
                <Svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M9 1.5C5.41015 1.5 2.5 4.41015 2.5 8C2.5 11.5899 5.41015 14.5 9 14.5C12.5899 14.5 15.5 11.5899 15.5 8C15.5 4.41015 12.5899 1.5 9 1.5ZM8 12H10V14H8V12ZM9 3.5C10.3807 3.5 11.5 4.61929 11.5 6C11.5 6.79565 11.1839 7.55871 10.6213 8.12132L9.93934 8.8033C9.71886 9.02379 9.5 9.5 9.5 10H8V9.5C8 8.70435 8.31607 7.94129 8.87868 7.37868L9.56066 6.6967C9.81607 6.44129 10 6.10218 10 5.75C10 5.05964 9.44036 4.5 8.75 4.5C8.05964 4.5 7.5 5.05964 7.5 5.75H6C6 4.23122 7.23122 3 8.75 3H9Z"
                    fill="#202244"
                  />
                </Svg>
              }
              title="Help Center"
              onPress={() => { }}
            />

            <MenuItem
              icon={
                <Svg
                  width="20"
                  height="19"
                  viewBox="0 0 20 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <Path
                    d="M15.3092 0.792341C14.8464 0.491091 14.2269 0.622126 13.9257 1.08502C13.6244 1.54791 13.7554 2.16736 14.2183 2.46861L14.7638 1.63048L15.3092 0.792341ZM18.4437 11.628L19.4024 11.9125L19.4024 11.9125L18.4437 11.628ZM1.36864 11.628L0.40995 11.9125L0.409952 11.9125L1.36864 11.628ZM5.59404 2.46861C6.05693 2.16736 6.18796 1.54791 5.88671 1.08502C5.58546 0.622126 4.96601 0.491091 4.50312 0.792341L5.04858 1.63048L5.59404 2.46861ZM10.9054 1C10.9054 0.447715 10.4577 0 9.90537 0C9.35309 0 8.90537 0.447715 8.90537 1H9.90537H10.9054ZM8.90537 8.69121C8.90537 9.24349 9.35309 9.69121 9.90537 9.69121C10.4577 9.69121 10.9054 9.24349 10.9054 8.69121H9.90537H8.90537ZM14.7638 1.63048L14.2183 2.46861C17.1516 4.37762 18.4806 7.98834 17.485 11.3436L18.4437 11.628L19.4024 11.9125C20.6498 7.70849 18.9847 3.18434 15.3092 0.792341L14.7638 1.63048ZM18.4437 11.628L17.485 11.3436C16.4895 14.6986 13.4059 17 9.90618 17V18V19C14.2913 19 18.155 16.1165 19.4024 11.9125L18.4437 11.628ZM9.90618 18V17C6.40642 17 3.32287 14.6986 2.32732 11.3436L1.36864 11.628L0.409952 11.9125C1.6574 16.1165 5.52104 19 9.90618 19V18ZM1.36864 11.628L2.32732 11.3436C1.33175 7.98834 2.66072 4.37762 5.59404 2.46861L5.04858 1.63048L4.50312 0.792341C0.827657 3.18434 -0.837475 7.70849 0.40995 11.9125L1.36864 11.628ZM9.90537 1H8.90537V8.69121H9.90537H10.9054V1H9.90537Z"
                    fill="#202244"
                  />
                </Svg>
              }
              title="Logout"
              onPress={handleLogout}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 20,
  },
  box_profile: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  inner_avatar: {
    width: 110,
    height: 110,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "#167F71",
    backgroundColor: "#D8D8D8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -50,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  user_name: {
    fontSize: 24,
    color: "#202244",
    fontWeight: "600",
    textAlign: "center",
  },
  email: {
    fontSize: 13,
    color: "#545454",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  infoContainer: {
    width: "100%",
    marginTop: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  container: {
    marginTop: 20,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "100%",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  item_title: {
    marginLeft: 12,
    fontSize: 15,
    color: "#202244",
    fontWeight: "700",
  },
  value: {
    marginRight: 8,
    fontSize: 14,
    color: "#0961F5",
    fontWeight: "800",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
  },
  editIconText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#167F71",
  },
});

export default ProfileScreen;

