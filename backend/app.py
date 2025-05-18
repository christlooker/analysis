from flask import Flask, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)

@app.route('/analyze', methods=['POST'])
def analyze():
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image provided'}), 400

    img_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

    results = face_mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    if not results.multi_face_landmarks:
        return jsonify({'error': 'No face detected'}), 400

    landmarks = results.multi_face_landmarks[0].landmark

    def euclidean(p1, p2):
        return ((p1.x - p2.x)**2 + (p1.y - p2.y)**2)**0.5

    left_eye = landmarks[33]
    right_eye = landmarks[263]
    eye_distance = euclidean(left_eye, right_eye)

    beauty_score = 100 - abs(eye_distance - 0.35) * 100

    return jsonify({
        'eye_distance': eye_distance,
        'beauty_score': round(beauty_score, 2)
    })

if __name__ == '__main__':
    app.run()
