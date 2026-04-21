import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import useAuthStore from "../../store/useAuthStore";
import useUserStore from "../../store/useUserStore";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../types/navigation";

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  subtitle: string;
  color: string;
  onPress?: () => void;
}

const SettingScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, logout } = useAuthStore();
  const { loginUser } = useUserStore();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Ready to take a break?", [
      { text: "Not yet", style: "cancel" },
      { text: "Sign Out", onPress: () => logout(), style: "destructive" },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfileScreen");
  };

  const accountItems: MenuItem[] = [
    {
      id: "1",
      title: "Edit Profile",
      icon: "👤",
      subtitle: "Customize your presence",
      color: "#4F46E5",
      onPress: handleEditProfile,
    },
    {
      id: "2",
      title: "Security",
      icon: "🔒",
      subtitle: "Password & 2FA",
      color: "#10B981",
    },
    {
      id: "3",
      title: "Privacy",
      icon: "🛡️",
      subtitle: "Visibility & data",
      color: "#F59E0B",
    },
  ];

  const preferenceItems: MenuItem[] = [
    {
      id: "4",
      title: "Notifications",
      icon: "🔔",
      subtitle: "Alerts & smart focus",
      color: "#EC4899",
    },
    {
      id: "5",
      title: "Appearance",
      icon: "✨",
      subtitle: "Dark mode & accents",
      color: "#8B5CF6",
    },
    {
      id: "6",
      title: "Data Sync",
      icon: "☁️",
      subtitle: "Cloud backup & restore",
      color: "#3B82F6",
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={item.onPress}
    >
      <View
        style={[
          styles.menuIconContainer,
          { backgroundColor: item.color + "15" },
        ]}
      >
        <Text style={styles.menuEmoji}>{item.icon}</Text>
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.chevronContainer}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchEmoji}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarGlow}>
              <View style={[styles.avatarContainer, { overflow: "hidden" }]}>
                {loginUser?.image ? (
                  <Image source={{ uri: loginUser.image }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {loginUser?.name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.nameDetails}>
              <Text style={styles.profileName}>
                {loginUser?.name ||
                  user?.user_metadata?.name ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>PRO MEMBER</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PERSONAL</Text>
          <View style={styles.card}>{accountItems.map(renderMenuItem)}</View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          <View style={styles.card}>{preferenceItems.map(renderMenuItem)}</View>
        </View>

        {/* Support Section */}
        <TouchableOpacity style={styles.supportCard}>
          <Text style={styles.supportEmoji}>💬</Text>
          <View style={styles.supportText}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportSubtitle}>
              Contact our 24/7 support team
            </Text>
          </View>
          <Text style={styles.supportArrow}>→</Text>
        </TouchableOpacity>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out from SupabaseTodo</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>v.1.2.4-stable • CodeAlchemy</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -1,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "silver",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchEmoji: {
    fontSize: 18,
  },
  profileCard: {
    padding: 24,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 15,
  },
  avatarGlow: {
    padding: 3,
    borderRadius: 35,
    backgroundColor: "#4F46E520",
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  nameDetails: {
    marginLeft: 18,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  profileEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    marginTop: 8,
    backgroundColor: "#F59E0B15",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#D97706",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  chevronContainer: {
    padding: 4,
  },
  chevron: {
    fontSize: 24,
    color: "#D1D5DB",
    fontWeight: "300",
  },
  supportCard: {
    margin: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    padding: 20,
    borderRadius: 24,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  supportEmoji: {
    fontSize: 28,
  },
  supportText: {
    flex: 1,
    marginLeft: 16,
  },
  supportTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  supportSubtitle: {
    color: "#C7D2FE",
    fontSize: 12,
    marginTop: 2,
  },
  supportArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  logoutButton: {
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700",
  },
  footerText: {
    textAlign: "center",
    marginTop: 24,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default SettingScreen;
