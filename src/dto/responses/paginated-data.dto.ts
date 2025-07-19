export class PaginatedDataDto<T> {
  pageData!: T[];
  page!: number;
  limit!: number;
  total!: number;
  totalPages!: number;

  constructor(pageData: T[], page: number, limit: number, total: number) {
    this.pageData = pageData;
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}
