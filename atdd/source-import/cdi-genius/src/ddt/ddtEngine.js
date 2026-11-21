import { calculateBounds } from '../utils/resistance';

function init(model) {
  if (!model) return null;
  return {
    model,
    currentTestIndex: 0,
    continuityChecked: false,
    resistanceResults: [],
    sparkObserved: null,
    concluded: false
  };
}

function process(engineState, event) {
  if (!engineState || !engineState.model) {
    return { engineState, nextPhase: 'model_select', diagnosis: 'Configuration missing' };
  }

  const model = engineState.model;

  if (event.type === 'CONTINUITY') {
    engineState.continuityChecked = true;
    if (event.data && event.data.pass === true) {
      if (Array.isArray(model.test_sequences) && model.test_sequences.length > 0) {
        return { engineState, nextPhase: 'resistance' };
      } else {
        return { engineState, nextPhase: 'spark' };
      }
    } else {
      engineState.concluded = true;
      const diagnosis = 'D-Failure-01: External Input Failure (power/ground continuity failed)';
      return { engineState, nextPhase: 'result', diagnosis };
    }
  }

  if (event.type === 'RESISTANCE') {
    const { testId, value } = event.data || {};
    const seq = model.test_sequences || [];
    const idx = engineState.currentTestIndex ?? 0;
    if (!seq[idx]) {
      return { engineState, nextPhase: 'spark' };
    }
    const test = seq[idx];
    const nominal = Number(test.expected_value?.nominal_ohms);
    const tolerance = Number(test.expected_value?.tolerance_percent);
    const { min, max } = calculateBounds(nominal, tolerance);
    const numericValue = Number(value);

    const pass = numericValue >= min && numericValue <= max;
    engineState.resistanceResults.push({ testId: test.test_id || testId, value: numericValue, pass });

    if (pass) {
      engineState.currentTestIndex = idx + 1;
      if (engineState.currentTestIndex < seq.length) {
        return { engineState, nextPhase: 'resistance' };
      } else {
        return { engineState, nextPhase: 'spark' };
      }
    } else {
      engineState.concluded = true;
      const diagnosis = `D-Failure-02: Component Failure - test "${test.test_id || testId}" (measured ${numericValue}Ω, expected ${min}Ω–${max}Ω)`;
      return { engineState, nextPhase: 'result', diagnosis };
    }
  }

  if (event.type === 'SPARK') {
    const observed = event.data?.observed || '';
    engineState.sparkObserved = observed;
    const expected = model.expected_spark_output || '';
    if (observed.trim().toLowerCase() === expected.trim().toLowerCase()) {
      engineState.concluded = true;
      const diagnosis = 'D-Final-Pass: Unit Confirmed OK';
      return { engineState, nextPhase: 'result', diagnosis };
    } else {
      engineState.concluded = true;
      const diagnosis = `D-Failure-03: CDI Internal Output Stage Failure (expected "${expected}", observed "${observed}")`;
      return { engineState, nextPhase: 'result', diagnosis };
    }
  }

  return { engineState, nextPhase: 'model_select' };
}

export default { init, process };
