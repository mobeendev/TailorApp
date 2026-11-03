import React, { useState } from 'react';
import { router } from 'expo-router';
import { useI18n, useStore } from '../store';
import { Button, Card, Notice, Screen, Txt } from '../components/ui';
export default function Shops() { const store = useStore(); const t = useI18n(); const [error, setError] = useState(''); const shops = store.data.shops.filter(s => !s.archived); return <Screen title={t('savedShops')}><Txt title>{t('chooseSavedShop')}</Txt>{!shops.length && <Txt>{t('noSavedShops')}</Txt>}{shops.map(shop => <Card key={shop.id}><Txt title>{shop.name}</Txt><Txt muted>{shop.ownerName} · {store.data.customers.filter(c => c.shopId === shop.id).length} {t('customers')} · {store.data.orders.filter(o => o.shopId === shop.id).length} {t('orders')}</Txt><Button title={t('shopResume')} onPress={async () => { try {
    await store.setDevice({ ...store.device, activeShopId: shop.id });
    router.replace(shop.setupComplete ? '/' : '/onboarding');
}
catch {
    setError('saveFailed');
} }}/></Card>)}<Notice error={error}/></Screen>; }

