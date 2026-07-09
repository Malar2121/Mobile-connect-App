import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, Card } from '../../design-system';
import { MemoryMapCard } from '../../components/memories';
import { useMemoriesModuleData } from '../../hooks/useMemoriesModuleData';
import { loadMemoryMeta } from '../../utils/memoryModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function MemoryMapScreen() {
  const navigation = useNavigation();
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { memories } = useMemoriesModuleData();

  const mappedMemories = useMemo(
    () =>
      memories.slice(0, 20).map((m, i) => ({
        memory: m,
        latitude: 37.7749 + (i % 5) * 0.02,
        longitude: -122.4194 + Math.floor(i / 5) * 0.02,
        label: 'San Francisco area',
      })),
    [memories],
  );

  const region = {
    latitude: mappedMemories[0]?.latitude ?? 37.7749,
    longitude: mappedMemories[0]?.longitude ?? -122.4194,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  return (
    <Screen edges={['top']}>
      <PageHeader title="Memory map" subtitle="Places that matter" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ height: 280, marginHorizontal: horizontalPadding, borderRadius: 16, overflow: 'hidden' }}>
          <MapView style={{ flex: 1 }} initialRegion={region}>
            {mappedMemories.map((item, i) => (
              <Marker
                key={String(item.memory._id)}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                title={item.memory.caption || 'Memory'}
                onCalloutPress={() => navigation.navigate('MemoryDetails', { id: String(item.memory._id) })}
              />
            ))}
          </MapView>
        </View>
        <Card style={{ margin: horizontalPadding, marginTop: 12 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
            TODO: Memory geo coordinates API — markers use demo offsets until location is stored per memory.
          </Text>
        </Card>
        <View style={{ paddingHorizontal: horizontalPadding, marginTop: 8 }}>
          {mappedMemories.map((item) => (
            <MemoryMapCard
              key={item.memory._id}
              memory={item.memory}
              locationLabel={item.label}
              onPress={(m) => navigation.navigate('MemoryDetails', { id: String(m._id) })}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
