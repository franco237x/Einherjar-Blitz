import React, { type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export interface LobbyHeaderBadge {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
  color?: string;
}

interface LobbyPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badges?: LobbyHeaderBadge[];
  action?: ReactNode;
}

export function LobbyPageHeader({
  eyebrow,
  title,
  subtitle,
  badges = [],
  action,
}: LobbyPageHeaderProps) {
  const { width } = useWindowDimensions();
  const stacked = width < 620;

  return (
    <View style={[styles.container, stacked && styles.containerStacked]}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {badges.length > 0 || action ? (
        <View style={[styles.tools, stacked && styles.toolsStacked]}>
          {badges.length > 0 ? (
            <View style={styles.badges} accessibilityLabel="Recursos disponibles">
              {badges.map((badge) => (
                <View key={badge.label} style={styles.badge}>
                  <Ionicons
                    name={badge.icon}
                    size={18}
                    color={badge.color || Colors.primaryGold}
                  />
                  <View style={styles.badgeCopy}>
                    <Text style={styles.badgeLabel}>{badge.label}</Text>
                    <Text style={styles.badgeValue} numberOfLines={1}>
                      {badge.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {action ? <View style={styles.action}>{action}</View> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  containerStacked: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 25,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toolsStacked: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flex: 1,
  },
  badge: {
    minWidth: 104,
    minHeight: 46,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.22)',
    backgroundColor: 'rgba(10,10,10,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexGrow: 1,
  },
  badgeCopy: {
    minWidth: 0,
  },
  badgeLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  badgeValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    lineHeight: 18,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
