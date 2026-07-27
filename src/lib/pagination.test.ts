import { DEFAULT_LIMIT, MAX_LIMIT, pageFrom } from './pagination';

describe('paging', () => {
  it('falls back to the default page', () => {
    expect(pageFrom()).toEqual({ limit: DEFAULT_LIMIT, offset: 0 });
  });

  it('clamps a limit to what the database will answer quickly', () => {
    expect(pageFrom(5000).limit).toBe(MAX_LIMIT);
    expect(pageFrom(0).limit).toBe(1);
  });

  it('will not page backwards', () => {
    expect(pageFrom(10, -5).offset).toBe(0);
  });
});
