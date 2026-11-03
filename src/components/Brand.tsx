import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { View } from 'react-native';
/** A vector maker's seal: a handwheel sewing machine framed by a stitched arch. */
export function BrandEmblem({ size = 48, light = false }: {
    size?: number;
    light?: boolean;
}) {
    const gold = light ? '#E7C88E' : '#AD8241';
    const ink = light ? '#F6EBDD' : '#20483F';
    return <Svg accessibilityLabel="Tailor Master sewing machine emblem" width={size} height={size} viewBox="0 0 100 100">
  <Circle cx="50" cy="50" r="46" stroke={gold} strokeWidth="1" fill={light ? '#FFFFFF06' : '#F5EBDD'}/>
  <Circle cx="50" cy="50" r="40" stroke={gold} strokeDasharray="2 4" strokeWidth="0.8" fill="none"/>
  <Path d="M25 65V43Q25 37 32 37H57V31H65V38Q75 40 75 50V65H57V51H38V61H33" fill="none" stroke={ink} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round"/>
  <Circle cx="74" cy="48" r="10" fill="none" stroke={gold} strokeWidth="3"/>
  <Circle cx="74" cy="48" r="3" fill={gold}/>
  <Path d="M31 43V65M26 68H78M23 73H81M39 58H56" stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
  <Line x1="49" y1="29" x2="49" y2="36" stroke={gold} strokeWidth="2"/><Rect x="44" y="25" width="10" height="5" rx="1" fill={gold}/>
  <Path d="M47 21L50 18L53 21L50 24Z" fill={gold}/>
 </Svg>;
}
export function StitchBorder() { return <View style={{ height: 9, backgroundColor: '#0D3935', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>{Array.from({ length: 28 }, (_, i) => <View key={i} style={{ width: 4, height: 4, backgroundColor: i % 2 ? '#B39155' : '#547168', transform: [{ rotate: '45deg' }], opacity: 0.65 }}/>)}</View>; }

