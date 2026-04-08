import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import useAuthStore from "../../store/useAuthStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HomeScreen: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {isFocused && (
        <StatusBar
          barStyle="light-content"
          backgroundColor="#4F46E5"
          translucent={false}
        />
      )}

      {/* Top gradient-like header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Welcome Back!</Text>
        <Text style={styles.headerSubtitle}>
          You're successfully logged in.
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardEmoji}>🎉</Text>
          <Text style={styles.cardTitle}>You're all set!</Text>
          <Text style={styles.cardDescription}>
            Your authentication flow is working perfectly. This is your app's
            home screen — start building your features here.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>✅ Auth</Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>🔐 Zustand</Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>🧭 Navigation</Text>
          </View>
        </View>
      </View>

      {/* Logout button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#4F46E5",
    paddingBottom: 48,
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 24,
  },
  cardEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  infoBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4338CA",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4F46E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    color: "#4F46E5",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default HomeScreen;
