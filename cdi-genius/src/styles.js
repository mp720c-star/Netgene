import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fafafa' },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12, alignSelf: 'center' },
  panel: { backgroundColor: '#fff', padding: 12, borderRadius: 8, elevation: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  paragraph: { fontSize: 14, marginBottom: 8 },
  listItem: { padding: 10, borderRadius: 6, borderColor: '#ddd', borderWidth: 1, marginBottom: 8 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemSubtitle: { fontSize: 12, color: '#555' },
  button: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  input: { borderColor: '#ddd', borderWidth: 1, borderRadius: 6, padding: 8, marginTop: 8, marginBottom: 8 },
  note: { fontSize: 12, color: '#666' },
  diagnosisText: { fontSize: 16, fontWeight: '700', marginTop: 8, color: '#111' },
  historyItem: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' }
});
