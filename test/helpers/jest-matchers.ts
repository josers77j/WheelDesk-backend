/** Keep Jest asymmetric matchers typed at nested expectation boundaries. */
export interface AsymmetricMatcher {
  asymmetricMatch(value: unknown): boolean;
}
function isMatcher(value: unknown): value is AsymmetricMatcher {
  return (
    typeof value === 'object' &&
    value !== null &&
    'asymmetricMatch' in value &&
    typeof value.asymmetricMatch === 'function'
  );
}
export function asymmetric(value: unknown): AsymmetricMatcher {
  if (!isMatcher(value)) throw new Error('Expected a Jest asymmetric matcher');
  return value;
}
