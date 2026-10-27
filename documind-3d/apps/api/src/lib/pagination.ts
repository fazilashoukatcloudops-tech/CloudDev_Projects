export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  return { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
}

// Day 7 par Prisma ke findMany({ skip, take }) mein use hoga
export function toSkipTake(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize }
}
