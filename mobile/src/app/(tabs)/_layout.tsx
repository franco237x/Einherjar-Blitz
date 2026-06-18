import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Fonts } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primaryGold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Santuario',
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Crónicas',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: Colors.borderGold,
    backgroundColor: 'transparent',
    height: 65,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
  },
});
