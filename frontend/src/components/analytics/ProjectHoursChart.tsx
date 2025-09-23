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
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            PROJECT HOURS - COMPONENT IS WORKING
          </Typography>
          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={colorMode === 'default' ? 'contained' : 'outlined'}
              onClick={() => setColorMode('default')}
              sx={{ fontSize: '0.75rem' }}
            >
              Default
            </Button>
            <Button
              variant={colorMode === 'client' ? 'contained' : 'outlined'}
              onClick={() => setColorMode('client')}
              sx={{ fontSize: '0.75rem' }}
            >
              Client Colors
            </Button>
            <Button
              variant={colorMode === 'category' ? 'contained' : 'outlined'}
              onClick={() => setColorMode('category')}
              sx={{ fontSize: '0.75rem' }}
            >
              Category Colors
            </Button>
          </ButtonGroup>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, width: '100%', height: 300 }}>
          <VictoryChart
            height={300}
            width={500}
            padding={{ left: 40, top: 10, right: 10, bottom: 60 }}
            theme={VictoryTheme.material}
          >
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: "transparent" },
                tickLabels: { fontSize: 12, fill: "#666" },
                grid: { stroke: "none" }
              }}
            />
            <VictoryAxis
              style={{
                axis: { stroke: "transparent" },
                tickLabels: { fontSize: 10, fill: "#666", angle: -45 },
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
                  fillOpacity: 0.8,
                  stroke: "none"
                }
              }}
              cornerRadius={{ top: 4, bottom: 0 }}
              animate={{
                duration: 1000,
                onLoad: { duration: 500 }
              }}
            />
          </VictoryChart>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectHoursChart;