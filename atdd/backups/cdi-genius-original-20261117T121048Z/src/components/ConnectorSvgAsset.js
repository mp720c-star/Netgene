import React from 'react';
import { View } from 'react-native';
import modelSvgs from './modelSvgMap';

/**
 * ConnectorSvgAsset
 * Props:
 * - model: model object (with model_id, pin_count, wire_colors_map)
 * - activePins: array of pin numbers to highlight
 * - status: 'idle'|'active'|'pass'|'fail' - determines highlight color for active pins
 * - width: svg width
 */
export default function ConnectorSvgAsset({ model, activePins = [], status = 'idle', width = 300 }) {
  if (!model) return null;
  const SvgComp = modelSvgs[model.model_id];
  // determine colors for each pin: default from model.wire_colors_map or neutral
  const baseColors = {};
  const map = model.wire_colors_map || {};
  for (let i = 1; i <= (model.pin_count || 6); i++) {
    const key = `PIN_${i}`;
    baseColors[i] = map[key] || map[`P${i}`] || '#888888';
  }

  // highlight logic
  const highlightColor = status === 'active' ? '#ffeb3b' :
                         status === 'pass' ? '#4caf50' :
                         status === 'fail' ? '#f44336' : null;

  const pinColors = {};
  for (let i = 1; i <= (model.pin_count || 6); i++) {
    if (activePins.includes(i) && highlightColor) {
      pinColors[i] = highlightColor;
    } else {
      pinColors[i] = baseColors[i];
    }
  }

  if (!SvgComp) {
    return null;
  }

  return (
    <View>
      <SvgComp pinColors={pinColors} width={width} />
    </View>
  );
}
