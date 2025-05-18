document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const imageInput = document.getElementById('imageInput');
  const file = imageInput.files[0];
  if (!file) {
    alert("Please select an image file.");
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  const resultsDiv = document.getElementById('results');
  const canvas = document.getElementById('analyzedCanvas');
  const ctx = canvas.getContext('2d');

  resultsDiv.innerHTML = "Analyzing...";
  canvas.style.display = 'none';

  try {
    const res = await fetch('https://ratingyou-analysis-api.onrender.com/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.error) {
      resultsDiv.innerHTML = `Error: ${data.error}`;
      return;
    }

    if (!data.image) {
      resultsDiv.innerHTML = 'Error: No image returned.';
      return;
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.style.display = 'block';
      ctx.drawImage(img, 0, 0);

      if (data.measurements && Array.isArray(data.measurements)) {
        ctx.lineWidth = 2;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        data.measurements.forEach((m) => {
          const [x1, y1] = m.start;
          const [x2, y2] = m.end;

          // Draw line
          ctx.strokeStyle = 'red';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Midpoint for label
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const text = `${m.value.toFixed(2)} px`;

          // Text background
          const textWidth = ctx.measureText(text).width;
          const padding = 4;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(midX - textWidth / 2 - padding, midY - 8, textWidth + padding * 2, 16);

          // Text
          ctx.fillStyle = 'white';
          ctx.fillText(text, midX, midY);
        });
      }
    };

    img.src = 'data:image/jpeg;base64,' + data.image;

    // Show ratios/results
    resultsDiv.innerHTML = '';
    if (Array.isArray(data.ratios)) {
      data.ratios.forEach((r) => {
        const p = document.createElement('p');
        p.innerHTML = `
          <span class="measurement">${r.name}:</span> 
          ${r.value.toFixed(2)} 
          <span class="ideal" style="color: #999;">(ideal: ${r.ideal})</span>
        `;
        resultsDiv.appendChild(p);
      });
    }

  } catch (err) {
    console.error("Catch error:", err);
    resultsDiv.innerHTML = 'Something went wrong.';
  }
});
