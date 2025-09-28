import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Psychology as SkillsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Skill } from '../../types/database';
import { EmployeeScheduleDto } from '../../types/schedule';
import databaseService from '../../services/databaseService';

interface SkillLevel {
  employeeId: number;
  skillId: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface SkillsManagementModalProps {
  open: boolean;
  onClose: () => void;
  employees: EmployeeScheduleDto[]; // Real employees from calendar data
}

const SkillsManagementModal: React.FC<SkillsManagementModalProps> = ({
  open,
  onClose,
  employees,
}) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load skills from database
  const loadSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const skillsData = await databaseService.getSkills();
      console.log('🎯 Skills loaded from database:', skillsData);
      setSkills(skillsData);
    } catch (err) {
      console.error('❌ Error loading skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  // Load existing employee skills from localStorage (temporary until backend is fixed)
  const loadEmployeeSkills = async () => {
    try {
      // TODO: Fix backend endpoint for employee skills
      // const employeeSkillsData = await databaseService.getEmployeeSkills();

      // For now, load from localStorage
      const savedSkills = localStorage.getItem('employeeSkills');
      if (savedSkills) {
        const parsedSkills = JSON.parse(savedSkills);
        setSkillLevels(parsedSkills);
      } else {
        setSkillLevels([]);
      }
    } catch (err) {
      console.error('❌ Error loading employee skills:', err);
      setSkillLevels([]);
    }
  };

  // Save skills to localStorage (temporary until backend is fixed)
  const saveSkillsToStorage = (skillLevels: SkillLevel[]) => {
    try {
      localStorage.setItem('employeeSkills', JSON.stringify(skillLevels));
    } catch (err) {
      console.error('❌ Error saving skills to localStorage:', err);
    }
  };

  // Load skills when modal opens
  useEffect(() => {
    if (open) {
      loadSkills();
      loadEmployeeSkills();
    }
  }, [open]);

  // Calculate statistics
  const calculateStats = () => {
    const skillUsageCount = skills.map(skill => ({
      skill,
      count: skillLevels.filter(sl => sl.skillId === skill.id).length
    }));

    const skillAverages = skills.map(skill => {
      const levels = skillLevels.filter(sl => sl.skillId === skill.id);
      if (levels.length === 0) return { skill, average: 0 };

      const scores = levels.map(l => l.level === 'advanced' ? 1 : l.level === 'intermediate' ? 0.5 : 0);
      const average = scores.reduce((sum, score) => sum + score, 0) / levels.length;
      return { skill, average };
    });

    const mostUsed = skillUsageCount.reduce((max, current) =>
      current.count > max.count ? current : max, skillUsageCount[0] || { skill: { name: 'N/A' }, count: 0 });

    const leastUsed = skillUsageCount.reduce((min, current) =>
      current.count < min.count && current.count > 0 ? current : min,
      skillUsageCount.find(sc => sc.count > 0) || { skill: { name: 'N/A' }, count: 0 });

    const highestAvg = skillAverages.reduce((max, current) =>
      current.average > max.average ? current : max, skillAverages[0] || { skill: { name: 'N/A' }, average: 0 });

    const lowestAvg = skillAverages.reduce((min, current) =>
      current.average < min.average && current.average > 0 ? current : min,
      skillAverages.find(sa => sa.average > 0) || { skill: { name: 'N/A' }, average: 0 });

    return {
      mostUsed,
      leastUsed,
      highestAvg,
      lowestAvg,
      skillAverages
    };
  };

  const stats = calculateStats();

  // Get skill level for employee
  const getSkillLevel = (employeeId: number, skillId: number): 'beginner' | 'intermediate' | 'advanced' | null => {
    const level = skillLevels.find(sl => sl.employeeId === employeeId && sl.skillId === skillId);
    return level?.level || null;
  };

  // Update skill level
  const updateSkillLevel = async (employeeId: number, skillId: number, level: 'beginner' | 'intermediate' | 'advanced' | null) => {
    try {
      if (level === null) {
        // TODO: Delete from database when backend is fixed
        // await databaseService.deleteEmployeeSkill(employeeId, skillId);

        setSkillLevels(prev => {
          const newLevels = prev.filter(sl => !(sl.employeeId === employeeId && sl.skillId === skillId));
          saveSkillsToStorage(newLevels);
          return newLevels;
        });
      } else {
        // TODO: Save to database when backend is fixed
        // const proficiencyLevel = level === 'beginner' ? 2 : level === 'intermediate' ? 3 : 5;
        // await databaseService.updateEmployeeSkill(employeeId, skillId, {
        //   proficiencyLevel,
        //   notes: null
        // });

        setSkillLevels(prev => {
          const existing = prev.find(sl => sl.employeeId === employeeId && sl.skillId === skillId);
          let newLevels;
          if (existing) {
            newLevels = prev.map(sl =>
              sl.employeeId === employeeId && sl.skillId === skillId
                ? { ...sl, level }
                : sl
            );
          } else {
            newLevels = [...prev, { employeeId, skillId, level }];
          }
          saveSkillsToStorage(newLevels);
          return newLevels;
        });
      }
    } catch (err) {
      console.error('❌ Error saving skill level:', err);
      setError(err instanceof Error ? err.message : 'Failed to save skill level');
    }
  };

  // Calculate employee average
  const getEmployeeAverage = (employeeId: number): number => {
    const levels = skillLevels.filter(sl => sl.employeeId === employeeId);
    if (levels.length === 0) return 0;

    const scores = levels.map(l => l.level === 'advanced' ? 1 : l.level === 'intermediate' ? 0.5 : 0);
    return scores.reduce((sum, score) => sum + score, 0) / levels.length;
  };

  // Render skill indicator
  const renderSkillIndicator = (employeeId: number, skillId: number) => {
    const level = getSkillLevel(employeeId, skillId);

    const getNextLevel = () => {
      if (!level) return 'intermediate';
      if (level === 'intermediate') return 'advanced';
      if (level === 'advanced') return null;
      return 'intermediate';
    };

    const handleClick = async () => {
      if (isEditMode) {
        const nextLevel = getNextLevel();
        await updateSkillLevel(employeeId, skillId, nextLevel);
      }
    };

    return (
      <Box
        sx={{
          width: 24,
          height: 24,
          cursor: isEditMode ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: isEditMode ? '1px dashed var(--dp-neutral-300)' : 'none',
          borderRadius: 'var(--dp-radius-sm)',
          transition: 'var(--dp-transition-fast)',
          '&:hover': isEditMode ? {
            backgroundColor: 'var(--dp-neutral-100)',
          } : {},
        }}
        onClick={handleClick}
      >
        {level === 'intermediate' && (
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: 'var(--dp-primary-500)',
              border: '1px solid var(--dp-primary-700)',
              borderRadius: 'var(--dp-radius-sm)',
            }}
          />
        )}
        {level === 'advanced' && (
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: 'var(--dp-success-500)',
              borderRadius: '50%',
              border: '1px solid var(--dp-success-700)',
            }}
          />
        )}
        {!level && isEditMode && (
          <Box
            sx={{
              width: 16,
              height: 16,
              border: '1px dashed var(--dp-neutral-300)',
              borderRadius: 'var(--dp-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: 'var(--dp-neutral-500)',
              fontFamily: 'var(--dp-font-family-primary)',
              fontWeight: 'var(--dp-font-weight-medium)',
            }}
          >
            +
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      disablePortal
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          borderRadius: 2,
          backgroundColor: 'var(--dp-neutral-0) !important',
        }
      }}
    >
      <DialogContent sx={{
        p: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--dp-neutral-0) !important',
      }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid var(--dp-neutral-200)',
            backgroundColor: 'var(--dp-primary-600)',
            color: 'var(--dp-neutral-0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'var(--dp-font-weight-bold)', mb: 0.5, fontFamily: 'var(--dp-font-family-primary)' }}>
              Skills Management
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontFamily: 'var(--dp-font-family-primary)' }}>
              Track and manage team member skills and competencies
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setIsEditMode(!isEditMode)}
              sx={{
                backgroundColor: isEditMode ? 'var(--dp-error-500)' : 'var(--dp-primary-500)',
                fontFamily: 'var(--dp-font-family-primary)',
                fontWeight: 'var(--dp-font-weight-medium)',
                transition: 'var(--dp-transition-fast)',
                boxShadow: 'var(--dp-shadow-sm)',
                '&:hover': {
                  backgroundColor: isEditMode ? 'var(--dp-error-600)' : 'var(--dp-primary-600)',
                  boxShadow: 'var(--dp-shadow-md)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {isEditMode ? 'Done Editing' : 'Edit Skills'}
            </Button>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          backgroundColor: 'var(--dp-neutral-25) !important',
        }}>
          {loading ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
              gap: 'var(--dp-space-4)'
            }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  border: '3px solid var(--dp-neutral-200)',
                  borderTop: '3px solid var(--dp-primary-500)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <Typography sx={{ color: 'var(--dp-neutral-600)', fontFamily: 'var(--dp-font-family-primary)' }}>Loading skills data...</Typography>
            </Box>
          ) : (
            <>
              {/* Statistics Cards */}
              <Grid container spacing={3} sx={{
                mb: 4,
                '[data-theme="dark"] &': {
                  backgroundColor: 'transparent !important',
                }
              }}>
                <Grid size={3}>
                  <Card sx={{
                    height: '100%',
                    backgroundColor: 'var(--dp-neutral-50)',
                    border: '1px solid var(--dp-neutral-200)',
                    borderRadius: 'var(--dp-radius-lg)',
                    boxShadow: 'var(--dp-shadow-sm)',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      boxShadow: 'var(--dp-shadow-md)',
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUpIcon sx={{ color: 'var(--dp-primary-500)', mr: 1 }} />
                        <Typography variant="body2" sx={{ color: 'var(--dp-neutral-600)', fontFamily: 'var(--dp-font-family-primary)' }}>
                          Most Used Skill
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'var(--dp-font-weight-bold)', color: 'var(--dp-primary-700)', fontFamily: 'var(--dp-font-family-primary)' }}>
                        {stats.mostUsed.skill.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--dp-primary-500)', fontFamily: 'var(--dp-font-family-primary)' }}>
                        {stats.mostUsed.count} task types
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={3}>
                  <Card sx={{
                    height: '100%',
                    backgroundColor: 'var(--dp-error-50)',
                    border: '1px solid var(--dp-error-200)',
                    borderRadius: 'var(--dp-radius-lg)',
                    boxShadow: 'var(--dp-shadow-sm)',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      boxShadow: 'var(--dp-shadow-md)',
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingDownIcon sx={{ color: 'var(--dp-error-500)', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Least Used Skill
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'var(--dp-font-weight-bold)', color: 'var(--dp-error-700)', fontFamily: 'var(--dp-font-family-primary)' }}>
                        {stats.leastUsed.skill.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--dp-error-500)', fontFamily: 'var(--dp-font-family-primary)' }}>
                        {stats.leastUsed.count} task types
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={3}>
                  <Card sx={{
                    height: '100%',
                    backgroundColor: 'var(--dp-success-50)',
                    border: '1px solid var(--dp-success-200)',
                    borderRadius: 'var(--dp-radius-lg)',
                    boxShadow: 'var(--dp-shadow-sm)',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      boxShadow: 'var(--dp-shadow-md)',
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StarIcon sx={{ color: 'var(--dp-success-500)', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Highest Avg Skill
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'var(--dp-font-weight-bold)', color: 'var(--dp-success-700)', fontFamily: 'var(--dp-font-family-primary)' }}>
                        {stats.highestAvg.skill.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--dp-success-500)', fontFamily: 'var(--dp-font-family-primary)' }}>
                        {stats.highestAvg.average.toFixed(2)} avg score
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={3}>
                  <Card sx={{
                    height: '100%',
                    backgroundColor: 'var(--dp-warning-50)',
                    border: '1px solid var(--dp-warning-200)',
                    borderRadius: 'var(--dp-radius-lg)',
                    boxShadow: 'var(--dp-shadow-sm)',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      boxShadow: 'var(--dp-shadow-md)',
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SkillsIcon sx={{ color: 'var(--dp-warning-500)', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Lowest Avg Skill
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'var(--dp-font-weight-bold)', color: 'var(--dp-warning-700)', fontFamily: 'var(--dp-font-family-primary)' }}>
                        {stats.lowestAvg.skill.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--dp-warning-500)', fontFamily: 'var(--dp-font-family-primary)' }}>
                        {stats.lowestAvg.average.toFixed(2)} avg score
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Team Skills Matrix */}
              <Card sx={{
                border: '1px solid var(--dp-neutral-200)',
                borderRadius: 'var(--dp-radius-lg)',
                boxShadow: 'var(--dp-shadow-sm)',
                backgroundColor: 'var(--dp-neutral-0)',
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{
                    mb: 3,
                    fontWeight: 'var(--dp-font-weight-bold)',
                    fontFamily: 'var(--dp-font-family-primary)',
                    color: 'var(--dp-neutral-800)'
                  }}>
                    Team Skills Matrix
                  </Typography>

                  <TableContainer sx={{
                    '[data-theme="dark"] &': {
                      backgroundColor: 'transparent',
                    }
                  }}>
                    <Table sx={{
                      '[data-theme="dark"] &': {
                        backgroundColor: 'transparent',
                      }
                    }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{
                            fontWeight: 'var(--dp-font-weight-bold)',
                            backgroundColor: 'var(--dp-neutral-50)',
                            fontFamily: 'var(--dp-font-family-primary)',
                            color: 'var(--dp-neutral-700)',
                            borderBottom: '1px solid var(--dp-neutral-200)'
                          }}>Skill</TableCell>
                          {employees.map((employee) => (
                            <TableCell key={employee.employeeId} align="center" sx={{
                              fontWeight: 'var(--dp-font-weight-bold)',
                              backgroundColor: 'var(--dp-neutral-50)',
                              fontFamily: 'var(--dp-font-family-primary)',
                              borderBottom: '1px solid var(--dp-neutral-200)'
                            }}>
                              <Box>
                                <Typography variant="body2" sx={{
                                  fontWeight: 'var(--dp-font-weight-bold)',
                                  color: 'var(--dp-primary-700)',
                                  fontFamily: 'var(--dp-font-family-primary)'
                                }}>
                                  {employee.employeeName}
                                </Typography>
                                <Typography variant="caption" sx={{
                                  color: 'var(--dp-neutral-600)',
                                  fontFamily: 'var(--dp-font-family-primary)'
                                }}>
                                  {employee.role}
                                </Typography>
                              </Box>
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={{
                            fontWeight: 'var(--dp-font-weight-bold)',
                            backgroundColor: 'var(--dp-neutral-50)',
                            fontFamily: 'var(--dp-font-family-primary)',
                            color: 'var(--dp-neutral-700)',
                            borderBottom: '1px solid var(--dp-neutral-200)'
                          }}>
                            Avg
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {skills.map((skill) => {
                          const skillAvg = stats.skillAverages.find(sa => sa.skill.id === skill.id);
                          return (
                            <TableRow key={skill.id}>
                              <TableCell sx={{
                                fontWeight: 'var(--dp-font-weight-semibold)',
                                fontFamily: 'var(--dp-font-family-primary)',
                                color: 'var(--dp-neutral-700)',
                                borderBottom: '1px solid var(--dp-neutral-100)'
                              }}>{skill.name}</TableCell>
                              {employees.map((employee) => (
                                <TableCell key={employee.employeeId} align="center">
                                  {renderSkillIndicator(employee.employeeId, skill.id)}
                                </TableCell>
                              ))}
                              <TableCell align="center" sx={{
                                fontWeight: 'var(--dp-font-weight-semibold)',
                                fontFamily: 'var(--dp-font-family-primary)',
                                color: 'var(--dp-neutral-700)',
                                borderBottom: '1px solid var(--dp-neutral-100)'
                              }}>
                                {skillAvg ? skillAvg.average.toFixed(2) : '0.00'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ backgroundColor: 'var(--dp-neutral-50)' }}>
                          <TableCell sx={{
                            fontWeight: 'var(--dp-font-weight-bold)',
                            fontFamily: 'var(--dp-font-family-primary)',
                            color: 'var(--dp-neutral-800)'
                          }}>Employee Average</TableCell>
                          {employees.map((employee) => (
                            <TableCell key={employee.employeeId} align="center" sx={{
                              fontWeight: 'var(--dp-font-weight-bold)',
                              fontFamily: 'var(--dp-font-family-primary)',
                              color: 'var(--dp-neutral-800)'
                            }}>
                              {getEmployeeAverage(employee.employeeId).toFixed(2)}
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={{
                            fontWeight: 'var(--dp-font-weight-bold)',
                            fontFamily: 'var(--dp-font-family-primary)',
                            color: 'var(--dp-neutral-800)'
                          }}>
                            {(employees.reduce((sum, emp) => sum + getEmployeeAverage(emp.employeeId), 0) / employees.length).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--dp-neutral-50) !important',
            borderTop: '1px solid var(--dp-neutral-200)',
          }}
        >
          <Typography variant="caption" sx={{
            color: 'var(--dp-neutral-600)',
            fontFamily: 'var(--dp-font-family-primary)'
          }}>
            Last Updated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>

          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              backgroundColor: 'var(--dp-primary-500)',
              fontFamily: 'var(--dp-font-family-primary)',
              fontWeight: 'var(--dp-font-weight-medium)',
              transition: 'var(--dp-transition-fast)',
              boxShadow: 'var(--dp-shadow-sm)',
              '&:hover': {
                backgroundColor: 'var(--dp-primary-600)',
                boxShadow: 'var(--dp-shadow-md)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Close
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SkillsManagementModal;