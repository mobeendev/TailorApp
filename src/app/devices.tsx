import React from 'react';
import { useI18n, useStore } from '../store';
import { Card, Screen, Txt } from '../components/ui';
export default function Devices() { const { device } = useStore(); const t = useI18n(); return <Screen title={t('device')}><Card><Txt>{t('deviceId')}</Txt><Txt muted>{device.deviceId}</Txt><Txt>{t('syncUnavailable')}</Txt></Card></Screen>; }

