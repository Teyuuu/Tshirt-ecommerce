// =====================
// SUPABASE CONFIGURATION
// =====================
const SUPABASE_URL = 'https://yxnrmerxfxnffjvmyoqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bnJtZXJ4ZnhuZmZqdm15b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MDIsImV4cCI6MjA3ODU2NzUwMn0.OtUz7bDP0T6XzCcWPTig0Ivc-cS1F8HMIvPoLVXYsXo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentDesign = null;
let selectedPayment = 'card';
let printSide = 'front'; // 'front' or 'both'
let rushFee = false;

// Pricing tiers (Philippine Peso)
const PRICING = {
    front: {
        single: { min: 1, max: 4, price: 450 },
        bulk: { min: 5, max: 25, price: 430 },
        wholesale: { min: 26, max: Infinity, price: 390 }
    },
    both: {
        single: { min: 1, max: 4, price: 550 },
        bulk: { min: 5, max: 25, price: 530 },
        wholesale: { min: 26, max: Infinity, price: 490 }
    }
};

// Add-ons
const ADD_ONS = {
    rush: 50, // per shirt
    packaging: 30, // per shirt
    tags: 25 // per shirt
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
            text: 'Please select a design from your dashboard first.',
            confirmButtonText: 'Go to Dashboard',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'dashboard.html';
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
    
    console.log('Displaying design:', currentDesign);
    
    // Display design type
    const designTypeDisplay = document.getElementById('design-type-display');
    if (designTypeDisplay) {
        designTypeDisplay.textContent = currentDesign.design_type === 'text' ? 'Text Design' : 'Image Design';
    }
    
    // Display t-shirt color
    const colorDisplay = document.getElementById('tshirt-color-display');
    const colorText = document.getElementById('tshirt-color-text');
    if (colorDisplay && colorText) {
        colorDisplay.style.backgroundColor = currentDesign.tshirt_color || '#FFFFFF';
        colorText.textContent = (currentDesign.tshirt_color || '#FFFFFF').toUpperCase();
    }
    
    // Display text content if text design
    if (currentDesign.design_type === 'text' && currentDesign.text_content) {
        const textDetails = document.getElementById('text-details');
        const textContent = document.getElementById('text-content-display');
        if (textDetails && textContent) {
            textDetails.style.display = 'flex';
            textContent.textContent = currentDesign.text_content;
        }
    }
    
    // Generate preview
    generatePreview();
}

// =====================
// GENERATE PREVIEW
// =====================
function generatePreview() {
    const previewContainer = document.getElementById('design-preview');
    if (!previewContainer) return;
    
    const tshirtColor = currentDesign.tshirt_color || '#FFFFFF';
    
    // Create SVG preview
    let svgContent = `
        <svg viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg" style="max-width: 400px; height: auto;">
            <path d="M60,60 L60,30 Q60,15 75,15 L120,15 Q127.5,15 135,22.5 Q142.5,30 150,30 Q157.5,30 165,22.5 Q172.5,15 180,15 L225,15 Q240,15 240,30 L240,60 L270,90 L270,120 L255,120 L255,360 L45,360 L45,120 L30,120 L30,90 Z" 
                  fill="${tshirtColor}" 
                  stroke="#e0e0e0" 
                  stroke-width="2"/>
    `;
    
    if (currentDesign.design_type === 'text' && currentDesign.text_content) {
        const textColor = currentDesign.text_color || '#000000';
        const fontSize = currentDesign.font_size || 24;
        const fontFamily = currentDesign.font_family || 'Arial, sans-serif';
        
        svgContent += `
            <text x="150" y="180" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="bold" font-family="${fontFamily}">
                ${currentDesign.text_content}
            </text>
        `;
    } else if (currentDesign.design_type === 'image' && currentDesign.image_url) {
        svgContent += `
            <image x="90" y="120" width="120" height="120" href="${currentDesign.image_url}" />
        `;
    }
    
    svgContent += `</svg>`;
    
    previewContainer.innerHTML = svgContent;
}

// =====================
// PRINT SIDE SELECTION
// =====================
function selectPrintSide(side) {
    printSide = side;
    console.log('Selected print side:', side);
    
    // Update UI
    document.querySelectorAll('.print-side-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedOption = document.getElementById(`print-${side}`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    updatePricing();
}

// =====================
// QUANTITY & PRICING
// =====================
function changeQuantity(delta) {
    const qtyInput = document.getElementById('quantity');
    if (!qtyInput) return;
    
    let newQty = parseInt(qtyInput.value) + delta;
    
    if (newQty < 1) newQty = 1;
    
    qtyInput.value = newQty;
    updatePricing();
}

function updatePricing() {
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
    
    // Determine price tier based on quantity and print side
    const pricing = PRICING[printSide];
    let unitPrice = pricing.single.price;
    let discountRate = 0;
    
    if (quantity >= pricing.wholesale.min) {
        unitPrice = pricing.wholesale.price;
        discountRate = 13;
    } else if (quantity >= pricing.bulk.min) {
        unitPrice = pricing.bulk.price;
        discountRate = 4;
    }
    
    const subtotal = unitPrice * quantity;
    
    // Rush fee
    const rushCost = rushFee ? (ADD_ONS.rush * quantity) : 0;
    
    // Shipping (free for 5+ items)
    const shipping = quantity >= 5 ? 0 : 100;
    
    const total = subtotal + rushCost + shipping;
    
    // Update display
    const unitPriceEl = document.getElementById('unit-price');
    const quantityDisplayEl = document.getElementById('quantity-display');
    const subtotalEl = document.getElementById('subtotal');
    const rushFeeDisplayEl = document.getElementById('rush-fee-display');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');
    const finalTotalEl = document.getElementById('final-total');
    
    if (unitPriceEl) unitPriceEl.textContent = `₱${unitPrice.toFixed(2)}`;
    if (quantityDisplayEl) quantityDisplayEl.textContent = quantity;
    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    if (rushFeeDisplayEl) rushFeeDisplayEl.textContent = rushFee ? `₱${rushCost.toFixed(2)}` : '-';
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `₱${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
    if (finalTotalEl) finalTotalEl.textContent = `₱${total.toFixed(2)}`;
    
    // Show discount badge if applicable
    const discountBadge = document.getElementById('discount-badge');
    if (discountBadge) {
        if (discountRate > 0) {
            discountBadge.textContent = `${discountRate}% Discount Applied!`;
            discountBadge.style.display = 'block';
        } else {
            discountBadge.style.display = 'none';
        }
    }
    
    console.log('Updated pricing:', { quantity, unitPrice, total, printSide });
}

// =====================
// RUSH FEE TOGGLE
// =====================
function toggleRushFee(checkbox) {
    rushFee = checkbox.checked;
    console.log('Rush fee:', rushFee);
    updatePricing();
}

// =====================
// PAYMENT METHOD
// =====================
function selectPayment(radio) {
    selectedPayment = radio.value;
    console.log('Selected payment:', selectedPayment);
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('selected');
    });
    
    const closestMethod = radio.closest('.payment-method');
    if (closestMethod) {
        closestMethod.classList.add('selected');
    }
}

// =====================
// PLACE ORDER
// =====================
async function placeOrder() {
    if (!currentUser || !currentDesign) {
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Place Order',
            text: 'Please login and select a design first.'
        });
        return;
    }
    
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
    const unitPrice = parseFloat(document.getElementById('unit-price')?.textContent.replace('₱', '')) || 0;
    const subtotal = parseFloat(document.getElementById('subtotal')?.textContent.replace('₱', '')) || 0;
    const rushCost = rushFee ? (ADD_ONS.rush * quantity) : 0;
    const shippingText = document.getElementById('shipping')?.textContent || '';
    const shippingCost = shippingText === 'FREE' ? 0 : 100;
    const totalAmount = parseFloat(document.getElementById('total')?.textContent.replace('₱', '')) || 0;
    
    console.log('Placing order:', { quantity, unitPrice, total: totalAmount, printSide, rushFee });
    
    const orderData = {
        user_id: currentUser.id,
        design_id: currentDesign.id,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total_amount: totalAmount,
        payment_method: selectedPayment,
        order_status: 'pending',
        print_side: printSide,
        rush_fee: rushFee,
        rush_fee_cost: rushCost,
        design_snapshot: {
            design_type: currentDesign.design_type,
            tshirt_color: currentDesign.tshirt_color,
            text_content: currentDesign.text_content,
            text_color: currentDesign.text_color,
            font_size: currentDesign.font_size,
            font_family: currentDesign.font_family,
            image_url: currentDesign.image_url,
            print_side: printSide
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
        
        if (error) {
            console.error('Order error:', error);
            throw error;
        }
        
        console.log('Order placed successfully:', data);
        
        // Clear checkout design ID
        localStorage.removeItem('checkout_design_id');
        
        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Order Placed!',
            html: `
                <p>Your order has been placed successfully!</p>
                <p><strong>Order ID:</strong> #${data[0].id.substring(0, 8).toUpperCase()}</p>
                <p><strong>Print Type:</strong> ${printSide === 'front' ? 'Front Only' : 'Front & Back'}</p>
                <p><strong>Quantity:</strong> ${quantity} ${quantity > 1 ? 'shirts' : 'shirt'}</p>
                <p><strong>Total:</strong> ₱${totalAmount.toFixed(2)}</p>
                ${rushFee ? '<p><strong>Rush Processing:</strong> Yes (2-3 days)</p>' : ''}
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
            text: error.message || 'Failed to place order. Please try again or contact support.',
            confirmButtonText: 'OK'
        });
    }
}

// =====================
// INITIALIZE ON LOAD
// =====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Checkout page loaded');
    init();
});