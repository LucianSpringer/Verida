import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { JournalEntry } from '../types';

interface PhenologicalHistoryChartProps {
    entries: JournalEntry[];
    className?: string;
}

export const PhenologicalHistoryChart: React.FC<PhenologicalHistoryChartProps> = ({ entries, className }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    // Process data: Group by month and count tags
    const chartData = useMemo(() => {
        const now = new Date();
        const months = d3.timeMonths(d3.timeMonth.offset(now, -11), now); // Last 12 months including current

        return months.map(month => {
            const nextMonth = d3.timeMonth.offset(month, 1);
            const monthEntries = entries.filter(e => {
                const d = new Date(e.timestamp);
                return d >= month && d < nextMonth;
            });

            return {
                date: month,
                issues: monthEntries.filter(e => e.tags.includes('ISSUE')).length,
                treatments: monthEntries.filter(e => e.tags.includes('TREATMENT')).length
            };
        });
    }, [entries]);

    useEffect(() => {
        if (!svgRef.current || chartData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };

        const x = d3.scaleTime()
            .domain(d3.extent(chartData, d => d.date) as [Date, Date])
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, 10]) // Fixed scale 0-10 as requested
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Add X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
            .call(g => g.select(".domain").remove());

        // Add Y Axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove())
            .call(g => g.append("text")
                .attr("x", -margin.left)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text("Events"));

        // Line Generators
        const lineIssue = d3.line<typeof chartData[0]>()
            .x(d => x(d.date))
            .y(d => y(d.issues))
            .curve(d3.curveMonotoneX);

        const lineTreatment = d3.line<typeof chartData[0]>()
            .x(d => x(d.date))
            .y(d => y(d.treatments))
            .curve(d3.curveMonotoneX);

        // Draw Issue Line
        svg.append("path")
            .datum(chartData)
            .attr("fill", "none")
            .attr("stroke", "#ef4444") // Red-500
            .attr("stroke-width", 2)
            .attr("d", lineIssue);

        // Draw Treatment Line
        svg.append("path")
            .datum(chartData)
            .attr("fill", "none")
            .attr("stroke", "#a855f7") // Purple-500
            .attr("stroke-width", 2)
            .attr("d", lineTreatment);

        // Add Dots for Issues
        svg.append("g")
            .attr("fill", "#ef4444")
            .selectAll("circle")
            .data(chartData)
            .join("circle")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.issues))
            .attr("r", 3);

        // Add Dots for Treatments
        svg.append("g")
            .attr("fill", "#a855f7")
            .selectAll("circle")
            .data(chartData)
            .join("circle")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.treatments))
            .attr("r", 3);

        // Legend
        const legend = svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(["Issues", "Treatments"])
            .join("g")
            .attr("transform", (d, i) => `translate(${width - margin.right},${margin.top + i * 20})`);

        legend.append("rect")
            .attr("x", -19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", (d, i) => i === 0 ? "#ef4444" : "#a855f7");

        legend.append("text")
            .attr("x", -24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(d => d);

    }, [chartData]);

    return (
        <div className={`w-full overflow-x-auto ${className}`}>
            <svg
                ref={svgRef}
                viewBox="0 0 600 300"
                className="w-full h-auto min-w-[600px]"
                style={{ maxWidth: '100%' }}
            />
        </div>
    );
};
