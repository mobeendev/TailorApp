import { emptyWorkshop, type DeviceSettings, type Workshop } from '../domain/model.ts';
import { validateWorkshop } from '../domain/validation.ts';
import { schema } from './schema.ts';
export interface DB {
    execAsync(sql: string): Promise<void>;
    runAsync(sql: string, ...params: (string | number | null)[]): Promise<unknown>;
    getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]>;
    withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
const tables = { shops: 'Shops', customers: 'Customers', templates: 'MeasurementTemplates', templateVersions: 'TemplateVersions', measurements: 'CustomerMeasurements', orders: 'Orders', orderItems: 'OrderItems', payments: 'Payments' } as const;
export class Repository {
    private queue: Promise<unknown> = Promise.resolve();
    private db: DB;
    constructor(db: DB) { this.db = db; }
    private serial<T>(fn: () => Promise<T>): Promise<T> { const job = this.queue.then(fn); this.queue = job.catch(() => { }); return job; }
    initialize() { return this.serial(async () => { const versions = await this.db.getAllAsync<{
        user_version: number;
    }>('PRAGMA user_version'); if (versions[0]?.user_version > 1)
        throw new Error('databaseNewer'); await this.db.execAsync(schema); }); }
    private async read() { const state = emptyWorkshop(); for (const [key, table] of Object.entries(tables)) {
        const rows = await this.db.getAllAsync<{
            data: string;
        }>(`SELECT data FROM ${table}`);
        (state[key as keyof typeof tables] as unknown[]) = rows.map(r => JSON.parse(r.data));
    } validateWorkshop(state); return state; }
    load() { return this.serial(() => this.read()); }
    save(state: Workshop) { return this.serial(() => this.persist(state)); }
    restoreShop(state: Workshop, shopId: string) {
        return this.serial(async () => {
            validateWorkshop(state);
            if (state.shops.length !== 1 || state.shops[0].id !== shopId)
                throw new Error('shopMismatch');
            const current = await this.read();
            if (!current.shops.some(s => s.id === shopId))
                throw new Error('shopMismatch');
            const combined = emptyWorkshop();
            for (const key of Object.keys(tables) as (keyof typeof tables)[])
                (combined[key] as unknown[]) = [...current[key].filter(r => r.shopId !== shopId), ...state[key]];
            await this.persist(combined, shopId);
        });
    }
    private async persist(state: Workshop, replaceShopId?: string) {
        validateWorkshop(state);
        await this.db.withTransactionAsync(async () => {
            if (replaceShopId) {
                await this.db.runAsync('DELETE FROM TemplateFields WHERE version_id IN (SELECT id FROM TemplateVersions WHERE shop_id=?)', replaceShopId);
                for (const table of ['Payments', 'OrderItems', 'Orders', 'CustomerMeasurements', 'TemplateVersions', 'MeasurementTemplates', 'Customers', 'SyncChanges', 'ShopSettings', 'Shops'])
                    await this.db.runAsync(`DELETE FROM ${table} WHERE shop_id=?`, replaceShopId);
            }
            const previous = await this.read();
            for (const [key, table] of Object.entries(tables)) {
                const records = state[key as keyof typeof tables];
                const prior = previous[key as keyof typeof tables];
                // Deletion is represented by tombstones; missing records are never silently discarded.
                if (prior.some(r => !records.some(n => n.id === r.id)))
                    throw new Error('recordRemoval');
                for (const record of records) {
                    const old = prior.find(p => p.id === record.id);
                    const payload = JSON.stringify(record);
                    if (old && JSON.stringify(old) === payload)
                        continue;
                    if (old && ['templateVersions', 'measurements', 'payments', 'orderItems'].includes(key))
                        throw new Error('immutableRecord');
                    if (old && record.recordVersion <= old.recordVersion)
                        throw new Error('staleRecord');
                    const r = record as unknown as Record<string, unknown>;
                    const columns: Record<string, string | number> = { id: record.id, shop_id: record.shopId };
                    if (key === 'shops' || key === 'customers' || key === 'templates')
                        columns.name = String(r.name);
                    if (key === 'customers') {
                        columns.phone = String(r.phone);
                        columns.archived = Number(r.archived);
                    }
                    if (key === 'templateVersions') {
                        columns.template_id = String(r.templateId);
                        columns.version = Number(r.version);
                    }
                    if (key === 'measurements') {
                        columns.customer_id = String(r.customerId);
                        columns.template_id = String(r.templateId);
                        columns.template_version = Number(r.templateVersion);
                        columns.measurements_json = JSON.stringify(r.values);
                    }
                    if (key === 'orders') {
                        columns.customer_id = String(r.customerId);
                        columns.delivery_date = String(r.deliveryDate);
                        columns.total_minor = Number(r.totalMinor);
                    }
                    if (key === 'orderItems') {
                        columns.order_id = String(r.orderId);
                        columns.measurement_id = String(r.measurementId);
                    }
                    if (key === 'payments') {
                        columns.order_id = String(r.orderId);
                        columns.amount_minor = Number(r.amountMinor);
                    }
                    columns.data = payload;
                    const cols = Object.keys(columns);
                    await this.db.runAsync(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${cols.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(',')}`, ...Object.values(columns));
                    if (key === 'templateVersions')
                        for (const f of (record as Workshop['templateVersions'][number]).fields)
                            await this.db.runAsync('INSERT INTO TemplateFields(id,version_id,field_key,field_type,is_required,display_order,field_config) VALUES (?,?,?,?,?,?,?)', f.id, record.id, f.fieldKey, f.type, Number(f.required), f.order, JSON.stringify(f));
                    if (key === 'shops')
                        await this.db.runAsync('INSERT INTO ShopSettings(shop_id,data) VALUES (?,?) ON CONFLICT(shop_id) DO UPDATE SET data=excluded.data', record.id, JSON.stringify({ currency: r.currency, defaultUnit: r.defaultUnit }));
                    await this.db.runAsync('INSERT INTO SyncChanges(record_id,shop_id,entity,record_version,device_id,data) VALUES (?,?,?,?,?,?)', record.id, record.shopId, key, record.recordVersion, record.deviceId, payload);
                }
            }
        });
    }
    getDevice() { return this.serial(async () => { const rows = await this.db.getAllAsync<{
        data: string;
    }>("SELECT data FROM DeviceSettings WHERE id='local'"); return rows[0] ? JSON.parse(rows[0].data) as DeviceSettings : null; }); }
    saveDevice(settings: DeviceSettings) { return this.serial(() => this.db.runAsync("INSERT INTO DeviceSettings(id,data) VALUES ('local',?) ON CONFLICT(id) DO UPDATE SET data=excluded.data", JSON.stringify(settings))); }
    marked(id: string) { return this.serial(async () => (await this.db.getAllAsync('SELECT id FROM MigrationMarkers WHERE id=?', id)).length > 0); }
    mark(id: string) { return this.serial(() => this.db.runAsync('INSERT OR IGNORE INTO MigrationMarkers(id) VALUES (?)', id)); }
}

