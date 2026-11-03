import React from 'react';
import { router } from 'expo-router';
import { Shirt } from 'lucide-react-native';
import { useI18n, useShop, useStore } from '../store';
import { Button, Card, Row, Screen, Txt } from '../components/ui';
import { label } from '../localization';
import { availableTemplate } from '../domain/availableTemplate';

export default function Templates() {
    const store = useStore();
    const shop = useShop()!;
    const t = useI18n();
    const template = availableTemplate(store.data, shop.id);
    const version = store.data.templateVersions.find(item => item.templateId === template?.id && item.version === template?.activeVersion);
    return <Screen title={t('templates')}>
        <Txt title>{t('singleTemplateTitle')}</Txt>
        <Txt muted>{t('singleTemplateNote')}</Txt>
        {template && <Card>
            <Row><Shirt size={28} color="#3C8067"/><Txt title>{label(template.labels, store.device.language)}</Txt></Row>
            <Txt muted>{t('version')} {template.activeVersion} · {version?.fields.filter(field => field.enabled).length ?? 0} {t('fieldCount')}</Txt>
            <Button title={t('edit')} onPress={() => router.push({ pathname: '/template-edit', params: { id: template.id } })}/>
            <Button secondary title={t('preview')} onPress={() => router.push({ pathname: '/template-edit', params: { id: template.id, preview: '1' } })}/>
        </Card>}
    </Screen>;
}
