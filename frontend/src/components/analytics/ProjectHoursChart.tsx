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
  VictoryTooltip,
  VictoryTheme,
} from 'victory';
import { ProjectHoursDto } from '../../services/analyticsService';

interface ProjectHoursChartProps {
  data: ProjectHoursDto[];
}

type ColorMode = 'default' | 'client' | 'category';

const ProjectHoursChart: React.FC<ProjectHoursChartProps> = ({ data }) => {
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

  const processedData = data.map((project, index) => ({
    x: index + 1,
    y: project.hours,
    label: project.projectCode,
    projectName: project.projectName,
    clientName: project.clientName,
    categoryName: project.categoryName,
    hours: project.hours,
    percentage: project.percentage,
    fill: getBarColor(project),
  }));

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

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            PROJECT HOURS
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
            theme={VictoryTheme.material}
            padding={{ left: 60, top: 20, right: 20, bottom: 80 }}
            height={300}
            width={500}
          >
            <VictoryAxis
              dependentAxis
              tickFormat={(x) => `${x}h`}
              style={{
                tickLabels: { fontSize: 10, padding: 5 },
                grid: { stroke: "#e0e0e0", strokeDasharray: "3,3" }
              }}
            />
            <VictoryAxis
              tickFormat={(x, i) => data[i]?.projectCode || ''}
              style={{
                tickLabels: {
                  fontSize: 9,
                  padding: 5,
                  angle: -45,
                  textAnchor: 'end'
                }
              }}
            />
            <VictoryBar
              data={processedData}
              style={{
                data: {
                  fill: ({ datum }) => datum.fill,
                  fillOpacity: 0.8,
                  stroke: ({ datum }) => datum.fill,
                  strokeWidth: 1
                }
              }}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{
                    fill: "rgba(0, 0, 0, 0.8)",
                    stroke: "#ccc",
                    strokeWidth: 1
                  }}
                  style={{
                    fill: "white",
                    fontSize: 11,
                    fontFamily: "inherit"
                  }}
                  renderInPortal={false}
                />
              }
              events={[{
                target: "data",
                eventHandlers: {
                  onMouseOver: () => {
                    return [
                      {
                        target: "labels",
                        mutation: (props) => {
                          return {
                            text: getTooltipText(props.datum)
                          };
                        }
                      }
                    ];
                  },
                  onMouseOut: () => {
                    return [
                      {
                        target: "labels",
                        mutation: () => {
                          return null;
                        }
                      }
                    ];
                  }
                }
              }]}
            />
          </VictoryChart>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectHoursChart;