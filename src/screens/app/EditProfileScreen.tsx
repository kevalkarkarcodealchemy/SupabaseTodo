import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import useAuthStore from "../../store/useAuthStore";
import useUserStore from "../../store/useUserStore";
import BackIcon from "../../assets/svg/BackIcon";

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { loginUser, updateProfile } = useUserStore();
  const [name, setName] = useState(loginUser?.name || "");
  const [bio, setBio] = useState(loginUser?.bio || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    // Validation: Check if values have actually changed
    if (name.trim() === loginUser?.name && bio.trim() === loginUser?.bio) {
      navigation.goBack();
      return;
    }

    if (!name.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      if (loginUser?.id) {
        await updateProfile(loginUser.id, name.trim(), bio.trim());
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to update profile: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackIcon size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarInitial}>
                {loginUser?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.changePhotoBtn}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Email (Cannot be changed)</Text>
              <Text style={styles.infoText}>{user?.email}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
  },
  changePhotoBtn: {
    padding: 8,
  },
  changePhotoText: {
    color: "#4F46E5",
    fontWeight: "600",
    fontSize: 14,
  },
  form: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  infoSection: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
});

export default EditProfileScreen;
