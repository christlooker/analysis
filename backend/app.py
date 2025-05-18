from flask import Flask, request, jsonify
from PIL import Image
import io

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']

    try:
        img = Image.open(file.stream)
        width, height = img.size

        # Dummy example measurements (lines) scaled to image size
        measurements = [
            [[int(0.2 * width), int(0.3 * height)], [int(0.8 * width), int(0.3 * height)]],  # horizontal line
            [[int(0.5 * width), int(0.2 * height)], [int(0.5 * width), int(0.7 * height)]]   # vertical line
        ]

        response = {
            'beauty_score': 82.7,
            'eye_distance': 0.35,
            'measurements': measurements
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
