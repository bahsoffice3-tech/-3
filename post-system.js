// ==================== CATEGORY & FILTER FUNCTIONS ====================

// ১. ক্যাটাগরি লোড এবং রেন্ডার করা (Admin & User)
function renderCategories() {
    // ডিফল্ট ক্যাটাগরি যদি ডাটাবেসে না থাকে
    const categories = (DB_DATA && DB_DATA.categories) ? DB_DATA.categories : {'def': 'General'};
    
    // A. ইউজার ফিল্টার বার আপডেট
    const filterContainer = document.getElementById('postFilterContainer');
    if(filterContainer) {
        let html = `<button class="filter-btn active" onclick="filterPosts('All', this)">সব</button>`;
        Object.values(categories).forEach(cat => {
            html += `<button class="filter-btn" onclick="filterPosts('${cat}', this)">${cat}</button>`;
        });
        filterContainer.innerHTML = html;
    }

    // B. অ্যাডমিন ড্রপডাউন আপডেট (নতুন পোস্ট এবং এডিট পোস্ট)
    const admSelect = document.getElementById('admPostCategory');
    const editSelect = document.getElementById('editPostCategoryInput');
    
    let options = '';
    Object.values(categories).forEach(cat => {
        options += `<option value="${cat}">${cat}</option>`;
    });

    if(admSelect) admSelect.innerHTML = options;
    if(editSelect) editSelect.innerHTML = options;

    // C. অ্যাডমিন সেটিংস লিস্ট আপডেট
    const admList = document.getElementById('admCatList');
    if(admList) {
        admList.innerHTML = '';
        Object.entries(categories).forEach(([key, cat]) => {
            admList.innerHTML += `
                <span class="bg-gray-200 px-2 py-1 rounded text-xs flex items-center gap-1">
                    ${cat} <i class="fas fa-times text-danger cursor-pointer" onclick="deleteCategory('${key}')"></i>
                </span>
            `;
        });
    }
}

// ২. পোস্ট ফিল্টার লজিক
function filterPosts(category, btnElement) {
    // বাটন একটিভ স্টাইল
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // পোস্ট ফিল্টার করা
    const allPosts = document.querySelectorAll('.post-item-wrapper');
    allPosts.forEach(post => {
        const postCat = post.getAttribute('data-category');
        if (category === 'All' || postCat === category) {
            post.classList.remove('hidden');
        } else {
            post.classList.add('hidden');
        }
    });
}

// ৩. নতুন ক্যাটাগরি অ্যাড করা (অ্যাডমিন)
async function admAddCategory() {
    const name = document.getElementById('newCatName').value.trim();
    if(!name) return alert("নাম লিখুন");

    try {
        await db.ref('categories').push(name);
        document.getElementById('newCatName').value = '';
        alert("ক্যাটাগরি যুক্ত হয়েছে");
        
        // রিফ্রেশ ডাটা
        const snap = await db.ref().once('value');
        DB_DATA = snap.val();
        renderCategories();
    } catch(e) {
        alert(e.message);
    }
}

// ৪. ক্যাটাগরি ডিলিট করা
async function deleteCategory(key) {
    if(!confirm("মুছে ফেলতে চান?")) return;
    await db.ref('categories/' + key).remove();
    const snap = await db.ref().once('value');
    DB_DATA = snap.val();
    renderCategories();
}

// ==================== POST RENDER FUNCTION ====================
function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    if (!DB_DATA || !DB_DATA.posts) {
        container.innerHTML = '<div class="card text-center p-4"><p class="text-light">কোনো নিউজ বা নোটিশ নেই</p></div>';
        return;
    }

    const posts = DB_DATA.posts;
    container.innerHTML = '';
    
    Object.entries(posts)
        .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))
        .forEach(([id, post]) => {
            // Detect if post is in English (simple detection)
            const isEnglish = /[a-zA-Z]/.test(post.t || '') || /[a-zA-Z]/.test(post.c || '');
            
            let imgHtml = '';
            if(post.img) {
                imgHtml = `<img src="${post.img}" class="post-img" style="width:100%; border-radius:8px; margin-top:10px; margin-bottom:10px; border:1px solid #eee;">`;
            }

            let linkHtml = '';
            if(post.link) {
                linkHtml = `<a href="${post.link}" target="_blank" class="btn btn-sm btn-outline mt-2 w-auto" style="display:inline-block;">
                    ${post.linkTxt || 'লিংক খুলুন'} <i class="fas fa-external-link-alt"></i>
                </a>`;
            }

            const dateStr = post.timestamp ? new Date(post.timestamp).toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '';

            const category = post.category || 'General';

            const html = `
                <div class="card mb-3 post-item-wrapper" data-category="${category}" style="border-left: 4px solid var(--primary);">
                    <div class="post-header" onclick="togglePost('${id}')">
                        <div class="post-title-wrapper">
                            <span class="post-cat-badge">${category}</span>
                            <div class="flex items-center">
                                <h3 class="text-primary" style="font-size: 1.2rem; font-weight: bold; margin: 0;">
                                    ${post.t || post.title || 'Untitled'}
                                </h3>
                                ${isEnglish && (post.bnTranslation || CURR_USER?.role === 'admin') ? 
                                    `<button class="translate-btn" onclick="showTranslation(event, '${id}')">বাংলা</button>` : ''}
                            </div>
                            <div class="post-date"><i class="far fa-clock"></i> ${dateStr}</div>
                        </div>
                        <i class="fas fa-chevron-down post-expand-icon" id="post-icon-${id}"></i>
                    </div>
                    
                    <div class="post-content" id="post-content-${id}">
                        <p class="text-sm" style="white-space: pre-wrap; color: #4b5563; line-height: 1.6;">${post.c || post.content || ''}</p>
                        
                        ${imgHtml}
                        ${linkHtml}
                        
                        <!-- Translation section (hidden by default) -->
                        ${post.bnTranslation ? 
                            `<div class="post-translation" id="translation-${id}">
                                <strong><i class="fas fa-language"></i> বাংলা অনুবাদ:</strong><br>
                                ${post.bnTranslation}
                            </div>` : ''
                        }
                        
                        <!-- Admin actions -->
                        ${CURR_USER?.role === 'admin' ? `
                            <div class="admin-translation-box mt-3">
                                <label class="admin-translation-label">বাংলা অনুবাদ যোগ/সম্পাদনা করুন</label>
                                <textarea id="admin-translation-${id}" placeholder="বাংলা অনুবাদ লিখুন..." rows="2" style="width:100%; padding:8px; border-radius:4px; border:1px solid var(--border);">${post.bnTranslation || ''}</textarea>
                                <div class="post-actions">
                                    <button class="post-action-btn edit" onclick="editPost('${id}')">
                                        <i class="fas fa-edit"></i> এডিট
                                    </button>
                                    <button class="post-action-btn delete" onclick="deletePost('${id}')">
                                        <i class="fas fa-trash"></i> ডিলিট
                                    </button>
                                    <button class="btn btn-sm" onclick="saveTranslation('${id}')">সেভ অনুবাদ</button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            container.innerHTML += html;
        });
}

// ==================== POST INTERACTION FUNCTIONS ====================
function togglePost(postId) {
    const content = document.getElementById('post-content-' + postId);
    const icon = document.getElementById('post-icon-' + postId);
    
    content.classList.toggle('expanded');
    icon.classList.toggle('expanded');
    
    if (content.classList.contains('expanded')) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        
        // Also hide translation when collapsing
        const translation = document.getElementById('translation-' + postId);
        if (translation) {
            translation.classList.remove('show');
        }
    }
}

function showTranslation(event, postId) {
    event.stopPropagation(); // Prevent post toggle
    
    const translationDiv = document.getElementById('translation-' + postId);
    const contentDiv = document.getElementById('post-content-' + postId);
    
    // Make sure post is expanded
    if (!contentDiv.classList.contains('expanded')) {
        contentDiv.classList.add('expanded');
        const icon = document.getElementById('post-icon-' + postId);
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        icon.classList.add('expanded');
    }
    
    // Toggle translation visibility
    if (translationDiv) {
        translationDiv.classList.toggle('show');
    }
    
    // If admin, focus on translation textarea
    if (CURR_USER?.role === 'admin') {
        const adminTextarea = document.getElementById('admin-translation-' + postId);
        if (adminTextarea) {
            setTimeout(() => {
                adminTextarea.focus();
            }, 300);
        }
    }
}

// ==================== POST EDIT & DELETE FUNCTIONS ====================
async function editPost(postId) {
    try {
        const postSnap = await db.ref('posts/' + postId).once('value');
        const post = postSnap.val();
        
        if (!post) {
            alert('Post not found');
            return;
        }
        
        // Fill form with post data
        document.getElementById('editPostId').value = postId;
        document.getElementById('editPostTitle').value = post.t || post.title || '';
        document.getElementById('editPostContent').value = post.c || post.content || '';
        document.getElementById('editPostTranslation').value = post.bnTranslation || '';
        document.getElementById('editPostLink').value = post.link || '';
        document.getElementById('editPostLinkTxt').value = post.linkTxt || '';
        
        // Set current image
        const currentImg = document.getElementById('currentPostImage');
        if (post.img) {
            currentImg.src = post.img;
            currentImg.style.display = 'block';
        } else {
            currentImg.style.display = 'none';
        }
        
        // Clear file input
        document.getElementById('editPostImg').value = '';
        
        showModal('edit-post');
        
    } catch (error) {
        console.error('Error loading post for edit:', error);
        alert('Failed to load post: ' + error.message);
    }
}

async function updatePost() {
    const postId = document.getElementById('editPostId').value;
    const title = document.getElementById('editPostTitle').value.trim();
    const content = document.getElementById('editPostContent').value.trim();
    const translation = document.getElementById('editPostTranslation').value.trim();
    const link = document.getElementById('editPostLink').value.trim();
    const linkTxt = document.getElementById('editPostLinkTxt').value.trim();
    const fileInput = document.getElementById('editPostImg').files[0];
    
    if (!title) {
        alert('পোস্টের টাইটেল দিতে হবে!');
        return;
    }

    const btn = document.querySelector('#modal-edit-post .btn-success');
    const originalText = btn.innerText;
    btn.innerText = "আপডেট হচ্ছে...";
    btn.disabled = true;

    try {
        let updates = {
            t: title,
            c: content,
            bnTranslation: translation,
            link: link,
            linkTxt: linkTxt,
            updatedAt: Date.now()
        };

        // Upload new image if provided
        if (fileInput) {
            btn.innerText = "ছবি আপলোড হচ্ছে...";
            const imgUrl = await uploadImg(fileInput);
            if (imgUrl) {
                updates.img = imgUrl;
            }
        }

        await db.ref('posts/' + postId).update(updates);
        
        alert('✅ পোস্ট সফলভাবে আপডেট হয়েছে!');
        closeModal();
        renderApp();
        
    } catch (error) {
        console.error("Post update error:", error);
        alert("❌ পোস্ট আপডেট করা যায়নি: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function deletePost(postId) {
    if (!confirm('আপনি কি নিশ্চিত যে এই পোস্টটি ডিলিট করতে চান?\n\nএই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।')) {
        return;
    }

    try {
        await db.ref('posts/' + postId).remove();
        alert('✅ পোস্ট সফলভাবে ডিলিট হয়েছে!');
        renderApp();
    } catch (error) {
        console.error('Delete post error:', error);
        alert('❌ পোস্ট ডিলিট করা যায়নি: ' + error.message);
    }
}

async function saveTranslation(postId) {
    if (CURR_USER?.role !== 'admin') return;
    
    const translationText = document.getElementById('admin-translation-' + postId).value.trim();
    
    try {
        await db.ref('posts/' + postId + '/bnTranslation').set(translationText);
        
        // Update UI
        const translationDiv = document.getElementById('translation-' + postId);
        if (translationDiv) {
            if (translationText) {
                translationDiv.innerHTML = `<strong><i class="fas fa-language"></i> বাংলা অনুবাদ:</strong><br>${translationText}`;
                translationDiv.classList.add('show');
            } else {
                translationDiv.remove();
            }
        } else if (translationText) {
            // Create new translation div if it doesn't exist
            const contentDiv = document.getElementById('post-content-' + postId);
            const newTranslationDiv = document.createElement('div');
            newTranslationDiv.className = 'post-translation show';
            newTranslationDiv.id = 'translation-' + postId;
            newTranslationDiv.innerHTML = `<strong><i class="fas fa-language"></i> বাংলা অনুবাদ:</strong><br>${translationText}`;
            
            // Insert before admin translation box
            const adminBox = contentDiv.querySelector('.admin-translation-box');
            if (adminBox) {
                contentDiv.insertBefore(newTranslationDiv, adminBox);
            }
        }
        
        // Update button text if it exists
        const translateBtn = document.querySelector(`button[onclick*="${postId}"]`);
        if (translateBtn && !translationText) {
            translateBtn.remove();
        }
        
        alert('✅ অনুবাদ সেভ হয়েছে!');
    } catch (error) {
        console.error('Translation save error:', error);
        alert('❌ অনুবাদ সেভ করা যায়নি: ' + error.message);
    }
}

