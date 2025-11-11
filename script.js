// =====================
// GLOBAL STATE
// =====================
let currentView = 'front';
let uploadedImage = null;

// =====================
// INITIALIZATION
// =====================
document.addEventListener('DOMContentLoaded', () => initializeDesigner());

function initializeDesigner() {
  updateText();
  updateTextColor();
  updateFontSize();
  updateFontFamily();
  updateTshirtColor();
}

// =====================
// VIEW SWITCHING
// =====================
function switchView(view) {
  currentView = view;
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

// =====================
// TEXT CONTROLS
// =====================
function updateText() {
  const text = document.getElementById('design-text').value;
  document.getElementById('front-text').innerText = text;
  document.getElementById('back-text').innerText = text;
}

function updateTextColor() {
  const color = document.getElementById('text-color').value;
  ['front-text', 'back-text'].forEach(id => {
    document.getElementById(id).style.color = color;
  });
  document.getElementById('text-color-preview').innerText = color;
}

function updateFontSize() {
  const size = document.getElementById('font-size').value;
  ['front-text', 'back-text'].forEach(id => {
    document.getElementById(id).style.fontSize = `${size}px`;
  });
  document.getElementById('font-size-value').innerText = size;
}

function updateFontFamily() {
  const font = document.getElementById('font-family').value;
  ['front-text', 'back-text'].forEach(id => {
    document.getElementById(id).style.fontFamily = font;
  });
}

// =====================
// DESIGN TYPE SWITCHING
// =====================
function updateDesignType() {
  const designType = document.getElementById('design-type').value;
  const textControls = document.getElementById('text-controls');
  const imageControls = document.getElementById('image-controls');
  const frontOverlay = document.getElementById('front-overlay');
  const backOverlay = document.getElementById('back-overlay');

  if (designType === 'text') {
    textControls.style.display = 'block';
    imageControls.style.display = 'none';

    frontOverlay.innerHTML = '<div class="canvas-design-text" id="front-text">Your Design</div>';
    backOverlay.innerHTML = '<div class="canvas-design-text" id="back-text">Back Design</div>';

    updateText();
    updateTextColor();
    updateFontSize();
    updateFontFamily();
  } else {
    textControls.style.display = 'none';
    imageControls.style.display = 'block';

    if (!uploadedImage) {
      const placeholder = '<div style="color:#999;font-size:18px;">Upload an image</div>';
      frontOverlay.innerHTML = placeholder;
      backOverlay.innerHTML = placeholder;
    }
  }
}

// =====================
// IMAGE UPLOAD
// =====================
function handleImageUpload() {
  const fileInput = document.getElementById('image-upload');
  const file = fileInput.files[0];
  if (!file) return;

  if (!file.type.match('image.*')) {
    alert('Please upload an image file (PNG, JPG, etc.)');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image size should be less than 5MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    uploadedImage = e.target.result;
    const frontOverlay = document.getElementById('front-overlay');
    const backOverlay = document.getElementById('back-overlay');
    const imgHTML = `<img src="${uploadedImage}" class="canvas-design-image" alt="Design">`;

    frontOverlay.innerHTML = imgHTML;
    backOverlay.innerHTML = imgHTML;
  };
  reader.onerror = () => alert('Error reading file. Please try again.');
  reader.readAsDataURL(file);
}

// =====================
// T-SHIRT COLOR CONTROL
// =====================
function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length == 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length == 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function updateTshirtColor() {
  const color = document.getElementById('tshirt-color').value;
  const frontBase = document.getElementById('tshirt-base-front');
  const backBase = document.getElementById('tshirt-base-back');

  if (color.toLowerCase() === '#ffffff') {
    frontBase.style.filter = 'drop-shadow(0 20px 60px rgba(0,0,0,0.15))';
    backBase.style.filter = 'drop-shadow(0 20px 60px rgba(0,0,0,0.15))';
  } else {
    const hsl = hexToHsl(color);
    const filterStyle = `
      brightness(0)
      invert(1)
      sepia(1)
      saturate(5000%)
      hue-rotate(${hsl.h}deg)
      brightness(${(hsl.l / 100) * 2.5})
      contrast(1.5)
      drop-shadow(0 20px 60px rgba(0,0,0,0.15))
    `;
    frontBase.style.filter = filterStyle;
    backBase.style.filter = filterStyle;
  }

  document.getElementById('tshirt-color-preview').innerText = color.toUpperCase();
}

// =====================
// RESET DESIGN
// =====================
function resetDesign() {
  document.getElementById('design-type').value = 'text';
  updateDesignType();

  document.getElementById('design-text').value = 'Your Design';
  document.getElementById('text-color').value = '#000000';
  document.getElementById('font-size').value = 32;
  document.getElementById('font-family').value = 'Arial, sans-serif';
  document.getElementById('tshirt-color').value = '#FFFFFF';
  document.getElementById('image-upload').value = '';

  uploadedImage = null;

  updateText();
  updateTextColor();
  updateFontSize();
  updateFontFamily();
  updateTshirtColor();
  switchView('front');
}

// =====================
// ORDER SUBMISSION
// =====================
function orderNow() {
  const designType = document.getElementById('design-type').value;
  const tshirtColor = document.getElementById('tshirt-color').value;
  let designDetails = '';

  if (designType === 'text') {
    const text = document.getElementById('design-text').value;
    const textColor = document.getElementById('text-color').value;
    const fontSize = document.getElementById('font-size').value;
    const fontFamily = document.getElementById('font-family').value;
    designDetails = `
Design Type: Text
Text: "${text}"
Text Color: ${textColor}
Font Size: ${fontSize}px
Font Family: ${fontFamily}
T-Shirt Color: ${tshirtColor}
    `;
  } else {
    designDetails = `
Design Type: Image Upload
Image: ${uploadedImage ? 'Uploaded' : 'Not uploaded'}
T-Shirt Color: ${tshirtColor}
    `;
  }

  const orderConfirm = confirm(`Ready to order your custom t-shirt?\n\n${designDetails}\n\nClick OK to proceed to checkout.`);
  if (orderConfirm) {
    alert('Thank you for your order! Redirecting to checkout...');
    // window.location.href = '/checkout';
  }
}

// =====================
// KEYBOARD SHORTCUTS
// =====================
document.addEventListener('keydown', e => {
  // Ctrl/Cmd + Z to reset
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (confirm('Reset all design changes?')) resetDesign();
  }

  // Tab to switch views
  if (e.key === 'Tab' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    switchView(currentView === 'front' ? 'back' : 'front');
  }
});
