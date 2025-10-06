import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Speech from "expo-speech";

type LanguageOption = {
  label: string;
  code: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: "English", code: "en" },
  { label: "Hindi", code: "hi" },
  { label: "Telugu", code: "te" },
  { label: "Tamil", code: "ta" },
  { label: "Kannada", code: "kn" },
  { label: "Malayalam", code: "ml" },
];

export default function App() {
  const [sourceLang, setSourceLang] = useState<string>("en");
  const [targetLang, setTargetLang] = useState<string>("hi");
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      Alert.alert("Enter text first");
      return;
    }
    setLoading(true);
    try {
      // Placeholder translation
      setTranslatedText(`(Pretend translation to ${targetLang})`);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vaani Connect</Text>
        <Text style={styles.subtitle}>Bridge for South Indian languages</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Picker
            selectedValue={sourceLang}
            onValueChange={(value) => setSourceLang(value)}
            style={styles.picker}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <Picker.Item key={lang.code} label={lang.label} value={lang.code} />
            ))}
          </Picker>

          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <Text style={styles.swapText}>⇄</Text>
          </TouchableOpacity>

          <Picker
            selectedValue={targetLang}
            onValueChange={(value) => setTargetLang(value)}
            style={styles.picker}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <Picker.Item key={lang.code} label={lang.label} value={lang.code} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Type text here"
          multiline
          value={inputText}
          onChangeText={setInputText}
        />

        <TouchableOpacity style={styles.button} onPress={handleTranslate}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Translate</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.speakButton}
          onPress={() => speak(translatedText, targetLang)}
        >
          <Text style={styles.buttonText}>Speak Translation</Text>
        </TouchableOpacity>

        <View style={styles.outputBox}>
          <Text style={styles.outputText}>
            {translatedText || "Translation will appear here"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: { backgroundColor: "#3b82f6", padding: 20 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#e0f2fe", marginTop: 4 },
  content: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  picker: { flex: 1, backgroundColor: "#fff", borderRadius: 8 },
  swapButton: {
    padding: 8,
    backgroundColor: "#2563eb",
    marginHorizontal: 8,
    borderRadius: 8,
  },
  swapText: { color: "#fff", fontSize: 18 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#1f2937",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  speakButton: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  outputBox: { backgroundColor: "#fff", borderRadius: 8, padding: 12, minHeight: 100 },
  outputText: { fontSize: 16 },
});
