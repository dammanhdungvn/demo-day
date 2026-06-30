export type PaginationInput = {
  page: number
  pageSize: number
}

export type PaginationState<T> = {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  startIndex: number
  endIndex: number
  rangeLabel: string
  items: T[]
  hasPrevious: boolean
  hasNext: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function buildPaginationState<T>(
  items: T[],
  input: PaginationInput,
): PaginationState<T> {
  const pageSize = Math.max(1, Math.floor(input.pageSize))
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = clamp(Math.floor(input.page || 1), 1, totalPages)
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize
  const endIndex =
    totalItems === 0 ? 0 : Math.min(startIndex + pageSize, totalItems)
  const pageItems = items.slice(startIndex, endIndex)
  const rangeLabel =
    totalItems === 0
      ? 'Không có dữ liệu'
      : `Hiển thị ${startIndex + 1}-${endIndex} của ${totalItems}`

  return {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    startIndex,
    endIndex,
    rangeLabel,
    items: pageItems,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  }
}
