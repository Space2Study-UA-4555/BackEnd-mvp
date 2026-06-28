# Database migrations

Reusable DB migration mechanism for BackEnd-mvp, powered by
[`migrate-mongo`](https://github.com/seppevs/migrate-mongo).

Use migrations for any change to existing data or schema shape that must be
applied consistently across environments (dev / staging / prod) — e.g. hashing
legacy passwords, backfilling a new field, renaming a field, reshaping a
sub-document.

## Configuration

- `migrate-mongo-config.js` (project root) — registers module-alias + loads env,
  reads `MONGODB_URL` (database name is parsed from the URL).
- Applied migrations are tracked in the `changelog` collection; a `changelog_lock`
  collection prevents concurrent runs. A migration recorded in `changelog` is
  never re-run.

## Commands

Run from the `BackEnd-mvp/` directory:

```bash
npm run migrate:status          # list migrations and their state (PENDING / applied date)
npm run migrate:up              # apply all pending migrations
npm run migrate:down            # roll back the last applied migration
npm run migrate:create <name>   # scaffold a new migration file in migrations/
```

`MONGODB_URL` comes from the environment (`.env` / `.env.local`), same as the app.
To target a local Mongo instead of the Docker host, override it inline:

```bash
MONGODB_URL='mongodb://localhost:27017/spacetostudy' npm run migrate:up
```

When running the Dockerized dev stack, equivalent Make targets execute the same
commands inside the backend container (where `MONGODB_URL` already resolves):

```bash
make migrate-status
make migrate-up
make migrate-down
make migrate-create name=add-something
```

## When migrations run

`migrate:up` is a **deploy / CI step**, not part of the server boot path — run it
once per release before (or as part of) starting the updated app. Never wire a
full-collection migration into `serverSetup`, or it would scan the whole
collection on every restart.

## Writing a migration

```bash
npm run migrate:create add-something
```

This creates `migrations/<timestamp>-add-something.js` with `up` / `down`:

```js
module.exports = {
  async up(db) {
    // forward change, e.g. await db.collection('users').updateMany(...)
  },
  async down(db) {
    // rollback (leave empty / throw if irreversible)
  }
}
```

Guidelines:

- **Make `up` idempotent** — filter at the DB level so re-running over
  already-migrated data is a no-op (the `changelog` already guards re-runs, but
  defensive filtering keeps partial/failed runs safe).
- **Bypass Mongoose hooks** when needed — migrations receive the native `db`
  handle. Writing through it (`db.collection(...).updateOne`) does **not** trigger
  Mongoose middleware (e.g. the `pre('save')` password hook), which is what you
  want for data backfills (avoids double-processing).
- Project path aliases (`~/...`) work inside migration files because the config
  registers `module-alias`.
- `down` may be a no-op for irreversible changes — document why in a comment.

## Example

`20260616081409-hash-plaintext-passwords.js` — migrates legacy plain-text
passwords to bcrypt hashes. `up` selects only users whose `password` is not
already a bcrypt hash (`^\$2[aby]\$\d{2}\$`) and re-hashes the stored value via
`updateOne` (bypassing the `pre('save')` hook to avoid double hashing). `down`
is a no-op because hashing is one-way.
