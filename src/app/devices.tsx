import React from 'react';
import { View } from 'react-native';
import { Smartphone } from 'lucide-react-native';
import { useI18n, useStore } from '../store';
import { Card, IconWell, Notice, Screen, Txt } from '../components/ui';
import { rtl } from '../localization';
export default function Devices() { const { device } = useStore(); const t = useI18n(); return <Screen title={t('device')}><Card><View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}><IconWell icon={Smartphone} color="#6B3FA0" bg="#EFE6FA"/><View style={{ flex: 1, gap: 2 }}><Txt strong>{t('deviceId')}</Txt><Txt muted>{device.deviceId}</Txt></View></View></Card><Notice info="syncUnavailable"/></Screen>; }
