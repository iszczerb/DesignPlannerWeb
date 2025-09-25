import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TableColumn,
  TableFilters,
  TableSort,
  TableState,
  BulkActionType,
  BulkActionResult
} from '../../../types/database';
import SearchBar from './SearchBar';
import QuickFilters from './QuickFilters';
import BulkActions from './BulkActions';
import Pagination from './Pagination';
import './DataTable.css';

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreate?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onBulkAction?: (action: BulkActionType, items: T[]) => Promise<BulkActionResult>;
  searchFields?: (keyof T)[];
  quickFilters?: Array<{
    key: string;
    label: string;
    options: Array<{ label: string; value: any; count?: number }>;
  }>;
  pageSize?: number;
  enableSelection?: boolean;
  enableBulkActions?: boolean;
  getItemKey: (item: T) => string | number;
  emptyMessage?: string;
  createButtonText?: string;
  actions?: Array<{
    label: string;
    icon?: string;
    onClick: (item: T) => void;
    variant?: 'primary' | 'secondary' | 'danger';
    show?: (item: T) => boolean;
  }>;
}

function DataTable<T>({
  columns,
  data,
  loading,
  error,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  onBulkAction,
  searchFields = [],
  quickFilters = [],
  pageSize = 100,
  enableSelection = true,
  enableBulkActions = true,
  getItemKey,
  emptyMessage = 'No data available',
  createButtonText = 'Add New',
  actions = []
}: DataTableProps<T>) {
  const [tableState, setTableState] = useState<TableState<T>>({
    data: [],
    loading: false,
    error: null,
    filters: {},
    sort: { field: 'name', direction: 'asc' },
    pagination: {
      pageNumber: 1,
      pageSize: pageSize,
    },
    selectedRows: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Update table state when data changes
  useEffect(() => {
    setTableState(prev => ({
      ...prev,
      data,
      loading,
      error,
      pagination: {
        ...prev.pagination,
        total: Array.isArray(data) ? data.length : 0
      }
    }));
  }, [data, loading, error]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : [];

    // Apply search filter
    if (searchQuery && searchFields.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply quick filters
    Object.entries(tableState.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter(item => {
          const itemValue = (item as any)[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (tableState.sort) {
      const { field, direction } = tableState.sort;
      result.sort((a, b) => {
        const aValue = (a as any)[field];
        const bValue = (b as any)[field];

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, searchFields, tableState.filters, tableState.sort]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = ((tableState.pagination.pageNumber || 1) - 1) * (tableState.pagination.pageSize || 100);
    const end = start + (tableState.pagination.pageSize || 100);
    return processedData.slice(start, end);
  }, [processedData, tableState.pagination.pageNumber, tableState.pagination.pageSize]);

  const totalPages = Math.ceil(processedData.length / (tableState.pagination.pageSize || 100));

  const handleSort = (field: string) => {
    setTableState(prev => ({
      ...prev,
      sort: prev.sort?.field === field && prev.sort.direction === 'asc'
        ? { field, direction: 'desc' }
        : { field, direction: 'asc' }
    }));
  };

  const handleFilter = (key: string, value: any) => {
    setTableState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      pagination: { ...prev.pagination, current: 1 }
    }));
  };

  const handlePageChange = (page: number) => {
    setTableState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, current: page }
    }));
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    setTableState(prev => ({
      ...prev,
      selectedRows: checked
        ? [...prev.selectedRows, getItemKey(item)]
        : prev.selectedRows.filter(selected => selected !== getItemKey(item))
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setTableState(prev => ({
      ...prev,
      selectedRows: checked ? paginatedData.map(item => getItemKey(item)) : []
    }));
  };

  const handleBulkAction = async (action: BulkActionType) => {
    if (!onBulkAction || tableState.selectedRows.length === 0) return;

    try {
      const selectedItems = paginatedData.filter(item =>
        tableState.selectedRows.includes(getItemKey(item))
      );
      const result = await onBulkAction(action, selectedItems);
      if (result.success) {
        setTableState(prev => ({ ...prev, selectedRows: [] }));
        setShowBulkActions(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const isItemSelected = (item: T) =>
    tableState.selectedRows.includes(getItemKey(item));

  const allItemsSelected = paginatedData.length > 0 &&
    paginatedData.every(item => isItemSelected(item));

  const someItemsSelected = tableState.selectedRows.length > 0;

  useEffect(() => {
    setShowBulkActions(someItemsSelected);
  }, [someItemsSelected]);

  if (error) {
    return (
      <div className="data-table-error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to load data</h3>
        <p>{error}</p>
        <button className="database-btn database-btn-primary" onClick={onRefresh}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      {/* Table Header */}
      <div className="data-table-header">
        <div className="data-table-header-left">
          <h3>
            {processedData.length} {processedData.length === 1 ? 'item' : 'items'}
            {searchQuery && ` matching "${searchQuery}"`}
          </h3>
          {onCreate && (
            <button
              className="database-btn database-btn-primary"
              onClick={onCreate}
            >
              + {createButtonText}
            </button>
          )}
        </div>
        <div className="data-table-header-right">
          <button
            className="database-btn database-btn-secondary"
            onClick={onRefresh}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="data-table-controls">
        {searchFields.length > 0 && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${searchFields.join(', ')}...`}
          />
        )}
        {quickFilters.length > 0 && (
          <QuickFilters
            filters={quickFilters}
            values={tableState.filters}
            onChange={handleFilter}
          />
        )}
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {showBulkActions && enableBulkActions && onBulkAction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="data-table-bulk-actions"
          >
            <BulkActions
              selectedCount={tableState.selectedRows.length}
              onAction={handleBulkAction}
              onClose={() => setTableState(prev => ({ ...prev, selectedRows: [] }))}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {enableSelection && (
                <th className="data-table-checkbox-col">
                  <input
                    type="checkbox"
                    checked={allItemsSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="data-table-checkbox"
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`data-table-header-cell ${column.sortable ? 'sortable' : ''}`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
                >
                  <div className="data-table-header-content">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="sort-indicator">
                        {tableState.sort?.field === String(column.key) ? (
                          tableState.sort.direction === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(actions.length > 0 || onEdit || onDelete) && (
                <th className="data-table-actions-col">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (enableSelection ? 1 : 0) + 1} className="data-table-loading">
                  <div className="data-table-spinner"></div>
                  <span>Loading...</span>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (enableSelection ? 1 : 0) + 1} className="data-table-empty">
                  <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <p>{emptyMessage}</p>
                    {onCreate && (
                      <button
                        className="database-btn database-btn-primary"
                        onClick={onCreate}
                      >
                        {createButtonText}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <tr
                  key={getItemKey(item)}
                  className={isItemSelected(item) ? 'selected' : ''}
                >
                  {enableSelection && (
                    <td className="data-table-checkbox-col">
                      <input
                        type="checkbox"
                        checked={isItemSelected(item)}
                        onChange={(e) => handleSelectItem(item, e.target.checked)}
                        className="data-table-checkbox"
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="data-table-cell">
                      {column.render
                        ? column.render((item as any)[column.key], item)
                        : String((item as any)[column.key] || '')
                      }
                    </td>
                  ))}
                  <td className="data-table-actions-col">
                    <div className="data-table-actions">
                      {actions.map((action, actionIndex) => (
                        action.show?.(item) !== false && (
                          <button
                            key={actionIndex}
                            className={`action-btn action-btn-${action.variant || 'secondary'}`}
                            onClick={() => action.onClick(item)}
                            title={action.label}
                          >
                            {action.icon && <span>{action.icon}</span>}
                            <span className="action-label">{action.label}</span>
                          </button>
                        )
                      ))}
                      {onEdit && (
                        <button
                          className="action-btn action-btn-secondary"
                          onClick={() => onEdit(item)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="action-btn action-btn-danger"
                          onClick={() => onDelete(item)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          current={tableState.pagination.pageNumber || 1}
          total={totalPages}
          onChange={handlePageChange}
          showSizeChanger={true}
          pageSize={tableState.pagination.pageSize || pageSize}
          onPageSizeChange={(size) =>
            setTableState(prev => ({
              ...prev,
              pagination: { ...prev.pagination, size, current: 1 }
            }))
          }
        />
      )}
    </div>
  );
}

export default DataTable;