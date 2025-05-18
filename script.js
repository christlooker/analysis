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

    console.log('Landmarks received:', data.landmarks);

    // Extract landmarks safely
    const {
      left_cheek,
      right_cheek,
      middle_eyebrow,
      upper_lip,
      nasion,
      chin_bottom,
      hairline
    } = data.landmarks || {};

    const imageURL = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Set line style
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;

      // Set font style for labels
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Helper function to draw lines with measurement labels
      function drawLineWithLabel(start, end) {
        if (!start || !end || start.length < 2 || end.length < 2) {
          console.warn('Invalid points for drawing line:', start, end);
          return;
        }
        ctx.beginPath();
        ctx.moveTo(...start);
        ctx.lineTo(...end);
        ctx.stroke();

        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;
        const distance = Math.hypot(end[0] - start[0], end[1] - start[1]).toFixed(1);

        const label = `${distance} px`;

        const padding = 2;
        const metrics = ctx.measureText(label);
        const textWidth = metrics.width;
        const textHeight = 12;

        // Background box behind text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(midX - textWidth / 2 - padding, midY - textHeight / 2 - padding, textWidth + padding * 2, textHeight + padding * 2);

        // Text in red
        ctx.fillStyle = 'red';
        ctx.fillText(label, midX, midY);
      }

      // Draw all measurement lines if valid:
      if (left_cheek && right_cheek) drawLineWithLabel(left_cheek, right_cheek);
      if (middle_eyebrow && upper_lip) drawLineWithLabel(middle_eyebrow, upper_lip);
      if (nasion && chin_bottom) drawLineWithLabel(nasion, chin_bottom);
      if (hairline && chin_bottom) drawLineWithLabel(hairline, chin_bottom);

      // Show results with ideal values in brackets and different color
      resultDiv.innerHTML = `
        <strong>Facial Width-to-Height Ratio (fWHR):</strong> ${data.fWHR} <span class="ideal">(ideal: ${data.ideal_fWHR})</span><br>
        <strong>Lower/Full Face Ratio:</strong> ${data.lower_full_face_ratio} <span class="ideal">(ideal: ${data.ideal_lower_full_face_ratio})</span>
      `;

      URL.revokeObjectURL(imageURL);
    };

    img.src = imageURL;

  } catch (err) {
    console.error('Catch error:', err);
    resultDiv.textContent = 'Something went wrong.';
  }
});
