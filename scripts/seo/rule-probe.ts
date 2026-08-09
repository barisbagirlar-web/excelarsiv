import { containsGuarantee, EXIT } from './preflight.ts';
import { approvalRecordPresent, hardcodedThresholdHits, moneyClaimHasConfidence } from './conformance-rules.ts';

type Rule = 'guarantee' | 'money' | 'approval' | 'hardcoded-threshold';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function evaluate(rule: Rule, value: string, needle = 'DIVEST'): number {
  if (rule === 'guarantee') return containsGuarantee(value) ? EXIT.BLOCK : EXIT.PASS;
  if (rule === 'money') return moneyClaimHasConfidence(value) ? EXIT.PASS : EXIT.BLOCK;
  if (rule === 'approval') return approvalRecordPresent(value, needle) ? EXIT.PASS : EXIT.BLOCK;
  return hardcodedThresholdHits(value).length > 0 ? EXIT.BLOCK : EXIT.PASS;
}

const rule = arg('--rule') as Rule | undefined;
const value = arg('--value');
if (!rule || !['guarantee', 'money', 'approval', 'hardcoded-threshold'].includes(rule) || value === undefined) {
  console.error('RULE_PROBE_CONFIG_ERROR');
  process.exit(EXIT.CONFIG);
}
const code = evaluate(rule, value, arg('--needle'));
console.log(`RULE_PROBE ${rule} — exit ${code}`);
process.exit(code);

export { evaluate };
