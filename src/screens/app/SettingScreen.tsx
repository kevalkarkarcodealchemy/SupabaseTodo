import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import useAuthStore from '../../store/useAuthStore';
import {useIsFocused} from '@react-navigation/native';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  subtitle: string;
}

const SettingScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const {user, logout} = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', onPress: () => logout(), style: 'destructive'},
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Edit Profile',
      icon: '👤',
      subtitle: 'Name, email, and bio',
    },
    {
      id: '2',
      title: 'Notifications',
      icon: '🔔',
      subtitle: 'Alerts and sounds',
    },
    {id: '3', title: 'Appearance', icon: '🌙', subtitle: 'Theme and styling'},
    {
      id: '4',
      title: 'Help & Support',
      icon: '❓',
      subtitle: 'FAQ, contact info',
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity key={item.id} style={styles.menuItem} activeOpacity={0.7}>
      <View style={styles.menuIconContainer}>
        <Text style={styles.menuEmoji}>{item.icon}</Text>
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.arrowIcon}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholderLarge}>
            <Text style={styles.avatarInitialLarge}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.menuCard}>{menuItems.map(renderMenuItem)}</View>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}>
            <Text style={styles.logoutButtonText}>Disconnect & Exit</Text>
          </TouchableOpacity>
          <Text style={styles.versionLabel}>
            Version 1.0.2 • Made with CodeAchemy
          </Text>
        </View>

        {/* Fill empty space at bottom for scrolling */}
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  profileSection: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarPlaceholderLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarInitialLarge: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  menuSection: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#D1D5DB',
  },
  logoutSection: {
    padding: 20,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FFF1F2',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  logoutButtonText: {
    color: '#E11D48',
    fontWeight: '700',
    fontSize: 15,
  },
  versionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 20,
  },
});

export default SettingScreen;
