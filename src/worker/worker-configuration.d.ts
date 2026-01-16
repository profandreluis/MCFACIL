export {};

declare global {
  interface Env {
    R2_BUCKET: R2Bucket;
    DB: D1Database;
    MIGRATION_SECRET?: string;
  }

  interface R2Bucket {
    put(key: string, body: ReadableStream | ArrayBuffer | ArrayBufferView | string, options?: Record<string, unknown>): Promise<unknown>;
    get(key: string): Promise<{ body: ReadableStream | null; writeHttpMetadata: (h: Headers) => void; httpEtag?: string } | null>;
  }

  interface D1Database {
    prepare(sql: string): {
      bind: (...args: unknown[]) => { first: () => Promise<unknown>; all: () => Promise<{ results: unknown[] }>; run: () => Promise<unknown> };
      first: () => Promise<unknown>;
      all: () => Promise<{ results: unknown[] }>;
      run: () => Promise<unknown>;
    };
  }

  // minimal File typing for formData.get
  interface File {
    name: string;
    type: string;
    size: number;
    stream(): ReadableStream;
  }
}
