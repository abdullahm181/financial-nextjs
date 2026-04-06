/**
 * Standard API response wrapper.
 * Use this for all service calls to ensure consistent typing.
 */
export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

/**
 * Pagination metadata returned by paginated endpoints.
 */
export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

/**
 * Generic paginated response.
 */
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: PaginationMeta;
};

/**
 * Utility: make specific keys of T optional.
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Re-export specific feature types
export type {
  Transaction,
  TransactionType,
  TransactionSummary,
} from "./transaction";
