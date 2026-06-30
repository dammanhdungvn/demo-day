import { describe, expect, it } from 'vitest'

import { buildPaginationState } from './pagination'

describe('buildPaginationState', () => {
  it('slices items and reports visible range', () => {
    const state = buildPaginationState(['a', 'b', 'c', 'd', 'e'], {
      page: 2,
      pageSize: 2,
    })

    expect(state.items).toEqual(['c', 'd'])
    expect(state.currentPage).toBe(2)
    expect(state.totalPages).toBe(3)
    expect(state.rangeLabel).toBe('Hiển thị 3-4 của 5')
    expect(state.hasPrevious).toBe(true)
    expect(state.hasNext).toBe(true)
  })

  it('clamps out-of-range pages', () => {
    const state = buildPaginationState([1, 2, 3], {
      page: 99,
      pageSize: 2,
    })

    expect(state.items).toEqual([3])
    expect(state.currentPage).toBe(2)
    expect(state.totalPages).toBe(2)
    expect(state.rangeLabel).toBe('Hiển thị 3-3 của 3')
  })

  it('handles empty lists without invalid page numbers', () => {
    const state = buildPaginationState([], { page: 4, pageSize: 10 })

    expect(state.items).toEqual([])
    expect(state.currentPage).toBe(1)
    expect(state.totalPages).toBe(1)
    expect(state.rangeLabel).toBe('Không có dữ liệu')
    expect(state.hasPrevious).toBe(false)
    expect(state.hasNext).toBe(false)
  })
})
