// ==================== NAVIGATION FUNCTION ====================
async function nav(v, el) {
    // ১. UI পরিবর্তন (সব ভিউ লুকিয়ে নির্দিষ্ট ভিউ দেখানো)
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById('view-' + v).classList.remove('hidden');
    
    // ২. বাটন স্টাইল আপডেট
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (el) {
        el.classList.add('active');
        const text = el.innerText.trim();
        document.getElementById('headerTitle').innerText = text;
    }

    // ৩. ডাটা রিফ্রেশ লজিক
    if (['home', 'exam', 'wallet', 'admin'].includes(v)) {
        try {
            const snapshot = await db.ref().once('value');
            const data = snapshot.val();
            
            if (data) {
                DB_DATA = data;
                
                if (DB_DATA.users && CURR_USER && DB_DATA.users[CURR_USER.id]) {
                    CURR_USER.bal = DB_DATA.users[CURR_USER.id].bal;
                    updateUserUI();
                }

                if (v === 'exam') renderExams();
                if (v === 'wallet') renderTransactions();
                if (v === 'home') renderPosts();
                if (v === 'admin' && CURR_USER.role === 'admin') renderAdminDashboard();
            }
        } catch (error) {
            console.error("Auto-refresh failed:", error);
        }
    }
}

// ==================== ADMIN TAB NAVIGATION ====================
function admTab(t) {
    document.querySelectorAll('.adm-sec').forEach(sec => {
        sec.classList.add('hidden');
    });

    const selectedSec = document.getElementById('adm-' + t);
    if (selectedSec) {
        selectedSec.classList.remove('hidden');
    }

    const buttons = document.querySelectorAll('#view-admin .btn-sm');
    buttons.forEach(btn => {
        if(btn.innerText.toLowerCase().includes(t) || btn.getAttribute('onclick').includes(t)) {
            btn.classList.remove('btn-outline');
            btn.style.opacity = '1';
        } else {
            btn.style.opacity = '0.7';
        }
    });

    switch (t) {
        case 'users':
            renderAdminUsers();
            break;
        case 'pay':
            renderAdminPayments();
            break;
        case 'msg':
            renderAdminMessages();
            break;
        case 'exam':
            renderAdminExams();
            break;
        case 'post':
            renderAllPosts();
            if (typeof renderCategories === 'function') {
                renderCategories();
            }
            break;
        case 'lib':
            renderLibrary();
            break;
        case 'set':
            renderConfig();
            if (typeof renderCategories === 'function') {
                renderCategories();
            }
            break;
    }
}

function showModal(id) {
    document.getElementById('modal-' + id).classList.remove('hidden');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    
    if (TIMER_INT) {
        clearInterval(TIMER_INT);
        TIMER_INT = null;
    }
    
    ACTIVE_EXAM = null;
}

