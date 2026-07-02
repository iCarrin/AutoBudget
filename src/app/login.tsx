import { useState } from "react";
import { StyleSheet, StatusBar, View, Text, TextInput, Pressable } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  function handleLogin() {
    if (!username || !password) {
      setLoginError("Please enter your username and password.");
      return;
    }
    setLoginError("");
    router.replace("/");
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.loginScreen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Budget</Text>
          <View style={styles.loginCard}>
            <TextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              onSubmitEditing={handleLogin}
              autoCapitalize="none"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={colors.mutedForeground}
              style={styles.input}
            />
            {loginError ? <Text style={styles.loginError}>{loginError}</Text> : null}
            <Pressable style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loginScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  loginContainer: { width: "100%", maxWidth: 300 },
  loginTitle: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 24,
  },
  loginCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 14,
  },
  loginError: { fontSize: 11, color: colors.destructive, marginTop: -4 },
  input: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    color: colors.foreground,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 2,
  },
  primaryButtonText: { fontSize: 13, fontWeight: "500", color: colors.primaryForeground },
});
