'use client';

import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ListeningPatternChartProps {
  data: number[]; // 6 values for 6 time windows
}

export function ListeningPatternChart({ data }: ListeningPatternChartProps) {
  const chartData = {
    labels: [
      'Morning (6-12)',
      'Afternoon (12-17)',
      'Evening (17-21)',
      'Night (21-24)',
      'Late Night (0-3)',
      'Dawn (3-6)',
    ],
    datasets: [
      {
        label: 'Music Intensity',
        data: data,
        backgroundColor: 'rgba(29, 185, 84, 0.2)',
        borderColor: '#1db954',
        borderWidth: 2,
        pointBackgroundColor: '#1db954',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#1db954',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 10 } },
        ticks: { display: false, stepSize: 20 },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a',
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[250px]">
      <Radar data={chartData} options={options} />
    </div>
  );
}
