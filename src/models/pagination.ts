import { Expose } from 'class-transformer';

export class Pagination {
  @Expose({ name: 'current_page' })
  public currentPage: number;

  @Expose({ name: 'per_page' })
  public perPage: number;

  @Expose({ name: 'last_page' })
  public lastPage: number;

  @Expose()
  public total: number;

  @Expose()
  public from: number;

  @Expose()
  public to: number;

  constructor(pagination?: Partial<Pagination>) {
    Object.assign(this, pagination);
  }
}
