import type { CellPosition, RowHeightValue } from './types'
import type { Column } from '@tanstack/react-table'

export function getCellKey(rowIndex: number, columnId: string) {
  return `${rowIndex}:${columnId}`
}

export function parseCellKey(cellKey: string): Required<CellPosition> {
  const parts = cellKey.split(':')
  const rowIndexStr = parts[0]
  const columnId = parts[1]
  if (rowIndexStr && columnId) {
    const rowIndex = parseInt(rowIndexStr, 10)
    if (!Number.isNaN(rowIndex)) {
      return { rowIndex, columnId }
    }
  }
  return { rowIndex: 0, columnId: '' }
}

export function getRowHeightValue(rowHeight: RowHeightValue): number {
  const rowHeightMap: Record<RowHeightValue, number> = {
    short: 36,
    medium: 56,
    tall: 76,
    'extra-tall': 96,
  }

  return rowHeightMap[rowHeight]
}

export function getLineCount(rowHeight: RowHeightValue): number {
  const lineCountMap: Record<RowHeightValue, number> = {
    short: 1,
    medium: 2,
    tall: 3,
    'extra-tall': 4,
  }

  return lineCountMap[rowHeight]
}

export function getCommonPinningStyles<TData>({
  column,
}: {
  column: Column<TData, unknown>
}): React.CSSProperties {
  const pinned = column.getIsPinned?.()
  if (pinned === 'left') {
    const left =
      typeof (column as any).getStart === 'function'
        ? (column as any).getStart('left')
        : 0
    return {
      position: 'sticky',
      left,
      zIndex: 1,
      background: 'var(--background)',
    }
  }
  if (pinned === 'right') {
    const right =
      typeof (column as any).getAfter === 'function'
        ? (column as any).getAfter('right')
        : 0
    return {
      position: 'sticky',
      right,
      zIndex: 1,
      background: 'var(--background)',
    }
  }
  return {}
}
