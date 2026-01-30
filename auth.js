// ==================== AUTHENTICATION FUNCTIONS ====================

function togglePass(id, icon) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function toggleAuth(type) {
    ['loginForm', 'regForm', 'adminForm'].forEach(i => {
        document.getElementById(i).classList.add('hidden');
    });
    document.getElementById(type + 'Form').classList.remove('hidden');
}

async function handleAdminLogin() {
    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPassInput').value.trim();
    
    if (!username || !password) {
        alert("অ্যাডমিন আইডি এবং পাসওয়ার্ড দিন");
        return;
    }
    
    const btn = document.querySelector('#adminForm button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    btn.disabled = true;
    
    try {
        const userSnapshot = await db.ref('users/' + username).once('value');
        const user = userSnapshot.val();
        
        if (!user) {
            alert("❌ অ্যাডমিন ইউজার খুঁজে পাওয়া যায়নি");
            return;
        }
        
        if (user.role !== 'admin') {
            alert("❌ এই ইউজার অ্যাডমিন নন");
            return;
        }
        
        if (user.pass !== password) {
            alert("❌ ভুল পাসওয়ার্ড");
            return;
        }
        
        await db.ref('users/' + username + '/lastLogin').set(Date.now());
        
        CURR_USER = {
            id: username,
            ...user
        };
        
        alert("✅ অ্যাডমিন লগইন সফল!\n\nWelcome " + user.name);
        
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        setupAdminFeatures();
        renderApp();
        
    } catch (error) {
        console.error("❌ Admin login error:", error);
        alert("লগইন ত্রুটি: " + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleLogin() {
    const mobile = document.getElementById('loginMobile').value.trim();
    const password = document.getElementById('loginPass').value.trim();
    const remember = document.getElementById('rememberMe').checked;
    
    if (!mobile || !password) {
        alert("মোবাইল নম্বর এবং পাসওয়ার্ড দিন");
        return;
    }
    
    const btn = document.querySelector('#loginForm button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> লগইন হচ্ছে...';
    btn.disabled = true;
    
    try {
        const userSnapshot = await db.ref('users/' + mobile).once('value');
        const user = userSnapshot.val();
        
        if (!user) {
            alert("❌ এই মোবাইল নম্বরে কোন অ্যাকাউন্ট নেই");
            return;
        }
        
        if (user.pass !== password) {
            alert("❌ ভুল পাসওয়ার্ড");
            return;
        }
        
        if (remember) {
            localStorage.setItem('mrds_user', mobile);
            localStorage.setItem('mrds_pass', password);
        } else {
            localStorage.removeItem('mrds_user');
            localStorage.removeItem('mrds_pass');
        }
        
        await db.ref('users/' + mobile + '/lastLogin').set(Date.now());
        
        CURR_USER = {
            id: mobile,
            ...user
        };
        
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        if (user.role === 'admin') {
            setupAdminFeatures();
        }
        
        renderApp();
        
    } catch (error) {
        console.error("❌ Login error:", error);
        alert("লগইন ত্রুটি: " + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const className = document.getElementById('regClass').value;
    const mobile = document.getElementById('regMob').value.trim();
    const password = document.getElementById('regPass').value.trim();
    
    if (!name || !mobile || !password) {
        alert("সব তথ্য পূরণ করুন");
        return;
    }
    
    if (mobile.length !== 11 || !mobile.startsWith('01')) {
        alert("সঠিক মোবাইল নম্বর দিন (11 ডিজিট, 01 দিয়ে শুরু)");
        return;
    }
    
    const userSnapshot = await db.ref('users/' + mobile).once('value');
    if (userSnapshot.exists()) {
        alert("এই মোবাইল নম্বর ইতিমধ্যে রেজিস্টার্ড");
        toggleAuth('login');
        return;
    }
    
    const newUser = {
        name: name,
        pass: password,
        role: 'student',
        bal: 0,
        avatar: '',
        class: className,
        created: Date.now(),
        lastLogin: null
    };
    
    try {
        await db.ref('users/' + mobile).set(newUser);
        alert("✅ রেজিস্ট্রেশন সফল!\n\nআপনার মোবাইল: " + mobile + "\nপাসওয়ার্ড: " + password);
        
        document.getElementById('loginMobile').value = mobile;
        document.getElementById('loginPass').value = password;
        toggleAuth('login');
        
    } catch (error) {
        alert("রেজিস্ট্রেশন ত্রুটি: " + error.message);
    }
}

function setupAdminFeatures() {
    document.getElementById('navAdminBtn').classList.remove('hidden');
    console.log("🛠️ Admin features enabled for:", CURR_USER.name);
}

function logoutConfirm() {
    if (confirm('আপনি কি নিশ্চিত যে লগআউট করতে চান?')) {
        logout();
    }
}

function logout() {
    CURR_USER = null;
    localStorage.removeItem('mrds_user');
    localStorage.removeItem('mrds_pass');
    location.reload();
}

