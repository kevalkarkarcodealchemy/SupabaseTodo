import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../types/navigation";
import { User } from "../../types";
import { supabase } from "../../services/supabaseClient";
import useGroupStore from "../../store/useGroupStore";
import BackIcon from "../../assets/svg/BackIcon";
import GroupIcon from "../../assets/svg/GroupIcon";

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackIcon size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackIcon size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {isGroup ? (
            <View style={styles.groupAvatar}>
              <GroupIcon size={40} color="#FFFFFF" />
            </View>
          ) : (userProfile?.image &&
              userProfile?.image !== "EMPTY" &&
              userProfile?.image.trim() !== "") ||
            (recipientImage &&
              recipientImage !== "EMPTY" &&
              recipientImage.trim() !== "") ? (
            <Image
              source={{
                uri:
                  userProfile?.image && userProfile.image !== "EMPTY"
                    ? userProfile.image
                    : recipientImage,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}

          <Text style={styles.displayName}>{displayName}</Text>

          {!isGroup && (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          )}

          {/* Bio */}
          <Text style={styles.bioText}>{displayBio}</Text>
        </View>

        {/* Info Cards — 1-to-1 only */}
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

        {/* Group Members — Group only */}
        {isGroup && (
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>
              Members ({groupMembers.length})
            </Text>
            <View style={styles.membersCard}>
              {groupMembers.map((member, index) => (
                <View key={member.id}>
                  <View style={styles.memberRow}>
                    {member.image &&
                    member.image !== "EMPTY" &&
                    member.image.trim() !== "" ? (
                      <Image
                        source={{ uri: member.image }}
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberInitial}>
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberEmail} numberOfLines={1}>
                        {member.email}
                      </Text>
                    </View>
                  </View>
                  {index < groupMembers.length - 1 && (
                    <View style={styles.memberDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionRow}>
              <Text style={styles.actionLabel}>Mute Notifications</Text>
              <View style={styles.toggleTrack}>
                <View style={styles.toggleThumb} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.actionsCard, { marginTop: 12 }]}>
            <TouchableOpacity style={styles.actionRow}>
              <Text style={styles.actionLabelDanger}>
                {isGroup ? "Leave Group" : "Block Contact"}
              </Text>
            </TouchableOpacity>
            <View style={styles.infoDivider} />
            <TouchableOpacity style={styles.actionRow}>
              <Text style={styles.actionLabelDanger}>Delete Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Avatar Section */
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#E0E7FF",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#E0E7FF",
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#D1FAE5",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
  },
  displayName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginTop: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
  },
  bioText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 40,
    lineHeight: 22,
  },

  /* Info Section */
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
    elevation: 1,
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

  /* Members Section */
  membersSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    marginLeft: 4,
  },
  membersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  memberAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  memberInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  memberDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 74,
  },

  /* Actions Section */
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
    elevation: 1,
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
  },
});

export default ChatProfileScreen;
