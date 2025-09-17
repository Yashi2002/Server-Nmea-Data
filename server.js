// index.js
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const Ajv = require("ajv").default;
const addFormats = require("ajv-formats");
const cors = require("cors");
const DATA_FILE = path.join(__dirname, "sessions.json");
const PORT = process.env.PORT || 5001;

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));



// --- JSON Schema (from your message) ---
const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Generated schema for Root",
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        session_data: {
          type: "object",
          properties: {
            id: { type: "number" },
            user_id: { type: "number" },
            name: { type: "string" },
            notes: { type: "string" },
            created_at: { type: "string" },
            session_start: { type: "string" },
            session_end: { type: "string" },
            updated_at: { type: "string" },
            deleted_at: { type: "string" },
          },
          required: [
            "id",
            "user_id",
            "name",
            "notes",
            "created_at",
            "updated_at",
            "deleted_at",
          ],
        },
        vdr_logs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              session_id: { type: "number" },
              vdr_logs_id: { type: "number" },
              raw_sentence: { type: "string" },
              talker: { type: "string" },
              sentence_type: { type: "string" },
              timestamp: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              speed_over_ground: { type: "number" },
              course_over_ground: { type: "number" },
              heading_true: { type: "number" },
              water_speed_kmh: { type: "number" },
              depth_meters: {},
              rudder_angle_starboard: {},
              rate_of_turn: {},
              created_at: { type: "string" },
              updated_at: {},
              deleted_at: {},
            },
            required: [
              "id",
              "session_id",
              "vdr_logs_id",
              "raw_sentence",
              "talker",
              "sentence_type",
              "timestamp",
              "depth_meters",
              "rudder_angle_starboard",
              "rate_of_turn",
              "created_at",
              "updated_at",
              "deleted_at",
            ],
          },
        },
        session_ownship: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              session_id: { type: "number" },
              vdr_log_id: { type: "number" },
              nmea_sentence_id: { type: "number" },
              name: { type: "string" },
              imo: { type: "string" },
              mmsi: { type: "string" },
              heading_true: { type: "number" },
              speed_over_ground: { type: "number" },
              rate_of_turn: { type: "number" },
              revolution_per_min: { type: "number" },
              rudder_angle_starboard: { type: "number" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              is_ownership: { type: "boolean" },
              timestamp: { type: "string" },
              created_at: { type: "string" },
              updated_at: {},
              deleted_at: {},
            },
            required: [
              "id",
              "session_id",
              "vdr_log_id",
              "nmea_sentence_id",
              "name",
              "imo",
              "mmsi",
              "heading_true",
              "speed_over_ground",
              "rate_of_turn",
              "revolution_per_min",
              "rudder_angle_starboard",
              "latitude",
              "longitude",
              "is_ownership",
              "timestamp",
              "created_at",
              "updated_at",
              "deleted_at",
            ],
          },
        },
        session_ownship_conning: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              session_id: { type: "number" },
              vdr_log_id: { type: "number" },
              nmea_sentence_id: { type: "number" },
              name: { type: "string" },
              imo: { type: "number" },
              mmsi: { type: "string" },
              heading_true: { type: "number" },
              speed_over_ground: { type: "number" },
              revolution_per_min: { type: "number" },
              rudder_angle_starboard: { type: "number" },
              created_at: { type: "string" },
              updated_at: {},
              deleted_at: {},
            },
            required: [
              "id",
              "session_id",
              "vdr_log_id",
              "nmea_sentence_id",
              "name",
              "imo",
              "mmsi",
              "heading_true",
              "speed_over_ground",
              "revolution_per_min",
              "rudder_angle_starboard",
              "created_at",
              "updated_at",
              "deleted_at",
            ],
          },
        },
        session_ownship_telemetry: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              session_id: { type: "number" },
              vdr_log_id: { type: "number" },
              nmea_sentence_id: { type: "number" },
              name: { type: "string" },
              imo: { type: "string" },
              mmsi: { type: "string" },
              heading_true: { type: "number" },
              speed_over_ground: { type: "number" },
              rate_of_turn: { type: "number" },
              revolution_per_min: { type: "number" },
              rudder_angle_starboard: { type: "number" },
              course_over_ground: { type: "number" },
              water_speed_kmh: { type: "number" },
              depth_meters: { type: "number" },
              is_ownership: { type: "boolean" },
              timestamp: { type: "string" },
              created_at: { type: "string" },
              updated_at: {},
              deleted_at: {},
            },
            required: [
              "id",
              "session_id",
              "vdr_log_id",
              "nmea_sentence_id",
              "name",
              "imo",
              "mmsi",
              "heading_true",
              "speed_over_ground",
              "rate_of_turn",
              "revolution_per_min",
              "rudder_angle_starboard",
              "course_over_ground",
              "water_speed_kmh",
              "depth_meters",
              "is_ownership",
              "timestamp",
              "created_at",
              "updated_at",
              "deleted_at",
            ],
          },
        },
        session_ships_ais: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              session_id: { type: "number" },
              vdr_log_id: { type: "number" },
              nmea_sentence_id: { type: "number" },
              name: { type: "string" },
              imo: { type: "string" },
              mmsi: { type: "string" },
              heading_true: { type: "number" },
              speed_over_ground: { type: "number" },
              rate_of_turn: { type: "number" },
              revolution_per_min: { type: "number" },
              rudder_angle_starboard: { type: "number" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              is_ownership: { type: "boolean" },
              timestamp: { type: "string" },
              created_at: { type: "string" },
              updated_at: {},
              deleted_at: {},
            },
            required: [
              "id",
              "session_id",
              "vdr_log_id",
              "nmea_sentence_id",
              "name",
              "imo",
              "mmsi",
              "heading_true",
              "speed_over_ground",
              "rate_of_turn",
              "revolution_per_min",
              "rudder_angle_starboard",
              "latitude",
              "longitude",
              "is_ownership",
              "created_at",
              "updated_at",
              "deleted_at",
            ],
          },
        },
session_ownship_active_vessels: {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "number" },
      session_id: { type: "number" },
      name: { type: "string" },
      imo: { type: "string" },
      mmsi: { type: "string" },
      is_ownership: { type: "boolean" },
      track: {
        type: "array",
        items: {
          type: "object",
          properties: {
            vdr_log_id: { type: "number" },
            nmea_sentence_id: { type: "number" },
            speed_over_ground: { type: "number" },
            course_over_ground: { type: "number" },
            status: { type: "number" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            timestamp: { type: "string" },
            created_at: { type: "string" },
            updated_at: {},
            deleted_at: {}
          },
          required: [
            "vdr_log_id",
            "nmea_sentence_id",
            "speed_over_ground",
            "course_over_ground",
            "status",
            "latitude",
            "longitude",
            "timestamp",
            "created_at"
          ]
        }
      }
    },
    required: ["id", "session_id", "name", "imo", "mmsi", "is_ownership", "track"]
  }
},

        session_ships: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  session_id: { type: "number" },
                  vdr_log_id: { type: "number" },
                  nmea_sentence_id: { type: "number" },
                  name: { type: "string" },
                  imo: { type: "string" },
                  mmsi: { type: "string" },
                  is_ownership: { type: "boolean" },
                  created_at: { type: "string" },
                  updated_at: {},
                  deleted_at: {},
                },
                required: [
                  "id",
                  "session_id",
                  "vdr_log_id",
                  "nmea_sentence_id",
                  "name",
                  "imo",
                  "mmsi",
                  "is_ownership",
                  "created_at",
                  "updated_at",
                  "deleted_at",
                ],
              },
            },
            count: { type: "number" },
          },
          required: ["data", "count"],
        },
        session_alarm: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              session_id: { type: "number" },
              vdr_log_id: { type: "number" },
              nmea_sentence_id: { type: "number" },
              alert_id: { type: "string" },
              description: { type: "string" },
              timestamp: { type: "string" },
              created_at: { type: "string" },
              updated_at: {},
              deleted_at: {},
            },
            required: [
              "id",
              "session_id",
              "vdr_log_id",
              "nmea_sentence_id",
              "alert_id",
              "description",
              "timestamp",
              "created_at",
              "updated_at",
              "deleted_at",
            ],
          },
        },
        session_cpa_tcpa: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              session_id: { type: "number" },
              vdr_log_id: { type: "number" },
              name: { type: "string" },
              cpa_distance: { type: "number" },
              tcpa: { type: "string" },
              timestamp: { type: "string" },
              risk_level: { type: "string" },
            },
            required: [
              "id",
              "session_id",
              "vdr_log_id",
              "name",
              "cpa_distance",
              "tcpa",
              "timestamp",
              "risk_level",
            ],
          },
        },
        start_time: { type: "string" },
        end_time: { type: "string" },
        duration_seconds: { type: "number" },
        duration_human: { type: "string" },
      },
      required: [
        "session_data",
        "vdr_logs",
        "session_ownship",
        "session_ownship_conning",
        "session_ownship_telemetry",
        "session_ships_ais",
        "session_ships",
  "session_ownship_active_vessels",
        "session_alarm",
        "session_cpa_tcpa",
        "start_time",
        "end_time",
        "duration_seconds",
        "duration_human",
      ],
    },
  },
  required: ["success", "data"],
};
// --- end schema ---

// Ajv validator
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  coerceTypes: true, // <-- this will convert "12.5" to 12.5
});
addFormats(ajv);
const validate = ajv.compile(schema);

// In-memory storage (loaded from file at startup)
let sessions = [];

async function loadFromFile() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      sessions = parsed;
      console.log(`Loaded ${sessions.length} session(s) from file (array format).`);
    } else if (parsed && typeof parsed === "object" && parsed.data) {
      // File contains a single session object (your current sample). Wrap it.
      sessions = [parsed];
      console.log("Loaded 1 session from file (single object wrapped into array).");
    } else {
      console.warn("sessions.json format not recognized. Starting with empty list.");
      sessions = [];
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn("sessions.json not found. Starting with empty list.");
    } else {
      console.error("Failed to load sessions.json:", err);
    }
    sessions = [];
  }
}

async function saveToFile() {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(sessions, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write sessions.json:", err);
  }
}

// Load at startup
loadFromFile().catch(console.error);

// POST endpoint to save a session
app.post("/session", async (req, res) => {
  try {
    const payload = req.body;
    const valid = validate(payload);
    if (!valid) {
      return res.status(400).json({ success: false, errors: validate.errors });
    }

    const maxExistingId = sessions.reduce((max, s) => Math.max(max, s?.data?.session_data?.id || 0), 0);
    const newId = maxExistingId + 1;
    if (payload?.data?.session_data) {
      payload.data.session_data.id = newId;
    }

    sessions.push(payload);
    await saveToFile();
    return res.status(201).json({ success: true, message: "Session saved", id: newId });
  } catch (err) {
    console.error("POST /session failed:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// GET /session (list or detail)
app.get("/session", (req, res) => {
  try {
    const { id } = req.query;

    if (id) {
      const numericId = parseInt(id, 10);
      const session = sessions.find(s => s?.data?.session_data?.id === numericId);
      if (!session) return res.status(404).json({ success: false, message: "Session not found" });
      return res.json(session); // full detailed schema
    }

    const list = sessions.map(s => s.data.session_data);
    return res.json({
      success: true,
      count: list.length,
      data: list,
      pagination: {
        current_page: 1,
        per_page: list.length,
        total: list.length,
      },
    });
  } catch (err) {
    console.error("GET /session failed:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get the raw in-memory sessions array
app.get("/session/raw", (req, res) => {
  return res.json({ success: true, count: sessions.length, data: sessions });
});

// optional: delete
app.delete("/session", async (req, res) => {
  try {
    sessions = [];
    await fs.unlink(DATA_FILE).catch(() => {});
    return res.json({ success: true, message: "Deleted all stored sessions" });
  } catch (err) {
    console.error("DELETE /session failed:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
