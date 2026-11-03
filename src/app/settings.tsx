import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '../components/AppText';
import { Check, ChevronDown, ChevronRight, DatabaseBackup, Globe2, LayoutTemplate, MonitorSmartphone, Store } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Choice, Notice, Row, Screen, SectionHeading, Txt, useColors } from '../components/ui';
import { ShopForm, type Profile } from '../components/ShopForm';
import { palettes, type ThemeName } from '../domain/themes';
import { languages } from '../localization';
export default function Settings() {
    const colors = useColors();
    const store = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const [profile, setProfile] = useState<Profile>(shop);
    const [error, setError] = useState('');
    const [open, setOpen] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const links = [{ key: 'savedShops', icon: Store, path: '/shops', color: '#AE884B', bg: '#F6EDDC' }, { key: 'templates', icon: LayoutTemplate, path: '/templates', color: '#E78B6A', bg: '#FFF0E9' }, { key: 'backup', icon: DatabaseBackup, path: '/backup', color: '#36AA9A', bg: '#E7F8F3' }, { key: 'device', icon: MonitorSmartphone, path: '/devices', color: '#A381CE', bg: '#F4EDFC' }];
    return <Screen title={t('settings')}><Card><Row><View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: '#EAF5EF', justifyContent: 'center', alignItems: 'center' }}><Store size={25} color={colors.green} strokeWidth={1.5}/></View><View style={{ flex: 1 }}><Txt title>{shop.name}</Txt><Txt muted>{shop.ownerName} · {shop.currency} / {t(shop.defaultUnit)}</Txt></View></Row></Card><Card><Txt title>{t('appTheme')}</Txt><Txt muted>{t('themeHelp')}</Txt><Row>{(Object.keys(palettes) as ThemeName[]).map(name => <Pressable accessibilityRole="radio" accessibilityLabel={t('theme_' + name)} accessibilityState={{ checked: (store.device.theme ?? 'heritage') === name }} key={name} onPress={async () => { try {
        await store.setDevice({ ...store.device, theme: name });
        setError('');
    }
    catch {
        setError('saveFailed');
    } }} style={{ flex: 1, minWidth: 80, padding: 12, borderRadius: 12, gap: 9, borderWidth: 2, borderColor: (store.device.theme ?? 'heritage') === name ? colors.green : colors.line, backgroundColor: palettes[name].bg }}><View style={{ height: 25, borderRadius: 6, backgroundColor: palettes[name].navy }}/><Text style={{ fontSize: 11, color: palettes[name].ink, fontWeight: '600' }}>{t('theme_' + name)}</Text>{(store.device.theme ?? 'heritage') === name && <Check size={14} color={colors.green}/>}</Pressable>)}</Row></Card><SectionHeading title={t('preferences')}/>
    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: 'hidden' }}>
      {[{ key: 'language', title: 'deviceLanguage', icon: Globe2, color: '#4B91D2', bg: '#EBF4FF', detail: languages.find(l => l.code === store.device.language)?.name }, { key: 'shop', title: 'shop', icon: Store, color: '#28A58C', bg: '#E6F7F0', detail: '' }].map((item, index) => <View key={item.key} style={{ borderTopWidth: index ? 1 : 0, borderColor: '#EDF2EF' }}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open === item.key }} onPress={() => setOpen(open === item.key ? null : item.key)} style={{ padding: 17 }}><Row><View style={{ width: 35, height: 35, borderRadius: 11, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}><item.icon size={18} color={item.color}/></View><View style={{ flex: 1 }}><Txt>{t(item.title)}</Txt></View><Text style={{ fontSize: 11, color: colors.green }}>{item.detail}</Text>{open === item.key ? <ChevronDown size={16} color="#99ABA2"/> : <ChevronRight size={16} color="#99ABA2"/>}</Row></Pressable>{open === item.key && <View style={{ padding: 18, paddingTop: 0, gap: 15 }}>{item.key === 'language' ? <><Choice value={store.device.language} onChange={async (language) => { try {
        await store.setDevice({ ...store.device, language: language as typeof store.device.language });
    }
    catch {
        setError('saveFailed');
    } }} options={languages.map(l => ({ value: l.code, label: l.name }))}/><Txt muted>{t('translationNotice')}</Txt></> : <><ShopForm value={profile} onChange={p => { setProfile(p); setSaved(false); }} onError={setError}/><Button title={t('save')} icon={saved ? Check : undefined} onPress={async () => { try {
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
    } }}/>{saved && <Txt muted>{t('shopUpdated')}</Txt>}</>}</View>}</View>)}
      {links.map(item => <Pressable accessibilityRole="button" key={item.key} onPress={() => router.push(item.path as '/')} style={{ padding: 17, borderTopWidth: 1, borderColor: '#EDF2EF' }}><Row><View style={{ width: 35, height: 35, borderRadius: 11, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}><item.icon size={18} color={item.color}/></View><View style={{ flex: 1 }}><Txt>{t(item.key)}</Txt></View><ChevronRight size={16} color="#99ABA2"/></Row></Pressable>)}
    </View><Notice error={error}/><View style={{ alignItems: 'center', gap: 4, padding: 14 }}><Txt muted>{t('app')} · 1.0</Txt><Txt muted>{t('about')}</Txt></View>
  </Screen>;
}

