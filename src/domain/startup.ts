import { normalizeTheme } from './themes.ts';
import type { DeviceSettings, Workshop } from './model.ts';
/** Completed shops take precedence over an abandoned setup; never create a new shop on startup. */
export function resolveStartup(data: Workshop, settings: DeviceSettings): DeviceSettings {
    settings = { ...settings, theme: normalizeTheme(settings.theme) };
    const active = data.shops.find(s => s.id === settings.activeShopId && !s.archived);
    if (active?.setupComplete)
        return settings;
    const completed = data.shops.filter(s => s.setupComplete && !s.archived);
    if (completed.length === 1)
        return { ...settings, activeShopId: completed[0].id };
    if (completed.length > 1)
        return { ...settings, activeShopId: '' };
    return { ...settings, activeShopId: active?.id ?? data.shops.find(s => !s.archived)?.id ?? '' };
}
export function startupError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return /Access Handle|AccessHandle|VFS state|Writable stream/.test(message) ? 'storageBusy' : message;
}

