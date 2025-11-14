// =====================
// SUPABASE CONFIGURATION
// =====================
const SUPABASE_URL = 'https://yxnrmerxfxnffjvmyoqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bnJtZXJ4ZnhuZmZqdm15b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MDIsImV4cCI6MjA3ODU2NzUwMn0.OtUz7bDP0T6XzCcWPTig0Ivc-cS1F8HMIvPoLVXYsXo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentDesign = null;
let selectedPayment = 'card';

// Pricing tiers
const PRICING = {
    single: { min: 1, max: 4, price: 24.99 },
    bulk: { min: 5, max: 24, price: 19.99 },
    wholesale: { min: 25, max: Infinity, price: 14.99 }
};

// =====================
// INITIALIZATION
// =====================
async function init() {
    await checkAuth();
    await loadDesign();
    updatePricing();
}

// =====================
// AUTHENTICATION CHECK
// =====================
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        Swal.fire({
            icon: 'warning',
            title: 'Login Required',
            text: 'Please login to checkout.',
            confirmButtonText: 'Go to Login',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'auth.html';
        });
        return;
    }
    
    currentUser = session.user;
}

// =====================
// LOAD DESIGN
// =====================
async function loadDesign() {
    const designId = localStorage.getItem('checkout_design_id');
    
    if (!designId) {
        Swal.fire({
            icon: 'warning',
            title: 'No Design Found',
            text: 'Please create a design first.',
            confirmButtonText: 'Go to Designer',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'designer.html';
        });
        return;
    }
    
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
                text: 'The design could not be found.',
                confirmButtonText: 'Go to Dashboard'
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
            return;
        }
        
        currentDesign = design;
        displayDesign();
        
    } catch (error) {
        console.error('Error loading design:', error);
        Swal.fire({
            icon: 'error',
            title: 'Loading Failed',
            text: 'Failed to load design.',
            confirmButtonText: 'Go to Dashboard'
        }).then(() => {
            window.location.href = 'dashboard.html';
        });
    }
}

// =====================
// DISPLAY DESIGN
// =====================
function displayDesign() {
    if (!currentDesign) return;
    
    // Display design type
    const designTypeDisplay = document.getElementById('design-type-display');
    designTypeDisplay.textContent = currentDesign.design_type === 'text' ? 'Text Design' : 'Image Design';
    
    // Display t-shirt color
    const colorDisplay = document.getElementById('tshirt-color-display');
    const colorText = document.getElementById('tshirt-color-text');
    colorDisplay.style.backgroundColor = currentDesign.tshirt_color;
    colorText.textContent = currentDesign.tshirt_color.toUpperCase();
    
    // Display text content if text design
    if (currentDesign.design_type === 'text') {
        const textDetails = document.getElementById('text-details');
        const textContent = document.getElementById('text-content-display');
        textDetails.style.display = 'flex';
        textContent.textContent = currentDesign.text_content || 'N/A';
    }
    
    // Generate preview (simplified)
    generatePreview();
}

// =====================
// GENERATE PREVIEW
// =====================
function generatePreview() {
    const previewImg = document.getElementById('preview-image');
    
    // Create SVG preview
    const svg = `
        <svg viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg">
            <path d="M60,60 L60,30 Q60,15 75,15 L120,15 Q127.5,15 135,22.5 Q142.5,30 150,30 Q157.5,30 165,22.5 Q172.5,15 180,15 L225,15 Q240,15 240,30 L240,60 L270,90 L270,120 L255,120 L255,360 L45,360 L45,120 L30,120 L30,90 Z" 
                  fill="${currentDesign.tshirt_color}" 
                  stroke="#e0e0e0" 
                  stroke-width="2"/>
            ${currentDesign.design_type === 'text' ? `
                <text x="150" y="180" text-anchor="middle" fill="${currentDesign.text_color}" font-size="${currentDesign.font_size}" font-weight="bold" font-family="${currentDesign.font_family}">
                    ${currentDesign.text_content}
                </text>
            ` : ''}
        </svg>
    `;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    previewImg.src = url;
}

// =====================
// QUANTITY & PRICING
// =====================
function changeQuantity(delta) {
    const qtyInput = document.getElementById('quantity');
    let newQty = parseInt(qtyInput.value) + delta;
    
    if (newQty < 1) newQty = 1;
    
    qtyInput.value = newQty;
    updatePricing();
}

function updatePricing() {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    // Determine price tier
    let unitPrice = PRICING.single.price;
    if (quantity >= PRICING.wholesale.min) {
        unitPrice = PRICING.wholesale.price;
    } else if (quantity >= PRICING.bulk.min) {
        unitPrice = PRICING.bulk.price;
    }
    
    const subtotal = unitPrice * quantity;
    const shipping = quantity >= 5 ? 0 : 5.00; // Free shipping for 5+ items
    const total = subtotal + shipping;
    
    // Update display
    document.getElementById('unit-price').textContent = `$${unitPrice.toFixed(2)}`;
    document.getElementById('quantity-display').textContent = quantity;
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('final-total').textContent = `$${total.toFixed(2)}`;
}

// =====================
// PAYMENT METHOD
// =====================
function selectPayment(radio) {
    selectedPayment = radio.value;
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('selected');
    });
    
    radio.closest('.payment-method').classList.add('selected');
}

// =====================
// PLACE ORDER
// =====================
async function placeOrder() {
    if (!currentUser || !currentDesign) {
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Place Order',
            text: 'Please login and create a design first.'
        });
        return;
    }
    
    const quantity = parseInt(document.getElementById('quantity').value);
    const totalAmount = parseFloat(document.getElementById('total').textContent.replace('$', ''));
    
    const orderData = {
        user_id: currentUser.id,
        design_id: currentDesign.id,
        quantity: quantity,
        unit_price: parseFloat(document.getElementById('unit-price').textContent.replace('$', '')),
        subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('$', '')),
        shipping_cost: document.getElementById('shipping').textContent === 'FREE' ? 0 : 5.00,
        total_amount: totalAmount,
        payment_method: selectedPayment,
        order_status: 'pending',
        design_snapshot: {
            design_type: currentDesign.design_type,
            tshirt_color: currentDesign.tshirt_color,
            text_content: currentDesign.text_content,
            text_color: currentDesign.text_color,
            font_size: currentDesign.font_size,
            font_family: currentDesign.font_family,
            image_url: currentDesign.image_url
        }
    };
    
    try {
        // Show loading
        Swal.fire({
            title: 'Processing Order...',
            text: 'Please wait while we process your order.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select();
        
        if (error) throw error;
        
        // Clear checkout design ID
        localStorage.removeItem('checkout_design_id');
        
        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Order Placed!',
            html: `
                <p>Your order has been placed successfully!</p>
                <p><strong>Order ID:</strong> #${data[0].id.substring(0, 8).toUpperCase()}</p>
                <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
                <p style="margin-top: 15px; color: #666;">You will receive a confirmation email shortly.</p>
            `,
            confirmButtonText: 'View My Orders',
            confirmButtonColor: '#045490'
        });
        
        // Redirect to dashboard orders tab
        window.location.href = 'dashboard.html?tab=orders';
        
    } catch (error) {
        console.error('Error placing order:', error);
        Swal.fire({
            icon: 'error',
            title: 'Order Failed',
            text: 'Failed to place order. Please try again or contact support.',
            confirmButtonText: 'OK'
        });
    }
}

// =====================
// INITIALIZE ON LOAD
// =====================
init();