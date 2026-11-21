import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';

export default function ConnectorSVG({ model, compact = false }) {
  const size = compact ? 64 : 200;
  const pinCount = model?.pin_count || 6;
  const wires = model?.wire_colors_map || {};
  const pins = Array.from({ length: pinCount }, (_, i) => i + 1);

  const pinRadius = compact ? 4 : 8;
  const spacing = size / (pinCount + 1);

  return (
    <View>
      <Svg width={size} height={compact ? 32 : size}>
        {pins.map((p, i) => {
          const cx = spacing * (i + 1);
          const cy = compact ? 16 : size / 2;
          const colorKey = `PIN_${p}`;
          const hex = wires[colorKey] || wires[`P${p}`] || wires[`pin${p}`] || '#999';
          return (
            <React.Fragment key={`pin-${p}`}>
              <Circle cx={cx} cy={cy} r={pinRadius} fill={hex} stroke="#333" />
              {!compact && (
                <SvgText
                  x={cx}
                  y={cy + 25}
                  fontSize="10"
                  fill="#111"
                  textAnchor="middle"
                >
                  {p}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
        <Rect x="2" y={compact ? 6 : 20} width={size - 4} height={compact ? 20 : size - 40} rx="6" fill="none" stroke="#333" />
      </Svg>
    </View>
  );
}
