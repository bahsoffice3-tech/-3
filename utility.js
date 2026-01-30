// ==================== UTILITY FUNCTIONS ====================

async function uploadImg(file) {
    if (!file) return '';
    
    const formData = new FormData();
    formData.append("image", file);
    
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();
        return data.data.url;
    } catch (error) {
        console.error('Upload error:', error);
        return '';
    }
}

function copy(id) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard');
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

function searchStudents(query) {
    const filter = query.toUpperCase();
    const cards = document.getElementsByClassName('student-card');
    for (let i = 0; i < cards.length; i++) {
        const txt = cards[i].innerText;
        if (txt.toUpperCase().indexOf(filter) > -1) {
            cards[i].style.display = "";
        } else {
            cards[i].style.display = "none";
        }
    }
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timerDisplay').innerText = 
        `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

