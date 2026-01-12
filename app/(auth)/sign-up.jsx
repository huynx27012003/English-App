import { COLORS } from '@/constants/colors';
import { authAPI } from "@/service/authAPI";
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Clerk removed; local sign-up flow TBD

const { height } = Dimensions.get("window");
const SignUpScreen = () => {
    const router = useRouter();
  
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [userName, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    // No Clerk verification; implement backend registration if available

    const handleSignUp = async () => {
      if (!userName || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }
      setLoading(true);

      try {
        const result = await authAPI.register(userName, password);
        console.log("result", result);
        
        if (result.status == "200") {
          Alert.alert("Đăng ký thành công!");
          router.replace("/(auth)/sign-in");
        } else {
          Alert.alert(result.message);
        }
      } catch (err) {
        Alert.alert("Error", err.errors?.[0]?.message || "SignUp in failed");
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
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter userName"
                placeholderTextColor={COLORS.textLight}
                value={userName}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name="eye-outline"
                  size={20}
                  color={ COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.authButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{loading ? "Signing Up..." : "Sign Up"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => router.back()}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.link}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

      </KeyboardAvoidingView>
        
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    textAlign: 'center'
  },
  text_register:{
    color: "#757070",
    fontSize: 16,
    fontWeight: 700,
  },
  text_placeholder:{
    color: "#ccc",
  },
  textInput:{
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc"
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
export default SignUpScreen;
