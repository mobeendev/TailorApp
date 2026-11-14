import React, { useState } from 'react';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { ArchiveRestore, FileDown, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { type Workshop } from '../domain/model';
import { Button, Card, IconWell, Input, Notice, Pair, Screen, Txt, tones } from '../components/ui';
import { rtl } from '../localization';
import { decryptBackup, encryptBackup, shopSnapshot } from '../services/backup';
import { exportBackup, importBackup } from '../services/backupFiles';
export default function Backup() {
    const store = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState<Workshop | null>(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [working, setWorking] = useState(false);
    const dir = rtl(store.device.language) ? 'row-reverse' as const : 'row' as const;
    async function run(fn: () => Promise<void>) { setWorking(true); setError(''); setMessage(''); try {
        await fn();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setWorking(false);
    } }
    return <Screen title={t('backup')}>
    <Card>
      <View style={{ flexDirection: dir, alignItems: 'flex-start', gap: 12 }}><IconWell icon={ShieldCheck} color="#0E7490" bg="#E0F4F7"/><View style={{ flex: 1 }}><Txt>{t('backupHelp')}</Txt></View></View>
      <Input label={t('password')} value={password} secure autoCapitalize="none" onChange={setPassword}/>
      <Button disabled={working} icon={FileDown} title={t(working ? 'working' : 'exportBackup')} onPress={() => run(async () => { const encrypted = await encryptBackup(shopSnapshot(store.data, shop.id), password, Crypto.getRandomBytes); await exportBackup(encrypted); setMessage('backupExported'); setPassword(''); })}/>
      <Button disabled={working} secondary icon={ArchiveRestore} title={t('importBackup')} onPress={() => run(async () => { const raw = await importBackup(); if (!raw)
        return; const data = await decryptBackup(raw, password); if (data.shops[0].id !== shop.id)
        throw new Error('shopMismatch'); setPending(data); })}/>
    </Card>
    {pending && <Card>
      <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><IconWell icon={TriangleAlert} color={tones.warning.fg} bg={tones.warning.bg}/><View style={{ flex: 1 }}><Txt heading>{t('restoreConfirm')}</Txt></View></View>
      <Txt strong>{pending.shops[0].name} · {pending.customers.length} {t('customers')} · {pending.orders.length} {t('orders')}</Txt>
      <Notice info="restoreWarning"/>
      <Pair><Button secondary title={t('cancel')} onPress={() => setPending(null)}/><Button tone="destructive" disabled={working} icon={ArchiveRestore} title={t('confirm')} onPress={() => run(async () => { await store.restore(pending); setPending(null); setPassword(''); setMessage('restoreDone'); })}/></Pair>
    </Card>}
    <Notice error={error} success={message}/>
  </Screen>;
}
