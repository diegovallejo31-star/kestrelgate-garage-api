# The house style

These hold everywhere. They are written down once, here, and then assumed in
every module rather than restated - a task written against this repo is expected
to know them.

## Days and windows

* A **day** is a `YYYY-MM-DD` string and nothing else. There are no `Date`
  objects on the wire and none in the database; a day is compared as a string,
  which works because the format sorts. `src/lib/schemas.ts` has the shared
  `dayString`, and it refuses a date that never happened (`2025-02-30`).
* A **window** is half-open: `from` is included, `to` is not. `dayWindowSchema`
  refuses a window that does not end strictly after it starts. A single day's
  worth of something is therefore `[day, addDays(day, 1))`, never `[day, day]`.
* Nothing reads the clock in the middle of a calculation. A figure that depends
  on "today" takes the day as an argument, so the same inputs always give the
  same answer and a test does not change meaning overnight.

## Money

* Money is **whole pence**, held as an integer, everywhere - `tradePricePence`,
  `labourPence`, `grossPence`. There is no floating point in a money path; a
  price that will not divide evenly is split with `splitEvenly` so the parts add
  back to the whole exactly.
* A markup or a tax rate is **basis points**: 2500 is a quarter on, 2000 is the
  20% VAT. `bpsOf` does the arithmetic and rounds once.
* A figure worked out from others - a job's labour charge, an invoice's totals -
  is **computed when the record is raised and then stored**, never recomputed on
  read. The parts it was built from can be repriced afterwards; the figure the
  customer was given cannot move. This is why those columns are on the row and
  are not in the create body.

## State

* A record that moves through states (`bookings`, `jobs`, `reminders`) starts in
  its first state and moves along a declared path, never backwards. Reopening a
  completed booking or resending a sent reminder is a new record, not a revival
  of the old one - the old figure is what somebody was already told.
* Uniqueness is stated per module and means what it says: a technician's clock
  number is unique **within a branch**, but a vehicle registration, an MOT
  certificate number and an invoice number are unique **across the whole group**.

## Not built yet

Reminders are raised and sent by hand. There is no job that looks at a vehicle's
latest MOT and *schedules* the `mot_due` reminder for a month before it expires -
the desk types those in. That is the obvious next thing to add, and the first
task against this repo builds it.
