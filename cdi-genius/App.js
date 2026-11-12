import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaView, View, Text } from 'react-native';
import store from './src/store';
import ModelSelector from './src/components/ModelSelector';
import ContinuityTest from './src/components/ContinuityTest';
import ResistanceTest from './src/components/ResistanceTest';
import SparkTest from './src/components/SparkTest';
import DiagnosisResult from './src/components/DiagnosisResult';
import { useSelector } from 'react-redux';
import { styles } from './src/styles';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <MainShell />
        <StatusBar style="auto" />
      </SafeAreaView>
    </Provider>
  );
}

function MainShell() {
  const session = useSelector((s) => s.session);
  const { phase } = session;

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <Text style={styles.header}>CDI Genius - Prototype</Text>

      {/* Phase routing */}
      {phase === 'model_select' && <ModelSelector />}
      {phase === 'continuity' && <ContinuityTest />}
      {phase === 'resistance' && <ResistanceTest />}
      {phase === 'spark' && <SparkTest />}
      {phase === 'result' && <DiagnosisResult />}
    </View>
  );
}
