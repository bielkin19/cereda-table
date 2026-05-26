import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataTableDndOverlayPreview } from '../data-table-dnd-overlay';

describe('DataTableDndOverlayPreview', () => {
  it('renders a compact label-only preview for header-style drags', () => {
    render(
      <DataTableDndOverlayPreview
        dragData={{ zone: 'column-header', columnId: 'department', label: 'Department' }}
        position={{ x: 100, y: 100 }}
      />,
    );

    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(document.body.querySelector('.cereda-table__dnd-overlay-icon')).toBeInTheDocument();
    expect(document.body.querySelector('.cereda-table__dnd-overlay')).toBeInTheDocument();
    expect(document.body.querySelector('.cereda-table__dnd-overlay--pill')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Grouped by')).not.toBeInTheDocument();
    expect(screen.queryByText('then by')).not.toBeInTheDocument();
  });

  it('renders a pill-like preview for grouping drags', () => {
    render(
      <DataTableDndOverlayPreview
        dragData={{ zone: 'grouping-panel', columnId: 'status', label: 'Status' }}
        position={{ x: 100, y: 100 }}
      />,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(document.body.querySelector('.cereda-table__dnd-overlay-icon')).toBeInTheDocument();
    expect(document.body.querySelector('.cereda-table__dnd-overlay--pill')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

