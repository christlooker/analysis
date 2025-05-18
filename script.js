const imageInput = document.getElementById('imageInput');
const fileLabel = document.getElementById('fileLabel');
const resultDiv = document.getElementById('result');
const imgElement = document.getElementById('uploadedImage');
const canvas = document.getElementById('overlayCanvas');
const ctx = canvas.getContext('2d');

imageInput.addEventListener('change', () => {
  if (imageInput.files.length > 0) {
    fileLabel.classList.add('uploaded');
    fileLabel.textContent = 'Uploaded';
  }
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = imageInput.files[0];
  if (!file) {
    resultDiv.innerHTML = 'Please select an image before analyzing.';
    return;
  }

  // Reset button state
  fileLabel.classList.remove('uploaded');
  fileLabel.textContent = 'Choose Image';

  const formData = new FormData();
  formData.append('image', file);
  resultDiv.innerHTML = 'Analyzing...';

  try {
    const res = await fetch('https://ratingyou-analysis-api.onrender.com/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.error) {
      resultDiv.innerHTML = `Error: ${data.error}`;
      return;
    }

    resultDiv.innerHTML = `
      <p><strong>Beauty Score:</strong> ${data.beauty_score}/100</p>
      <p><strong>Eye Distance:</strong> ${data.eye_distance.toFixed(4)}</p>
    `;

    // Draw the image and measurements
    imgElement.onload = () => {
  canvas.width = imgElement.width;
  canvas.height = imgElement.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgElement, 0, 0);

  if (data.measurements && data.measurements.length > 0) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    data.measurements.forEach(pair => {
      const startX = pair[0][0] * canvas.width;
      const startY = pair[0][1] * canvas.height;
      const endX = pair[1][0] * canvas.width;
      const endY = pair[1][1] * canvas.height;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });
  }
};
