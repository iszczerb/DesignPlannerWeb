import React from 'react';
import './Pagination.css';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  showSizeChanger?: boolean;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showQuickJumper?: boolean;
  showTotal?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  showSizeChanger = false,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showQuickJumper = false,
  showTotal = true
}) => {
  const totalItems = (total - 1) * pageSize + 1; // Approximate total items
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, totalItems);

  const handlePageChange = (page: number) => {
    if (page !== current && page >= 1 && page <= total) {
      onChange(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
  };

  const handleQuickJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(e.currentTarget.value);
      if (!isNaN(page)) {
        handlePageChange(page);
        e.currentTarget.value = '';
      }
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push('...', total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  };

  if (total <= 1) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        {showTotal && (
          <span className="pagination-total">
            Showing {startItem}-{endItem} of approximately {totalItems} items
          </span>
        )}

        {showSizeChanger && onPageSizeChange && (
          <div className="pagination-size-changer">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="page-size-select"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn pagination-prev"
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          aria-label="Previous page"
        >
          ‹ Previous
        </button>

        <div className="pagination-pages">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="pagination-ellipsis">…</span>
              ) : (
                <button
                  className={`pagination-btn pagination-page ${
                    page === current ? 'active' : ''
                  }`}
                  onClick={() => handlePageChange(page as number)}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          className="pagination-btn pagination-next"
          onClick={() => handlePageChange(current + 1)}
          disabled={current === total}
          aria-label="Next page"
        >
          Next ›
        </button>

        {showQuickJumper && (
          <div className="pagination-jumper">
            <span>Go to:</span>
            <input
              type="number"
              min={1}
              max={total}
              placeholder={String(current)}
              onKeyDown={handleQuickJump}
              className="page-jump-input"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;