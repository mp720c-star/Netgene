import { createSlice } from '@reduxjs/toolkit';
import sampleModels from '../data/sample-models.json';
import ddtEngine from '../ddt/ddtEngine';

const initialState = {
  phase: 'model_select',
  selectedModel: null,
  modelList: sampleModels.models,
  currentTestIndex: 0,
  history: [],
  lastDiagnosis: null,
  // engine internal state
  engineState: null
};

const session = createSlice({
  name: 'session',
  initialState,
  reducers: {
    selectModel(state, action) {
      const modelId = action.payload;
      const model = state.modelList.find((m) => m.model_id === modelId);
      state.selectedModel = model || null;
      state.currentTestIndex = 0;
      state.history = [];
      state.lastDiagnosis = null;
      state.phase = model ? 'continuity' : 'model_select';
      // initialize engine state
      state.engineState = ddtEngine.init(model);
    },
    recordContinuityResult(state, action) {
      // action.payload = { pass: true/false }
      const result = action.payload;
      state.history.push({ step: 'continuity', result });
      const next = ddtEngine.process(state.engineState, { type: 'CONTINUITY', data: result });
      state.engineState = next.engineState;
      state.phase = next.nextPhase;
      if (next.diagnosis) state.lastDiagnosis = next.diagnosis;
    },
    recordResistanceResult(state, action) {
      // action.payload = { testId, value }
      const result = action.payload;
      state.history.push({ step: 'resistance', ...result });
      const next = ddtEngine.process(state.engineState, { type: 'RESISTANCE', data: result });
      state.engineState = next.engineState;
      state.phase = next.nextPhase;
      if (next.diagnosis) state.lastDiagnosis = next.diagnosis;
    },
    recordSparkResult(state, action) {
      // action.payload = { observed }
      const result = action.payload;
      state.history.push({ step: 'spark', result });
      const next = ddtEngine.process(state.engineState, { type: 'SPARK', data: result });
      state.engineState = next.engineState;
      state.phase = next.nextPhase;
      if (next.diagnosis) state.lastDiagnosis = next.diagnosis;
    },
    restart(state) {
      state.phase = 'model_select';
      state.selectedModel = null;
      state.currentTestIndex = 0;
      state.history = [];
      state.lastDiagnosis = null;
      state.engineState = null;
    }
  }
});

export const { selectModel, recordContinuityResult, recordResistanceResult, recordSparkResult, restart } = session.actions;
export default session.reducer;
