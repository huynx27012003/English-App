import { COLORS } from "@/constants/colors";
import { authAPI } from "@/service/authAPI";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

import { useUser, useOAuth, useAuth } from "@clerk/clerk-expo";
const { height } = Dimensions.get("window");

const SignInScreen = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setusername] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  useEffect(() => {

    const syncAfterClerk = async () => {
      if (!user) return;
      const email = user?.primaryEmailAddress?.emailAddress;
      const fullName = user?.fullName;
      const avatarUrl = user?.imageUrl;

     

      if (!email) {
        Alert.alert("Clerk", "Không lấy được email từ Clerk");
        return;
      }
      setLoading(true);
      try {
        const token = await getToken();
        console.log("Clerk Token:", token);
        console.log("Full User Object:", JSON.stringify(user, null, 2));
        const result = await authAPI.clerkLogin({ email, fullName, avatarUrl, token });
        if (result?.token) {
          await AsyncStorage.setItem("token", result.token);
          router.replace("/home/child-profiles");
        } else {
          Alert.alert("Lỗi", "Đăng nhập backend thất bại!");
        }
      } catch (e) {
        Alert.alert("Lỗi", "Kết nối backend thất bại");
      } finally {
        setLoading(false);
      }
    };
    if (isSignedIn) {
      syncAfterClerk();
    }
  }, [user, isSignedIn]);

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.login(username, password);

      if (result) {
        await AsyncStorage.setItem("token", result.token);
        Alert.alert("Đăng nhập thành công!");
        router.replace("/home/child-profiles");
      } else {
        Alert.alert("Sai tài khoản hoặc mật khẩu!");
      }
    } catch (err) {
      Alert.alert("Error", err.errors?.[0]?.message || "Sign in failed");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/image-loading.png")}
              style={styles.image}
              contentFit="contain"
            />
          </View>
          <Text style={styles.title}>Welcome Back</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Username"
                placeholderTextColor={styles.text_placeholder}
                value={username}
                onChangeText={setusername}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password"
                placeholderTextColor={styles.text_placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons name="eye-outline" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.authButton, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              onPress={async () => {
                setLoading(true);
                try {
                  const { createdSessionId, setActive } = await startOAuthFlow();
                  if (createdSessionId && setActive) {
                    await setActive({ session: createdSessionId });
                  }
                } catch (err) {
                  Alert.alert("Lỗi Google Clerk", err?.message || "Không login được Google.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => router.push("/(auth)/sign-up")}
            >
              <Text style={styles.linkText}>
                Don&apos;t have an account?{" "}
                <Text style={styles.link}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  button_login: {
    padding: 20,
    backgroundColor: "#FFCF25",
    marginTop: 20,
    borderRadius: 20,
  },
  button_text: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "600",
    textAlign: "center",
  },
  text_register: {
    color: "#757070",
    fontSize: 16,
    fontWeight: "700",
  },
  text_placeholder: {
    color: "#ccc",
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  imageContainer: {
    height: height * 0.35,
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 300,
    height: 300,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.title,
    textAlign: "center",
    marginBottom: 40,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
  authButton: {
    backgroundColor: COLORS.title,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  linkContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  linkText: {
    fontSize: 16,
    color: "#9A8478",
  },
  link: {
    color: COLORS.title,
    fontWeight: "600",
  },
});

export default SignInScreen;

