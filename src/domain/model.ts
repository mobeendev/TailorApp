import type { ThemeName } from './themes.ts';
export type Language = 'en' | 'ur' | 'pa-Arab' | 'ps' | 'sd' | 'ar';
export type Unit = 'inch' | 'cm';
export type FieldType = 'decimal' | 'integer' | 'text' | 'multiline' | 'select' | 'radio' | 'checkbox' | 'date';
export type Value = string | number | boolean;
export type Labels = Partial<Record<Language, string>> & {
    en: string;
};
export interface RecordMeta {
    id: string;
    shopId: string;
    createdAt: string;
    updatedAt: string;
    recordVersion: number;
    deviceId: string;
    archived: boolean;
}
export interface Shop extends RecordMeta {
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    logoPath: string;
    currency: string;
    defaultUnit: Unit;
    setupComplete: boolean;
}
export interface Customer extends RecordMeta {
    name: string;
    phone: string;
    address: string;
    notes: string;
}
export interface Template extends RecordMeta {
    name: string;
    labels: Labels;
    systemKey?: string;
    activeVersion: number;
    isActive: boolean;
}
export interface Field {
    id: string;
    fieldKey: string;
    labels: Labels;
    type: FieldType;
    required: boolean;
    enabled: boolean;
    order: number;
    unit?: Unit;
    options: string[];
    helperText: string;
    defaultValue?: Value;
    min?: number;
    max?: number;
}
export interface TemplateVersion extends RecordMeta {
    templateId: string;
    version: number;
    fields: Field[];
}
export interface Measurement extends RecordMeta {
    customerId: string;
    templateId: string;
    templateVersion: number;
    values: Record<string, Value>;
    units: Record<string, Unit>;
}
export type OrderStatus = 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
export interface Order extends RecordMeta {
    customerId: string;
    orderNumber: string;
    deliveryDate: string;
    totalMinor: number;
    status: OrderStatus;
    instructions: string;
    currency: string;
}
export interface OrderItem extends RecordMeta {
    orderId: string;
    measurementId: string;
    garment: string;
    quantity: number;
}
export interface Payment extends RecordMeta {
    orderId: string;
    amountMinor: number;
}
export interface Workshop {
    schemaVersion: 2;
    shops: Shop[];
    customers: Customer[];
    templates: Template[];
    templateVersions: TemplateVersion[];
    measurements: Measurement[];
    orders: Order[];
    orderItems: OrderItem[];
    payments: Payment[];
}
export type DeviceSettings = {
    deviceId: string;
    language: Language;
    activeShopId: string;
    theme?: ThemeName;
};
export const emptyWorkshop = (): Workshop => ({ schemaVersion: 2, shops: [], customers: [], templates: [], templateVersions: [], measurements: [], orders: [], orderItems: [], payments: [] });
export type Context = {
    id: () => string;
    now: () => string;
    deviceId: string;
};
export function meta(ctx: Context, shopId: string): RecordMeta { return { id: ctx.id(), shopId, createdAt: ctx.now(), updatedAt: ctx.now(), recordVersion: 1, deviceId: ctx.deviceId, archived: false }; }

