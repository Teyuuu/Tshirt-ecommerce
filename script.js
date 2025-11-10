function switchView(view) {
  const frontView = document.getElementById('front-view');
  const backView = document.getElementById('back-view');
  const buttons = document.querySelectorAll('.view-btn');

  buttons.forEach(btn => btn.classList.remove('active'));

  if (view === 'front') {
    frontView.style.display = 'block';
    backView.style.display = 'none';
    buttons[0].classList.add('active');
  } else {
    frontView.style.display = 'none';
    backView.style.display = 'block';
    buttons[1].classList.add('active');
  }
}

function updateText() {
  const text = document.getElementById('design-text').value;
  document.getElementById('front-text').innerText = text;
  document.getElementById('back-text').innerText = text;
}

function updateTextColor() {
  const color = document.getElementById('text-color').value;
  document.getElementById('front-text').style.color = color;
  document.getElementById('back-text').style.color = color;
  document.getElementById('text-color-preview').innerText = color;
}

function updateFontSize() {
  const size = document.getElementById('font-size').value;
  document.getElementById('front-text').style.fontSize = `${size}px`;
  document.getElementById('back-text').style.fontSize = `${size}px`;
  document.getElementById('font-size-value').innerText = size;
}

function updateFontFamily() {
  const font = document.getElementById('font-family').value;
  document.getElementById('front-text').style.fontFamily = font;
  document.getElementById('back-text').style.fontFamily = font;
}

function updateDesignType() {
  const designType = document.getElementById('design-type').value;
  const textControls = document.getElementById('text-controls');
  const imageControls = document.getElementById('image-controls');

  if (designType === 'text') {
    textControls.style.display = 'block';
    imageControls.style.display = 'none';
  } else {
    textControls.style.display = 'none';
    imageControls.style.display = 'block';
  }
}

function handleImageUpload() {
  const fileInput = document.getElementById('image-upload');
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const image = new Image();
    image.src = e.target.result;
    image.classList.add('uploaded-image');
    image.style.maxWidth = '80%';
    image.style.maxHeight = '80%';
    image.style.position = 'absolute';

    // Replace existing image if already uploaded
    const overlay = document.getElementById('front-overlay');
    overlay.innerHTML = '';
    overlay.appendChild(image);
  };
  reader.readAsDataURL(file);
}

function updateTshirtColor() {
  const color = document.getElementById('tshirt-color').value;
  document.getElementById('tshirt-base-front').style.filter = `brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)`;
  document.getElementById('tshirt-base-front').style.backgroundColor = color;
  document.getElementById('tshirt-color-preview').innerText = color;
}

function resetDesign() {
  document.getElementById('design-text').value = 'Your Design';
  document.getElementById('front-text').innerText = 'Your Design';
  document.getElementById('back-text').innerText = 'Back Design';
  document.getElementById('text-color').value = '#000000';
  document.getElementById('font-size').value = 32;
  document.getElementById('font-family').value = 'Arial, sans-serif';
  document.getElementById('tshirt-color').value = '#FFFFFF';
  updateTextColor();
  updateFontSize();
  updateFontFamily();
  updateTshirtColor();
}

function orderNow() {
  alert('Your design has been submitted for order!');
}
