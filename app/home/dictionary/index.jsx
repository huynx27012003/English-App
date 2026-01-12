import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import { Audio } from "expo-av";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

export default function DictionaryScreen() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [sound, setSound] = useState(null);

    // Function to search for a word
    const searchWord = async (word) => {
        if (!word || word.trim() === "") return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
            );
            if (!response.ok) {
                throw new Error("Word not found");
            }
            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError("Sorry, we couldn't find that word.");
        } finally {
            setLoading(false);
        }
    };

    const playAudio = async (url) => {
        try {
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                {
                    shouldPlay: true,
                    volume: 1.0,
                }
            );

            setSound(newSound);
        } catch (error) {
            console.log("Error playing audio", error);
        }
    };


    useEffect(() => {
        const initAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,

                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,

                });

            } catch (e) {
                console.log("Audio mode init error:", e);
            }
        };

        initAudio();

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    // Handle "related word" click
    const handleRelatedWordClick = (word) => {
        setSearchTerm(word);
        searchWord(word);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            );
        }

        if (!result) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.placeholderText}>
                        Type a word to start searching...
                    </Text>
                </View>
            );
        }

        // Process result to merge multiple entries if needed, or just take the first one
        // The API returns an array. Usually we display info from the first entry or merge them.
        // For simplicity and clarity, we'll iterate over all entries returned.

        return (
            <ScrollView contentContainerStyle={styles.resultContainer}>
                {result.map((entry, index) => {
                    // Find the first audio available
                    const audioObj = entry.phonetics.find(
                        (p) => p.audio && p.audio !== ""
                    );
                    const audioUrl = audioObj ? audioObj.audio : null;

                    return (
                        <View key={index} style={styles.entryContainer}>
                            <View style={styles.wordHeader}>
                                <View>
                                    <Text style={styles.wordText}>{entry.word}</Text>
                                    <Text style={styles.phoneticText}>{entry.phonetic || (entry.phonetics[0] && entry.phonetics[0].text)}</Text>
                                </View>
                                {audioUrl && (
                                    <TouchableOpacity
                                        style={styles.audioButton}
                                        onPress={() => playAudio(audioUrl)}
                                    >
                                        <Ionicons name="volume-high" size={24} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {entry.meanings.map((meaning, mIndex) => (
                                <View key={mIndex} style={styles.meaningContainer}>
                                    <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>

                                    {/* Definitions */}
                                    {meaning.definitions.map((def, dIndex) => (
                                        <View key={dIndex} style={styles.definitionBox}>
                                            <Text style={styles.definitionText}>• {def.definition}</Text>
                                            {def.example && (
                                                <Text style={styles.exampleText}>"{def.example}"</Text>
                                            )}
                                        </View>
                                    ))}

                                    {/* Synonyms & Antonyms */}
                                    {meaning.synonyms.length > 0 && (
                                        <View style={styles.relatedGroup}>
                                            <Text style={styles.relatedLabel}>Synonyms:</Text>
                                            <View style={styles.chipContainer}>
                                                {meaning.synonyms.map((syn, sIndex) => (
                                                    <TouchableOpacity key={sIndex} onPress={() => handleRelatedWordClick(syn)} style={styles.chip}>
                                                        <Text style={styles.chipText}>{syn}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                    {meaning.antonyms.length > 0 && (
                                        <View style={styles.relatedGroup}>
                                            <Text style={styles.relatedLabel}>Antonyms:</Text>
                                            <View style={styles.chipContainer}>
                                                {meaning.antonyms.map((ant, aIndex) => (
                                                    <TouchableOpacity key={aIndex} onPress={() => handleRelatedWordClick(ant)} style={styles.chip}>
                                                        <Text style={styles.chipText}>{ant}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                </View>
                            ))}
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dictionary</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for a word..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onSubmitEditing={() => searchWord(searchTerm)}
                    returnKeyType="search"
                />
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => searchWord(searchTerm)}
                >
                    <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {renderContent()}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: "#fff",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.text,
    },
    searchContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    searchInput: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 16,
        color: "#333",
    },
    searchButton: {
        marginLeft: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        color: "red",
        fontSize: 16,
        textAlign: "center",
    },
    placeholderText: {
        color: "#888",
        fontSize: 16,
        fontStyle: "italic",
    },
    resultContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    entryContainer: {
        marginBottom: 30,
        backgroundColor: "#fff",
        borderRadius: 15,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    wordHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 10,
    },
    wordText: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.text,
        textTransform: 'capitalize',
    },
    phoneticText: {
        fontSize: 16,
        color: "#888",
        marginTop: 4,
    },
    audioButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    meaningContainer: {
        marginBottom: 20,
    },
    partOfSpeech: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.primary,
        marginBottom: 10,
        fontStyle: "italic",
    },
    definitionBox: {
        marginBottom: 10,
    },
    definitionText: {
        fontSize: 16,
        color: "#333",
        lineHeight: 24,
    },
    exampleText: {
        fontSize: 14,
        color: "#666",
        fontStyle: "italic",
        marginTop: 4,
        marginLeft: 15,
    },
    relatedGroup: {
        marginTop: 10,
    },
    relatedLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 5,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        backgroundColor: '#EFF6FF',
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    chipText: {
        color: '#1D4ED8',
        fontSize: 13,
    },
});
