import { Bar } from 'react-chartjs-2';
import './chartSetup';
import { chartColors } from './chartTheme';
import ChartCard from './ChartCard';

const AMBER = '#f59e0b';

function fmtLabel(v, period) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return v;
  if (period === 'month') return d.toLocaleString('default', { month: 'short', year: '2-digit' });
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ThroughputChart({ data = [], period = 'week', loading }) {
  const isEmpty = data.length === 0;
  const avg = data.length
    ? Math.round(data.reduce((s, d) => s + d.count, 0) / data.length)
    : 0;
  const periodLabel = { day: 'Daily', week: 'Weekly', month: 'Monthly' }[period] ?? 'Weekly';
  const c = chartColors();

  const labels = data.map((d) => d.period);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Completed',
        data: data.map((d) => d.count),
        backgroundColor: c.primary,
        borderRadius: 4,
        maxBarThickness: 48,
      },
      ...(avg > 0
        ? [{
            type: 'line',
            label: `Avg ${avg}`,
            data: data.map(() => avg),
            borderColor: AMBER,
            borderDash: [4, 2],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
          }]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: c.mutedForeground,
          boxWidth: 12,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: c.popover,
        borderColor: c.border,
        borderWidth: 1,
        titleColor: c.foreground,
        bodyColor: c.mutedForeground,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => fmtLabel(items[0]?.label, period),
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: c.mutedForeground,
          font: { size: 10 },
          maxTicksLimit: 10,
          callback: (val) => fmtLabel(labels[val] || '', period),
        },
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
      title={`${periodLabel} Throughput`}
      subtitle="Tasks completed per period"
      loading={loading}
      empty={isEmpty}
      emptyText="No completed tasks in this period"
    >
      <div style={{ height: 240, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
