import React from 'react';
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextProps, type TextInputProps, type TextStyle } from 'react-native';
import { isLoaded } from 'expo-font';
import { useStore } from '../store';

// The UI cut of Noto Naskh has compact metrics suited to controls and supports Urdu glyphs.
function urduTextStyle(style: TextProps['style']): TextStyle {
    const flattened = StyleSheet.flatten(style) ?? {};
    const weight = flattened.fontWeight;
    const bold = weight === 'bold' || (typeof weight === 'string' && Number(weight) >= 600) || (typeof weight === 'number' && weight >= 600);
    const fontSize = Math.max(flattened.fontSize ?? 14, 12);
    return {
        fontFamily: bold ? 'NotoNaskhArabicUI-Bold' : 'NotoNaskhArabicUI-Regular',
        fontWeight: 'normal',
        fontSize,
        // Avoid clipping Urdu marks where a screen specifies a tight Latin line height.
        ...(flattened.lineHeight ? { lineHeight: Math.max(flattened.lineHeight, Math.ceil(fontSize * 1.5)) } : {}),
        letterSpacing: 0,
    };
}

export function Text({ style, ...props }: TextProps) {
    const { device } = useStore();
    return <NativeText {...props} style={[style, device.language === 'ur' && isLoaded('NotoNaskhArabicUI-Regular') && isLoaded('NotoNaskhArabicUI-Bold') && urduTextStyle(style)]}/>;
}

export function TextInput({ style, ...props }: TextInputProps) {
    const { device } = useStore();
    return <NativeTextInput {...props} style={[style, device.language === 'ur' && isLoaded('NotoNaskhArabicUI-Regular') && isLoaded('NotoNaskhArabicUI-Bold') && urduTextStyle(style)]}/>;
}
