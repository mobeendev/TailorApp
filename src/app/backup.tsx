import React, { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { TextInput } from '../components/AppText';
import { useI18n, useShop, useStore } from '../store';
import { type Workshop } from '../domain/model';
import { Button, Card, Notice, Screen, Txt, useStyles } from '../components/ui';
import { decryptBackup, encryptBackup, shopSnapshot } from '../services/backup';
import { exportBackup, importBackup } from '../services/backupFiles';
export default function Backup() {
    const styles = useStyles();
    const store = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState<Workshop | null>(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [working, setWorking] = useState(false);
    async function run(fn: () => Promise<void>) { setWorking(true); setError(''); setMessage(''); try {
        await fn();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setWorking(false);
    } }
    return <Screen title={t('backup')}><Card><Txt>{t('backupHelp')}</Txt><Txt>{t('password')}</Txt><TextInput accessibilityLabel={t('password')} secureTextEntry value={password} onChangeText={setPassword} style={styles.input}/><Button disabled={working} title={t(working ? 'working' : 'exportBackup')} onPress={() => run(async () => { const encrypted = await encryptBackup(shopSnapshot(store.data, shop.id), password, Crypto.getRandomBytes); await exportBackup(encrypted); setMessage('backupExported'); setPassword(''); })}/><Button disabled={working} secondary title={t('importBackup')} onPress={() => run(async () => { const raw = await importBackup(); if (!raw)
        return; const data = await decryptBackup(raw, password); if (data.shops[0].id !== shop.id)
        throw new Error('shopMismatch'); setPending(data); })}/></Card>{pending && <Card><Txt title>{t('restoreConfirm')}</Txt><Txt>{pending.shops[0].name} · {pending.customers.length} {t('customers')} · {pending.orders.length} {t('orders')}</Txt><Txt>{t('restoreWarning')}</Txt><Button disabled={working} title={t('confirm')} onPress={() => run(async () => { await store.restore(pending); setPending(null); setPassword(''); setMessage('restoreDone'); })}/><Button secondary title={t('cancel')} onPress={() => setPending(null)}/></Card>}<Notice error={error}/>{Boolean(message) && <Txt>{t(message)}</Txt>}</Screen>;
}

