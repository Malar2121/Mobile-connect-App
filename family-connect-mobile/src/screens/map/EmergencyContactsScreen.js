import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PageHeader, Screen, TextField, Button, SectionTitle } from '../../design-system';
import { useMapModule } from '../../contexts/MapModuleContext';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function EmergencyContactsScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { emergencyContacts, saveEmergencyContacts } = useMapModule();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const addContact = async () => {
    if (!name.trim() || !phone.trim()) return;
    const next = [...emergencyContacts, { id: `ec-${Date.now()}`, name: name.trim(), phone: phone.trim() }];
    await saveEmergencyContacts(next);
    setName('');
    setPhone('');
  };

  return (
    <Screen edges={['top']}>
      <PageHeader title="Emergency contacts" subtitle="Called during SOS" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 16, lineHeight: 22 }}>
          Stored on device until a family emergency contacts API is available.
        </Text>

        <SectionTitle title="Add contact" />
        <TextField value={name} onChangeText={setName} placeholder="Name" />
        <TextField value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" style={{ marginTop: 10 }} />
        <Button title="Save contact" onPress={addContact} style={{ marginTop: 14 }} />

        <SectionTitle title="Contacts" subtitle={`${emergencyContacts.length} saved`} />
        {emergencyContacts.map((c) => (
          <View key={c.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{c.name}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{c.phone}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
