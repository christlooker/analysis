from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp

app = Flask(__name__)
CORS(app)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    image_data = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)

    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_image)

    if not results.multi_face_landmarks:
        return jsonify({'error': 'No face detected'}), 400

    landmarks = results.multi_face_landmarks[0].landmark
    h, w, _ = image.shape

    def get_point(idx):
        return (int(landmarks[idx].x * w), int(landmarks[idx].y * h))

    # fWHR points
    left_cheek = get_point(234)
    right_cheek = get_point(454)
    upper_lip = get_point(13)
    middle_eyebrow = get_point(9)

    # Measurements
    width = np.linalg.norm(np.array(left_cheek) - np.array(right_cheek))
    height = np.linalg.norm(np.array(middle_eyebrow) - np.array(upper_lip))
    fWHR = width / height if height != 0 else 0

    return jsonify({
        'landmarks': {
            'left_cheek': left_cheek,
            'right_cheek': right_cheek,
            'upper_lip': upper_lip,
            'middle_eyebrow': middle_eyebrow
        },
        'fWHR': round(fWHR, 3),
        'ideal_fWHR': '≥ 1.8'
    })

if __name__ == '__main__':
    app.run(debug=True)
