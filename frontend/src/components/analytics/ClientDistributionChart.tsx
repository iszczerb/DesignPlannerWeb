import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  VictoryPie,
  VictoryContainer,
  VictoryTooltip,
  VictoryLegend,
} from 'victory';
import { ClientDistributionDto } from '../../services/analyticsService';

interface ClientDistributionChartProps {
  data: ClientDistributionDto[];
}

const ClientDistributionChart: React.FC<ClientDistributionChartProps> = ({ data }) => {
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  // Prepare data for Victory
  const chartData = data.map((item) => ({
    x: item.clientName,
    y: item.hours,
    label: `${item.percentage.toFixed(1)}%`,
    clientCode: item.clientCode,
    clientColor: item.clientColor || '#3b82f6',
    projectCount: item.projectCount,
    taskCount: item.taskCount,
  }));

  // Enhanced tooltip
  const getTooltipText = (datum: any) => {
    return [
      `Client: ${datum.x}`,
      `Code: ${datum.clientCode}`,
      `Hours: ${formatHours(datum.y)}`,
      `Projects: ${datum.projectCount}`,
      `Tasks: ${datum.taskCount}`,
      `Percentage: ${datum.label}`,
    ];
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          CLIENT DISTRIBUTION
        </Typography>

        <Box sx={{ flex: 1, minHeight: 0, height: 400 }}>
          <VictoryContainer width={400} height={400}>
            <VictoryPie
              data={chartData}
              x="x"
              y="y"
              innerRadius={60}
              outerRadius={120}
              padAngle={2}
              colorScale={chartData.map(d => d.clientColor)}
              labels={({ datum }) => [
                `Client: ${datum.x}`,
                `Code: ${datum.clientCode}`,
                `Hours: ${formatHours(datum.y)}`,
                `Projects: ${datum.projectCount}`,
                `Tasks: ${datum.taskCount}`,
                `Percentage: ${datum.label}`
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
              animate={{
                duration: 1000,
              }}
            />
            <VictoryLegend
              x={20}
              y={280}
              orientation="horizontal"
              gutter={10}
              style={{
                border: { stroke: 'transparent' },
                title: { fontSize: 14, fill: '#333' },
                labels: { fontSize: 10, fill: '#333' },
              }}
              data={chartData.map((item) => ({
                name: item.x,
                symbol: { fill: item.clientColor },
              }))}
            />
          </VictoryContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClientDistributionChart;