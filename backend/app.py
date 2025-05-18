from flask import Flask, request, jsonify
from flask_cors import CORS
import mediapipe as mp
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

mp_face_mesh = mp.solutions.face_mesh

@app.route('/')
def home():
    return 'Face Beauty Analyzer API is running!'

@app.route('/test')
def test():
    return 'API is alive!'

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({'error': 'Invalid image'}), 400

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    with mp_face_mesh.FaceMesh(static_image_mode=True) as face_mesh:
        results = face_mesh.process(img_rgb)

        if not results.multi_face_landmarks:
            return jsonify({'error': 'No face detected'}), 400

        landmarks = results.multi_face_landmarks[0].landmark

        height, width, _ = img.shape

        # Example landmarks for eye corners (you can add more)
        left_eye = landmarks[33]
        right_eye = landmarks[263]

        # Convert normalized coords to pixel coords
        left_eye_px = (int(left_eye.x * width), int(left_eye.y * height))
        right_eye_px = (int(right_eye.x * width), int(right_eye.y * height))

        # Calculate eye distance
        def euclidean(p1, p2):
            return ((p1.x - p2.x)**2 + (p1.y - p2.y)**2)**0.5

        eye_distance = euclidean(left_eye, right_eye)
        ideal_distance = 0.35  # example ideal value
        beauty_score = max(0, 100 - abs(eye_distance - ideal_distance) * 100)

        return jsonify({
            'beauty_score': round(beauty_score, 2),
            'eye_distance': round(eye_distance, 4),
            'ideal_eye_distance': ideal_distance,
            'landmarks': {
                'left_eye': left_eye_px,
                'right_eye': right_eye_px
            }
        })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
