from flask import Flask, request, jsonify
from PIL import Image
import io
import numpy as np

app = Flask(__name__)

# Dummy function to simulate landmark detection — replace with your actual model
def detect_landmarks(image_bytes):
    # Example landmark coordinates in (x, y) format
    # Coordinates should be scaled to image size
    # For demonstration, these are just placeholders
    landmarks = {
        "left_cheek": (100, 300),
        "right_cheek": (300, 300),
        "middle_eyebrow": (200, 100),
        "upper_lip": (200, 250),
        "nasion": (200, 130),
        "chin_bottom": (200, 400),
        "hairline": (200, 50)
    }
    return landmarks

def distance(a, b):
    return ((a[0]-b[0])**2 + (a[1]-b[1])**2)**0.5

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    image_bytes = file.read()

    # Optional: validate image, convert if needed
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        return jsonify({"error": "Invalid image file"}), 400

    # Detect landmarks (replace with your real detection)
    landmarks = detect_landmarks(image_bytes)

    # Calculate fWHR: bizygomatic width / eyebrow to upper lip height
    bizygomatic_width = distance(landmarks["left_cheek"], landmarks["right_cheek"])
    eyebrow_to_lip_height = distance(landmarks["middle_eyebrow"], landmarks["upper_lip"])
    fWHR = round(bizygomatic_width / eyebrow_to_lip_height, 3) if eyebrow_to_lip_height != 0 else 0

    # Calculate lower/full face ratio: (nasion to chin) / (hairline to chin)
    lower_face_height = distance(landmarks["nasion"], landmarks["chin_bottom"])
    full_face_height = distance(landmarks["hairline"], landmarks["chin_bottom"])
    lower_full_face_ratio = round(lower_face_height / full_face_height, 3) if full_face_height != 0 else 0

    response = {
        "landmarks": landmarks,
        "fWHR": fWHR,
        "ideal_fWHR": 1.8,
        "lower_full_face_ratio": lower_full_face_ratio,
        "ideal_lower_full_face_ratio": 0.62
    }

    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
