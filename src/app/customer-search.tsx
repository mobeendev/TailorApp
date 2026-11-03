import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useI18n, useShop, useStore } from '../store';
import { findCustomers } from '../domain/ease';
import { Avatar, EmptyState, Row, Screen, SearchInput, Txt, useColors } from '../components/ui';
export default function CustomerSearch() {
    const { data } = useStore(); const shop = useShop()!; const t = useI18n(); const colors = useColors();
    const [query, setQuery] = useState('');
    const matches = findCustomers(data, shop.id, query).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name));
    return <Screen title={t('findCustomer')}><SearchInput label={t('search')} value={query} onChange={setQuery} autoFocus/>
        <Txt muted>{t(query.trim() ? 'customerSearchMatches' : 'recentCustomers')}: {matches.length}</Txt>
        {matches.length > 20 && <Txt muted>{t('refineCustomerSearch')}</Txt>}
        {matches.slice(0, 20).map((customer, i) => <Pressable key={customer.id} accessibilityRole="button" accessibilityLabel={`${t('customerDetails')}: ${customer.name}`} onPress={() => router.push({ pathname: '/customer', params: { id: customer.id } })} style={({ pressed }) => ({ padding: 15, minHeight: 64, backgroundColor: pressed ? colors.mint : '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.line })}><Row><Avatar name={customer.name} index={i}/><View style={{ flex: 1 }}><Txt>{customer.name}</Txt><Txt muted>{customer.phone || t('noPhone')}</Txt></View></Row></Pressable>)}
        {!matches.length && <EmptyState title={t('noResults')} message={t('customerSearchHint')}/>}
    </Screen>;
}
