import { Response } from 'express';

interface PaginationMeta {
  currentPage?: number;
  perPage?: number;
  totalDocuments?: number;
  totalPages?: number;
  [key: string]: any;
}

interface ApiResponseBase {
  success: boolean;
  message: string;
}

interface ApiResponseWithData<T> extends ApiResponseBase {
  data: T;
}

interface ApiResponseWithMeta<T> extends ApiResponseBase {
  data: T & { meta?: PaginationMeta };
}

export const successResponse = <T extends object>(
  res: Response,
  data: T,
  message = 'Successful',
  meta?: PaginationMeta
): void => {
  const response: ApiResponseWithMeta<T> = {
    success: true,
    message,
    data: meta ? { ...data, meta } : data
  };

  res.status(200).json(response);
};

export const createdResponse = <T extends object>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): void => {
  const response: ApiResponseWithData<T> = {
    success: true,
    message,
    data
  };

  res.status(201).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  documents: T[],
  meta: Required<PaginationMeta>,
  message = 'Successful'
): void => {
  const response: ApiResponseWithData<{
    documents: T[];
    meta: PaginationMeta;
  }> = {
    success: true,
    message,
    data: {
      documents,
      meta
    }
  };

  res.status(200).json(response);
};