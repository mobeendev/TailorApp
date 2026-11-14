import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, ClipboardCheck, Eye, EyeOff, History, Pencil, Ruler, Save, Shirt, StickyNote, UserPlus } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Avatar, Button, Card, IconWell, InfoRow, Input, Notice, Pair, Pill, Screen, SearchInput, Txt, tones, useColors } from '../components/ui';
import { Text } from '../components/AppText';
import { DeliveryDate } from '../components/DeliveryDate';
import { formatDay } from '../components/Calendar';
import { createOrder, saveMeasurement } from '../domain/services';
import { copyMeasurement } from '../domain/measurementHistory';
import { DynamicForm } from '../components/DynamicForm';
import type { Field, Value } from '../domain/model';
import { label, rtl } from '../localization';
import { garmentName, displayTimestamp } from '../domain/displayNames';
import { findCustomers } from '../domain/ease';
import { withRecordDefaults } from '../domain/recordDefaults';
import { formatMoney, money, validateValues } from '../domain/validation';

/** Label on one side, value on the other. */
function Line({ name, value, strong = false, color }: { name: string; value: string; strong?: boolean; color?: string }) {
    const { device } = useStore(); const colors = useColors();
    return <View style={{ flexDirection: rtl(device.language) ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Txt muted>{name}</Txt></View><Text style={{ fontSize: strong ? 18 : 16, fontWeight: strong ? '700' : '600', color: color ?? colors.ink, fontVariant: ['tabular-nums'] }}>{value}</Text></View>;
}

export default function OrderEdit() {
    const params = useLocalSearchParams<{ customerId?: string; measurementId?: string }>();
    const store = useStore(); const shop = useShop()!; const t = useI18n(); const colors = useColors();
    const [customerId, setCustomerId] = useState(params.customerId ?? '');
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<Record<string, number>>({});
    const [draft, setDraft] = useState<{ sourceId: string; templateId: string; fields: Field[]; values: Record<string, Value>; skipped: number } | null>(null);
    const [expandedMeasurement, setExpandedMeasurement] = useState<string | null>(null);
    const [measurementErrors, setMeasurementErrors] = useState<Record<string, string>>({});
    const [showCustomers, setShowCustomers] = useState(!params.customerId);
    const [showHistory, setShowHistory] = useState(false);
    const [lastParams, setLastParams] = useState({ customerId: params.customerId, measurementId: params.measurementId });
    if (params.customerId !== lastParams.customerId || params.measurementId !== lastParams.measurementId) {
        setLastParams({ customerId: params.customerId, measurementId: params.measurementId });
        if (params.customerId && params.customerId !== lastParams.customerId) {
            setCustomerId(params.customerId); setItems({}); setDraft(null); setQuery(''); setShowCustomers(false); setShowHistory(false);
        }
        if (params.customerId && params.measurementId && store.data.measurements.some(m => m.id === params.measurementId && m.customerId === params.customerId && m.shopId === shop.id)) {
            setCustomerId(params.customerId); setItems(current => ({ ...current, [params.measurementId!]: 1 })); setShowCustomers(false); setExpandedMeasurement(params.measurementId);
        }
    }
    const [delivery, setDelivery] = useState(''); const [total, setTotal] = useState('');
    const [advance, setAdvance] = useState('0'); const [notes, setNotes] = useState('');
    const [error, setError] = useState(''); const [review, setReview] = useState(false);
    const customer = store.data.customers.find(c => c.id === customerId && c.shopId === shop.id);
    const measurements = store.data.measurements.filter(m => m.customerId === customerId && m.shopId === shop.id && !m.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    const shownMeasurements = measurements.filter((m, index) => showHistory || index === 0 || items[m.id] !== undefined || draft?.sourceId === m.id);
    let balance = '—'; try { balance = formatMoney(money(total) - money(advance)); } catch { }
    function build() { return createOrder(store.data, store.ctx, shop.id, customerId, Object.entries(items).map(([measurementId, quantity]) => ({ measurementId, quantity })), delivery, total, advance, notes); }
    const dir = rtl(store.device.language) ? 'row-reverse' as const : 'row' as const;
    return <Screen compact key={String(review)} title={t(review ? 'orderSummary' : 'newOrder')}>
        {review ? <Card>
            <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><Avatar name={customer?.name ?? ''}/><View style={{ flex: 1 }}><Txt title>{customer?.name}</Txt></View></View>
            <InfoRow icon={CalendarDays}>{t('delivery')}: {formatDay(delivery, store.device.language) || delivery}</InfoRow>
            {Object.entries(items).map(([id, quantity]) => { const m = measurements.find(m => m.id === id)!; return <InfoRow key={id} icon={Shirt}>{garmentName(store.data.templates.find(template => template.id === m.templateId)?.name ?? '', store.device.language)} × {quantity} · {displayTimestamp(m.createdAt, store.device.language)} · {m.id.slice(-4)}</InfoRow>; })}
            {notes ? <InfoRow icon={StickyNote}>{notes}</InfoRow> : null}
            <View style={{ height: 1, backgroundColor: colors.line }}/>
            <Line name={t('total')} value={`${shop.currency} ${total}`}/>
            <Line name={t('advance')} value={`${shop.currency} ${advance}`}/>
            <Line strong name={t('remaining')} value={`${shop.currency} ${balance}`} color={tones.danger.fg}/>
        </Card> : <>
            <Card compact><Txt heading>{t('selectCustomer')}</Txt>
                {customer && !showCustomers ? <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><Avatar name={customer.name}/><View style={{ flex: 1, gap: 2 }}><Txt strong>{customer.name}</Txt>{customer.phone ? <Txt muted>{customer.phone}</Txt> : null}</View><Button secondary compact disabled={Boolean(draft)} title={t('changeCustomer')} onPress={() => setShowCustomers(true)}/></View> : <>
                    <SearchInput label={t('search')} value={query} onChange={setQuery}/>
                    {(() => { const matches = findCustomers(store.data, shop.id, query); const choose = (v: string) => { if (v !== customerId) { setCustomerId(v); setItems({}); setDraft(null); setExpandedMeasurement(null); setShowHistory(false); setMeasurementErrors({}); } setShowCustomers(false); }; return <>{matches.length > 20 && <Txt muted>{t('refineCustomerSearch')}</Txt>}
                        {matches.length > 0 && <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, overflow: 'hidden' }}>{matches.slice(0, 20).map((c, index) => { const on = c.id === customerId; return <Pressable key={c.id} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={c.phone ? `${c.name} · ${c.phone}` : c.name} onPress={() => choose(c.id)} style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: index ? 1 : 0, borderColor: colors.line, backgroundColor: on || pressed ? colors.mint : colors.card })}><View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}><Avatar name={c.name} size={40}/><View style={{ flex: 1 }}><Txt strong lines={1}>{c.name}</Txt>{c.phone ? <Txt muted>{c.phone}</Txt> : null}</View>{on && <Check size={20} color={colors.green} strokeWidth={2.6}/>}</View></Pressable>; })}</View>}
                        {!matches.length && <Txt muted>{t('noResults')}</Txt>}</>; })()}
                    <Button secondary icon={UserPlus} title={t('newCustomer')} onPress={() => router.push({ pathname: '/customer-edit', params: { returnToOrder: '1' } })}/>
                </>}
            </Card>
            {customer && <><Txt heading>{t('selectMeasurement')}</Txt>
                {!measurements.length && <Card compact><Txt>{t('noMeasurements')}</Txt><Button secondary icon={Ruler} title={t('newMeasurement')} onPress={() => router.push({ pathname: '/measurement', params: { customerId, returnToOrder: '1' } })}/></Card>}
                {shownMeasurements.map((m, index) => {
                    const template = store.data.templates.find(item => item.id === m.templateId); if (!template) return null;
                    const editing = draft?.sourceId === m.id;
                    const selected = items[m.id] !== undefined;
                    const version = store.data.templateVersions.find(v => v.templateId === m.templateId && v.version === m.templateVersion && v.shopId === shop.id);
                    return <Card compact key={m.id}>
                        <View style={{ flexDirection: dir, alignItems: 'center', gap: 12 }}>
                            <IconWell icon={selected ? Check : Shirt} color={selected ? tones.success.fg : undefined} bg={selected ? tones.success.bg : undefined}/>
                            <View style={{ flex: 1, gap: 2 }}><Txt strong>{label(template.labels, store.device.language)}</Txt><Txt muted>{displayTimestamp(m.createdAt, store.device.language)} · {m.id.slice(-4)}</Txt></View>
                        </View>
                        {(index === 0 || selected) && <View style={{ flexDirection: dir, flexWrap: 'wrap', gap: 6 }}>{index === 0 && <Pill label={t('latestMeasurement')} tone="info" icon={History}/>}{selected && <Pill label={t('measurementSelected')} tone="success" icon={Check}/>}</View>}
                        {!editing && <Pair><Button secondary compact disabled={Boolean(draft)} icon={selected ? undefined : Check} title={t(selected ? 'removeMeasurementFromOrder' : 'useSameMeasurement')} onPress={() => { setItems(current => { const next = { ...current }; if (next[m.id] !== undefined) delete next[m.id]; else next[m.id] = 1; return next; }); setError(''); }}/><Button secondary compact disabled={Boolean(draft) || !template.isActive || template.archived} icon={Pencil} title={t('updateMeasurement')} onPress={() => { try { const copy = copyMeasurement(store.data, shop.id, customerId, m.id); setDraft({ sourceId: m.id, templateId: copy.templateId, fields: copy.target.fields, values: withRecordDefaults(copy.target.fields, copy.values, store.data, shop.id), skipped: copy.skipped }); setMeasurementErrors({}); setExpandedMeasurement(null); setError(''); } catch { setError('copyUnavailable'); } }}/></Pair>}
                        {!editing && <Button secondary compact disabled={Boolean(draft)} icon={expandedMeasurement === m.id ? EyeOff : Eye} title={t(expandedMeasurement === m.id ? 'hideMeasurement' : 'viewMeasurement')} onPress={() => setExpandedMeasurement(expandedMeasurement === m.id ? null : m.id)}/>}
                        {expandedMeasurement === m.id && !editing && version && <DynamicForm garmentSections={template.systemKey === 'shalwar-kameez'} fields={version.fields} values={m.values} onChange={() => {}} readOnly/>}
                        {editing && <><Notice info="updateMeasurementHint"/>{draft.skipped > 0 && <Txt>{t('copyMeasurementHint')} {t('fieldsSkipped')}: {draft.skipped}</Txt>}
                            <DynamicForm garmentSections={template.systemKey === 'shalwar-kameez'} fields={draft.fields} values={draft.values} errors={measurementErrors} onChange={(key, value) => setDraft({ ...draft, values: { ...draft.values, [key]: value } })}/>
                            <Pair><Button secondary title={t('cancel')} onPress={() => { setDraft(null); setMeasurementErrors({}); }}/><Button icon={Save} title={t('saveUpdatedMeasurement')} onPress={async () => {
                                const fieldErrors = validateValues(draft.fields, draft.values); setMeasurementErrors(fieldErrors); if (Object.keys(fieldErrors).length) return;
                                try { const result = saveMeasurement(store.data, store.ctx, shop.id, customerId, draft.templateId, draft.values); await store.commit(result.state); setItems(current => { const next = { ...current }; const quantity = next[m.id] ?? 1; delete next[m.id]; next[result.measurementId] = quantity; return next; }); setDraft(null); setExpandedMeasurement(result.measurementId); setError(''); } catch (e) { setError((e as Error).message); }
                            }}/></Pair>
                        </>}
                        {selected && !editing && <Input label={t('quantity')} value={String(items[m.id])} numeric onChange={v => setItems({ ...items, [m.id]: Number(v) })}/>}
                    </Card>;
                })}
                {measurements.length > 1 && <Button secondary compact disabled={Boolean(draft)} icon={History} title={t(showHistory ? 'hideOlderMeasurements' : 'showOlderMeasurements')} onPress={() => setShowHistory(!showHistory)}/>}
                <Card compact><DeliveryDate value={delivery} onChange={setDelivery}/><Pair><Input label={`${t('total')} (${shop.currency})`} value={total} numeric onChange={setTotal}/><Input label={t('advance')} value={advance} numeric onChange={setAdvance}/></Pair><Line strong name={t('remaining')} value={`${shop.currency} ${balance}`} color={tones.danger.fg}/><Input label={t('instructions')} value={notes} multiline onChange={setNotes}/></Card>
            </>}
        </>}
        <Notice error={error}/>{review ? <Pair><Button secondary icon={Pencil} title={t('edit')} onPress={() => setReview(false)}/><Button icon={Save} title={t('save')} onPress={async () => { try { const result = build(); await store.commit(result.state); router.replace({ pathname: '/order', params: { id: result.orderId } }); } catch (e) { setError((e as Error).message); } }}/></Pair> : customer && <Button icon={ClipboardCheck} disabled={Boolean(draft)} title={t('review')} onPress={() => { try { build(); setError(''); setReview(true); } catch (e) { setError((e as Error).message); } }}/>}
    </Screen>;
}
