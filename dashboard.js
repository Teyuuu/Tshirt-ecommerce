// =====================
// SUPABASE CONFIGURATION
// =====================
const SUPABASE_URL = 'https://yxnrmerxfxnffjvmyoqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bnJtZXJ4ZnhuZmZqdm15b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MDIsImV4cCI6MjA3ODU2NzUwMn0.OtUz7bDP0T6XzCcWPTig0Ivc-cS1F8HMIvPoLVXYsXo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// =====================
// AUTHENTICATION CHECK
// =====================
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // No session, redirect to auth page
        window.location.href = 'auth.html';
        return;
    }
    
    currentUser = session.user;
    displayUserInfo();
    
    // Check URL for tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab === 'orders') {
        switchTab('orders');
    } else {
        loadUserDesigns();
    }
}

// =====================
// USER INFO DISPLAY
// =====================
function displayUserInfo() {
    if (!currentUser) return;
    
    const userName = currentUser.user_metadata?.full_name || 'Designer';
    const userEmail = currentUser.email;
    
    document.getElementById('user-name').textContent = userName.split(' ')[0];
    document.getElementById('user-email').textContent = userEmail;
}

// =====================
// TAB SWITCHING
// =====================
function switchTab(tab) {
    const designsSection = document.getElementById('designs-section');
    const ordersSection = document.getElementById('orders-section');
    const designsTab = document.getElementById('designs-tab');
    const ordersTab = document.getElementById('orders-tab');
    
    if (tab === 'designs') {
        designsSection.classList.add('active');
        ordersSection.classList.remove('active');
        designsTab.classList.add('active');
        ordersTab.classList.remove('active');
        
        if (!designsSection.dataset.loaded) {
            loadUserDesigns();
            designsSection.dataset.loaded = 'true';
        }
    } else if (tab === 'orders') {
        designsSection.classList.remove('active');
        ordersSection.classList.add('active');
        designsTab.classList.remove('active');
        ordersTab.classList.add('active');
        
        if (!ordersSection.dataset.loaded) {
            loadUserOrders();
            ordersSection.dataset.loaded = 'true';
        }
    }
}

// =====================
// LOAD USER DESIGNS
// =====================
async function loadUserDesigns() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const designsGrid = document.getElementById('designs-grid');
    const emptyState = document.getElementById('empty-designs');
    const designCount = document.getElementById('design-count');
    
    loadingOverlay.style.display = 'flex';
    
    try {
        const { data: designs, error } = await supabase
            .from('designs')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        loadingOverlay.style.display = 'none';
        
        if (!designs || designs.length === 0) {
            designsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            designCount.textContent = '0';
            return;
        }
        
        designsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        designCount.textContent = designs.length;
        
        // Render designs
        designsGrid.innerHTML = designs.map(design => createDesignCard(design)).join('');
        
    } catch (error) {
        console.error('Error loading designs:', error);
        loadingOverlay.style.display = 'none';
        
        Swal.fire({
            icon: 'error',
            title: 'Loading Failed',
            text: 'Failed to load designs. Please refresh the page.'
        });
    }
}

// =====================
// CREATE DESIGN CARD
// =====================
function createDesignCard(design) {
    const createdDate = new Date(design.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const updatedDate = new Date(design.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Create a preview based on design type
    let previewContent = '';
    if (design.thumbnail_url) {
        previewContent = `<img src="${design.thumbnail_url}" alt="${design.design_name}">`;
    } else {
        // Generate simple preview
        const bgColor = design.tshirt_color || '#FFFFFF';
        const textColor = design.text_color || '#000000';
        const textContent = design.text_content || 'Design';
        
        previewContent = `
            <svg viewBox="0 0 300 360" style="width: 200px; height: auto;">
                <path d="M60,60 L60,30 Q60,15 75,15 L120,15 Q127.5,15 135,22.5 Q142.5,30 150,30 Q157.5,30 165,22.5 Q172.5,15 180,15 L225,15 Q240,15 240,30 L240,60 L270,90 L270,120 L255,120 L255,360 L45,360 L45,120 L30,120 L30,90 Z" 
                      fill="${bgColor}" 
                      stroke="#e0e0e0" 
                      stroke-width="2"/>
                <text x="150" y="180" text-anchor="middle" fill="${textColor}" font-size="24" font-weight="bold">
                    ${textContent.substring(0, 15)}
                </text>
            </svg>
        `;
    }
    
    return `
        <div class="design-card" onclick="viewDesign('${design.id}')">
            <div class="design-preview">
                ${previewContent}
            </div>
            <div class="design-info">
                <div class="design-name">${design.design_name}</div>
                <div class="design-meta">
                    ${design.design_type === 'text' ? '📝 Text Design' : '🖼️ Image Design'} • 
                    Updated ${updatedDate === createdDate ? 'today' : updatedDate}
                </div>
                <div class="design-actions" onclick="event.stopPropagation()">
                    <button class="btn-edit" onclick="editDesign('${design.id}')">Edit</button>
                    <button class="btn-order" onclick="orderDesign('${design.id}')">Order Now</button>
                    <button class="btn-delete" onclick="deleteDesign('${design.id}')">Delete</button>
                </div>
            </div>
        </div>
    `;
}

// =====================
// DESIGN ACTIONS
// =====================
function viewDesign(designId) {
    window.location.href = `designer.html?design=${designId}`;
}

function editDesign(designId) {
    window.location.href = `designer.html?design=${designId}`;
}

async function deleteDesign(designId) {
    const result = await Swal.fire({
        title: 'Delete Design?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        const { error } = await supabase
            .from('designs')
            .delete()
            .eq('id', designId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Design has been deleted.',
            timer: 2000,
            showConfirmButton: false
        });
        
        // Reload designs
        loadUserDesigns();
        
    } catch (error) {
        console.error('Error deleting design:', error);
        Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Failed to delete design. Please try again.'
        });
    }
}

function orderDesign(designId) {
    if (!designId) return;
    localStorage.setItem('checkout_design_id', designId);
    window.location.href = 'checkout.html';
}

// =====================
// LOAD USER ORDERS
// =====================
async function loadUserOrders() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const ordersList = document.getElementById('orders-list');
    const emptyOrders = document.getElementById('empty-orders');
    const orderCount = document.getElementById('order-count');
    
    loadingOverlay.style.display = 'flex';
    
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        loadingOverlay.style.display = 'none';
        
        if (!orders || orders.length === 0) {
            ordersList.innerHTML = '';
            emptyOrders.style.display = 'block';
            orderCount.textContent = '0';
            return;
        }
        
        emptyOrders.style.display = 'none';
        orderCount.textContent = orders.length;
        
        // Render orders
        ordersList.innerHTML = orders.map(order => createOrderCard(order)).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
        loadingOverlay.style.display = 'none';
        
        Swal.fire({
            icon: 'error',
            title: 'Loading Failed',
            text: 'Failed to load orders. Please refresh the page.'
        });
    }
}

// =====================
// CREATE ORDER CARD
// =====================
function createOrderCard(order) {
    const createdDate = new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const statusClass = `status-${order.order_status}`;
    const statusText = order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1);
    
    // Generate preview
    let previewContent = '';
    if (order.design_snapshot) {
        const snapshot = order.design_snapshot;
        const bgColor = snapshot.tshirt_color || '#FFFFFF';
        const textColor = snapshot.text_color || '#000000';
        const textContent = snapshot.text_content || 'Design';
        
        previewContent = `
            <svg viewBox="0 0 300 360" style="width: 120px; height: auto;">
                <path d="M60,60 L60,30 Q60,15 75,15 L120,15 Q127.5,15 135,22.5 Q142.5,30 150,30 Q157.5,30 165,22.5 Q172.5,15 180,15 L225,15 Q240,15 240,30 L240,60 L270,90 L270,120 L255,120 L255,360 L45,360 L45,120 L30,120 L30,90 Z" 
                      fill="${bgColor}" 
                      stroke="#e0e0e0" 
                      stroke-width="2"/>
                ${snapshot.design_type === 'text' ? `
                    <text x="150" y="180" text-anchor="middle" fill="${textColor}" font-size="24" font-weight="bold">
                        ${textContent.substring(0, 10)}
                    </text>
                ` : ''}
            </svg>
        `;
    }
    
    return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.id.substring(0, 8).toUpperCase()}</div>
                    <div class="order-date">${createdDate}</div>
                </div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="order-body">
                <div class="order-preview">
                    ${previewContent}
                </div>
                
                <div class="order-details">
                    <div class="order-detail-row">
                        <span style="color: #666;">Quantity:</span>
                        <span style="font-weight: 600;color:#666;">${order.quantity} ${order.quantity > 1 ? 'items' : 'item'}</span>
                    </div>
                    <div class="order-detail-row">
                        <span style="color: #666;">Unit Price:</span>
                        <span style="font-weight: 600;color:#666;">₱${order.unit_price.toFixed(2)}</span>
                    </div>
                    <div class="order-detail-row">
                        <span style="color: #666;">Subtotal:</span>
                        <span style="font-weight: 600;color:#666;">₱${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="order-detail-row">
                        <span style="color: #666;">Shipping:</span>
                        <span style="font-weight: 600;color:#666;">${order.shipping_cost === 0 ? 'FREE' : '₱' + order.shipping_cost.toFixed(2)}</span>
                    </div>
                    <div class="order-detail-row">
                        <span style="color: #666;">Payment:</span>
                        <span style="font-weight: 600; text-transform: capitalize;color:#666;">${order.payment_method}</span>
                    </div>
                    ${order.tracking_number ? `
                        <div class="order-detail-row">
                            <span style="color: #666;">Tracking:</span>
                            <span style="font-weight: 600; color: #045490;">${order.tracking_number}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="order-footer">
                <div class="order-total">Total: ₱${order.total_amount.toFixed(2)}</div>
                ${order.design_id ? `
                    <button class="btn-edit" onclick="reorderDesign('${order.design_id}')">
                        🔄 Reorder
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// =====================
// REORDER DESIGN
// =====================
function reorderDesign(designId) {
    window.location.href = `designer.html?design=${designId}`;
}

// =====================
// LOGOUT
// =====================
async function handleLogout() {
    const result = await Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#045490'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('user_session');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Logout Failed',
            text: 'Failed to logout. Please try again.'
        });
    }
}

// =====================
// INITIALIZE
// =====================
checkAuth();