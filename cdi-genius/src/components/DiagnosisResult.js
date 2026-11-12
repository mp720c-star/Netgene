import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { restart } from '../store/sessionSlice';
import { styles } from '../styles';
import ConnectorSvgAsset from './ConnectorSvgAsset';

export default function DiagnosisResult() {
  const dispatch = useDispatch();
  const lastDiagnosis = useSelector((s) => s.session.lastDiagnosis);
  const history = useSelector((s) => s.session.history || []);
  const model = useSelector((s) => s.session.selectedModel);

  const status = lastDiagnosis && lastDiagnosis.toLowerCase().includes('pass') ? 'pass' : 'fail';

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Diagnosis</Text>

      <ConnectorSvgAsset model={model} activePins={[]} status={status} width={320} />

      <Text style={styles.diagnosisText}>{lastDiagnosis || 'No diagnosis available'}</Text>

      <Text style={[styles.title, { marginTop: 12 }]}>Session History</Text>
      <FlatList
        data={history.slice().reverse()}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={{ fontWeight: '600' }}>{item.step}</Text>
            <Text>{JSON.stringify(item)}</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.button, { marginTop: 12 }]}
        onPress={() => dispatch(restart())}
      >
        <Text style={styles.buttonText}>Restart</Text>
      </TouchableOpacity>
    </View>
  );
}
