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

// const PAGE_SIZE = 12;

const PageScreen = () => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadInitialData();

    const intervalId = setInterval(() => {
      console.log("Checking for updates...");
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const loadInitialData = () => {
    setLoading(true);
    setTimeout(() => {
      setData(MOCK_CONVERSATIONS.slice(0, 12));
      setPage(1);
      setHasMore(MOCK_CONVERSATIONS.length > 12);
      setLoading(false);
    }, 1000);
  };

  const loadMoreData = () => {
    console.log("Loading more data...");
    setLoading(true);
    setTimeout(() => {
      const nextStartIndex = page * 12;
      const nextEndIndex = nextStartIndex + 12;
      const nextData = MOCK_CONVERSATIONS.slice(nextStartIndex, nextEndIndex);

      setData((prev) => [...prev, ...nextData]);
      setPage((prev) => prev + 1);

      if (nextEndIndex >= MOCK_CONVERSATIONS.length) {
        setHasMore(false);
      }
      setLoading(false);
    }, 1000);
  };
  const renderUserCard = ({
    item,
  }: {
    item: (typeof MOCK_CONVERSATIONS)[0];
  }) => {
    const time = new Date(item.lastMessageAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <TouchableOpacity style={styles.cardContainer} activeOpacity={0.7}>
        <Image source={{ uri: item.otherUserImage }} style={styles.avatar} />

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.otherUserName}
            </Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>

          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#667781" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderUserCard}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingVertical: 13,
  },
  cardContainer: {
    flexDirection: "row",
    paddingHorizontal: 21,
    paddingVertical: 17,
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F0F0",
  },
  textContainer: {
    flex: 1,
    marginLeft: 20,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  userName: {
    fontSize: 21,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    marginRight: 15,
  },
  timeText: {
    fontSize: 17,
    color: "#667781",
  },
  lastMessage: {
    fontSize: 19,
    color: "#667781",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E9EDEF",
    marginLeft: 101, // 21 (padding) + 60 (avatar) + 20 (margin)
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PageScreen;
