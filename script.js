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

    const { left_cheek, right_cheek, upper_lip, middle_eyebrow } = data.landmarks;
    const fWHR = data.fWHR;

    resultDiv.innerHTML = `
      <strong>Facial Width-to-Height Ratio (fWHR):</strong> ${fWHR} <br/>
      <strong>Ideal:</strong> ${data.ideal_fWHR}
    `;

    const imageURL = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;

      // Draw width line (cheek to cheek)
      ctx.beginPath();
      ctx.moveTo(...left_cheek);
      ctx.lineTo(...right_cheek);
      ctx.stroke();

      // Draw height line (middle eyebrow to upper lip)
      ctx.beginPath();
      ctx.moveTo(...middle_eyebrow);
      ctx.lineTo(...upper_lip);
      ctx.stroke();

      URL.revokeObjectURL(imageURL);
    };

    img.src = imageURL;

  } catch (err) {
    console.error('Catch error:', err);
    resultDiv.textContent = 'Something went wrong.';
  }
});
