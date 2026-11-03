import React, { useState } from 'react';
import { Redirect } from 'expo-router';
import { useShop, useStore } from '../store';
import { Button, Card, Notice, Screen, Txt } from '../components/ui';
import { addTestData } from '../domain/testData';
export default function TestData() { const store = useStore(); const shop = useShop()!; const [error, setError] = useState(''); const [done, setDone] = useState(false); if (!__DEV__)
    return <Redirect href="/"/>; const customers = store.data.customers.filter(c => c.shopId === shop.id); const orders = store.data.orders.filter(o => o.shopId === shop.id); return <Screen title="Development test data"><Card><Txt>17 synthetic customers: 10 male and 7 female. 50 orders, with 10 in each status. Includes measurements, varied delivery dates and payment balances.</Txt><Txt>Existing records are preserved. This batch can only be added once per shop.</Txt><Button title="Add test customers and orders" disabled={done} onPress={async () => { try {
    await store.commit(addTestData(store.data, store.ctx, shop.id));
    setDone(true);
}
catch (e) {
    setError((e as Error).message);
} }}/><Notice error={error}/>{done && <Txt>Test data saved successfully.</Txt>}<Txt>Shop totals: {customers.length} customers · {orders.length} orders</Txt></Card></Screen>; }

