import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Eye, Pencil } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Notice, Pair, Pill, Screen, Txt, useColors } from '../components/ui';
import { GarmentIcon } from '../components/GarmentIcon';
import { label, rtl } from '../localization';
import { availableTemplate } from '../domain/availableTemplate';

export default function Templates() {
    const store = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const colors = useColors();
    const template = availableTemplate(store.data, shop.id);
    const version = store.data.templateVersions.find(item => item.templateId === template?.id && item.version === template?.activeVersion);
    return <Screen title={t('templates')}>
        <Txt title>{t('singleTemplateTitle')}</Txt>
        <Notice info="singleTemplateNote"/>
        {template && <Card>
            <View style={{ flexDirection: rtl(store.device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: colors.mint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}><GarmentIcon garment="kameez" color={colors.green} size={30}/><GarmentIcon garment="shalwar" color={colors.green} size={26}/></View>
                <View style={{ flex: 1, gap: 6 }}><Txt heading>{label(template.labels, store.device.language)}</Txt><Pill tone="neutral" label={`${t('version')} ${template.activeVersion} · ${version?.fields.filter(field => field.enabled).length ?? 0} ${t('fieldCount')}`}/></View>
            </View>
            <Pair><Button secondary icon={Eye} title={t('preview')} onPress={() => router.push({ pathname: '/template-edit', params: { id: template.id, preview: '1' } })}/><Button icon={Pencil} title={t('edit')} onPress={() => router.push({ pathname: '/template-edit', params: { id: template.id } })}/></Pair>
        </Card>}
    </Screen>;
}
