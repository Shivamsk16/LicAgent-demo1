export type SearchResult = {
  id: string;
  type: "customer" | "policy" | "payment";
  label: string;
  sublabel?: string;
  href: string;
};
