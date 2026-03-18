import sqlite3
import bcrypt
import uuid
from datetime import datetime

DB_PATH = r"d:\school-erp-system-main\school-erp-system-main\prisma\dev.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')

# ---------- Super Admin ----------
super_email = "admin@global.com"
super_pwd   = bcrypt.hashpw(b"admin123", bcrypt.gensalt(rounds=10)).decode()

cur.execute("SELECT id FROM User WHERE email = ?", (super_email,))
row = cur.fetchone()
if row:
    cur.execute("UPDATE User SET password = ?, updatedAt = ? WHERE email = ?",
                (super_pwd, now, super_email))
    print(f"✅ Super Admin updated: {super_email}")
else:
    cur.execute(
        "INSERT INTO User (id, email, password, name, role, schoolId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), super_email, super_pwd, "Super Admin", "SUPER_ADMIN", None, now, now)
    )
    print(f"✅ Super Admin created: {super_email}")

# ---------- Demo School ----------
school_id   = "demo-school-id"
school_name = "Demo International School"

cur.execute("SELECT id FROM School WHERE id = ?", (school_id,))
row = cur.fetchone()
if not row:
    cur.execute(
        "INSERT INTO School (id, name, address, isActive, createdAt, updatedAt) VALUES (?,?,?,?,?,?)",
        (school_id, school_name, "123 Education Lane", 1, now, now)
    )
    print(f"✅ School created: {school_name}")
else:
    print(f"ℹ️  School already exists: {school_name}")

# ---------- School Admin ----------
school_admin_email = "admin@demo.school"
school_admin_pwd   = bcrypt.hashpw(b"school123", bcrypt.gensalt(rounds=10)).decode()

cur.execute("SELECT id FROM User WHERE email = ?", (school_admin_email,))
row = cur.fetchone()
if row:
    cur.execute("UPDATE User SET password = ?, schoolId = ?, updatedAt = ? WHERE email = ?",
                (school_admin_pwd, school_id, now, school_admin_email))
    print(f"✅ School Admin updated: {school_admin_email}")
else:
    cur.execute(
        "INSERT INTO User (id, email, password, name, role, schoolId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), school_admin_email, school_admin_pwd, "Principal Skinner", "SCHOOL_ADMIN", school_id, now, now)
    )
    print(f"✅ School Admin created: {school_admin_email}")

conn.commit()
conn.close()

print("\n🎉 Done!")
print("   Super Admin:  admin@global.com  / admin123")
print("   School Admin: admin@demo.school / school123")
