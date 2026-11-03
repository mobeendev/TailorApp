import { type Context, type Template, type Workshop } from './model.ts';
import { seedTemplate } from './templates.ts';

export const AVAILABLE_TEMPLATE_KEY = 'shalwar-kameez';

/** Select one existing template deterministically without changing historical records. */
export function availableTemplate(data: Workshop, shopId: string): Template | undefined {
    return data.templates.filter(template => template.shopId === shopId && template.systemKey === AVAILABLE_TEMPLATE_KEY && template.isActive && !template.archived)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))[0];
}

/** Add the available template only when a completed shop does not already have one. */
export function ensureAvailableTemplate(data: Workshop, ctx: Context, shopId: string): Workshop {
    const shop = data.shops.find(item => item.id === shopId && item.setupComplete && !item.archived);
    if (!shop || availableTemplate(data, shopId)) return data;
    const next = structuredClone(data);
    const { template, version } = seedTemplate(ctx, shopId, AVAILABLE_TEMPLATE_KEY, shop.defaultUnit);
    next.templates.push(template);
    next.templateVersions.push(version);
    return next;
}
