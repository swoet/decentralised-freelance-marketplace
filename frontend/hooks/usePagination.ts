import { useState, useMemo } from 'react'

interface UsePaginationOptions {
  totalItems: number
  itemsPerPage: number
  initialPage?: number
}

export function usePagination({ totalItems, itemsPerPage, initialPage = 1 }: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage])

  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage])

  const endIndex = useMemo(() => Math.min(startIndex + itemsPerPage, totalItems), [startIndex, itemsPerPage, totalItems])

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(pageNumber)
  }

  const nextPage = () => {
    goToPage(currentPage + 1)
  }

  const previousPage = () => {
    goToPage(currentPage - 1)
  }

  const canGoNext = currentPage < totalPages
  const canGoPrevious = currentPage > 1

  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const maxPagesToShow = 5
    const halfMaxPages = Math.floor(maxPagesToShow / 2)

    let startPage = Math.max(1, currentPage - halfMaxPages)
    let endPage = Math.min(totalPages, currentPage + halfMaxPages)

    if (currentPage <= halfMaxPages) {
      endPage = Math.min(maxPagesToShow, totalPages)
    }

    if (currentPage + halfMaxPages >= totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }, [currentPage, totalPages])

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    pageNumbers,
  }
}
