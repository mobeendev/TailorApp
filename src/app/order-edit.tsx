import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { UserPlus, Ruler, ClipboardCheck, Save } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Choice, Input, Notice, Pair, Screen, SearchInput, Txt } from '../components/ui';
import { DeliveryDate } from '../components/DeliveryDate';
import { createOrder, saveMeasurement } from '../domain/services';
import { copyMeasurement } from '../domain/measurementHistory';
import { DynamicForm } from '../components/DynamicForm';
import type { Field, Value } from '../domain/model';
import { label } from '../localization';
import { garmentName, displayTimestamp } from '../domain/displayNames';
import { findCustomers } from '../domain/ease';
import { withRecordDefaults } from '../domain/recordDefaults';
import { formatMoney, money, validateValues } from '../domain/validation';

export default function OrderEdit() {
    const params = useLocalSearchParams<{ customerId?: string; measurementId?: string }>();
    const store = useStore(); const shop = useShop()!; const t = useI18n();
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
    return <Screen compact key={String(review)} title={t(review ? 'orderSummary' : 'newOrder')}>
        {review ? <Card compact><Txt title>{customer?.name}</Txt><Txt>{delivery} · {shop.currency}</Txt>{Object.entries(items).map(([id, quantity]) => { const m = measurements.find(m => m.id === id)!; return <Txt key={id}>{garmentName(store.data.templates.find(template => template.id === m.templateId)?.name ?? '', store.device.language)} × {quantity} · {displayTimestamp(m.createdAt, store.device.language)} · {m.id.slice(-4)}</Txt>; })}<Txt>{t('total')}: {total} · {t('advance')}: {advance}</Txt><Txt>{t('remaining')}: {balance}</Txt>{notes ? <Txt>{notes}</Txt> : null}</Card> : <>
            <Card compact><Txt title>{t('selectCustomer')}</Txt>
                {customer && !showCustomers ? <Pair><Txt>{customer.name}{customer.phone ? ` · ${customer.phone}` : ''}</Txt><Button secondary disabled={Boolean(draft)} title={t('changeCustomer')} onPress={() => setShowCustomers(true)}/></Pair> : <>
                    <SearchInput label={t('search')} value={query} onChange={setQuery}/>
                    {(() => { const matches = findCustomers(store.data, shop.id, query); return <>{matches.length > 20 && <Txt muted>{t('refineCustomerSearch')}</Txt>}<Choice value={customerId} options={matches.slice(0, 20).map(c => ({ value: c.id, label: c.phone ? `${c.name} · ${c.phone}` : c.name }))} onChange={v => { if (v !== customerId) { setCustomerId(v); setItems({}); setDraft(null); setExpandedMeasurement(null); setShowHistory(false); setMeasurementErrors({}); } setShowCustomers(false); }}/>{!matches.length && <Txt muted>{t('noResults')}</Txt>}</>; })()}
                    <Button secondary icon={UserPlus} title={t('newCustomer')} onPress={() => router.push({ pathname: '/customer-edit', params: { returnToOrder: '1' } })}/>
                </>}
            </Card>
            {customer && <><Txt title>{t('selectMeasurement')}</Txt>
                {!measurements.length && <Card compact><Txt>{t('noMeasurements')}</Txt><Button secondary icon={Ruler} title={t('newMeasurement')} onPress={() => router.push({ pathname: '/measurement', params: { customerId, returnToOrder: '1' } })}/></Card>}
                {shownMeasurements.map((m, index) => {
                    const template = store.data.templates.find(item => item.id === m.templateId); if (!template) return null;
                    const editing = draft?.sourceId === m.id;
                    const version = store.data.templateVersions.find(v => v.templateId === m.templateId && v.version === m.templateVersion && v.shopId === shop.id);
                    return <Card compact key={m.id}>
                        <Txt>{index === 0 ? `${t('latestMeasurement')} · ` : ''}{label(template.labels, store.device.language)} · {displayTimestamp(m.createdAt, store.device.language)} · {m.id.slice(-4)}</Txt>
                        {items[m.id] !== undefined && <Txt>{t('measurementSelected')}</Txt>}
                        {!editing && <Pair><Button secondary disabled={Boolean(draft)} title={t(items[m.id] !== undefined ? 'removeMeasurementFromOrder' : 'useSameMeasurement')} onPress={() => { setItems(current => { const next = { ...current }; if (next[m.id] !== undefined) delete next[m.id]; else next[m.id] = 1; return next; }); setError(''); }}/><Button secondary disabled={Boolean(draft) || !template.isActive || template.archived} title={t('updateMeasurement')} onPress={() => { try { const copy = copyMeasurement(store.data, shop.id, customerId, m.id); setDraft({ sourceId: m.id, templateId: copy.templateId, fields: copy.target.fields, values: withRecordDefaults(copy.target.fields, copy.values, store.data, shop.id), skipped: copy.skipped }); setMeasurementErrors({}); setExpandedMeasurement(null); setError(''); } catch { setError('copyUnavailable'); } }}/></Pair>}
                        {!editing && <Button secondary disabled={Boolean(draft)} title={t(expandedMeasurement === m.id ? 'hideMeasurement' : 'viewMeasurement')} onPress={() => setExpandedMeasurement(expandedMeasurement === m.id ? null : m.id)}/>}
                        {expandedMeasurement === m.id && !editing && version && <DynamicForm garmentSections={template.systemKey === 'shalwar-kameez'} fields={version.fields} values={m.values} onChange={() => {}} readOnly/>}
                        {editing && <><Txt muted>{t('updateMeasurementHint')}</Txt>{draft.skipped > 0 && <Txt>{t('copyMeasurementHint')} {t('fieldsSkipped')}: {draft.skipped}</Txt>}
                            <DynamicForm garmentSections={template.systemKey === 'shalwar-kameez'} fields={draft.fields} values={draft.values} errors={measurementErrors} onChange={(key, value) => setDraft({ ...draft, values: { ...draft.values, [key]: value } })}/>
                            <Pair><Button secondary title={t('cancel')} onPress={() => { setDraft(null); setMeasurementErrors({}); }}/><Button title={t('saveUpdatedMeasurement')} onPress={async () => {
                                const fieldErrors = validateValues(draft.fields, draft.values); setMeasurementErrors(fieldErrors); if (Object.keys(fieldErrors).length) return;
                                try { const result = saveMeasurement(store.data, store.ctx, shop.id, customerId, draft.templateId, draft.values); await store.commit(result.state); setItems(current => { const next = { ...current }; const quantity = next[m.id] ?? 1; delete next[m.id]; next[result.measurementId] = quantity; return next; }); setDraft(null); setExpandedMeasurement(result.measurementId); setError(''); } catch (e) { setError((e as Error).message); }
                            }}/></Pair>
                        </>}
                        {items[m.id] !== undefined && !editing && <Input label={t('quantity')} value={String(items[m.id])} numeric onChange={v => setItems({ ...items, [m.id]: Number(v) })}/>}
                    </Card>;
                })}
                {measurements.length > 1 && <Button secondary disabled={Boolean(draft)} title={t(showHistory ? 'hideOlderMeasurements' : 'showOlderMeasurements')} onPress={() => setShowHistory(!showHistory)}/>}
                <Card compact><DeliveryDate value={delivery} onChange={setDelivery}/><Pair><Input label={`${t('total')} (${shop.currency})`} value={total} numeric onChange={setTotal}/><Input label={t('advance')} value={advance} numeric onChange={setAdvance}/></Pair><Txt>{t('remaining')}: {shop.currency} {balance}</Txt><Input label={t('instructions')} value={notes} multiline onChange={setNotes}/></Card>
            </>}
        </>}
        <Notice error={error}/>{review ? <Pair><Button secondary title={t('edit')} onPress={() => setReview(false)}/><Button icon={Save} title={t('save')} onPress={async () => { try { const result = build(); await store.commit(result.state); router.replace({ pathname: '/order', params: { id: result.orderId } }); } catch (e) { setError((e as Error).message); } }}/></Pair> : customer && <Button icon={ClipboardCheck} disabled={Boolean(draft)} title={t('review')} onPress={() => { try { build(); setError(''); setReview(true); } catch (e) { setError((e as Error).message); } }}/>} 
    </Screen>;
}
