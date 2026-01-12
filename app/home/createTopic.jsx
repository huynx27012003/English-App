import { vocabAPI } from "@/service/vocabAPI";
import { topicAPI } from "@/service/topicAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CreateTopic = () => {
  const router = useRouter();

  const [topicName, setTopicName] = useState("");
  const [query, setQuery] = useState("");
  const [vocabList, setVocabList] = useState([]);
  const [selectedIds, setSelectedIds] = useState({});
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const message = query.trim();
    if (!message) {
      return;
    }

    try {
      setLoading(true);
      const apiResult = await vocabAPI.generateVocab(message);

      const mapped = (apiResult || []).map((item, index) => ({
        id: String(index + 1),
        word: item.word,
        meaning: item.meaning,
      }));

      setVocabList(mapped);
      setSelectedIds({});
    } catch (error) {
      console.log("Error generate vocab:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  };

  const renderVocabItem = ({ item }) => {
    const selected = !!selectedIds[item.id];

    return (
      <TouchableOpacity
        style={[styles.vocabItem, selected && styles.vocabItemSelected]}
        onPress={() => toggleSelect(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.vocabTextWrapper}>
          <Text style={styles.vocabWord}>{item.word}</Text>
          <Text style={styles.vocabMeaning}>{item.meaning}</Text>
        </View>
        <View
          style={[
            styles.checkbox,
            selected && styles.checkboxSelected,
          ]}
        >
          {selected && <Text style={styles.checkboxTick}>X</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const handleSaveTopic = async () => {
    const selectedWords = vocabList
      .filter((item) => selectedIds[item.id])
      .map((item) => ({
        word: item.word,
        meaning: item.meaning,
      }));

    if (!topicName.trim() || selectedWords.length === 0) {
      console.log("Topic name or vocab list is empty");
      return;
    }

    try {
      const childId = await AsyncStorage.getItem("childId");

      const response = await topicAPI.createTopic(
        topicName.trim(),
        childId,
        selectedWords
      );
      console.log("Create topic response:", response);

      if (response?.success) {
        // Quay về danh sách topic sau khi tạo thành công
        router.replace("/home/vocab-list");
      }
    } catch (error) {
      console.log("Error saving topic:", error);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require("../../assets/icons/Arrow-left.png")} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Topic</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Topic name</Text>
          <TextInput
            style={styles.input}
            value={topicName}
            onChangeText={setTopicName}
            placeholder="Example: Animals, Colors, Family..."
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Prompt / description</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Example: generate vocab about animals"
            placeholderTextColor="#999"
            onSubmitEditing={handleGenerate}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerate}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.generateButtonText}>
              {loading ? "Generating..." : "Generate vocabulary"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Suggested vocabulary</Text>

        <FlatList
          data={vocabList}
          keyExtractor={(item) => item.id}
          renderItem={renderVocabItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Enter a prompt and tap "Generate vocabulary" to see words.
              </Text>
            </View>
          }
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveTopic}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save topic</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    color: "#333",
  },
  generateButton: {
    marginTop: 12,
    backgroundColor: "#3A94E7",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  listContent: {
    paddingBottom: 80,
  },
  vocabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  vocabItemSelected: {
    borderWidth: 1.5,
    borderColor: "#3A94E7",
    backgroundColor: "#EAF4FF",
  },
  vocabTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  vocabWord: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  vocabMeaning: {
    fontSize: 15,
    color: "#555",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    borderColor: "#3A94E7",
    backgroundColor: "#3A94E7",
  },
  checkboxTick: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F7FCFF",
  },
  saveButton: {
    backgroundColor: "#FFB700",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default CreateTopic;
