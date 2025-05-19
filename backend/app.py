@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    in_memory_file = io.BytesIO()
    file.save(in_memory_file)
    data = np.frombuffer(in_memory_file.getvalue(), dtype=np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)

    results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    if not results.multi_face_landmarks:
        return jsonify({'error': 'No face detected'}), 400

    image_height, image_width = image.shape[:2]
    landmarks = results.multi_face_landmarks[0].landmark

    def get_point(index):
        lm = landmarks[index]
        return [int(lm.x * image_width), int(lm.y * image_height)]

    # Key points
    left_cheek = get_point(234)
    right_cheek = get_point(454)
    middle_eyebrow = get_point(9)
    upper_lip = get_point(13)
    nasion = get_point(168)
    chin_bottom = get_point(152)
    hairline = get_point(10)

    # Measurements
    bizygomatic_width = np.linalg.norm(np.array(left_cheek) - np.array(right_cheek))
    midface_height = np.linalg.norm(np.array(middle_eyebrow) - np.array(upper_lip))
    fWHR = round(bizygomatic_width / midface_height, 2) if midface_height != 0 else None

    try:
    lower_face_height = np.linalg.norm(np.array(nasion) - np.array(chin_bottom))
    full_face_height = np.linalg.norm(np.array(hairline) - np.array(chin_bottom))
    
    if full_face_height > 0:
        lower_full_face_ratio = round(lower_face_height / full_face_height, 2)
    else:
        lower_full_face_ratio = "N/A"
except Exception as e:
    print("Error calculating lower/full face ratio:", e)
    lower_full_face_ratio = "N/A"


    response = {
        'beauty_score': 0,  # placeholder
        'eye_distance': 0,  # placeholder
        'fWHR': fWHR,
        'ideal_fWHR': '1.8+',
        ''lower_full_face_ratio': lower_full_face_ratio,
        'ideal_lower_full_face_ratio': '0.62+',
        'landmarks': {
            'left_cheek': left_cheek,
            'right_cheek': right_cheek,
            'middle_eyebrow': middle_eyebrow,
            'upper_lip': upper_lip,
            'nasion': nasion,
            'chin_bottom': chin_bottom,
            'hairline': hairline
        }
    }

    return jsonify(response)
