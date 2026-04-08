import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useUserStore from "../../store/useUserStore";
import useAuthStore from "../../store/useAuthStore";
import useGroupStore from "../../store/useGroupStore";
import { AppStackParamList } from "../../types/navigation";
import BackIcon from "../../assets/svg/BackIcon";

interface Props {
  navigation: NativeStackNavigationProp<AppStackParamList>;
}

const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
  const { user: currentUser } = useAuthStore();
  const { users, fetchUsers } = useUserStore();
  const { createGroup, isLoading } = useGroupStore();

  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserSelection = (id: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedUserIds(newSelection);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }
    if (selectedUserIds.size === 0) {
      Alert.alert("Error", "Please select at least one member");
      return;
    }
    if (!currentUser?.id) return;

    try {
      const convId = await createGroup(
        groupName.trim(),
        Array.from(selectedUserIds),
        currentUser.id
      );
      
      navigation.replace("MessageScreen", {
        isGroup: true,
        conversationId: convId,
        groupName: groupName.trim(),
      } as any);
    } catch (error: any) {
      Alert.alert("Error creating group", error.message || "Something went wrong");
    }
  };

  const filteredUsers = users.filter((u) => u.id !== currentUser?.id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <TouchableOpacity 
          style={[styles.createButton, (!groupName.trim() || selectedUserIds.size === 0) && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || selectedUserIds.size === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Group Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter group name..."
          placeholderTextColor="#9CA3AF"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      <Text style={styles.sectionTitle}>Select Members ({selectedUserIds.size})</Text>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedUserIds.has(item.id);
          return (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => toggleUserSelection(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.userInfo}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{item.name?.charAt(0).toUpperCase() || "?"}</Text>
                  </View>
                )}
                <Text style={styles.userName}>{item.name}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: { marginRight: 16 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: "#111827" },
  createButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  createButtonDisabled: { backgroundColor: "#9CA3AF" },
  createButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  inputContainer: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#4B5563", marginBottom: 8 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarInitial: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  userName: { fontSize: 16, fontWeight: "500", color: "#111827" },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
});

export default CreateGroupScreen;
