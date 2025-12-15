let timer = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;

function startPause() {
    const playPauseIcon = document.getElementById('playPauseIcon');
    
    if (!isRunning) {
        // Start
        startTime = Date.now() - elapsedTime;
        timer = setInterval(updateDisplay, 10);
        isRunning = true;
        playPauseIcon.className = 'bi bi-pause-fill';
    } else {
        // Pause
        clearInterval(timer);
        isRunning = false;
        playPauseIcon.className = 'bi bi-play-fill';
    }
}

function stop() {
    clearInterval(timer);
    isRunning = false;
    elapsedTime = 0;
    updateDisplay();
    document.getElementById('playPauseIcon').className = 'bi bi-play-fill';
}

function reset() {
    clearInterval(timer);
    elapsedTime = 0;
    isRunning = true;
    startTime = Date.now();
    timer = setInterval(updateDisplay, 10);
    document.getElementById('playPauseIcon').className = 'bi bi-pause-fill';
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

// --- Lógica do Spotify ---

// 1. COLE SEU CLIENT ID AQUI (Do painel de desenvolvedor do Spotify)
const CLIENT_ID = '7d8a72d5c0334966b72f8fc02b5e85b2'; 

// 2. A URL deve ser EXATAMENTE a mesma cadastrada no painel do Spotify
// Se estiver testando localmente, verifique a porta no navegador (ex: 5500 ou 8080)
const REDIRECT_URI = window.location.href.split('#')[0]; // Pega a URL atual limpa

let spotifyToken = null;

// Verifica se a página carregou com o token na URL (volta do login)
window.onload = () => {
    // Mantém o estado do cronômetro se necessário (opcional)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        spotifyToken = params.get('access_token');
        
        // Limpa a URL para ficar bonita
        window.history.pushState("", document.title, window.location.pathname);
        
        // Ativa a interface
        document.getElementById('login-area').style.display = 'none';
        document.getElementById('player-controls').style.display = 'flex';
        
        // Busca o que está tocando agora para confirmar conexão
        getCurrentTrack();
    }
};

function spotifyLogin() {
    // Escopos: permissão para ler estado e controlar playback
    const scopes = 'user-modify-playback-state user-read-playback-state';
    
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

    if (type === 'next') endpoint = 'me/player/next';
    else if (type === 'previous') endpoint = 'me/player/previous';
    else if (type === 'play') {
        // Lógica simples de toggle play/pause requer verificar estado antes,
        // mas para simplificar, vamos tentar dar "play" ou "pause" direto
        // O ideal seria verificar o estado atual, mas aqui forçamos o Play/Resume
        endpoint = 'me/player/play'; 
        method = 'PUT';
    }

    try {
        await fetch(`https://api.spotify.com/v1/${endpoint}`, {
            method: method,
            headers: { 'Authorization': 'Bearer ' + spotifyToken }
        });
        
        // Atualiza info da música após breve delay
        setTimeout(getCurrentTrack, 500);
        
    } catch (error) {
        console.error("Erro Spotify:", error);
        // Se der erro 401, o token expirou
        if(error.status === 401) {
            alert("Sessão do Spotify expirou. Conecte novamente.");
            document.getElementById('login-area').style.display = 'block';
            document.getElementById('player-controls').style.display = 'none';
        }
    }
}

async function getCurrentTrack() {
    if (!spotifyToken) return;
    try {
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
        console.log("Não foi possível ler a faixa atual");
    }
}
