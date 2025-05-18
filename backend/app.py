from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp

app = Flask(__name__)
CORS(app)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    image_bytes = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

    if image is None:
        return jsonify({'error': 'Invalid image'}), 400

    h, w, _ = image.shape
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb_image)

    if not result.multi_face_landmarks:
        return jsonify({'error': 'No face detected'}), 400

    landmarks = result.multi_face_landmarks[0].landmark

    def get_point(index):
        x = int(landmarks[index].x * w)
        y = int(landmarks[index].y * h)
        return [x, y]

    # fWHR landmarks
    left_cheek = get_point(234)           # Outer left cheekbone
    right_cheek = get_point(454)          # Outer right cheekbone
    middle_eyebrow = get_point(9)         # Midpoint between eyebrows
    upper_lip = get_point(13)             # Top of upper lip

    # Calculate distances
    width = np.linalg.norm(np.array(left_cheek) - np.array(right_cheek))
    height = np.linalg.norm(np.array(middle_eyebrow) - np.array(upper_lip))

    fWHR = round(width / height, 3) if height != 0 else 0

    return jsonify({
        "landmarks": {
            "left_cheek": left_cheek,
            "right_cheek": right_cheek,
            "middle_eyebrow": middle_eyebrow,
            "upper_lip": upper_lip
        },
        "fWHR": fWHR,
        "ideal_fWHR": "≥ 1.8"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
