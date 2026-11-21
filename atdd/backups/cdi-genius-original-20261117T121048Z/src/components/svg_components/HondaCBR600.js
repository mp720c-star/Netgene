import React from 'react';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';

export default function HondaCBR600({ pinColors = {}, width = 520 }) {
  const height = 220;
  const c = (n, fallback) => pinColors[n] || fallback;
  return (
    <Svg width={width} height={(height * width) / 520} viewBox="0 0 520 220">
      <Rect x="10" y="40" rx="14" ry="14" width="500" height="140" fill="#fff" stroke="#222" strokeWidth="3"/>
      <Rect x="20" y="10" width="40" height="28" rx="5" fill="#222"/>
      <Circle id="pin-1" cx="90"  cy="90"  r="14" fill={c(1,'#ff0000')} stroke="#333"/>
      <Circle id="pin-2" cx="170" cy="130" r="14" fill={c(2,'#000000')} stroke="#333"/>
      <Circle id="pin-3" cx="250" cy="90"  r="14" fill={c(3,'#ffff00')} stroke="#333"/>
      <Circle id="pin-4" cx="330" cy="130" r="14" fill={c(4,'#0000ff')} stroke="#333"/>
      <Circle id="pin-5" cx="410" cy="90"  r="14" fill={c(5,'#00e676')} stroke="#333"/>
      <SvgText x="90"  y="165" fontSize="12" fill="#111" textAnchor="middle">1</SvgText>
      <SvgText x="170" y="185" fontSize="12" fill="#111" textAnchor="middle">2</SvgText>
      <SvgText x="250" y="165" fontSize="12" fill="#111" textAnchor="middle">3</SvgText>
      <SvgText x="330" y="185" fontSize="12" fill="#111" textAnchor="middle">4</SvgText>
      <SvgText x="410" y="165" fontSize="12" fill="#111" textAnchor="middle">5</SvgText>
    </Svg>
  );
}
