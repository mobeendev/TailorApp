import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/AppText';
import { useI18n } from '../store';
import { Card, Screen, Txt, useColors } from '../components/ui';
export default function Guide() { const colors = useColors(); const t = useI18n(); return <Screen title={t('guide')}><Txt>{t('guideHelp')}</Txt><Card><View style={{ alignItems: 'center', padding: 20 }}><Text style={{ fontSize: 90, color: colors.navy }}>♧</Text><Text style={{ fontSize: 60, color: colors.green }}>⋈</Text></View></Card>{['guideLength', 'guideChest', 'guideShoulder', 'guideSleeve', 'guideShalwar'].map((key, index) => <Card key={key}><Txt>{index + 1}. {t(key)}</Txt></Card>)}</Screen>; }

