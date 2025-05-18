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

    const imageURL = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'red';
      ctx.font = '13px Arial';

      // Draw width (cheek-to-cheek)
      ctx.beginPath();
      ctx.moveTo(...left_cheek);
      ctx.lineTo(...right_cheek);
      ctx.stroke();

      const width = Math.hypot(
        right_cheek[0] - left_cheek[0],
        right_cheek[1] - left_cheek[1]
      );
      const midWidthX = (left_cheek[0] + right_cheek[0]) / 2;
      const midWidthY = (left_cheek[1] + right_cheek[1]) / 2;
      ctx.fillText(`${width.toFixed(1)} px`, midWidthX + 10, midWidthY - 10);

      // Draw height (eyebrow to lip)
      ctx.beginPath();
      ctx.moveTo(...middle_eyebrow);
      ctx.lineTo(...upper_lip);
      ctx.stroke();

      const height = Math.hypot(
        middle_eyebrow[0] - upper_lip[0],
        middle_eyebrow[1] - upper_lip[1]
      );
      const midHeightX = (middle_eyebrow[0] + upper_lip[0]) / 2;
      const midHeightY = (middle_eyebrow[1] + upper_lip[1]) / 2;
      ctx.fillText(`${height.toFixed(1)} px`, midHeightX + 10, midHeightY - 10);

      resultDiv.innerHTML = `
        <strong>Facial Width-to-Height Ratio (fWHR):</strong>
        ${fWHR}
        <span class="ideal">(ideal: ${data.ideal_fWHR})</span>
      `;

      URL.revokeObjectURL(imageURL);
    };

    img.src = imageURL;

  } catch (err) {
    console.error('Catch error:', err);
    resultDiv.textContent = 'Something went wrong.';
  }
});
