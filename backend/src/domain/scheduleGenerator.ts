export interface PositionInput {
  ordinal: number;
  memberId: string;
}

export interface GeneratedCycle {
  ordinal: number;
  dueDate: Date;
  receivingPositionOrdinal: number;
}

export interface GeneratedObligation {
  cycleOrdinal: number;
  positionOrdinal: number;
  dueKobo: bigint;
}

export function generateSchedule(params: {
  positions: PositionInput[];
  amountKobo: bigint;
  frequency: "weekly" | "biweekly" | "monthly";
  startDate: Date;
}): { cycles: GeneratedCycle[]; obligations: GeneratedObligation[] } {
  const { positions, amountKobo, frequency, startDate } = params;
  const n = positions.length;

  const cycles: GeneratedCycle[] = Array.from({ length: n }, (_, i) => ({
    ordinal: i + 1,
    dueDate: addInterval(startDate, frequency, i),
    receivingPositionOrdinal: i + 1,
  }));

  const obligations: GeneratedObligation[] = [];
  for (const cycle of cycles) {
    for (const position of positions) {
      obligations.push({
        cycleOrdinal: cycle.ordinal,
        positionOrdinal: position.ordinal,
        dueKobo: amountKobo,
      });
    }
  }

  return { cycles, obligations };
}

function addInterval(start: Date, frequency: string, steps: number): Date {
  const d = new Date(start);
  if (frequency === "weekly") d.setDate(d.getDate() + steps * 7);
  else if (frequency === "biweekly") d.setDate(d.getDate() + steps * 14);
  else {
    const targetMonth = d.getMonth() + steps;
    const day = d.getDate();
    d.setMonth(targetMonth, 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
  }
  return d;
}

export function seededDraw(memberIds: string[], seed: string): string[] {
  let s = hashSeed(seed);
  const arr = [...memberIds];
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}
