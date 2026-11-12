import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { recordSparkResult } from '../store/sessionSlice';
import { styles } from '../styles';

const OPTIONS = [
  'Bright Blue Snap',
  'Strong Blue Snap',
  'Weak Yellow Glow',
  'No Spark'
];

export default function SparkTest() {
  const model = useSelector((s) => s.session.selectedModel);
  const dispatch = useDispatch();
  const [selected, setSelected] = useState(OPTIONS[0]);

  function submit() {
    dispatch(recordSparkResult({ observed: selected }));
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Spark Output Test (D-030)</Text>
      <Text style={styles.paragraph}>
        Observe the spark quality on a test bench or ignition probe for model: {model?.model_id}
      </Text>

      {OPTIONS.map((o) => (
        <TouchableOpacity
          key={o}
          style={[
            styles.listItem,
            { backgroundColor: selected === o ? '#e0e0e0' : '#fff' }
          ]}
          onPress={() => setSelected(o)}
        >
          <Text>{o}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={submit}>
        <Text style={styles.buttonText}>Record Spark Observation</Text>
      </TouchableOpacity>

      <Text style={styles.note}>Expected: {model?.expected_spark_output}</Text>
    </View>
  );
}
