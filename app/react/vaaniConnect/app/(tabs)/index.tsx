import * as Speech from "expo-speech";
import React, { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Clipboard from "expo-clipboard";

type LanguageOption = {
  label: string;
  code: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: "English", code: "en" },
  { label: "हिन्दी (Hindi)", code: "hi" },
  { label: "తెలుగు (Telugu)", code: "te" },
  { label: "தமிழ் (Tamil)", code: "ta" },
  { label: "ಕನ್ನಡ (Kannada)", code: "kn" },
  { label: "മലയാളം (Malayalam)", code: "ml" },
];

export default function App() {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");
  const [speaker1Text, setSpeaker1Text] = useState("");
  const [speaker2Text, setSpeaker2Text] = useState("");
  const [conversation, setConversation] = useState<
    Array<{ speaker: string; text: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const translateText = async (text: string, from: string, to: string) => {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    const data = await response.json();
    return data[0][0][0];
  };

  // Speech recognition state
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const recordSpeechToText = async (
    setText: (t: string) => void,
    lang: string
  ) => {
    if (Platform.OS !== "web") {
      Alert.alert("Speech recognition is only available on web in this build");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert("Speech recognition not supported in this browser");
      return;
    }

    // If already listening, stop it
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      Alert.alert("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (error: any) {
      console.error("Speech recognition failed to start:", error);
      Alert.alert("Speech recognition failed", error.message || String(error));
    }
  };

  const handleTranslateSpeaker1 = async () => {
    if (!speaker1Text.trim()) {
      Alert.alert("Enter text for Speaker 1 first");
      return;
    }
    setLoading(true);
    try {
      const translated = await translateText(speaker1Text, sourceLang, targetLang);
      setConversation((prev) => [
        ...prev,
        { speaker: "Speaker 1", text: translated },
      ]);
    } catch (err: any) {
      Alert.alert("Translation error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateSpeaker2 = async () => {
    if (!speaker2Text.trim()) {
      Alert.alert("Enter text for Speaker 2 first");
      return;
    }
    setLoading(true);
    try {
      const translated = await translateText(speaker2Text, targetLang, sourceLang);
      setConversation((prev) => [
        ...prev,
        { speaker: "Speaker 2", text: translated },
      ]);
    } catch (err: any) {
      Alert.alert("Translation error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const speak = (text: string, lang: string) => {
    if (!text) return;
    Speech.speak(text, { language: lang });
  };

  const handleCopyConversation = async () => {
    if (conversation.length === 0) {
      Alert.alert("Nothing to copy");
      return;
    }
    const text = conversation.map((c) => `${c.speaker}: ${c.text}`).join("\n\n");
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied conversation to clipboard");
    } catch (err: any) {
      Alert.alert("Copy failed", err.message || String(err));
    }
  };

  // 🧹 NEW: Clear conversation
  const handleClearConversation = () => {
    if (conversation.length === 0) {
      Alert.alert("Conversation is already empty");
      return;
    }
    Alert.alert("Clear Conversation", "Are you sure you want to clear it?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => setConversation([]),
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>vaani connect</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.speakersContainer}>
          {/* Speaker 1 */}
          <View style={[styles.speakerCard, { borderColor: "#3b82f6" }]}>
            <Text style={styles.speakerTitle}>Speaker 1</Text>
            <Text style={styles.label}>Language</Text>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={sourceLang}
                onValueChange={(value) => setSourceLang(value)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Picker.Item
                    key={lang.code}
                    label={lang.label}
                    value={lang.code}
                    color={Platform.OS === "android" ? "#000" : "#fff"}
                  />
                ))}
              </Picker>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Type message..."
              placeholderTextColor="#94a3b8"
              value={speaker1Text}
              onChangeText={setSpeaker1Text}
              multiline
            />

            <TouchableOpacity
              style={[styles.speakButton, isListening && { backgroundColor: "#2d0ba9" }]}
              onPress={() => recordSpeechToText(setSpeaker1Text, sourceLang)}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.speakText}>
                  {isListening ? "Listening..." : "Speak"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.translateButton}
              onPress={handleTranslateSpeaker1}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.translateText}>▶ Translate</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Swap icon */}
          <TouchableOpacity style={styles.swapCircle} onPress={handleSwap}>
            <Text style={styles.swapText}>⇄</Text>
          </TouchableOpacity>

          {/* Speaker 2 */}
          <View style={[styles.speakerCard, { borderColor: "#f59e0b" }]}>
            <Text style={styles.speakerTitle}>Speaker 2</Text>
            <Text style={styles.label}>Language</Text>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={targetLang}
                onValueChange={(value) => setTargetLang(value)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Picker.Item
                    key={lang.code}
                    label={lang.label}
                    value={lang.code}
                    color={Platform.OS === "android" ? "#000" : "#fff"}
                  />
                ))}
              </Picker>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Type message..."
              placeholderTextColor="#94a3b8"
              value={speaker2Text}
              onChangeText={setSpeaker2Text}
              multiline
            />

            <TouchableOpacity
              style={[styles.speakButton, isListening && { backgroundColor: "#2d0ba9" }]}
              onPress={() => recordSpeechToText(setSpeaker2Text, targetLang)}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.speakText}>
                  {isListening ? "Listening..." : "Speak"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.translateButton}
              onPress={handleTranslateSpeaker2}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.translateText}>▶ Translate</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Conversation Area */}
        <View style={styles.conversationContainer}>
          <Text style={styles.conversationTitle}>Conversation</Text>
          <View style={styles.conversationBox}>
            {conversation.length === 0 ? (
              <Text style={styles.placeholderText}>
                Start a conversation by typing or speaking.
              </Text>
            ) : (
              conversation.map((c, i) => {
                const isSpeaker1 = c.speaker === "Speaker 1";
                const color = isSpeaker1 ? "#3b82f6" : "#f59e0b";
                const bubbleBg = isSpeaker1 ? "#3b82f633" : "#f59e0b33";
                return (
                  <View key={i} style={{ marginBottom: 8 }}>
                    <Text style={[styles.conversationSpeaker, { color }]}>
                      {c.speaker}:
                    </Text>
                    <View
                      style={[
                        styles.conversationBubble,
                        { backgroundColor: bubbleBg, borderColor: color },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          Speech.speak(c.text, {
                            language:
                              c.speaker === "Speaker 1"
                                ? sourceLang
                                : targetLang,
                          })
                        }
                      >
                        <Text style={styles.conversationEntry}>{c.text}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Bottom Buttons */}
          <View style={styles.bottomButtons}>
            {/* 🗑 Clear Button */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearConversation}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bottomButtonText}>Clear</Text>
            </TouchableOpacity>

            {/* 📋 Copy Button */}
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyConversation}
            >
              <Ionicons name="copy-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.bottomButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    backgroundColor: "#4002e9",
    padding: 10,
    alignItems: "center",
  },
  headerText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  scrollContent: { padding: 16 },
  speakersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  speakerCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 250,
  },
  speakerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  label: { color: "#cbd5e1", fontSize: 14, marginBottom: 4 },
  pickerWrapper: {
    backgroundColor: "#334155",
    borderRadius: 8,
    marginBottom: 12,
  },
  picker: { color: "#fff" },
  input: {
    backgroundColor: "#334155",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  translateButton: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  translateText: { color: "#fff", fontWeight: "600" },
  speakButton: {
    backgroundColor: "#4002e9",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  speakText: { color: "#fff", fontWeight: "600" },
  swapCircle: {
    backgroundColor: "#334155",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    marginTop: 100,
  },
  swapText: { color: "#fff", fontSize: 18 },
  conversationContainer: {
    marginTop: 20,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
  },
  conversationTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  conversationBox: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    minHeight: 120,
    justifyContent: "center",
    padding: 10,
  },
  placeholderText: { color: "#94a3b8", textAlign: "center" },
  conversationSpeaker: { fontWeight: "700" },
  conversationEntry: { color: "#fff" },
  conversationBubble: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  clearButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  copyButton: {
    backgroundColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  bottomButtonText: { color: "#fff", fontWeight: "600" },
});
