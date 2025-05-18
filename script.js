const imageInput = document.getElementById('imageInput');
const fileLabel = document.getElementById('fileLabel');
const uploadForm = document.getElementById('uploadForm');
const resultDiv = document.getElementById('result');
const imgElement = document.getElementById('uploadedImage');
const canvas = document.getElementById('overlayCanvas');
const ctx = canvas.getContext('2d');

// Handle upload button feedback
imageInput.addEventListener('change', () => {
  if (imageInput.files.length > 0) {
    fileLabel.classList.add('uploaded');
    fileLabel.textContent = 'Uploaded';
  }
});

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = imageInput.files[0];
  if (!file) {
    resultDiv.innerHTML = 'Please choose an image.';
    return;
  }

  // Reset result and UI
  fileLabel.classList.remove('uploaded');
  fileLabel.textContent = 'Choose Image';
  resultDiv.innerHTML = 'Analyzing...';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const formData = new FormData();
  formData.append('image', file);

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

    // Load and draw image
    imgElement.src = URL.createObjectURL(file);
    imgElement.onload = () => {
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      canvas.style.width = imgElement.width + 'px';
      canvas.style.height = imgElement.height + 'px';

      ctx.drawImage(imgElement, 0, 0);

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
    resultDiv.innerHTML = 'Something went wrong.';
    console.error(err);
  }
});
