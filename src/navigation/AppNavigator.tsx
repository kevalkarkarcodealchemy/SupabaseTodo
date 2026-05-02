import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, Platform } from "react-native";
import SettingScreen from "../screens/app/SettingScreen";
import FriendScreen from "../screens/app/FriendScreen";
import ChatScreen from "../screens/app/ChatScreen";
import MessageScreen from "../screens/app/MessageScreen";
import EditProfileScreen from "../screens/app/EditProfileScreen";
import CreateGroupScreen from "../screens/app/CreateGroupScreen";
import ChatProfileScreen from "../screens/app/ChatProfileScreen";
import { AppStackParamList, TabParamList } from "../types/navigation";

// SVG Icons
import SettingIcon from "../assets/svg/SettingIcon";
import FriendIcon from "../assets/svg/FriendIcon";
import ChatIcon from "../assets/svg/ChatIcon";
import PageScreen from "../screens/app/PageScreen";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="page"
        component={PageScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <ChatIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <ChatIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Friend"
        component={FriendScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <FriendIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Setting"
        component={SettingScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <SettingIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="MessageScreen"
        component={MessageScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="CreateGroupScreen"
        component={CreateGroupScreen}
        options={{
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="ChatProfileScreen"
        component={ChatProfileScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    height: Platform.OS === "ios" ? 88 : 65,
    paddingBottom: Platform.OS === "ios" ? 30 : 10,
    paddingTop: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
});

export default AppNavigator;
