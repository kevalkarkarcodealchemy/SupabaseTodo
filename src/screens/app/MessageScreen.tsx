import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useAuthStore from "../../store/useAuthStore";
import useMessageStore from "../../store/useMessageStore";
import { AppStackParamList } from "../../types/navigation";
import { Message } from "../../types";
import BackIcon from "../../assets/svg/BackIcon";

interface Props {
  route: RouteProp<AppStackParamList, "MessageScreen">;
  navigation: NativeStackNavigationProp<AppStackParamList, "MessageScreen">;
}

const MessageScreen: React.FC<Props> = ({ route, navigation }) => {
  const { recipientId, recipientName, recipientImage } = route.params as any;
  const { user: currentUser } = useAuthStore();
  const {
    messages,
    conversationId,
    isLoading,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
  } = useMessageStore();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (currentUser?.id && recipientId) {
      fetchMessages(currentUser.id, recipientId);
    }
    return () => {
      useMessageStore.setState({ conversationId: null, messages: [] });
    };
  }, [currentUser?.id, recipientId]);

  // Step 2 — Subscribe to realtime
  useEffect(() => {
    if (!currentUser?.id || !recipientId) return;
    const unsubscribe = subscribeToMessages(currentUser.id, recipientId);
    return () => unsubscribe();
  }, [currentUser?.id, recipientId, subscribeToMessages]);

  const handleSend = async () => {
    if (text.trim() === "" || !currentUser?.id) return;
    const content = text;
    setText("");
    try {
      await sendMessage(currentUser.id, recipientId, content);
      // Success—local state will update via realtime
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUser?.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
        <View
          style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myText : styles.otherText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isMe ? styles.myTimestamp : styles.otherTimestamp,
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackIcon size={28} />
        </TouchableOpacity>
        <View style={styles.headerUserInfo}>
          {recipientImage ? (
            <Image
              source={{ uri: recipientImage }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerInitial}>
                {recipientName ? recipientName.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{recipientName || "User"}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 10}
      >
        {/* Message List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContainer}
            inverted
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              text.trim() === "" && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={text.trim() === ""}
          >
            <Text style={styles.sendButtonIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    paddingRight: 16,
  },
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerInitial: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  headerStatus: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    width: "100%",
  },
  myRow: {
    justifyContent: "flex-end",
  },
  otherRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#d6dbd4",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myText: {
    color: "#FFFFFF",
  },
  otherText: {
    color: "black",
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTimestamp: {
    color: "#9CA3AF",
  },
  inputArea: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 20,
    paddingLeft: 10,
    // borderWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 7 : 15,
    // backgroundColor: "#c71616ff",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#e9e9eaff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  sendButtonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
});

export default MessageScreen;
