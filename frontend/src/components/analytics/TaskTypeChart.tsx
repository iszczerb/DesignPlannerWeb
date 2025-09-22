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

  // Prepare data for Victory (horizontal bar chart)
  const chartData = data.map((item, index) => ({
    x: item.hours,
    y: index + 1,
    taskTypeName: item.taskTypeName,
    category: item.category,
    count: item.count,
    hours: item.hours,
    percentage: item.percentage,
  }));

  // Enhanced tooltip
  const getTooltipText = (datum: any) => {
    return [
      `Task Type: ${datum.taskTypeName}`,
      `Category: ${datum.category}`,
      `Hours: ${formatHours(datum.hours)}`,
      `Count: ${datum.count}`,
      `Percentage: ${datum.percentage.toFixed(1)}%`,
    ];
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          TASK TYPES
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0, height: 400 }}>
          <VictoryContainer width={400} height={400}>
            <VictoryChart
              horizontal
              padding={{ left: 80, top: 10, right: 20, bottom: 20 }}
            >
              <VictoryAxis
                dependentAxis
                style={{
                  tickLabels: { fontSize: 10, fill: '#666' },
                  grid: { stroke: '#e5e5e5', strokeDasharray: '2,2' },
                }}
              />
              <VictoryAxis
                style={{
                  tickLabels: { fontSize: 10, fill: '#666' },
                  tickFormat: chartData.map(d => d.taskTypeName),
                }}
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
                      fill: '#333',
                      fontSize: 12,
                      fontFamily: 'Roboto, sans-serif',
                    }}
                    flyoutStyle={{
                      fill: '#fff',
                      stroke: '#ccc',
                      strokeWidth: 1,
                    }}
                  />
                }
                style={{
                  data: { fill: '#10b981' },
                }}
                animate={{
                  duration: 1000,
                  onLoad: { duration: 500 },
                }}
              />
            </VictoryChart>
          </VictoryContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskTypeChart;