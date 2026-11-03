import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Customer, Order, loadWorkshop, saveWorkshop } from './src/storage';
const stages = ['New', 'Cutting', 'Stitching', 'Ready', 'Delivered'];
const urStages = ['نیا', 'کٹائی', 'سلائی', 'تیار', 'حوالہ کیا'];
export default function App() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved');
  const [retry, setRetry] = useState(0);
  const [orderCustomer, setOrderCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState('');
  const [urdu, setUrdu] = useState(false);
  const [tab, setTab] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState({ name: '', phone: '', chest: '', waist: '', length: '' });
  useEffect(() => {
    if (ready) return;
    let active = true;
    setLoadError(false);
    loadWorkshop().then(data => {
      if (!active) return;
      if (data) { setCustomers(data.customers); setOrders(data.orders); setUrdu(data.urdu); }
      setReady(true);
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    setSaveState('saving');
    saveWorkshop({ version: 1, customers, orders, urdu }).then(() => {
      if (active) setSaveState('saved');
    }).catch(() => { if (active) setSaveState('error'); });
    return () => { active = false; };
  }, [ready, customers, orders, urdu, retry]);
  const t = (en: string, ur: string) => urdu ? ur : en;
  const textStyle = { textAlign: urdu ? 'right' as const : 'left' as const, writingDirection: urdu ? 'rtl' as const : 'ltr' as const };
  function open(customer?: Customer) { setFormError(''); setEditing(customer ?? null); setDraft(customer ?? { name: '', phone: '', chest: '', waist: '', length: '' }); setModal(true); }
  function save() {
    if (!draft.name.trim()) return setFormError(t('Customer name is required', 'گاہک کا نام درج کریں'));
    for (const value of [draft.chest, draft.waist, draft.length]) {
      if (value && (!Number.isFinite(Number(value)) || Number(value) <= 0)) return setFormError(t('Enter positive measurements in inches', 'پیمائش انچ میں درست درج کریں'));
    }
    const customer = { ...draft, name: draft.name.trim(), id: editing?.id ?? Date.now() };
    setCustomers(current => editing ? current.map(c => c.id === editing.id ? customer : c) : [...current, customer]);
    setModal(false); setTab(1);
  }
  function addOrder(customer: Customer) { setOrderCustomer(customer); }
  function createOrder(customer: Customer, garment: string) { setOrderCustomer(null); setOrders(current => [...current, { id: Date.now(), customerId: customer.id, garment, status: 0 }]); setTab(2); }
  const labels = [t('Overview', 'خلاصہ'), t('Customers', 'گاہک'), t('Orders', 'آرڈرز')];
  if (!ready) return <SafeAreaView style={s.modalSafe}><View style={s.content}><Text style={s.title}>{loadError ? 'Unable to open workshop' : 'Opening your workshop…'}</Text>{loadError && <><Text style={s.body}>Your saved records have not been changed. Retry loading to continue.</Text><Pressable style={s.primary} onPress={() => setRetry(n => n + 1)}><Text style={s.primaryText}>Retry</Text></Pressable></>}</View></SafeAreaView>;
  return <SafeAreaView style={s.safe}>
    <StatusBar style="light" />
    <View style={s.header}><View><Text style={s.brand}>✂  {t('TAILOR / دفتر', 'درزی / TAILOR')}</Text><Text style={s.headerSub}>{t('A little more order. A perfect fit.', 'ہر پیمائش درست، ہر کام منظم۔')}</Text></View><Pressable accessibilityLabel="Switch language" onPress={() => setUrdu(!urdu)} style={s.language}><Text style={s.languageText}>{urdu ? 'English' : 'اردو'}</Text></Pressable></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={[s.eyebrow, textStyle]}>{t('YOUR WORKSHOP, AT A GLANCE', 'آپ کی دکان ایک نظر میں')}</Text>
      <Text style={[s.title, textStyle]}>{labels[tab]}</Text>
      {tab === 0 && <>
        <View style={s.hero}><Text style={[s.heroTitle, textStyle]}>{t('Made to measure.\nManaged with care.', 'ناپ کے مطابق۔\nتوجہ کے ساتھ۔')}</Text><Text style={[s.heroCopy, textStyle]}>{t('Keep your customers, measurements and orders together.', 'گاہک، پیمائش اور آرڈرز ایک جگہ رکھیں۔')}</Text><Pressable style={s.primary} onPress={() => open()}><Text style={s.primaryText}>＋ {t(customers.length ? 'Add a customer' : 'Add your first customer', 'گاہک شامل کریں')}</Text></Pressable></View>
        <View style={s.stats}>{[[customers.length, t('Customers', 'گاہک')], [orders.filter(o => o.status < 4).length, t('In progress', 'زیرِ تکمیل')], [orders.filter(o => o.status === 3).length, t('Ready', 'تیار')]].map(([value, label]) => <View key={label} style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.muted}>{label}</Text></View>)}</View>
        <Text style={[s.section, textStyle]}>{t('Your daily workflow', 'روزانہ کا کام')}</Text>
        {[t('01   Add a customer and their measurements', '۰۱   گاہک اور پیمائش درج کریں'), t('02   Create a garment order', '۰۲   لباس کا آرڈر بنائیں'), t('03   Track cutting, stitching and delivery', '۰۳   کٹائی، سلائی اور حوالگی دیکھیں')].map(line => <View key={line} style={s.card}><Text style={[s.body, textStyle]}>{line}</Text></View>)}
      </>}
      {tab === 1 && <>
        <TextInput accessibilityLabel={t('Search customers', 'گاہک تلاش کریں')} placeholder={t('Search by name or phone', 'نام یا فون سے تلاش کریں')} value={search} onChangeText={setSearch} style={[s.input, textStyle]} />
        <Pressable style={s.primary} onPress={() => open()}><Text style={s.primaryText}>＋ {t('New customer', 'نیا گاہک')}</Text></Pressable>
        {customers.length === 0 && <Text style={[s.empty, textStyle]}>{t('Your customer book starts here. Add a customer to save their measurements.', 'اپنا پہلا گاہک شامل کر کے پیمائش درج کریں۔')}</Text>}
        {customers.filter(c => `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase())).map(c => <View key={c.id} style={s.card}><Text style={[s.section, textStyle]}>{c.name}</Text><Text style={[s.muted, textStyle]}>{c.phone || t('No phone added', 'فون درج نہیں')}</Text><Text style={[s.measurements, textStyle]}>{t('Chest', 'سینہ')} {c.chest || '—'}  ·  {t('Waist', 'کمر')} {c.waist || '—'}  ·  {t('Length', 'لمبائی')} {c.length || '—'} {t('in', 'انچ')}</Text><View style={s.actions}><Pressable style={s.secondary} onPress={() => open(c)}><Text style={s.link}>{t('Edit measurements', 'پیمائش تبدیل کریں')}</Text></Pressable><Pressable style={s.secondary} onPress={() => addOrder(c)}><Text style={s.link}>＋ {t('Order', 'آرڈر')}</Text></Pressable></View></View>)}
      </>}
      {tab === 2 && <>
        <Text style={[s.muted, textStyle]}>{t('Create orders from a customer’s card. Tap a status to move an order forward.', 'گاہک کے کارڈ سے آرڈر بنائیں۔ کام آگے بڑھانے کے لیے حالت دبائیں۔')}</Text>
        {orders.length === 0 && <><Text style={[s.empty, textStyle]}>{t('A clear workbench. Your orders will appear here.', 'ابھی کوئی آرڈر نہیں۔ آپ کے آرڈرز یہاں نظر آئیں گے۔')}</Text><Pressable style={s.primary} onPress={() => setTab(1)}><Text style={s.primaryText}>{t('Open customer book', 'گاہک کی فہرست کھولیں')}</Text></Pressable></>}
        {orders.map(o => <View key={o.id} style={s.card}><Text style={s.eyebrow}>#{String(o.id).slice(-6)}</Text><Text style={[s.section, textStyle]}>{customers.find(c => c.id === o.customerId)?.name}</Text><Text style={[s.muted, textStyle]}>{o.garment === 'Thobe' ? t('Thobe', 'ثوب') : t('Shalwar kameez', 'شلوار قمیض')}</Text><Pressable accessibilityLabel={t('Advance order status', 'آرڈر کی حالت آگے بڑھائیں')} disabled={o.status === 4} style={s.badge} onPress={() => setOrders(current => current.map(item => item.id === o.id ? { ...item, status: item.status + 1 } : item))}><Text style={s.link}>{(urdu ? urStages : stages)[o.status]} {o.status < 4 ? ' →' : ' ✓'}</Text></Pressable></View>)}
      </>}
      <Text accessibilityLiveRegion="polite" style={[s.note, textStyle]}>{saveState === 'saved' ? t('Saved on this device • No cloud backup', 'اس آلے پر محفوظ • کلاؤڈ بیک اپ نہیں') : saveState === 'saving' ? t('Saving…', 'محفوظ ہو رہا ہے…') : t('Could not save. Keep the app open and retry.', 'محفوظ نہیں ہوا۔ ایپ کھلی رکھیں اور دوبارہ کوشش کریں۔')}</Text>
      {saveState === 'error' && <Pressable style={s.secondary} onPress={() => setRetry(n => n + 1)}><Text style={s.link}>{t('Retry saving', 'دوبارہ محفوظ کریں')}</Text></Pressable>}
    </ScrollView>
    <View style={s.nav}>{labels.map((label, i) => <Pressable key={i} accessibilityRole="tab" accessibilityState={{ selected: tab === i }} style={[s.navItem, tab === i && s.navActive]} onPress={() => setTab(i)}><Text style={[s.navText, tab === i && s.link]}>{['▦', '♙', '☷'][i]}  {label}</Text></Pressable>)}</View>
    <Modal visible={orderCustomer !== null} transparent animationType="fade" onRequestClose={() => setOrderCustomer(null)}><View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0008', padding: 24 }}><View style={s.card}><Text style={s.section}>{t('Choose garment', 'لباس منتخب کریں')}</Text><Text style={s.body}>{orderCustomer?.name}</Text>{['Shalwar kameez', 'Thobe'].map(garment => <Pressable key={garment} style={s.primary} onPress={() => orderCustomer && createOrder(orderCustomer, garment)}><Text style={s.primaryText}>{garment === 'Thobe' ? t('Thobe', 'ثوب') : t('Shalwar kameez', 'شلوار قمیض')}</Text></Pressable>)}<Pressable style={s.secondary} onPress={() => setOrderCustomer(null)}><Text style={s.link}>{t('Cancel', 'منسوخ')}</Text></Pressable></View></View></Modal>
    <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}><SafeAreaView style={s.modalSafe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Pressable onPress={() => setModal(false)}><Text style={s.link}>{t('Close', 'بند کریں')} ×</Text></Pressable><Text style={[s.title, textStyle]}>{editing ? t('Customer details', 'گاہک کی تفصیل') : t('New customer', 'نیا گاہک')}</Text><Text style={[s.muted, textStyle]}>{t('Measurements are in inches. You can add them later.', 'پیمائش انچ میں ہے۔ آپ بعد میں بھی درج کر سکتے ہیں۔')}</Text>{(['name', 'phone', 'chest', 'waist', 'length'] as const).map((field, i) => <View key={field}><Text style={[s.fieldLabel, textStyle]}>{[t('Full name *', 'پورا نام *'), t('Phone', 'فون'), t('Chest (in)', 'سینہ (انچ)'), t('Waist (in)', 'کمر (انچ)'), t('Garment length (in)', 'لباس کی لمبائی (انچ)')][i]}</Text><TextInput style={[s.input, textStyle]} value={draft[field]} onChangeText={value => setDraft(current => ({ ...current, [field]: value }))} keyboardType={field === 'name' ? 'default' : field === 'phone' ? 'phone-pad' : 'decimal-pad'} /></View>)}{formError ? <Text accessibilityRole="alert" style={{ color: '#A33131' }}>{formError}</Text> : null}<Pressable style={s.primary} onPress={save}><Text style={s.primaryText}>{t('Save customer', 'گاہک محفوظ کریں')}</Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#123443' }, modalSafe: { flex: 1, backgroundColor: '#F5F6F2' },
  header: { padding: 22, paddingTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, brand: { color: '#fff', fontSize: 21, fontWeight: '800', letterSpacing: 1 }, headerSub: { color: '#B8CDD1', fontSize: 11, marginTop: 7 }, language: { padding: 10, borderRadius: 12, backgroundColor: '#294B58' }, languageText: { color: '#fff', fontWeight: '600' },
  content: { padding: 22, gap: 16, paddingBottom: 35, backgroundColor: '#F5F6F2', flexGrow: 1 }, eyebrow: { color: '#6A807F', fontSize: 10, letterSpacing: 1.6, fontWeight: '700' }, title: { fontSize: 32, color: '#123443', fontWeight: '700' }, hero: { backgroundColor: '#DFEDE5', padding: 24, borderRadius: 22, gap: 18 }, heroTitle: { color: '#123F38', fontSize: 29, lineHeight: 37, fontWeight: '600' }, heroCopy: { color: '#537169', fontSize: 14, lineHeight: 22 }, primary: { backgroundColor: '#24735B', padding: 16, borderRadius: 12, alignItems: 'center' }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 }, stats: { flexDirection: 'row', gap: 10 }, stat: { flex: 1, padding: 15, borderRadius: 16, backgroundColor: '#fff', gap: 7 }, statValue: { fontSize: 29, fontWeight: '600', color: '#123443' }, muted: { color: '#6A7B80', fontSize: 13, lineHeight: 21 }, section: { fontSize: 18, fontWeight: '600', color: '#123443' }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 19, gap: 10, borderWidth: 1, borderColor: '#E5EAE5' }, body: { color: '#3E555C', fontSize: 14, lineHeight: 23 }, nav: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, gap: 5 }, navItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 }, navActive: { backgroundColor: '#E4F0E8' }, navText: { fontSize: 12, color: '#7A8B90', fontWeight: '600' }, link: { color: '#24735B', fontWeight: '700', fontSize: 13 }, input: { borderWidth: 1, borderColor: '#D9E0DB', backgroundColor: '#fff', padding: 15, borderRadius: 12, fontSize: 16, color: '#123443' }, fieldLabel: { marginBottom: 8, color: '#45616A', fontSize: 13, fontWeight: '600' }, empty: { paddingVertical: 38, color: '#6A7B80', lineHeight: 25, fontSize: 16 }, actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, secondary: { paddingVertical: 12 }, measurements: { fontSize: 12, color: '#45616A', lineHeight: 22 }, badge: { alignSelf: 'flex-start', backgroundColor: '#E4F0E8', padding: 12, borderRadius: 10 }, note: { color: '#8A9694', fontSize: 11, lineHeight: 18, marginTop: 16 },
});
