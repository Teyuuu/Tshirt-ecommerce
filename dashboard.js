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
// LOAD USER DESIGNS
// =====================
async function loadUserDesigns() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const designsGrid = document.getElementById('designs-grid');
    const emptyState = document.getElementById('empty-state');
    const designCount = document.getElementById('design-count');
    
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
        alert('Failed to load designs. Please refresh the page.');
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
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('designs')
            .delete()
            .eq('id', designId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Reload designs
        loadUserDesigns();
        
    } catch (error) {
        console.error('Error deleting design:', error);
        alert('Failed to delete design. Please try again.');
    }
}

// =====================
// LOGOUT
// =====================
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('user_session');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

// =====================
// INITIALIZE
// =====================
checkAuth();