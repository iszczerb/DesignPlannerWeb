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
    <Card sx={{
      height: '100%',
      borderRadius: '20px',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      }
    }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" sx={{
          fontWeight: 600,
          color: 'rgba(15, 23, 42, 0.9)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          fontSize: '1.1rem',
          letterSpacing: '-0.02em',
          mb: 3,
          textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
        }}>
          CLIENT DISTRIBUTION
        </Typography>

        <Box sx={{
          flex: 1,
          minHeight: 0,
          height: 400,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 10px rgba(0, 0, 0, 0.05)',
          p: 2
        }}>
          <VictoryContainer
            width={500}
            height={400}
            style={{
              borderRadius: '12px',
              background: 'transparent'
            }}
          >
            <VictoryPie
              data={chartData}
              x="x"
              y="y"
              innerRadius={70}
              outerRadius={140}
              padAngle={3}
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
              animate={{
                duration: 800,
                onLoad: { duration: 400 },
                easing: "cubicInOut"
              }}
              style={{
                data: {
                  strokeWidth: 2,
                  stroke: "rgba(255, 255, 255, 0.8)",
                  fillOpacity: 0.95,
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                }
              }}
            />
            <VictoryLegend
              x={40}
              y={320}
              orientation="horizontal"
              gutter={15}
              rowGutter={8}
              style={{
                border: { stroke: 'transparent' },
                title: {
                  fontSize: 12,
                  fill: '#64748b',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                  fontWeight: 600
                },
                labels: {
                  fontSize: 11,
                  fill: '#64748b',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                  fontWeight: 500
                },
              }}
              data={chartData.map((item) => ({
                name: item.x,
                symbol: {
                  fill: item.clientColor,
                  type: 'circle',
                  size: 4
                },
              }))}
            />
          </VictoryContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClientDistributionChart;