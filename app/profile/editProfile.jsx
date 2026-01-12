import { authAPI } from "@/service/authAPI";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const EditProfile = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const profile = await authAPI.myProfile();
      if (profile) {
        setFullName(profile.fullName || "");
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
      }
    };
    load();
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    const updated = await authAPI.updateProfile(fullName, email, phone);
    setSaving(false);
    if (!updated) return;
    router.back();
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require("../../assets/icons/Arrow-left.png")} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.inner_avatar}>
            <Image
              style={styles.avatar}
              source={require("../../assets/images/image-loading.png")}
            />
          </View>
        </View>

        {/* Form Fields: Fullname, Email, Phone */}
        <View style={styles.formContainer}>
          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#505050"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputWithIcon}>
            <Svg
              width="18"
              height="14"
              viewBox="0 0 18 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M18 2c0-.6-.4-1-1-1H1C.4 1 0 1.4 0 2v10c0 .6.4 1 1 1h16c.6 0 1-.4 1-1V2zM16 3L9 8 2 3h14z"
                fill="#545454"
              />
            </Svg>
            <TextInput
              style={styles.inputText}
              placeholder="Email"
              placeholderTextColor="#505050"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputWithIcon}>
            <Image
              source={{
                uri: "https://flagcdn.com/w20/vn.png",
              }}
              style={styles.flagIcon}
            />
            <Text style={styles.countryCode}>(+84)</Text>
            <TextInput
              style={styles.inputText}
              placeholder="Phone number"
              placeholderTextColor="#505050"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={styles.button_update}
            onPress={handleUpdate}
            disabled={saving}
          >
            <Text style={styles.button_text}>
              {saving ? "Updating..." : "Update"}
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
  inputWrapper: {
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
  input: {
    fontSize: 16,
    color: "#505050",
    minHeight: 24,
    padding: 0,
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
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    color: "#333",
    marginRight: 8,
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

export default EditProfile;

