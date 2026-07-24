import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SyncIndicator } from '@/components/SyncIndicator';
import { FEATURE_FLAGS } from '@/config/featureFlags';

type CustomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.tabBarContainer}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 30 : 45}
        tint="dark"
        style={[
          styles.blurView,
          {
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          if (route.name === 'play' && !FEATURE_FLAGS.game) {
            return null;
          }

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
          else if (route.name === 'gacha') iconName = 'sparkles';
          else if (route.name === 'index') iconName = 'home';
          else if (route.name === 'store') iconName = 'cart';
          else if (route.name === 'profile') iconName = 'person';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={(options.tabBarAccessibilityLabel ?? label) as string}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
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
    <>
      <SyncIndicator />
      <Tabs
        initialRouteName="index"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio' }}
      />
      <Tabs.Screen
        name="gacha"
        options={{ title: 'Gacha' }}
      />
      <Tabs.Screen
        name="store"
        options={{ title: 'Tienda' }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Jugar',
          href: FEATURE_FLAGS.game ? '/play' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil' }}
      />
      </Tabs>
    </>
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
    backgroundColor: Colors.bgDarker,
  },
  blurView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: Radius.md,
  },
  tabItemActive: {
    backgroundColor: 'rgba(201, 170, 113, 0.11)',
  },
  tabLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    marginTop: 3,
  },
});
