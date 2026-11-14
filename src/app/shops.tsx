import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Store } from 'lucide-react-native';
import { useI18n, useStore } from '../store';
import { Button, Card, IconWell, Notice, Screen, Txt } from '../components/ui';
import { rtl } from '../localization';
export default function Shops() { const store = useStore(); const t = useI18n(); const [error, setError] = useState(''); const shops = store.data.shops.filter(s => !s.archived); return <Screen title={t('savedShops')}><Txt title>{t('chooseSavedShop')}</Txt>{!shops.length && <Notice info="noSavedShops"/>}{shops.map(shop => <Card key={shop.id}><View style={{ flexDirection: rtl(store.device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}><IconWell icon={Store} size={52}/><View style={{ flex: 1, gap: 2 }}><Txt heading>{shop.name}</Txt><Txt muted>{shop.ownerName} · {store.data.customers.filter(c => c.shopId === shop.id).length} {t('customers')} · {store.data.orders.filter(o => o.shopId === shop.id).length} {t('orders')}</Txt></View></View><Button title={t('shopResume')} onPress={async () => { try {
    await store.setDevice({ ...store.device, activeShopId: shop.id });
    router.replace(shop.setupComplete ? '/' : '/onboarding');
}
catch {
    setError('saveFailed');
} }}/></Card>)}<Notice error={error}/></Screen>; }
