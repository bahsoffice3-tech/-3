// ==================== ADMIN FUNCTIONS ====================
async function renderAdminDashboard() {
    if (!DB_DATA) return;
    
    renderAdminUsers();
    renderAdminPayments();
    renderAdminMessages();
    renderAdminExams();
    renderAllPosts();
}

// ৩. অ্যাডমিন মেসেজ লিস্ট (Admin View)
function renderAdminMessages() {
    const container = document.getElementById('admMsgList');
    if (!container || !DB_DATA || !DB_DATA.msgs) {
        container.innerHTML = '<p class="text-center text-light">কোনো মেসেজ নেই</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // সব মেসেজ লোড (নতুন আগে)
    const allMsgs = Object.entries(DB_DATA.msgs).sort(([, a], [, b]) => b.time - a.time);
    
    allMsgs.forEach(([id, m]) => {
        const timeStr = new Date(m.time).toLocaleDateString() + ' ' + new Date(m.time).toLocaleTimeString();
        
        container.innerHTML += `
            <div class="card" style="border-left: 3px solid ${m.reply ? '#10b981' : '#f59e0b'};">
                <div class="flex flex-between mb-1">
                    <div>
                        <b style="font-size:0.9rem;">${m.name}</b>
                        <span class="text-xs text-light">(${m.uid})</span>
                    </div>
                    <span class="text-xs text-light">${timeStr}</span>
                </div>
                
                <div class="bg-gray-50 p-2 rounded mb-2 text-sm">
                    ${m.text}
                </div>

                ${m.reply ? `
                    <div class="text-xs text-success">
                        <i class="fas fa-check-circle"></i> রিপ্লাই দেওয়া হয়েছে: ${m.reply}
                    </div>
                ` : `
                    <div class="flex gap-2">
                        <input type="text" id="rep-${id}" placeholder="রিপ্লাই লিখুন..." style="margin-bottom:0; font-size:0.85rem;">
                        <button class="btn btn-sm w-auto" onclick="admReply('${id}')">Send</button>
                    </div>
                `}
            </div>
        `;
    });
}

// ৪. অ্যাডমিন রিপ্লাই লজিক
async function admReply(msgId) {
    const input = document.getElementById(`rep-${msgId}`);
    const replyText = input.value.trim();
    
    if (!replyText) return alert("রিপ্লাই খালি রাখা যাবে না!");

    const btn = input.nextElementSibling;
    btn.innerText = "...";
    btn.disabled = true;

    try {
        // ডাটাবেস আপডেট
        await db.ref('msgs/' + msgId).update({
            reply: replyText
        });

        // লোকাল আপডেট
        if (DB_DATA.msgs && DB_DATA.msgs[msgId]) {
            DB_DATA.msgs[msgId].reply = replyText;
        }

        alert("✅ রিপ্লাই পাঠানো হয়েছে!");
        renderAdminMessages(); // লিস্ট রিফ্রেশ

    } catch (error) {
        console.error(error);
        alert("এরর: " + error.message);
    }
}

function renderAllPosts() {
    const container = document.getElementById('allPostsList');
    if (!container || !DB_DATA || !DB_DATA.posts) return;
    
    container.innerHTML = '';
    const posts = DB_DATA.posts;
    
    if (Object.keys(posts).length === 0) {
        container.innerHTML = '<div class="card text-center p-4"><p class="text-light">No posts yet</p></div>';
        return;
    }
    
    Object.entries(posts)
        .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))
        .forEach(([id, post]) => {
            const dateStr = post.timestamp ? new Date(post.timestamp).toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : '';
            
            const shortContent = (post.c || '').substring(0, 100) + ((post.c || '').length > 100 ? '...' : '');
            
            container.innerHTML += `
                <div class="card mb-3">
                    <div class="flex flex-between items-start">
                        <div style="flex: 1;">
                            <b>${post.t || post.title || 'Untitled'}</b>
                            <div class="text-xs text-light mb-2">${dateStr}</div>
                            <div class="text-sm text-light" style="white-space: pre-wrap;">${shortContent}</div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm" onclick="editPost('${id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deletePost('${id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
}

function renderAdminUsers() {
    const container = document.getElementById('admUserList');
    if (!container || !DB_DATA || !DB_DATA.users) return;
    
    container.innerHTML = '';
    const users = DB_DATA.users;
    
    const students = Object.entries(users)
        .filter(([mobile, user]) => user.role === 'student')
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));
    
    if (students.length === 0) {
        container.innerHTML = '<div class="card text-center p-4"><p class="text-light">No students found</p></div>';
        return;
    }
    
    students.forEach(([mobile, user]) => {
        container.innerHTML += `
            <div class="card student-card">
                <div class="flex gap-3 items-center">
                    <img src="${user.avatar || 'https://via.placeholder.com/50'}" 
                         class="profile-pic-small"
                         onerror="this.src='https://via.placeholder.com/50'">
                    <div class="flex-1">
                        <div class="flex flex-between items-start">
                            <div>
                                <b>${user.name}</b>
                                <div class="text-xs text-light">${mobile}</div>
                            </div>
                            <span class="font-bold text-primary">৳${user.bal || 0}</span>
                        </div>
                        <div class="flex flex-between items-center mt-2">
                            <span class="class-badge">${user.class || 'Not set'}</span>
                            <div class="flex gap-2">
                                <button class="btn btn-sm btn-outline" onclick="editStudent('${mobile}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteStudent('${mobile}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function editStudent(mobile) {
    const user = DB_DATA.users[mobile];
    
    if (!user) {
        alert("User data not found!");
        return;
    }

    document.getElementById('editUserMobile').value = mobile;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserClass').value = user.class || 'Class 10';
    document.getElementById('editUserBal').value = user.bal;
    document.getElementById('editUserPass').value = user.pass;
    
    const imgPreview = document.getElementById('editUserAvatar');
    if (imgPreview) {
        imgPreview.src = user.avatar || 'https://via.placeholder.com/50';
    }
    
    document.getElementById('editUserPicFile').value = '';
    showModal('edit-user');
}

function renderAdminPayments() {
    const pendingList = document.getElementById('admPayList');
    const historyList = document.getElementById('admPayHistory');
    
    if (!pendingList || !historyList || !DB_DATA || !DB_DATA.txs) return;
    
    pendingList.innerHTML = '';
    historyList.innerHTML = '';
    
    const transactions = DB_DATA.txs;
    
    if (Object.keys(transactions).length === 0) return;
    
    Object.entries(transactions)
        .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))
        .forEach(([id, t]) => {
            const html = `
                <div class="card">
                    <div class="flex flex-between">
                        <div>
                            <b>${t.type}</b>
                            <div class="text-xs text-light">${t.uid} | ${t.method || ''}</div>
                        </div>
                        <b>৳${t.amount}</b>
                    </div>
                    <div class="text-xs text-light mb-2">${t.trx || ''}</div>
                    <div class="status-badge st-${t.status}">${t.status}</div>
                    ${t.status === 'Pending' ? `
                        <div class="flex gap-2 mt-2">
                            <button class="btn btn-success btn-sm" onclick="admTx('${id}', true)">
                                Approve
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="admTx('${id}', false)">
                                Reject
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            
            if (t.status === 'Pending') {
                pendingList.innerHTML += html;
            } else {
                historyList.innerHTML += html;
            }
        });
}

function renderAdminExams() {
    const container = document.getElementById('admExList');
    if (!container || !DB_DATA || !DB_DATA.exams) return;
    
    container.innerHTML = '';
    const exams = DB_DATA.exams;
    
    if (Object.keys(exams).length === 0) {
        container.innerHTML = '<div class="card text-center p-4"><p class="text-light">No exams created yet</p></div>';
        return;
    }
    
    Object.entries(exams).forEach(([id, exam]) => {
        container.innerHTML += `
            <div class="card flex flex-between">
                <div>
                    <b>${exam.title}</b>
                    <div class="text-xs text-light">${exam.class} | ${exam.mode} | Fee: ৳${exam.fee || 0} | Prize: ৳${exam.prize || 0}</div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-sm" onclick="editExam('${id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="viewAttendees('${id}')">
                        <i class="fas fa-users"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteExam('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

// VIEW ATTENDEES (ADMIN)
async function viewAttendees(examId) {
    const btn = document.activeElement;
    let oldIcon = '';
    if(btn) {
        oldIcon = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
    }

    try {
        const resSnap = await db.ref('results').orderByChild('eid').equalTo(examId).once('value');
        const results = resSnap.val();

        const examSnap = await db.ref('exams/' + examId).once('value');
        const exam = examSnap.val();
        const examTitle = exam ? exam.title : 'Exam';

        const userSnap = await db.ref('users').once('value');
        const allUsers = userSnap.val() || {};

        const container = document.getElementById('attendeeListContent');
        const titleElem = document.getElementById('attendeeTitle');
        
        if(titleElem) titleElem.innerText = `${examTitle} - Participants`;

        if (!results) {
            container.innerHTML = '<div class="text-center p-4 text-light">Ekhono keu ongshogrohon koreni.</div>';
            showModal('attendees');
            return;
        }

        let html = `
            <div style="max-height: 400px; overflow-y: auto;">
                <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead style="background: #f3f4f6; text-align: left; position: sticky; top: 0;">
                        <tr>
                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Rank</th>
                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Name & ID</th>
                            <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align:right;">Score</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const sortedList = Object.values(results).sort((a, b) => b.score - a.score);

        sortedList.forEach((res, index) => {
            const student = allUsers[res.uid] || { name: 'Unknown', mobile: res.uid };
            
            let rank = index + 1;
            let rankStyle = 'background:#e0e7ff; color:#4338ca;';
            if(rank === 1) rankStyle = 'background:#fef9c3; color:#a16207; border:1px solid #fde047;';
            if(rank === 2) rankStyle = 'background:#f3f4f6; color:#4b5563; border:1px solid #d1d5db;';
            if(rank === 3) rankStyle = 'background:#ffedd5; color:#9a3412; border:1px solid #fed7aa;';

            html += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">
                        <span style="display:inline-block; width:25px; height:25px; line-height:25px; text-align:center; border-radius:50%; font-weight:bold; font-size:0.8rem; ${rankStyle}">
                            ${rank}
                        </span>
                    </td>
                    <td style="padding: 10px;">
                        <div style="font-weight:600; color:#1e293b;">${student.name}</div>
                        <div style="font-size:0.75rem; color:#64748b;">${res.uid}</div>
                    </td>
                    <td style="padding: 10px; text-align:right;">
                        <div style="font-weight:bold; color:#16a34a; font-size:1rem;">${res.score}/${res.total}</div>
                        <div style="font-size:0.7rem; color:#94a3b8;">${res.percentage}%</div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
        showModal('attendees');

    } catch (error) {
        console.error("Attendees Error:", error);
        alert("List load kora jacche na: " + error.message);
    } finally {
        if(btn && oldIcon) {
            btn.innerHTML = oldIcon;
            btn.disabled = false;
        }
    }
}

async function admAddPost() {
    const title = document.getElementById('admPostTitle').value.trim();
    const content = document.getElementById('admPostContent').value.trim();
    const translation = document.getElementById('admPostTranslation').value.trim();
    const link = document.getElementById('admPostLink').value.trim();
    const linkTxt = document.getElementById('admPostLinkTxt').value.trim();
    const fileInput = document.getElementById('admPostImg');
    
    if (!title) {
        alert("পোস্টের টাইটেল দিতে হবে!");
        return;
    }
    const category = document.getElementById('admPostCategory').value;
    const btn = document.getElementById('btnPost');
    const oldText = btn.innerText;
    btn.innerText = "পোস্ট হচ্ছে...";
    btn.disabled = true;

    try {
        let imgUrl = "";

        if (fileInput.files.length > 0) {
            btn.innerText = "ছবি আপলোড হচ্ছে...";
            imgUrl = await uploadImg(fileInput.files[0]);
            if (!imgUrl) throw new Error("ছবি আপলোড ব্যর্থ হয়েছে");
        }

        const postData = {
            t: title,
            c: content,
            category: category,
            bnTranslation: translation,
            img: imgUrl,
            link: link,
            linkTxt: linkTxt,
            timestamp: Date.now()
        };

        await db.ref('posts').push(postData);
        
        alert("✅ পোস্ট সফলভাবে করা হয়েছে!");
        
        document.getElementById('admPostTitle').value = '';
        document.getElementById('admPostContent').value = '';
        document.getElementById('admPostTranslation').value = '';
        document.getElementById('admPostLink').value = '';
        document.getElementById('admPostLinkTxt').value = '';
        document.getElementById('admPostImg').value = '';

        renderApp();
        renderAllPosts();

    } catch (error) {
        console.error("Post Error:", error);
        alert("❌ পোস্ট করা যায়নি: " + error.message);
    } finally {
        btn.innerText = oldText;
        btn.disabled = false;
    }
}

async function admAddLib() {
    const title = document.getElementById('libTitle').value.trim();
    const link = document.getElementById('libLink').value.trim();
    const type = document.getElementById('libType').value;
    
    if (!title || !link) return alert("Info missing");
    
    await db.ref('library').push({
        title: title,
        link: link,
        type: type,
        added: Date.now()
    });
    
    alert("Library item added");
    renderApp();
}

async function admSaveSet() {
    const notice = document.getElementById('setNotice').value.trim();
    const bkash = document.getElementById('setBkash').value.trim();
    const nagad = document.getElementById('setNagad').value.trim();
    const minDep = parseInt(document.getElementById('setMinDep').value) || 50;
    const minWd = parseInt(document.getElementById('setMinWd').value) || 100;
    
    if (!notice) {
        alert("নোটিশ ঘরটি খালি রাখা যাবে না!");
        return;
    }

    const btn = document.querySelector('#adm-set button');
    const oldText = btn.innerText;
    btn.innerText = "সেভ হচ্ছে...";
    btn.disabled = true;

    try {
        await db.ref('config').update({
            notice: notice,
            bkash: bkash,
            nagad: nagad,
            minDep: minDep,
            minWd: minWd,
            lastUpdated: Date.now()
        });

        document.getElementById('marqueeText').innerText = notice;
        
        if (DB_DATA && DB_DATA.config) {
            DB_DATA.config.notice = notice;
        }

        alert("✅ নোটিশ এবং সেটিংস সফলভাবে সেভ হয়েছে!");

    } catch (error) {
        console.error("Save Error:", error);
        alert("❌ সেভ হয়নি: " + error.message);
    } finally {
        btn.innerText = oldText;
        btn.disabled = false;
    }
}

