// =====================
// SUPABASE CONFIGURATION
// =====================
const SUPABASE_URL = 'https://yxnrmerxfxnffjvmyoqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bnJtZXJ4ZnhuZmZqdm15b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MDIsImV4cCI6MjA3ODU2NzUwMn0.OtUz7bDP0T6XzCcWPTig0Ivc-cS1F8HMIvPoLVXYsXo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// EmailJS Configuration (Sign up at https://www.emailjs.com/)
const EMAILJS_PUBLIC_KEY = 'Jf-fhARFsoaMw-JWR'; // Replace with your EmailJS public key
const EMAILJS_SERVICE_ID = 'service_wsl9hze'; // Replace with your service ID
const EMAILJS_TEMPLATE_ID = 'template_tx405xw'; // Replace with your template ID

let currentUser = null;
let currentDesign = null;
let selectedPayment = 'card';
let printSide = 'front';
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

// Shipping rates based on quantity
const SHIPPING = {
    pickup: 0,
    retail: 80,    // 1-4 shirts
    bulk: 150,     // 5-25 shirts
    wholesale: 250 // 26+ shirts
};

// Add-ons
const ADD_ONS = {
    rush: 50 // per shirt
};

// =====================
// INITIALIZATION
// =====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
    init();
});

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
    
    const designTypeDisplay = document.getElementById('design-type-display');
    designTypeDisplay.textContent = currentDesign.design_type === 'text' ? 'Text Design' : 'Image Design';
    
    const colorDisplay = document.getElementById('tshirt-color-display');
    const colorText = document.getElementById('tshirt-color-text');
    colorDisplay.style.backgroundColor = currentDesign.tshirt_color;
    colorText.textContent = currentDesign.tshirt_color.toUpperCase();
    
    if (currentDesign.design_type === 'text') {
        const textDetails = document.getElementById('text-details');
        const textContent = document.getElementById('text-content-display');
        textDetails.style.display = 'flex';
        textContent.textContent = currentDesign.text_content || 'N/A';
    }
    
    generatePreview();
}

// =====================
// GENERATE PREVIEW
// =====================
function generatePreview() {
    const previewImg = document.getElementById('preview-image');
    
    const textContent = currentDesign.text_content || 'Your Design';
    const fontSize = currentDesign.font_size || 32;
    
    const svg = `
        <svg viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg">
            <path d="M60,60 L60,30 Q60,15 75,15 L120,15 Q127.5,15 135,22.5 Q142.5,30 150,30 Q157.5,30 165,22.5 Q172.5,15 180,15 L225,15 Q240,15 240,30 L240,60 L270,90 L270,120 L255,120 L255,360 L45,360 L45,120 L30,120 L30,90 Z" 
                  fill="${currentDesign.tshirt_color}" 
                  stroke="#e0e0e0" 
                  stroke-width="2"/>
            ${currentDesign.design_type === 'text' ? `
                <text x="150" y="180" text-anchor="middle" fill="${currentDesign.text_color}" font-size="${fontSize}" font-weight="bold" font-family="${currentDesign.font_family || 'Arial'}">
                    ${textContent}
                </text>
            ` : currentDesign.image_url ? `
                <image x="100" y="130" width="100" height="100" href="${currentDesign.image_url}" preserveAspectRatio="xMidYMid meet"/>
            ` : ''}
        </svg>
    `;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    previewImg.src = url;
}

// =====================
// PRINT SIDE SELECTION
// =====================
function selectPrintSide(side) {
    printSide = side;
    updatePricing();
    
    document.querySelectorAll('.print-side-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.getElementById(`print-${side}`).classList.add('selected');
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
    const rushCost = rushFee ? (ADD_ONS.rush * quantity) : 0;
    
    let shipping = SHIPPING.retail;
    if (quantity >= 26) {
        shipping = SHIPPING.wholesale;
    } else if (quantity >= 5) {
        shipping = SHIPPING.bulk;
    }
    
    const total = subtotal + rushCost + shipping;
    
    document.getElementById('unit-price').textContent = `₱${unitPrice.toFixed(2)}`;
    document.getElementById('quantity-display').textContent = quantity;
    document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('rush-fee-display').textContent = rushFee ? `₱${rushCost.toFixed(2)}` : '-';
    document.getElementById('shipping').textContent = `₱${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `₱${total.toFixed(2)}`;
    document.getElementById('final-total').textContent = `₱${total.toFixed(2)}`;
    
    const discountBadge = document.getElementById('discount-badge');
    if (discountRate > 0) {
        discountBadge.textContent = `${discountRate}% Discount Applied!`;
        discountBadge.style.display = 'block';
    } else {
        discountBadge.style.display = 'none';
    }
}

// =====================
// RUSH FEE TOGGLE
// =====================
function toggleRushFee(checkbox) {
    rushFee = checkbox.checked;
    updatePricing();
}

// =====================
// PAYMENT METHOD
// =====================
function selectPayment(radio) {
    selectedPayment = radio.value;
    
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('selected');
    });
    
    radio.closest('.payment-method').classList.add('selected');
}

// =====================
// SEND EMAIL RECEIPT
// =====================
async function sendEmailReceipt(orderData, orderId) {
    try {
        // Check if EmailJS is configured
        if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
            console.warn('EmailJS not configured. Skipping email send.');
            return;
        }

        const templateParams = {
            to_email: currentUser.email,
            to_name: currentUser.email.split('@')[0],
            order_id: orderId,
            order_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            design_type: orderData.design_snapshot.design_type === 'text' ? 'Text Design' : 'Image Design',
            tshirt_color: orderData.design_snapshot.tshirt_color.toUpperCase(),
            text_content: orderData.design_snapshot.text_content || 'N/A',
            print_type: orderData.print_side === 'front' ? 'Front Only' : 'Front & Back',
            unit_price: `₱${orderData.unit_price.toFixed(2)}`,
            quantity: orderData.quantity,
            subtotal: `₱${orderData.subtotal.toFixed(2)}`,
            rush_fee: orderData.rush_fee ? `₱${orderData.rush_fee_cost.toFixed(2)}` : '-',
            shipping: `₱${orderData.shipping_cost.toFixed(2)}`,
            total: `₱${orderData.total_amount.toFixed(2)}`,
            payment_method: getPaymentMethodName(orderData.payment_method),
            rush_processing: orderData.rush_fee ? 'Yes (2-3 days)' : 'No',
            expected_delivery: orderData.rush_fee ? '5-7 business days' : '10-14 business days'
        };

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );

        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

function getPaymentMethodName(method) {
    const methods = {
        'card': 'Credit/Debit Card',
        'paypal': 'PayPal',
        'gcash': 'GCash',
        'cod': 'Cash on Delivery'
    };
    return methods[method] || method;
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
    const unitPrice = parseFloat(document.getElementById('unit-price').textContent.replace('₱', ''));
    const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace('₱', ''));
    const rushCost = rushFee ? (ADD_ONS.rush * quantity) : 0;
    const shippingCost = parseFloat(document.getElementById('shipping').textContent.replace('₱', ''));
    const totalAmount = parseFloat(document.getElementById('total').textContent.replace('₱', ''));
    
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
        
        const orderId = data[0].id.substring(0, 8).toUpperCase();
        
        // Send email receipt
        await sendEmailReceipt(orderData, orderId);
        
        localStorage.removeItem('checkout_design_id');
        
        await Swal.fire({
            icon: 'success',
            title: 'Order Placed Successfully!',
            html: `
                <div style="text-align: left; padding: 20px;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Your order has been placed successfully!</p>
                    
                    <div style="background: #f8f9ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
                        <p style="margin: 5px 0;"><strong>Print Type:</strong> ${printSide === 'front' ? 'Front Only' : 'Front & Back'}</p>
                        <p style="margin: 5px 0;"><strong>Quantity:</strong> ${quantity} ${quantity > 1 ? 'shirts' : 'shirt'}</p>
                        <p style="margin: 5px 0;"><strong>Total:</strong> ₱${totalAmount.toFixed(2)}</p>
                        ${rushFee ? '<p style="margin: 5px 0;"><strong>Rush Processing:</strong> Yes (2-3 days)</p>' : ''}
                    </div>
                    
                    <div style="background: #d1ecf1; padding: 15px; border-radius: 10px; border: 2px solid #0c5460;">
                        <p style="margin: 0; color: #0c5460;"><strong>📧 Receipt Sent!</strong></p>
                        <p style="margin: 10px 0 0 0; color: #0c5460; font-size: 14px;">A detailed receipt has been sent to <strong>${currentUser.email}</strong></p>
                    </div>
                </div>
            `,
            confirmButtonText: 'View My Orders',
            confirmButtonColor: '#045490',
            width: '600px'
        });
        
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