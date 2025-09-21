import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { TaskTypeAnalyticsDto } from '../../services/analyticsService';

interface TaskTypeChartProps {
  data: TaskTypeAnalyticsDto[];
}

const TaskTypeChart: React.FC<TaskTypeChartProps> = ({ data }) => {
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          TASK TYPES
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="horizontal"
              margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={10} />
              <YAxis
                dataKey="taskTypeName"
                type="category"
                width={75}
                fontSize={10}
                interval={0}
              />
              <RechartsTooltip
                formatter={(value: any) => [formatHours(value), 'Hours']}
                labelFormatter={(label) => `Task Type: ${label}`}
              />
              <Bar dataKey="hours" fill="#10b981" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskTypeChart;