import React from 'react';
import { Category, CreateCategory, UpdateCategory } from '../../../types/database';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCategory | UpdateCategory) => Promise<void>;
  category?: Category;
  isCreating: boolean;
  loading: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  isCreating,
  loading
}) => {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form logic
    console.log('CategoryForm submit - placeholder');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isCreating ? 'Add Category' : 'Edit Category'}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-content">
            <p>CategoryForm - TODO: Implement form fields</p>
            <p>Category: {category?.name || 'New'}</p>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;