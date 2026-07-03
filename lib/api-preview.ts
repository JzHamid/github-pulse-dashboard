export type ApiPreview = {
  title?: string;
  sourceLabel?: string;
  requests: Array<{
    label: string;
    method: "GET" | "POST";
    url: string;
    status: number | null;
  }>;
  response: unknown;
};
