const path = require("node:path")
const Database = require("better-sqlite3")

function main() {
  const email = (process.env.USER_EMAIL || "").trim().toLowerCase()
  const role = (process.env.USER_ROLE || "").trim().toUpperCase()
  if (!email || !role) {
    console.error("Missing env vars: USER_EMAIL and USER_ROLE")
    process.exit(1)
  }

  const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "app.db")
  const db = new Database(dbPath)
  const user = db.prepare("select id,email,name,role from users where email = ?").get(email)
  if (!user) {
    console.error("User not found:", email)
    process.exit(1)
  }

  db.prepare("update users set role = ?, updated_at = datetime('now') where email = ?").run(role, email)
  const updated = db.prepare("select id,email,name,role from users where email = ?").get(email)
  console.log("Updated:", updated)
}

main()

