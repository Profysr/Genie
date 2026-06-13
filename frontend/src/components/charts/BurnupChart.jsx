import { Line } from 'react-chartjs-2';
import './chartSetup';
import { chartColors } from './chartTheme';
import ChartCard from './ChartCard';

function makeTodayPlugin(todayLabel, labels) {
  return {
    id: 'burnupTodayLine',
    afterDraw(chart) {
      if (!todayLabel) return;
      const idx = labels.indexOf(todayLabel);
      if (idx < 0) return;
      const { ctx, chartArea, scales } = chart;
      const x = scales.x.getPixelForValue(idx);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px inherit';
      ctx.textAlign = 'left';
      ctx.fillText('Today', x + 4, chartArea.top + 14);
      ctx.restore();
    },
  };
}

function fmtDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? iso : `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function BurnupChart({ data, loading }) {
  const allData   = data?.data || [];
  const displayed = allData.filter((d) => !d.is_future || d.completed > 0);
  const todayLabel = displayed.find((d) => d.is_future)?.date;
  const isEmpty   = displayed.length < 2;
  const c = chartColors();

  const labels = displayed.map((d) => d.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Scope',
        data: displayed.map((d) => d.total),
        borderColor: '#94a3b8',
        borderDash: [5, 3],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Completed',
        data: displayed.map((d) => d.completed),
        borderColor: c.primary,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.2,
        fill: false,
      },
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
          title: (items) => fmtDate(items[0]?.label || ''),
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
          afterBody: (items) => {
            const scope = items.find((i) => i.dataset.label === 'Total Scope')?.raw;
            const done  = items.find((i) => i.dataset.label === 'Completed')?.raw;
            return scope != null && done != null ? `Remaining: ${scope - done}` : '';
          },
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
        grid: { color: c.border },
        ticks: { color: c.mutedForeground, font: { size: 11 }, precision: 0 },
        border: { display: false },
      },
    },
  };

  return (
    <ChartCard
      title="Burnup Chart"
      subtitle="Total scope vs completed — scope creep visible when lines diverge"
      loading={loading}
      empty={isEmpty}
      emptyText="Select a sprint or project with tasks to see burnup"
    >
      <div style={{ height: 260, position: 'relative' }}>
        <Line
          data={chartData}
          options={options}
          plugins={[makeTodayPlugin(todayLabel, labels)]}
        />
      </div>
    </ChartCard>
  );
}
