import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Phone, UserPlus, Users } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Avatar, Button, Chevron, EmptyState, MenuGroup, Pill, Screen, SearchInput, Toggle, Txt, useColors } from '../components/ui';
import { findCustomers } from '../domain/ease';
import { rtl } from '../localization';
export default function Customers() {
    const colors = useColors();
    const { data, device } = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const [q, setQ] = useState('');
    const [archive, setArchive] = useState(false);
    const rows = findCustomers(data, shop.id, q, archive);
    const dir = rtl(device.language) ? 'row-reverse' as const : 'row' as const;
    return <Screen title={t('customers')}>
    <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><View style={{ flex: 1, gap: 2 }}><Txt title>{t('customerBook')}</Txt><Txt muted>{rows.length} {t('customers').toLowerCase()}</Txt></View><Button compact title={t('newCustomer')} icon={UserPlus} onPress={() => router.push('/customer-edit')}/></View>
    <SearchInput label={t('search')} value={q} onChange={setQ}/>
    <Toggle title={t('showArchived')} value={archive} onChange={setArchive}/>
    {rows.length ? <MenuGroup>{rows.map(c => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`${t('customerDetails')}: ${c.name}`} onPress={() => router.push({ pathname: '/customer', params: { id: c.id } })} style={({ pressed }) => ({ paddingHorizontal: 16, paddingVertical: 12, minHeight: 72, justifyContent: 'center', backgroundColor: pressed ? colors.mint : 'transparent' })}>
      <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}>
        <Avatar name={c.name}/>
        <View style={{ flex: 1, gap: 2 }}><Txt strong lines={1}>{c.name}</Txt><View style={{ flexDirection: dir, alignItems: 'center', gap: 6 }}>{Boolean(c.phone) && <Phone size={14} color={colors.muted} strokeWidth={2}/>}<Txt muted>{c.phone || t('noPhone')}</Txt></View></View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}><Txt muted>{new Date(c.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</Txt>{c.archived && <Pill label={t('archived')} tone="neutral"/>}</View>
        <Chevron/>
      </View>
    </Pressable>)}</MenuGroup> : <EmptyState title={t('noResults')} message={t('emptyCustomers')} icon={Users}/>}
  </Screen>;
}
