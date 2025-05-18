document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('imageInput');
  if (!fileInput.files[0]) return alert('Please select an image.');

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('image', file);

  const resultDiv = document.getElementById('result');
  resultDiv.textContent = 'Analyzing...';

  try {
    const res = await fetch('https://ratingyou-analysis-api.onrender.com/analyze', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      resultDiv.textContent = `Error: ${errData.error || 'Unknown error'}`;
      return;
    }

    const data = await res.json();

    // Show results text
    resultDiv.innerHTML = `
      <strong>Beauty Score:</strong> ${data.beauty_score}/100<br/>
      <strong>Eye Distance:</strong> ${data.eye_distance.toFixed(4)}<br/>
      <strong>Ideal Eye Distance:</strong> ${data.ideal_eye_distance}
    `;

    // Load the uploaded image
    const imgElement = document.getElementById('uploadedImage');
    const canvas = document.getElementById('overlayCanvas');
    const ctx = canvas.getContext('2d');

    const imgURL = URL.createObjectURL(file);
    imgElement.src = imgURL;

    imgElement.onload = () => {
      // Set canvas size to match image size
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;

      // Draw the image on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgElement, 0, 0);

      // Draw red line(s) between landmarks
      const leftEye = data.landmarks.left_eye;
      const rightEye = data.landmarks.right_eye;

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftEye[0], leftEye[1]);
      ctx.lineTo(rightEye[0], rightEye[1]);
      ctx.stroke();

      // Clean up object URL to avoid memory leaks
      URL.revokeObjectURL(imgURL);
    };

  } catch (err) {
    console.error(err);
    resultDiv.textContent = 'Something went wrong.';
  }
});
