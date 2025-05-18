document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('imageInput');
  if (!fileInput.files[0]) {
    alert('Please select an image.');
    return;
  }

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
    console.log('API response data:', data);

    resultDiv.innerHTML = `
      <strong>Beauty Score:</strong> ${data.beauty_score}/100<br/>
      <strong>Eye Distance:</strong> ${data.eye_distance.toFixed(4)}<br/>
      <strong>Ideal Eye Distance:</strong> ${data.ideal_eye_distance}
    `;

    const imgElement = document.getElementById('uploadedImage');
    const canvas = document.getElementById('overlayCanvas');
    const ctx = canvas.getContext('2d');

    const imgURL = URL.createObjectURL(file);
    console.log('Created Object URL:', imgURL);

    imgElement.src = imgURL;

    imgElement.onload = () => {
      console.log('Image loaded:', imgElement.naturalWidth, imgElement.naturalHeight);

      if (imgElement.naturalWidth === 0 || imgElement.naturalHeight === 0) {
        console.error('Image has zero natural width or height!');
        resultDiv.textContent = 'Failed to load image dimensions.';
        return;
      }

      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgElement, 0, 0);

      const leftEye = data.landmarks.left_eye;
      const rightEye = data.landmarks.right_eye;

      console.log('Drawing line from', leftEye, 'to', rightEye);

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftEye[0], leftEye[1]);
      ctx.lineTo(rightEye[0], rightEye[1]);
      ctx.stroke();

      URL.revokeObjectURL(imgURL);
    };

    imgElement.onerror = () => {
      console.error('Image failed to load!');
      resultDiv.textContent = 'Image failed to load.';
    };

  } catch (err) {
    console.error('Catch error:', err);
    resultDiv.textContent = 'Something went wrong.';
  }
});
