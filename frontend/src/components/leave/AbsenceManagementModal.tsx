import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  IconButton,
  Grid,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  TimeToLeave as AbsenceIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as StatsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  absenceService,
  AbsenceOverview,
  AbsenceAllocation,
  AbsenceRecord,
  AbsenceType,
  CreateAbsenceAllocation,
  UpdateAbsenceAllocation
} from '../../services/absenceService';
import { useAppSelector } from '../../store/hooks';
import { UserRole } from '../../types/auth';

interface AbsenceManagementModalProps {
  open: boolean;
  onClose: () => void;
  onRequestProcessed: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`absence-tabpanel-${index}`}
      aria-labelledby={`absence-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2, '[data-theme="dark"] &': { backgroundColor: 'transparent' } }}>{children}</Box>}
    </div>
  );
};

const AbsenceManagementModal: React.FC<AbsenceManagementModalProps> = ({
  open,
  onClose,
  onRequestProcessed
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Overview State
  const [overview, setOverview] = useState<AbsenceOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Team Allocations State
  const [teamAllocations, setTeamAllocations] = useState<AbsenceAllocation[]>([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<UpdateAbsenceAllocation | null>(null);

  // Stats State
  const [absenceStats, setAbsenceStats] = useState<Record<AbsenceType, number>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  const isManager = user && (user.role === UserRole.Admin || user.role === UserRole.Manager);
  const currentYear = new Date().getFullYear();

  const refreshAllData = async () => {
    await loadTeamAllocations();
    // Also refresh any other data that might be affected
    if (activeTab === 0) {
      // Reload overview data if needed
      // await loadOverview();
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadTeamAllocations(); // Load team allocations for all tabs
    }
  }, [open]);

  // Refresh data when tab changes to ensure fresh data
  useEffect(() => {
    if (open) {
      refreshAllData();
    }
  }, [activeTab, open]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    setError(null);
    try {
      const data = await absenceService.getAbsenceOverview();
      setOverview(data);
    } catch (error: any) {
      console.error('Error loading absence overview:', error);
      setError('Failed to load absence overview');
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadTeamAllocations = async () => {
    setLoadingAllocations(true);
    setError(null);
    try {
      const allocations = await absenceService.getTeamAllocations();
      setTeamAllocations(allocations || []);
    } catch (error: any) {
      console.error('Error loading team allocations:', error);
      setError('Failed to load team allocations');
    } finally {
      setLoadingAllocations(false);
    }
  };

  const loadAbsenceStats = async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const stats = await absenceService.getTeamAbsenceStats(undefined, currentYear);
      setAbsenceStats(stats || {});
    } catch (error: any) {
      console.error('Error loading absence stats:', error);
      setError('Failed to load absence statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleEditAllocation = (allocation: AbsenceAllocation) => {
    setEditingAllocation(allocation.id);
    setEditValues({
      id: allocation.id,
      annualLeaveDays: allocation.annualLeaveDays,
      sickDaysAllowed: allocation.sickDaysAllowed,
      otherLeaveDaysAllowed: allocation.otherLeaveDaysAllowed
    });
  };

  const handleSaveAllocation = async () => {
    if (!editValues) return;

    setLoading(true);
    setError(null);

    try {
      await absenceService.updateAllocation(editValues);
      setSuccess('Allocation updated successfully');
      setEditingAllocation(null);
      setEditValues(null);
      await refreshAllData(); // Use new refresh function
      onRequestProcessed();

      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error updating allocation:', error);
      setError(error.response?.data?.message || 'Failed to update allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAllocation(null);
    setEditValues(null);
  };

  const getProgressColor = (used: number, total: number): 'success' | 'warning' | 'error' => {
    const percentage = (used / total) * 100;
    if (percentage <= 50) return 'success';
    if (percentage <= 80) return 'warning';
    return 'error';
  };

  const formatDaysDisplay = (days: number | undefined): string => {
    if (days === undefined || days === null) return '0';
    if (days === 0) return '0';
    if (days === 0.5) return '0.5';
    if (days % 1 === 0.5) return days.toFixed(1);
    if (days % 1 === 0) return days.toString();
    return days.toFixed(1);
  };

  const renderOverviewTab = () => (
    <TabPanel value={activeTab} index={0}>
      {loadingOverview ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : !overview ? (
        <Alert severity="info">
          No absence data available. Allocations will be created automatically when needed.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Current Year Allocation */}
          {overview?.allocations && overview.allocations.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon />
                  {currentYear} Annual Leave Balance
                </Typography>

                {overview?.allocations?.map((allocation) => (
                  <Box key={allocation.id} sx={{ mt: 2 }}>
                    <Grid container spacing={2} sx={{
            '[data-theme="dark"] &': {
              backgroundColor: 'transparent',
            }
          }}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {formatDaysDisplay(allocation.remainingAnnualLeaveDays)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Days Remaining
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Annual Leave</Typography>
                            <Typography variant="body2">
                              {formatDaysDisplay(allocation.usedAnnualLeaveDays)} / {allocation.annualLeaveDays} days
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(allocation.usedAnnualLeaveDays / allocation.annualLeaveDays) * 100}
                            color={getProgressColor(allocation.usedAnnualLeaveDays, allocation.annualLeaveDays)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>

                        <Grid container spacing={2} sx={{
            '[data-theme="dark"] &': {
              backgroundColor: 'transparent',
            }
          }}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                              <Typography variant="body2" color="warning.contrastText">
                                Sick Days: {allocation.usedSickDays}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                              <Typography variant="body2" color="info.contrastText">
                                Other Leave: {allocation.usedOtherLeaveDays}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Absence Records */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AbsenceIcon />
                Recent Absences
              </Typography>

              {!overview?.records || overview.records.length === 0 ? (
                <Alert severity="info">No absence records found.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Dates</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overview?.records?.slice(0, 10).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Chip
                              label={absenceService.getAbsenceTypeLabel(record.absenceType)}
                              color={absenceService.getAbsenceTypeColor(record.absenceType)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.startDate), 'MMM dd')} - {format(new Date(record.endDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {absenceService.formatDaysForDisplay(record.hours)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={record.isApproved ? 'Approved' : 'Pending'}
                              color={record.isApproved ? 'success' : 'warning'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </TabPanel>
  );

  const renderTeamAllocationsTab = () => (
    <TabPanel value={activeTab} index={1}>
      {!isManager ? (
        <Alert severity="warning">
          Only managers and administrators can view and edit team allocations.
        </Alert>
      ) : loadingAllocations ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Team Leave Allocations - {currentYear}
            </Typography>
            <Tooltip title="Allocations are created automatically when employees are assigned leave">
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {!teamAllocations || teamAllocations.length === 0 ? (
            <Alert severity="info">
              No team allocations found. Allocations will be created automatically when employees are assigned leave.
            </Alert>
          ) : (
            <Grid container spacing={2} sx={{
            '[data-theme="dark"] &': {
              backgroundColor: 'transparent',
            }
          }}>
              {teamAllocations?.map((allocation) => (
                <Grid item xs={12} md={6} key={allocation.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {allocation.employeeName}
                      </Typography>

                      {editingAllocation === allocation.id ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Annual Leave Days"
                            type="number"
                            value={editValues?.annualLeaveDays || 0}
                            onChange={(e) => setEditValues(prev => prev ? {
                              ...prev,
                              annualLeaveDays: parseInt(e.target.value)
                            } : null)}
                            size="small"
                          />
                          <TextField
                            label="Sick Days Allowed"
                            type="number"
                            value={editValues?.sickDaysAllowed || 0}
                            onChange={(e) => setEditValues(prev => prev ? {
                              ...prev,
                              sickDaysAllowed: parseInt(e.target.value)
                            } : null)}
                            size="small"
                          />
                          <TextField
                            label="Other Leave Days Allowed"
                            type="number"
                            value={editValues?.otherLeaveDaysAllowed || 0}
                            onChange={(e) => setEditValues(prev => prev ? {
                              ...prev,
                              otherLeaveDaysAllowed: parseInt(e.target.value)
                            } : null)}
                            size="small"
                          />
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" gutterBottom sx={{
                            color: 'var(--dp-neutral-600)',
                            fontFamily: 'var(--dp-font-family-primary)',
                            '[data-theme="dark"] &': {
                              color: 'var(--dp-neutral-300)',
                            }
                          }}>
                            Annual Leave: {formatDaysDisplay(allocation.usedAnnualLeaveDays)} / {allocation.annualLeaveDays} days
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(allocation.usedAnnualLeaveDays / allocation.annualLeaveDays) * 100}
                            color={getProgressColor(allocation.usedAnnualLeaveDays, allocation.annualLeaveDays)}
                            sx={{ mb: 2, height: 6, borderRadius: 3 }}
                          />

                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Sick: {formatDaysDisplay(allocation.usedSickDays)} days
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                Other Leave: {formatDaysDisplay(allocation.usedOtherLeaveDays)} days
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions>
                      {editingAllocation === allocation.id ? (
                        <>
                          <LoadingButton
                            startIcon={<SaveIcon />}
                            onClick={handleSaveAllocation}
                            loading={loading}
                            size="small"
                          >
                            Save
                          </LoadingButton>
                          <Button
                            startIcon={<CancelIcon />}
                            onClick={handleCancelEdit}
                            size="small"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          startIcon={<EditIcon />}
                          onClick={() => handleEditAllocation(allocation)}
                          size="small"
                        >
                          Edit
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </TabPanel>
  );

  const renderStatsTab = () => (
    <TabPanel value={activeTab} index={2}>
      {!isManager ? (
        <Alert severity="warning">
          Only managers and administrators can view absence statistics.
        </Alert>
      ) : loadingStats ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StatsIcon />
            Team Absence Statistics - {currentYear}
          </Typography>

          <Grid container spacing={2} sx={{
            '[data-theme="dark"] &': {
              backgroundColor: 'transparent',
            }
          }}>
            {Object.entries(absenceStats || {}).map(([type, count]) => (
              <Grid item xs={12} sm={6} md={3} key={type}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {count}
                    </Typography>
                    <Typography variant="body1">
                      {absenceService.getAbsenceTypeLabel(parseInt(type) as AbsenceType)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      days used
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </TabPanel>
  );

  // Helper function to render team member cards for each absence type
  const renderTeamMemberCard = (allocation: AbsenceAllocation, absenceType: 'annual' | 'sick' | 'otherLeave') => {
    const getTypeData = () => {
      switch (absenceType) {
        case 'annual':
          return {
            used: allocation.usedAnnualLeaveDays,
            total: allocation.annualLeaveDays,
            remaining: allocation.remainingAnnualLeaveDays,
            color: 'primary' as const
          };
        case 'sick':
          return {
            used: allocation.usedSickDays,
            total: allocation.sickDaysAllowed,
            remaining: allocation.sickDaysAllowed - allocation.usedSickDays,
            color: 'warning' as const
          };
        case 'otherLeave':
          return {
            used: allocation.usedOtherLeaveDays,
            total: allocation.otherLeaveDaysAllowed,
            remaining: allocation.otherLeaveDaysAllowed - allocation.usedOtherLeaveDays,
            color: 'info' as const
          };
      }
    };

    const typeData = getTypeData();
    const percentage = typeData.total > 0 ? (typeData.used / typeData.total) * 100 : 0;

    return (
      <Card key={`${allocation.id}-${absenceType}`} sx={{
        height: '100%',
        border: '1px solid var(--dp-neutral-200)',
        borderRadius: 'var(--dp-radius-lg)',
        boxShadow: 'var(--dp-shadow-sm)',
        backgroundColor: 'var(--dp-neutral-0)',
        transition: 'var(--dp-transition-fast)',
        '&:hover': {
          boxShadow: 'var(--dp-shadow-md)',
          transform: 'translateY(-2px)',
        }
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{
                fontFamily: 'var(--dp-font-family-primary)',
                fontWeight: 'var(--dp-font-weight-bold)',
                color: 'var(--dp-neutral-800)'
              }}>
                {allocation.employeeName}
              </Typography>
              <Typography variant="body2" sx={{
                color: 'var(--dp-neutral-600)',
                fontFamily: 'var(--dp-font-family-primary)'
              }}>
                {allocation.employeePosition}
              </Typography>
            </Box>
            <Typography variant="h4" sx={{
              color: typeData.color === 'primary' ? 'var(--dp-primary-600)' :
                     typeData.color === 'warning' ? 'var(--dp-warning-600)' :
                     'var(--dp-info-600)',
              fontFamily: 'var(--dp-font-family-primary)',
              fontWeight: 'var(--dp-font-weight-bold)'
            }}>
              {absenceType === 'annual' ? formatDaysDisplay(typeData.remaining) : formatDaysDisplay(typeData.used)}
            </Typography>
          </Box>

          {absenceType === 'annual' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom sx={{
                color: 'var(--dp-neutral-600)',
                fontFamily: 'var(--dp-font-family-primary)'
              }}>
                Used: {formatDaysDisplay(typeData.used)} Remaining: {formatDaysDisplay(typeData.remaining)} ({Math.round(percentage)}%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={percentage}
                color={getProgressColor(typeData.used, typeData.total)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {absenceType === 'annual' && isManager && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {editingAllocation === allocation.id ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    type="number"
                    value={editValues?.annualLeaveDays || 0}
                    onChange={(e) => setEditValues(prev => prev ? {
                      ...prev,
                      annualLeaveDays: parseInt(e.target.value)
                    } : null)}
                    sx={{ width: 80 }}
                  />
                  <IconButton size="small" onClick={handleSaveAllocation} color="primary">
                    <SaveIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancelEdit}>
                    <CancelIcon />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditAllocation(allocation)}
                  sx={{
                    color: 'var(--dp-primary-600)',
                    fontFamily: 'var(--dp-font-family-primary)',
                    fontWeight: 'var(--dp-font-weight-medium)',
                    transition: 'var(--dp-transition-fast)',
                    '&:hover': {
                      backgroundColor: 'var(--dp-primary-50)',
                    }
                  }}
                >
                  Edit Allocations
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAnnualLeaveTab = () => (
    <TabPanel value={activeTab} index={0}>
      <Box sx={{
        '[data-theme="dark"] &': {
          backgroundColor: 'transparent !important',
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Team Leave Allocations
          </Typography>
          {isManager && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={{ backgroundColor: '#1976d2' }}
            >
              Edit Allocations
            </Button>
          )}
        </Box>

        {loadingAllocations ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
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
            <Typography sx={{ color: 'var(--dp-neutral-600)', fontFamily: 'var(--dp-font-family-primary)' }}>Loading annual leave data...</Typography>
          </Box>
        ) : !teamAllocations || teamAllocations.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              borderRadius: 'var(--dp-radius-md)',
              boxShadow: 'var(--dp-shadow-sm)',
            }}
          >
            No team allocations found. Allocations will be created automatically when employees are assigned leave.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{
            '[data-theme="dark"] &': {
              backgroundColor: 'transparent',
            }
          }}>
            {teamAllocations.map((allocation) => (
              <Grid item xs={12} sm={6} md={4} key={allocation.id}>
                {renderTeamMemberCard(allocation, 'annual')}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </TabPanel>
  );

  const renderSickDaysTab = () => (
    <TabPanel value={activeTab} index={1}>
      <Box sx={{
        '[data-theme="dark"] &': {
          backgroundColor: 'transparent !important',
        }
      }}>
        <Typography variant="h6" sx={{
          mb: 3,
          '[data-theme="dark"] &': {
            color: 'var(--dp-neutral-100)',
          }
        }}>
          Sick Days
        </Typography>

        {loadingAllocations ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
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
            <Typography sx={{ color: 'var(--dp-neutral-600)', fontFamily: 'var(--dp-font-family-primary)' }}>Loading sick days data...</Typography>
          </Box>
        ) : !teamAllocations || teamAllocations.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              borderRadius: 'var(--dp-radius-md)',
              boxShadow: 'var(--dp-shadow-sm)',
            }}
          >
            No team allocations found. Allocations will be created automatically when employees are assigned leave.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{
            '[data-theme="dark"] &': {
              backgroundColor: 'transparent',
            }
          }}>
            {teamAllocations.map((allocation) => (
              <Grid item xs={12} sm={6} md={4} key={allocation.id}>
                {renderTeamMemberCard(allocation, 'sick')}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </TabPanel>
  );

  const renderOtherLeaveTab = () => (
    <TabPanel value={activeTab} index={2}>
      <Box sx={{
        '[data-theme="dark"] &': {
          backgroundColor: 'transparent !important',
        }
      }}>
        <Typography variant="h6" sx={{
          mb: 3,
          '[data-theme="dark"] &': {
            color: 'var(--dp-neutral-100)',
          }
        }}>
          Other Leave
        </Typography>

        {loadingAllocations ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
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
            <Typography sx={{ color: 'var(--dp-neutral-600)', fontFamily: 'var(--dp-font-family-primary)' }}>Loading other leave data...</Typography>
          </Box>
        ) : !teamAllocations || teamAllocations.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              fontFamily: 'var(--dp-font-family-primary)',
              borderRadius: 'var(--dp-radius-md)',
              boxShadow: 'var(--dp-shadow-sm)',
            }}
          >
            No team allocations found. Allocations will be created automatically when employees are assigned leave.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{
            '[data-theme="dark"] &': {
              backgroundColor: 'transparent',
            }
          }}>
            {teamAllocations.map((allocation) => (
              <Grid item xs={12} sm={6} md={4} key={allocation.id}>
                {renderTeamMemberCard(allocation, 'otherLeave')}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </TabPanel>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      disablePortal
      PaperProps={{
        sx: {
          borderRadius: 'var(--dp-radius-lg)',
          boxShadow: 'var(--dp-shadow-lg)',
          backgroundColor: 'var(--dp-neutral-0) !important',
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: 'var(--dp-primary-600)',
        color: 'var(--dp-neutral-0)',
        fontFamily: 'var(--dp-font-family-primary)',
        fontWeight: 'var(--dp-font-weight-bold)',
        fontSize: 'var(--dp-text-headline-medium)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      }}>
        Absence Management
      </DialogTitle>

      <DialogContent sx={{
        p: 3,
        backgroundColor: 'var(--dp-neutral-25) !important',
      }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              fontFamily: 'var(--dp-font-family-primary)',
              fontWeight: 'var(--dp-font-weight-medium)',
              textTransform: 'none',
              transition: 'var(--dp-transition-fast)',
              '&:hover': {
                backgroundColor: 'var(--dp-primary-50)',
              },
              '&.Mui-selected': {
                color: 'var(--dp-primary-600)',
                fontWeight: 'var(--dp-font-weight-semibold)',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--dp-primary-500)',
              height: 3,
              borderRadius: 'var(--dp-radius-sm)',
            }
          }}
        >
          <Tab
            label="Annual Leave"
            icon={<span>✈️</span>}
          />
          <Tab label="Sick Days" icon={<span>🤒</span>} />
          <Tab label="Other Leave" icon={<span>📋</span>} />
        </Tabs>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              fontFamily: 'var(--dp-font-family-primary)',
              borderRadius: 'var(--dp-radius-md)',
              boxShadow: 'var(--dp-shadow-sm)',
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              fontFamily: 'var(--dp-font-family-primary)',
              borderRadius: 'var(--dp-radius-md)',
              boxShadow: 'var(--dp-shadow-sm)',
            }}
          >
            {success}
          </Alert>
        )}

        {renderAnnualLeaveTab()}
        {renderSickDaysTab()}
        {renderOtherLeaveTab()}
      </DialogContent>

      <DialogActions sx={{
        p: 3,
        backgroundColor: 'var(--dp-neutral-50) !important',
        borderTop: '1px solid var(--dp-neutral-200)',
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="contained"
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
      </DialogActions>
    </Dialog>
  );
};

export default AbsenceManagementModal;