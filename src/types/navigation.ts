import { NavigatorScreenParams } from "@react-navigation/native";
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  MessageScreen: {
    isGroup?: boolean;
    recipientId?: string;
    recipientName?: string;
    recipientImage?: string;
    conversationId?: string;
    groupName?: string;
  };
  EditProfileScreen: undefined;
  CreateGroupScreen: undefined;
  ChatProfileScreen: {
    isGroup?: boolean;
    recipientId?: string;
    recipientName?: string;
    recipientImage?: string;
    conversationId?: string;
    groupName?: string;
  };
};

export type TabParamList = {
  Friend: undefined;
  Chat: undefined;
  Setting: undefined;
  Page: undefined;
};
