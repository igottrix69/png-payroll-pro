import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PayrollRun } from '@/types';
import { formatPGK, formatPGKShort } from '@/lib/utils';

interface Datum {
  label: string;
  gross: number;
  net: number;
  swt: number;
  count: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Datum }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[6px] border border-line bg-card px-3 py-2 text-[12px] shadow-xl">
      <div className="mb-1 font-semibold text-ink">{d.label}</div>
      <Row label="Gross" value={formatPGK(d.gross)} color="#3583ff" />
      <Row label="SWT" value={formatPGK(d.swt)} color="#D97706" />
      <Row label="Net pay" value={formatPGK(d.net)} color="#15803d" />
      <Row label="Employees" value={String(d.count)} color="#64748b" />
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-1.5 text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="tnum font-medium text-ink">{value}</span>
    </div>
  );
}

export function PayrollChart({ runs }: { runs: PayrollRun[] }) {
  // last 12 completed/processed runs, oldest -> newest
  const data: Datum[] = [...runs]
    .filter((r) => r.status === 'completed')
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
    .slice(-12)
    .map((r) => ({
      label: r.runNumber.replace('PR-', '').replace(/^\d{4}-/, 'FN'),
      gross: r.totalGross,
      net: r.totalNetPay,
      swt: r.totalSWT,
      count: r.employeeCount,
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-[13px] text-muted">
        No completed payroll runs yet — run your first payroll to see the trend.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full px-2 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 12, bottom: 6, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis
            tickFormatter={(v) => formatPGKShort(v)}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(53,131,255,0.08)' }} />
          <Bar dataKey="gross" fill="#3583ff" radius={[3, 3, 0, 0]} maxBarSize={44} name="Gross" isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#15803d"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#15803d' }}
            name="Net pay"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
