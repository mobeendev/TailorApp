import React from 'react';
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextProps, type TextInputProps, type TextStyle } from 'react-native';
import { isLoaded } from 'expo-font';
import { useStore } from '../store';

/**
 * Bundled fonts, loaded once in the root layout. Every weight is registered as its own family so
 * Android never synthesizes bold. Inter is used for English, numbers and Latin names; Noto Nastaliq
 * Urdu gives Urdu the Nastaliq letterforms Urdu readers expect.
 */
export const appFonts = {
    'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
    'NotoNastaliqUrdu-Regular': require('../../assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
    'NotoNastaliqUrdu-SemiBold': require('../../assets/fonts/NotoNastaliqUrdu-SemiBold.ttf'),
    'NotoNastaliqUrdu-Bold': require('../../assets/fonts/NotoNastaliqUrdu-Bold.ttf'),
};

/** Nastaliq stacks letters diagonally and needs about twice the font size per line to avoid clipping. */
const URDU_LINE = 2;
/** Line height a label of `fontSize` occupies, so grids can reserve equal space in either language. */
export function lineHeightFor(fontSize: number, language: string, latinLineHeight: number) {
    return language === 'ur' ? Math.max(latinLineHeight, Math.round(fontSize * URDU_LINE)) : latinLineHeight;
}

const arabicScript = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

function weightOf(style: TextStyle) {
    const weight = style.fontWeight;
    if (weight === 'bold') return 700;
    if (weight === undefined || weight === 'normal') return 400;
    return Number(weight) || 400;
}

/** Plain text of simple children, or null when they contain elements. */
function plainText(children: React.ReactNode): string | null {
    if (children === null || children === undefined || typeof children === 'boolean') return '';
    if (typeof children === 'string' || typeof children === 'number') return String(children);
    if (Array.isArray(children)) {
        let text = '';
        for (const child of children) {
            const part = plainText(child);
            if (part === null) return null;
            text += part;
        }
        return text;
    }
    return null;
}

function latinStyle(style: TextStyle): TextStyle {
    const weight = weightOf(style);
    if (!isLoaded('Inter-Regular')) return {};
    return { fontFamily: weight >= 700 ? 'Inter-Bold' : weight >= 600 ? 'Inter-SemiBold' : weight >= 500 ? 'Inter-Medium' : 'Inter-Regular', fontWeight: 'normal' };
}

function urduStyle(style: TextStyle): TextStyle {
    if (!isLoaded('NotoNastaliqUrdu-Regular')) return {};
    const weight = weightOf(style);
    // Nastaliq gets hard to read below 13px.
    const fontSize = Math.max(style.fontSize ?? 14, 13);
    return {
        fontFamily: weight >= 700 ? 'NotoNastaliqUrdu-Bold' : weight >= 600 ? 'NotoNastaliqUrdu-SemiBold' : 'NotoNastaliqUrdu-Regular',
        fontWeight: 'normal',
        fontSize,
        lineHeight: lineHeightFor(fontSize, 'ur', style.lineHeight ?? 0),
        // Letter spacing breaks the joins between Urdu letters.
        letterSpacing: 0,
    };
}

/**
 * Text with Urdu letters uses Nastaliq in either language (so "اردو" reads correctly on English
 * screens); text without them uses Inter (numbers, phone numbers, English names). Mixed element
 * children follow the screen language.
 */
function fontStyle(style: TextProps['style'], language: string, text: string | null): TextStyle {
    const flat = StyleSheet.flatten(style) ?? {};
    return (text === null ? language === 'ur' : arabicScript.test(text)) ? urduStyle(flat) : latinStyle(flat);
}

export function Text({ style, children, ...props }: TextProps) {
    const { device } = useStore();
    return <NativeText {...props} style={[style, fontStyle(style, device.language, plainText(children))]}>{children}</NativeText>;
}

export function TextInput({ style, ...props }: TextInputProps) {
    const { device } = useStore();
    const numeric = ['decimal-pad', 'number-pad', 'numeric', 'phone-pad'].includes(props.keyboardType ?? 'default');
    // Numeric fields stay in Inter; other fields follow what is typed (or the placeholder while empty).
    const sample = numeric ? '' : props.value || (device.language === 'ur' ? props.placeholder || 'ا' : '');
    return <NativeTextInput {...props} style={[style, fontStyle(style, device.language, sample)]}/>;
}
