from flask import Flask, request, jsonify
from PIL import Image

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']

    try:
        img = Image.open(file.stream)
        width, height = img.size

        # Normalized dummy measurements (coordinates 0 to 1)
        measurements = [
            [[0.2, 0.3], [0.8, 0.3]],  # horizontal line
            [[0.5, 0.2], [0.5, 0.7]]   # vertical line
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
