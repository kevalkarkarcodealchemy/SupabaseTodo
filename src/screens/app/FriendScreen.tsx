import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  CompositeNavigationProp,
  useIsFocused,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useUserStore from "../../store/useUserStore";
import useAuthStore from "../../store/useAuthStore";
import { TabParamList, AppStackParamList } from "../../types/navigation";
import { User } from "../../types";
import GroupIcon from "../../assets/svg/GroupIcon";

type FriendScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Friend">,
  NativeStackNavigationProp<AppStackParamList>
>;

interface Props {
  navigation: FriendScreenNavigationProp;
}

const FriendScreen: React.FC<Props> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { user: currentUser } = useAuthStore();
  const { users, isLoading, fetchUsers, subscribeToUsers } = useUserStore();

  useEffect(() => {
    fetchUsers();

    const unsubscribe = subscribeToUsers();
    return () => unsubscribe();
  }, [fetchUsers, subscribeToUsers]);

  const getAvatarColor = (name: string | undefined): string => {
    const colors = [
      "#4F46E5",
      "#7C3AED",
      "#EC4899",
      "#EF4444",
      "#F59E0B",
      "#10B981",
      "#06B6D4",
    ];
    if (!name) return colors[0];
    const index = name.length % colors.length;
    return colors[index];
  };

  const renderUserItem = ({ item }: { item: User }) => {
    if (item.id === currentUser?.id) return null;
    const handlePress = () => {
      navigation.navigate("MessageScreen", {
        recipientId: item.id,
        recipientName: item.name,
        recipientImage: item.image,
      });
    };

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <View style={styles.avatarContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: getAvatarColor(item.name) },
              ]}
            >
              <Text style={styles.avatarInitial}>
                {item.name ? item.name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>
        <View style={styles.userInfo}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.userName}>{item.name || "Anonymous User"}</Text>
          </View>
          <Text style={styles.userBio} numberOfLines={1}>
            {item.bio || "New member at SupabaseTodo"}
          </Text>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emoji}>👥</Text>
      <Text style={styles.title}>No People Found</Text>
      <Text style={styles.subtitle}>
        When new users join, they'll appear here automatically in real-time.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Friends</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} people online
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("CreateGroupScreen")}
          >
            <GroupIcon size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Text style={styles.headerActionText}>Find</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#4F46E5" />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginRight: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
  },
  headerAction: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 15,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E5E7EB",
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  userBio: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },
  actionButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 13,
  },
  emptyState: {
    marginTop: 100,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default FriendScreen;
