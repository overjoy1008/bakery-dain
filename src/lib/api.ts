export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://bakery-dain-api.overjoy1008.workers.dev/api";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string | null;
};

export async function apiRequest<TResponse>(
  path: string,
  { body, method = "GET", token }: RequestOptions = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
  });

  if (!response.ok) {
    let errorBody: ApiErrorBody = {};

    try {
      errorBody = (await response.json()) as ApiErrorBody;
    } catch {
      errorBody = {};
    }

    throw new ApiError(
      errorBody.error?.message ?? "요청을 처리하지 못했어요.",
      response.status,
      errorBody.error?.code,
    );
  }

  return (await response.json()) as TResponse;
}

