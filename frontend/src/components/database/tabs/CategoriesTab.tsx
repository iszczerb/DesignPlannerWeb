import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../common/DataTable';
import CategoryForm from '../forms/CategoryForm';
import ConfirmDialog from '../../common/ConfirmDialog';
import {
  Category,
  CreateCategory,
  UpdateCategory,
  TableColumn,
  BulkActionType,
  BulkActionResult
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';

interface CategoriesTabProps {
  onEntityCountChange: (count: number) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ onEntityCountChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(categories) ? categories.length : 0);
  }, [categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(undefined);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteConfirm(true);
  };

  const handleSave = async (data: CreateCategory | UpdateCategory) => {
    try {
      setFormLoading(true);
      if (editingCategory) {
        await databaseService.updateCategory(data as UpdateCategory);
      } else {
        await databaseService.createCategory(data as CreateCategory);
      }
      setShowForm(false);
      setEditingCategory(undefined);
      await loadCategories();
    } catch (err) {
      throw err; // Let the form handle the error
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      await databaseService.deleteCategory(deletingCategory.id!);
      setShowDeleteConfirm(false);
      setDeletingCategory(undefined);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleBulkAction = async (action: BulkActionType, items: Category[]): Promise<BulkActionResult> => {
    try {
      let result: BulkActionResult;

      switch (action) {
        case BulkActionType.Activate:
          result = await databaseService.bulkUpdateCategories(
            items.map(item => ({ ...item, isActive: true }))
          );
          break;
        case BulkActionType.Deactivate:
          result = await databaseService.bulkUpdateCategories(
            items.map(item => ({ ...item, isActive: false }))
          );
          break;
        case BulkActionType.Delete:
          result = await databaseService.bulkDeleteCategories(items.map(item => item.id!));
          break;
        case BulkActionType.Export:
          result = await databaseService.exportCategories(items.map(item => item.id!));
          break;
        default:
          throw new Error('Unsupported bulk action');
      }

      if (result.success) {
        await loadCategories();
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Bulk action failed',
        affectedCount: 0
      };
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const getColorIndicator = (color: string) => (
    <div className="color-indicator-container">
      <div
        className="color-indicator"
        style={{ backgroundColor: color }}
        title={color}
      />
      <span className="color-code">{color}</span>
    </div>
  );

  const getProjectsCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'project' : 'projects'}
    </span>
  );

  const columns: TableColumn<Category>[] = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'color',
      title: 'Color',
      sortable: false,
      width: '150px',
      render: (value) => getColorIndicator(value)
    },
    {
      key: 'description',
      title: 'Description',
      sortable: false,
      width: '300px',
      render: (value) => {
        if (!value) return '-';
        return value.length > 60 ? `${value.substring(0, 60)}...` : value;
      }
    },
    {
      key: 'projectCount',
      title: 'Projects',
      sortable: true,
      width: '120px',
      render: (value) => getProjectsCount(value || 0)
    },
    {
      key: 'isActive',
      title: 'Status',
      sortable: true,
      width: '100px',
      render: (value) => getStatusBadge(value)
    }
  ];

  const quickFilters = useMemo(() => [
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { label: 'Active', value: true, count: Array.isArray(categories) ? categories.filter(c => c.isActive).length : 0 },
        { label: 'Inactive', value: false, count: Array.isArray(categories) ? categories.filter(c => !c.isActive).length : 0 }
      ]
    },
    {
      key: 'hasProjects',
      label: 'Usage',
      options: [
        {
          label: 'In Use',
          value: true,
          count: Array.isArray(categories) ? categories.filter(c => (c.projectCount || 0) > 0).length : 0
        },
        {
          label: 'Unused',
          value: false,
          count: Array.isArray(categories) ? categories.filter(c => (c.projectCount || 0) === 0).length : 0
        }
      ]
    }
  ], [categories]);

  const searchFields: (keyof Category)[] = ['name', 'description'];

  return (
    <>
      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        error={error}
        onRefresh={loadCategories}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        searchFields={searchFields}
        quickFilters={quickFilters}
        getItemKey={(item) => item.id!}
        emptyMessage="No categories found. Create your first category to get started."
        createButtonText="Add Category"
        actions={[
          {
            label: 'View Projects',
            icon: '📁',
            onClick: (category) => {
              console.log('View projects for category:', category);
              // TODO: Navigate to projects filtered by this category
            },
            variant: 'secondary',
            show: (category) => (category.projectCount || 0) > 0
          },
          {
            label: 'Change Color',
            icon: '🎨',
            onClick: (category) => {
              setEditingCategory(category);
              setShowForm(true);
            },
            variant: 'primary'
          }
        ]}
      />

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(undefined);
        }}
        onSave={handleSave}
        category={editingCategory}
        isCreating={!editingCategory}
        loading={formLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone and will affect all projects using this category.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingCategory(undefined);
        }}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default CategoriesTab;