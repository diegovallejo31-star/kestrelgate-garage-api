import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import { SiteRepository } from '../sites/site.repository';
import type { TechnicianFilter, TechnicianRepository } from './technician.repository';
import type { NewTechnician, Technician, TechnicianPatch } from './technician.types';

/**
 * Workshop staff.
 *
 * Clock numbers are handed out per branch and get reused across the group, so
 * the uniqueness check is scoped to the site: BRN/14 and CWL/14 are two
 * different people and both are allowed to exist.
 */
export class TechnicianService {
  constructor(
    private readonly repo: TechnicianRepository,
    private readonly sites: SiteRepository,
  ) {}

  create(siteId: number, input: Omit<NewTechnician, 'siteId'>): Technician {
    if (!this.sites.findById(siteId)) {
      throw new NotFoundError('site', siteId);
    }
    if (this.repo.findByClockNumber(siteId, input.clockNumber)) {
      throw new ConflictError(
        `clock number ${input.clockNumber} is already used at this site`,
      );
    }
    return this.repo.create({ ...input, siteId });
  }

  list(
    siteId: number,
    filter: TechnicianFilter,
    limit?: number,
    offset?: number,
  ): Technician[] {
    if (!this.sites.findById(siteId)) {
      throw new NotFoundError('site', siteId);
    }
    return this.repo.list(siteId, pageFrom(limit, offset), filter);
  }

  getById(id: number): Technician {
    const technician = this.repo.findById(id);
    if (!technician) throw new NotFoundError('technician', id);
    return technician;
  }

  update(id: number, patch: TechnicianPatch): Technician {
    this.getById(id);
    const updated = this.repo.update(id, patch);
    if (!updated) throw new NotFoundError('technician', id);
    return updated;
  }
}
