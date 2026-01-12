import { authAPI } from "@/service/authAPI";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const changePassword = () => {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password does not match");
      return;
    }

    setSaving(true);
    const result = await authAPI.changePassword(newPassword, confirmPassword);
    setSaving(false);

    if (result?.success) {
      Alert.alert("Success", "Password changed successfully");
      router.back();
    } else {
      Alert.alert("Failed", result?.message || "Change password failed");
    }
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require("../../assets/icons/Arrow-left.png")} />
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.inner_avatar}>
            <Image
              style={styles.avatar}
              source={require("../../assets/images/image-loading.png")}
            />
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* New Password */}
          <View style={styles.inputWithIcon}>
            <Svg width="18" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5z"
                fill="#545454"
              />
            </Svg>
            <TextInput
              style={styles.inputText}
              placeholder="New password"
              placeholderTextColor="#505050"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWithIcon}>
            <Svg width="18" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5z"
                fill="#545454"
              />
            </Svg>
            <TextInput
              style={styles.inputText}
              placeholder="Confirm password"
              placeholderTextColor="#505050"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.button_update}
            onPress={handleChangePassword}
            disabled={saving}
          >
            <Text style={styles.button_text}>
              {saving ? "Updating..." : "Change Password"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F5F9FF",
    paddingHorizontal: 16,
  },

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

  scrollView: {
    flex: 1,
    paddingTop: 20,
  },

  scrollContent: {
    paddingBottom: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  inner_avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#167F71",
    backgroundColor: "#D8D8D8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  formContainer: {
    width: "100%",
    paddingHorizontal: 8,
  },

  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  inputText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    minHeight: 24,
    padding: 0,
  },

  button_update: {
    padding: 20,
    backgroundColor: "#FFF5BE",
    marginTop: 20,
    borderRadius: 20,
  },

  button_text: {
    color: "#865F5F",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
});
export default changePassword;
