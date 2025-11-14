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

// =====================
// AUTHENTICATION CHECK
// =====================
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // Redirect to auth page
        Swal.fire({
            icon: 'warning',
            title: 'Authentication Required',
            text: 'Please login to use the designer.',
            confirmButtonText: 'Go to Login',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'auth.html';
        });
        return false;
    }
    
    currentUser = session.user;
    
    // Check if loading existing design
    const urlParams = new URLSearchParams(window.location.search);
    const designId = urlParams.get('design');
    
    if (designId) {
        await loadDesign(designId);
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
            Swal.fire({
                icon: 'error',
                title: 'Design Not Found',
                text: 'The requested design could not be found.'
            });
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
        
    } catch (error) {
        console.error('Error loading design:', error);
        Swal.fire({
            icon: 'error',
            title: 'Loading Failed',
            text: 'Failed to load design. Please try again.'
        });
    }
}

// =====================
// SAVE DESIGN
// =====================
async function saveDesign() {
    if (!currentUser) {
        Swal.fire({
            icon: 'warning',
            title: 'Login Required',
            text: 'Please login to save your design.'
        });
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
                
                // Update URL with design ID
                window.history.replaceState({}, '', `designer.html?design=${currentDesignId}`);
                return currentDesignId;
            }
        }
        
    } catch (error) {
        console.error('Error saving design:', error);
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
    
    const designId = await saveDesign();
    
    if (designId) {
        saveBtn.innerHTML = '✓ Saved!';
        
        Swal.fire({
            icon: 'success',
            title: 'Design Saved!',
            text: 'Your design has been saved successfully.',
            timer: 2000,
            showConfirmButton: false
        });
        
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }, 2000);
    } else {
        saveBtn.innerHTML = '✗ Failed';
        
        Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: 'Failed to save design. Please try again.'
        });
        
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
        Swal.fire({
            icon: 'warning',
            title: 'Login Required',
            text: 'Please login to place an order.',
            confirmButtonText: 'Go to Login'
        }).then(() => {
            window.location.href = 'auth.html';
        });
        return;
    }
    
    // Save design first
    const designId = await saveDesign();
    
    if (!designId) {
        Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: 'Failed to save design. Please try again.'
        });
        return;
    }
    
    // Store design ID in localStorage for checkout page
    localStorage.setItem('checkout_design_id', designId);
    
    // Redirect to checkout
    window.location.href = 'checkout.html';
}

// =====================
// INITIALIZATION
// =====================
document.addEventListener('DOMContentLoaded', () => {
    initializeDesigner();
    checkAuth();
});

// =====================
// UPDATED ORDER NOW WITH SWAL
// =====================
const originalOrderNow = orderNow;
orderNow = async function() {
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
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#045490'
    }).then(async (result) => {
        if (result.isConfirmed) {
            if (currentUser) {
                await saveDesign();
            }
            await proceedToCheckout();
        }
    });
};

// Attach save button handler
document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", manualSaveDesign);
    } else {
        console.warn("Save button not found.");
    }
});