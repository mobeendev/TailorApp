import React, { useState } from 'react';
import { router } from 'expo-router';
import { Check, Phone, Ruler, Shirt, User } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Choice, InfoRow, Notice, Pair, Screen, Txt, useColors } from '../components/ui';
import { ShopForm, type Profile } from '../components/ShopForm';
import { BrandEmblem } from '../components/Brand';
import { View } from 'react-native';
import { languages, rtl } from '../localization';
import { library, seedTemplate } from '../domain/templates';
import { AVAILABLE_TEMPLATE_KEY, availableTemplate } from '../domain/availableTemplate';
import { createShop } from '../domain/services';
export default function Onboarding() {
    const store = useStore();
    const shop = useShop();
    const t = useI18n();
    const colors = useColors();
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<Profile>(shop ?? { name: '', ownerName: '', phone: '', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' });
    const selected = [AVAILABLE_TEMPLATE_KEY];
    const [error, setError] = useState('');
    async function finish() { try {
        let next = structuredClone(store.data);
        let shopId = shop?.id;
        if (shop) {
            Object.assign(next.shops.find(s => s.id === shop.id)!, profile, { setupComplete: true, recordVersion: shop.recordVersion + 1, updatedAt: store.ctx.now(), deviceId: store.device.deviceId });
            for (const key of selected)
                if (!availableTemplate(next, shop.id)) {
                    const seeded = seedTemplate(store.ctx, shop.id, key, profile.defaultUnit);
                    next.templates.push(seeded.template);
                    next.templateVersions.push(seeded.version);
                }
        }
        else {
            const result = createShop(next, store.ctx, profile, selected);
            next = result.state;
            shopId = result.shopId;
        }
        await store.commit(next);
        await store.setDevice({ ...store.device, activeShopId: shopId! });
        router.replace('/');
    }
    catch (e) {
        setError((e as Error).message);
    } }
    function next() { setError(''); if (step === 1 && (!profile.name.trim() || !profile.ownerName.trim() || !profile.phone.trim() || !/^[A-Z]{3}$/.test(profile.currency)))
        return setError('shopRequired'); setStep(s => s + 1); }
    return <Screen key={step} title={t('onboarding')} back={false}>
 <View style={{ gap: 10 }}>
  <View style={{ flexDirection: rtl(store.device.language) ? 'row-reverse' : 'row', gap: 6 }}>{[0, 1, 2].map(i => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? colors.green : colors.line }}/>)}</View>
  <Txt muted>{step + 1} / 3</Txt>
 </View>
 <Txt title>{t(['chooseLanguage', 'shop', 'setupReview'][step])}</Txt>
 {step === 0 && <><View style={{ alignItems: 'center', paddingVertical: 8, gap: 10 }}><BrandEmblem size={120}/><Txt title center>{t('app')}</Txt><Txt muted center>{t('brandPromise')}</Txt></View><Card><Choice value={store.device.language} onChange={async (language) => { try {
        await store.setDevice({ ...store.device, language: language as typeof store.device.language });
    }
    catch {
        setError('saveFailed');
    } }} options={languages.map(l => ({ value: l.code, label: l.name }))}/><Txt muted>{t('translationNotice')}</Txt></Card></>}
 {step === 1 && <Card><ShopForm value={profile} onChange={setProfile} onError={setError}/></Card>}
 {step === 2 && <Card><Txt muted>{t('setupSummary')}</Txt><Txt title>{profile.name}</Txt><InfoRow icon={User}>{profile.ownerName}</InfoRow><InfoRow icon={Phone}>{profile.phone}</InfoRow><InfoRow icon={Ruler}>{profile.currency} / {t(profile.defaultUnit)}</InfoRow><InfoRow icon={Shirt}>{store.device.language === 'ur' ? library[0].ur : library[0].en}</InfoRow><Notice info="singleTemplateNote"/></Card>}
 <Notice error={error}/>
 {step > 0 ? <Pair><Button secondary title={t('back')} onPress={() => setStep(s => s - 1)}/><Button icon={step === 2 ? Check : undefined} title={t(step === 2 ? 'finish' : 'next')} onPress={step === 2 ? finish : next}/></Pair> : <Button title={t('next')} onPress={next}/>}
 </Screen>;
}
