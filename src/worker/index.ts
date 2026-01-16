import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono<{ Bindings: Env }>();

// Middleware: ensure teachers table exists on first request
app.use("*", async (c, next) => {
  try {
    // Run once per worker instance
    if (!((globalThis as unknown) as { __teachers_migrated?: boolean }).__teachers_migrated) {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS teachers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          profile_photo_url TEXT,
          subjects TEXT,
          yearly_goals TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      try {
        await c.env.DB.prepare(
          "CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name)"
        ).run();
      } catch {
        // Some SQLite engines may not support IF NOT EXISTS on CREATE INDEX; ignore errors
      }

      ((globalThis as unknown) as { __teachers_migrated?: boolean }).__teachers_migrated = true;
    }
  } catch (err) {
    console.error("Migration check failed:", err);
  }

  await next();
});

// API Routes

// Get all classes
app.get("/api/classes", async (c) => {
  const classes = await c.env.DB.prepare(
    "SELECT * FROM classes ORDER BY created_at DESC"
  ).all();
  return c.json(classes.results);
});

// Get class with students, activities and grades
app.get("/api/classes/:id", async (c) => {
  const classId = c.req.param("id");
  
  const classData = await c.env.DB.prepare(
    "SELECT * FROM classes WHERE id = ?"
  ).bind(classId).first();
  
  if (!classData) {
    return c.json({ error: "Class not found" }, 404);
  }
  
  const students = await c.env.DB.prepare(
    "SELECT * FROM students WHERE class_id = ? ORDER BY number, name"
  ).bind(classId).all();
  
  const activities = await c.env.DB.prepare(
    "SELECT * FROM activities WHERE class_id = ? ORDER BY order_index, name"
  ).bind(classId).all();
  
  const grades = await c.env.DB.prepare(
    "SELECT * FROM grades WHERE activity_id IN (SELECT id FROM activities WHERE class_id = ?)"
  ).bind(classId).all();
  
  return c.json({
    class: classData,
    students: students.results,
    activities: activities.results,
    grades: grades.results,
  });
});

// Create new class
app.post(
  "/api/classes",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      school_year: z.string().optional(),
    })
  ),
  async (c) => {
    const { name, school_year } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "INSERT INTO classes (name, school_year) VALUES (?, ?) RETURNING *"
    ).bind(name, school_year || null).first();
    
    return c.json(result);
  }
);

// Add student to class
app.post(
  "/api/students",
  zValidator(
    "json",
    z.object({
      class_id: z.number(),
      name: z.string(),
      status: z.string(),
      number: z.number().optional(),
      phone: z.string().optional(),
      profile_photo_url: z.string().optional(),
      life_project: z.string().optional(),
      youth_club_semester_1: z.string().optional(),
      youth_club_semester_2: z.string().optional(),
      elective_semester_1: z.string().optional(),
      elective_semester_2: z.string().optional(),
      tutor_teacher: z.string().optional(),
      guardian_1: z.string().optional(),
      guardian_2: z.string().optional(),
    })
  ),
  async (c) => {
    const data = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      `INSERT INTO students (
        class_id, name, status, number, phone, profile_photo_url, life_project,
        youth_club_semester_1, youth_club_semester_2, elective_semester_1,
        elective_semester_2, tutor_teacher, guardian_1, guardian_2
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(
      data.class_id, data.name, data.status, data.number || null,
      data.phone || null, data.profile_photo_url || null, data.life_project || null,
      data.youth_club_semester_1 || null, data.youth_club_semester_2 || null,
      data.elective_semester_1 || null, data.elective_semester_2 || null,
      data.tutor_teacher || null, data.guardian_1 || null, data.guardian_2 || null
    ).first();
    
    return c.json(result);
  }
);

// Update student
app.put(
  "/api/students/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      status: z.string().optional(),
      number: z.number().optional(),
      phone: z.string().optional(),
      profile_photo_url: z.string().optional(),
      life_project: z.string().optional(),
      youth_club_semester_1: z.string().optional(),
      youth_club_semester_2: z.string().optional(),
      elective_semester_1: z.string().optional(),
      elective_semester_2: z.string().optional(),
      tutor_teacher: z.string().optional(),
      guardian_1: z.string().optional(),
      guardian_2: z.string().optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates = [];
    const values = [];
    
    const fieldMap = {
      name: "name",
      status: "status",
      number: "number",
      phone: "phone",
      profile_photo_url: "profile_photo_url",
      life_project: "life_project",
      youth_club_semester_1: "youth_club_semester_1",
      youth_club_semester_2: "youth_club_semester_2",
      elective_semester_1: "elective_semester_1",
      elective_semester_2: "elective_semester_2",
      tutor_teacher: "tutor_teacher",
      guardian_1: "guardian_1",
      guardian_2: "guardian_2",
    };
    
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key as keyof typeof data] !== undefined) {
        updates.push(`${column} = ?`);
        values.push(data[key as keyof typeof data]);
      }
    }
    
    values.push(id);
    
    await c.env.DB.prepare(
      `UPDATE students SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(...values).run();
    
    const result = await c.env.DB.prepare(
      "SELECT * FROM students WHERE id = ?"
    ).bind(id).first();
    
    return c.json(result);
  }
);

// Delete student
app.delete("/api/students/:id", async (c) => {
  const id = c.req.param("id");
  
  await c.env.DB.prepare("DELETE FROM grades WHERE student_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM students WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Add activity to class
app.post(
  "/api/activities",
  zValidator(
    "json",
    z.object({
      class_id: z.number(),
      name: z.string(),
      max_score: z.number(),
      weight: z.number().optional(),
      order_index: z.number().optional(),
    })
  ),
  async (c) => {
    const { class_id, name, max_score, weight, order_index } = c.req.valid("json");
    
    const result = await c.env.DB.prepare(
      "INSERT INTO activities (class_id, name, max_score, weight, order_index) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).bind(class_id, name, max_score, weight || 1, order_index || null).first();
    
    return c.json(result);
  }
);

// Update activity
app.put(
  "/api/activities/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      max_score: z.number().optional(),
      weight: z.number().optional(),
      order_index: z.number().optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates = [];
    const values = [];
    
    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.max_score !== undefined) {
      updates.push("max_score = ?");
      values.push(data.max_score);
    }
    if (data.weight !== undefined) {
      updates.push("weight = ?");
      values.push(data.weight);
    }
    if (data.order_index !== undefined) {
      updates.push("order_index = ?");
      values.push(data.order_index);
    }
    
    values.push(id);
    
    await c.env.DB.prepare(
      `UPDATE activities SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(...values).run();
    
    const result = await c.env.DB.prepare(
      "SELECT * FROM activities WHERE id = ?"
    ).bind(id).first();
    
    return c.json(result);
  }
);

// Delete activity
app.delete("/api/activities/:id", async (c) => {
  const id = c.req.param("id");
  
  await c.env.DB.prepare("DELETE FROM grades WHERE activity_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM activities WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Set or update grade
app.post(
  "/api/grades",
  zValidator(
    "json",
    z.object({
      student_id: z.number(),
      activity_id: z.number(),
      score: z.number().nullable(),
    })
  ),
  async (c) => {
    const { student_id, activity_id, score } = c.req.valid("json");
    
    const existing = await c.env.DB.prepare(
      "SELECT id FROM grades WHERE student_id = ? AND activity_id = ?"
    ).bind(student_id, activity_id).first();
    
    let result;
    if (existing) {
      await c.env.DB.prepare(
        "UPDATE grades SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(score, existing.id).run();
      
      result = await c.env.DB.prepare(
        "SELECT * FROM grades WHERE id = ?"
      ).bind(existing.id).first();
    } else {
      result = await c.env.DB.prepare(
        "INSERT INTO grades (student_id, activity_id, score) VALUES (?, ?, ?) RETURNING *"
      ).bind(student_id, activity_id, score).first();
    }
    
    return c.json(result);
  }
);

// Upload profile photo
app.post("/api/students/:id/photo", async (c) => {
  const id = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("photo") as File;
  
  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }
  
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Invalid file type. Only images are allowed." }, 400);
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "File too large. Maximum size is 5MB." }, 400);
  }
  
  const extension = file.name.split(".").pop() || "jpg";
  const key = `students/${id}/profile.${extension}`;
  
  // Upload to R2
  await c.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });
  
  const photoUrl = `/api/files/${key}`;
  
  // Update student record
  await c.env.DB.prepare(
    "UPDATE students SET profile_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(photoUrl, id).run();
  
  return c.json({ url: photoUrl });
});

// Teachers endpoints
// Get all teachers
app.get("/api/teachers", async (c) => {
  const res = await c.env.DB.prepare("SELECT * FROM teachers ORDER BY name").all();
  const teachers = res.results.map((t: unknown) => {
    const row = t as Record<string, unknown>;
    const subjects = typeof row.subjects === "string" ? JSON.parse(String(row.subjects)) : [];
    const yearly_goals = typeof row.yearly_goals === "string" ? JSON.parse(String(row.yearly_goals)) : [];
    return {
      id: row.id !== undefined ? Number(row.id) : undefined,
      name: row.name !== undefined ? String(row.name) : undefined,
      email: row.email !== undefined ? String(row.email) : null,
      phone: row.phone !== undefined ? String(row.phone) : null,
      profile_photo_url: row.profile_photo_url !== undefined ? String(row.profile_photo_url) : null,
      subjects,
      yearly_goals,
      created_at: row.created_at !== undefined ? String(row.created_at) : undefined,
      updated_at: row.updated_at !== undefined ? String(row.updated_at) : undefined,
    };
  });

  return c.json(teachers);
});

// Create teacher
app.post(
  "/api/teachers",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      subjects: z.array(z.string()).optional(),
      yearly_goals: z.array(z.string()).optional(),
    })
  ),
  async (c) => {
    const data = c.req.valid("json");

    const result = await c.env.DB.prepare(
      "INSERT INTO teachers (name, email, phone, profile_photo_url, subjects, yearly_goals) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(
      data.name,
      data.email || null,
      data.phone || null,
      null,
      JSON.stringify(data.subjects || []),
      JSON.stringify(data.yearly_goals || [])
    ).first();

    const tRow = result as Record<string, unknown>;
    const t = {
      id: tRow.id !== undefined ? Number(tRow.id) : undefined,
      name: tRow.name !== undefined ? String(tRow.name) : undefined,
      email: tRow.email !== undefined ? String(tRow.email) : null,
      phone: tRow.phone !== undefined ? String(tRow.phone) : null,
      profile_photo_url: tRow.profile_photo_url !== undefined ? String(tRow.profile_photo_url) : null,
      subjects: typeof tRow.subjects === "string" ? JSON.parse(String(tRow.subjects)) : [],
      yearly_goals: typeof tRow.yearly_goals === "string" ? JSON.parse(String(tRow.yearly_goals)) : [],
      created_at: tRow.created_at !== undefined ? String(tRow.created_at) : undefined,
      updated_at: tRow.updated_at !== undefined ? String(tRow.updated_at) : undefined,
    };

    return c.json(t);
  }
);

// Update teacher
app.put(
  "/api/teachers/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      subjects: z.array(z.string()).optional(),
      yearly_goals: z.array(z.string()).optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push("email = ?");
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push("phone = ?");
      values.push(data.phone);
    }
    if (data.subjects !== undefined) {
      updates.push("subjects = ?");
      values.push(JSON.stringify(data.subjects || []));
    }
    if (data.yearly_goals !== undefined) {
      updates.push("yearly_goals = ?");
      values.push(JSON.stringify(data.yearly_goals || []));
    }

    values.push(id);

    if (updates.length > 0) {
      await c.env.DB.prepare(
        `UPDATE teachers SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(...values).run();
    }

    const result = await c.env.DB.prepare("SELECT * FROM teachers WHERE id = ?").bind(id).first();
    if (!result) return c.json({ error: "Teacher not found" }, 404);

    const tRow = result as Record<string, unknown>;
    const t = {
      id: tRow.id !== undefined ? Number(tRow.id) : undefined,
      name: tRow.name !== undefined ? String(tRow.name) : undefined,
      email: tRow.email !== undefined ? String(tRow.email) : null,
      phone: tRow.phone !== undefined ? String(tRow.phone) : null,
      profile_photo_url: tRow.profile_photo_url !== undefined ? String(tRow.profile_photo_url) : null,
      subjects: typeof tRow.subjects === "string" ? JSON.parse(String(tRow.subjects)) : [],
      yearly_goals: typeof tRow.yearly_goals === "string" ? JSON.parse(String(tRow.yearly_goals)) : [],
      created_at: tRow.created_at !== undefined ? String(tRow.created_at) : undefined,
      updated_at: tRow.updated_at !== undefined ? String(tRow.updated_at) : undefined,
    };

    return c.json(t);
  }
);

// Delete teacher
app.delete("/api/teachers/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM teachers WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Upload teacher photo
app.post("/api/teachers/:id/photo", async (c) => {
  const id = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("photo") as File;

  if (!file) return c.json({ error: "No file provided" }, 400);

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) return c.json({ error: "Invalid file type. Only images are allowed." }, 400);

  if (file.size > 5 * 1024 * 1024) return c.json({ error: "File too large. Maximum size is 5MB." }, 400);

  const extension = file.name.split(".").pop() || "jpg";
  const key = `teachers/${id}/profile.${extension}`;

  await c.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const photoUrl = `/api/files/${key}`;

  await c.env.DB.prepare(
    "UPDATE teachers SET profile_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(photoUrl, id).run();

  return c.json({ url: photoUrl });
});

// Internal endpoint: force re-run of teachers migration
// Requires header `x-migration-secret` matching `MIGRATION_SECRET` binding
app.post("/internal/migrate", async (c) => {
  const secret = c.req.header("x-migration-secret");
  if (!c.env.MIGRATION_SECRET || !secret || secret !== c.env.MIGRATION_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Drop and recreate table to force migration
    await c.env.DB.prepare("DROP TABLE IF EXISTS teachers").run();

    await c.env.DB.prepare(`
      CREATE TABLE teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        profile_photo_url TEXT,
        subjects TEXT,
        yearly_goals TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    try {
      await c.env.DB.prepare("CREATE INDEX idx_teachers_name ON teachers(name)").run();
    } catch {
      // ignore index creation errors
    }

    ((globalThis as unknown) as { __teachers_migrated?: boolean }).__teachers_migrated = true;
    return c.json({ success: true });
  } catch (err) {
    console.error("Migration force failed:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Internal endpoint: simulate migration without dropping data (safe mode)
// Requires header `x-migration-secret` matching `MIGRATION_SECRET` binding
app.post("/internal/migrate-safe", async (c) => {
  const secret = c.req.header("x-migration-secret");
  if (!c.env.MIGRATION_SECRET || !secret || secret !== c.env.MIGRATION_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Check if teachers table exists
    const tbl = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='teachers'").all();
    const tableExists = (tbl.results && tbl.results.length > 0) || false;

    let columns: unknown[] = [];
    let indexExists = false;
    if (tableExists) {
      const colsRes = await c.env.DB.prepare("PRAGMA table_info(teachers)").all();
      columns = colsRes.results || [];

      const idxRes = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_teachers_name'").all();
      indexExists = !!(idxRes.results && idxRes.results.length > 0);
    }

    // Define desired schema
    const desiredColumns = [
      { name: "id", type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
      { name: "name", type: "TEXT NOT NULL" },
      { name: "email", type: "TEXT" },
      { name: "phone", type: "TEXT" },
      { name: "profile_photo_url", type: "TEXT" },
      { name: "subjects", type: "TEXT" },
      { name: "yearly_goals", type: "TEXT" },
      { name: "created_at", type: "DATETIME DEFAULT CURRENT_TIMESTAMP" },
      { name: "updated_at", type: "DATETIME DEFAULT CURRENT_TIMESTAMP" },
    ];

    const existingNames = columns.map((c) => String((c as Record<string, unknown>).name));
    const missingColumns = desiredColumns.filter((col) => !existingNames.includes(col.name)).map((c) => c.name);

    const suggestedSql: string[] = [];
    if (!tableExists) {
      suggestedSql.push(`CREATE TABLE teachers (\n  ${desiredColumns.map(d => `${d.name} ${d.type}`).join(',\n  ')}\n);`);
      suggestedSql.push("CREATE INDEX idx_teachers_name ON teachers(name);");
    } else {
      for (const col of desiredColumns) {
        if (!existingNames.includes(col.name) && col.name !== "id") {
          // SQLite supports ADD COLUMN for simple cases
          suggestedSql.push(`ALTER TABLE teachers ADD COLUMN ${col.name} ${col.type};`);
        }
      }
      if (!indexExists) {
        suggestedSql.push("CREATE INDEX idx_teachers_name ON teachers(name);");
      }
    }

    return c.json({
      tableExists,
      columns,
      missingColumns,
      suggestedSql,
    });
  } catch (err) {
    console.error("Safe migration check failed:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Get file from R2
app.get("/api/files/*", async (c) => {
  const key = c.req.path.replace("/api/files/", "");
  
  const object = await c.env.R2_BUCKET.get(key);
  
  if (!object) {
    return c.json({ error: "File not found" }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag ?? "");
  headers.set("cache-control", "public, max-age=31536000");

  return c.body(object.body ?? "", { headers });
});

export default app;
