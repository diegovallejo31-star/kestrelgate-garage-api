import { ConflictError, NotFoundError } from '../../lib/AppError';
import { pageFrom } from '../../lib/pagination';
import type { SiteFilter, SiteRepository } from './site.repository';
import type { NewSite, Site, SitePatch } from './site.types';

/**
 * Branches.
 *
 * The code is the group's own, not ours, so it arrives from the caller and has
 * to be unique across the estate - two branches called BRN would put a job on
 * the wrong ramp forty miles away.
 */
export class SiteService {
  constructor(private readonly repo: SiteRepository) {}

  create(input: NewSite): Site {
    if (this.repo.findByCode(input.code)) {
      throw new ConflictError(`site ${input.code} already exists`);
    }
    return this.repo.create(input);
  }

  list(filter: SiteFilter, limit?: number, offset?: number): Site[] {
    return this.repo.list(pageFrom(limit, offset), filter);
  }

  getById(id: number): Site {
    const site = this.repo.findById(id);
    if (!site) throw new NotFoundError('site', id);
    return site;
  }

  update(id: number, patch: SitePatch): Site {
    this.getById(id);
    const updated = this.repo.update(id, patch);
    if (!updated) throw new NotFoundError('site', id);
    return updated;
  }
}
