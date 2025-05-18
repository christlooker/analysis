document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('imageInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please choose an image.');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  const resultDiv = document.getElementById('result');
  const canvas = document.getElementById('overlayCanvas');
  const ctx = canvas.getContext('2d');

  resultDiv.textContent = 'Analyzing...';

  try {
    const res = await fetch('https://ratingyou-analysis-api.onrender.com/analyze', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      resultDiv.textContent = `Error: ${errorData.error || 'Unknown error'}`;
      return;
    }

    const data = await res.json();

    resultDiv.innerHTML = `
      <strong>Beauty Score:</strong> ${data.beauty_score}/100<br/>
      <strong>Eye Distance:</strong> ${data.eye_distance.toFixed(4)}<br/>
      <strong>Ideal Eye Distance:</strong> ${data.ideal_eye_distance}
    `;

    const imageURL = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const left = data.landmarks.left_eye;
      const right = data.landmarks.right_eye;

      if (left && right) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(left[0], left[1]);
        ctx.lineTo(right[0], right[1]);
        ctx.stroke();
      }

      URL.revokeObjectURL(imageURL);
    };

    img.src = imageURL;

  } catch (err) {
    console.error('Catch error:', err);
    resultDiv.textContent = 'Something went wrong.';
  }
});
