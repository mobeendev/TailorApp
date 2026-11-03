import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { type Context, type DeviceSettings, type Workshop, emptyWorkshop } from './domain/model';
import { openRepository } from './database/connection';
import { type Repository } from './database/repository';
import { migrateLegacy } from './database/legacy';
import { translate } from './localization';
import { resolveStartup, startupError } from './domain/startup';
import { getPalette, normalizeTheme } from './domain/themes';
import { isWalkthrough } from './database/mode';
import { ensureAvailableTemplate } from './domain/availableTemplate';
import { addPaperFormFields } from './domain/paperForm';
interface Store {
    data: Workshop;
    device: DeviceSettings;
    ctx: Context;
    loading: boolean;
    error: string;
    busy: boolean;
    setDevice: (d: DeviceSettings) => Promise<void>;
    commit: (data: Workshop) => Promise<void>;
    restore: (data: Workshop) => Promise<void>;
    retry: () => void;
}
const StoreContext = createContext<Store>(null!);
export function StoreProvider({ children }: {
    children: React.ReactNode;
}) {
    const [data, setData] = useState(emptyWorkshop);
    const [device, updateDevice] = useState<DeviceSettings>({ deviceId: '', language: 'en', activeShopId: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const repo = useRef<Repository | null>(null);
    const lock = useRef(false);
    useEffect(() => {
        let live = true;
        (async () => {
            setLoading(true);
            setError('');
            const repository = await openRepository();
            repo.current = repository;
            let settings = await repository.getDevice() ?? { deviceId: Crypto.randomUUID(), language: 'en' as const, activeShopId: '' };
            let snapshot = await repository.load();
            if (!snapshot.shops.length && !(await repository.marked('legacy-v1'))) {
                const raw = isWalkthrough ? null : await AsyncStorage.getItem('tailorapp.workshop.v1');
                if (raw) {
                    const imported = migrateLegacy(raw, { id: Crypto.randomUUID, now: () => new Date().toISOString(), deviceId: settings.deviceId });
                    await repository.save(imported.state);
                    snapshot = imported.state;
                    settings = { ...settings, language: imported.language, activeShopId: imported.shopId };
                }
                await repository.mark('legacy-v1');
            }
            if (!(await repository.marked('paper-form-fields-v1'))) {
                const upgraded = addPaperFormFields(snapshot, { id: Crypto.randomUUID, now: () => new Date().toISOString(), deviceId: settings.deviceId });
                if (upgraded !== snapshot) { await repository.save(upgraded); snapshot = upgraded; }
                await repository.mark('paper-form-fields-v1');
            }
            settings = resolveStartup(snapshot, settings);
            const prepared = ensureAvailableTemplate(snapshot, { id: Crypto.randomUUID, now: () => new Date().toISOString(), deviceId: settings.deviceId }, settings.activeShopId);
            if (prepared !== snapshot) { await repository.save(prepared); snapshot = prepared; }
            await repository.saveDevice(settings);
            if (live) {
                setData(snapshot);
                updateDevice(settings);
                setLoading(false);
            }
        })().catch(e => { if (live) {
            setError(startupError(e));
            setLoading(false);
        } });
        return () => { live = false; };
    }, [attempt]);
    async function commit(next: Workshop) { if (lock.current)
        throw new Error('saving'); lock.current = true; setBusy(true); try {
        await repo.current!.save(next);
        setData(next);
    }
    finally {
        lock.current = false;
        setBusy(false);
    } }
    async function restore(next: Workshop) { if (lock.current)
        throw new Error('saving'); lock.current = true; setBusy(true); try {
        await repo.current!.restoreShop(ensureAvailableTemplate(next, { id: Crypto.randomUUID, now: () => new Date().toISOString(), deviceId: device.deviceId }, device.activeShopId), device.activeShopId);
        setData(await repo.current!.load());
    }
    finally {
        lock.current = false;
        setBusy(false);
    } }
    async function setDevice(next: DeviceSettings) { next = { ...next, theme: normalizeTheme(next.theme) }; const prepared = ensureAvailableTemplate(data, { id: Crypto.randomUUID, now: () => new Date().toISOString(), deviceId: next.deviceId }, next.activeShopId); if (prepared !== data) { await repo.current!.save(prepared); setData(prepared); } await repo.current!.saveDevice(next); updateDevice(next); }
    return <StoreContext.Provider value={{ data, device, ctx: { id: Crypto.randomUUID, now: () => new Date().toISOString(), deviceId: device.deviceId }, loading, error, busy, commit, restore, setDevice, retry: () => setAttempt(n => n + 1) }}>{children}</StoreContext.Provider>;
}
export const useStore = () => useContext(StoreContext);
export function useI18n() { const { device } = useStore(); return (key: string) => translate(device.language, key); }
export function useShop() { const { data, device } = useStore(); return data.shops.find(s => s.id === device.activeShopId); }
export function usePalette() { const { device } = useStore(); return getPalette(device.theme); }

