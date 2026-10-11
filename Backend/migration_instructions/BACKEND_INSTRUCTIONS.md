# OPD Mini-Module: Backend Instructions (Node.js + Express + MongoDB)

Build this in two parts. Finish and test Part 1 before starting Part 2.

- **Part 1:** Setup, response format, models, authentication
- **Part 2:** Patient, Doctor, Appointment, Consultation APIs, seed data, testing

---

## Assumptions (change only if you decide otherwise)

- Auth is **name + phone number** (no password). Both are unique per user. This is demo-level auth, so mention in the review that production would add a password or OTP.
- A "user" is the person using the system (receptionist or doctor staff). Users are separate from Patients and Doctors.
- Doctor has only two fields: `name` and `category`.
- Timezone: everything uses the server's local timezone. "Today" = local start of day to local end of day.
- All routes except `/api/auth/register` and `/api/auth/login` require a JWT.

---

# PART 1: Foundation, Response Format, Models, Auth

## 1.1 Setup

- Packages: `express`, `mongoose`, `cors`, `dotenv`, `jsonwebtoken`; dev: `nodemon`.
- `.env` values: `PORT=5000`, `MONGO_URI=mongodb://127.0.0.1:27017/opd_mini`, `JWT_SECRET=<any long string>`, `JWT_EXPIRES_IN=7d`.
- Enable `cors` (allow the React dev origin, e.g. `http://localhost:5173`) and `express.json()`.
- Suggested folders inside `backend/`:

```
backend/
  src/
    config/db.js
    models/        User.js, Patient.js, Doctor.js, Appointment.js, Consultation.js
    controllers/   auth, patient, doctor, appointment, consultation
    routes/        one file per controller, mounted under /api
    middleware/    auth.js, errorHandler.js
    utils/         response.js, dateRange.js
    seed.js
    app.js
    server.js
```

- Flow per request: **route -> auth middleware -> controller -> Mongoose model -> response helper**.

## 1.2 Standard Response Format (IMPORTANT: the frontend depends on this)

Every endpoint returns JSON in exactly one of these shapes. Build a small helper (`utils/response.js`) so nobody hand-writes responses.

**Success (single object)**
```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": { "_id": "665f...", "name": "Ravi Shah" }
}
```

**Success (list)**
```json
{
  "success": true,
  "message": "Patients fetched",
  "count": 2,
  "data": [ { "_id": "..." }, { "_id": "..." } ]
}
```
Lists always put the array in `data` and the length in `count`. Empty results are still `success: true` with `data: []`.

**Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone must be 10 digits" }
  ]
}
```
`errors` is optional (only for validation errors). `message` is always present and always safe to show in a toast.

**HTTP status codes**

| Code | Use |
|------|-----|
| 200 | OK (read, update) |
| 201 | Created |
| 400 | Validation error / bad ID format |
| 401 | Missing or invalid token / failed login |
| 404 | Record not found |
| 409 | Conflict (duplicate, already completed, already exists) |
| 500 | Unexpected server error |

**Central error handler** (`middleware/errorHandler.js`) must convert these into the error shape above:
- Mongoose `ValidationError` -> 400 with `errors[]` built from each field.
- Mongo duplicate key (`code 11000`) -> 409, message like "Phone already exists".
- Mongoose `CastError` (bad ObjectId) -> 400 "Invalid ID".
- Anything else -> 500 "Something went wrong" (log the real error on the server only).

Also add a 404 handler for unknown routes using the same error shape.

## 1.3 Models (Mongoose, all with `timestamps: true`)

**User**
| Field | Type | Rules |
|-------|------|-------|
| name | String | required, trim, **unique** |
| phone | String | required, **unique**, 10 digits (`/^\d{10}$/`) |

**Patient**
| Field | Type | Rules |
|-------|------|-------|
| name | String | required, trim |
| gender | String | required, enum: `Male`, `Female`, `Other` |
| age | Number | required, min 0, max 120 |
| phone | String | required, 10 digits, **unique** (prevents duplicate registrations) |

**Doctor**
| Field | Type | Rules |
|-------|------|-------|
| name | String | required, trim |
| category | String | required, trim (e.g. Cardiology, General Physician) |

**Appointment**
| Field | Type | Rules |
|-------|------|-------|
| patient | ObjectId ref `Patient` | required |
| doctor | ObjectId ref `Doctor` | required |
| appointmentDateTime | Date | required (single date-time field) |
| status | String | enum: `Scheduled`, `Completed`; default `Scheduled` |

**Consultation**
| Field | Type | Rules |
|-------|------|-------|
| appointment | ObjectId ref `Appointment` | required, **unique** (one consultation per appointment) |
| vitals.temperature | Number | required (degrees Celsius) |
| vitals.pulse | Number | required (beats per minute) |
| notes | String | required, trim, max ~500 chars |
| isCompleted | Boolean | default `false` |
| consultationDate | Date | default `Date.now` |

Vitals are fixed to **temperature and pulse** (both numeric, easy to validate).

## 1.4 Authentication

**Endpoints**

`POST /api/auth/register`
- Body: `{ "name": "Dr Admin", "phone": "9876543210" }`
- Creates the user, returns 201.
- Duplicate name or phone -> 409.

`POST /api/auth/login`
- Body: `{ "name": "Dr Admin", "phone": "9876543210" }`
- Finds a user matching **both** name and phone. No match -> 401 "Invalid name or phone".

`GET /api/auth/me` (protected)
- Returns the current user.

**Auth success response (register and login)**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "665f...", "name": "Dr Admin", "phone": "9876543210" },
    "token": "eyJhbGciOi..."
  }
}
```

**Auth middleware** (`middleware/auth.js`)
- Reads `Authorization: Bearer <token>`.
- Verifies the JWT, loads the user, attaches it to `req.user`.
- Missing or invalid token -> 401 "Not authorized".
- Apply it to every router except the two public auth routes.

## Part 1 Checklist (test in Postman or Thunder Client)

- [ ] Server starts and connects to MongoDB
- [ ] Register works; registering the same name or phone again returns 409
- [ ] Login with correct name+phone returns token; wrong combo returns 401
- [ ] `GET /api/auth/me` works with the token and returns 401 without it
- [ ] Invalid phone (e.g. "123") returns 400 with `errors[]`

---

# PART 2: Business APIs, Seed Data, Testing

All routes below are protected and use the response format from 1.2.

## 2.1 Doctors

`GET /api/doctors`
- Returns all doctors, sorted by name. Used to fill the frontend dropdown.
```json
{ "success": true, "message": "Doctors fetched", "count": 2,
  "data": [ { "_id": "d1", "name": "Dr Mehta", "category": "Cardiology" } ] }
```

`POST /api/doctors`
- Body: `{ "name": "Dr Mehta", "category": "Cardiology" }` -> 201.

**Seed script** (`npm run seed`): clears Doctors and inserts about 5 doctors across different categories, so the dropdown works immediately.

## 2.2 Patients

`POST /api/patients`
- Body: `{ "name": "Ravi Shah", "gender": "Male", "age": 34, "phone": "9876543210" }`
- 201 with the created patient. Duplicate phone -> 409.

`GET /api/patients`
- Optional query: `?search=<text>`
- Without `search`: all patients, newest first.
- With `search`: one query that matches **name OR phone**, case-insensitive, partial match.
  - Use `$or` with `$regex` and the `i` option.
  - **Escape regex special characters** in the search text before building the regex.
  - Trim the text; an empty search behaves like no search.
```json
{ "success": true, "message": "Patients fetched", "count": 1,
  "data": [ { "_id": "p1", "name": "Ravi Shah", "gender": "Male", "age": 34, "phone": "9876543210" } ] }
```

`GET /api/patients/:id`
- Single patient or 404.

## 2.3 Appointments

`POST /api/appointments`
- Body: `{ "patient": "<patientId>", "doctor": "<doctorId>", "appointmentDateTime": "2026-10-10T10:30:00.000Z" }`
- Checks before saving:
  - Patient exists, else 404 "Patient not found".
  - Doctor exists, else 404 "Doctor not found".
  - `appointmentDateTime` is a valid date, else 400.
- Status defaults to `Scheduled`. Returns 201 with the **populated** appointment.

**Appointment response shape (used by every appointment endpoint, populated, so the frontend can render it directly):**
```json
{
  "_id": "a1",
  "patient": { "_id": "p1", "name": "Ravi Shah", "phone": "9876543210" },
  "doctor": { "_id": "d1", "name": "Dr Mehta", "category": "Cardiology" },
  "appointmentDateTime": "2026-10-10T10:30:00.000Z",
  "status": "Scheduled"
}
```

`GET /api/appointments/today`
- Returns appointments where `appointmentDateTime` is between local start of today and local end of today, sorted by time ascending.
- Put the start/end logic in `utils/dateRange.js` so it is defined in one place.

`GET /api/appointments`
- Optional query: `?status=Scheduled` (or `Completed`).
- Used by the consultation screen to list appointments that still need a consultation.
- Sorted by `appointmentDateTime` ascending.

> Route order matters: declare `/today` **before** any `/:id` route.

## 2.4 Consultations

`POST /api/consultations`
- Body:
```json
{ "appointment": "<appointmentId>",
  "vitals": { "temperature": 98.6, "pulse": 72 },
  "notes": "Mild fever, advised rest." }
```
- Rules:
  - Appointment must exist, else 404.
  - Appointment must be `Scheduled`, else 409 "Appointment already completed".
  - A consultation must not already exist for that appointment, else 409.
- Saves with `isCompleted: false`. Returns 201.

`PATCH /api/consultations/:id/complete`
- Rules:
  - Consultation exists, else 404.
  - Already completed -> 409 "Consultation already completed".
- Actions (in this order):
  1. Set `isCompleted = true`.
  2. Set the linked appointment's `status = "Completed"`.
- Returns the updated consultation.

`GET /api/patients/:patientId/consultations`
- Returns only **completed** consultations for that patient.
- Approach (state this in the review): find the patient's appointment IDs first, then find consultations where `appointment` is in that list and `isCompleted` is true, populating `appointment` and its `doctor`.
- Sorted newest first.

**Consultation response shape (for create, complete, and the patient history list):**
```json
{
  "_id": "c1",
  "vitals": { "temperature": 98.6, "pulse": 72 },
  "notes": "Mild fever, advised rest.",
  "isCompleted": true,
  "consultationDate": "2026-10-10T11:00:00.000Z",
  "appointment": {
    "_id": "a1",
    "appointmentDateTime": "2026-10-10T10:30:00.000Z",
    "status": "Completed",
    "doctor": { "_id": "d1", "name": "Dr Mehta", "category": "Cardiology" }
  }
}
```

## 2.5 Full API Summary

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | /api/auth/register | No | Create user |
| POST | /api/auth/login | No | Login, get token |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/doctors | Yes | List doctors |
| POST | /api/doctors | Yes | Add doctor |
| POST | /api/patients | Yes | Register patient |
| GET | /api/patients?search= | Yes | List / search patients |
| GET | /api/patients/:id | Yes | One patient |
| POST | /api/appointments | Yes | Book appointment |
| GET | /api/appointments/today | Yes | Today's appointments |
| GET | /api/appointments?status= | Yes | Filter by status |
| POST | /api/consultations | Yes | Save vitals + notes |
| PATCH | /api/consultations/:id/complete | Yes | Mark completed |
| GET | /api/patients/:patientId/consultations | Yes | Completed history |

## Part 2 Checklist

- [ ] Seed script creates doctors; `GET /api/doctors` returns them
- [ ] Patient create works; duplicate phone returns 409
- [ ] Search finds by partial name ("rav") and partial phone ("9876"), case-insensitive
- [ ] Appointment with a fake patient or doctor ID returns 404
- [ ] `/today` returns only today's appointments
- [ ] Consultation cannot be created twice for one appointment
- [ ] Completing a consultation flips the appointment to `Completed`
- [ ] Completing twice returns 409
- [ ] Patient history returns only completed consultations with doctor details

## Review Talking Points

- Data chain: Patient -> Appointment -> Consultation, linked by ObjectId references.
- Consultation links to the appointment, not the patient; patient history goes through appointments.
- Validation lives in Mongoose schemas plus route-level checks; the frontend validation is only for quick feedback.
- One consistent response envelope, so the frontend has a single way to read data and show errors.
- Future upgrades: password/OTP auth, role-based access, doctor schedule conflicts, pagination.
