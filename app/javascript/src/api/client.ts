import axios from "axios";

export type ApiErrorKind =
  | "http"
  | "timeout"
  | "network"
  | "cancelled"
  | "unknown";

type ApiErrorDetails = {
  status?: number;
  data?: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly data?: unknown;

  constructor(
    kind: ApiErrorKind,
    message: string,
    { status, data }: ApiErrorDetails = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.data = data;
  }
}

// Fixed client-side text per status; server-provided messages are never shown.
const HTTP_MESSAGES: Record<number, string> = {
  401: "Please sign in again.",
  403: "You don't have permission to do that.",
  404: "That record could not be found.",
};

const toApiError = (error: unknown): ApiError => {
  if (axios.isCancel(error)) {
    return new ApiError("cancelled", "The request was cancelled.");
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError("unknown", "Something went wrong");
  }

  if (error.response) {
    const { status, data } = error.response;
    return new ApiError(
      "http",
      HTTP_MESSAGES[status] ?? `The request failed (HTTP ${status}).`,
      { status, data },
    );
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return new ApiError(
      "timeout",
      "The server took too long to respond. Please try again.",
    );
  }

  return new ApiError(
    "network",
    "Can't reach the server. Check your connection and try again.",
  );
};

export const client = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

client.interceptors.request.use((config) => {
  if ((config.method ?? "get").toLowerCase() !== "get") {
    const token = document.querySelector<HTMLMetaElement>(
      'meta[name="csrf-token"]',
    )?.content;

    if (token) {
      config.headers.set("X-CSRF-TOKEN", token);
    }
  }

  return config;
});

client.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(toApiError(error)),
);
