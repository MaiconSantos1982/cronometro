// ==========================================
// CONFIGURAÇÃO DO SPOTIFY
// ==========================================

// SEU CLIENT ID
const CLIENT_ID = '7d8a72d5c0334966b72f8fc02b5e85b2'; 

// Detecta URL automaticamente (Vercel ou Localhost)
const REDIRECT_URI = window.location.href.split('#')[0].split('?')[0];

let spotifyToken = null;

// Verifica login ao carregar a página
window.onload = () => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        spotifyToken = params.get('access_token');
        
        // Limpa URL
        window.history.pushState("", document.title, window.location.pathname);
        
        // Ajusta UI
        document.getElementById('login-area').style.display = 'none';
        document.getElementById('player-controls').style.display = 'flex';
        
        // Busca música atual
        getCurrentTrack();
    }
};

// ==========================================
// LÓGICA DO CRONÔMETRO
// ==========================================

let timer = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;

function startPause() {
    // Pegamos os dois ícones SVG pelo ID
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    
    if (!isRunning) {
        // Start
        startTime = Date.now() - elapsedTime;
        timer = setInterval(updateDisplay, 10);
        isRunning = true;
        
        // Troca visibilidade dos ícones
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        // Pause
        clearInterval(timer);
        isRunning = false;
        
        // Troca visibilidade dos ícones
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

function stop() {
    clearInterval(timer);
    isRunning = false;
    elapsedTime = 0;
    updateDisplay();
    
    // Reseta ícones para estado inicial (Play visível)
    document.getElementById('playIcon').style.display = 'block';
    document.getElementById('pauseIcon').style.display = 'none';
}

function reset() {
    clearInterval(timer);
    elapsedTime = 0;
    isRunning = true;
    startTime = Date.now();
    timer = setInterval(updateDisplay, 10);
    
    // Como o reset já inicia contando, mostra o Pause
    document.getElementById('playIcon').style.display = 'none';
    document.getElementById('pauseIcon').style.display = 'block';
}

function updateDisplay() {
    if (isRunning) {
        elapsedTime = Date.now() - startTime;
    }
    
    const totalMilliseconds = Math.floor(elapsedTime);
    const minutes = Math.floor(totalMilliseconds / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
    
    document.getElementById('minutes').textContent = pad(minutes);
    document.getElementById('seconds').textContent = pad(seconds);
    document.getElementById('milliseconds').textContent = pad(milliseconds);
}

function pad(number) {
    return number.toString().padStart(2, '0');
}

// Inicializar display
updateDisplay();


// ==========================================
// FUNÇÕES DO SPOTIFY (CORRIGIDAS)
// ==========================================

function spotifyLogin() {
    const scopes = 'user-modify-playback-state user-read-playback-state user-read-currently-playing';
    
    // URL CORRETA de Autorização
    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(CLIENT_ID);
    url += '&scope=' + encodeURIComponent(scopes);
    url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
    
    window.location = url;
}

async function spotifyCommand(type) {
    if (!spotifyToken) return;

    let endpoint = '';
    let method = 'POST';

    if (type === 'next') endpoint = 'next';
    else if (type === 'previous') endpoint = 'previous';
    else if (type === 'play') {
        // Tenta alternar play/pause logicamente
        try {
            const stateResponse = await fetch('https://api.spotify.com/v1/me/player', {
                headers: { 'Authorization': 'Bearer ' + spotifyToken }
            });
            
            if (stateResponse.status === 200) {
                const state = await stateResponse.json();
                if (state.is_playing) {
                    endpoint = 'pause';
                    method = 'PUT';
                } else {
                    endpoint = 'play';
                    method = 'PUT';
                }
            } else {
                endpoint = 'play';
                method = 'PUT';
            }
        } catch (e) {
            endpoint = 'play';
            method = 'PUT';
        }
    }

    try {
        // URL CORRETA da API
        await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
            method: method,
            headers: { 'Authorization': 'Bearer ' + spotifyToken }
        });
        
        setTimeout(getCurrentTrack, 500);
        
    } catch (error) {
        console.error("Erro Spotify:", error);
        if(error.status === 401) {
            alert("Sessão expirou.");
            document.getElementById('login-area').style.display = 'block';
            document.getElementById('player-controls').style.display = 'none';
        }
    }
}

async function getCurrentTrack() {
    if (!spotifyToken) return;
    try {
        // URL CORRETA da API
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': 'Bearer ' + spotifyToken }
        });
        
        if (response.status === 204) {
            document.getElementById('track-info').innerText = "Spotify parado...";
            return;
        }

        const data = await response.json();
        const artist = data.item.artists[0].name;
        const song = data.item.name;
        document.getElementById('track-info').innerText = `${song} - ${artist}`;
        
    } catch (e) {
        console.log("Erro ao ler faixa", e);
    }
}
