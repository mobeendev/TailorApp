import React from 'react';
import { Stack, Redirect, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { StoreProvider, useStore, useI18n, useShop, usePalette } from '../store';
import { Button, Notice, Screen, Txt } from '../components/ui';
import { BrandEmblem } from '../components/Brand';
import { appFonts } from '../components/AppText';
function Routes() {
    const { loading, error, retry, data } = useStore(); const shop = useShop(); const path = usePathname(); const t = useI18n(); const colors = usePalette();
    if (loading)
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, backgroundColor: colors.bg }}><BrandEmblem size={96}/><ActivityIndicator color={colors.green}/><Txt muted center>{t('loading')}</Txt></View>;
    if (error)
        return <Screen title={t('app')} back={false}><Txt strong>{t('loadFailed')}</Txt><Notice error={error}/><Button title={t('retry')} onPress={retry}/></Screen>;
    if (!shop && data.shops.some(s => s.setupComplete && !s.archived) && path !== '/shops')
        return <Redirect href="/shops"/>;
    if (shop?.setupComplete && path === '/onboarding')
        return <Redirect href="/"/>;
    if (!shop?.setupComplete && !['/onboarding', '/shops'].includes(path))
        return <Redirect href="/onboarding"/>;
    return <Stack screenOptions={{ headerShown: false }}/>;
}
export default function RootLayout() { const [fontsLoaded, fontError] = useFonts(appFonts); if (!fontsLoaded && !fontError) return null; return <StoreProvider><StatusBar style="light"/><Routes /></StoreProvider>; }
