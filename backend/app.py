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

        # Example dummy measurements scaled to image dimensions
        measurements = [
            # horizontal line near top (e.g., eyes)
            [[int(0.2 * width), int(0.3 * height)], [int(0.8 * width), int(0.3 * height)]],
            # vertical line down middle (e.g., nose bridge)
            [[int(0.5 * width), int(0.2 * height)], [int(0.5 * width), int(0.7 * height)]]
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
