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
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { ClientDistributionDto } from '../../services/analyticsService';

interface ClientDistributionChartProps {
  data: ClientDistributionDto[];
}

const ClientDistributionChart: React.FC<ClientDistributionChartProps> = ({ data }) => {
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  // Custom label function for pie charts
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          CLIENT DISTRIBUTION
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as any}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="70%"
                dataKey="hours"
                nameKey="clientName"
                labelLine={false}
                label={renderCustomLabel}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.clientColor || '#3b82f6'} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: any) => [formatHours(value), 'Hours']}
                labelFormatter={(label) => `Client: ${label}`}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClientDistributionChart;