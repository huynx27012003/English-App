import { vocabAPI } from "@/service/vocabAPI";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const header = ({onBack}) => {
  const [data, setData] = useState([]);
  
  const loadData = async () => {
    const levelId = await AsyncStorage.getItem("levelId");
    const result = await vocabAPI.getVocabDetail(levelId);
    if (result) {
      setData(result); 
    }
  }
  useEffect(() =>{
    loadData();
  })
  return (
    <View style={styles.header}>
        <TouchableOpacity
            onPress={onBack}
            style={styles.button_back}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <Path d="M15.3479 2.75708L2.75845 15.3439" stroke="#68182B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15.3517 15.3517L2.75171 2.75171" stroke="#68182B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15.3517 2.75171L2.75171 15.3517" stroke="#FFFEFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15.3517 15.3517L2.75171 2.75171" stroke="#FFFEFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
        </TouchableOpacity>
        {/* <Text style={styles.title}>{ data.word }</Text> */}
        <View style={styles.side} />
    </View>
  )
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    height: 60,
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    alignSelf: "center",
  },
  button_back: {
    width: 36,
    height: 36,
    backgroundColor: "#EF3349",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  side: {
    width: 36,
    alignItems: "center",
  }
})
export default header