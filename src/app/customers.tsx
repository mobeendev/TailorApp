import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '../components/AppText';
import { ChevronLeft, ChevronRight, Phone, UserPlus, Users } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Avatar, Button, EmptyState, Row, Screen, SearchInput, Toggle, Txt, useColors } from '../components/ui';
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
    return <Screen title={t('customers')}><Row><View style={{ flex: 1 }}><Txt title>{t('customerBook')}</Txt><Txt muted>{rows.length} {t('customers').toLowerCase()}</Txt></View><Button title={t('newCustomer')} icon={UserPlus} onPress={() => router.push('/customer-edit')}/></Row><SearchInput label={t('search')} value={q} onChange={setQ}/><Toggle title={t('showArchived')} value={archive} onChange={setArchive}/>
    {rows.length ? <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>{rows.map((c, index) => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`${t('customerDetails')}: ${c.name}`} onPress={() => router.push({ pathname: '/customer', params: { id: c.id } })} style={({ pressed }) => ({ padding: 16, backgroundColor: pressed ? '#EDF6F1' : '#fff', borderTopWidth: index ? 1 : 0, borderColor: '#EDF2EF' })}><Row><Avatar name={c.name} index={index}/><View style={{ flex: 1, gap: 3 }}><Text style={{ fontSize: 15, color: colors.ink, fontWeight: '600', textAlign: rtl(device.language) ? 'right' : 'left' }}>{c.name}</Text><Row>{Boolean(c.phone) && <Phone size={11} color="#9AABA2"/>}<Txt muted>{c.phone || t('noPhone')}</Txt></Row></View><View style={{ alignItems: 'flex-end', gap: 4 }}><Txt muted>{new Date(c.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</Txt>{c.archived && <Txt muted>{t('archived')}</Txt>}</View>{rtl(device.language) ? <ChevronLeft size={17} color="#A7B8B0"/> : <ChevronRight size={17} color="#A7B8B0"/>}</Row></Pressable>)}</View> : <EmptyState title={t('noResults')} message={t('emptyCustomers')} icon={Users}/>}
  </Screen>;
}

