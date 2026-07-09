import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PageHeader, Screen } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import { TreeCanvas, TreeControls, TreeLegend, TreeMiniMap } from '../../components/family-tree';
import { layoutTree } from '../../utils/familyTreeModuleHelpers';

export default function InteractiveTreeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialId = route.params?.memberId ? String(route.params.memberId) : null;

  const { enrichedNodes, treeSettings, isElder, loading } = useFamilyTreeModuleData();
  const [selectedId, setSelectedId] = useState(initialId);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const layout = useMemo(() => layoutTree(enrichedNodes, collapsedIds), [enrichedNodes, collapsedIds]);

  const handleSelect = useCallback(
    (node) => {
      setSelectedId(String(node.id));
      navigation.navigate('PersonProfile', { memberId: String(node.id) });
    },
    [navigation],
  );

  const handleToggleCollapse = useCallback((node) => {
    const id = String(node.id);
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <Screen edges={['top']} style={{ paddingHorizontal: 0 }}>
      <View style={styles.header}>
        <PageHeader
          title="Interactive tree"
          subtitle="Pinch to zoom · drag to pan"
          onBack={() => navigation.goBack()}
        />
      </View>

      <View style={styles.legendWrap}>
        <TreeLegend />
      </View>

      <TreeCanvas
        nodes={enrichedNodes}
        selectedId={selectedId}
        onSelectNode={handleSelect}
        collapsedIds={collapsedIds}
        onToggleCollapse={handleToggleCollapse}
        showGenerationLabels={treeSettings?.showGenerationLabels !== false}
        showNicknames={treeSettings?.showNicknames !== false}
        animateConnections={treeSettings?.animateConnections !== false}
        largeNodes={isElder || treeSettings?.elderLargeNodes}
        settings={treeSettings}
      />

      <View style={styles.miniMap}>
        <TreeMiniMap layout={layout} selectedId={selectedId} />
      </View>

      <TreeControls />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16 },
  legendWrap: { paddingHorizontal: 16, marginBottom: 8 },
  miniMap: { position: 'absolute', left: 16, bottom: 24 },
});
