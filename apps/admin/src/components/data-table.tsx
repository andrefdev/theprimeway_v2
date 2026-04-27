import * as React from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Button,
  Checkbox,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@repo/ui'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns,
  Search,
  X,
} from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  hideSearch?: boolean
  hidePagination?: boolean
  pageSize?: number
  onRowClick?: (row: TData) => void
  empty?: React.ReactNode
  toolbar?: React.ReactNode
  className?: string
  /** Show column visibility menu. Default true if there are >2 columns. */
  enableColumnVisibility?: boolean
  /** Sticky header at top of scroll container. */
  stickyHeader?: boolean
  /** Container max height enabling vertical scroll. e.g. "24rem". */
  maxHeight?: string
  /** Enable row selection w/ checkboxes. */
  enableRowSelection?: boolean
  /** Controlled selection state (rowId → bool). */
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (state: RowSelectionState) => void
  /** Stable id getter for selection (defaults to index). */
  getRowId?: (row: TData, index: number) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  hideSearch,
  hidePagination,
  pageSize = 10,
  onRowClick,
  empty,
  toolbar,
  className,
  enableColumnVisibility,
  stickyHeader,
  maxHeight,
  enableRowSelection,
  rowSelection: rowSelectionProp,
  onRowSelectionChange,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [internalSelection, setInternalSelection] = React.useState<RowSelectionState>({})
  const rowSelection = rowSelectionProp ?? internalSelection

  const setRowSelection = React.useCallback(
    (updater: React.SetStateAction<RowSelectionState>) => {
      const next =
        typeof updater === 'function'
          ? (updater as (s: RowSelectionState) => RowSelectionState)(rowSelection)
          : updater
      if (onRowSelectionChange) onRowSelectionChange(next)
      if (rowSelectionProp === undefined) setInternalSelection(next)
    },
    [rowSelection, rowSelectionProp, onRowSelectionChange],
  )

  const finalColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return columns
    const selectCol: ColumnDef<TData, TValue> = {
      id: '__select',
      enableSorting: false,
      enableHiding: false,
      size: 36,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()} role="presentation">
          <Checkbox
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            aria-label="Select row"
          />
        </div>
      ),
    }
    return [selectCol, ...columns]
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { sorting, columnFilters, columnVisibility, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: !!enableRowSelection,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: hidePagination ? undefined : getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const rows = table.getRowModel().rows
  const showColumnsMenu =
    enableColumnVisibility ?? table.getAllLeafColumns().filter((c) => c.getCanHide()).length > 2

  return (
    <div className={cn('space-y-3', className)}>
      {(!hideSearch || toolbar || showColumnsMenu) && (
        <div className="flex flex-wrap items-center gap-2">
          {!hideSearch && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 pr-9"
              />
              {globalFilter && (
                <button
                  type="button"
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-2 top-2.5 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {toolbar}
            {showColumnsMenu && <ColumnsMenu table={table} />}
          </div>
        </div>
      )}

      <div
        className={cn('rounded-md border', maxHeight && 'overflow-auto')}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <Table>
          <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10 bg-muted')}>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortDir = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="-mx-2 flex items-center gap-1 rounded px-2 py-1 hover:bg-muted"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : sortDir === 'desc' ? (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={finalColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {empty ?? 'No results.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row: Row<TData>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!hidePagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
          {(() => {
            const filtered = table.getFilteredRowModel().rows.length
            const { pageIndex, pageSize: ps } = table.getState().pagination
            const start = filtered === 0 ? 0 : pageIndex * ps + 1
            const end = Math.min(filtered, (pageIndex + 1) * ps)
            const selectedCount = Object.keys(rowSelection).length
            return (
              <p className="text-muted-foreground">
                {enableRowSelection && selectedCount > 0 ? `${selectedCount} selected · ` : ''}
                Showing {start}–{end} of {filtered} row{filtered === 1 ? '' : 's'}
              </p>
            )
          })()}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ColumnsMenu<TData>({ table }: { table: ReturnType<typeof useReactTable<TData>> }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const hideable = table.getAllLeafColumns().filter((c) => c.getCanHide())

  return (
    <div ref={ref} className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)} className="gap-2">
        <Columns className="h-4 w-4" />
        Columns
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border bg-popover p-2 shadow-md">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Toggle columns</p>
          <div className="space-y-1">
            {hideable.map((col) => {
              const label =
                typeof col.columnDef.header === 'string'
                  ? col.columnDef.header
                  : (col.id ?? col.id)
              return (
                <label
                  key={col.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={col.getIsVisible()}
                    onChange={(e) => col.toggleVisibility(e.target.checked)}
                  />
                  <span className="capitalize">{label || col.id}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
