from flask import Flask, request, jsonify
from flask_cors import CORS
import mediapipe as mp
import cv2
import numpy as np
import base64
from PIL import Image

app = Flask(__name__)
CORS(app)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

# Helper Functions
def calculate_distance(point1, point2):
    return np.linalg.norm(np.array(point1) - np.array(point2))

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
    h, w, _ = image_np.shape

    results = face_mesh.process(image_np)
    if not results.multi_face_landmarks:
        return jsonify({'error': 'No face detected'}), 400

    landmarks = results.multi_face_landmarks[0].landmark
    annotated_image = image_np.copy()

    # Get relevant points (using correct (h, w))
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

    measurements = []

    # 1. Facial width to height ratio
    width = calculate_distance(points['left_cheek'], points['right_cheek'])
    height = calculate_distance(points['nasion'], points['chin'])
    facial_ratio = width / height if height != 0 else 0
    measurements.append({
        'name': 'Facial Width/Height',
        'value': facial_ratio,
        'ideal': '1.8+',
        'start': points['left_cheek'],
        'end': points['right_cheek'],
        'line_label_1': f"{int(width)} px",
        'start2': points['nasion'],
        'end2': points['chin'],
        'line_label_2': f"{int(height)} px"
    })

    # Draw lines for facial width and height
    draw_line_with_label(annotated_image, points['left_cheek'], points['right_cheek'], f"{int(width)} px")
    draw_line_with_label(annotated_image, points['nasion'], points['chin'], f"{int(height)} px")

    # 2. Midface ratio
    eye_dist = calculate_distance(points['eye_left_inner'], points['eye_right_inner'])
    midface_height = calculate_distance(points['nasion'], points['upper_lip'])
    midface_ratio = eye_dist / midface_height if midface_height != 0 else 0
    measurements.append({
        'name': 'Midface Ratio',
        'value': midface_ratio,
        'ideal': '1.0-1.1',
        'start': points['eye_left_inner'],
        'end': points['eye_right_inner'],
        'line_label_1': f"{int(eye_dist)} px",
        'start2': points['nasion'],
        'end2': points['upper_lip'],
        'line_label_2': f"{int(midface_height)} px"
    })

    draw_line_with_label(annotated_image, points['eye_left_inner'], points['eye_right_inner'], f"{int(eye_dist)} px")
    draw_line_with_label(annotated_image, points['nasion'], points['upper_lip'], f"{int(midface_height)} px")

    # 3. Mouth to Nose ratio
    mouth_width = calculate_distance(points['mouth_left'], points['mouth_right'])
    nose_width = calculate_distance(points['left_cheek'], points['right_cheek']) * 0.4  # approximation
    mouth_nose_ratio = mouth_width / nose_width if nose_width != 0 else 0
    measurements.append({
        'name': 'Mouth/Nose Ratio',
        'value': mouth_nose_ratio,
        'ideal': '1.5-1.62',
        'start': points['mouth_left'],
        'end': points['mouth_right'],
        'line_label_1': f"{int(mouth_width)} px"
    })

    draw_line_with_label(annotated_image, points['mouth_left'], points['mouth_right'], f"{int(mouth_width)} px")

    # Prepare list of measurements for frontend (flatten lines for each measurement)
    lines = []
    for m in measurements:
        # First line
        lines.append({
            'start': m['start'],
            'end': m['end'],
            'value': float(m['value']),
            'label': m.get('line_label_1', '')
        })
        # Optional second line (some ratios use two lines)
        if 'start2' in m and 'end2' in m:
            lines.append({
                'start': m['start2'],
                'end': m['end2'],
                'value': float(m['value']),
                'label': m.get('line_label_2', '')
            })

    # Encode annotated image as base64
    _, buffer = cv2.imencode('.jpg', annotated_image)
    image_base64 = base64.b64encode(buffer).decode('utf-8')

    # Prepare ratios list for frontend
    ratios = []
    for m in measurements:
        ratios.append({
            'name': m['name'],
            'value': m['value'],
            'ideal': m['ideal']
        })

    return jsonify({
        'image': image_base64,
        'measurements': lines,
        'ratios': ratios
    })

if __name__ == '__main__':
    app.run(debug=True)
