import React from 'react';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';

export default function YamahaXV250({ pinColors = {}, width = 600 }) {
  const height = 220;
  // default colors
  const c = (n, fallback) => pinColors[n] || fallback;
  return (
    <Svg width={width} height={(height * width) / 600} viewBox="0 0 600 220">
      <Rect x="20" y="40" rx="18" ry="18" width="560" height="140" fill="#ffffff" stroke="#222" strokeWidth="3"/>
      <Rect x="280" y="20" width="40" height="30" rx="6" fill="#222"/>
      <Circle id="pin-1" cx="80"  cy="110" r="14" fill={c(1,'#000000')} stroke="#333"/>
      <Circle id="pin-2" cx="170" cy="110" r="14" fill={c(2,'#ffeb3b')} stroke="#333"/>
      <Circle id="pin-3" cx="260" cy="110" r="14" fill={c(3,'#0000ff')} stroke="#333"/>
      <Circle id="pin-4" cx="350" cy="110" r="14" fill={c(4,'#ff5722')} stroke="#333"/>
      <Circle id="pin-5" cx="440" cy="110" r="14" fill={c(5,'#4caf50')} stroke="#333"/>
      <Circle id="pin-6" cx="530" cy="110" r="14" fill={c(6,'#9e9e9e')} stroke="#333"/>
      <SvgText x="80"  y="150" fontSize="12" fill="#111" textAnchor="middle">1</SvgText>
      <SvgText x="170" y="150" fontSize="12" fill="#111" textAnchor="middle">2</SvgText>
      <SvgText x="260" y="150" fontSize="12" fill="#111" textAnchor="middle">3</SvgText>
      <SvgText x="350" y="150" fontSize="12" fill="#111" textAnchor="middle">4</SvgText>
      <SvgText x="440" y="150" fontSize="12" fill="#111" textAnchor="middle">5</SvgText>
      <SvgText x="530" y="150" fontSize="12" fill="#111" textAnchor="middle">6</SvgText>
    </Svg>
  );
}
