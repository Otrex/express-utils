import { Response } from "express";

export class _APIResponse<T> {
  constructor(public status: number, public data?: Record<string, T>) { }
  prepare(res: Response) {
    return res.status(this.status).json(this.sanitize(this.data));
  }
  sanitize(data?: Record<string, T> | T) {
    return data;
  }
  send(res: Response) {
    return this.prepare(res);
  }
}

export function success<T extends Record<string, any>>(
  res: Response,
  data?: T,
  status?: number
) {
  const $data = {
    state: "success",
    timestamp: Date.now(),
    ...(data || {}),
  };

  const responder = new _APIResponse(status || 200, $data).send(res);
}

export function _paginateResponse<T>(
  data: [T[], number],
  page: number,
  limit: number,
) {
  const [result, total] = data;
  const lastPage = Math.ceil(total / limit);
  const nextPage = +page + 1 > lastPage ? null : +page + 1;
  const prevPage = +page - 1 < 1 ? null : +page - 1;
  return {
    data: result,
    payload: {
      total,
      currentPage: +page,
      nextPage,
      prevPage,
      lastPage,
    },
  };
}
