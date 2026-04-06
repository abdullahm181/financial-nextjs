/**
 * Shared TypeScript types.
 */

export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: PaginationMeta;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Feature types
export type { ChatMessage, ParsedTransaction } from "./chat";
