# Server (sessions API)

Small Express server that stores session objects (JSON) in sessions.json and validates incoming payloads with Ajv.

## Requirements
- Node.js >= 18
- npm

## Install
Open a terminal in the project folder:
Windows:
  npm install

## Run
Start server:
  node server.js

Development with nodemon (if installed globally):
  nodemon server.js

The server listens on PORT environment variable or defaults to 5001:
  set PORT=5001
  node server.js

CORS default origin: http://localhost:5173

## Files
- server.js — main Express app
- sessions.json — persisted sessions array (created if missing)
- package.json / package-lock.json — dependencies

## API (brief)
Base URL: http://localhost:5001

- POST /session
  - Validate payload against internal JSON Schema (Ajv).
  - On success: 201 { success: true, message: "Session saved", id: <new id> }
  - On validation failure: 400 { success: false, errors: [...] }
  - Example (Windows PowerShell):
      curl -X POST http://localhost:5001/session -H "Content-Type: application/json" -d @payload.json

- GET /session
  - No query: returns list summary:
    { success: true, count, data: [ session_data ... ], pagination: {...} }
  - With ?id=<number>: returns full session object with that id or 404.

- GET /session/raw
  - Returns raw in-memory stored array.

- DELETE /session
  - Deletes all sessions and removes sessions.json file.

## Notes
- Incoming payloads are validated with Ajv (strict: false, coerceTypes: true). Validation errors are returned in the response.
- sessions.json is expected to be an array of session objects. If the file contains a single session object the server wraps it into an array on load.
- Node engine requirements derive from dependencies (Express v5, body-parser v2) — use Node >= 18.
- If you want convenience start scripts, add to package.json:
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js"
    }

## Troubleshooting
- Port already in use: set PORT to a free port.
- sessions.json corrupt: delete or move it and restart the server to recreate an empty sessions store.
- Validation failures: inspect `errors` returned from POST to see missing/invalid fields.

## License
ISC