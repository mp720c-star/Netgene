import React from 'react';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';

export default function KawasakiKE100({ pinColors = {}, width = 360 }) {
  const height = 220;
  const c = (n, fallback) => pinColors[n] || fallback;
  return (
    <Svg width={width} height={(height * width) / 360} viewBox="0 0 360 220">
      <Rect x="20" y="40" rx="12" ry="12" width="320" height="140" fill="#fff" stroke="#222" strokeWidth="3"/>
      <Rect x="160" y="18" width="40" height="26" rx="5" fill="#222"/>
      <Circle id="pin-1" cx="110" cy="90" r="14" fill={c(1,'#000000')} stroke="#333"/>
      <Circle id="pin-2" cx="250" cy="90" r="14" fill={c(2,'#ffeb3b')} stroke="#333"/>
      <Circle id="pin-3" cx="110" cy="140" r="14" fill={c(3,'#3f51b5')} stroke="#333"/>
      <Circle id="pin-4" cx="250" cy="140" r="14" fill={c(4,'#607d8b')} stroke="#333"/>
      <SvgText x="110" y="170" fontSize="12" fill="#111" textAnchor="middle">1</SvgText>
      <SvgText x="250" y="170" fontSize="12" fill="#111" textAnchor="middle">2</SvgText>
      <SvgText x="110" y="190" fontSize="12" fill="#111" textAnchor="middle">3</SvgText>
      <SvgText x="250" y="190" fontSize="12" fill="#111" textAnchor="middle">4</SvgText>
    </Svg>
  );
}
