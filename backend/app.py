from flask import Flask, request, jsonify
from flask_cors import CORS
import mediapipe as mp
import cv2
import numpy as np
import base64
from PIL import Image
import math

app = Flask(__name__)
CORS(app)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

# Helper Functions
def calculate_distance(point1, point2):
    return np.linalg.norm(np.array(point1) - np.array(point2))

def calculate_angle(a, b, c):
    ab = np.array(a) - np.array(b)
    cb = np.array(c) - np.array(b)
    cosine_angle = np.dot(ab, cb) / (np.linalg.norm(ab) * np.linalg.norm(cb))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def draw_line_with_label(image, pt1, pt2, label):
    pt1 = tuple(map(int, pt1))
    pt2 = tuple(map(int, pt2))
    mid_pt = ((pt1[0]+pt2[0])//2, (pt1[1]+pt2[1])//2)
    cv2.line(image, pt1, pt2, (0, 0, 255), 2)
    text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)[0]
    text_x = mid_pt[0] - text_size[0] // 2
    text_y = mid_pt[1] + text_size[1] // 2
    cv2.rectangle(image, (text_x - 2, text_y - text_size[1]), (text_x + text_size[0] + 2, text_y + 4), (255, 255, 255), -1)
    cv2.putText(image, label, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)

def get_point(landmarks, idx, image_shape):
    h, w = image_shape
    return int(landmarks[idx].x * w), int(landmarks[idx].y * h)

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    image = Image.open(file.stream).convert('RGB')
    image_np = np.array(image)
    results = face_mesh.process(image_np)

    if not results.multi_face_landmarks:
        return jsonify({'error': 'No face detected'}), 400

    annotated_image = image_np.copy()
    landmarks = results.multi_face_landmarks[0].landmark
    h, w, _ = annotated_image.shape

    # Points - example subset, add more as needed
    points = {
        'hairline': get_point(landmarks, 10, (h, w)),
        'chin': get_point(landmarks, 152, (h, w)),
        'nasion': get_point(landmarks, 6, (h, w)),
        'upper_lip': get_point(landmarks, 13, (h, w)),
        'lower_lip': get_point(landmarks, 14, (h, w)),
        'lip_center': get_point(landmarks, 0, (h, w)),
        'left_cheek': get_point(landmarks, 234, (h, w)),
        'right_cheek': get_point(landmarks, 454, (h, w)),
        'nose_base': get_point(landmarks, 2, (h, w)),
        'mouth_left': get_point(landmarks, 61, (h, w)),
        'mouth_right': get_point(landmarks, 291, (h, w)),
        'eye_left_inner': get_point(landmarks, 133, (h, w)),
        'eye_right_inner': get_point(landmarks, 362, (h, w)),
    }

    results_dict = {}

    # Example measurement: Facial width to height ratio
    width = calculate_distance(points['left_cheek'], points['right_cheek'])
    height = calculate_distance(points['nasion'], points['chin'])
    facial_ratio = width / height if height != 0 else 0
    results_dict['Facial Width/Height'] = round(facial_ratio, 2)
    draw_line_with_label(annotated_image, points['left_cheek'], points['right_cheek'], f"{int(width)} px")
    draw_line_with_label(annotated_image, points['nasion'], points['chin'], f"{int(height)} px")

    # Add your other measurements here...

    # IMPORTANT FIX: Convert RGB (PIL) to BGR (OpenCV) before encoding
    annotated_image = cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR)

    success, buffer = cv2.imencode('.jpg', annotated_image)
    if not success:
        return jsonify({'error': 'Image encoding failed'}), 500

    image_base64 = base64.b64encode(buffer).decode('utf-8')

    return jsonify({
        'results': results_dict,
        'image': image_base64
    })

if __name__ == '__main__':
    app.run(debug=True)
