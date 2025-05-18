img.onload = () => {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;

  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  function drawLineWithLabel(start, end) {
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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(midX - textWidth / 2 - padding, midY - textHeight / 2 - padding, textWidth + padding * 2, textHeight + padding * 2);

    ctx.fillStyle = 'red';
    ctx.fillText(label, midX, midY);
  }

  // Existing lines
  drawLineWithLabel(left_cheek, right_cheek);        // cheek to cheek width
  drawLineWithLabel(middle_eyebrow, upper_lip);      // eyebrow to upper lip height

  // New lines for lower/full face ratio
  drawLineWithLabel(data.landmarks.nasion, data.landmarks.chin_bottom);  // lower face height
  drawLineWithLabel(data.landmarks.hairline, data.landmarks.chin_bottom); // full face height

  // Display all results below the image
  resultDiv.innerHTML = `
    <strong>Facial Width-to-Height Ratio (fWHR):</strong>
    ${data.fWHR} <span class="ideal">(ideal: ${data.ideal_fWHR})</span><br>
    
    <strong>Lower/Full Face Ratio:</strong>
    ${data.lower_full_face_ratio} <span class="ideal">(ideal: ${data.ideal_lower_full_face_ratio})</span>
  `;

  URL.revokeObjectURL(imageURL);
};
