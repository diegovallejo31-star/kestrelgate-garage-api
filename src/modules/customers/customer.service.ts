import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import type { CustomerFilter, CustomerRepository } from './customer.repository';
import type { Customer, CustomerPatch, NewCustomer } from './customer.types';

/**
 * Accounts.
 *
 * The reference comes in from the caller because it is already printed on the
 * customer's paperwork by the time we hear about them; we only refuse to hold
 * the same one twice.
 */
export class CustomerService {
  constructor(private readonly repo: CustomerRepository) {}

  create(input: NewCustomer): Customer {
    if (this.repo.findByAccountRef(input.accountRef)) {
      throw new ConflictError(`account ${input.accountRef} already exists`);
    }
    return this.repo.create(input);
  }

  list(filter: CustomerFilter, limit?: number, offset?: number): Customer[] {
    return this.repo.list(pageFrom(limit, offset), filter);
  }

  getById(id: number): Customer {
    const customer = this.repo.findById(id);
    if (!customer) throw new NotFoundError('customer', id);
    return customer;
  }

  update(id: number, patch: CustomerPatch): Customer {
    this.getById(id);
    const updated = this.repo.update(id, patch);
    if (!updated) throw new NotFoundError('customer', id);
    return updated;
  }
}
