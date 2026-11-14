import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { findCustomers } from '../domain/ease';
import { rtl } from '../localization';
import { Avatar, Chevron, EmptyState, MenuGroup, Notice, Screen, SearchInput, Txt, useColors } from '../components/ui';
export default function CustomerSearch() {
    const { data, device } = useStore(); const shop = useShop()!; const t = useI18n(); const colors = useColors();
    const [query, setQuery] = useState('');
    const matches = findCustomers(data, shop.id, query).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));
    const dir = rtl(device.language) ? 'row-reverse' as const : 'row' as const;
    return <Screen title={t('findCustomer')}><SearchInput label={t('search')} value={query} onChange={setQuery} autoFocus/>
        <Txt muted>{t(query.trim() ? 'customerSearchMatches' : 'recentCustomers')}: {matches.length}</Txt>
        {matches.length > 20 && <Notice info="refineCustomerSearch"/>}
        {matches.length > 0 && <MenuGroup>{matches.slice(0, 20).map(customer => <Pressable key={customer.id} accessibilityRole="button" accessibilityLabel={`${t('customerDetails')}: ${customer.name}`} onPress={() => router.push({ pathname: '/customer', params: { id: customer.id } })} style={({ pressed }) => ({ paddingHorizontal: 16, paddingVertical: 12, minHeight: 72, justifyContent: 'center', backgroundColor: pressed ? colors.mint : 'transparent' })}><View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><Avatar name={customer.name}/><View style={{ flex: 1, gap: 2 }}><Txt strong lines={1}>{customer.name}</Txt><Txt muted>{customer.phone || t('noPhone')}</Txt></View><Chevron/></View></Pressable>)}</MenuGroup>}
        {!matches.length && <EmptyState title={t('noResults')} message={t('customerSearchHint')} icon={Search}/>}
    </Screen>;
}
