import { Line } from 'react-chartjs-2';
import './chartSetup';
import { chartColors, hexAlpha } from './chartTheme';
import ChartCard from './ChartCard';

const PALETTE = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

function fmtDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? iso : `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function CFDChart({ data, loading }) {
  const statuses = data?.statuses || [];
  const rawData  = data?.data    || [];
  const isEmpty  = rawData.length === 0;
  const c = chartColors();

  const labels = rawData.map((d) => d.date);

  const chartData = {
    labels,
    datasets: statuses.map((s, i) => {
      const color = s.color || PALETTE[i % PALETTE.length];
      return {
        label: s.name,
        data: rawData.map((d) => d[s.name] ?? 0),
        backgroundColor: hexAlpha(color, 0.75),
        borderColor: color,
        borderWidth: 1.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
      };
    }),
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
          title: (items) => fmtDate(items[0]?.label || ''),
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
          footer: (items) => `Total: ${items.reduce((s, item) => s + (item.raw || 0), 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: c.mutedForeground,
          font: { size: 10 },
          maxTicksLimit: 8,
          callback: (val) => fmtDate(labels[val] || ''),
        },
        border: { display: false },
      },
      y: {
        stacked: true,
        grid: { color: c.border },
        ticks: { color: c.mutedForeground, font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  return (
    <ChartCard
      title="Cumulative Flow Diagram"
      subtitle="Task count per status over time — bottlenecks widen visible"
      loading={loading}
      empty={isEmpty}
      emptyText="Add a project and start working to see flow"
    >
      <div style={{ height: 280, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
