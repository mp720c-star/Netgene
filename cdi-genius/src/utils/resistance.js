export function calculateBounds(nominal, tolerancePercent) {
  const N = Number(nominal) || 0;
  const T = Number(tolerancePercent) || 0;
  const tol = (N * T) / 100.0;
  const min = N - tol;
  const max = N + tol;
  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100
  };
}
