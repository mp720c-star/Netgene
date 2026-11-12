import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { selectModel } from '../store/sessionSlice';
import { styles } from '../styles';
import ConnectorSVG from './ConnectorSVG';

export default function ModelSelector() {
  const models = useSelector((s) => s.session.modelList || []);
  const dispatch = useDispatch();

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Select CDI Model</Text>
      <FlatList
        data={models}
        keyExtractor={(item) => item.model_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => dispatch(selectModel(item.model_id))}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 80 }}>
                <ConnectorSVG model={item} compact />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.itemTitle}>{item.model_id}</Text>
                <Text style={styles.itemSubtitle}>{item.manufacturer}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
