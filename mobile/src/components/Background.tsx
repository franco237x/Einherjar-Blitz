import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

interface BackgroundProps {
  children: React.ReactNode;
}

export const Background = ({ children }: BackgroundProps) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.bgDark, Colors.bgSecondary, Colors.bgDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
});
