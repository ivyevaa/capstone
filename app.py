import os

from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template_string, send_from_directory
from flask_cors import CORS
from auth import auth_bp, bcrypt, db
import database
import inference 
import insights 

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-only-change-this-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///trait_tracker.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
CORS(app)

database.init_db()
db.init_app(app)
bcrypt.init_app(app)
app.register_blueprint(auth_bp)

with app.app_context():
    db.create_all()

@app.route('/api/submit-survey', methods=['POST'])
def submit_survey():
    data = request.get_json()
    if not data or 'user_id' not in data or 'answers' not in data:
        return jsonify({"status": "error", "message": "Missing user_id or survey answers data structures."}), 400
    
    user_id = data['user_id']
    answers = data['answers']
    
    try:
        openness, conscientiousness, extraversion, agreeableness, neuroticism = inference.predict_personality_traits(answers)
    except ValueError as val_error:
        return jsonify({"status": "error", "message": str(val_error)}), 400
        
    answers_str = ",".join(map(str, answers))
    database.save_survey_response(user_id, answers_str)
    
    career_report = insights.generate_career_guidance(openness, conscientiousness, extraversion, agreeableness, neuroticism)
    personal_report = insights.generate_personal_development(openness, conscientiousness, extraversion, agreeableness, neuroticism)
    
    database.save_prediction_results(
        user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism, 
        career_report, personal_report
    )
    
    return jsonify({
        "status": "success",
        "message": "Survey metrics computed and archived successfully.",
        "results": {
            "openness": openness,
            "conscientiousness": conscientiousness,
            "extraversion": extraversion,
            "agreeableness": agreeableness,
            "neuroticism": neuroticism
        }
    }), 200

@app.route('/api/dashboard/<user_id>', methods=['GET'])
def get_dashboard(user_id):
    prediction = database.get_latest_prediction(user_id)
    if not prediction:
        return jsonify({"status": "error", "message": "No personality records found for this user identifier."}), 404
        
    return jsonify({
        "status": "success",
        "data": {
            "openness": prediction['openness'],
            "conscientiousness": prediction['conscientiousness'],
            "extraversion": prediction['extraversion'],
            "agreeableness": prediction['agreeableness'],
            "neuroticism": prediction['neuroticism'],
            "career_guidance": prediction['career_guidance'],
            "personal_development": prediction['personal_development'],
            "calculated_at": prediction['calculated_at']
        }
    }), 200

@app.route('/api/admin/analytics', methods=['GET'])
def get_admin_analytics():
    stats = database.get_platform_averages()
    all_users = database.get_all_user_results()
    
    return jsonify({
        "status": "success",
        "total_respondents": stats['total_submissions'],
        "chart_data_averages": stats['averages'],  
        "all_user_records": all_users             
    }), 200

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")

@app.route("/", methods=["GET"])
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/assets/<path:filename>", methods=["GET"])
def frontend_assets(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, "assets"), filename)

@app.route("/<page_name>.html", methods=["GET"])
def frontend_pages(page_name):
    return send_from_directory(FRONTEND_DIR, f"{page_name}.html")

# ============================================================
# UPDATED: PREMIUM, MINIMALIST APPLE-STYLE VISUALIZATION
# ============================================================
@app.route('/view-dashboard/<user_id>', methods=['GET'])
def view_dashboard_graph(user_id):
    prediction = database.get_latest_prediction(user_id)
    if not prediction:
        return f"<h1 style='font-family:sans-serif; text-align:center; padding:50px;'>Error: No records found for '{user_id}'.</h1>", 404

    career_html = prediction['career_guidance'].replace('\n\n', '<br><br>')
    personal_html = prediction['personal_development'].replace('\n\n', '<br><br>')

    # Premium Minimalist HTML/CSS Template
    html_template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TraitTracker - Premium Analytics</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            :root {
                --bg-color: #f5f5f7; /* Apple off-white */
                --card-bg: #ffffff;
                --text-main: #1d1d1f;
                --text-muted: #86868b;
                --accent: #0071e3; /* Apple soft blue */
            }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                background-color: var(--bg-color); 
                color: var(--text-main); 
                margin: 0; 
                padding: 50px 20px; 
                -webkit-font-smoothing: antialiased;
            }
            .container { max-width: 1000px; margin: 0 auto; }
            header { text-align: center; margin-bottom: 50px; }
            h1 { font-size: 34px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 8px; }
            .subtitle { color: var(--text-muted); font-size: 15px; }
            
            .card {
                background: var(--card-bg);
                border-radius: 18px;
                padding: 35px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.03);
                margin-bottom: 30px;
            }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start; }
            
            /* Clean Percentage Display */
            .score-row {
                display: flex; justify-content: space-between;
                margin-top: 30px; padding-top: 25px; border-top: 1px solid #e5e5ea;
            }
            .score-item { text-align: center; }
            .score-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
            .score-value { font-size: 22px; font-weight: 600; margin-top: 4px; }
            
            /* Text Formatting */
            h3 { font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px; }
            p { line-height: 1.6; font-size: 15px; color: #333336; margin-bottom: 25px; }
            
            /* Glossary Section */
            .glossary {
                display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;
                font-size: 13px; color: var(--text-muted); line-height: 1.4;
            }
            .glossary strong { color: var(--text-main); display: block; margin-bottom: 4px; font-size: 14px;}
            
            @media (max-width: 768px) {
                .grid { grid-template-columns: 1fr; }
                .glossary { grid-template-columns: 1fr 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>Behavioral Architecture</h1>
                <div class="subtitle">Profile Registry: {{ user_id }} &nbsp;|&nbsp; Analyzed on: {{ calculated_at[:10] }}</div>
            </header>
            
            <div class="grid">
                <div class="card">
                    <canvas id="bigFiveChart" height="250"></canvas>
                    
                    <div class="score-row">
                        <div class="score-item"><div class="score-label">O</div><div class="score-value">{{ int_o }}%</div></div>
                        <div class="score-item"><div class="score-label">C</div><div class="score-value">{{ int_c }}%</div></div>
                        <div class="score-item"><div class="score-label">E</div><div class="score-value">{{ int_e }}%</div></div>
                        <div class="score-item"><div class="score-label">A</div><div class="score-value">{{ int_a }}%</div></div>
                        <div class="score-item"><div class="score-label">N</div><div class="score-value">{{ int_n }}%</div></div>
                    </div>
                </div>
                
                <div class="card" style="background: transparent; box-shadow: none; padding: 0;">
                    <div class="card" style="padding: 25px; margin-bottom: 20px;">
                        <h3>Workplace Alignment</h3>
                        <p style="margin:0;">{{ career_report|safe }}</p>
                    </div>
                    <div class="card" style="padding: 25px; margin-bottom: 0;">
                        <h3>Optimization Blueprint</h3>
                        <p style="margin:0;">{{ personal_report|safe }}</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 20px;">Trait Glossary</h3>
                <div class="glossary">
                    <div><strong>Openness (O)</strong> Imagination, creativity, and willingness to embrace new experiences and ideas.</div>
                    <div><strong>Conscientiousness (C)</strong> Discipline, organization, and a strong sense of goal-directed behavior.</div>
                    <div><strong>Extraversion (E)</strong> Sociability, assertiveness, and the tendency to seek stimulation from others.</div>
                    <div><strong>Agreeableness (A)</strong> Compassion, cooperativeness, and a baseline trust in human nature.</div>
                    <div><strong>Neuroticism (N)</strong> Emotional sensitivity, vulnerability to stress, and baseline volatility.</div>
                </div>
            </div>
        </div>

        <script>
            const ctx = document.getElementById('bigFiveChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar', // Clean horizontal layout
                data: {
                    labels: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
                    datasets: [{
                        label: 'Intensity (%)',
                        data: [{{ int_o }}, {{ int_c }}, {{ int_e }}, {{ int_a }}, {{ int_n }}],
                        backgroundColor: 'rgba(0, 113, 227, 0.15)', // Soft translucent Apple Blue
                        borderColor: 'rgba(0, 113, 227, 0.8)',      // Solid Apple Blue border
                        borderWidth: 1.5,
                        borderRadius: 6, // Smooth rounded corners on the bars
                        barThickness: 28
                    }]
                },
                options: {
                    indexAxis: 'y', // Flips the chart horizontally for easier reading
                    responsive: true,
                    plugins: {
                        legend: { display: false } // Hides the legend for a cleaner look
                    },
                    scales: {
                        x: {
                            min: 0,
                            max: 100,
                            grid: { color: '#f0f0f0' },
                            border: { display: false }
                        },
                        y: {
                            grid: { display: false },
                            border: { display: false }
                        }
                    }
                }
            });
        </script>
    </body>
    </html>
    """
    
    # Pre-calculate integer percentages for clean rendering
    return render_template_string(
        html_template, 
        user_id=user_id,
        int_o=int(prediction['openness'] * 100),
        int_c=int(prediction['conscientiousness'] * 100),
        int_e=int(prediction['extraversion'] * 100),
        int_a=int(prediction['agreeableness'] * 100),
        int_n=int(prediction['neuroticism'] * 100),
        career_report=career_html,
        personal_report=personal_html,
        calculated_at=prediction['calculated_at']
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)
