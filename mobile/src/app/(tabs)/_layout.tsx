import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={Platform.OS === 'ios' ? 30 : 60} tint="dark" style={styles.blurView}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: any = 'home';
          if (route.name === 'play') iconName = 'game-controller';
          else if (route.name === 'gacha') iconName = 'gift';
          else if (route.name === 'index') iconName = 'home';
          else if (route.name === 'store') iconName = 'cart';
          else if (route.name === 'profile') iconName = 'person';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Ionicons 
                name={isFocused ? iconName : `${iconName}-outline`} 
                size={24} 
                color={isFocused ? Colors.primaryGold : Colors.textMuted} 
              />
              <Text style={[styles.tabLabel, { color: isFocused ? Colors.primaryGold : Colors.textMuted }]}>
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="play"
        options={{ title: 'Jugar' }}
      />
      <Tabs.Screen
        name="gacha"
        options={{ title: 'Cofres' }}
      />
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio' }}
      />
      <Tabs.Screen
        name="store"
        options={{ title: 'Tienda' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil' }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'transparent',
  },
  blurView: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  tabLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    marginTop: 4,
  },
});
