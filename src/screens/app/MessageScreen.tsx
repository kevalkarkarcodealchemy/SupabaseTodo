import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useAuthStore from '../../store/useAuthStore';
import useMessageStore from '../../store/useMessageStore';
import { AppStackParamList } from '../../types/navigation';
import { Message } from '../../types';

interface Props {
  route: RouteProp<AppStackParamList, 'MessageScreen'>;
  navigation: NativeStackNavigationProp<AppStackParamList, 'MessageScreen'>;
}

const MessageScreen: React.FC<Props> = ({route, navigation}) => {
  const {recipientId, recipientName, recipientImage} = route.params as any;
  const {user: currentUser} = useAuthStore();
  const {messages, isLoading, fetchMessages, sendMessage, subscribeToMessages} =
    useMessageStore();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (currentUser?.id && recipientId) {
      fetchMessages(currentUser.id, recipientId);
      const unsubscribe = subscribeToMessages(currentUser.id, recipientId);
      return () => unsubscribe();
    }
  }, [currentUser?.id, recipientId, fetchMessages, subscribeToMessages]);

  const handleSend = async () => {
    if (text.trim() === '' || !currentUser?.id) return;
    const content = text;
    setText('');
    try {
      await sendMessage(currentUser.id, recipientId, content);
      // Success—local state will update via realtime
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderMessageItem = ({item}: {item: Message}) => {
    const isMe = item.sender_id === currentUser?.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
        <View
          style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myText : styles.otherText,
            ]}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isMe ? styles.myTimestamp : styles.otherTimestamp,
            ]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerUserInfo}>
          {recipientImage ? (
            <Image
              source={{uri: recipientImage}}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerInitial}>
                {recipientName ? recipientName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{recipientName || 'User'}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
      </View>

      {/* Message List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContainer}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({animated: true})
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
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
              text.trim() === '' && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={text.trim() === ''}>
            <Text style={styles.sendButtonIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonIcon: {
    fontSize: 24,
    color: '#4F46E5',
    fontWeight: '600',
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#9CA3AF',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});

export default MessageScreen;
