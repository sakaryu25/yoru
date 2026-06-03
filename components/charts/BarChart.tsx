import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { C } from '../ui';

export interface BarItem {
  label: string;
  value: number;
  highlight?: boolean;
}

interface Props {
  data: BarItem[];
  chartHeight?: number;
  goal?: number;
  barColor?: string;
  highlightColor?: string;
  formatVal?: (v: number) => string;
  showAllLabels?: boolean;
}

export function BarChart({
  data,
  chartHeight = 110,
  goal,
  barColor = '#2a2a2a',
  highlightColor = C.gold,
  formatVal = (v) => `${Math.round(v / 10000)}万`,
  showAllLabels = false,
}: Props) {
  const [w, setW] = useState(280);
  const H = chartHeight;
  const n = data.length;
  const gap = 6;
  const barW = Math.floor((w - gap * (n - 1)) / n);
  const maxVal = Math.max(...data.map(d => d.value), goal ?? 0, 1);
  const toY = (v: number) => H - Math.round((v / maxVal) * H);

  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)}>
      <Svg width={w} height={H + 34} style={{ overflow: 'visible' }}>

        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <Line
            key={f}
            x1={0} y1={Math.round(H - H * f)}
            x2={w} y2={Math.round(H - H * f)}
            stroke="#1f1f1f"
            strokeWidth={1}
          />
        ))}

        {/* Goal line */}
        {goal ? (
          <>
            <Line
              x1={0} y1={toY(goal)} x2={w} y2={toY(goal)}
              stroke={highlightColor} strokeWidth={1}
              strokeDasharray="5,4" opacity={0.5}
            />
            <SvgText
              x={w} y={toY(goal) - 4}
              textAnchor="end" fontSize={8}
              fill={highlightColor} opacity={0.8}
            >目標</SvgText>
          </>
        ) : null}

        {/* Bars */}
        {data.map((d, i) => {
          const x = i * (barW + gap);
          const barH = Math.max(4, Math.round((d.value / maxVal) * H));
          const y = H - barH;
          const isHigh = d.highlight;
          const fill = isHigh ? highlightColor : barColor;
          const labelFill = isHigh ? highlightColor : C.gray5;
          const showLabel = showAllLabels || isHigh;

          return (
            <G key={i}>
              <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={fill} />
              {showLabel ? (
                <SvgText
                  x={x + barW / 2} y={y - 5}
                  textAnchor="middle" fontSize={8}
                  fill={labelFill} fontWeight="700"
                >{formatVal(d.value)}</SvgText>
              ) : null}
              <SvgText
                x={x + barW / 2} y={H + 16}
                textAnchor="middle" fontSize={9}
                fill={isHigh ? highlightColor : C.gray5}
              >{d.label}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
