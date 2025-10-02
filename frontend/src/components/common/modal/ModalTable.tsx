import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';

export interface ModalTableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Column header label */
  label: string;
  /** Render function for cell content */
  render: (row: T, index: number) => React.ReactNode;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Column width */
  width?: string | number;
  /** Whether column is sortable */
  sortable?: boolean;
}

export interface ModalTableProps<T> {
  /** Array of column definitions */
  columns: ModalTableColumn<T>[];
  /** Array of data rows */
  data: T[];
  /** Message to show when no data */
  emptyMessage?: string;
  /** Show table borders */
  showBorders?: boolean;
  /** Enable row hover effect */
  hoverRows?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Dense table (less padding) */
  dense?: boolean;
  /** Custom row key extractor */
  getRowKey?: (row: T, index: number) => string | number;
}

/**
 * ModalTable - Standardized table component for modals
 *
 * Features:
 * - Consistent styling across all modals
 * - Light/dark mode support
 * - Sortable columns (optional)
 * - Empty state
 * - Hover effects
 * - Striped rows option
 * - Responsive (horizontal scroll on mobile)
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const columns: ModalTableColumn<User>[] = [
 *   {
 *     key: 'name',
 *     label: 'Name',
 *     render: (user) => user.name,
 *   },
 *   {
 *     key: 'email',
 *     label: 'Email',
 *     render: (user) => user.email,
 *   },
 * ];
 *
 * <ModalTable
 *   columns={columns}
 *   data={users}
 *   emptyMessage="No users found"
 * />
 * ```
 */
export function ModalTable<T>({
  columns,
  data,
  emptyMessage = 'No data available',
  showBorders = true,
  hoverRows = true,
  striped = false,
  dense = false,
  getRowKey,
}: ModalTableProps<T>) {
  // Default row key extractor
  const defaultGetRowKey = (_row: T, index: number) => index;
  const rowKeyExtractor = getRowKey || defaultGetRowKey;

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        maxHeight: '600px',
        overflow: 'auto',
        border: showBorders ? '1px solid var(--dp-neutral-200)' : 'none',
        borderRadius: 'var(--dp-radius-lg)',

        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'var(--dp-neutral-100)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--dp-neutral-300)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'var(--dp-neutral-400)',
          },
        },
      }}
    >
      <Table
        size={dense ? 'small' : 'medium'}
        sx={{
          minWidth: 650,
          backgroundColor: 'var(--dp-neutral-0)',
        }}
      >
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: 'var(--dp-neutral-50)',
              borderBottom: '2px solid var(--dp-neutral-300)',
            }}
          >
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align || 'left'}
                sx={{
                  fontFamily: 'var(--dp-font-family-primary)',
                  fontSize: 'var(--dp-text-body-medium)',
                  fontWeight: 'var(--dp-font-weight-semibold)',
                  color: 'var(--dp-neutral-700)',
                  padding: dense ? 'var(--dp-space-2)' : 'var(--dp-space-4)',
                  width: column.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{
                  padding: 'var(--dp-space-12)',
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--dp-space-2)',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-medium)',
                      color: 'var(--dp-neutral-500)',
                      fontWeight: 'var(--dp-font-weight-regular)',
                    }}
                  >
                    {emptyMessage}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={rowKeyExtractor(row, index)}
                sx={{
                  backgroundColor: striped && index % 2 === 1
                    ? 'var(--dp-neutral-50)'
                    : 'var(--dp-neutral-0)',
                  borderBottom: '1px solid var(--dp-neutral-200)',
                  transition: 'var(--dp-transition-fast)',

                  ...(hoverRows && {
                    '&:hover': {
                      backgroundColor: 'var(--dp-primary-50)',
                      cursor: 'pointer',
                    },
                  }),

                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{
                      fontFamily: 'var(--dp-font-family-primary)',
                      fontSize: 'var(--dp-text-body-medium)',
                      fontWeight: 'var(--dp-font-weight-regular)',
                      color: 'var(--dp-neutral-800)',
                      padding: dense ? 'var(--dp-space-2)' : 'var(--dp-space-4)',
                    }}
                  >
                    {column.render(row, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
