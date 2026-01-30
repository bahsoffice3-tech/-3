// ==================== RENDER FUNCTIONS ====================
async function renderApp() {
    if (!CURR_USER) return;
    
    console.log("🎨 Rendering app for:", CURR_USER.name);
    
    try {
        const snapshot = await db.ref().once('value');
        DB_DATA = snapshot.val();
        
        updateUserUI();
        renderConfig();
        renderCategories();
        renderPosts();
        renderExams();
        renderLibrary();
        renderTransactions();
        renderMessages();
        
        if (CURR_USER.role === 'admin') {
            renderAdminDashboard();
        }
        
    } catch (error) {
        console.error("❌ Render error:", error);
    }
}

function updateUserUI() {
    if (!CURR_USER) return;
    
    document.getElementById('navName').innerText = CURR_USER.name;
    document.getElementById('profileName').innerText = CURR_USER.name;
    document.getElementById('navBal').innerText = `৳${CURR_USER.bal || 0}`;
    document.getElementById('walletBigBal').innerText = `৳${CURR_USER.bal || 0}`;
    document.getElementById('navAvatar').src = CURR_USER.avatar || 'https://via.placeholder.com/35';
    document.getElementById('profileAvatar').src = CURR_USER.avatar || 'https://via.placeholder.com/100';
    document.getElementById('profileMobile').innerText = CURR_USER.id;
    
    if (DB_DATA && DB_DATA.config) {
        document.getElementById('marqueeText').innerText = DB_DATA.config.notice || 'Welcome to MRDS';
    }
}

function renderConfig() {
    if (!DB_DATA || !DB_DATA.config) return;
    
    const config = DB_DATA.config;
    document.getElementById('viewBkash').innerText = config.bkash || 'N/A';
    document.getElementById('viewNagad').innerText = config.nagad || 'N/A';
    document.getElementById('viewMinDep').innerText = config.minDep || 0;
    document.getElementById('viewMinWd').innerText = config.minWd || 0;
}

function renderLibrary() {
    const container = document.getElementById('libList');
    if (!container || !DB_DATA || !DB_DATA.library) return;
    
    container.innerHTML = '';
    const library = DB_DATA.library;
    
    if (Object.keys(library).length === 0) {
        container.innerHTML = '<div class="card text-center p-4"><p class="text-light">No library items yet</p></div>';
        return;
    }
    
    Object.values(library).forEach(item => {
        container.innerHTML += `
            <div class="card flex flex-between">
                <div class="flex gap-2">
                    <i class="fas ${item.type === 'Video' ? 'fa-video' : 'fa-file-pdf'} fa-2x ${item.type === 'Video' ? 'text-danger' : 'text-primary'}"></i>
                    <div>
                        <b>${item.title}</b>
                        <div class="text-xs text-light">${item.type}</div>
                    </div>
                </div>
                <a href="${item.link}" target="_blank" class="btn btn-sm btn-outline">Open</a>
            </div>
        `;
    });
}

function renderTransactions() {
    const container = document.getElementById('txHistory');
    if (!container || !DB_DATA || !DB_DATA.txs) return;
    
    container.innerHTML = '';
    const transactions = DB_DATA.txs;
    
    if (Object.keys(transactions).length === 0) {
        container.innerHTML = '<div class="card text-center p-4"><p class="text-light">No transactions yet</p></div>';
        return;
    }
    
    Object.entries(transactions)
        .filter(([, t]) => t.uid === CURR_USER.id)
        .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))
        .forEach(([id, t]) => {
            container.innerHTML += `
                <div class="card p-2 flex flex-between">
                    <div>
                        <div class="font-bold text-xs">${t.type}</div>
                        <div class="text-xs text-light">${t.method || ''} ${t.trx ? '| ' + t.trx : ''}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold">৳${t.amount}</div>
                        <div class="status-badge st-${t.status}">${t.status}</div>
                    </div>
                </div>
            `;
        });
}

