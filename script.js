// =====================
// GLOBAL STATE
// =====================
let currentView = 'front';
let uploadedImage = null;
let originalTshirtImageFront = null;
let originalTshirtImageBack = null;

// Drag and resize state
let isDragging = false;
let isResizing = false;
let currentElement = null;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let offsetX = 0;
let offsetY = 0;

// =====================
// INITIALIZATION
// =====================
document.addEventListener('DOMContentLoaded', () => {
  initializeDesigner();
  setupDragAndResize();
});

function initializeDesigner() {
  updateText();
  updateTextColor();
  updateFontSize();
  updateFontFamily();
  updateTshirtColor();
}

// =====================
// DRAG AND RESIZE SETUP
// =====================
function setupDragAndResize() {
  // Mouse events
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  
  // Touch events for mobile
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
}

function makeElementDraggable(element) {
  element.style.position = 'absolute';
  element.style.cursor = 'move';
  element.style.userSelect = 'none';
  element.classList.add('draggable-element');
  
  // Add resize handle
  if (!element.querySelector('.resize-handle')) {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.innerHTML = '⤡';
    element.appendChild(resizeHandle);
  }
}

function handleMouseDown(e) {
  const target = e.target;
  
  // Check if clicking on resize handle
  if (target.classList.contains('resize-handle')) {
    isResizing = true;
    currentElement = target.parentElement;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = currentElement.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
    
    e.preventDefault();
    return;
  }
  
  // Check if clicking on draggable element
  if (target.classList.contains('canvas-design-text') || 
      target.classList.contains('canvas-design-image') ||
      target.classList.contains('draggable-element')) {
    isDragging = true;
    currentElement = target;
    
    const rect = currentElement.getBoundingClientRect();
    const parent = currentElement.parentElement.getBoundingClientRect();
    
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    currentElement.style.zIndex = '100';
    e.preventDefault();
  }
}

function handleMouseMove(e) {
  if (isDragging && currentElement) {
    const parent = currentElement.parentElement.getBoundingClientRect();
    
    let newX = e.clientX - parent.left - offsetX;
    let newY = e.clientY - parent.top - offsetY;
    
    // Constrain to parent bounds
    const rect = currentElement.getBoundingClientRect();
    newX = Math.max(0, Math.min(newX, parent.width - rect.width));
    newY = Math.max(0, Math.min(newY, parent.height - rect.height));
    
    currentElement.style.left = newX + 'px';
    currentElement.style.top = newY + 'px';
    
  } else if (isResizing && currentElement) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // Calculate new dimensions (maintain aspect ratio for images)
    let newWidth = startWidth + deltaX;
    let newHeight = startHeight + deltaY;
    
    // Set minimum size
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(30, newHeight);
    
    if (currentElement.classList.contains('canvas-design-image')) {
      const img = currentElement;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      newHeight = newWidth / aspectRatio;
    }
    
    currentElement.style.width = newWidth + 'px';
    if (currentElement.classList.contains('canvas-design-text')) {
      currentElement.style.height = newHeight + 'px';
    }
    
    e.preventDefault();
  }
}

function handleMouseUp() {
  if (currentElement) {
    currentElement.style.zIndex = '10';
  }
  isDragging = false;
  isResizing = false;
  currentElement = null;
}

// Touch event handlers
function handleTouchStart(e) {
  if (e.touches.length !== 1) return;
  
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  
  if (target.classList.contains('resize-handle')) {
    isResizing = true;
    currentElement = target.parentElement;
    startX = touch.clientX;
    startY = touch.clientY;
    
    const rect = currentElement.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
    
    e.preventDefault();
    return;
  }
  
  if (target.classList.contains('canvas-design-text') || 
      target.classList.contains('canvas-design-image') ||
      target.classList.contains('draggable-element')) {
    isDragging = true;
    currentElement = target;
    
    const rect = currentElement.getBoundingClientRect();
    offsetX = touch.clientX - rect.left;
    offsetY = touch.clientY - rect.top;
    
    currentElement.style.zIndex = '100';
    e.preventDefault();
  }
}

function handleTouchMove(e) {
  if (e.touches.length !== 1) return;
  
  const touch = e.touches[0];
  
  if (isDragging && currentElement) {
    const parent = currentElement.parentElement.getBoundingClientRect();
    
    let newX = touch.clientX - parent.left - offsetX;
    let newY = touch.clientY - parent.top - offsetY;
    
    const rect = currentElement.getBoundingClientRect();
    newX = Math.max(0, Math.min(newX, parent.width - rect.width));
    newY = Math.max(0, Math.min(newY, parent.height - rect.height));
    
    currentElement.style.left = newX + 'px';
    currentElement.style.top = newY + 'px';
    
    e.preventDefault();
  } else if (isResizing && currentElement) {
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    let newWidth = startWidth + deltaX;
    let newHeight = startHeight + deltaY;
    
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(30, newHeight);
    
    if (currentElement.classList.contains('canvas-design-image')) {
      const img = currentElement;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      newHeight = newWidth / aspectRatio;
    }
    
    currentElement.style.width = newWidth + 'px';
    if (currentElement.classList.contains('canvas-design-text')) {
      currentElement.style.height = newHeight + 'px';
    }
    
    e.preventDefault();
  }
}

function handleTouchEnd() {
  if (currentElement) {
    currentElement.style.zIndex = '10';
  }
  isDragging = false;
  isResizing = false;
  currentElement = null;
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
  const frontText = document.getElementById('front-text');
  const backText = document.getElementById('back-text');
  
  frontText.innerText = text;
  backText.innerText = text;
  
  // Make draggable if not already
  makeElementDraggable(frontText);
  makeElementDraggable(backText);
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
    const element = document.getElementById(id);
    element.style.fontSize = `${size}px`;
    // Auto adjust height for text
    element.style.height = 'auto';
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
      const placeholder = '<div style="color:#999;font-size:18px;pointer-events:none;">Upload an image</div>';
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
    Swal.fire({
      icon: 'error',
      title: 'Invalid File',
      text: 'Please upload an image file (PNG, JPG, etc.)',
      confirmButtonText: 'OK'
    });
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: 'error',
      title: 'File Too Large',
      text: 'Image size should be less than 5MB',
      confirmButtonText: 'OK'
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    uploadedImage = e.target.result;
    const frontOverlay = document.getElementById('front-overlay');
    const backOverlay = document.getElementById('back-overlay');
    const imgHTML = `<img src="${uploadedImage}" class="canvas-design-image draggable-element" id="front-image" alt="Design">`;
    const imgHTMLBack = `<img src="${uploadedImage}" class="canvas-design-image draggable-element" id="back-image" alt="Design">`;

    frontOverlay.innerHTML = imgHTML;
    backOverlay.innerHTML = imgHTMLBack;
    
    // Make images draggable after they load
    setTimeout(() => {
      const frontImg = document.getElementById('front-image');
      const backImg = document.getElementById('back-image');
      if (frontImg) makeElementDraggable(frontImg);
      if (backImg) makeElementDraggable(backImg);
    }, 100);
  };
  reader.onerror = () => {
    Swal.fire({
      icon: 'error',
      title: 'Upload Failed',
      text: 'Error reading file. Please try again.',
      confirmButtonText: 'OK'
    });
  };
  reader.readAsDataURL(file);
}

// =====================
// ADVANCED IMAGE COLOR EDITING
// =====================
function changeImageColor(hexColor) {
  if (!uploadedImage) {
    Swal.fire({
      icon: 'warning',
      title: 'No Image',
      text: 'Please upload an image first!',
      confirmButtonText: 'OK'
    });
    return;
  }

  const img = new Image();
  img.src = uploadedImage;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const rTarget = parseInt(hexColor.slice(1, 3), 16);
    const gTarget = parseInt(hexColor.slice(3, 5), 16);
    const bTarget = parseInt(hexColor.slice(5, 7), 16);

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;

      data[i] = (data[i] * 0.5 + rTarget * 0.5);
      data[i + 1] = (data[i + 1] * 0.5 + gTarget * 0.5);
      data[i + 2] = (data[i + 2] * 0.5 + bTarget * 0.5);
    }

    ctx.putImageData(imageData, 0, 0);
    const newImageURL = canvas.toDataURL();

    const frontOverlay = document.getElementById("front-overlay");
    const backOverlay = document.getElementById("back-overlay");
    const imgHTML = `<img src="${newImageURL}" class="canvas-design-image draggable-element" id="front-image" alt="Edited Image">`;
    const imgHTMLBack = `<img src="${newImageURL}" class="canvas-design-image draggable-element" id="back-image" alt="Edited Image">`;

    frontOverlay.innerHTML = imgHTML;
    backOverlay.innerHTML = imgHTMLBack;
    
    setTimeout(() => {
      const frontImg = document.getElementById('front-image');
      const backImg = document.getElementById('back-image');
      if (frontImg) makeElementDraggable(frontImg);
      if (backImg) makeElementDraggable(backImg);
    }, 100);
  };
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
  const preview = document.getElementById('tshirt-color-preview');

  preview.innerText = color.toUpperCase();

  if (!originalTshirtImageFront) originalTshirtImageFront = frontBase.src;
  if (!originalTshirtImageBack) originalTshirtImageBack = backBase.src;

  recolorTshirt(frontBase, originalTshirtImageFront, color);
  recolorTshirt(backBase, originalTshirtImageBack, color);
}

function recolorTshirt(imgElement, originalSrc, hexColor) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = originalSrc;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const rTarget = parseInt(hexColor.slice(1, 3), 16);
    const gTarget = parseInt(hexColor.slice(3, 5), 16);
    const bTarget = parseInt(hexColor.slice(5, 7), 16);

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 80) continue;

      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      const brightness = gray / 255;

      data[i] = rTarget * brightness;
      data[i + 1] = gTarget * brightness;
      data[i + 2] = bTarget * brightness;
    }

    ctx.putImageData(imageData, 0, 0);
    imgElement.src = canvas.toDataURL("image/png");
  };
}

// =====================
// RESET DESIGN
// =====================
async function resetDesign() {
  const result = await Swal.fire({
    title: 'Reset Design?',
    text: 'This will clear all your current design changes.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, reset it!',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

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

  Swal.fire({
    icon: 'success',
    title: 'Design Reset!',
    text: 'Your design has been reset to default.',
    timer: 2000,
    showConfirmButton: false
  });
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
      <div style="text-align: left;">
        <p><strong>Design Type:</strong> Text</p>
        <p><strong>Text:</strong> "${text}"</p>
        <p><strong>Text Color:</strong> ${textColor}</p>
        <p><strong>Font Size:</strong> ${fontSize}px</p>
        <p><strong>Font Family:</strong> ${fontFamily}</p>
        <p><strong>T-Shirt Color:</strong> ${tshirtColor}</p>
      </div>
    `;
  } else {
    designDetails = `
      <div style="text-align: left;">
        <p><strong>Design Type:</strong> Image Upload</p>
        <p><strong>Image:</strong> ${uploadedImage ? 'Uploaded' : 'Not uploaded'}</p>
        <p><strong>T-Shirt Color:</strong> ${tshirtColor}</p>
      </div>
    `;
  }

  Swal.fire({
    title: 'Ready to Order?',
    html: designDetails,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Proceed to Checkout',
    cancelButtonText: 'Continue Editing',
    confirmButtonColor: '#045490'
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: 'success',
        title: 'Proceeding to Checkout',
        text: 'Redirecting you to checkout...',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        if (typeof proceedToCheckout === 'function') {
          proceedToCheckout();
        }
      });
    }
  });
}

// =====================
// KEYBOARD SHORTCUTS
// =====================
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    resetDesign();
  }

  if (e.key === 'Tab' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    switchView(currentView === 'front' ? 'back' : 'front');
  }
});

// Hamburger Menu Toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
  });
});