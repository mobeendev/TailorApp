import AsyncStorage from '@react-native-async-storage/async-storage';
export type Customer = {
    id: number;
    name: string;
    phone: string;
    chest: string;
    waist: string;
    length: string;
};
export type Order = {
    id: number;
    customerId: number;
    garment: string;
    status: number;
};
export type Workshop = {
    version: 1;
    customers: Customer[];
    orders: Order[];
    urdu: boolean;
};
const KEY = 'tailorapp.workshop.v1';
export function decodeWorkshop(raw: string): Workshop {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || typeof data.urdu !== 'boolean' || !Array.isArray(data.customers) || !Array.isArray(data.orders))
        throw new Error('Invalid workshop data');
    const ids = new Set<number>();
    for (const c of data.customers) {
        if (!c || !Number.isSafeInteger(c.id) || ids.has(c.id) || typeof c.name !== 'string' || !c.name.trim() || !['phone', 'chest', 'waist', 'length'].every(k => typeof c[k] === 'string') || !['chest', 'waist', 'length'].every(k => c[k] === '' || (Number.isFinite(Number(c[k])) && Number(c[k]) > 0)))
            throw new Error('Invalid customer');
        ids.add(c.id);
    }
    const orderIds = new Set<number>();
    for (const o of data.orders) {
        if (!o || !Number.isSafeInteger(o.id) || orderIds.has(o.id) || !ids.has(o.customerId) || !['Thobe', 'Shalwar kameez'].includes(o.garment) || !Number.isInteger(o.status) || o.status < 0 || o.status > 4)
            throw new Error('Invalid order');
        orderIds.add(o.id);
    }
    return data;
}
export async function loadWorkshop(): Promise<Workshop | null> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw === null ? null : decodeWorkshop(raw);
}
// Serialize writes so a slower older save cannot replace a newer snapshot.
let writes: Promise<void> = Promise.resolve();
export function saveWorkshop(data: Workshop): Promise<void> {
    const snapshot = JSON.stringify(data);
    writes = writes.catch(() => { }).then(() => AsyncStorage.setItem(KEY, snapshot));
    return writes;
}

