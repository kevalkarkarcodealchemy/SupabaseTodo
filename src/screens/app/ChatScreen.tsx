import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useAuthStore from "../../store/useAuthStore";
import useChatListStore from "../../store/useChatListStore";
import { AppStackParamList } from "../../types/navigation";
import { ConversationWithUser } from "../../types";

interface Props {
  navigation: NativeStackNavigationProp<AppStackParamList>;
}

const formatTime = (isoString: string | null): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ChatCard: React.FC<{
  item: ConversationWithUser;
  onPress: (item: ConversationWithUser) => void;
}> = ({ item, onPress }) => {
  const initial = item.otherUserName?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {item.otherUserImage ? (
        <Image source={{ uri: item.otherUserImage }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.otherUserName}
          </Text>
          <Text style={styles.timeLabel}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage ?? ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { user: currentUser } = useAuthStore();
  const {
    conversations,
    isLoading,
    fetchConversations,
    subscribeToConversations,
  } = useChatListStore();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter((conv) =>
      conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [conversations, searchQuery]);

  // Real-time subscription on mount
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubscribe = subscribeToConversations(currentUser.id);
    return () => unsubscribe();
  }, [currentUser?.id, subscribeToConversations]);

  // Re-fetch on focus to catch any missed updates or navigation returns
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        fetchConversations(currentUser.id);
      }
    }, [currentUser?.id, fetchConversations]),
  );

  const handleRefresh = useCallback(() => {
    if (currentUser?.id) fetchConversations(currentUser.id);
  }, [currentUser?.id, fetchConversations]);

  const handleCardPress = (item: ConversationWithUser) => {
    navigation.navigate("MessageScreen", {
      recipientId: item.otherUserId,
      recipientName: item.otherUserName,
      recipientImage: item.otherUserImage ?? undefined,
    } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {isFocused && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {isLoading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatCard item={item} onPress={handleCardPress} />
          )}
          contentContainerStyle={
            filteredConversations.length === 0
              ? styles.listEmpty
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>{searchQuery ? "🔍" : "💬"}</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No results found" : "No conversations yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `We couldn't find any chats matching "${searchQuery}"`
                  : "Start chatting with a friend from the People tab."}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  searchContainer: {
    marginTop: 12,
  },
  searchInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { backgroundColor: "#F9FAFB" },
  listEmpty: { flex: 1, backgroundColor: "#F9FAFB" },
  separator: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 84 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarInitial: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  cardBody: { flex: 1 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  userName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  timeLabel: { fontSize: 12, color: "#9CA3AF" },
  lastMessage: { fontSize: 14, color: "#6B7280" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 15, color: "#6B7280", textAlign: "center" },
});

export default ChatScreen;
