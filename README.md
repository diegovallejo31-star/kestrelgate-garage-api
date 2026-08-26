# kestrelgate-garage-api

The back office for a small garage group: branches, the vehicles their
customers bring in, the work done on them, and the money that follows.

It is a plain Express + TypeScript service over SQLite, with no framework beyond
that. Every module is the same six files - types, schema, repository, service,
controller, routes - so once you have read one you can find your way around any
of them.

```sh
npm install
npm run dev      # a watch server on the port in src/config/env.ts
npm run check    # typecheck, eslint, prettier, jest - all of it
```

## What is in it

A branch (`/sites`) has technicians. A customer (`/customers`) has vehicles. A
vehicle is booked in (`/vehicles/:id/bookings`), the booking carries jobs, a job
carries the parts fitted to it, and when the booking is completed it is invoiced
and the invoice is paid off. MOT tests and customer reminders hang off the
vehicle. Parts are restocked through supplier orders, each branch lends out a
few courtesy cars, and the work carries a warranty. Auth, API keys and the audit
trail sit underneath all of it.

See [docs/domain.md](docs/domain.md) for the conventions the whole codebase
holds to - they are assumed, not repeated, in each module.

## The shape of a request

Everything is JSON. A write answers `201` with the row it created, a read
answers `200`, a bad body answers `400`, something missing answers `404`, and a
rule broken answers `409`. Lists come back as `{ "items": [...] }` and take
`limit` and `offset`; unknown query keys are refused rather than ignored.
