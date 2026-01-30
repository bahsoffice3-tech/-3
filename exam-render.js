// ==================== ADVANCED MCQ EXAM RENDERER ====================

let currentQuestionIndex = 0;
let userAnswers = {};
let examStartTime = null;

// ১. নতুন MCQ এক্সাম UI চালু করা
function startExamUIAdvanced() {
    if (!ACTIVE_EXAM) return;
    
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
                </div>
            </div>
            
            <!-- Question Counter & Progress -->
            <div class="question-counter">
                <div class="counter-left">
                    <div class="question-number">প্রশ্ন <span id="currentQNum">1</span>/<span id="totalQNum">${ACTIVE_EXAM.questions?.length || 0}</span></div>
                    <div class="question-status" id="answeredStatus">0 উত্তর দেওয়া হয়েছে</div>
                </div>
                
                <!-- Timer -->
                <div class="exam-timer" id="examTimer">
                    <i class="fas fa-clock timer-icon"></i>
                    <div class="timer-text" id="timerDisplayAdv">00:00</div>
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
                    <button class="nav-btn" onclick="markForReview()" id="markBtn">
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
        </div>
    `;
    
    // টাইমার শুরু
    examStartTime = Date.now();
    startTimerAdvanced();
    
    // প্রশ্ন লিস্ট তৈরি
    renderQuestionListNav();
    
    // প্রথম প্রশ্ন দেখাও
    renderQuestion(currentQuestionIndex);
    
    // মডাল ওপেন
    document.getElementById('modal-exam').classList.remove('hidden');
}

// ২. প্রশ্ন রেন্ডার করা
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
                <img src="${question.val}" class="question-image" alt="Question Image">
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
            
            optionsHTML += `
                <div class="option-card ${isSelected ? 'selected' : ''}" 
                     onclick="selectOption(${index}, ${optIndex})">
                    <div class="option-letter">${letter}</div>
                    <div class="option-text">${opt}</div>
                    ${isSelected ? '<i class="fas fa-check-circle option-check"></i>' : ''}
                </div>
            `;
        });
    }
    
    optionsHTML += '</div>';
    
    container.innerHTML = questionHTML + optionsHTML;
    
    // আপডেট UI
    document.getElementById('currentQNum').textContent = index + 1;
    document.getElementById('totalQNum').textContent = ACTIVE_EXAM.questions.length;
    
    // বাটন স্টেট আপডেট
    updateButtonStates(index);
    
    // MathJax রেন্ডার
    if (window.MathJax) {
        setTimeout(() => {
            MathJax.typesetPromise();
        }, 100);
    }
}

// ৩. অপশন সিলেক্ট করা
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

// ৪. পরের প্রশ্ন
function nextQuestion() {
    if (currentQuestionIndex < ACTIVE_EXAM.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);
    }
}

// ৫. আগের প্রশ্ন
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion(currentQuestionIndex);
    }
}

// ৬. রিভিউ মার্ক করা
function markForReview() {
    // রিভিউ লজিক ইমপ্লিমেন্ট করতে পারেন
    alert('এই প্রশ্নটি রিভিউ এর জন্য মার্ক করা হয়েছে');
}

// ৭. প্রশ্ন লিস্ট নেভিগেশন
function renderQuestionListNav() {
    const container = document.getElementById('questionListNav');
    if (!container || !ACTIVE_EXAM.questions) return;
    
    container.innerHTML = '';
    
    ACTIVE_EXAM.questions.forEach((_, index) => {
        const isAnswered = userAnswers[index] !== undefined;
        const isCurrent = index === currentQuestionIndex;
        
        container.innerHTML += `
            <button class="question-number-btn ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}"
                    onclick="jumpToQuestion(${index})">
                ${index + 1}
            </button>
        `;
    });
}

// ৮. প্রশ্ন লিস্ট আপডেট
function updateQuestionListNav() {
    const buttons = document.querySelectorAll('.question-number-btn');
    buttons.forEach((btn, index) => {
        const isAnswered = userAnswers[index] !== undefined;
        const isCurrent = index === currentQuestionIndex;
        
        btn.classList.remove('answered', 'current');
        if (isAnswered) btn.classList.add('answered');
        if (isCurrent) btn.classList.add('current');
    });
}

// ৯. নির্দিষ্ট প্রশ্নে যাওয়া
function jumpToQuestion(index) {
    currentQuestionIndex = index;
    renderQuestion(index);
}

// ১০. উত্তর দেওয়া স্ট্যাটাস আপডেট
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

// ১১. বাটন স্টেট আপডেট
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
    submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> সাবমিট করুন (${answeredCount}/${totalQuestions})`;
}

// ১২. অ্যাডভান্সড টাইমার
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
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(TIMER_INT);
            submitExamAdvanced();
        }
    }
    
    updateTimer();
    TIMER_INT = setInterval(updateTimer, 1000);
}

// ১৩. অ্যাডভান্সড সাবমিট
async function submitExamAdvanced() {
    if (TIMER_INT) {
        clearInterval(TIMER_INT);
        TIMER_INT = null;
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
    
    if (total > 0) {
        ACTIVE_EXAM.questions.forEach((q, i) => {
            const userAns = userAnswers[i];
            if (userAns !== undefined && userAns === parseInt(q.ans)) {
                score++;
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
        timeTaken: timeTaken,
        timestamp: Date.now()
    };
    
    try {
        await db.ref('results').push(resultData);
        
        // গিফট লজিক
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
        
        // লোকাল ডাটা আপডেট
        if (!DB_DATA.results) DB_DATA.results = {};
        const tempKey = "temp_" + Date.now();
        DB_DATA.results[tempKey] = resultData;
        
        if (DB_DATA.users && DB_DATA.users[CURR_USER.id]) {
            DB_DATA.users[CURR_USER.id].bal = CURR_USER.bal;
        }
        
        // সাফল্য মেসেজ
        alert(`✅ পরীক্ষা সফলভাবে জমা দেওয়া হয়েছে!\n\nস্কোর: ${score}/${total} (${percentage}%)\nসময় লেগেছে: ${Math.floor(timeTaken / 60)} মিনিট ${timeTaken % 60} সেকেন্ড`);
        
        // মডাল বন্ধ
        closeModal();
        ACTIVE_EXAM = null;
        currentQuestionIndex = 0;
        userAnswers = {};
        examStartTime = null;
        
        // UI রিফ্রেশ
        updateUserUI();
        setTimeout(() => {
            renderExams();
        }, 100);
        
    } catch (error) {
        console.error("Submit Error:", error);
        alert("❌ সাবমিট করতে সমস্যা হয়েছে: " + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> সাবমিট করুন';
            submitBtn.disabled = false;
        }
    }
}

