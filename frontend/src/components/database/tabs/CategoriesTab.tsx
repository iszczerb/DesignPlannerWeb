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
  BulkActionResult,
  Project
} from '../../../types/database';
import { databaseService } from '../../../services/databaseService';

interface CategoriesTabProps {
  onEntityCountChange: (count: number) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ onEntityCountChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProjects();
  }, []);

  useEffect(() => {
    onEntityCountChange(Array.isArray(categories) ? categories.length : 0);
  }, [categories]);

  // Recalculate project counts when both categories and projects are loaded
  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0 && Array.isArray(projects)) {
      const categoriesWithCount = categories.map(category => ({
        ...category,
        projectCount: projects.filter(p => p.categoryId === category.id).length
      }));

      // Only update if counts actually changed
      const countsChanged = categoriesWithCount.some((cat, index) =>
        cat.projectCount !== categories[index]?.projectCount
      );

      if (countsChanged) {
        setCategories(categoriesWithCount);
      }
    }
  }, [projects]);

  const loadProjects = async () => {
    try {
      const data = await databaseService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

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
      await loadProjects(); // Reload projects to trigger project count recalculation
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
      await loadProjects(); // Reload projects to trigger project count recalculation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };




  const getProjectsCount = (count: number) => (
    <span className="count-badge">
      {count} {count === 1 ? 'project' : 'projects'}
    </span>
  );

  const columns: TableColumn<Category>[] = [
    {
      key: 'color',
      label: 'Color',
      sortable: false,
      width: '80px',
      render: (value) => (
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: value || '#0066CC',
            borderRadius: '6px',
            border: '2px solid #e5e7eb'
          }}
          title={value || '#0066CC'}
        />
      )
    },
    {
      key: 'name',
      label: 'Category',
      sortable: true,
      width: '200px'
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      width: '300px',
      render: (value) => value || '-'
    },
    {
      key: 'projectCount',
      label: 'Projects',
      sortable: true,
      width: '100px',
      render: (value) => getProjectsCount(value || 0)
    },
  ];

  const quickFilters = useMemo(() => [], [categories]);

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
        searchFields={searchFields}
        quickFilters={quickFilters}
        enableSelection={false}
        enableBulkActions={false}
        getItemKey={(item) => item.id!}
        emptyMessage="No categories found. Create your first category to get started."
        createButtonText="Add Category"
        actions={[]}
      />

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(undefined);
        }}
        onSave={handleSave}
        entity={editingCategory}
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