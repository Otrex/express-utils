import { Response } from "express";

export class _APIResponse<T> {
  constructor(public status: number, public data?: Record<string, T> ) {}
  prepare(res: Response) {
    return res.status(this.status).json(this.sanitize(this.data))
  }
  sanitize(data?: Record<string, T> | T) {
    return data
  }
  send(res: Response) {
    return this.prepare(res);
  }
}

export function _paginateResponse<T>(data: [T, number], page: number, limit: number, sanitizer = (d: T): any => d) {
  const [result, total] = data;
  const lastPage = Math.ceil(total / limit);
  const nextPage = page + 1 > lastPage ? null : page + 1;
  const prevPage = page - 1 < 1 ? null : page - 1;
  return {
    data: sanitizer(result),
    pageData: {
      total,
      currentPage: +page,
      nextPage,
      prevPage,
      lastPage,
    },
  };
}