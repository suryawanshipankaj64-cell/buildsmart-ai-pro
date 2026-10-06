import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  TrendingUp,
  Plus,
  Receipt,
  FolderKanban,
  Eye,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { MainTabParamList } from '../types/navigation';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProjectProgressScreen } from '../screens/ProjectProgressScreen';
import { ExpenseEntryScreen } from '../screens/ExpenseEntryScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { RecordDrawer } from '../components/RecordDrawer';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Dummy component for the center plus button route
const DummyRecordScreen = () => <View style={{ flex: 1, backgroundColor: colors.backgroundDeep }} />;

export const TabNavigator = () => {
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const { isClient } = useAuth();

  const handleCenterPress = () => {
    if (isClient) {
      Alert.alert(
        'Client Transparency Mode',
        'You are viewing this site with Client Read-Only clearance. Field entries and task updates are restricted to Engineers and Administrators.'
      );
      return;
    }
    setDrawerVisible(true);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primaryAccent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color }: { color: string }) => <LayoutDashboard size={20} color={color} />,
          }}
        />

        <Tab.Screen
          name="ProjectProgress"
          component={ProjectProgressScreen}
          options={{
            tabBarLabel: 'Progress',
            tabBarIcon: ({ color }: { color: string }) => <TrendingUp size={20} color={color} />,
          }}
        />

        {/* Central Elevated (+) Action or Transparency Observer Button */}
        <Tab.Screen
          name="RecordAction"
          component={DummyRecordScreen}
          options={{
            tabBarLabel: '',
            tabBarButton: () => (
              <View style={styles.centerButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.elevatedPlusButton,
                    isClient && {
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderColor: '#3B82F6',
                    },
                  ]}
                  onPress={handleCenterPress}
                  activeOpacity={0.85}
                >
                  {isClient ? (
                    <Eye size={22} color="#60A5FA" strokeWidth={2.5} />
                  ) : (
                    <Plus size={26} color="#071224" strokeWidth={3} />
                  )}
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="ExpenseEntry"
          component={ExpenseEntryScreen}
          options={{
            tabBarLabel: 'Expenses',
            tabBarIcon: ({ color }: { color: string }) => <Receipt size={20} color={color} />,
          }}
        />

        <Tab.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{
            tabBarLabel: 'Vault',
            tabBarIcon: ({ color }: { color: string }) => <FolderKanban size={20} color={color} />,
          }}
        />
      </Tab.Navigator>

      {/* Central Record Drawer Bottom Sheet */}
      <RecordDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.cardSurface,
    borderTopColor: colors.blueprintBorder,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 86 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  centerButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elevatedPlusButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: colors.backgroundDeep,
  },
});
