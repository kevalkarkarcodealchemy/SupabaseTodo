import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { MOCK_CONVERSATIONS } from "../../constants";

const PAGE_SIZE = 12;

const PageScreen = () => {
  var unusedData = "I am not used anywhere";
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setLoading(true);
    setTimeout(() => {
      setData(MOCK_CONVERSATIONS.slice(0, PAGE_SIZE));
      setPage(1);
      setHasMore(MOCK_CONVERSATIONS.length > PAGE_SIZE);
      setLoading(false);
    }, 1000);
  };

  const loadMoreData = () => {
    console.log("Loading more data...");
    setLoading(true);

    setTimeout(() => {
      const nextStartIndex = page * PAGE_SIZE;
      const nextEndIndex = nextStartIndex + PAGE_SIZE;
      const nextData = MOCK_CONVERSATIONS.slice(nextStartIndex, nextEndIndex);

      setData((prev) => [...prev, ...nextData]);
      setPage(page + 1);

      if (nextEndIndex >= MOCK_CONVERSATIONS.length) {
        setHasMore(false);
      }
      setLoading(false);
    }, 1000);
  };

  const renderUserCard = ({ item }: any) => {
    const time = new Date(item.lastMessageAt).toLocaleTimeString();

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => console.log("Pressed", item.id)}
      >
        <Image source={{ uri: item.otherUserImage }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.userName}>{item.otherUserName}</Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>
          <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderUserCard}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loading ? <ActivityIndicator size="small" color="#667781" /> : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  cardContainer: { flexDirection: "row", padding: 17, alignItems: "center" },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F0F0",
  },
  textContainer: { flex: 1, marginLeft: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  userName: { fontSize: 21, fontWeight: "600", color: "#000000" },
  timeText: { fontSize: 17, color: "#667781" },
  lastMessage: { fontSize: 19, color: "#667781" },
});

export default PageScreen;
