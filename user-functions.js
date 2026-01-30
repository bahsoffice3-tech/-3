// ==================== USER FUNCTIONS ====================

// ১. প্রোফাইল আপডেট ফাংশন
async function updateProfile() {
    const name = document.getElementById('editName').value.trim();
    const pass = document.getElementById('editPass').value.trim();
    const fileInput = document.getElementById('editPicFile');
    
    // বাটন লোডিং স্টাইল
    const btn = document.getElementById('btnUpdateProfile');
    const originalText = btn.innerText;
    btn.innerText = "অপেক্ষা করুন...";
    btn.disabled = true;

    try {
        let updates = {};
        let hasChanges = false;
        
        // নাম পরিবর্তন হলে
        if (name && name !== CURR_USER.name) {
            updates.name = name;
            hasChanges = true;
        }
        
        // পাসওয়ার্ড পরিবর্তন হলে
        if (pass && pass !== CURR_USER.pass) {
            updates.pass = pass;
            hasChanges = true;
        }
        
        // ছবি আপলোড হলে
        if (fileInput.files.length > 0) {
            btn.innerText = "ছবি আপলোড হচ্ছে...";
            const imgUrl = await uploadImg(fileInput.files[0]);
            
            if (imgUrl) {
                updates.avatar = imgUrl;
                hasChanges = true;
            } else {
                throw new Error("ছবি আপলোড ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।");
            }
        }

        if (hasChanges) {
            // ডাটাবেস আপডেট
            await db.ref('users/' + CURR_USER.id).update(updates);
            
            // লোকাল ডাটা আপডেট
            CURR_USER = { ...CURR_USER, ...updates };
            
            // পাসওয়ার্ড পাল্টালে লোকাল স্টোরেজ আপডেট
            if(updates.pass && localStorage.getItem('mrds_pass')) {
                localStorage.setItem('mrds_pass', updates.pass);
            }

            alert("✅ প্রোফাইল সফলভাবে আপডেট হয়েছে!");
            
            // ইনপুট ফিল্ড ক্লিয়ার করা
            document.getElementById('editName').value = '';
            document.getElementById('editPass').value = '';
            document.getElementById('editPicFile').value = '';
            document.getElementById('editSection').classList.add('hidden');
            
            // UI রিফ্রেশ
            updateUserUI();
        } else {
            alert("কোনো পরিবর্তন পাওয়া যায়নি!");
        }

    } catch (error) {
        console.error("Profile Update Error:", error);
        alert("এরর: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ২. মেসেজ পাঠানো
async function sendMsgToAdmin() {
    const input = document.getElementById('userMsgInput');
    const text = input.value.trim();
    
    if (!text) return alert("মেসেজ লিখুন!");

    const btn = document.querySelector('#view-profile .btn-sm');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const msgData = {
            uid: CURR_USER.id,
            name: CURR_USER.name,
            text: text,
            reply: "", // শুরুতে কোনো রিপ্লাই নেই
            time: Date.now()
        };

        // ডাটাবেসে পাঠানো
        const ref = await db.ref('msgs').push(msgData);
        
        // লোকাল আপডেট (যাতে সাথে সাথে দেখা যায়)
        if (!DB_DATA.msgs) DB_DATA.msgs = {};
        DB_DATA.msgs[ref.key] = msgData;

        input.value = ''; // ইনপুট ক্লিয়ার
        renderMessages(); // লিস্ট রিফ্রেশ

    } catch (error) {
        console.error("Msg Error:", error);
        alert("মেসেজ পাঠানো যায়নি!");
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}

// ৩. মেসেজ লিস্ট দেখানো (User View)
function renderMessages() {
    const container = document.getElementById('userMsgList');
    if (!container) return;
    
    // ডাটা না থাকলে
    if (!DB_DATA || !DB_DATA.msgs) {
        container.innerHTML = '<p class="text-xs text-light text-center">কোনো মেসেজ নেই</p>';
        return;
    }

    container.innerHTML = '';
    
    // নিজের মেসেজ ফিল্টার এবং সর্ট করা
    const myMsgs = Object.entries(DB_DATA.msgs)
        .filter(([, m]) => m.uid === CURR_USER.id)
        .sort(([, a], [, b]) => b.time - a.time);

    myMsgs.forEach(([id, m]) => {
        // সময়ের ফরম্যাট
        const timeStr = new Date(m.time).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        container.innerHTML += `
            <div class="msg-box" style="margin-bottom:10px; background:#fff; border:1px solid #eee;">
                <div class="flex flex-between">
                    <span class="text-xs font-bold text-primary">You</span>
                    <span class="text-xs text-light">${timeStr}</span>
                </div>
                <div class="text-sm mt-1">${m.text}</div>
                
                ${m.reply ? `
                    <div class="admin-reply mt-2" style="background:#f0fdf4; padding:8px; border-radius:6px; border-left:3px solid #16a34a;">
                        <span class="text-xs font-bold text-success">Admin Reply:</span>
                        <div class="text-sm">${m.reply}</div>
                    </div>
                ` : `<div class="text-xs text-warning mt-1"><i class="far fa-clock"></i> পেন্ডিং...</div>`}
            </div>
        `;
    });
}

// ৪. স্টুডেন্ট এডিট করার ফাংশন
async function saveUserChanges() {
    // ১. ইনপুট থেকে ভ্যালু নেওয়া
    const mobile = document.getElementById('editUserMobile').value; // হিডেন ফিল্ড থেকে মোবাইল নম্বর
    const name = document.getElementById('editUserName').value.trim();
    const cls = document.getElementById('editUserClass').value;
    const bal = parseInt(document.getElementById('editUserBal').value) || 0;
    const pass = document.getElementById('editUserPass').value.trim();
    const fileInput = document.getElementById('editUserPicFile');

    if (!mobile) return alert("Error: User ID missing!");

    // বাটন লোডিং স্টাইল
    const btn = document.querySelector('#modal-edit-user .btn-success');
    const oldText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        let updates = {
            name: name,
            class: cls,
            bal: bal,
            pass: pass
        };

        // ২. যদি নতুন ছবি আপলোড করা হয়
        if (fileInput.files.length > 0) {
            btn.innerText = "Uploading Image...";
            const imgUrl = await uploadImg(fileInput.files[0]);
            if (imgUrl) {
                updates.avatar = imgUrl;
            } else {
                throw new Error("Image upload failed");
            }
        }

        // ৩. ডাটাবেস আপডেট
        await db.ref('users/' + mobile).update(updates);
        
        // ৪. লোকাল ডাটা আপডেট (রিফ্রেশ ছাড়া লিস্ট আপডেটের জন্য)
        if (DB_DATA.users && DB_DATA.users[mobile]) {
            DB_DATA.users[mobile] = { ...DB_DATA.users[mobile], ...updates };
        }

        alert("✅ স্টুডেন্ট প্রোফাইল আপডেট হয়েছে!");
        closeModal();
        
        // ৫. লিস্ট রিফ্রেশ
        renderAdminUsers();

    } catch (error) {
        console.error("Edit Error:", error);
        alert("আপডেট হয়নি: " + error.message);
    } finally {
        btn.innerText = oldText;
        btn.disabled = false;
    }
}

