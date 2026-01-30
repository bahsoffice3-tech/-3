// ==================== COMPLETE EXAM SYSTEM ====================

// Global Variables
let currentQuestionIndex = 0;
let userAnswers = {};
let examStartTime = null;
let REVIEW_QUESTIONS = {};

// ==================== EXAM MANAGEMENT FUNCTIONS ====================

// ১. প্রশ্ন অ্যাড এবং ডাটা পপুলেট করার ফাংশন
function addQ(data = null) {
    const container = document.getElementById('qList');
    
    const div = document.createElement('div');
    div.className = 'card q-item';
    div.style.border = '1px solid #ddd';
    div.style.padding = '10px';
    div.style.marginBottom = '10px';

    // ডাটা চেক (যদি এডিট মোড হয়)
    const val = data ? data.val : '';
    const type = data ? data.type : 'text';
    const ans = data ? data.ans : 0;
    const opts = data ? data.opts : ['', '', '', ''];

    div.innerHTML = `
        <div class="flex flex-between mb-2">
            <span class="text-xs font-bold text-primary">প্রশ্ন সেটআপ</span>
            <button class="btn btn-sm btn-danger w-auto" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-trash"></i></button>
        </div>

        <div class="flex gap-2 mb-2">
            <div class="w-1/3">
                <label class="text-xs">Type</label>
                <select class="q-type">
                    <option value="text" ${type === 'text' ? 'selected' : ''}>Text</option>
                    <option value="image" ${type === 'image' ? 'selected' : ''}>Image URL</option>
                    <option value="html" ${type === 'html' ? 'selected' : ''}>HTML/Math</option>
                </select>
            </div>
            <div class="w-2/3">
                <label class="text-xs">Correct Answer</label>
                <select class="q-ans">
                    <option value="0" ${ans == 0 ? 'selected' : ''}>Option A</option>
                    <option value="1" ${ans == 1 ? 'selected' : ''}>Option B</option>
                    <option value="2" ${ans == 2 ? 'selected' : ''}>Option C</option>
                    <option value="3" ${ans == 3 ? 'selected' : ''}>Option D</option>
                </select>
            </div>
        </div>

        <label class="text-xs">Question</label>
        <textarea class="q-val mb-2" rows="2" placeholder="প্রশ্ন বা লিংক...">${val}</textarea>

        <div class="grid grid-cols-2 gap-2">
            <input type="text" class="q-opt-0" placeholder="Option A" value="${opts[0]}">
            <input type="text" class="q-opt-1" placeholder="Option B" value="${opts[1]}">
            <input type="text" class="q-opt-2" placeholder="Option C" value="${opts[2]}">
            <input type="text" class="q-opt-3" placeholder="Option D" value="${opts[3]}">
        </div>
    `;

    container.appendChild(div);
}

// ২. এক্সাম এডিট ফাংশন
async function editExam(id) {
    const snap = await db.ref('exams/' + id).once('value');
    const exam = snap.val();
    
    if (!exam) return alert("Exam not found!");

    // ফর্ম পপুলেট করা
    document.getElementById('editExamId').value = id;
    document.getElementById('examModalTitle').innerText = "Edit Exam";
    document.getElementById('btnCancelEdit').classList.remove('hidden');

    document.getElementById('exTitle').value = exam.title;
    document.getElementById('exClass').value = exam.class;
    document.getElementById('exMode').value = exam.mode;
    document.getElementById('exStart').value = exam.start;
    document.getElementById('exEnd').value = exam.end;
    document.getElementById('exDur').value = exam.dur;
    document.getElementById('exFee').value = exam.fee;
    document.getElementById('exPrize').value = exam.prize || 0;
    document.getElementById('exGift').value = exam.giftAmount || 0;

    // মোড টগল করা
    const nativeDiv = document.getElementById('nativeMode');
    const googleDiv = document.getElementById('googleMode');
    
    if (exam.mode === 'Google') {
        nativeDiv.classList.add('hidden');
        googleDiv.classList.remove('hidden');
        document.getElementById('exLink').value = exam.link || '';
    } else {
        nativeDiv.classList.remove('hidden');
        googleDiv.classList.add('hidden');
        
        // আগের প্রশ্নগুলো ক্লিয়ার করে নতুন করে লোড করা
        const qList = document.getElementById('qList');
        qList.innerHTML = ''; 
        
        if (exam.questions && Array.isArray(exam.questions)) {
            exam.questions.forEach(q => {
                addQ(q); // এখানে ডাটা পাঠানো হচ্ছে
            });
        }
    }
    
    // স্ক্রল করে উপরে যাওয়া
    document.getElementById('adm-exam').scrollIntoView({ behavior: 'smooth' });
}

// ৩. এক্সাম সেভ ফাংশন
async function saveExam() {
    const title = document.getElementById('exTitle').value.trim();
    const mode = document.getElementById('exMode').value;
    const cls = document.getElementById('exClass').value;
    const start = document.getElementById('exStart').value;
    const end = document.getElementById('exEnd').value;
    const dur = parseInt(document.getElementById('exDur').value);
    const fee = parseInt(document.getElementById('exFee').value) || 0;
    const prize = parseInt(document.getElementById('exPrize').value) || 0;
    const gift = parseInt(document.getElementById('exGift').value) || 0;
    
    if (!title || !start || !end || !dur) return alert("All fields required");

    let data = {
        title, mode, class: cls, start, end, dur, fee, prize, giftAmount: gift,
        created: Date.now()
    };

    if (mode === 'Google') {
        data.link = document.getElementById('exLink').value;
    } else {
        // প্রশ্ন কালেক্ট করা
        let questions = [];
        document.querySelectorAll('.q-item').forEach(item => {
            const type = item.querySelector('.q-type').value;
            const val = item.querySelector('.q-val').value;
            const ans = item.querySelector('.q-ans').value;
            const o0 = item.querySelector('.q-opt-0').value;
            const o1 = item.querySelector('.q-opt-1').value;
            const o2 = item.querySelector('.q-opt-2').value;
            const o3 = item.querySelector('.q-opt-3').value;

            if(val) {
                questions.push({
                    type: type,
                    val: val,
                    ans: ans,
                    opts: [o0, o1, o2, o3]
                });
            }
        });
        
        if(questions.length === 0) return alert("Add at least one question!");
        data.questions = questions;
    }

    const editId = document.getElementById('editExamId').value;
    
    if (editId) {
        await db.ref('exams/' + editId).update(data);
        alert("✅ Updated Successfully");
    } else {
        await db.ref('exams').push(data);
        alert("✅ Created Successfully");
    }

    // Reset UI
    cancelEditExam();
    renderAdminExams();
}

// ৪. ক্যানসেল এডিট ফাংশন
function cancelEditExam() {
    document.getElementById('editExamId').value = '';
    document.getElementById('examModalTitle').innerText = "Create Exam";
    document.getElementById('btnCancelEdit').classList.add('hidden');
    document.getElementById('exTitle').value = '';
    document.getElementById('qList').innerHTML = '';
}

// ==================== EXAM ENTRY & VALIDATION ====================

// ৫. এক্সাম জয়েন ফাংশন (নতুন থিমে আপডেট)
async function startExam(examId) {
    if(!CURR_USER) return alert("Please login first");

    const snap = await db.ref('exams/' + examId).once('value');
    const exam = snap.val();
    
    if(!exam) return alert("Exam not found or deleted");

    // সময় চেক
    const now = new Date();
    const start = new Date(exam.start);
    const end = new Date(exam.end);

    if (now < start) return alert("Exam has not started yet!");
    if (now > end) return alert("Exam has ended!");

    // ক্লাস চেক
    const userClass = CURR_USER.class || 'Class 10';
    if(exam.class !== 'All' && exam.class !== userClass) {
        return alert(`This exam is only for ${exam.class}`);
    }

    // রেজাল্ট চেক (আগে দিয়েছে কিনা)
    const resSnap = await db.ref('results').orderByChild('uid').equalTo(CURR_USER.id).once('value');
    let alreadyTaken = false;
    resSnap.forEach(child => {
        if(child.val().eid === examId) alreadyTaken = true;
    });

    if(alreadyTaken) return alert("You have already taken this exam!");

    // ফি পেমেন্ট
    if(exam.fee > 0) {
        if(CURR_USER.bal < exam.fee) return alert("Insufficient Balance! Please Deposit.");
        
        if(!confirm(`Exam Fee: ৳${exam.fee}. Do you want to continue?`)) return;
        
        // টাকা কাটা
        await db.ref('users/' + CURR_USER.id + '/bal').set(CURR_USER.bal - exam.fee);
        CURR_USER.bal -= exam.fee;
        updateUserUI();
    }

    // এক্সাম শুরু
    if(exam.mode === 'Google') {
        window.open(exam.link, '_blank');
    } else {
        ACTIVE_EXAM = { id: examId, ...exam };
        // প্রশ্ন মিক্স করা (অপশনাল)
        if (ACTIVE_EXAM.questions && confirm("প্রশ্নগুলো র‍্যান্ডমভাবে সাজাতে চান?")) {
            shuffleQuestions();
        }
        // নতুন থিম ব্যবহার করুন
        startExamUIAdvanced();
    }
}

// ৬. প্রশ্ন মিক্স/শাফল ফাংশন
function shuffleQuestions() {
    if (!ACTIVE_EXAM.questions) return;
    
    // প্রশ্ন শাফল
    for (let i = ACTIVE_EXAM.questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ACTIVE_EXAM.questions[i], ACTIVE_EXAM.questions[j]] = [ACTIVE_EXAM.questions[j], ACTIVE_EXAM.questions[i]];
    }
    
    // প্রতিটি প্রশ্নের অপশন শাফল
    ACTIVE_EXAM.questions.forEach((question, index) => {
        if (question.opts) {
            const correctAnswer = question.opts[question.ans];
            const shuffledOpts = [...question.opts];
            
            // Fisher-Yates shuffle algorithm
            for (let i = shuffledOpts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledOpts[i], shuffledOpts[j]] = [shuffledOpts[j], shuffledOpts[i]];
            }
            
            // নতুন করেক্ট উত্তর ইনডেক্স খুঁজে বের করা
            const newAnsIndex = shuffledOpts.indexOf(correctAnswer);
            
            // আপডেট করা
            question.opts = shuffledOpts;
            question.ans = newAnsIndex;
        }
    });
}

// ==================== ADVANCED MCQ EXAM RENDERER ====================

// ৭. নতুন MCQ এক্সাম UI চালু করা
function startExamUIAdvanced() {
    if (!ACTIVE_EXAM) return;
    
    // ভেরিয়েবল রিসেট
    currentQuestionIndex = 0;
    userAnswers = {};
    REVIEW_QUESTIONS = {};
    examStartTime = Date.now();
    
    document.getElementById('runExamTitle').innerText = ACTIVE_EXAM.title;
    const examBody = document.getElementById('examBody');
    
    // নতুন থিমের HTML সেটআপ
    examBody.innerHTML = `
        <div class="exam-theme-container">
            <!-- Exam Header -->
            <div class="exam-header-card">
                <div class="exam-header-title">${ACTIVE_EXAM.title}</div>
                <div class="exam-header-subtitle">
                    <span class="exam-header-badge"><i class="fas fa-clock"></i> ${ACTIVE_EXAM.dur} মিনিট</span>
                    <span class="exam-header-badge"><i class="fas fa-graduation-cap"></i> ${ACTIVE_EXAM.class}</span>
                    <span class="exam-header-badge"><i class="fas fa-coins"></i> ফি: ৳${ACTIVE_EXAM.fee || 0}</span>
                    <span class="exam-header-badge"><i class="fas fa-question-circle"></i> ${ACTIVE_EXAM.questions?.length || 0} প্রশ্ন</span>
                </div>
            </div>
            
            <!-- Question Counter & Progress -->
            <div class="question-counter">
                <div class="counter-left">
                    <div class="question-number">প্রশ্ন <span id="currentQNum">1</span>/<span id="totalQNum">${ACTIVE_EXAM.questions?.length || 0}</span></div>
                    <div class="question-status" id="answeredStatus">0 উত্তর দেওয়া হয়েছে</div>
                    <div class="question-status" id="reviewStatus" style="color:#f59e0b;"></div>
                </div>
                
                <!-- Timer -->
                <div class="exam-timer" id="examTimer">
                    <i class="fas fa-clock timer-icon"></i>
                    <div class="timer-text" id="timerDisplayAdv">${ACTIVE_EXAM.dur}:00</div>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="progress-container">
                <div class="progress-label">
                    <span>প্রোগ্রেস</span>
                    <span id="progressPercent">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                </div>
            </div>
            
            <!-- Question List Navigation -->
            <div class="question-list-grid" id="questionListNav"></div>
            
            <!-- Question Container -->
            <div id="questionContainer"></div>
            
            <!-- Navigation Buttons -->
            <div class="exam-navigation">
                <button class="nav-btn nav-btn-prev" onclick="prevQuestion()" id="prevBtn">
                    <i class="fas fa-arrow-left"></i> আগের প্রশ্ন
                </button>
                
                <div style="display: flex; gap: 10px;">
                    <button class="nav-btn nav-btn-review" onclick="toggleReviewQuestion()" id="reviewBtn">
                        <i class="far fa-flag"></i> রিভিউ
                    </button>
                    <button class="nav-btn nav-btn-next" onclick="nextQuestion()" id="nextBtn">
                        পরের প্রশ্ন <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                
                <button class="nav-btn nav-btn-submit" onclick="submitExamAdvanced()" id="submitBtn">
                    <i class="fas fa-paper-plane"></i> সাবমিট করুন
                </button>
            </div>
            
            <!-- Exam Summary Modal (Hidden) -->
            <div id="examSummaryModal" class="modal hidden" style="z-index: 4000;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="flex flex-between mb-4">
                        <h3><i class="fas fa-list-check"></i> পরীক্ষা সংক্ষিপ্তসার</h3>
                        <i class="fas fa-times" onclick="document.getElementById('examSummaryModal').classList.add('hidden')"></i>
                    </div>
                    <div id="examSummaryContent"></div>
                    <div class="flex gap-2 mt-4">
                        <button class="btn btn-outline w-1/2" onclick="document.getElementById('examSummaryModal').classList.add('hidden')">
                            ফিরে যান
                        </button>
                        <button class="btn btn-danger w-1/2" onclick="submitExamAdvanced()">
                            জমা দিন
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // CSS যোগ করা (যদি না থাকে)
    if (!document.getElementById('exam-theme-styles')) {
        const style = document.createElement('style');
        style.id = 'exam-theme-styles';
        style.innerHTML = `
            .nav-btn-review {
                background: #fef3c7;
                color: #d97706;
                border: 2px solid #fde68a;
            }
            .nav-btn-review:hover {
                background: #fde68a;
                color: #b45309;
            }
            .nav-btn-review.active {
                background: #f59e0b;
                color: white;
                border-color: #f59e0b;
            }
            .question-number-btn.review {
                background: #fef3c7;
                border-color: #f59e0b;
                color: #d97706;
            }
        `;
        document.head.appendChild(style);
    }
    
    // টাইমার শুরু
    startTimerAdvanced();
    
    // প্রশ্ন লিস্ট তৈরি
    renderQuestionListNav();
    
    // প্রথম প্রশ্ন দেখাও
    renderQuestion(currentQuestionIndex);
    
    // মডাল ওপেন
    document.getElementById('modal-exam').classList.remove('hidden');
}

// ৮. প্রশ্ন রেন্ডার করা
function renderQuestion(index) {
    if (!ACTIVE_EXAM.questions || index >= ACTIVE_EXAM.questions.length) return;
    
    const question = ACTIVE_EXAM.questions[index];
    const container = document.getElementById('questionContainer');
    
    let questionHTML = '';
    
    // প্রশ্ন টেক্সট বা ইমেজ
    if (question.type === 'image') {
        questionHTML = `
            <div class="question-card">
                <div class="question-text">
                    <b>প্রশ্ন ${index + 1}:</b>
                </div>
                <img src="${question.val}" class="question-image" alt="Question Image" onerror="this.src='https://via.placeholder.com/400x200?text=Image+Not+Found'">
            </div>
        `;
    } else if (question.type === 'html') {
        questionHTML = `
            <div class="question-card">
                <div class="question-text">
                    <b>প্রশ্ন ${index + 1}:</b> <span class="math-content">${question.val}</span>
                </div>
            </div>
        `;
    } else {
        questionHTML = `
            <div class="question-card">
                <div class="question-text">
                    <b>প্রশ্ন ${index + 1}:</b> ${question.val}
                </div>
            </div>
        `;
    }
    
    // অপশনগুলো
    let optionsHTML = '<div class="options-grid">';
    
    if (question.opts) {
        question.opts.forEach((opt, optIndex) => {
            const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
            const isSelected = userAnswers[index] === optIndex;
            const optText = opt || `Option ${letter}`;
            
            optionsHTML += `
                <div class="option-card ${isSelected ? 'selected' : ''}" 
                     onclick="selectOption(${index}, ${optIndex})">
                    <div class="option-letter">${letter}</div>
                    <div class="option-text">${optText}</div>
                    ${isSelected ? '<i class="fas fa-check-circle option-check"></i>' : ''}
                </div>
            `;
        });
    } else {
        optionsHTML += `
            <div class="option-card" style="justify-content: center; color: #94a3b8;">
                <i class="fas fa-exclamation-circle"></i>
                <div class="option-text">No options available for this question</div>
            </div>
        `;
    }
    
    optionsHTML += '</div>';
    
    container.innerHTML = questionHTML + optionsHTML;
    
    // আপডেট UI
    document.getElementById('currentQNum').textContent = index + 1;
    document.getElementById('totalQNum').textContent = ACTIVE_EXAM.questions.length;
    
    // বাটন স্টেট আপডেট
    updateButtonStates(index);
    
    // রিভিউ বাটন স্টেট
    const reviewBtn = document.getElementById('reviewBtn');
    if (REVIEW_QUESTIONS[index]) {
        reviewBtn.innerHTML = '<i class="fas fa-flag"></i> রিভিউ করা হয়েছে';
        reviewBtn.classList.add('active');
    } else {
        reviewBtn.innerHTML = '<i class="far fa-flag"></i> রিভিউ করুন';
        reviewBtn.classList.remove('active');
    }
    
    // MathJax রেন্ডার
    if (window.MathJax) {
        setTimeout(() => {
            MathJax.typesetPromise();
        }, 100);
    }
}

// ৯. অপশন সিলেক্ট করা
function selectOption(qIndex, optIndex) {
    userAnswers[qIndex] = optIndex;
    
    // UI আপডেট
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    // সিলেক্টেড কার্ড হাইলাইট
    const selectedCard = document.querySelectorAll('.option-card')[optIndex];
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // উত্তর দেওয়া স্ট্যাটাস আপডেট
    updateAnsweredStatus();
    
    // প্রশ্ন লিস্ট আপডেট
    updateQuestionListNav();
}

// ১০. পরের প্রশ্ন
function nextQuestion() {
    if (currentQuestionIndex < ACTIVE_EXAM.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);
    }
}

// ১১. আগের প্রশ্ন
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion(currentQuestionIndex);
    }
}

// ১২. রিভিউ টগল করা
function toggleReviewQuestion() {
    if (REVIEW_QUESTIONS[currentQuestionIndex]) {
        delete REVIEW_QUESTIONS[currentQuestionIndex];
    } else {
        REVIEW_QUESTIONS[currentQuestionIndex] = true;
    }
    
    // রিভিউ বাটন আপডেট
    const reviewBtn = document.getElementById('reviewBtn');
    if (REVIEW_QUESTIONS[currentQuestionIndex]) {
        reviewBtn.innerHTML = '<i class="fas fa-flag"></i> রিভিউ করা হয়েছে';
        reviewBtn.classList.add('active');
    } else {
        reviewBtn.innerHTML = '<i class="far fa-flag"></i> রিভিউ করুন';
        reviewBtn.classList.remove('active');
    }
    
    // স্ট্যাটাস আপডেট
    updateReviewStatus();
    
    // প্রশ্ন লিস্ট আপডেট
    updateQuestionListNav();
}

// ১৩. প্রশ্ন লিস্ট নেভিগেশন
function renderQuestionListNav() {
    const container = document.getElementById('questionListNav');
    if (!container || !ACTIVE_EXAM.questions) return;
    
    container.innerHTML = '';
    
    ACTIVE_EXAM.questions.forEach((_, index) => {
        const isAnswered = userAnswers[index] !== undefined;
        const isCurrent = index === currentQuestionIndex;
        const isReview = REVIEW_QUESTIONS[index];
        
        let btnClass = 'question-number-btn';
        if (isAnswered) btnClass += ' answered';
        if (isCurrent) btnClass += ' current';
        if (isReview) btnClass += ' review';
        
        container.innerHTML += `
            <button class="${btnClass}"
                    onclick="jumpToQuestion(${index})">
                ${index + 1}
                ${isReview ? '<i class="fas fa-flag text-xs" style="position:absolute; top:2px; right:2px;"></i>' : ''}
            </button>
        `;
    });
}

// ১৪. প্রশ্ন লিস্ট আপডেট
function updateQuestionListNav() {
    const buttons = document.querySelectorAll('.question-number-btn');
    buttons.forEach((btn, index) => {
        const isAnswered = userAnswers[index] !== undefined;
        const isCurrent = index === currentQuestionIndex;
        const isReview = REVIEW_QUESTIONS[index];
        
        btn.classList.remove('answered', 'current', 'review');
        if (isAnswered) btn.classList.add('answered');
        if (isCurrent) btn.classList.add('current');
        if (isReview) btn.classList.add('review');
    });
}

// ১৫. নির্দিষ্ট প্রশ্নে যাওয়া
function jumpToQuestion(index) {
    currentQuestionIndex = index;
    renderQuestion(index);
}

// ১৬. উত্তর দেওয়া স্ট্যাটাস আপডেট
function updateAnsweredStatus() {
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = ACTIVE_EXAM.questions?.length || 0;
    
    document.getElementById('answeredStatus').textContent = 
        `${answeredCount} উত্তর দেওয়া হয়েছে`;
    
    // প্রোগ্রেস বার আপডেট
    const percentage = Math.round((answeredCount / totalQuestions) * 100);
    document.getElementById('progressPercent').textContent = `${percentage}%`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

// ১৭. রিভিউ স্ট্যাটাস আপডেট
function updateReviewStatus() {
    const reviewCount = Object.keys(REVIEW_QUESTIONS).length;
    document.getElementById('reviewStatus').textContent = 
        `${reviewCount} প্রশ্ন রিভিউতে`;
}

// ১৮. বাটন স্টেট আপডেট
function updateButtonStates(index) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // আগের বাটন
    prevBtn.disabled = index === 0;
    prevBtn.style.opacity = index === 0 ? '0.5' : '1';
    
    // পরের বাটন
    nextBtn.disabled = index === ACTIVE_EXAM.questions.length - 1;
    nextBtn.style.opacity = index === ACTIVE_EXAM.questions.length - 1 ? '0.5' : '1';
    
    // সাবমিট বাটন টেক্সট
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = ACTIVE_EXAM.questions?.length || 0;
    const unanswered = totalQuestions - answeredCount;
    
    submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> সাবমিট করুন`;
    
    // আনআনসার্ড থাকলে ওয়ার্নিং
    if (unanswered > 0) {
        submitBtn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> সাবমিট করুন (${unanswered} বাকি)`;
    }
}

// ১৯. অ্যাডভান্সড টাইমার
function startTimerAdvanced() {
    let timeLeft = (ACTIVE_EXAM.dur || 60) * 60; // সেকেন্ডে
    
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('timerDisplayAdv').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // টাইমার স্টাইল আপডেট
        const timerElement = document.getElementById('examTimer');
        if (timeLeft <= 300) { // শেষ ৫ মিনিট
            timerElement.classList.add('timer-warning');
            
            // শেষ ১ মিনিটে ব্লিংক এফেক্ট
            if (timeLeft <= 60) {
                timerElement.style.animation = timeLeft % 2 === 0 ? 'none' : 'pulse 1s infinite';
            }
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(TIMER_INT);
            autoSubmitExam();
        }
    }
    
    updateTimer();
    TIMER_INT = setInterval(updateTimer, 1000);
}

// ২০. অটো সাবমিট
function autoSubmitExam() {
    if (confirm("সময় শেষ! আপনার পরীক্ষা স্বয়ংক্রিয়ভাবে জমা দেওয়া হবে।")) {
        submitExamAdvanced();
    } else {
        submitExamAdvanced();
    }
}

// ২১. এক্সাম সামারি দেখানো
function showExamSummary() {
    const totalQuestions = ACTIVE_EXAM.questions?.length || 0;
    const answeredCount = Object.keys(userAnswers).length;
    const reviewCount = Object.keys(REVIEW_QUESTIONS).length;
    const unanswered = totalQuestions - answeredCount;
    
    const timeTaken = Math.floor((Date.now() - examStartTime) / 1000);
    const timeLeft = (ACTIVE_EXAM.dur * 60) - timeTaken;
    const timeLeftMin = Math.floor(timeLeft / 60);
    const timeLeftSec = timeLeft % 60;
    
    let summaryHTML = `
        <div class="card mb-4">
            <h4 class="text-primary mb-2">পরীক্ষা সংক্ষিপ্তসার</h4>
            <div class="grid grid-cols-2 gap-3">
                <div class="text-center p-3 bg-indigo-50 rounded-lg">
                    <div class="text-2xl font-bold text-indigo-600">${totalQuestions}</div>
                    <div class="text-xs text-indigo-500">মোট প্রশ্ন</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${answeredCount}</div>
                    <div class="text-xs text-green-500">উত্তর দেওয়া</div>
                </div>
                <div class="text-center p-3 bg-red-50 rounded-lg">
                    <div class="text-2xl font-bold text-red-600">${unanswered}</div>
                    <div class="text-xs text-red-500">উত্তর দেওয়া হয়নি</div>
                </div>
                <div class="text-center p-3 bg-yellow-50 rounded-lg">
                    <div class="text-2xl font-bold text-yellow-600">${reviewCount}</div>
                    <div class="text-xs text-yellow-500">রিভিউ করা</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h4 class="text-primary mb-2">সময়</h4>
            <div class="flex justify-between items-center">
                <div>
                    <div class="text-sm text-light">ব্যবহৃত সময়</div>
                    <div class="font-bold">${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, '0')}</div>
                </div>
                <div>
                    <div class="text-sm text-light">বাকি সময়</div>
                    <div class="font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-green-600'}">
                        ${timeLeftMin}:${timeLeftSec.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card mt-4">
            <h4 class="text-primary mb-2">প্রশ্নের অবস্থা</h4>
            <div class="space-y-2">
    `;
    
    // প্রতিটি প্রশ্নের অবস্থা
    for (let i = 0; i < totalQuestions; i++) {
        const isAnswered = userAnswers[i] !== undefined;
        const isReview = REVIEW_QUESTIONS[i];
        let status = 'উত্তর দেওয়া হয়নি';
        let color = 'text-red-500';
        let icon = '<i class="fas fa-times-circle"></i>';
        
        if (isAnswered) {
            status = 'উত্তর দেওয়া হয়েছে';
            color = 'text-green-500';
            icon = '<i class="fas fa-check-circle"></i>';
        }
        if (isReview) {
            status += ' (রিভিউ)';
            color = 'text-yellow-500';
            icon = '<i class="fas fa-flag"></i>';
        }
        
        summaryHTML += `
            <div class="flex justify-between items-center p-2 border-b">
                <div class="flex items-center gap-2">
                    ${icon}
                    <span>প্রশ্ন ${i + 1}</span>
                </div>
                <span class="${color} text-sm">${status}</span>
            </div>
        `;
    }
    
    summaryHTML += `
            </div>
        </div>
        
        <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center gap-2 text-blue-700">
                <i class="fas fa-info-circle"></i>
                <span class="text-sm">আপনি এখনও পরীক্ষা জমা দিতে পারেন বা ফিরে গিয়ে উত্তর দিতে পারেন।</span>
            </div>
        </div>
    `;
    
    document.getElementById('examSummaryContent').innerHTML = summaryHTML;
    document.getElementById('examSummaryModal').classList.remove('hidden');
}

// ২২. অ্যাডভান্সড সাবমিট
async function submitExamAdvanced() {
    if (TIMER_INT) {
        clearInterval(TIMER_INT);
        TIMER_INT = null;
    }
    
    // কনফার্মেশন
    const unanswered = ACTIVE_EXAM.questions.length - Object.keys(userAnswers).length;
    if (unanswered > 0) {
        const confirmSubmit = confirm(`আপনার ${unanswered} টি প্রশ্নের উত্তর দেওয়া হয়নি। আপনি কি নিশ্চিত যে পরীক্ষা জমা দিতে চান?`);
        if (!confirmSubmit) return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্রসেসিং...';
        submitBtn.disabled = true;
    }
    
    if (!ACTIVE_EXAM) return;
    
    // স্কোর ক্যালকুলেশন
    let score = 0;
    const total = ACTIVE_EXAM.questions ? ACTIVE_EXAM.questions.length : 0;
    let correctAnswers = [];
    
    if (total > 0) {
        ACTIVE_EXAM.questions.forEach((q, i) => {
            const userAns = userAnswers[i];
            const correctAns = parseInt(q.ans);
            
            if (userAns !== undefined && userAns === correctAns) {
                score++;
                correctAnswers.push(i);
            }
        });
    }
    
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const timeTaken = Math.floor((Date.now() - examStartTime) / 1000);
    
    // ডাটা অবজেক্ট
    const resultData = {
        uid: CURR_USER.id,
        eid: ACTIVE_EXAM.id,
        score: score,
        total: total,
        percentage: percentage,
        userAnswers: userAnswers,
        correctAnswers: correctAnswers,
        timeTaken: timeTaken,
        reviewQuestions: Object.keys(REVIEW_QUESTIONS),
        timestamp: Date.now()
    };
    
    try {
        // ডাটাবেসে সেভ
        const resultRef = await db.ref('results').push(resultData);
        const resultId = resultRef.key;
        
        // গিফট লজিক
        if (ACTIVE_EXAM.giftAmount > 0 && score > 0) {
            const giftAmount = Math.round((score / total) * ACTIVE_EXAM.giftAmount);
            if (giftAmount > 0) {
                const newBalance = CURR_USER.bal + giftAmount;
                await db.ref('users/' + CURR_USER.id + '/bal').set(newBalance);
                CURR_USER.bal = newBalance;
                
                await db.ref('gifts').push({
                    uid: CURR_USER.id,
                    eid: ACTIVE_EXAM.id,
                    resultId: resultId,
                    amount: giftAmount,
                    reason: `Exam Reward (${score}/${total})`,
                    timestamp: Date.now()
                });
            }
        }
        
        // পুরস্কার লজিক
        if (ACTIVE_EXAM.prize > 0) {
            // টপ পারফরমারদের জন্য পুরস্কার লজিক
            // আপনি চাইলে পরে ইমপ্লিমেন্ট করতে পারেন
        }
        
        // লোকাল ডাটা আপডেট
        if (!DB_DATA.results) DB_DATA.results = {};
        DB_DATA.results[resultId] = resultData;
        
        if (DB_DATA.users && DB_DATA.users[CURR_USER.id]) {
            DB_DATA.users[CURR_USER.id].bal = CURR_USER.bal;
        }
        
        // সাফল্য মেসেজ
        const timeTakenMin = Math.floor(timeTaken / 60);
        const timeTakenSec = timeTaken % 60;
        
        alert(`✅ পরীক্ষা সফলভাবে জমা দেওয়া হয়েছে!\n\n📊 স্কোর: ${score}/${total} (${percentage}%)\n⏱️ সময়: ${timeTakenMin} মিনিট ${timeTakenSec} সেকেন্ড\n💰 অর্জিত ব্যালেন্স: ৳${Math.round((score / total) * ACTIVE_EXAM.giftAmount) || 0}\n\nআপনার উত্তরপত্র দেখতে 'উত্তরপত্র' বাটনে ক্লিক করুন।`);
        
        // মডাল বন্ধ
        closeModal();
        
        // ভেরিয়েবল রিসেট
        ACTIVE_EXAM = null;
        currentQuestionIndex = 0;
        userAnswers = {};
        REVIEW_QUESTIONS = {};
        examStartTime = null;
        
        // UI রিফ্রেশ
        updateUserUI();
        setTimeout(() => {
            renderExams();
        }, 100);
        
    } catch (error) {
        console.error("Submit Error:", error);
        alert("❌ সাবমিট করতে সমস্যা হয়েছে: " + error.message);
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> সাবমিট করুন';
            submitBtn.disabled = false;
        }
    }
}

// ==================== LEGACY FUNCTIONS (পুরোনো থিমের জন্য) ====================

// পুরোনো UI (কম্প্যাটিবিলিটির জন্য রাখা)
function startExamUI() {
    document.getElementById('runExamTitle').innerText = ACTIVE_EXAM.title;
    const examBody = document.getElementById('examBody');
    examBody.innerHTML = '';

    if (ACTIVE_EXAM.questions) {
        ACTIVE_EXAM.questions.forEach((q, i) => {
            let qHtml = '';
            
            // প্রশ্ন রেন্ডার
            if (q.type === 'image') {
                qHtml = `<div class="mb-2"><b>Q${i+1}:</b></div><img src="${q.val}" class="q-img" style="max-width:100%">`;
            } else {
                qHtml = `<div class="mb-2"><b>Q${i+1}:</b> ${q.val}</div>`;
            }

            // অপশন রেন্ডার
            let optHtml = '';
            if(q.opts) {
                q.opts.forEach((opt, idx) => {
                    optHtml += `
                        <label class="mcq-opt">
                            <input type="radio" name="q${i}" value="${idx}">
                            <div style="width:100%">${opt}</div>
                        </label>
                    `;
                });
            }

            examBody.innerHTML += `
                <div class="card" style="margin-bottom: 20px;">
                    ${qHtml}
                    <div class="mt-2">${optHtml}</div>
                </div>
            `;
        });
    }

    document.getElementById('modal-exam').classList.remove('hidden');

    // টাইমার
    let timeLeft = (ACTIVE_EXAM.dur || 10) * 60;
    updateTimerDisplay(timeLeft);
    
    if(TIMER_INT) clearInterval(TIMER_INT);
    TIMER_INT = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        if(timeLeft <= 0) {
            clearInterval(TIMER_INT);
            submitExam();
        }
    }, 1000);

    // MathJax রেন্ডার
    if(window.MathJax) {
        setTimeout(() => {
            MathJax.typesetPromise();
        }, 500);
    }
}

// পুরোনো সাবমিট ফাংশন
async function submitExam() {
    // ১. টাইমার ও বাটন হ্যান্ডেলিং
    if (TIMER_INT) {
        clearInterval(TIMER_INT);
        TIMER_INT = null;
    }
    
    const submitBtn = document.querySelector('#modal-exam .btn-success');
    if(submitBtn) {
        submitBtn.innerText = "Processing...";
        submitBtn.disabled = true;
    }

    if (!ACTIVE_EXAM) return;

    // ২. স্কোর ক্যালকুলেশন
    let score = 0;
    const total = ACTIVE_EXAM.questions ? ACTIVE_EXAM.questions.length : 0;
    let userAnswersOld = [];
    
    if (total > 0) {
        ACTIVE_EXAM.questions.forEach((q, i) => {
            const selected = document.querySelector(`input[name="q${i}"]:checked`);
            let userAns = -1;
            if (selected) userAns = parseInt(selected.value);
            userAnswersOld.push(userAns);
            if (userAns === parseInt(q.ans)) score++;
        });
    }
    
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // ৩. ডাটা অবজেক্ট তৈরি
    const resultData = {
        uid: CURR_USER.id,
        eid: ACTIVE_EXAM.id,
        score: score,
        total: total,
        percentage: percentage,
        userAnswers: userAnswersOld,
        timestamp: Date.now()
    };

    try {
        // ৪. ডাটাবেসে পাঠানো
        await db.ref('results').push(resultData);
        
        // ৫. গিফট লজিক
        if (ACTIVE_EXAM.giftAmount > 0) {
            const newBalance = CURR_USER.bal + ACTIVE_EXAM.giftAmount;
            await db.ref('users/' + CURR_USER.id + '/bal').set(newBalance);
            CURR_USER.bal = newBalance;
            await db.ref('gifts').push({
                uid: CURR_USER.id,
                eid: ACTIVE_EXAM.id,
                amount: ACTIVE_EXAM.giftAmount,
                reason: 'Exam Reward',
                timestamp: Date.now()
            });
        }

        // লোকাল ডাটাবেস আপডেট
        if (!DB_DATA.results) DB_DATA.results = {};
        const tempKey = "temp_" + Date.now();
        DB_DATA.results[tempKey] = resultData;
        
        // ইউজার ব্যালেন্স আপডেট
        if(DB_DATA.users && DB_DATA.users[CURR_USER.id]) {
            DB_DATA.users[CURR_USER.id].bal = CURR_USER.bal;
        }

        alert(`সাবমিট সফল হয়েছে!\nস্কোর: ${score}/${total}`);
        
        // মডাল বন্ধ করা
        closeModal();
        ACTIVE_EXAM = null;
        
        // UI রিফ্রেশ
        updateUserUI();
        
        // এক্সাম লিস্ট জোর করে রিফ্রেশ করা
        setTimeout(() => {
            renderExams(); 
        }, 100);

    } catch (error) {
        console.error("Submit Error:", error);
        alert("এরর: " + error.message);
    } finally {
        if(submitBtn) {
            submitBtn.innerText = "Submit";
            submitBtn.disabled = false;
        }
    }
}

// ==================== UTILITY FUNCTIONS ====================

// মোড টগল ফাংশন (অ্যাডমিন প্যানেলে)
function toggleMode() {
    const mode = document.getElementById('exMode').value;
    const nativeDiv = document.getElementById('nativeMode');
    const googleDiv = document.getElementById('googleMode');
    
    if (mode === 'Google') {
        nativeDiv.classList.add('hidden');
        googleDiv.classList.remove('hidden');
    } else {
        nativeDiv.classList.remove('hidden');
        googleDiv.classList.add('hidden');
    }
}

// এক্সাম ডিলিট ফাংশন
async function deleteExam(id) {
    if (!confirm("⚠️ আপনি কি নিশ্চিত যে এই এক্সামটি ডিলিট করতে চান?\n\nএটি পার্মানেন্টলি ডিলিট হয়ে যাবে!")) {
        return;
    }

    try {
        await db.ref('exams/' + id).remove();
        alert("✅ এক্সাম সফলভাবে ডিলিট হয়েছে!");
        renderAdminExams();
        renderExams();
    } catch (error) {
        console.error("Delete Error:", error);
        alert("ডিলিট করা যায়নি: " + error.message);
    }
}

// ছাত্র ডিলিট ফাংশন (অ্যাডমিন প্যানেলে)
async function deleteStudent(mobile) {
    if (!confirm(`আপনি কি নিশ্চিত যে ${mobile} নম্বরের ছাত্র/ছাত্রীকে ডিলিট করতে চান?\n\nএটি পার্মানেন্টলি ডিলিট হয়ে যাবে!`)) {
        return;
    }

    try {
        await db.ref('users/' + mobile).remove();
        alert("✅ ছাত্র/ছাত্রী সফলভাবে ডিলিট হয়েছে!");
        renderAdminUsers();
    } catch (error) {
        console.error("Delete Student Error:", error);
        alert("ডিলিট করা যায়নি: " + error.message);
    }
}

// টাইমার ডিসপ্লে (পুরোনো থিমের জন্য)
function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timerDisplay').innerText = 
        `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}