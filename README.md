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

For production deployments (for example, web client hosting on a custom domain), set
`VITE_WORKSHEET_API_URL` to your deployed function execute URL:

```bash
VITE_WORKSHEET_API_URL=https://<your-catalyst-domain>/server/worksheet_function/execute
```

The client automatically retries with `GET` if `POST` returns HTTP `405`.

If your frontend is hosted on a different domain than the Catalyst function URL,
the browser will block requests unless CORS is enabled for that origin. In that case,
either host frontend and function under the same origin, configure an API proxy on the
frontend host (`/server/*` -> Catalyst), or enable CORS for your frontend origin in
Catalyst API Gateway.

## 3) Run frontend

```bash
cd worksheet
npm install
npm run dev
```

If backend/API is unreachable, the UI falls back to local sample data.
