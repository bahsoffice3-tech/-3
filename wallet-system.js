// ==================== WALLET FUNCTIONS ====================
async function reqDep() {
    const amt = parseFloat(document.getElementById('depAmt').value);
    const method = document.getElementById('depMethod').value;
    const trx = document.getElementById('depTrx').value.trim();
    
    if (!amt || amt <= 0) return alert("টাকার পরিমাণ দিন");
    if (!trx) return alert("Transaction ID দিন");
    
    const config = DB_DATA?.config || {};
    if (config.minDep && amt < config.minDep) {
        return alert(`সর্বনিম্ন ডিপোজিট: ৳${config.minDep}`);
    }
    
    await db.ref('txs').push({
        uid: CURR_USER.id,
        type: 'Deposit',
        amount: amt,
        method: method,
        trx: trx,
        status: 'Pending',
        timestamp: Date.now()
    });
    
    alert("ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে!");
    closeModal();
    renderApp();
}

async function reqWd() {
    const amt = parseFloat(document.getElementById('wdAmt').value);
    const method = document.getElementById('wdMethod').value;
    const num = document.getElementById('wdNum').value.trim();
    
    if (!amt || amt <= 0) return alert("টাকার পরিমাণ দিন");
    if (!num) return alert("মোবাইল নম্বর দিন");
    
    if (CURR_USER.bal < amt) return alert("পর্যাপ্ত ব্যালেন্স নেই");
    
    const config = DB_DATA?.config || {};
    if (config.minWd && amt < config.minWd) {
        return alert(`সর্বনিম্ন উত্তোলন: ৳${config.minWd}`);
    }
    
    await db.ref('txs').push({
        uid: CURR_USER.id,
        type: 'Withdraw',
        amount: amt,
        method: method,
        trx: num,
        status: 'Pending',
        timestamp: Date.now()
    });
    
    alert("উত্তোলন রিকোয়েস্ট পাঠানো হয়েছে!");
    closeModal();
    renderApp();
}

async function admTx(txId, approve) {
    const txRef = db.ref('txs/' + txId);
    const txSnap = await txRef.once('value');
    const tx = txSnap.val();
    
    if (!tx) return;
    
    const newStatus = approve ? 'Approved' : 'Rejected';
    await txRef.update({ status: newStatus });
    
    if (approve) {
        const userRef = db.ref('users/' + tx.uid + '/bal');
        const userSnap = await userRef.once('value');
        const currentBal = userSnap.val() || 0;
        
        if (tx.type === 'Deposit') {
            await userRef.set(currentBal + tx.amount);
        } else if (tx.type === 'Withdraw') {
            await userRef.set(currentBal - tx.amount);
        }
        
        if (CURR_USER.id === tx.uid) {
            CURR_USER.bal = currentBal + (tx.type === 'Deposit' ? tx.amount : -tx.amount);
        }
    }
    
    alert(`Transaction ${newStatus}`);
    renderApp();
}

