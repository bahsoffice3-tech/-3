// ==================== DATABASE INITIALIZATION ====================
async function initializeDatabase() {
    try {
        console.log("📡 Checking database...");
        
        const snapshot = await db.ref().once('value');
        const data = snapshot.val();
        
        if (!data || !data.users || !data.config) {
            console.log("📦 Initializing database with default data...");
            await setupDefaultDatabase();
        } else {
            console.log("✅ Database already initialized");
            DB_DATA = data;
        }
        
        return true;
    } catch (error) {
        console.error("❌ Database initialization error:", error);
        return false;
    }
}

async function setupDefaultDatabase() {
    const defaultData = {
        config: {
            notice: "🎉 Welcome to MRDS Education Platform v6.2!",
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
                t: 'স্বাগতম MRDS এ!',
                c: 'এটি একটি ডেমো পোস্ট। আপনি এডমিন প্যানেল থেকে নতুন পোস্ট যোগ করতে পারেন।',
                img: '',
                link: '',
                linkTxt: '',
                category: 'General',
                timestamp: Date.now()
            }
        },
        exams: {
            'exam1': {
                title: 'Class 10 গণিত টেস্ট',
                mode: 'Native',
                class: 'Class 10',
                start: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                end: new Date(Date.now() + 172800000).toISOString().slice(0, 16),
                dur: 30,
                fee: 10,
                prize: 100,
                giftAmount: 20,
                questions: [
                    {
                        type: 'text',
                        val: '২ + ২ = কত?',
                        opts: ['৩', '৪', '৫', '৬'],
                        ans: 1
                    },
                    {
                        type: 'text',
                        val: '১৬-এর বর্গমূল কত?',
                        opts: ['২', '৩', '৪', '৫'],
                        ans: 2
                    }
                ],
                created: Date.now()
            }
        },
        library: {
            'lib1': {
                title: 'Class 10 Mathematics PDF',
                link: 'https://example.com/math.pdf',
                type: 'PDF',
                added: Date.now()
            }
        },
        txs: {},
        results: {},
        msgs: {},
        gifts: {}
    };

    try {
        await db.ref().set(defaultData);
        console.log("✅ Default database setup completed");
        DB_DATA = defaultData;
        return true;
    } catch (error) {
        console.error("❌ Database setup failed:", error);
        return false;
    }
}

