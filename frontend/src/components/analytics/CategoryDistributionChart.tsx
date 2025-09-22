import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CategoryDistributionDto } from '../../services/analyticsService';

interface CategoryDistributionChartProps {
  data: CategoryDistributionDto[];
}

const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ data }) => {
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  // Prepare data for Victory
  const chartData = data.map((item) => ({
    x: item.categoryName,
    y: item.hours,
    label: `${item.percentage.toFixed(1)}%`,
    categoryColor: item.color || '#3b82f6',
    taskCount: item.taskCount,
  }));

  // Enhanced tooltip
  const getTooltipText = (datum: any) => {
    return [
      `Category: ${datum.x}`,
      `Hours: ${formatHours(datum.y)}`,
      `Tasks: ${datum.taskCount}`,
      `Percentage: ${datum.label}`,
    ];
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          CATEGORY DISTRIBUTION
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0, height: 400, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="y"
                nameKey="x"
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                animationDuration={250}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.categoryColor} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  formatHours(value),
                  'Hours'
                ]}
                labelFormatter={(label: any) => `Category: ${label}`}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Box sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        p: 1,
                        fontSize: '12px'
                      }}>
                        <Typography variant="body2">{`Category: ${data.x}`}</Typography>
                        <Typography variant="body2">{`Hours: ${formatHours(data.y)}`}</Typography>
                        <Typography variant="body2">{`Tasks: ${data.taskCount}`}</Typography>
                        <Typography variant="body2">{`Percentage: ${data.label}`}</Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryDistributionChart;