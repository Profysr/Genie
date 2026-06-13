import { Bar } from 'react-chartjs-2';
import './chartSetup';
import { chartColors } from './chartTheme';
import ChartCard from './ChartCard';

const BUCKET_COLORS = [
  '#22c55e',  // < 1 day
  '#84cc16',  // 1-3 days
  '#f59e0b',  // 3-7 days
  '#f97316',  // 1-2 weeks
  '#ef4444',  // 2-4 weeks
  '#dc2626',  // > 30 days
];

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}d</span>
    </div>
  );
}

export default function LeadTimeChart({ data, loading }) {
  const histogram = data?.histogram || [];
  const stats     = data?.stats     || {};
  const isEmpty   = !histogram.some((b) => b.count > 0);
  const c = chartColors();

  const chartData = {
    labels: histogram.map((b) => b.label),
    datasets: [{
      label: 'Tasks',
      data: histogram.map((b) => b.count),
      backgroundColor: histogram.map((_, i) => BUCKET_COLORS[i % BUCKET_COLORS.length]),
      borderRadius: 4,
      maxBarThickness: 56,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.popover,
        borderColor: c.border,
        borderWidth: 1,
        titleColor: c.foreground,
        bodyColor: c.mutedForeground,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` Tasks: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: c.mutedForeground, font: { size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: c.border },
        ticks: { color: c.mutedForeground, font: { size: 11 }, precision: 0 },
        border: { display: false },
      },
    },
  };

  return (
    <ChartCard
      title="Lead Time Distribution"
      subtitle="Time from task creation → Done"
      loading={loading}
      empty={isEmpty}
      emptyText="No completed tasks yet in this period"
    >
      {stats.count > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mb-3 px-1">
          <StatRow label="Median"  value={stats.median} />
          <StatRow label="Average" value={stats.avg} />
          <StatRow label="Min"     value={stats.min} />
          <StatRow label="Max"     value={stats.max} />
        </div>
      )}
      <div style={{ height: 220, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
