export const MOCK_CONVERSATIONS = Array.from({ length: 50 }).map((_, i) => ({
  id: i.toString(),
  otherUserName: `User ${i + 1}`,
  otherUserImage: `https://i.pravatar.cc/150?u=${i}`,
  lastMessage: `This is a sample message for conversation ${i + 1}.`,
  lastMessageAt: new Date(Date.now() - i * 3600000).toISOString(),
}));
