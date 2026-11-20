import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { recordResistanceResult } from '../store/sessionSlice';
import { calculateBounds } from '../utils/resistance';
import { styles } from '../styles';
import ConnectorSvgAsset from './ConnectorSvgAsset';

export default function ResistanceTest() {
  const dispatch = useDispatch();
  const engine = useSelector((s) => s.session.engineState);
  const model = engine?.model;
  const idx = engine?.currentTestIndex ?? 0;
  const seq = model?.test_sequences || [];
  const test = seq[idx];

  const [value, setValue] = useState('');

  // Advance when this model has no resistance steps configured.
  useEffect(() => {
    if (!test) {
      dispatch(recordResistanceResult({ testId: 'NONE', value: 0 }));
    }
  }, [test, dispatch]);

  if (!test) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Resistance Tests</Text>
        <Text style={styles.paragraph}>No resistance tests for this model — continuing to spark check…</Text>
      </View>
    );
  }

  const nominal = Number(test.expected_value?.nominal_ohms || 0);
  const tolerance = Number(test.expected_value?.tolerance_percent || 0);
  const { min, max } = calculateBounds(nominal, tolerance);

  const activePins = [
    Number(test.pin_A_data?.pin_id),
    Number(test.pin_B_data?.pin_id)
  ];

  function submit() {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      Alert.alert('Invalid value', 'Enter a numeric ohms value.');
      return;
    }
    dispatch(recordResistanceResult({ testId: test.test_id, value: numeric }));
    setValue('');
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Resistance Test (D-010)</Text>

      <ConnectorSvgAsset model={model} activePins={activePins} status="active" width={320} />

      <Text style={styles.paragraph}>
        Test: {test.test_id} — {test.description || ''}
      </Text>
      <Text style={styles.paragraph}>
        Probe: {test.pin_A_data?.pin_id || 'A'} ↔ {test.pin_B_data?.pin_id || 'B'}
      </Text>

      <Text style={styles.paragraph}>
        Expected Range: {min} Ω — {max} Ω (Nominal {nominal} Ω ± {tolerance}%)
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Measured Ohms"
        value={value}
        onChangeText={setValue}
      />

      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Submit Measurement</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Enter the measured ohms value from the multimeter and press Submit.
      </Text>
    </View>
  );
}
