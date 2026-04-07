export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  MessageScreen: {recipientId: string; recipientName: string; recipientImage?: string};
};

export type TabParamList = {
  Friend: undefined;
  Chat: undefined;
  Setting: undefined;
};
