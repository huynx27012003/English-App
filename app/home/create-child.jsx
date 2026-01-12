import { childAPI } from "@/service/childAPI";
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icon components
const MailIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 14.5V16.5M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288M7 10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 11.638C4 12.2798 4 13.1198 4 14.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V14.8C20 13.1198 20 12.2798 19.673 11.638C19.3854 11.0735 18.9265 10.6146 18.362 10.327C18.0057 10.1455 17.5883 10.0647 17 10.0288M7 10.0288V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.0288"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const createChild = () => {
  const [fullName, setFullName] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);
  const router = useRouter();

  // Tạo danh sách năm từ 2025 về 2014
  const years = [];
  for (let year = 2025; year >= 2014; year--) {
    years.push(year);
  }

  const handleYearSelect = (year) => {
    setSelectedYear(year);
  };

  const handleSubmit = async () => {
    try {
      const data = await childAPI.addChild({
        fullName: fullName,
        dob: selectedYear,
      });
      if(data){
        router.push("/home/child-profiles")
      }
    } catch (error) {
      console.log("Error add child: ", error);
    } 
  };


  return (
    <View style={styles.container }>
      <SafeAreaView edges={["top"]} style={{ width: '100%' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require("../../assets/icons/Arrow-left.png")} style={{ width: 25, height: 25 }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Child</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>
        <View style={styles.innerBox}>
            <Image
                source={require("../../assets/images/image-loading.png")}
                style={styles.image}
                contentFit="contain"
            />
            <Text style={styles.textInfo}>Hãy điền thông tin của bé</Text>
        </View>
        <View>
            <View style={styles.content}>
                {/* Input Họ và tên */}
                <View style={styles.inputContainer}>
                    <View style={styles.iconWrapper}>
                        <MailIcon />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Họ và tên"
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                {/* Label Năm sinh */}
                <View style={styles.labelContainer}>
                    <View style={styles.iconWrapper}>
                        <LockIcon />
                    </View>
                    <Text style={styles.label}>Năm sinh</Text>
                </View>

                {/* Grid năm sinh */}
                <View style={styles.yearGrid}>
                    {years.map((year) => (
                        <TouchableOpacity
                            key={year}
                            style={[
                                styles.yearButton,
                                selectedYear === year && styles.yearButtonSelected,
                            ]}
                            onPress={() => handleYearSelect(year)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                styles.yearText,
                                selectedYear === year && styles.yearTextSelected,
                                ]}
                            >
                                {year}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Button Thêm */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                >
                <Text style={styles.submitButtonText}>Thêm</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    // justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
    paddingHorizontal: 20,
    backgroundColor: "#F7FCFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  image: {
    width: 200,
    height: 200,
  },
  textInfo:{
    fontSize: 24,
    fontWeight: 800
  },
  innerBox:{
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconWrapper: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 12,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  yearButton: {
    width: (width - 40 - 36) / 4, // 4 columns với gap
    height: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearButtonSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  yearText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D1D5DB',
  },
  yearTextSelected: {
    color: '#92400E',
  },
  submitButton: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 25,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
})

export default createChild;
