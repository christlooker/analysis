document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('imageInput');
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append('image', file);

  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = 'Analyzing...';

  try {
    const res = await fetch('https://ratingyou-analysis-api.onrender.com/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.error) {
      resultDiv.innerHTML = `Error: ${data.error}`;
    } else {
      resultDiv.innerHTML = `
        <p><strong>Beauty Score:</strong> ${data.beauty_score}/100</p>
        <p><strong>Eye Distance:</strong> ${data.eye_distance.toFixed(4)}</p>
      `;
    }
  } catch (err) {
    resultDiv.innerHTML = 'Something went wrong.';
    console.error(err);
  }
});
