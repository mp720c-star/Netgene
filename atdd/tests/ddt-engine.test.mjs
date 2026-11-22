import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const engine = await import(pathToFileURL(join(root, '../web/js/ddtEngine.js')).href);
const models = JSON.parse(
  readFileSync(join(root, '../source-import/cdi-genius/src/data/sample-models.json'), 'utf8')
).models;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const yamaha = structuredClone(models.find((m) => m.model_id === 'YAMAHA-XV250-1995-OEM'));
assert(yamaha, 'Yamaha model missing');

let state = engine.default.init(yamaha);
let out = engine.default.process(state, { type: 'CONTINUITY', data: { pass: false } });
assert(out.nextPhase === 'result', 'continuity fail should conclude');
assert(String(out.diagnosis).includes('D-Failure-01'), 'expected D-Failure-01');

state = engine.default.init(structuredClone(yamaha));
out = engine.default.process(state, { type: 'CONTINUITY', data: { pass: true } });
assert(out.nextPhase === 'resistance', 'continuity pass should enter resistance');
out = engine.default.process(out.engineState, {
  type: 'RESISTANCE',
  data: { testId: 'TRIGGER_COIL', value: 200 }
});
assert(out.nextPhase === 'resistance', 'first resistance pass stays in resistance');
out = engine.default.process(out.engineState, {
  type: 'RESISTANCE',
  data: { testId: 'CHARGE_COIL', value: 12 }
});
assert(out.nextPhase === 'spark', 'second resistance pass goes to spark');
out = engine.default.process(out.engineState, {
  type: 'SPARK',
  data: { observed: 'Bright Blue Snap' }
});
assert(out.nextPhase === 'result', 'spark match concludes');
assert(String(out.diagnosis).includes('D-Final-Pass'), 'expected pass diagnosis');

const kawasaki = structuredClone(models.find((m) => m.model_id === 'KAWASAKI-KE100-1976-OEM'));
state = engine.default.init(kawasaki);
out = engine.default.process(state, { type: 'CONTINUITY', data: { pass: true } });
assert(out.nextPhase === 'spark', 'empty test_sequences should skip to spark');

console.log(
  JSON.stringify(
    {
      ok: true,
      tests: [
        'continuity_fail',
        'yamaha_full_pass_path',
        'kawasaki_skip_resistance'
      ]
    },
    null,
    2
  )
);
