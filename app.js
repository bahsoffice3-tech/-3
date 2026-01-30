// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw",
    authDomain: "dhumketu2-fa6f0.firebaseapp.com",
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com/", // আপনার সঠিক ডাটাবেস লিঙ্ক
    projectId: "dhumketu2-fa6f0",
    storageBucket: "dhumketu2-fa6f0.firebasestorage.app",
    messagingSenderId: "147816672419",
    appId: "1:147816672419:web:e66ab7159d97e0ccb62316",
    measurementId: "G-HYGZWJ772Q"
};

// ==================== GLOBAL VARIABLES ====================
let CURR_USER = null;
let DB_DATA = null;
let ACTIVE_EXAM = null;
let TIMER_INT = null;
let EDITING_EXAM_ID = null;
const IMGBB_KEY = 'a6b5ca76210be29fd294f56e3681660f';

// ==================== DATABASE MODULE ====================
const Database = {
    db: null, // এটি পরে initialize করা হবে

    async initialize() {
        try {
            this.db = firebase.database(); // DB এখান থেকে সেট হবে
            console.log("📡 Checking database...");
            const snapshot = await this.db.ref().once('value');
            const data = snapshot.val();
            
            if (!data || !data.users || !data.config) {
                console.log("📦 Initializing database with default data...");
                await this.setupDefaultDatabase();
            } else {
                console.log("✅ Database already initialized");
                DB_DATA = data;
            }
            
            return true;
        } catch (error) {
            console.error("❌ Database initialization error:", error);
            throw error;
        }
    },

    async setupDefaultDatabase() {
        const defaultData = {
            config: {
                notice: "🎉 Welcome to Dhumketu Education Platform!",
                bkash: "01700000000",
                nagad: "01800000000",
                minDep: 50,
                minWd: 100,
                lastUpdated: Date.now()
            },
            categories: {
                'cat1': 'General',
                'cat2': 'Exam',
                'cat3': 'Result',
                'cat4': 'Notice'
            },
            users: {
                'admin': {
                    name: 'System Administrator',
                    pass: '1234',
                    role: 'admin',
                    bal: 0,
                    avatar: '',
                    class: 'Admin',
                    created: Date.now(),
                    lastLogin: null
                },
                '01700000000': {
                    name: 'ডেমো শিক্ষার্থী',
                    pass: '1234',
                    role: 'student',
                    bal: 100,
                    avatar: '',
                    class: 'Class 10',
                    created: Date.now(),
                    lastLogin: null
                }
            },
            posts: {
                'post1': {
                    t: 'স্বাগতম Dhumketu এ!',
                    c: 'এটি একটি ডেমো পোস্ট।',
                    img: '',
                    link: '',
                    linkTxt: '',
                    category: 'General',
                    timestamp: Date.now()
                }
            },
            exams: {},
            library: {},
            txs: {},
            results: {},
            msgs: {},
            gifts: {}
        };

        try {
            await this.db.ref().set(defaultData);
            console.log("✅ Default database setup completed");
            DB_DATA = defaultData;
            return true;
        } catch (error) {
            console.error("❌ Database setup failed:", error);
            return false;
        }
    },

    async refreshData() {
        try {
            const snapshot = await this.db.ref().once('value');
            DB_DATA = snapshot.val();
            return DB_DATA;
        } catch (error) {
            console.error("Refresh data error:", error);
            return null;
        }
    }
};

// ==================== AUTHENTICATION MODULE ====================
const Auth = {
    async handleLogin() {
        const mobile = document.getElementById('loginMobile').value.trim();
        const password = document.getElementById('loginPass').value.trim();
        const remember = document.getElementById('rememberMe').checked;
        
        if (!mobile || !password) {
            alert("মোবাইল নম্বর এবং পাসওয়ার্ড দিন");
            return;
        }
        
        const btn = document.querySelector('#loginForm button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> লগইন হচ্ছে...';
        btn.disabled = true;
        
        try {
            const userSnapshot = await Database.db.ref('users/' + mobile).once('value');
            const user = userSnapshot.val();
            
            if (!user) {
                alert("❌ এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট নেই");
                return;
            }
            
            if (user.pass !== password) {
                alert("❌ ভুল পাসওয়ার্ড");
                return;
            }
            
            if (remember) {
                localStorage.setItem('dhumketu_user', mobile);
                localStorage.setItem('dhumketu_pass', password);
            } else {
                localStorage.removeItem('dhumketu_user');
                localStorage.removeItem('dhumketu_pass');
            }
            
            await Database.db.ref('users/' + mobile + '/lastLogin').set(Date.now());
            
            CURR_USER = {
                id: mobile,
                ...user
            };
            
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            
            if (user.role === 'admin') {
                Admin.setupAdminFeatures();
            }
            
            App.render();
            
        } catch (error) {
            console.error("❌ Login error:", error);
            alert("লগইন ত্রুটি: " + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async handleAdminLogin() {
        const username = document.getElementById('adminUser').value.trim();
        const password = document.getElementById('adminPassInput').value.trim();
        
        if (!username || !password) {
            alert("অ্যাডমিন আইডি এবং পাসওয়ার্ড দিন");
            return;
        }
        
        const btn = document.querySelector('#adminForm button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> চেকিং...';
        btn.disabled = true;
        
        try {
            const userSnapshot = await Database.db.ref('users/' + username).once('value');
            const user = userSnapshot.val();
            
            if (!user) {
                alert("❌ অ্যাডমিন ইউজার খুঁজে পাওয়া যায়নি");
                return;
            }
            
            if (user.role !== 'admin') {
                alert("❌ এই ইউজার অ্যাডমিন নন");
                return;
            }
            
            if (user.pass !== password) {
                alert("❌ ভুল পাসওয়ার্ড");
                return;
            }
            
            await Database.db.ref('users/' + username + '/lastLogin').set(Date.now());
            
            CURR_USER = {
                id: username,
                ...user
            };
            
            alert("✅ অ্যাডমিন লগইন সফল!\n\nWelcome " + user.name);
            
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            
            Admin.setupAdminFeatures();
            App.render();
            
        } catch (error) {
            console.error("❌ Admin login error:", error);
            alert("লগইন ত্রুটি: " + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    async handleRegister() {
        const name = document.getElementById('regName').value.trim();
        const className = document.getElementById('regClass').value;
        const mobile = document.getElementById('regMob').value.trim();
        const password = document.getElementById('regPass').value.trim();
        
        if (!name || !mobile || !password) {
            alert("সব তথ্য পূরণ করুন");
            return;
        }
        
        if (mobile.length !== 11 || !mobile.startsWith('01')) {
            alert("সঠিক মোবাইল নম্বর দিন (11 ডিজিট, 01 দিয়ে শুরু)");
            return;
        }
        
        const userSnapshot = await Database.db.ref('users/' + mobile).once('value');
        if (userSnapshot.exists()) {
            alert("এই মোবাইল নম্বর ইতিমধ্যে রেজিস্টার্ড");
            this.toggleForm('login');
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
            await Database.db.ref('users/' + mobile).set(newUser);
            alert("✅ রেজিস্ট্রেশন সফল!\n\nআপনার মোবাইল: " + mobile + "\nপাসওয়ার্ড: " + password);
            
            document.getElementById('loginMobile').value = mobile;
            document.getElementById('loginPass').value = password;
            this.toggleForm('login');
            
        } catch (error) {
            alert("রেজিস্ট্রেশন ত্রুটি: " + error.message);
        }
    },

    async checkRememberedUser() {
        const savedUser = localStorage.getItem('dhumketu_user');
        const savedPass = localStorage.getItem('dhumketu_pass');
        
        if (savedUser && savedPass) {
            document.getElementById('loginMobile').value = savedUser;
            document.getElementById('loginPass').value = savedPass;
            document.getElementById('rememberMe').checked = true;
        }
    },

    toggleForm(formType) {
        ['loginForm', 'regForm', 'adminForm'].forEach(form => {
            document.getElementById(form).classList.add('hidden');
        });
        document.getElementById(formType + 'Form').classList.remove('hidden');
    },

    togglePassword(fieldId, icon) {
        const input = document.getElementById(fieldId);
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
};

// ==================== UI MODULE ====================
const UI = {
    updateUserInfo() {
        if (!CURR_USER) return;
        
        document.getElementById('navName').innerText = CURR_USER.name;
        document.getElementById('profileName').innerText = CURR_USER.name;
        document.getElementById('navBal').innerText = `৳${CURR_USER.bal || 0}`;
        document.getElementById('walletBigBal').innerText = `৳${CURR_USER.bal || 0}`;
        document.getElementById('navAvatar').src = CURR_USER.avatar || 'https://via.placeholder.com/40';
        document.getElementById('profileAvatar').src = CURR_USER.avatar || 'https://via.placeholder.com/100';
        document.getElementById('profileMobile').innerText = CURR_USER.id;
        document.getElementById('profileClass').innerText = CURR_USER.class || 'Student';
        
        if (DB_DATA && DB_DATA.config) {
            document.getElementById('marqueeText').innerHTML = 
                `<i class="fas fa-bullhorn"></i> ${DB_DATA.config.notice || 'Welcome to Dhumketu'}`;
        }
    },

    renderConfig() {
        // This function handles displaying config data if you have specific UI elements for it
    }
};

// ==================== NAVIGATION MODULE ====================
const Navigation = {
    currentView: 'home',

    async switchView(view, button) {
        this.currentView = view;
        
        document.querySelectorAll('.view').forEach(v => {
            v.classList.add('hidden');
        });
        
        const viewElement = document.getElementById(`view-${view}`);
        if(viewElement) viewElement.classList.remove('hidden');
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (button) {
            button.classList.add('active');
            const span = button.querySelector('span');
            if(span) document.getElementById('headerTitle').innerText = span.innerText;
        }
        
        await this.refreshViewData(view);
    },

    async refreshViewData(view) {
        try {
            await Database.refreshData();
            
            if (DB_DATA) {
                if (DB_DATA.users && CURR_USER && DB_DATA.users[CURR_USER.id]) {
                    CURR_USER.bal = DB_DATA.users[CURR_USER.id].bal;
                    UI.updateUserInfo();
                }
                
                switch (view) {
                    case 'home':
                        Posts.render();
                        Posts.renderCategories();
                        break;
                    case 'exam':
                        Exams.renderUserExams();
                        break;
                    case 'library':
                        Library.render();
                        break;
                    case 'wallet':
                        Wallet.renderTransactions();
                        break;
                    case 'profile':
                        Messages.renderUserMessages();
                        break;
                    case 'admin':
                        if (CURR_USER?.role === 'admin') {
                            Admin.renderDashboard();
                        }
                        break;
                }
            }
        } catch (error) {
            console.error("Refresh view data error:", error);
        }
    }
};

// ==================== POSTS MODULE ====================
const Posts = {
    async render() {
        const container = document.getElementById('postsContainer');
        if (!container) return;

        if (!DB_DATA || !DB_DATA.posts) {
            container.innerHTML = `
                <div class="card text-center p-6">
                    <i class="fas fa-newspaper fa-3x text-light mb-4"></i>
                    <p class="text-light">কোনো নিউজ বা নোটিশ নেই</p>
                </div>
            `;
            return;
        }

        const posts = DB_DATA.posts;
        container.innerHTML = '';
        
        Object.entries(posts)
            .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(([id, post]) => {
                this.renderPost(container, id, post);
            });
    },

    renderPost(container, id, post) {
        const isEnglish = /[a-zA-Z]/.test(post.t || '') || /[a-zA-Z]/.test(post.c || '');
        const category = post.category || 'General';
        const dateStr = post.timestamp ? this.formatDate(post.timestamp) : '';

        const html = `
            <div class="post-card" data-category="${category}">
                <div class="post-header" onclick="Posts.togglePost('${id}')">
                    <div class="post-title-wrapper">
                        <span class="category-badge">${category}</span>
                        <div class="post-title-row">
                            <h3 class="post-title">${post.t || post.title || 'Untitled'}</h3>
                        </div>
                        <div class="post-date">
                            <i class="far fa-clock"></i> ${dateStr}
                        </div>
                    </div>
                    <i class="fas fa-chevron-down post-expand-icon" id="post-icon-${id}"></i>
                </div>
                
                <div class="post-content" id="post-content-${id}">
                    ${this.renderPostContent(post)}
                </div>
            </div>
        `;
        
        container.innerHTML += html;
    },

    renderPostContent(post) {
        let imgHtml = '';
        if (post.img) {
            imgHtml = `<img src="${post.img}" class="post-image" alt="Post Image">`;
        }

        let linkHtml = '';
        if (post.link) {
            linkHtml = `
                <a href="${post.link}" target="_blank" class="post-link">
                    ${post.linkTxt || 'লিংক খুলুন'} <i class="fas fa-external-link-alt"></i>
                </a>
            `;
        }

        return `
            <p class="post-text">${post.c || post.content || ''}</p>
            ${imgHtml}
            ${linkHtml}
        `;
    },

    togglePost(postId) {
        const content = document.getElementById(`post-content-${postId}`);
        const icon = document.getElementById(`post-icon-${postId}`);
        
        content.classList.toggle('expanded');
        icon.classList.toggle('expanded');
        
        if (content.classList.contains('expanded')) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    },

    async filterPosts(category, button) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const posts = document.querySelectorAll('.post-card');
        posts.forEach(post => {
            const postCat = post.getAttribute('data-category');
            if (category === 'All' || postCat === category) {
                post.classList.remove('hidden');
            } else {
                post.classList.add('hidden');
            }
        });
    },

    async renderCategories() {
        const categories = DB_DATA?.categories || { 'def': 'General' };
        const filterContainer = document.getElementById('postFilterContainer');
        
        if (!filterContainer) return;
        
        let html = `<button class="filter-btn active" onclick="Posts.filterPosts('All', this)">সব</button>`;
        Object.values(categories).forEach(cat => {
            html += `<button class="filter-btn" onclick="Posts.filterPosts('${cat}', this)">${cat}</button>`;
        });
        
        filterContainer.innerHTML = html;
    },

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// ==================== EXAMS MODULE ====================
const Exams = {
    async renderUserExams() {
        const container = document.getElementById('examList');
        if (!container || !DB_DATA || !DB_DATA.exams) return;
        
        container.innerHTML = '';
        const now = new Date();
        const userClass = CURR_USER.class || 'Class 10';
        const allResults = DB_DATA.results || {};

        const sortedExams = Object.entries(DB_DATA.exams).sort(([,a], [,b]) => {
            return new Date(b.start) - new Date(a.start);
        });

        sortedExams.forEach(([id, exam]) => {
            const examCard = this.createExamCard(id, exam, now, userClass, allResults);
            container.innerHTML += examCard;
        });

        if (sortedExams.length === 0) {
            container.innerHTML = `
                <div class="card text-center p-6">
                    <i class="fas fa-clipboard-list fa-3x text-light mb-4"></i>
                    <p class="text-light">কোনো পরীক্ষা নেই</p>
                </div>
            `;
        }
    },

    createExamCard(id, exam, now, userClass, allResults) {
        const start = new Date(exam.start);
        const end = new Date(exam.end);
        
        const status = this.getExamStatus(now, start, end);
        const statusClass = this.getStatusClass(status);
        const myResult = Object.values(allResults).find(r => r.eid === id && r.uid === CURR_USER.id);
        const isJoined = !!myResult;
        const totalParticipants = Object.values(allResults).filter(r => r.eid === id).length;

        return `
            <div class="exam-card">
                ${this.renderExamHeader(id, exam, status, statusClass)}
                ${this.renderExamBody(id, exam, status, myResult, totalParticipants)}
                ${this.renderExamFooter(id, exam, status, isJoined, myResult, userClass)}
            </div>
        `;
    },

    getExamStatus(now, start, end) {
        if (now < start) return 'Upcoming';
        if (now >= start && now <= end) return 'Live';
        return 'Ended';
    },

    getStatusClass(status) {
        const classes = {
            'Upcoming': 'status-upcoming',
            'Live': 'status-live',
            'Ended': 'status-ended'
        };
        return classes[status] || 'status-ended';
    },

    renderExamHeader(id, exam, status, statusClass) {
        return `
            <div class="exam-header">
                <div class="exam-id">
                    <i class="fas fa-graduation-cap text-primary"></i>
                    <span>${id}</span>
                </div>
                <span class="status-badge ${statusClass}">${status}</span>
            </div>
        `;
    },

    renderExamBody(id, exam, status, myResult, totalParticipants) {
        const scoreSection = myResult ? this.renderScoreSection(myResult) : '';
        const timeSection = this.renderTimeSection(exam);

        return `
            <div class="exam-body">
                <h3 class="exam-title">${exam.title}</h3>
                <div class="exam-tags">
                    <span class="exam-tag">${exam.class}</span>
                    <span class="exam-tag">Time: ${exam.dur} min</span>
                    <span class="exam-tag">Fee: ${exam.fee > 0 ? '৳'+exam.fee : 'Free'}</span>
                    ${exam.prize > 0 ? `<span class="exam-tag">Prize: ৳${exam.prize}</span>` : ''}
                </div>
                ${scoreSection}
                ${timeSection}
            </div>
        `;
    },

    renderScoreSection(result) {
        return `
            <div class="score-box">
                <div class="score-info">
                    <div class="score-label">আপনার প্রাপ্ত নম্বর</div>
                    <div class="score-value">${result.score} / ${result.total}</div>
                </div>
                <div class="score-status">সম্পন্ন</div>
            </div>
        `;
    },

    renderTimeSection(exam) {
        const startStr = new Date(exam.start).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const endStr = new Date(exam.end).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `
            <div class="exam-grid">
                <div class="grid-item">
                    <div class="grid-label">শুরু</div>
                    <div class="grid-value">${startStr}</div>
                </div>
                <div class="grid-item">
                    <div class="grid-label">শেষ</div>
                    <div class="grid-value">${endStr}</div>
                </div>
            </div>
        `;
    },

    renderExamFooter(id, exam, status, isJoined, myResult, userClass) {
        let buttons = '';
        
        if (status !== 'Upcoming') {
            buttons += `
                <button class="btn btn-outline btn-sm" onclick="Exams.viewLeaderboard('${id}')">
                    <i class="fas fa-users"></i> লিস্ট (${Object.values(DB_DATA.results || {}).filter(r => r.eid === id).length})
                </button>
            `;
        }

        if (isJoined) {
            if (status === 'Ended') {
                buttons += `
                    <button class="btn btn-primary btn-sm" onclick="Exams.viewResult('${id}')">
                        <i class="fas fa-eye"></i> উত্তরপত্র
                    </button>
                `;
            } else {
                buttons += `
                    <button class="btn btn-outline btn-sm" disabled>
                        <i class="fas fa-check"></i> সম্পন্ন
                    </button>
                `;
            }
        } else {
            if (status === 'Live' && (exam.class === 'All' || exam.class === userClass)) {
                buttons += `
                    <button class="btn btn-danger btn-sm" onclick="Exams.startExam('${id}')">
                        <i class="fas fa-play"></i> পরীক্ষা দিন
                    </button>
                `;
            }
        }

        return `
            <div class="exam-footer">
                ${buttons}
            </div>
        `;
    },

    async startExam(examId) {
        if (!CURR_USER) return alert("Please login first");

        try {
            const snap = await Database.db.ref('exams/' + examId).once('value');
            const exam = snap.val();
            
            if (!exam) return alert("Exam not found or deleted");

            // Check time
            const now = new Date();
            const start = new Date(exam.start);
            const end = new Date(exam.end);

            if (now < start) return alert("Exam has not started yet!");
            if (now > end) return alert("Exam has ended!");

            // Check fee
            if (exam.fee > 0) {
                if (CURR_USER.bal < exam.fee) return alert("Insufficient Balance! Please Deposit.");
                
                if (!confirm(`Exam Fee: ৳${exam.fee}. Do you want to continue?`)) return;
                
                await Database.db.ref('users/' + CURR_USER.id + '/bal').set(CURR_USER.bal - exam.fee);
                CURR_USER.bal -= exam.fee;
                UI.updateUserInfo();
            }

            // Start exam
            if (exam.mode === 'Google') {
                window.open(exam.link, '_blank');
            } else {
                ACTIVE_EXAM = { id: examId, ...exam };
                ExamInterface.start();
            }

        } catch (error) {
            console.error("Start exam error:", error);
            alert("Error starting exam: " + error.message);
        }
    },

    async viewResult(examId) {
        alert("Result feature coming soon!");
    },

    async viewLeaderboard(examId) {
        alert("Leaderboard feature coming soon!");
    }
};

// ==================== EXAM INTERFACE MODULE ====================
const ExamInterface = {
    async start() {
        if (!ACTIVE_EXAM) return;
        
        // This assumes you have a modal or section to show exam questions
        // Simplified for this version
        alert("Starting exam: " + ACTIVE_EXAM.title + "\n(Interface pending implementation in HTML)");
        // Normally calls Modal.showExam() and renders questions
    },
    
    // ... Additional exam logic (renderQuestions, submit, timer) ...
};

// ==================== LIBRARY MODULE ====================
const Library = {
    async render() {
        const container = document.getElementById('libList');
        if (!container || !DB_DATA || !DB_DATA.library) return;
        
        container.innerHTML = '';
        const library = DB_DATA.library;
        
        if (Object.keys(library).length === 0) {
            container.innerHTML = `
                <div class="card text-center p-6">
                    <i class="fas fa-book fa-3x text-light mb-4"></i>
                    <p class="text-light">কোনো লাইব্রেরি আইটেম নেই</p>
                </div>
            `;
            return;
        }
        
        Object.values(library).forEach(item => {
            const icon = item.type === 'Video' ? 'fa-video' : 'fa-file-pdf';
            const color = item.type === 'Video' ? 'danger' : 'primary';
            
            container.innerHTML += `
                <div class="card">
                    <div class="flex items-center gap-3">
                        <i class="fas ${icon} fa-2x text-${color}"></i>
                        <div class="flex-1">
                            <h4 class="font-bold">${item.title}</h4>
                            <p class="text-xs text-light">${item.type}</p>
                        </div>
                        <a href="${item.link}" target="_blank" class="btn btn-outline btn-sm">
                            Open
                        </a>
                    </div>
                </div>
            `;
        });
    }
};

// ==================== WALLET MODULE ====================
const Wallet = {
    async renderTransactions() {
        const container = document.getElementById('txHistory');
        if (!container || !DB_DATA || !DB_DATA.txs) return;
        
        container.innerHTML = '';
        const transactions = DB_DATA.txs;
        
        if (Object.keys(transactions).length === 0) {
            container.innerHTML = `
                <div class="card text-center p-6">
                    <i class="fas fa-history fa-3x text-light mb-4"></i>
                    <p class="text-light">কোনো লেনদেন ইতিহাস নেই</p>
                </div>
            `;
            return;
        }
        
        Object.entries(transactions)
            .filter(([, t]) => t.uid === CURR_USER.id)
            .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(([id, t]) => {
                const statusClass = t.status === 'Pending' ? 'warning' : 
                                  t.status === 'Approved' ? 'success' : 'danger';
                
                container.innerHTML += `
                    <div class="transaction-card">
                        <div class="transaction-info">
                            <div class="transaction-type">${t.type}</div>
                            <div class="transaction-details">${t.method || ''} ${t.trx ? '| ' + t.trx : ''}</div>
                        </div>
                        <div class="text-right">
                            <div class="transaction-amount">৳${t.amount}</div>
                            <span class="transaction-status bg-${statusClass}-50 text-${statusClass}-700">
                                ${t.status}
                            </span>
                        </div>
                    </div>
                `;
            });
    }
    // ... Request Deposit/Withdraw functions ...
};

// ==================== MESSAGES MODULE ====================
const Messages = {
    async sendUserMessage() {
        const input = document.getElementById('userMsgInput');
        const text = input.value.trim();
        
        if (!text) return alert("মেসেজ লিখুন!");

        const btn = document.querySelector('#view-profile .btn');
        // Simple loading state
        btn.disabled = true;

        try {
            const msgData = {
                uid: CURR_USER.id,
                name: CURR_USER.name,
                text: text,
                reply: "",
                time: Date.now()
            };

            await Database.db.ref('msgs').push(msgData);
            input.value = '';
            this.renderUserMessages();
            
        } catch (error) {
            console.error("Message error:", error);
            alert("মেসেজ পাঠানো যায়নি!");
        } finally {
            btn.disabled = false;
        }
    },

    renderUserMessages() {
        const container = document.getElementById('userMsgList');
        if (!container || !DB_DATA || !DB_DATA.msgs) return;
        
        container.innerHTML = '';
        const messages = DB_DATA.msgs;
        
        const myMsgs = Object.entries(messages)
            .filter(([, m]) => m.uid === CURR_USER.id)
            .sort(([, a], [, b]) => b.time - a.time);

        myMsgs.forEach(([id, m]) => {
            const timeStr = new Date(m.time).toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            container.innerHTML += `
                <div class="message-card">
                    <div class="message-header">
                        <span class="message-sender">You</span>
                        <span class="message-time">${timeStr}</span>
                    </div>
                    <div class="message-text">${m.text}</div>
                    ${m.reply ? 
                        `<div class="message-reply">
                            <div class="reply-label">Admin Reply</div>
                            <div class="reply-text">${m.reply}</div>
                        </div>` :
                        `<div class="text-xs text-warning mt-1">
                            <i class="far fa-clock"></i> Waiting for reply
                        </div>`
                    }
                </div>
            `;
        });
    }
};

// ==================== PROFILE MODULE ====================
const Profile = {
    toggleEditSection() {
        const section = document.getElementById('editSection');
        if(section) section.classList.toggle('hidden');
    },

    async updateProfile() {
        // Implementation for profile update
        alert("Profile update logic here");
    }
};

// ==================== MODAL MODULE ====================
const Modal = {
    show(modalId) {
        const modal = document.getElementById(`modal-${modalId}`);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    closeAll() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = 'auto';
    }
};

// ==================== UTILITIES MODULE ====================
const Utils = {
    // Utility functions like uploadImage, copyToClipboard
};

// ==================== ADMIN MODULE ====================
const Admin = {
    setupAdminFeatures() {
        const adminBtn = document.getElementById('navAdminBtn');
        if(adminBtn) adminBtn.classList.remove('hidden');
        console.log("🛠️ Admin features enabled");
    },
    
    renderDashboard() {
        console.log("Admin Dashboard Rendered");
    }
};

// ==================== APP MAIN MODULE ====================
const App = {
    async render() {
        if (!CURR_USER) return;
        
        console.log("🎨 Rendering app for:", CURR_USER.name);
        
        try {
            await Database.refreshData();
            UI.updateUserInfo();
            UI.renderConfig();
            
            // Initial render based on current view
            const currentView = Navigation.currentView;
            await Navigation.refreshViewData(currentView);
            
        } catch (error) {
            console.error("❌ Render error:", error);
        }
    },

    logoutConfirm() {
        if (confirm('আপনি কি নিশ্চিত যে লগআউট করতে চান?')) {
            this.logout();
        }
    },

    logout() {
        CURR_USER = null;
        localStorage.removeItem('dhumketu_user');
        localStorage.removeItem('dhumketu_pass');
        location.reload();
    }
};

// ==================== APP INITIALIZATION (এটি সবার শেষে থাকবে) ====================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Firebase
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("🔥 Firebase initialized");
        } else if (typeof firebase === 'undefined') {
             throw new Error("Firebase SDK not loaded. Check internet connection.");
        }

        // Initialize Database (এখন এটি কাজ করবে কারণ Database উপরে ডিফাইন করা আছে)
        await Database.initialize();
        
        // Check Login
        await Auth.checkRememberedUser();
        
    } catch (error) {
        console.error("Init Error:", error);
        alert("Error Details: " + error.message); 
   }
});

// ==================== GLOBAL EXPORTS ====================
window.Auth = Auth;
window.Navigation = Navigation;
window.Posts = Posts;
window.Exams = Exams;
window.ExamInterface = ExamInterface;
window.Modal = Modal;
window.Profile = Profile;
window.Wallet = Wallet;
window.Messages = Messages;
window.Admin = Admin;
window.App = App;
window.Database = Database;

// Initialize MathJax if available
if (window.MathJax) {
    window.MathJax.typesetPromise().catch((err) => console.log('MathJax typeset error:', err));
}
