'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface MoodTimelineChartProps {
  data: {
    labels: string[];
    suy: number[];
    hype: number[];
    overdose: number[];
    chill: number[];
  };
}

export function MoodTimelineChart({ data }: MoodTimelineChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.4)',
          font: { size: 10, weight: 'bold' as any },
          boxWidth: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.6)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 9 } },
      },
      y: {
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 9 }, callback: (v: any) => v + '%' },
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        fill: true,
        label: 'Suy',
        data: data.suy,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.4,
      },
      {
        fill: true,
        label: 'Hype',
        data: data.hype,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        tension: 0.4,
      },
      {
        fill: true,
        label: 'Overdose',
        data: data.overdose,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.4,
      },
      {
        fill: true,
        label: 'Chill',
        data: data.chill,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="w-full h-full min-h-[250px]">
      <Line options={options} data={chartData} />
    </div>
  );
}
