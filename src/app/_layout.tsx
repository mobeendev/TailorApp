import React from 'react';
import { Stack, Redirect, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { StoreProvider, useStore, useI18n, useShop } from '../store';
import { Button, Screen, Txt } from '../components/ui';
function Routes() { const { loading, error, retry, data } = useStore(); const shop = useShop(); const path = usePathname(); const t = useI18n(); if (loading)
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /><Txt>{t('loading')}</Txt></View>; if (error)
    return <Screen title={t('app')} back={false}><Txt>{t('loadFailed')}</Txt><Txt>{t(error)}</Txt><Button title={t('retry')} onPress={retry}/></Screen>; if (!shop && data.shops.some(s => s.setupComplete && !s.archived) && path !== '/shops')
    return <Redirect href="/shops"/>; if (shop?.setupComplete && path === '/onboarding')
    return <Redirect href="/"/>; if (!shop?.setupComplete && !['/onboarding', '/shops'].includes(path))
    return <Redirect href="/onboarding"/>; return <Stack screenOptions={{ headerShown: false }}/>; }
export default function RootLayout() { const [fontsLoaded, fontError] = useFonts({ 'NotoNaskhArabicUI-Regular': require('../../assets/fonts/NotoNaskhArabicUI-Regular.ttf'), 'NotoNaskhArabicUI-Bold': require('../../assets/fonts/NotoNaskhArabicUI-Bold.ttf') }); if (!fontsLoaded && !fontError) return null; return <StoreProvider><StatusBar style="light"/><Routes /></StoreProvider>; }

