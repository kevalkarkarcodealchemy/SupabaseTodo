import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../types/navigation";
import { User } from "../../types";
import { supabase } from "../../services/supabaseClient";
import useGroupStore from "../../store/useGroupStore";
import useMessageStore from "../../store/useMessageStore";
import { BackIcon, GroupIcon, PersonIcon, SettingIcon } from "../../assets/svg";

interface Props {
  route: RouteProp<AppStackParamList, "ChatProfileScreen">;
  navigation: NativeStackNavigationProp<AppStackParamList, "ChatProfileScreen">;
}

const ChatProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    isGroup,
    recipientId,
    recipientName,
    recipientImage,
    conversationId,
    groupName,
  } = route.params as any;

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (isGroup && conversationId) {
          const members = await useGroupStore
            .getState()
            .fetchGroupMembers(conversationId);
          setGroupMembers(members);
        } else if (recipientId) {
          const { data, error } = await supabase
            .from("User")
            .select("*")
            .eq("id", recipientId)
            .single();

          if (!error && data) {
            setUserProfile(data as User);
          }
        }
      } catch (error) {
        console.error("[ChatProfile] load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isGroup, recipientId, conversationId]);

  const displayName = isGroup
    ? groupName || "Group"
    : userProfile?.name || recipientName || "User";

  const displayBio = isGroup
    ? `${groupMembers.length} members`
    : userProfile?.bio || "No bio yet";

  const displayEmail = userProfile?.email || "";

  const initial = displayName?.charAt(0)?.toUpperCase() || "?";

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [-80, 0],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all messages? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              if (isGroup && conversationId) {
                await useGroupStore.getState().clearChat(conversationId);
              } else if (conversationId) {
                await useMessageStore.getState().clearChat(conversationId);
              }
              Alert.alert("Success", "Chat cleared successfully", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error("[ChatProfile] Clear chat error:", error);
              Alert.alert("Error", "Failed to clear chat");
            }
          },
        },
      ],
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (isGroup && conversationId) {
                await useGroupStore.getState().deleteChat(conversationId);
              } else if (conversationId) {
                await useMessageStore.getState().deleteChat(conversationId);
              }
              Alert.alert("Success", "Chat deleted successfully", [
                {
                  text: "OK",
                  onPress: () =>
                    navigation.navigate("MainTabs", { screen: "Chat" }),
                },
              ]);
            } catch (error) {
              console.error("[ChatProfile] Delete chat error:", error);
              Alert.alert("Error", "Failed to delete chat");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Floating Header (Visible on Scroll) */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
            paddingTop: insets.top,
            height: 56 + insets.top,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerAction}
        >
          <BackIcon size={24} color="#008069" />
        </TouchableOpacity>
        <View style={styles.headerProfileInfo}>
          {isGroup ? (
            <View style={styles.headerAvatarSmall}>
              <GroupIcon size={20} color="#FFFFFF" />
            </View>
          ) : userProfile?.image ? (
            <Image
              source={{ uri: userProfile.image }}
              style={styles.headerAvatarSmall}
            />
          ) : (
            <View style={styles.headerAvatarSmall}>
              <PersonIcon size={20} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.headerNameText} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <SettingIcon size={24} color="#54656F" />
        </TouchableOpacity>
      </Animated.View>

      {/* Static Header (Initial State) */}
      <View style={[styles.staticHeader, { marginTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerAction}
        >
          <BackIcon size={24} color="#008069" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction}>
          <SettingIcon size={24} color="#54656F" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.imageContainer}>
            {isGroup ? (
              <View style={styles.largeAvatarPlaceholder}>
                <GroupIcon size={80} color="#FFFFFF" />
              </View>
            ) : userProfile?.image ? (
              <Image
                source={{ uri: userProfile.image }}
                style={styles.largeAvatar}
              />
            ) : (
              <View style={styles.largeAvatarPlaceholder}>
                <PersonIcon size={80} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileDetail}>
            {isGroup
              ? `${groupMembers.length} members`
              : userProfile?.email || ""}
          </Text>
          {!isGroup && <Text style={styles.profileBio}>~{displayName}</Text>}

          {/* Action Buttons */}
          <View style={styles.profileActions}>
            <View style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <PersonIcon size={24} color="#008069" />
              </View>
              <Text style={styles.actionText}>Call</Text>
            </View>
            <View style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <SettingIcon size={24} color="#008069" />
              </View>
              <Text style={styles.actionText}>Video</Text>
            </View>
            <View style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <SettingIcon size={24} color="#008069" />
              </View>
              <Text style={styles.actionText}>Save</Text>
            </View>
            <View style={styles.actionItem}>
              <View style={styles.actionIconContainer}>
                <SettingIcon size={24} color="#008069" />
              </View>
              <Text style={styles.actionText}>Search</Text>
            </View>
          </View>
        </View>

        {/* Info Section — 1-to-1 only */}
        {!isGroup && (
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {displayEmail}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  @{displayName.toLowerCase().replace(/\s+/g, "")}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setIsMuted(!isMuted)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionLabel}>Mute Notifications</Text>
              <View
                style={[
                  styles.toggleTrack,
                  isMuted && styles.toggleTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    isMuted && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.actionsCard, { marginTop: 12 }]}>
            <View style={styles.infoDivider} />
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleClearChat}
            >
              <Text style={styles.actionLabelDanger}>Clear Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleDeleteChat}
            >
              <Text style={styles.actionLabelDanger}>Delete Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow}>
              <Text style={styles.actionLabelDanger}>
                {isGroup ? "Leave Group" : "Block Contact"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isGroup && (
          <View style={styles.membersSection}>
            <Text style={styles.sectionHeader}>
              Members ({groupMembers.length})
            </Text>
            {groupMembers.map((member: User) => (
              <View key={member.id} style={styles.memberItem}>
                {member.image ? (
                  <Image
                    source={{ uri: member.image }}
                    style={styles.memberAvatar}
                  />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <PersonIcon size={18} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberBio} numberOfLines={1}>
                    {member.email}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  staticHeader: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    zIndex: 100,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerAction: {
    padding: 8,
  },
  headerProfileInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  headerAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#008069",
    justifyContent: "center",
    alignItems: "center",
  },
  headerNameText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#111B21",
    marginLeft: 12,
  },
  profileCard: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 8,
    borderBottomColor: "#F2F2F2",
  },
  imageContainer: {
    marginBottom: 16,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  largeAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#DFE5E7",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "400",
    color: "#111B21",
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 16,
    color: "#667781",
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: "#667781",
    fontStyle: "italic",
  },
  profileActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  actionItem: {
    alignItems: "center",
  },
  actionIconContainer: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: "#008069",
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  infoLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#4F46E5",
    fontWeight: "500",
    maxWidth: "55%",
    textAlign: "right",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 18,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  actionLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  actionLabelDanger: {
    fontSize: 15,
    color: "#EF4444",
    fontWeight: "500",
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleTrackActive: {
    backgroundColor: "#008069",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  membersSection: {
    paddingVertical: 12,
  },
  sectionHeader: {
    fontSize: 14,
    color: "#667781",
    fontWeight: "500",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DFE5E7",
    justifyContent: "center",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 16,
  },
  memberName: {
    fontSize: 16,
    color: "#111B21",
    fontWeight: "400",
  },
  memberBio: {
    fontSize: 13,
    color: "#667781",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatProfileScreen;
