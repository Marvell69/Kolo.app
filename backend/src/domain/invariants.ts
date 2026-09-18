export interface ObligationRow { dueKobo: bigint; paidKobo: bigint; balanceKobo: bigint; }
export interface CycleRow { potExpectedKobo: bigint; potCollectedKobo: bigint; shortfallKobo: bigint; }

export function checkObligationBalances(obligations: ObligationRow[]): string[] {
  const errors: string[] = [];
  for (const o of obligations) {
    if (o.dueKobo - o.paidKobo !== o.balanceKobo) {
      errors.push(`Obligation balance mismatch: due=${o.dueKobo} paid=${o.paidKobo} balance=${o.balanceKobo}`);
    }
  }
  return errors;
}

export function checkCycleGross(cycles: CycleRow[]): string[] {
  const errors: string[] = [];
  for (const c of cycles) {
    if (c.potExpectedKobo - c.shortfallKobo !== c.potCollectedKobo) {
      errors.push(`Cycle pot mismatch: expected=${c.potExpectedKobo} shortfall=${c.shortfallKobo} collected=${c.potCollectedKobo}`);
    }
  }
  return errors;
}