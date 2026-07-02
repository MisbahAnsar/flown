type RustResult<T> = {
  isOk?: () => boolean;
  isErr?: () => boolean;
  unwrap?: () => T;
  value?: T;
  error?: { message?: string };
};

export function unwrapContractResult<T>(result: unknown): T {
  if (result && typeof result === "object") {
    const record = result as RustResult<T>;

    if (typeof record.isErr === "function" && record.isErr()) {
      throw new Error(record.error?.message ?? "Contract call returned an error.");
    }

    if (typeof record.unwrap === "function") {
      return record.unwrap();
    }

    if ("value" in record) {
      return record.value as T;
    }
  }

  return result as T;
}

export function normalizeActionLogList(result: unknown): unknown[] {
  const unwrapped = unwrapContractResult<unknown>(result);

  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  throw new Error("Contract returned an unexpected get_actions payload.");
}
