import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTooltip,
  VictoryContainer,
} from 'victory';
import { TaskTypeAnalyticsDto } from '../../services/analyticsService';

interface TaskTypeChartProps {
  data: TaskTypeAnalyticsDto[];
}

const TaskTypeChart: React.FC<TaskTypeChartProps> = ({ data }) => {
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  // Modern gradient colors for horizontal bars
  const getBarColor = (index: number) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    return colors[index % colors.length];
  };

  // Prepare data for Victory (horizontal bar chart)
  const chartData = data.map((item, index) => ({
    x: item.hours,
    y: index + 1,
    taskTypeName: item.taskTypeName,
    category: item.category,
    count: item.count,
    hours: item.hours,
    percentage: item.percentage,
    fill: getBarColor(index),
  }));

  return (
    <Card sx={{
      height: '100%',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" sx={{
          fontWeight: 700,
          color: '#1a1a1a',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
          mb: 3
        }}>
          TASK TYPES
        </Typography>

        <Box sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          height: 400,
          background: 'rgba(248, 250, 252, 0.5)',
          borderRadius: '12px',
          p: 2
        }}>
          <VictoryChart
            horizontal
            height={400}
            width={500}
            padding={{ left: 120, top: 20, right: 40, bottom: 40 }}
            containerComponent={
              <VictoryContainer style={{
                borderRadius: '12px',
                background: 'transparent'
              }} />
            }
          >
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: "transparent" },
                tickLabels: {
                  fontSize: 11,
                  fill: "#64748b",
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                  fontWeight: 500
                },
                grid: {
                  stroke: "rgba(148, 163, 184, 0.1)",
                  strokeWidth: 1
                }
              }}
            />
            <VictoryAxis
              style={{
                axis: { stroke: "rgba(148, 163, 184, 0.2)", strokeWidth: 1 },
                tickLabels: {
                  fontSize: 10,
                  fill: "#64748b",
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                  fontWeight: 500
                },
                grid: { stroke: "none" }
              }}
              tickFormat={chartData.map(d => d.taskTypeName)}
              fixLabelOverlap={true}
            />
            <VictoryBar
              data={chartData}
              x="x"
              y="y"
              labels={({ datum }) => [
                `Task Type: ${datum.taskTypeName}`,
                `Category: ${datum.category}`,
                `Hours: ${formatHours(datum.hours)}`,
                `Count: ${datum.count}`,
                `Percentage: ${datum.percentage.toFixed(1)}%`
              ].join('\n')}
              labelComponent={
                <VictoryTooltip
                  style={{
                    fill: '#ffffff',
                    fontSize: 11,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                    fontWeight: 500
                  }}
                  flyoutStyle={{
                    fill: 'rgba(30, 41, 59, 0.95)',
                    stroke: 'rgba(255, 255, 255, 0.1)',
                    strokeWidth: 1,
                    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))',
                  }}
                />
              }
              style={{
                data: {
                  fill: ({ datum }) => datum.fill,
                  fillOpacity: 0.9,
                  stroke: "rgba(255, 255, 255, 0.3)",
                  strokeWidth: 1
                }
              }}
              cornerRadius={{ topRight: 8, bottomRight: 2 }}
              barRatio={0.7}
              animate={{
                duration: 800,
                onLoad: { duration: 400 },
                easing: "cubicInOut"
              }}
            />
          </VictoryChart>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskTypeChart;