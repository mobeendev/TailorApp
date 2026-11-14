import React, { useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, View } from 'react-native';
import { Text } from '../components/AppText';
import { Check, Languages, Ruler, Save, ShieldCheck, Smartphone, SquarePen, Store } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Choice, IconWell, MenuGroup, MenuRow, Notice, Screen, SectionHeading, Txt, useColors } from '../components/ui';
import { ShopForm, type Profile } from '../components/ShopForm';
import { palettes, type ThemeName } from '../domain/themes';
import { languages, rtl } from '../localization';
export default function Settings() {
    const colors = useColors();
    const store = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const [profile, setProfile] = useState<Profile>(shop);
    const [error, setError] = useState('');
    const [open, setOpen] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const dir = rtl(store.device.language) ? 'row-reverse' as const : 'row' as const;
    const links = [{ key: 'savedShops', icon: Store, path: '/shops', color: '#8A5300', bg: '#FDF1D8' }, { key: 'templates', icon: Ruler, path: '/templates', color: '#B4461F', bg: '#FCEBDD' }, { key: 'backup', icon: ShieldCheck, path: '/backup', color: '#0E7490', bg: '#E0F4F7' }, { key: 'device', icon: Smartphone, path: '/devices', color: '#6B3FA0', bg: '#EFE6FA' }];
    const current = store.device.theme ?? 'heritage';
    return <Screen title={t('settings')}>
    <Card><View style={{ flexDirection: dir, alignItems: 'center', gap: 14 }}>{shop.logoPath ? <Image source={{ uri: shop.logoPath }} resizeMode="cover" style={{ width: 56, height: 56, borderRadius: 16 }}/> : <IconWell icon={Store} size={56}/>}<View style={{ flex: 1, gap: 2 }}><Txt title>{shop.name}</Txt><Txt muted>{shop.ownerName} · {shop.currency} / {t(shop.defaultUnit)}</Txt></View></View></Card>
    <Card><Txt heading>{t('appTheme')}</Txt><Txt muted>{t('themeHelp')}</Txt><View style={{ flexDirection: dir, gap: 10 }}>{(Object.keys(palettes) as ThemeName[]).map(name => { const on = current === name; const p = palettes[name]; return <Pressable accessibilityRole="radio" accessibilityLabel={t('theme_' + name)} accessibilityState={{ checked: on }} key={name} onPress={async () => { try {
        await store.setDevice({ ...store.device, theme: name });
        setError('');
    }
    catch {
        setError('saveFailed');
    } }} style={{ flex: 1, minWidth: 0, padding: 10, borderRadius: 14, gap: 8, borderWidth: 2, borderColor: on ? colors.green : colors.line, backgroundColor: p.bg }}>
      <View style={{ height: 30, borderRadius: 8, backgroundColor: p.navy, justifyContent: 'center', paddingHorizontal: 8 }}><View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: p.green, borderWidth: 2, borderColor: '#FFFFFF' }}/></View>
      <View style={{ flexDirection: dir, alignItems: 'center', gap: 4 }}><Text numberOfLines={2} style={{ flex: 1, fontSize: 13, lineHeight: 18, color: p.ink, fontWeight: '600' }}>{t('theme_' + name)}</Text>{on && <Check size={16} color={p.green} strokeWidth={3}/>}</View>
    </Pressable>; })}</View></Card>
    <SectionHeading title={t('preferences')}/>
    <MenuGroup>
      {[{ key: 'language', title: 'deviceLanguage', icon: Languages, color: '#1D5BAA', bg: '#E7F0FC', detail: languages.find(l => l.code === store.device.language)?.name }, { key: 'shop', title: 'shop', icon: SquarePen, color: colors.green, bg: colors.mint, detail: '' }].map(item => <View key={item.key}>
        <MenuRow icon={item.icon} color={item.color} bg={item.bg} title={t(item.title)} detail={item.detail} expanded={open === item.key} onPress={() => setOpen(open === item.key ? null : item.key)}/>
        {open === item.key && <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>{item.key === 'language' ? <><Choice value={store.device.language} onChange={async (language) => { try {
        await store.setDevice({ ...store.device, language: language as typeof store.device.language });
    }
    catch {
        setError('saveFailed');
    } }} options={languages.map(l => ({ value: l.code, label: l.name }))}/><Txt muted>{t('translationNotice')}</Txt></> : <><ShopForm value={profile} onChange={p => { setProfile(p); setSaved(false); }} onError={setError}/><Button title={t('save')} icon={saved ? Check : Save} onPress={async () => { try {
        if (!profile.name.trim() || !profile.ownerName.trim() || !profile.phone.trim())
            throw new Error('shopRequired');
        const next = structuredClone(store.data);
        Object.assign(next.shops.find(s => s.id === shop.id)!, profile, { recordVersion: shop.recordVersion + 1, updatedAt: store.ctx.now(), deviceId: store.device.deviceId });
        await store.commit(next);
        setError('');
        setSaved(true);
    }
    catch (e) {
        setError((e as Error).message);
    } }}/>{saved && <Notice success="shopUpdated"/>}</>}</View>}
      </View>)}
      {links.map(item => <MenuRow key={item.key} icon={item.icon} color={item.color} bg={item.bg} title={t(item.key)} onPress={() => router.push(item.path as '/')}/>)}
    </MenuGroup>
    <Notice error={error}/>
    <View style={{ alignItems: 'center', gap: 4, padding: 14 }}><Txt muted center>{t('app')} · 1.0</Txt><Txt muted center>{t('about')}</Txt></View>
  </Screen>;
}
