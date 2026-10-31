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

const serverMessage = (data: unknown): string | undefined =>
  typeof data === "object" &&
  data !== null &&
  "error" in data &&
  typeof data.error === "string"
    ? data.error
    : undefined;

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
      serverMessage(data) ?? `The request failed (HTTP ${status}).`,
      { status, data },
    );
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEOUT") {
    return new ApiError(
      "timeout",
      "The server took too long to respond. Please try again.",
    );
  }

  return new ApiError(
    "network",
    "Can't reach the server. Check you connection and try again.",
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
      'meta[name="csrf-token"',
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
