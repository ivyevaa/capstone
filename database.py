import sqlite3

DB_NAME = "trait_tracker.db"

def get_db_connection():
    """Establishes connection with SQLite database."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables for storing survey answers and ML analytics results."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS survey_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            raw_responses TEXT NOT NULL, 
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prediction_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            openness REAL NOT NULL,
            conscientiousness REAL NOT NULL,
            extraversion REAL NOT NULL,
            agreeableness REAL NOT NULL,
            neuroticism REAL NOT NULL,
            career_guidance TEXT NOT NULL,
            personal_development TEXT NOT NULL,
            calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("[INFO] Database initialized. Ready to process traits.")

def save_survey_response(user_id, raw_responses_str):
    """Saves the raw string of user survey answers."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO survey_responses (user_id, raw_responses) VALUES (?, ?)",
        (user_id, raw_responses_str)
    )
    conn.commit()
    conn.close()

def save_prediction_results(user_id, o, c, e, a, n, career_txt, personal_txt):
    """Stores continuous OCEAN percentage scores and analytical summaries."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO prediction_results 
           (user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism, career_guidance, personal_development) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (user_id, o, c, e, a, n, career_txt, personal_txt)
    )
    conn.commit()
    conn.close()

def get_latest_prediction(user_id):
    """Fetches the newest test record to populate the user dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM prediction_results WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 1",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# ==========================================
# NEW: SUPERVISOR/ADMIN ANALYTICS FUNCTIONS
# ==========================================

def get_all_user_results():
    """Fetches every personality test log recorded in the system for the Admin table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism, calculated_at FROM prediction_results ORDER BY calculated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_platform_averages():
    """Uses native SQL aggregation to compute the average scores across all users for graphing."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            AVG(openness) as avg_o, 
            AVG(conscientiousness) as avg_c, 
            AVG(extraversion) as avg_e, 
            AVG(agreeableness) as avg_a, 
            AVG(neuroticism) as avg_n,
            COUNT(*) as total_users
        FROM prediction_results
    """)
    row = cursor.fetchone()
    conn.close()
    
    if row and row['total_users'] > 0:
        return {
            "total_submissions": row['total_users'],
            "averages": {
                "openness": round(row['avg_o'], 2),
                "conscientiousness": round(row['avg_c'], 2),
                "extraversion": round(row['avg_e'], 2),
                "agreeableness": round(row['avg_a'], 2),
                "neuroticism": round(row['avg_n'], 2)
            }
        }
    return {"total_submissions": 0, "averages": {"openness": 0, "conscientiousness": 0, "extraversion": 0, "agreeableness": 0, "neuroticism": 0}}