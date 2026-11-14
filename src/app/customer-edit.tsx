import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Input, Notice, Screen } from '../components/ui';
import { saveCustomer } from '../domain/services';
export default function CustomerEdit() { const { id, returnToOrder } = useLocalSearchParams<{
    id?: string;
    returnToOrder?: string;
}>(); const store = useStore(); const shop = useShop()!; const t = useI18n(); const previous = store.data.customers.find(c => c.id === id && c.shopId === shop.id); const [form, setForm] = useState(previous ?? { name: '', phone: '', address: '', notes: '' }); const [error, setError] = useState(''); return <Screen title={t(id ? 'edit' : 'newCustomer')}><Card>{(['name', 'phone', 'address', 'notes'] as const).map(k => <Input key={k} label={`${t(k)}${k === 'name' ? ' *' : ''}`} value={form[k]} multiline={k === 'notes'} keyboardType={k === 'phone' ? 'phone-pad' : undefined} autoCapitalize={k === 'name' ? 'words' : undefined} onChange={v => setForm({ ...form, [k]: v })}/>)}</Card><Notice error={error}/><Button icon={Save} title={t('save')} onPress={async () => { try {
    const result = saveCustomer(store.data, store.ctx, shop.id, form, id);
    await store.commit(result.state);
    if (returnToOrder === '1') router.dismissTo({ pathname: '/order-edit', params: { customerId: result.customerId } });
    else router.replace({ pathname: '/customer', params: { id: result.customerId } });
}
catch (e) {
    setError((e as Error).message);
} }}/></Screen>; }
