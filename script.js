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

      // Fully opaque red lines
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;

      // Bold 12px font for text
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Helper function to draw lines with measurement label and background box
      function drawLineWithLabel(start, end) {
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();

        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;
        const distance = Math.hypot(end[0] - start[0], end[1] - start[1]).toFixed(1);

        const label = `${distance} px`;

        const padding = 2; // smaller padding
        const metrics = ctx.measureText(label);
        const textWidth = metrics.width;
        const textHeight = 12; // approx font height

        // Draw semi-transparent white box behind text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(midX - textWidth / 2 - padding, midY - textHeight / 2 - padding, textWidth + padding * 2, textHeight + padding * 2);

        // Draw red text on top
        ctx.fillStyle = 'red';
        ctx.fillText(label, midX, midY);
      }

      // Draw cheek-to-cheek width line with label
      drawLineWithLabel(left_cheek, right_cheek);

      // Draw eyebrow-to-upper-lip height line with label
      drawLineWithLabel(middle_eyebrow, upper_lip);

      // Show results below image
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
