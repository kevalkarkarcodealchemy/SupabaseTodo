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
  StatusBar,
  Alert,
  Pressable,
  Modal,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useAuthStore from "../../store/useAuthStore";
import useMessageStore from "../../store/useMessageStore";
import useGroupStore from "../../store/useGroupStore";
import { AppStackParamList } from "../../types/navigation";
import { Message, User } from "../../types";
import {
  GroupIcon,
  BackIcon,
  PersonIcon,
  EditIcon,
  DeleteIcon,
} from "../../assets/svg";

interface Props {
  route: RouteProp<AppStackParamList, "MessageScreen">;
  navigation: NativeStackNavigationProp<AppStackParamList, "MessageScreen">;
}

const MessageScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    recipientId,
    recipientName,
    recipientImage,
    isGroup,
    conversationId: groupConvId,
    groupName,
  } = route.params as any;
  const { user: currentUser } = useAuthStore();

  // 1-to-1 Store
  const p2pStore = useMessageStore();
  // Group Store
  const groupStore = useGroupStore();
  // Unified accessors
  const messages = isGroup ? groupStore.messages : p2pStore.messages;
  const isLoading = isGroup ? groupStore.isLoading : p2pStore.isLoading;
  const messageConvId = p2pStore.conversationId;

  const [text, setText] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const closeActionMenu = () => {
    setSelectedMessageId(null);
    setModalPosition(null);
  };

  const selectedMessage = messages.find(
    (message) => String(message.id) === String(selectedMessageId),
  );

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isGroup) {
      if (groupConvId) {
        groupStore.fetchGroupMessages(groupConvId);
        groupStore.fetchGroupMembers(groupConvId).then(setGroupMembers);
      }
    } else if (currentUser?.id && recipientId) {
      p2pStore.fetchMessages(currentUser.id, recipientId);
    }

    return () => {
      if (isGroup) {
        useGroupStore.setState({ conversationId: null, messages: [] });
      } else {
        useMessageStore.setState({ conversationId: null, messages: [] });
      }
    };
  }, [currentUser?.id, recipientId, groupConvId, isGroup]);

  useEffect(() => {
    if (isGroup) {
      if (!groupConvId) return;
      const unsubscribe = groupStore.subscribeToGroupMessages(groupConvId);
      return () => unsubscribe();
    } else {
      if (!currentUser?.id || !recipientId) return;
      const unsubscribe = p2pStore.subscribeToMessages(
        currentUser.id,
        recipientId,
      );
      return () => unsubscribe();
    }
  }, [currentUser?.id, recipientId, groupConvId, isGroup]);

  useEffect(() => {
    if (selectedMessageId && !selectedMessage) {
      setSelectedMessageId(null);
    }
  }, [selectedMessageId, selectedMessage]);

  const handleSend = async () => {
    if (text.trim() === "" || !currentUser?.id) return;
    const content = text;
    const isEditing = !!editingMessageId;

    try {
      if (isEditing && editingMessageId) {
        if (isGroup) {
          await groupStore.updateMessage(editingMessageId, content);
        } else {
          await p2pStore.updateMessage(editingMessageId, content);
        }
        setEditingMessageId(null);
      } else {
        if (isGroup) {
          if (groupConvId)
            await groupStore.sendGroupMessage(
              groupConvId,
              currentUser.id,
              content,
            );
        } else {
          await p2pStore.sendMessage(currentUser.id, recipientId, content);
        }
      }
      setText("");
    } catch (error) {
      console.error("Failed to process message:", error);
    }
  };

  const handleDelete = async (messageId: string) => {
    Alert.alert("Delete Message", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (isGroup) {
              await groupStore.deleteMessage(messageId);
            } else {
              await p2pStore.deleteMessage(messageId);
            }
            setSelectedMessageId(null);
          } catch (error) {
            console.error("Failed to delete message:", error);
          }
        },
      },
    ]);
  };

  const handleStartEdit = () => {
    if (!selectedMessage) return;
    setEditingMessageId(selectedMessage.id);
    setText(selectedMessage.content);
    closeActionMenu();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUser?.id;
    const isSelected = selectedMessageId
      ? String(selectedMessageId) === String(item.id)
      : false;

    const handleLongPress = (event: any) => {
      if (isMe) {
        event.target.measure(
          (
            fx: number,
            fy: number,
            width: number,
            height: number,
            px: number,
            py: number,
          ) => {
            setModalPosition({
              top: py + height + 6,
              left: px + width - 180,
            });
          },
        );
        setSelectedMessageId(item.id);
      }
    };

    const senderName = isGroup
      ? groupMembers.find((m) => m.id === item.sender_id)?.name || "User"
      : null;

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.myRow : styles.otherRow,
          isSelected && styles.selectedMessageRow,
        ]}
      >
        <View
          style={
            isMe ? styles.myMessageContainer : styles.otherMessageContainer
          }
        >
          {isGroup && !isMe && (
            <Text style={styles.groupSenderName}>{senderName}</Text>
          )}

          {/* Message bubble */}
          <Pressable
            onPress={closeActionMenu}
            onLongPress={handleLongPress}
            delayLongPress={250}
            disabled={!isMe}
            style={({ pressed }) => [
              styles.bubble,
              isMe ? styles.myBubble : styles.otherBubble,
              isSelected && styles.selectedBubble,
              !isSelected && pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMe ? styles.myText : styles.otherText,
              ]}
            >
              {item.content}
            </Text>

            <View style={styles.messageFooter}>
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
          </Pressable>
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
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerUserInfo}
          onPress={() => {
            navigation.navigate("ChatProfileScreen", {
              isGroup: !!isGroup,
              recipientId: recipientId,
              recipientName: recipientName,
              recipientImage: recipientImage,
              conversationId: isGroup ? groupConvId : messageConvId,
              groupName: isGroup ? groupName : undefined,
            });
          }}
        >
          {isGroup ? (
            <View style={styles.headerAvatarPlaceholder}>
              <GroupIcon size={20} color="#FFFFFF" />
            </View>
          ) : recipientImage &&
            recipientImage !== "EMPTY" &&
            recipientImage.trim() !== "" ? (
            <Image
              source={{ uri: recipientImage }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <PersonIcon size={20} color="#FFFFFF" />
            </View>
          )}
          <View>
            <Text style={styles.headerName}>
              {isGroup ? groupName : recipientName || "User"}
            </Text>
            <Text style={styles.headerStatus}>
              {isGroup ? `${groupMembers.length} members` : "Online"}
            </Text>
          </View>
        </TouchableOpacity>
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
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContainer}
            inverted
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            onScrollBeginDrag={closeActionMenu}
          />
        )}

        {editingMessageId ? (
          <View style={styles.editingBanner}>
            <Text style={styles.editingText}>Editing message</Text>
            <TouchableOpacity
              onPress={() => {
                setEditingMessageId(null);
                setText("");
              }}
            >
              <Text style={styles.cancelEditingText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputArea}>
          <TextInput
            ref={inputRef}
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
            <Text style={styles.sendButtonIcon}>
              {editingMessageId ? "✓" : "↑"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={!!selectedMessageId}
        transparent
        animationType="fade"
        onRequestClose={closeActionMenu}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeActionMenu}>
          {modalPosition && (
            <View
              style={[
                styles.iosActionModal,
                {
                  position: "absolute",
                  top: modalPosition.top,
                  left: modalPosition.left,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.iosActionButton}
                onPress={handleStartEdit}
              >
                <EditIcon size={20} color="#4B5563" />
                <Text style={styles.iosActionLabel}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.iosDivider} />
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.iosActionButton}
                onPress={() => {
                  if (!selectedMessageId) return;
                  closeActionMenu();
                  handleDelete(selectedMessageId);
                }}
              >
                <DeleteIcon size={20} color="#EF4444" />
                <Text style={styles.iosDeleteLabel}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>
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
    flex: 1,
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
    paddingVertical: 20,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    width: "100%",
  },
  selectedMessageRow: {
    zIndex: 2,
  },
  myRow: {
    justifyContent: "flex-end",
  },
  otherRow: {
    justifyContent: "flex-start",
  },
  myMessageContainer: {
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
    maxWidth: "85%",
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  selectedBubble: {
    opacity: 0.85,
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
    paddingBottom: Platform.OS === "ios" ? 7 : 15,
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
  // iOS-style action modal
  iosActionModal: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingVertical: 0,
    width: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(180,180,180,0.13)",
  },
  iosActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "transparent",
    gap: 12,
  },
  iosActionLabel: {
    fontSize: 16,
    color: "#222",
    fontWeight: "500",
  },
  iosDeleteLabel: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "500",
  },
  iosDivider: {
    height: 1,
    backgroundColor: "#F1F1F1",
    marginHorizontal: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  actionButtonDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginHorizontal: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 8,
  },
  actionLabel: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteActionLabel: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  groupSenderName: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
    marginLeft: 4,
    fontWeight: "600",
  },
  editingBanner: {
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  editingText: {
    fontSize: 15,
    color: "#4F46E5",
    fontWeight: "600",
  },
  cancelEditingText: {
    fontSize: 15,
    color: "#EF4444",
    fontWeight: "600",
  },
});

export default MessageScreen;
