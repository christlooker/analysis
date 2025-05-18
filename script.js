const imageInput = document.getElementById('fileInput');
const fileLabel = document.getElementById('fileLabel');
const uploadForm = document.getElementById('uploadForm');
const resultDiv = document.getElementById('result');
const imgElement = document.getElementById('uploadedImage');
const canvas = document.getElementById('overlayCanvas');
const ctx = canvas.getContext('2d');

imageInput.addEventListener('change', () => {
  if (imageInput.files.length > 0) {
    fileLabel.classList.add('uploaded');
    fileLabel.textContent = 'Uploaded';
  } else {
    fileLabel.classList.remove('uploaded');
    fileLabel.textContent = 'Choose Image';
  }
});

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = imageInput.files[0];
  if (!file) {
    resultDiv.textContent = 'Please choose an image before analyzing.';
    return;
  }

  // Reset UI
  fileLabel.classList.remove('uploaded');
  fileLabel.textContent = 'Choose Image';
  resultDiv.textContent = 'Analyzing...';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('https://ratingyou-analysis-api.onrender.com/analyze', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.error) {
      resultDiv.textContent = `Error: ${data.error}`;
      return;
    }

    // Show scores
    resultDiv.innerHTML = `
      <p><strong>Beauty Score:</strong> ${data.beauty_score}/100</p>
      <p><strong>Eye Distance:</strong> ${data.eye_distance.toFixed(4)}</p>
    `;

    // Display image and draw lines
    imgElement.src = URL.createObjectURL(file);
    imgElement.onload = () => {
      // Resize canvas to image
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      canvas.style.width = imgElement.width + 'px';
      canvas.style.height = imgElement.height + 'px';

      // Draw image on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgElement, 0, 0);

      // Draw red lines if measurements exist
      if (data.measurements && Array.isArray(data.measurements)) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        data.measurements.forEach(pair => {
          const [start, end] = pair;
          ctx.beginPath();
          ctx.moveTo(start[0], start[1]);
          ctx.lineTo(end[0], end[1]);
          ctx.stroke();
        });
      }
    };
  } catch (err) {
    resultDiv.textContent = 'Something went wrong: ' + err.message;
    console.error(err);
  }
});
