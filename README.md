# IT Work Tracker (React + Vite)

The app persists entries through a Catalyst backend function (`worksheet_function`) that performs Data Store CRUD.

## 1) Configure backend Data Store table

In `worksheet-backend/functions/worksheet_function/catalyst-config.json`, set one of:

- `CATALYST_TABLE_ID`
- `CATALYST_TABLE_NAME`

The function requires at least one of these values to resolve the target table.

## 2) Backend API contract used by frontend

Frontend calls a single endpoint with JSON body:

- `action: "list"`
- `action: "create", payload: {...}`
- `action: "update", id: "<ROWID>", payload: {...}`
- `action: "delete", id: "<ROWID>"`

Default endpoint in frontend is:

```bash
/server/worksheet_function
```

Override using environment variable in `worksheet/.env` if needed:

```bash
VITE_WORKSHEET_API_URL=https://<your-domain>/server/worksheet_function
```

## 3) Run frontend

```bash
cd worksheet
npm install
npm run dev
```

If backend/API is unreachable, the UI falls back to local sample data.
