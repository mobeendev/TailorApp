import React from 'react';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Trash2 } from 'lucide-react-native';
import type { Shop } from '../domain/model';
import { useI18n, useStore } from '../store';
import { rtl } from '../localization';
import { Button, Choice, FieldLabel, Input, Txt, useColors } from './ui';
export type Profile = Pick<Shop, 'name' | 'ownerName' | 'phone' | 'address' | 'logoPath' | 'currency' | 'defaultUnit'>;
export function ShopForm({ value, onChange, onError }: {
    value: Profile;
    onChange: (p: Profile) => void;
    onError: (e: string) => void;
}) {
    const t = useI18n();
    const colors = useColors();
    const { device } = useStore();
    const set = (key: keyof Profile, v: string) => onChange({ ...value, [key]: v });
    return <>
 {(['name', 'ownerName', 'phone', 'address', 'currency'] as const).map(key => <Input key={key} label={`${t(key === 'name' ? 'shopName' : key)}${key === 'address' ? '' : ' *'}`} value={value[key]} keyboardType={key === 'phone' ? 'phone-pad' : undefined} autoCapitalize={key === 'currency' ? 'characters' : undefined} onChange={v => set(key, key === 'currency' ? v.toUpperCase() : v)}/>)}
 <View style={{ gap: 8 }}><FieldLabel>{t('defaultUnit')}</FieldLabel><Choice value={value.defaultUnit} onChange={v => onChange({ ...value, defaultUnit: v as 'inch' | 'cm' })} options={['inch', 'cm'].map(v => ({ value: v, label: t(v) }))}/></View>
 <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
  <View style={{ width: 64, height: 64, borderRadius: 16, borderWidth: 1.5, borderColor: colors.line, borderStyle: value.logoPath ? 'solid' : 'dashed', backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{value.logoPath ? <Image source={{ uri: value.logoPath }} resizeMode="cover" style={{ width: 64, height: 64 }}/> : <ImagePlus size={24} color={colors.faint} strokeWidth={2}/>}</View>
  <View style={{ flex: 1, gap: 8 }}><Button compact secondary icon={ImagePlus} title={t('logo')} onPress={async () => { try {
        const image = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.4, allowsEditing: true, aspect: [1, 1] });
        if (!image.canceled) {
            const a = image.assets[0];
            if (!a.base64 || a.base64.length > 2000000)
                throw new Error('uploadFailed');
            set('logoPath', `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}`);
        }
    }
    catch {
        onError('uploadFailed');
    } }}/>{value.logoPath ? <Button compact tone="danger" icon={Trash2} title={t('logoRemove')} onPress={() => set('logoPath', '')}/> : <Txt muted>{t('noLogo')}</Txt>}</View>
 </View>
 </>;
}
