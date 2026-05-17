export type ExampleItem = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ListExamplesResponse = {
  readonly items: readonly ExampleItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
};
