'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { format, subYears, eachDayOfInterval, isSameDay } from 'date-fns';

interface HeatmapData {
  date: Date;
  count: number;
}

interface ListeningHeatmapProps {
  data: HeatmapData[];
}

export function ListeningHeatmap({ data }: ListeningHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 130;
    const cellSize = 12;
    const cellGap = 3;
    const margin = { top: 20, right: 0, bottom: 0, left: 30 };

    const now = new Date();
    const startDate = subYears(now, 1);
    const allDays = eachDayOfInterval({ start: startDate, end: now });

    const colorScale = d3.scaleThreshold<number, string>()
      .domain([1, 3, 6, 10])
      .range(['#1a1a1a', 'rgba(29,185,84,0.3)', 'rgba(29,185,84,0.6)', 'rgba(29,185,84,0.85)', '#1db954']);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Day labels
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    g.selectAll('.day-label')
      .data([1, 3, 5]) // Mon, Wed, Fri
      .enter()
      .append('text')
      .attr('x', -margin.left + 5)
      .attr('y', d => d * (cellSize + cellGap) + cellSize / 2 + 3)
      .attr('fill', 'rgba(255,255,255,0.3)')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text(d => days[d]);

    // Cells
    g.selectAll('.day')
      .data(allDays)
      .enter()
      .append('rect')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('x', d => {
        const week = d3.timeWeek.count(startDate, d);
        return week * (cellSize + cellGap);
      })
      .attr('y', d => d.getDay() * (cellSize + cellGap))
      .attr('rx', 2)
      .attr('fill', d => {
        const match = data.find(item => isSameDay(item.date, d));
        return colorScale(match ? match.count : 0);
      })
      .attr('class', 'cursor-pointer hover:stroke-white/20 transition-all')
      .append('title')
      .text(d => {
        const match = data.find(item => isSameDay(item.date, d));
        return `${format(d, 'MMM d, yyyy')}: ${match ? match.count : 0} songs`;
      });

    // Month labels
    const monthLabels = g.selectAll('.month-label')
      .data(d3.timeMonths(startDate, now))
      .enter()
      .append('text')
      .attr('x', d => {
        const week = d3.timeWeek.count(startDate, d);
        return week * (cellSize + cellGap);
      })
      .attr('y', -8)
      .attr('fill', 'rgba(255,255,255,0.3)')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text(d => format(d, 'MMM'));

  }, [data]);

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <svg
        ref={svgRef}
        viewBox="0 0 850 130"
        className="w-full h-auto min-w-[700px]"
      />
    </div>
  );
}
