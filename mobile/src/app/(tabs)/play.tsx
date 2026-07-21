import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '@/components/Background';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { EmptyState } from '@/components/EmptyState';

export default function PlayScreen() {
  const insets = useSafeAreaInsets();

  return (
    <Background>
      <ParticlesBackground />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <EmptyState
          icon="game-controller-outline"
          title="MÓDULO DE JUEGO"
          description="Próximamente. Prepara tu escuadrón para la batalla."
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
