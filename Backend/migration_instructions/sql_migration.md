# OPD Mini-Module: Migrate Backend from MongoDB to PostgreSQL

Goal: replace MongoDB + Mongoose with PostgreSQL + Sequelize **without changing any API route, request body, or response shape**. The frontend must keep working with zero changes.

Do the steps in order and re-run the existing Part 1 and Part 2 checklists from the original instructions at the end.

---

## 0. Decisions (change only if you decide otherwise)

- Database: **PostgreSQL 14+**.
- ORM: **Sequelize** with the `pg` driver. It is the closest equivalent to Mongoose (models, validations, associations, `include` = populate), so folder structure and flow stay the same.
- IDs: **UUID (v4)** primary keys, returned to the frontend as strings. This keeps IDs opaque strings like the old ObjectIds.
- The API still returns **`_id`** (not `id`) so the frontend does not change. The conversion happens in one place (the response helper, see 4).
- Schema creation: `sequelize.sync()` for this demo. Mention in the review that production would use migrations (`sequelize-cli` or similar).
- Everything else from the original spec stays: JWT auth with name + phone, response envelope, status codes, route list, business rules.

---

## 1. Install and remove packages

```bash
cd backend
npm uninstall mongoose
npm install sequelize pg pg-hstore
```

Keep `express`, `cors`, `dotenv`, `jsonwebtoken`, `nodemon`.

Create the database once (pick one):

```bash
createdb opd_mini
# or inside psql:
# CREATE DATABASE opd_mini;
```

---

## 2. Environment variables

Update **`Backend/.env.example`** (and your local `Backend/.env`). Remove `MONGO_URI`.

```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# PostgreSQL
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=opd_mini
DB_USER=postgres
DB_PASSWORD=your_postgres_password
# Set to true for hosted databases (Neon, Supabase, Render, Railway, etc.)
DB_SSL=false
# Optional: a full connection string. If set, it is used instead of the DB_* values above.
# DATABASE_URL=postgresql://postgres:your_postgres_password@127.0.0.1:5432/opd_mini

# Auth
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
```

Rules:
- `.env.example` is committed with placeholder values only. `.env` is never committed (check `.gitignore`).
- `DB_PASSWORD` and `JWT_SECRET` must never contain real secrets in `.env.example`.

---

## 3. Database connection

Rewrite `src/config/db.js`:

- Create one `Sequelize` instance and export it, plus a `connectDB()` function.
- If `DATABASE_URL` exists, use it; otherwise build from `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Dialect: `postgres`. Set `logging: false` (or log only when `NODE_ENV=development`).
- If `DB_SSL === 'true'`, add `dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }`.
- `connectDB()` does `await sequelize.authenticate()` then `await sequelize.sync()`.
- `server.js` calls `connectDB()` first, and only then `app.listen(...)`. On failure: log the error and `process.exit(1)`.

> `db.js` reads `process.env` when it is first required, so `dotenv.config()` must run **before** any model or db file is imported (in `server.js` and in `seed.js`).

---

## 4. Response helper change (keeps the frontend unchanged)

In `utils/response.js`, before sending any `data`, convert Sequelize output to the old shape:

1. Turn Sequelize instances into plain objects: `JSON.parse(JSON.stringify(data))`.
2. Walk the object **recursively** (arrays and nested objects, so populated `patient`, `doctor`, `appointment` are covered) and rename every `id` key to `_id`.
3. Drop the raw foreign key fields from the output (`patientId`, `doctorId`, `appointmentId`) since the populated objects are already returned. For the plain Doctor, Patient, and User objects there is nothing to drop.

Do this once in the helper, not in controllers.

---

## 5. Models (Sequelize)

Create `src/models/index.js` that defines every model, sets up the associations, and exports `{ sequelize, User, Patient, Doctor, Appointment, Consultation }`. All controllers and `seed.js` import from this file so associations are always loaded.

Common options for every model: `timestamps: true`, primary key `id` as `DataTypes.UUID` with `defaultValue: DataTypes.UUIDV4`.

Mongoose to Sequelize cheatsheet:

| Mongoose | Sequelize |
|----------|-----------|
| `required: true` | `allowNull: false` plus `validate: { notNull: { msg: '...' }, notEmpty: { msg: '...' } }` |
| `unique: true` | `unique: true` |
| `trim: true` | a setter that trims the value (see below) |
| `enum: [...]` | `DataTypes.ENUM(...)` or `validate: { isIn: [[...]] }` |
| `match: /^\d{10}$/` | `validate: { is: { args: /^\d{10}$/, msg: 'Phone must be 10 digits' } }` |
| `min` / `max` | `validate: { min: 0, max: 120 }` |
| `ref` + `populate` | `belongsTo` / `hasMany` + `include` |

Trim setter pattern (use for every trimmed string):

```js
set(value) {
  this.setDataValue('name', typeof value === 'string' ? value.trim() : value);
}
```

**User** (table `users`)
| Field | Type | Rules |
|-------|------|-------|
| name | STRING | required, trimmed, **unique** |
| phone | STRING(10) | required, **unique**, 10 digits |

**Patient** (table `patients`)
| Field | Type | Rules |
|-------|------|-------|
| name | STRING | required, trimmed |
| gender | ENUM | `Male`, `Female`, `Other`, required |
| age | INTEGER | required, 0 to 120 |
| phone | STRING(10) | required, 10 digits, **unique** |

**Doctor** (table `doctors`)
| Field | Type | Rules |
|-------|------|-------|
| name | STRING | required, trimmed |
| category | STRING | required, trimmed |

**Appointment** (table `appointments`)
| Field | Type | Rules |
|-------|------|-------|
| patientId | UUID | required, FK to `patients.id` |
| doctorId | UUID | required, FK to `doctors.id` |
| appointmentDateTime | DATE (timestamptz) | required |
| status | ENUM | `Scheduled`, `Completed`; default `Scheduled` |

**Consultation** (table `consultations`)
| Field | Type | Rules |
|-------|------|-------|
| appointmentId | UUID | required, **unique**, FK to `appointments.id` (one consultation per appointment) |
| temperature | FLOAT | required |
| pulse | INTEGER | required |
| notes | STRING(500) | required, trimmed |
| isCompleted | BOOLEAN | default `false` |
| consultationDate | DATE | default `DataTypes.NOW` |

Notes:
- Use `FLOAT` (not `DECIMAL`) for temperature, because Sequelize returns `DECIMAL` as a string.
- Vitals are **flat columns** in Postgres, but the API must still return and accept the nested shape `vitals: { temperature, pulse }`. Add a small `formatConsultation()` helper in `utils/` that builds the nested `vitals` object (and removes the flat fields) before the response helper runs. In the controller, read `req.body.vitals.temperature` and `req.body.vitals.pulse` and map them to the flat columns. A missing `vitals` object must give a 400 validation error, not a crash.

**Associations** (in `models/index.js`):

```
Patient     hasMany   Appointment   (foreignKey: patientId)
Appointment belongsTo Patient       (as: 'patient',  foreignKey: patientId)
Doctor      hasMany   Appointment   (foreignKey: doctorId)
Appointment belongsTo Doctor        (as: 'doctor',   foreignKey: doctorId)
Appointment hasOne    Consultation  (foreignKey: appointmentId)
Consultation belongsTo Appointment  (as: 'appointment', foreignKey: appointmentId)
```

Use the `as` names `patient`, `doctor`, `appointment` so the JSON keys match the old populated shape.

---

## 6. Central error handler (replace the Mongoose branches)

Keep the same error envelope. Map errors like this in `middleware/errorHandler.js`:

| Error | Status | Response |
|-------|--------|----------|
| `SequelizeValidationError` | 400 | "Validation failed" with `errors[]` built from each `error.path` and `error.message` |
| `SequelizeUniqueConstraintError` | 409 | "<Field> already exists" using `error.errors[0].path` (e.g. "Phone already exists") |
| `SequelizeDatabaseError` with `error.parent.code === '22P02'` (invalid UUID text) | 400 | "Invalid ID" |
| `SequelizeForeignKeyConstraintError` | 400 | "Invalid reference" |
| anything else | 500 | "Something went wrong" (log the real error on the server only) |

Also: validate `:id` params early with a UUID check (`uuid` package's `validate`, or a regex) so bad IDs return 400 before hitting the database.

The 404 handler for unknown routes stays as is.

---

## 7. Controller changes (Mongoose to Sequelize)

Routes, rules, and status codes do not change. Only the queries do.

| Old (Mongoose) | New (Sequelize) |
|----------------|-----------------|
| `Model.create(body)` | `Model.create(body)` |
| `Model.find().sort({ name: 1 })` | `Model.findAll({ order: [['name', 'ASC']] })` |
| `Model.findById(id)` | `Model.findByPk(id)` |
| `Model.findOne({ name, phone })` | `Model.findOne({ where: { name, phone } })` |
| `.populate('patient doctor')` | `include: [{ model: Patient, as: 'patient', attributes: ['id','name','phone'] }, { model: Doctor, as: 'doctor', attributes: ['id','name','category'] }]` |
| `.countDocuments()` | `.count()` (or use `data.length`) |

**Search (`GET /api/patients?search=`)**
- Trim the text; empty means no search (newest first: `order: [['createdAt', 'DESC']]`).
- Use `Op.or` with `Op.iLike` on `name` and `phone`: `{ [Op.iLike]: '%' + escaped + '%' }`.
- In Postgres `LIKE` patterns, the special characters are `%`, `_`, and `\`, not regex characters. Escape them before building the pattern: `text.replace(/[\\%_]/g, '\\$&')`.

**Today's appointments**
- `utils/dateRange.js` stays the same (local start and end of day).
- Query: `where: { appointmentDateTime: { [Op.between]: [start, end] } }`, order ascending, with the populated patient and doctor.

**Appointments by status**
- `where: status ? { status } : {}`, order by `appointmentDateTime` ascending.

**Create consultation**
- Same three checks in the same order (appointment exists, is `Scheduled`, no consultation yet). The unique constraint on `appointmentId` is the final safety net: a `SequelizeUniqueConstraintError` there should still return 409.

**Complete consultation (use a transaction)**
- Wrap both steps in `sequelize.transaction(async (t) => { ... })` so either both happen or neither does:
  1. Set `isCompleted = true`.
  2. Set the linked appointment's `status = 'Completed'`.
- Return the updated consultation in the standard consultation response shape.

**Patient history (`GET /api/patients/:patientId/consultations`)**
- Postgres lets you do this in **one query with a join** instead of the old two-step approach:
  - `Consultation.findAll({ where: { isCompleted: true }, include: [{ model: Appointment, as: 'appointment', where: { patientId }, required: true, include: [{ model: Doctor, as: 'doctor' }] }], order: [['consultationDate', 'DESC']] })`
- Response shape stays the same as before (consultation with nested `appointment` and `doctor`).
- Check that the patient exists first and return 404 if not.

---

## 8. Seed script (`src/seed.js`) for PostgreSQL

Rewrite `seed.js` to use Sequelize instead of Mongoose. Requirements:

- Load `dotenv` **first**, then import `./models`.
- Connect with `sequelize.authenticate()`, then `sequelize.sync()` so the tables exist even on a fresh database.
- Keep the same `doctorsSeedData` array.
- **Default mode is safe and repeatable:** for each doctor use `Doctor.findOrCreate({ where: { name, category } })`, so running `npm run seed` twice never creates duplicates.
- **Fresh mode** (`npm run seed:fresh`, i.e. `node src/seed.js --fresh`): clears the doctors first. Because appointments reference doctors, use `Doctor.destroy({ truncate: true, cascade: true })`. **Warning:** `CASCADE` also wipes appointments and consultations. Print a clear console warning in this mode.
- Do **not** use `sync({ force: true })` in the seed; it drops every table including patients and users.
- Always close the connection (`sequelize.close()`) and exit with code 0 on success or 1 on failure.

Add to `package.json`:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "seed": "node src/seed.js",
  "seed:fresh": "node src/seed.js --fresh"
}
```

Reference implementation:

```javascript
const path = require('path');
const dotenv = require('dotenv');

// Load env BEFORE importing models (db.js reads process.env on require)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, Doctor } = require('./models');

const doctorsSeedData = [
  { name: 'Dr. Rajesh Sharma', category: 'General Physician' },
  { name: 'Dr. Priya Mehta', category: 'Cardiology' },
  { name: 'Dr. Amit Patel', category: 'Orthopedics' },
  { name: 'Dr. Sneha Rao', category: 'Pediatrics' },
  { name: 'Dr. Vikram Deshmukh', category: 'Dermatology' },
  { name: 'Dr. Ananya Gupta', category: 'Gynecology' }
];

const seedDatabase = async () => {
  const fresh = process.argv.includes('--fresh');

  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL for seeding...');

    // Create tables if they do not exist yet (never force: true here)
    await sequelize.sync();

    if (fresh) {
      console.warn('--fresh: clearing doctors (this also removes appointments and consultations).');
      await Doctor.destroy({ truncate: true, cascade: true });
      console.log('Cleared existing doctors table.');
    }

    let created = 0;
    for (const data of doctorsSeedData) {
      const [doctor, wasCreated] = await Doctor.findOrCreate({ where: data });
      if (wasCreated) created += 1;
      console.log(` - ${doctor.name} (${doctor.category})${wasCreated ? '' : ' [already exists]'}`);
    }

    console.log(`Seeding completed. ${created} new doctor(s) added.`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    try { await sequelize.close(); } catch (_) { /* ignore */ }
    process.exit(1);
  }
};

seedDatabase();
```

---

## 9. Cleanup

- [ ] No `require('mongoose')` anywhere in `backend/src`
- [ ] `MONGO_URI` removed from `.env`, `.env.example`, and README
- [ ] `mongoose` removed from `package.json`
- [ ] README updated: install PostgreSQL, create the `opd_mini` database, copy `.env.example` to `.env`, `npm install`, `npm run seed`, `npm run dev`

---

## 10. Migration Checklist (re-run everything)

Part 1:
- [ ] Server starts, connects to PostgreSQL, and tables are created
- [ ] Register works; same name or phone again returns 409
- [ ] Login with correct name + phone returns a token; wrong combo returns 401
- [ ] `GET /api/auth/me` works with the token and returns 401 without it
- [ ] Invalid phone (e.g. "123") returns 400 with `errors[]`

Part 2:
- [ ] `npm run seed` creates doctors; running it twice does not duplicate them
- [ ] `GET /api/doctors` returns doctors sorted by name
- [ ] Patient create works; duplicate phone returns 409
- [ ] Search finds "rav" (name) and "9876" (phone), case-insensitive; searching for `%` or `_` does not match everything
- [ ] Appointment with a fake or malformed patient/doctor ID returns 404 / 400 (not 500)
- [ ] `/today` returns only today's appointments
- [ ] Consultation cannot be created twice for one appointment (409)
- [ ] Completing a consultation flips the appointment to `Completed`
- [ ] Completing twice returns 409
- [ ] Patient history returns only completed consultations with doctor details
- [ ] Every response still uses `_id` and nested `vitals: { temperature, pulse }`; the frontend works without changes

---

## Review Talking Points (updated)

- Why Postgres: relational data (Patient, Appointment, Consultation) with real foreign keys, unique constraints, and transactions enforced by the database itself.
- Consultation still links to the appointment, not the patient; patient history is now a single SQL join instead of two queries.
- Completing a consultation uses a **transaction**, so the consultation and appointment can never get out of sync.
- Validation lives in Sequelize models and route-level checks; database constraints (unique, foreign keys, NOT NULL) are the last line of defense.
- The response envelope and `_id` field are unchanged, so the frontend was untouched by the database swap.
- Future upgrades: migrations instead of `sync()`, password/OTP auth, role-based access, doctor schedule conflict checks (a unique or exclusion constraint on doctor + time), pagination.