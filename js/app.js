// frontend/js/app.js

let traits = { 
    social: 5, curiosity: 5, resilience: 5, empathy: 5,
    independence: 5, adaptability: 5, playfulness: 5,
    wisdom: 5, creativity: 5, protectiveness: 5 
};

let history = [];
let questionCount = 0;
const MAX_QUESTIONS = 7;

let isRegisterMode = false;

function showScreen(screenId) {
    document.querySelectorAll('.login-screen, .screen, .result-screen').forEach(el => el.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex';

    const navbar = document.getElementById('navbar');
    if (navbar) navbar.style.display = (screenId === 'login-screen') ? 'none' : 'flex';
}

async function handleAuth() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const name = document.getElementById('auth-name').value.trim();

    if (!email || !password) return alert("Email and password required");

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const body = isRegisterMode ? {name, email, password} : {email, password};

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) return alert(data.message || "Failed");

        localStorage.setItem('soulvista_token', data.token);
        showScreen('home-screen');
    } catch (err) {
        alert("Cannot connect to server. Make sure backend is running (npm run dev)");
    }
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-name').style.display = isRegisterMode ? 'block' : 'none';
    document.getElementById('auth-button').textContent = isRegisterMode ? "Register" : "Login";
    document.getElementById('mode-toggle').textContent = isRegisterMode ? 
        "Already have an account? Login" : "Don't have an account? Register here";
}

function logout() {
    localStorage.removeItem('soulvista_token');
    showScreen('login-screen');
}

async function callBackend(endpoint, body) {
    const token = localStorage.getItem('soulvista_token');
    try {
        const res = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(body)
        });

        if (res.status === 401) {
            alert("Session expired. Please log in again.");
            logout();
            return null;
        }
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function generateNextQuestion() {
    questionCount++;
    document.getElementById('q-current').textContent = questionCount;

    const loader = document.getElementById('loader');
    const options = document.getElementById('options');

    loader.style.display = 'block';
    options.style.display = 'none';

    const data = await callBackend('/next-question', { traits, history });

    if (data?.question) {
        document.getElementById('question-text').textContent = data.question;
        options.innerHTML = `
            <button onclick="handleAnswer(2,'${data.question.replace(/'/g,"\\'")}')">YES</button>
            <button onclick="handleAnswer(1,'${data.question.replace(/'/g,"\\'")}')">SOMETIMES</button>
            <button onclick="handleAnswer(0,'${data.question.replace(/'/g,"\\'")}')">NO</button>
        `;
    } else {
        document.getElementById('question-text').textContent = "The sky is quiet... Please try again.";
    }

    loader.style.display = 'none';
    options.style.display = 'flex';
}

window.handleAnswer = async function(value, q) {
    history.push({ question: q, answer: value });

    Object.keys(traits).forEach(k => {
        traits[k] += (value - 1) * 0.5;
        traits[k] = Math.max(1, Math.min(10, traits[k]));
    });

    if (questionCount >= MAX_QUESTIONS) {
        showResult();
    } else {
        generateNextQuestion();
    }
};

async function showResult() {
    const data = await callBackend('/result', { traits, history });
    showScreen('result-screen');

    if (!data) return;

    document.getElementById('character-name').textContent = data.name || "Mystic Spirit";
    
    // Changed to Match Percentage
    document.getElementById('confidence').innerHTML = `
        ${data.name} Match: <strong>${data.confidence || 80}%</strong>
    `;

    document.getElementById('description').innerHTML = data.desc || "A beautiful soul has been revealed.";

    const fill = document.getElementById('confidence-fill');
    if (fill) fill.style.width = (data.confidence || 80) + "%";
}

window.startPersonalityScan = function() {
    questionCount = 0;
    history = [];
    traits = { social:5, curiosity:5, resilience:5, empathy:5, independence:5, adaptability:5, playfulness:5, wisdom:5, creativity:5, protectiveness:5 };

    showScreen('game-screen');
    setTimeout(generateNextQuestion, 200);
};

function retakeSameScan() {
    startPersonalityScan();
}

// Clouds
function createCloud() {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.style.left = Math.random() * 100 + 'vw';
    cloud.style.top = Math.random() * 60 + '%';
    document.getElementById('clouds').appendChild(cloud);
    setTimeout(() => cloud.remove(), 120000);
}

// Init + Dropdown
document.addEventListener('DOMContentLoaded', () => {
    const gamemodeBtn = document.getElementById('gamemode-btn');
    const dropdownContent = document.getElementById('dropdown-content');
    const startScanBtn = document.getElementById('start-scan-btn');

    gamemodeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    startScanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dropdownContent.style.display = 'none';
        startPersonalityScan();
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown') && dropdownContent) dropdownContent.style.display = 'none';
    });

    if (localStorage.getItem('soulvista_token')) {
        showScreen('home-screen');
    } else {
        showScreen('login-screen');
    }

    setInterval(createCloud, 4000);
    createCloud();
});

function googleLogin() {
    alert("Google login coming soon!");
}