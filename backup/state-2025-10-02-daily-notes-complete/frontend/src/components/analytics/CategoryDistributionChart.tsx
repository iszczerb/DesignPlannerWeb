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
    <Card sx={{
      height: '100%',
      borderRadius: '24px',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
      '&:hover': {
        transform: 'translateY(-4px) scale(1.02)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(25px)'
      }
    }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" sx={{
          fontWeight: 700,
          color: 'rgba(15, 23, 42, 0.95)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
          fontSize: '1.2rem',
          letterSpacing: '-0.03em',
          mb: 3,
          textShadow: '0 1px 3px rgba(255, 255, 255, 0.9)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 58, 138, 0.8))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          CATEGORY DISTRIBUTION
        </Typography>

        <Box sx={{
          flex: 1,
          minHeight: 0,
          height: 400,
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
          backdropFilter: 'blur(15px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 20px rgba(0, 0, 0, 0.08)',
          p: 2,
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04))',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="y"
                nameKey="x"
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={130}
                paddingAngle={3}
                animationDuration={800}
                animationEasing="ease-out"
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.categoryColor}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                      opacity: 0.95
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Box sx={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.9))',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px',
                        p: 2.5,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        minWidth: 200
                      }}>
                        <Typography sx={{
                          fontSize: '11px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                          fontWeight: 600,
                          mb: 0.5
                        }}>
                          {`Category: ${data.x}`}
                        </Typography>
                        <Typography sx={{
                          fontSize: '11px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                          fontWeight: 500,
                          opacity: 0.9
                        }}>
                          {`Hours: ${formatHours(data.y)}`}
                        </Typography>
                        <Typography sx={{
                          fontSize: '11px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                          fontWeight: 500,
                          opacity: 0.9
                        }}>
                          {`Tasks: ${data.taskCount}`}
                        </Typography>
                        <Typography sx={{
                          fontSize: '11px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                          fontWeight: 500,
                          opacity: 0.9
                        }}>
                          {`Percentage: ${data.label}`}
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={40}
                iconType="circle"
                wrapperStyle={{
                  paddingTop: '15px',
                  fontSize: '11px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                  fontWeight: 500,
                  color: '#64748b'
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