import React, { useState } from 'react';
import './QuickFilters.css';

interface FilterOption {
  label: string;
  value: any;
  count?: number;
}

interface QuickFilter {
  key: string;
  label: string;
  options: FilterOption[];
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  values,
  onChange
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleFilterChange = (key: string, value: any) => {
    onChange(key, value);
    setOpenDropdown(null);
  };

  const handleClearFilter = (key: string) => {
    onChange(key, null);
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const getSelectedLabel = (filter: QuickFilter) => {
    const value = values[filter.key];
    if (value === null || value === undefined) return 'All';

    const option = filter.options.find(opt => opt.value === value);
    return option ? option.label : 'All';
  };

  const hasActiveFilters = Object.values(values).some(value =>
    value !== null && value !== undefined && value !== ''
  );

  const clearAllFilters = () => {
    Object.keys(values).forEach(key => onChange(key, null));
  };

  return (
    <div className="quick-filters">
      <div className="quick-filters-list">
        {filters.map((filter) => (
          <div key={filter.key} className="quick-filter">
            <button
              className={`quick-filter-button ${values[filter.key] ? 'active' : ''}`}
              onClick={() => toggleDropdown(filter.key)}
            >
              <span className="filter-label">{filter.label}:</span>
              <span className="filter-value">{getSelectedLabel(filter)}</span>
              <span className="filter-arrow">
                {openDropdown === filter.key ? '▲' : '▼'}
              </span>
            </button>

            {openDropdown === filter.key && (
              <div className="quick-filter-dropdown">
                <div className="filter-option-group">
                  <button
                    className={`filter-option ${!values[filter.key] ? 'selected' : ''}`}
                    onClick={() => handleFilterChange(filter.key, null)}
                  >
                    <span>All</span>
                  </button>
                  {filter.options.map((option) => (
                    <button
                      key={option.value}
                      className={`filter-option ${values[filter.key] === option.value ? 'selected' : ''}`}
                      onClick={() => handleFilterChange(filter.key, option.value)}
                    >
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <span className="filter-count">{option.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {hasActiveFilters && (
          <button
            className="clear-filters-button"
            onClick={clearAllFilters}
            title="Clear all filters"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Overlay to close dropdowns */}
      {openDropdown && (
        <div
          className="quick-filters-overlay"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
};

export default QuickFilters;