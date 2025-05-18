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

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      resultDiv.innerHTML = `Error: ${data.error}`;
      return;
    }

    // Set the result text
    resultDiv.innerHTML = `
      <p><strong>Beauty Score:</strong> ${data.beauty_score}/100</p>
      <p><strong>Eye Distance:</strong> ${data.eye_distance.toFixed(4)}</p>
    `;

    // Create object URL for the uploaded image
    const imgURL = URL.createObjectURL(file);

    // Set image src and wait for it to load before drawing on canvas
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

      // Release object URL to free memory after drawing
      URL.revokeObjectURL(imgURL);
    };

    imgElement.src = imgURL;

  } catch (err) {
    resultDiv.innerHTML = 'Something went wrong.';
    console.error('Fetch or processing error:', err);
  }
});
