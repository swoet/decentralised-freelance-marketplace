'use client';
import React, { useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  Plugin
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export interface StatsChartsProps {
  totalProjects: number;
  completedProjects: number;
  successRate: number; // 0-100
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const createShadowPlugin = (shadowColor = 'rgba(0,0,0,0.25)'): Plugin => ({
  id: 'shadow',
  beforeDatasetsDraw(chart) {
    const { ctx } = chart;
    // save once; chart.js will restore internally
    // add slight shadow to simulate depth
    // This applies to bars and doughnut segments
    // @ts-ignore
    ctx.shadowColor = shadowColor;
    // @ts-ignore
    ctx.shadowBlur = 12;
    // @ts-ignore
    ctx.shadowOffsetY = 4;
  },
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    // @ts-ignore
    ctx.shadowColor = 'transparent';
    // @ts-ignore
    ctx.shadowBlur = 0;
    // @ts-ignore
    ctx.shadowOffsetY = 0;
  }
});

const centerTextPlugin: Plugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    // Only for doughnut
    if ((chart as any).config.type !== 'doughnut') return;
    const dataset = chart.data.datasets[0];
    if (!dataset) return;
    const value = (dataset.data?.[0] as number) ?? 0; // success portion (0-100)

    const text = `${Math.round(value)}%`;
    ctx.save();
    ctx.font = 'bold 14px ui-sans-serif, system-ui, -apple-system';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2);
    ctx.restore();
  }
};

ChartJS.register(centerTextPlugin);

export default function StatsCharts({ totalProjects, completedProjects, successRate }: StatsChartsProps) {
  const safeTotal = Math.max(0, totalProjects);
  const safeCompleted = clamp(completedProjects, 0, safeTotal);
  const active = Math.max(0, safeTotal - safeCompleted);
  const safeRate = clamp(successRate, 0, 100);

  const barData: ChartData<'bar'> = useMemo(() => ({
    labels: ['Total', 'Active', 'Done'],
    datasets: [
      {
        label: 'Projects',
        data: [safeTotal, active, safeCompleted],
        backgroundColor: [
          'rgba(59,130,246,0.8)', // blue
          'rgba(245,158,11,0.8)', // amber
          'rgba(16,185,129,0.85)' // emerald
        ],
        borderRadius: 8,
        borderSkipped: false,
        borderColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1
      }
    ]
  }), [safeTotal, active, safeCompleted]);

  const barOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutCubic' },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
    }
  }), []);

  const doughnutData: ChartData<'doughnut'> = useMemo(() => ({
    labels: ['Success', 'Remaining'],
    datasets: [
      {
        data: [safeRate, 100 - safeRate],
        backgroundColor: ['rgba(16,185,129,0.9)', 'rgba(229,231,235,0.9)'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }), [safeRate]);

  const doughnutOptions: ChartOptions<'doughnut'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: { animateRotate: true, animateScale: true, duration: 1200 },
    plugins: { legend: { display: false } }
  }), []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/70 rounded-xl p-4 shadow-md">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Project Statistics</h4>
        <div className="h-40">
          <Bar data={barData} options={barOptions} plugins={[createShadowPlugin('rgba(59,130,246,0.25)')]} />
        </div>
      </div>
      <div className="bg-white/70 rounded-xl p-4 shadow-md">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Success Rate</h4>
        <div className="h-40">
          <Doughnut data={doughnutData} options={doughnutOptions} plugins={[createShadowPlugin('rgba(16,185,129,0.25)')]} />
        </div>
      </div>
    </div>
  );
}
