# IT Work Tracker (React + Vite)

This app now supports Catalyst Data Store persistence for:
- listing entries
- creating entries
- updating entries
- deleting entries

## 1) Configure table target

Create a `.env` file in the project root with one of the following:

```bash
VITE_CATALYST_TABLE_ID=34645000000021897
# or
VITE_CATALYST_TABLE_NAME=YourTableName
```

## 2) Provide Catalyst app instance

Before rendering the React app, ensure a Catalyst app instance is available as either:
- `window.app`, or
- `window.__CATALYST_APP__`

The Data Store wrapper calls `app.datastore().table(...)` using the configured table id/name.

## 3) Run

```bash
npm install
npm run dev
```

If Catalyst is not configured, the UI automatically falls back to local sample data so the app still runs.
