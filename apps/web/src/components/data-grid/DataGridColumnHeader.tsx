import type {
  ColumnSort,
  Header,
  SortDirection,
  SortingState,
  Table,
} from '@tanstack/react-table'
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  EyeOff,
  File,
  Hash,
  Link,
  ListChecks,
  List,
  Pin,
  PinOff,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react'
import * as React from 'react'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { CellOpts } from './types'

function getColumnVariant(variant?: CellOpts['variant']): {
  icon: LucideIcon
  label: string
} | null {
  switch (variant) {
    case 'short-text':
      return { icon: Type, label: 'Short text' }
    case 'long-text':
      return { icon: File, label: 'Long text' }
    case 'number':
      return { icon: Hash, label: 'Number' }
    case 'url':
      return { icon: Link, label: 'URL' }
    case 'checkbox':
      return { icon: CheckSquare, label: 'Checkbox' }
    case 'select':
      return { icon: List, label: 'Select' }
    case 'multi-select':
      return { icon: ListChecks, label: 'Multi-select' }
    case 'date':
      return { icon: Calendar, label: 'Date' }
    case 'file':
      return { icon: File, label: 'File' }
    default:
      return null
  }
}

interface DataGridColumnHeaderProps<TData, TValue> extends React.ComponentProps<
  typeof DropdownMenuTrigger
> {
  header: Header<TData, TValue>
  table: Table<TData>
}

export function DataGridColumnHeader<TData, TValue>({
  header,
  table,
  className,
  onPointerDown,
  ...props
}: DataGridColumnHeaderProps<TData, TValue>) {
  const column = header.column
  const label = column.columnDef.meta?.label
    ? column.columnDef.meta.label
    : typeof column.columnDef.header === 'string'
      ? column.columnDef.header
      : column.id

  const isAnyColumnResizing = table.getState().columnSizingInfo.isResizingColumn

  const cellVariant = column.columnDef.meta?.cell
  const columnVariant = getColumnVariant(cellVariant?.variant)

  const pinnedPosition = column.getIsPinned()
  const isPinnedLeft = pinnedPosition === 'left'
  const isPinnedRight = pinnedPosition === 'right'

  const onSortingChange = React.useCallback(
    (direction: SortDirection) => {
      table.setSorting((prev: SortingState) => {
        const existingSortIndex = prev.findIndex(
          (sort) => sort.id === column.id,
        )
        const newSort: ColumnSort = {
          id: column.id,
          desc: direction === 'desc',
        }

        if (existingSortIndex >= 0) {
          const updated = [...prev]
          updated[existingSortIndex] = newSort
          return updated
        } else {
          return [...prev, newSort]
        }
      })
    },
    [column.id, table],
  )

  const onSortRemove = React.useCallback(() => {
    table.setSorting((prev: SortingState) =>
      prev.filter((sort) => sort.id !== column.id),
    )
  }, [column.id, table])

  const onLeftPin = React.useCallback(() => {
    column.pin('left')
  }, [column])

  const onRightPin = React.useCallback(() => {
    column.pin('right')
  }, [column])

  const onUnpin = React.useCallback(() => {
    column.pin(false)
  }, [column])

  const onTriggerPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event)
      if (event.defaultPrevented) return

      if (event.button !== 0) {
        return
      }
      table.options.meta?.onColumnClick?.(column.id)
    },
    [table.options.meta, column.id, onPointerDown],
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'hover:bg-accent/40 data-[state=open]:bg-accent/40 flex size-full items-center justify-between gap-2 p-2 text-sm [&_svg]:size-4',
            isAnyColumnResizing && 'pointer-events-none',
            className,
          )}
          onPointerDown={onTriggerPointerDown}
          {...props}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {columnVariant && (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <columnVariant.icon className="text-muted-foreground size-3.5 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{columnVariant.label}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <span className="truncate">{label}</span>
          </div>
          <ChevronDown className="text-muted-foreground shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={0} className="w-60">
          {column.getCanSort() && (
            <>
              <DropdownMenuCheckboxItem
                className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
                checked={column.getIsSorted() === 'asc'}
                onClick={() => onSortingChange('asc')}
              >
                <ChevronUp />
                Sort asc
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
                checked={column.getIsSorted() === 'desc'}
                onClick={() => onSortingChange('desc')}
              >
                <ChevronDown />
                Sort desc
              </DropdownMenuCheckboxItem>
              {column.getIsSorted() && (
                <DropdownMenuItem onClick={onSortRemove}>
                  <X />
                  Remove sort
                </DropdownMenuItem>
              )}
            </>
          )}
          {column.getCanPin() && (
            <>
              {column.getCanSort() && <DropdownMenuSeparator />}

              {isPinnedLeft ? (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onUnpin}
                >
                  <PinOff />
                  Unpin from left
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onLeftPin}
                >
                  <Pin />
                  Pin to left
                </DropdownMenuItem>
              )}
              {isPinnedRight ? (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onUnpin}
                >
                  <PinOff />
                  Unpin from right
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="[&_svg]:text-muted-foreground"
                  onClick={onRightPin}
                >
                  <Pin />
                  Pin to right
                </DropdownMenuItem>
              )}
            </>
          )}
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
                checked={!column.getIsVisible()}
                onClick={() => column.toggleVisibility(false)}
              >
                <EyeOff />
                Hide column
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {header.column.getCanResize() && (
        <DataGridColumnResizer header={header} table={table} label={label} />
      )}
    </>
  )
}

const DataGridColumnResizer = React.memo(
  DataGridColumnResizerImpl,
  (prev, next) => {
    const prevColumn = prev.header.column
    const nextColumn = next.header.column

    if (
      prevColumn.getIsResizing() !== nextColumn.getIsResizing() ||
      prevColumn.getSize() !== nextColumn.getSize()
    ) {
      return false
    }

    if (prev.label !== next.label) return false

    return true
  },
) as typeof DataGridColumnResizerImpl

interface DataGridColumnResizerProps<
  TData,
  TValue,
> extends DataGridColumnHeaderProps<TData, TValue> {
  label: string
}

function DataGridColumnResizerImpl<TData, TValue>({
  header,
  table,
  label,
}: DataGridColumnResizerProps<TData, TValue>) {
  const defaultColumnDef = table._getDefaultColumnDef()

  const onDoubleClick = React.useCallback(() => {
    header.column.resetSize()
  }, [header.column])

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuenow={header.column.getSize()}
      aria-valuemin={defaultColumnDef.minSize}
      aria-valuemax={defaultColumnDef.maxSize}
      tabIndex={0}
      className={cn(
        "bg-border hover:bg-primary focus:bg-primary absolute top-0 -right-px z-50 h-full w-0.5 cursor-ew-resize touch-none transition-opacity select-none after:absolute after:inset-y-0 after:left-1/2 after:h-full after:w-4.5 after:-translate-x-1/2 after:content-[''] focus:outline-none",
        header.column.getIsResizing()
          ? 'bg-primary'
          : 'opacity-0 hover:opacity-100',
      )}
      onDoubleClick={onDoubleClick}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
    />
  )
}
