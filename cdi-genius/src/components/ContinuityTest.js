import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { recordContinuityResult } from '../store/sessionSlice';
import { styles } from '../styles';
import ConnectorSvgAsset from './ConnectorSvgAsset';

export default function ContinuityTest() {
  const dispatch = useDispatch();
  const model = useSelector((s) => s.session.selectedModel);

  // for demonstration assume power and ground are pins 1 and 2, but if model defines specific pins
  // you could extend model JSON to include power_pin and ground_pin
  const activePins = [1, 2];

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Continuity Test (D-020)</Text>

      <ConnectorSvgAsset model={model} activePins={activePins} status="active" width={320} />

      <Text style={styles.paragraph}>
        Verify continuity between the required power & ground pins.
      </Text>

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2e7d32' }]}
          onPress={() => dispatch(recordContinuityResult({ pass: true }))}
        >
          <Text style={styles.buttonText}>Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#c62828', marginLeft: 12 }]}
          onPress={() => dispatch(recordContinuityResult({ pass: false }))}
        >
          <Text style={styles.buttonText}>Fail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
