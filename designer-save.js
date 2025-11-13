// =====================
// SUPABASE CONFIGURATION
// =====================
const SUPABASE_URL = 'https://yxnrmerxfxnffjvmyoqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bnJtZXJ4ZnhuZmZqdm15b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MDIsImV4cCI6MjA3ODU2NzUwMn0.OtUz7bDP0T6XzCcWPTig0Ivc-cS1F8HMIvPoLVXYsXo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================
// GLOBAL STATE
// =====================
let currentUser = null;
let currentDesignId = null;
let autoSaveInterval = null;

// =====================
// AUTHENTICATION CHECK
// =====================
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // Redirect to auth page
        alert('Please login to use the designer.');
        window.location.href = 'auth.html';
        return false;
    }
    
    currentUser = session.user;
    
    // Check if loading existing design
    const urlParams = new URLSearchParams(window.location.search);
    const designId = urlParams.get('design');
    
    if (designId) {
        await loadDesign(designId);
    } else {
        // Start auto-save for new design
        startAutoSave();
    }
    
    return true;
}

// =====================
// LOAD EXISTING DESIGN
// =====================
async function loadDesign(designId) {
    try {
        const { data: design, error } = await supabase
            .from('designs')
            .select('*')
            .eq('id', designId)
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        if (!design) {
            alert('Design not found.');
            return;
        }
        
        currentDesignId = design.id;
        
        // Restore design state
        document.getElementById('tshirt-color').value = design.tshirt_color;
        document.getElementById('design-type').value = design.design_type;
        
        if (design.design_type === 'text') {
            document.getElementById('design-text').value = design.text_content || 'Your Design';
            document.getElementById('text-color').value = design.text_color || '#000000';
            document.getElementById('font-size').value = design.font_size || 32;
            document.getElementById('font-family').value = design.font_family || 'Arial, sans-serif';
        } else if (design.design_type === 'image' && design.image_url) {
            uploadedImage = design.image_url;
        }
        
        // Apply all settings
        updateDesignType();
        updateTshirtColor();
        updateText();
        updateTextColor();
        updateFontSize();
        updateFontFamily();
        
        if (design.image_url && design.design_type === 'image') {
            const frontOverlay = document.getElementById('front-overlay');
            const backOverlay = document.getElementById('back-overlay');
            frontOverlay.innerHTML = `<img src="${design.image_url}" class="canvas-design-image" alt="Design">`;
            backOverlay.innerHTML = `<img src="${design.image_url}" class="canvas-design-image" alt="Design">`;
        }
        
        // Start auto-save
        startAutoSave();
        
    } catch (error) {
        console.error('Error loading design:', error);
        alert('Failed to load design.');
    }
}

// =====================
// SAVE DESIGN
// =====================
async function saveDesign(showIndicator = true) {
    if (!currentUser) {
        alert('Please login to save your design.');
        return null;
    }
    
    const designType = document.getElementById('design-type').value;
    const tshirtColor = document.getElementById('tshirt-color').value;
    
    let designData = {
        user_id: currentUser.id,
        design_type: designType,
        tshirt_color: tshirtColor,
        design_name: 'T-Shirt Design ' + new Date().toLocaleString()
    };
    
    if (designType === 'text') {
        designData.text_content = document.getElementById('design-text').value;
        designData.text_color = document.getElementById('text-color').value;
        designData.font_size = parseInt(document.getElementById('font-size').value);
        designData.font_family = document.getElementById('font-family').value;
    } else if (designType === 'image') {
        designData.image_url = uploadedImage;
        designData.image_color = document.getElementById('image-recolor')?.value;
    }
    
    // Capture front and back designs as JSON
    designData.front_design = {
        type: designType,
        content: designType === 'text' ? document.getElementById('front-text').innerText : uploadedImage
    };
    
    designData.back_design = {
        type: designType,
        content: designType === 'text' ? document.getElementById('back-text').innerText : uploadedImage
    };
    
    try {
        if (currentDesignId) {
            // Update existing design
            const { data, error } = await supabase
                .from('designs')
                .update(designData)
                .eq('id', currentDesignId)
                .eq('user_id', currentUser.id)
                .select();
            
            if (error) throw error;
            
            console.log('Design updated successfully');
            if (showIndicator) showSaveIndicator('Saved');
            return currentDesignId;
            
        } else {
            // Create new design
            const { data, error } = await supabase
                .from('designs')
                .insert([designData])
                .select();
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                currentDesignId = data[0].id;
                console.log('Design saved successfully');
                if (showIndicator) showSaveIndicator('Saved');
                
                // Update URL with design ID
                window.history.replaceState({}, '', `designer.html?design=${currentDesignId}`);
                return currentDesignId;
            }
        }
        
    } catch (error) {
        console.error('Error saving design:', error);
        if (showIndicator) showSaveIndicator('Error');
        return null;
    }
}

// =====================
// MANUAL SAVE BUTTON
// =====================
async function manualSaveDesign() {
    const saveBtn = document.getElementById('save-btn');
    const originalText = saveBtn.innerHTML;
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '💾 Saving...';
    
    const designId = await saveDesign(false);
    
    if (designId) {
        saveBtn.innerHTML = '✓ Saved!';
        showSaveStatus('Design saved successfully!', 'success');
        
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }, 2000);
    } else {
        saveBtn.innerHTML = '✗ Failed';
        showSaveStatus('Failed to save design', 'error');
        
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }, 2000);
    }
}

// =====================
// PROCEED TO CHECKOUT
// =====================
async function proceedToCheckout() {
    if (!currentUser) {
        alert('Please login to place an order.');
        window.location.href = 'auth.html';
        return;
    }
    
    // Save design first
    const designId = await saveDesign(false);
    
    if (!designId) {
        alert('Failed to save design. Please try again.');
        return;
    }
    
    // Store design ID in localStorage for checkout page
    localStorage.setItem('checkout_design_id', designId);
    
    // Redirect to checkout
    window.location.href = 'checkout.html';
}

// =====================
// SAVE STATUS DISPLAY
// =====================
function showSaveStatus(message, type = 'success') {
    const statusDiv = document.getElementById('save-status');
    statusDiv.textContent = message;
    statusDiv.className = `save-status show ${type === 'error' ? 'error' : ''}`;
    
    setTimeout(() => {
        statusDiv.classList.remove('show');
    }, 3000);
}

// =====================
// AUTO-SAVE
// =====================
function startAutoSave() {
    // Save every 10 seconds
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    autoSaveInterval = setInterval(() => {
        saveDesign();
    }, 10000); // 10 seconds
}

function showSaveIndicator(status) {
    // Create save indicator if it doesn't exist
    let indicator = document.getElementById('save-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'save-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            padding: 10px 20px;
            background: ${status === 'Saved' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 5px;
            font-weight: 600;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = status === 'Saved' ? '✓ Saved' : '✗ Save Error';
    indicator.style.background = status === 'Saved' ? '#4CAF50' : '#f44336';
    indicator.style.opacity = '1';
    
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

// =====================
// INITIALIZATION (at the end of your existing script.js)
// =====================
document.addEventListener('DOMContentLoaded', () => {
    initializeDesigner();
    checkAuth();
});

// Update the existing functions to trigger save
const originalUpdateText = updateText;
updateText = function() {
    originalUpdateText();
    if (currentUser && currentDesignId) {
        showSaveIndicator('Saving...');
    }
};

const originalUpdateTextColor = updateTextColor;
updateTextColor = function() {
    originalUpdateTextColor();
    if (currentUser && currentDesignId) {
        showSaveIndicator('Saving...');
    }
};

const originalUpdateTshirtColor = updateTshirtColor;
updateTshirtColor = function() {
    originalUpdateTshirtColor();
    if (currentUser && currentDesignId) {
        showSaveIndicator('Saving...');
    }
};

// =====================
// UPDATED ORDER NOW
// =====================
const originalOrderNow = orderNow;
orderNow = async function() {
    // Save design first
    if (currentUser) {
        await saveDesign();
    }
    
    originalOrderNow();
};

// =====================
// CLEANUP ON PAGE UNLOAD
// =====================
window.addEventListener('beforeunload', () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // Save one last time
    if (currentUser) {
        saveDesign();
    }
});

// Attach save button handler
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", manualSaveDesign);
  } else {
    console.warn("Save button not found.");
  }
});