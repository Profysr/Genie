import { Bar } from 'react-chartjs-2';
import './chartSetup';
import { chartColors } from './chartTheme';
import ChartCard from './ChartCard';

const GREEN = '#22c55e';
const AMBER = '#f59e0b';

export default function VelocityChart({ data, avgSP, loading }) {
  const isEmpty = !data?.sprints?.length;
  const sprints = data?.sprints || [];
  const c = chartColors();

  const chartData = {
    labels: sprints.map((s) => s.sprint_name),
    datasets: [
      {
        type: 'bar',
        label: 'Story Points',
        data: sprints.map((s) => s.story_points),
        backgroundColor: c.primary,
        borderRadius: 4,
        maxBarThickness: 48,
      },
      {
        type: 'bar',
        label: 'Tasks',
        data: sprints.map((s) => s.tasks_completed),
        backgroundColor: GREEN,
        borderRadius: 4,
        maxBarThickness: 48,
      },
      ...(avgSP > 0
        ? [{
            type: 'line',
            label: `Avg ${avgSP} SP`,
            data: sprints.map(() => avgSP),
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
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: c.mutedForeground, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: c.border },
        ticks: { color: c.mutedForeground, font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  return (
    <ChartCard
      title="Sprint Velocity"
      subtitle="Story points & tasks completed per sprint"
      loading={loading}
      empty={isEmpty}
      emptyText="Complete a sprint to see velocity data"
    >
      <div style={{ height: 260, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
