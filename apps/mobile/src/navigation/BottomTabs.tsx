import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import SettingsScreen from '../screens/SettingsScreen';

type Props = { isDark: boolean; setIsDark: (v: boolean) => void };

const Tab = createBottomTabNavigator();

export default function BottomTabs({ isDark, setIsDark }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderIcon = (routeName: string, color: string, size: number) => {
    const map: Record<string, string> = {
      Home: 'home',
      History: 'history',
      Insights: 'chart-line',
      Settings: 'cog',
    };
    const name = map[routeName] ?? 'circle';
    // cast to any because icon name union is large and this map is guaranteed
    return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        // use onSurfaceVariant for slightly reduced contrast on inactive labels
        tabBarInactiveTintColor: colors.onSurfaceVariant || colors.onSurface,
        tabBarStyle: {
          backgroundColor: colors.surface,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ color, size = 22 }) => renderIcon(route.name, color, size),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen isDark={isDark} setIsDark={setIsDark} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
