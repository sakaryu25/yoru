import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon, Text as SvgText } from 'react-native-svg';

interface P { size?: number; color?: string; }
const D = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.8 };

const I = ({ size = 20, color = 'currentColor', children }: P & { children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>
);
const props = (color: string) => ({ ...D, stroke: color });

export const IcoHome        = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1z"/><Path {...props(color)} d="M9 21V12h6v9"/></I>;
export const IcoUsers       = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><Circle cx="9" cy="7" r="4" {...props(color)}/><Path {...props(color)} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></I>;
export const IcoEdit        = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><Path {...props(color)} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></I>;
export const IcoTarget      = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Circle cx="12" cy="12" r="10" {...props(color)}/><Circle cx="12" cy="12" r="6" {...props(color)}/><Circle cx="12" cy="12" r="2" {...props(color)}/></I>;
export const IcoSettings    = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Circle cx="12" cy="12" r="3" {...props(color)}/><Path {...props(color)} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></I>;
export const IcoChart       = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Line x1="18" y1="20" x2="18" y2="10" {...props(color)}/><Line x1="12" y1="20" x2="12" y2="4" {...props(color)}/><Line x1="6" y1="20" x2="6" y2="14" {...props(color)}/><Line x1="2" y1="20" x2="22" y2="20" {...props(color)}/></I>;
export const IcoAward       = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Circle cx="12" cy="8" r="6" {...props(color)}/><Path {...props(color)} d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></I>;
export const IcoTrendUp     = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" {...props(color)}/><Polyline points="17 6 23 6 23 12" {...props(color)}/></I>;
export const IcoSearch      = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Circle cx="11" cy="11" r="8" {...props(color)}/><Line x1="21" y1="21" x2="16.65" y2="16.65" {...props(color)}/></I>;
export const IcoPlus        = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Line x1="12" y1="5" x2="12" y2="19" {...props(color)}/><Line x1="5" y1="12" x2="19" y2="12" {...props(color)}/></I>;
export const IcoChevronLeft = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Polyline points="15 18 9 12 15 6" {...props(color)}/></I>;
export const IcoChevronRight= ({ size, color = '#fff' }: P) => <I size={size} color={color}><Polyline points="9 18 15 12 9 6" {...props(color)}/></I>;
export const IcoAlertCircle = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Circle cx="12" cy="12" r="10" {...props(color)}/><Line x1="12" y1="8" x2="12" y2="12" {...props(color)}/><Line x1="12" y1="16" x2="12.01" y2="16" {...props(color)}/></I>;
export const IcoLogOut      = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><Polyline points="16 17 21 12 16 7" {...props(color)}/><Line x1="21" y1="12" x2="9" y2="12" {...props(color)}/></I>;
export const IcoLogIn       = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><Polyline points="10 17 15 12 10 7" {...props(color)}/><Line x1="15" y1="12" x2="3" y2="12" {...props(color)}/></I>;
export const IcoBell        = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...props(color)} d="M13.73 21a2 2 0 01-3.46 0"/></I>;
export const IcoStar        = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" {...props(color)}/></I>;
export const IcoClock       = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Circle cx="12" cy="12" r="10" {...props(color)}/><Polyline points="12 6 12 12 16 14" {...props(color)}/></I>;
export const IcoKey         = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Circle cx="8" cy="15" r="4" {...props(color)}/><Path {...props(color)} d="M10.85 12.15L19 4"/><Path {...props(color)} d="M18 5l2 2M15 8l2 2"/></I>;
export const IcoBuilding    = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Rect x="2" y="3" width="20" height="18" rx="2" {...props(color)}/><Path {...props(color)} d="M8 10h.01M8 14h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 18v-2M12 18v-2M16 18v-2"/></I>;
export const IcoMoon        = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></I>;
export const IcoDownload    = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><Polyline points="7 10 12 15 17 10" {...props(color)}/><Line x1="12" y1="15" x2="12" y2="3" {...props(color)}/></I>;
export const IcoFire        = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></I>;
export const IcoCheck       = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Polyline points="20 6 9 17 4 12" {...props(color)}/></I>;
export const IcoX           = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Line x1="18" y1="6" x2="6" y2="18" {...props(color)}/><Line x1="6" y1="6" x2="18" y2="18" {...props(color)}/></I>;
export const IcoEye         = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3" {...props(color)}/></I>;
export const IcoEyeOff      = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><Path {...props(color)} d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><Line x1="1" y1="1" x2="23" y2="23" {...props(color)}/></I>;

export const IcoSparkles = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><Path {...props(color)} d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/><Path {...props(color)} d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z"/></I>;

export const IcoCocktail =({ size, color = '#fff' }: P) => <I size={size} color={color}><Polyline points="4 2 20 2 12 14 12 21" {...props(color)}/><Line x1="9" y1="21" x2="15" y2="21" {...props(color)}/><Line x1="5" y1="7" x2="19" y2="7" {...props(color)}/></I>;
export const IcoDiamond  = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M6 3h12l4 7-10 12L2 10z"/><Polyline points="2 10 6 3 18 3 22 10" {...props(color)}/></I>;
export const IcoCrown    = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Polyline points="2 20 4 9 12 15 18 4 20 20" {...props(color)}/><Line x1="2" y1="20" x2="22" y2="20" {...props(color)}/></I>;
export const IcoGift     = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Rect x="3" y="11" width="18" height="10" rx="1" {...props(color)}/><Path {...props(color)} d="M21 11H3V8a1 1 0 011-1h16a1 1 0 011 1v3z"/><Line x1="12" y1="22" x2="12" y2="7" {...props(color)}/><Path {...props(color)} d="M12 7c0-3 2-5 4-4 2 1 1.5 3-1 4M12 7c0-3-2-5-4-4-2 1-1.5 3 1 4"/></I>;
export const IcoCamera   = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><Circle cx="12" cy="13" r="4" {...props(color)}/></I>;
export const IcoWine     = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Path {...props(color)} d="M8 22h8M12 11v11M4 3h16l-2 8a6 6 0 01-12 0L4 3z"/><Line x1="6" y1="7" x2="18" y2="7" {...props(color)}/></I>;
export const IcoYen      = ({ size, color = '#fff' }: P) => <I size={size} color={color}><Rect x="2" y="6" width="20" height="12" rx="2" {...props(color)}/><Circle cx="12" cy="12" r="3" {...props(color)}/><Line x1="2" y1="12" x2="6" y2="12" {...props(color)}/><Line x1="18" y1="12" x2="22" y2="12" {...props(color)}/></I>;

export function MedalIcon({ place, size = 24 }: { place: number; size?: number }) {
  const colors = ['#D4AF37', '#94A3B8', '#B45309'];
  const color = colors[place - 1] ?? '#6B7280';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="9" r="6" stroke={color} strokeWidth={1.6} />
      <SvgText x="12" y="12.5" textAnchor="middle" fontSize="7" fontWeight="900" fill={color}>{place}</SvgText>
      <Path d="M8.5 14.5L7 21l5-2.5 5 2.5-1.5-6.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
