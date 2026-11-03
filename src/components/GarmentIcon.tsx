import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function GarmentIcon({ garment, color, size = 28 }: { garment: 'kameez' | 'shalwar'; color: string; size?: number }) {
    return <Svg width={size} height={size} viewBox="0 0 32 32">
        {garment === 'kameez' ? <>
            <Path d="M11 3 6.5 5 2.5 11l4 3 2-2v16h15V12l2 2 4-3-4-6L21 3" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M11 3c.5 2.4 2.2 4 5 4s4.5-1.6 5-4M16 7v8m-1.5-5h3M8.5 23v5m15-5v5" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </> : <>
            <Path d="M8 4h16l1 9 2.5 12-5 3-5-10L16 15l-1.5 3-5 10-5-3L7 13 8 4Z" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M8 7h16M13 7l1 3m5-3-1 3M6 24l5 2m10 0 5-2" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </>}
    </Svg>;
}
