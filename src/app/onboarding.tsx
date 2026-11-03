import React, { useState } from 'react';
import { router } from 'expo-router';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Choice, Notice, Row, Screen, Txt } from '../components/ui';
import { ShopForm, type Profile } from '../components/ShopForm';
import { BrandEmblem } from '../components/Brand';
import { View } from 'react-native';
import { languages } from '../localization';
import { library, seedTemplate } from '../domain/templates';
import { AVAILABLE_TEMPLATE_KEY, availableTemplate } from '../domain/availableTemplate';
import { createShop } from '../domain/services';
export default function Onboarding() {
    const store = useStore();
    const shop = useShop();
    const t = useI18n();
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
    return <Screen key={step} title={t('onboarding')} back={false}><Txt muted>{step + 1} / 3</Txt><Txt title>{t(['chooseLanguage', 'shop', 'setupReview'][step])}</Txt>
 {step === 0 && <><View style={{ alignItems: 'center', paddingVertical: 10, gap: 12 }}><BrandEmblem size={130}/><Txt title>{t('app')}</Txt><Txt muted>{t('brandPromise')}</Txt></View><Choice value={store.device.language} onChange={async (language) => { try {
        await store.setDevice({ ...store.device, language: language as typeof store.device.language });
    }
    catch {
        setError('saveFailed');
    } }} options={languages.map(l => ({ value: l.code, label: l.name }))}/><Txt muted>{t('translationNotice')}</Txt></>}
 {step === 1 && <ShopForm value={profile} onChange={setProfile} onError={setError}/>}
 {step === 2 && <Card><Txt>{t('setupSummary')}</Txt><Txt title>{profile.name}</Txt><Txt>{profile.ownerName} · {profile.phone}</Txt><Txt>{profile.currency} / {t(profile.defaultUnit)}</Txt><Txt>{store.device.language === 'ur' ? library[0].ur : library[0].en}</Txt><Txt muted>{t('singleTemplateNote')}</Txt></Card>}
 <Notice error={error}/><Row>{step > 0 && <Button secondary title={t('back')} onPress={() => setStep(s => s - 1)}/>}<Button title={t(step === 2 ? 'finish' : 'next')} onPress={step === 2 ? finish : next}/></Row></Screen>;
}

