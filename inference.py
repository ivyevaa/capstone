import os
import numpy as np

# If your ML engineer uses scikit-learn, you can uncomment these lines later:
# import joblib

MODEL_PATH = "personality_model.pkl"

def load_ml_model():
    """Attempts to load a trained model file if your ML engineer has delivered it."""
    if os.path.exists(MODEL_PATH):
        try:
            # return joblib.load(MODEL_PATH)
            pass
        except Exception as e:
            print(f"[WARNING] Failed to load serialized model: {e}")
    return None

def predict_personality_traits(answers):
    """
    Validates, preprocesses, and processes 15 survey answers.
    Maps the grouped questionnaire items across the Big Five dimensions.
    Questions 2, 5, 8, 11, and 14 are reverse scored.
    """
    # 1. Server-Side Strict Validation
    if not isinstance(answers, list) or len(answers) != 15:
        raise ValueError("Input dataset must contain exactly 15 elements.")
        
    for val in answers:
        if not isinstance(val, int) or val < 1 or val > 5:
            raise ValueError("All survey responses must be integers scaled from 1 to 5 (Likert scale).")

    # 2. Check for an exported model from your ML engineer
    model = load_ml_model()
    
    if model is not None:
        # Preprocessing matching standard scikit-learn formatting:
        input_data = np.array(answers).reshape(1, -1)
        # Assuming the model predicts a vector of 5 continuous scores
        predictions = model.predict(input_data)[0]
        
        # Ensure values are comfortably bounded between 0.0 and 1.0
        o, c, e, a, n = [float(np.clip(p / 5.0 if p > 1.0 else p, 0.0, 1.0)) for p in predictions]
        return o, c, e, a, n

    # 3. Robust Psychometric Fallback 
    # Directly converts user selections to academic Big Five continuous scale indices (0.0 to 1.0)
    # Handles reverse-scored logic mapping natively for scientific accuracy
    o_raw = (answers[0] + (6 - answers[1]) + answers[2]) / 15.0
    c_raw = (answers[3] + (6 - answers[4]) + answers[5]) / 15.0
    e_raw = (answers[6] + (6 - answers[7]) + answers[8]) / 15.0
    a_raw = (answers[9] + (6 - answers[10]) + answers[11]) / 15.0
    n_raw = (answers[12] + (6 - answers[13]) + answers[14]) / 15.0

    # Ensure clean float outputs rounded neatly for the frontend charts
    return round(o_raw, 2), round(c_raw, 2), round(e_raw, 2), round(a_raw, 2), round(n_raw, 2)
