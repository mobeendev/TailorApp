import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { Shop } from '../domain/model';
import { useI18n } from '../store';
import { Button, Choice, Input, Txt } from './ui';
export type Profile = Pick<Shop, 'name' | 'ownerName' | 'phone' | 'address' | 'logoPath' | 'currency' | 'defaultUnit'>;
export function ShopForm({ value, onChange, onError }: {
    value: Profile;
    onChange: (p: Profile) => void;
    onError: (e: string) => void;
}) {
    const t = useI18n();
    const set = (key: keyof Profile, v: string) => onChange({ ...value, [key]: v });
    return <>
 {(['name', 'ownerName', 'phone', 'address', 'currency'] as const).map(key => <Input key={key} label={t(key === 'name' ? 'shopName' : key)} value={value[key]} onChange={v => set(key, key === 'currency' ? v.toUpperCase() : v)}/>)}
 <Txt>{t('defaultUnit')}</Txt><Choice value={value.defaultUnit} onChange={v => onChange({ ...value, defaultUnit: v as 'inch' | 'cm' })} options={['inch', 'cm'].map(v => ({ value: v, label: t(v) }))}/><Button secondary title={t('logo')} onPress={async () => { try {
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
    } }}/>{value.logoPath ? <Button secondary title={t('logoRemove')} onPress={() => set('logoPath', '')}/> : <Txt muted>{t('noLogo')}</Txt>}
 </>;
}

