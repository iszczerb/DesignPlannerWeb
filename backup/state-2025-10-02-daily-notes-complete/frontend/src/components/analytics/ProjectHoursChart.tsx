import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  ButtonGroup,
  Button,
} from '@mui/material';
import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTheme,
  VictoryContainer,
} from 'victory';
import { ProjectHoursDto } from '../../services/analyticsService';

interface ProjectHoursChartProps {
  data: ProjectHoursDto[];
}

type ColorMode = 'default' | 'client' | 'category';

const ProjectHoursChart: React.FC<ProjectHoursChartProps> = ({ data }) => {
  console.log('🔍 PROJECT HOURS DATA:', data);
  console.log('🔍 DATA LENGTH:', data?.length);
  console.log('🔍 IS ARRAY:', Array.isArray(data));
  const [colorMode, setColorMode] = useState<ColorMode>('default');

  const getBarColor = (project: ProjectHoursDto) => {
    switch (colorMode) {
      case 'client':
        return project.clientColor || '#3b82f6';
      case 'category':
        return project.categoryColor || '#10b981';
      default:
        return '#3b82f6';
    }
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const getTooltipText = (datum: any) => {
    if (!datum) return '';

    return [
      `Project: ${datum.projectName}`,
      `Client: ${datum.clientName}`,
      `Category: ${datum.categoryName}`,
      `Hours: ${formatHours(datum.hours)}`,
      `Percentage: ${datum.percentage.toFixed(1)}%`
    ];
  };

  const processedData = data?.map((project, index) => ({
    x: index + 1,
    y: project.hours,
    projectName: project.projectName,
    clientName: project.clientName,
    categoryName: project.categoryName,
    hours: project.hours,
    percentage: project.percentage,
    fill: getBarColor(project),
  })) || [];

  console.log('🔍 PROCESSED DATA:', processedData);
  console.log('🔍 PROCESSED DATA LENGTH:', processedData.length);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{
            fontWeight: 700,
            color: '#1a1a1a',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif'
          }}>
            PROJECT HOURS
          </Typography>
          <ButtonGroup size="small" variant="outlined" sx={{
            '& .MuiButton-root': {
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'rgba(59, 130, 246, 0.2)',
              '&:hover': {
                borderColor: '#3b82f6',
                background: 'rgba(59, 130, 246, 0.05)'
              },
              '&.Mui-selected, &:active': {
                background: '#3b82f6',
                color: 'white',
                borderColor: '#3b82f6'
              }
            }
          }}>
            <Button
              variant={colorMode === 'default' ? 'contained' : 'outlined'}
              onClick={() => setColorMode('default')}
            >
              Default
            </Button>
            <Button
              variant={colorMode === 'client' ? 'contained' : 'outlined'}
              onClick={() => setColorMode('client')}
            >
              Client Colors
            </Button>
            <Button
              variant={colorMode === 'category' ? 'contained' : 'outlined'}
              onClick={() => setColorMode('category')}
            >
              Category Colors
            </Button>
          </ButtonGroup>
        </Box>

        <Box sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          height: 280,
          background: 'rgba(248, 250, 252, 0.5)',
          borderRadius: '12px',
          p: 2
        }}>
          <VictoryChart
            height={280}
            width={500}
            padding={{ left: 50, top: 20, right: 20, bottom: 60 }}
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
                  angle: -45,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto, sans-serif',
                  fontWeight: 500
                },
                grid: { stroke: "none" }
              }}
            />
            <VictoryBar
              data={processedData}
              x="projectName"
              y="hours"
              style={{
                data: {
                  fill: ({ datum }) => getBarColor(datum),
                  fillOpacity: 0.9,
                  stroke: "rgba(255, 255, 255, 0.3)",
                  strokeWidth: 1
                }
              }}
              cornerRadius={{ top: 8, bottom: 2 }}
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

export default ProjectHoursChart;