import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/AppText';
import { GarmentIcon } from '../components/GarmentIcon';
import { useI18n, useStore } from '../store';
import { Card, Notice, Screen, Txt, useColors } from '../components/ui';
import { rtl } from '../localization';
export default function Guide() {
    const colors = useColors(); const t = useI18n(); const { device } = useStore();
    const dir = rtl(device.language) ? 'row-reverse' as const : 'row' as const;
    return <Screen title={t('guide')}>
    <Notice info="guideHelp"/>
    <Card><View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28, paddingVertical: 12 }}><GarmentIcon garment="kameez" color={colors.green} size={88}/><GarmentIcon garment="shalwar" color={colors.navy} size={72}/></View></Card>
    {['guideLength', 'guideChest', 'guideShoulder', 'guideSleeve', 'guideShalwar'].map((key, index) => <Card compact key={key}><View style={{ flexDirection: dir, alignItems: 'flex-start', gap: 12 }}><View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{index + 1}</Text></View><View style={{ flex: 1, paddingTop: 2 }}><Txt>{t(key)}</Txt></View></View></Card>)}
  </Screen>;
}
