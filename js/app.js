// App Configuration
const APP_CONFIG = {
    team: 'Napoli',
    teamId: 113, // Napoli team ID for football-data.org
    colors: {
        primary: '#004B9F',
        secondary: '#87CEEB'
    }
};

// API Configuration
const API_CONFIG = {
    // Football Data API (free tier)
    footballData: {
        baseUrl: 'https://api.football-data.org/v4',
        headers: {
            'X-Auth-Token': 'ecefe79f13b44346a96ab4fbec3398c8' // Users will need to get their own free API key
        }
    },
    // Alternative: API-Football (RapidAPI)
    rapidAPI: {
        baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
        headers: {
            'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY_HERE',
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
    },
    // News API for football news
    newsAPI: {
        baseUrl: 'https://newsapi.org/v2',
        apiKey: 'bb766d38f8d447d79aa8ac29ff8d9ffa'
    }
};

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    refreshBtn: document.getElementById('refreshBtn'),
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    newsContainer: document.getElementById('newsContainer'),
    matchesContainer: document.getElementById('matchesContainer'),
    squadContainer: document.getElementById('squadContainer'),
    standingsContainer: document.getElementById('standingsContainer'),
    filterBtns: document.querySelectorAll('.filter-btn')
};

// App State
let appState = {
    currentTab: 'news',
    currentMatchFilter: 'all',
    currentSquadFilter: 'all',
    data: {
        news: [],
        matches: [],
        squad: [],
        standings: []
    },
    lastUpdate: null
};

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('it-IT', options);
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minuti fa`;
    } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours} ore fa`;
    } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `${days} giorni fa`;
    }
}

function showLoading() {
    elements.loading.classList.add('show');
}

function hideLoading() {
    elements.loading.classList.remove('show');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
        text-align: center;
        border: 1px solid #f5c6cb;
    `;
    errorDiv.textContent = message;
    return errorDiv;
}

// API Functions for Real Data

// Fetch news about Napoli from NewsAPI
async function fetchNapoliNews() {
    try {
        const queries = [
            'Napoli calcio',
            'SSC Napoli',
            'Napoli Serie A',
            'Napoli football'
        ];
        
        const allNews = [];
        
        for (const query of queries) {
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=it&sortBy=publishedAt&pageSize=10&apiKey=${API_CONFIG.newsAPI.apiKey}`;
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                allNews.push(...data.articles);
            }
        }
        
        // Remove duplicates and sort by date
        const uniqueNews = allNews.filter((article, index, self) => 
            index === self.findIndex(a => a.title === article.title)
        ).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        return uniqueNews.slice(0, 20).map(article => ({
            id: article.url,
            title: article.title,
            summary: article.description || article.content?.substring(0, 200) + '...',
            source: article.source.name,
            date: article.publishedAt,
            url: article.url,
            image: article.urlToImage
        }));
    } catch (error) {
        console.error('Errore nel caricamento delle notizie:', error);
        throw new Error('Impossibile caricare le notizie. Verifica la connessione internet.');
    }
}

// Fetch Napoli matches from Football Data API
async function fetchNapoliMatches() {
    try {
        // Get current season matches for Napoli
        const url = `${API_CONFIG.footballData.baseUrl}/teams/${APP_CONFIG.teamId}/matches?status=SCHEDULED,LIVE,FINISHED`;
        
        const response = await fetch(url, {
            headers: API_CONFIG.footballData.headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.matches.map(match => ({
            id: match.id,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            homeScore: match.score.fullTime.home,
            awayScore: match.score.fullTime.away,
            date: match.utcDate,
            competition: match.competition.name,
            status: match.status.toLowerCase(),
            venue: match.venue || 'Da definire'
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
        console.error('Errore nel caricamento delle partite:', error);
        throw new Error('Impossibile caricare le partite. Verifica la tua API key.');
    }
}

// Fetch Napoli squad from Football Data API
async function fetchNapoliSquad() {
    try {
        const url = `${API_CONFIG.footballData.baseUrl}/teams/${APP_CONFIG.teamId}`;
        
        const response = await fetch(url, {
            headers: API_CONFIG.footballData.headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.squad.map(player => ({
            id: player.id,
            name: player.name,
            position: translatePosition(player.position),
            number: player.shirtNumber || 'N/A',
            age: calculateAge(player.dateOfBirth),
            nationality: player.nationality
        })).sort((a, b) => (a.number || 999) - (b.number || 999));
    } catch (error) {
        console.error('Errore nel caricamento della rosa:', error);
        throw new Error('Impossibile caricare la rosa. Verifica la tua API key.');
    }
}

// Fetch Serie A standings
async function fetchSerieAStandings() {
    try {
        // Serie A competition ID: 2019
        const url = `${API_CONFIG.footballData.baseUrl}/competitions/2019/standings`;
        
        const response = await fetch(url, {
            headers: API_CONFIG.footballData.headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.standings[0].table.map(team => ({
            position: team.position,
            team: team.team.name,
            played: team.playedGames,
            wins: team.won,
            draws: team.draw,
            losses: team.lost,
            goalsFor: team.goalsFor,
            goalsAgainst: team.goalsAgainst,
            goalDifference: team.goalDifference,
            points: team.points
        }));
    } catch (error) {
        console.error('Errore nel caricamento della classifica:', error);
        throw new Error('Impossibile caricare la classifica. Verifica la tua API key.');
    }
}

// Helper functions
function translatePosition(position) {
    const positions = {
        'Goalkeeper': 'Portiere',
        'Defence': 'Difensore',
        'Midfield': 'Centrocampista',
        'Offence': 'Attaccante'
    };
    return positions[position] || position;
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Data Loading Functions
async function loadData() {
    showLoading();
    
    try {
        const promises = [];
        
        // Check if we have API keys configured
        if (API_CONFIG.newsAPI.apiKey !== 'YOUR_NEWS_API_KEY_HERE') {
            promises.push(fetchNapoliNews().then(news => ({ type: 'news', data: news })));
        }
        
        if (API_CONFIG.footballData.headers['X-Auth-Token'] !== 'YOUR_API_KEY_HERE') {
            promises.push(
                fetchNapoliMatches().then(matches => ({ type: 'matches', data: matches })),
                fetchNapoliSquad().then(squad => ({ type: 'squad', data: squad })),
                fetchSerieAStandings().then(standings => ({ type: 'standings', data: standings }))
            );
        }
        
        if (promises.length === 0) {
            throw new Error('Nessuna API key configurata. Leggi le istruzioni per configurare le API.');
        }
        
        const results = await Promise.allSettled(promises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { type, data } = result.value;
                appState.data[type] = data;
            } else {
                console.error(`Errore nel caricamento dei dati:`, result.reason);
            }
        });
        
        appState.lastUpdate = new Date().toISOString();
        renderCurrentTab();
        
        // Show success feedback
        elements.refreshBtn.classList.add('spinning');
        setTimeout(() => {
            elements.refreshBtn.classList.remove('spinning');
        }, 1000);
        
    } catch (error) {
        console.error('Errore generale nel caricamento:', error);
        showApiConfigurationError();
    } finally {
        hideLoading();
    }
}

function showApiConfigurationError() {
    const container = document.querySelector('.main .container');
    container.innerHTML = `
        <div class="api-setup-guide" style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0;">
            <h2 style="color: var(--napoli-blue); margin-bottom: 20px;">
                <i class="fas fa-key"></i> Configurazione API Richiesta
            </h2>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3>Per utilizzare dati reali, devi configurare le seguenti API gratuite:</h3>
            </div>
            
            <div class="api-step" style="margin-bottom: 25px; padding: 20px; border-left: 4px solid var(--napoli-blue); background: #f8f9fa;">
                <h4>1. 📰 News API (per le notizie)</h4>
                <p>• Vai su: <a href="https://newsapi.org" target="_blank">https://newsapi.org</a></p>
                <p>• Registrati gratuitamente</p>
                <p>• Copia la tua API key</p>
                <p>• Sostituisci <code>YOUR_NEWS_API_KEY_HERE</code> nel file js/app.js</p>
            </div>
            
            <div class="api-step" style="margin-bottom: 25px; padding: 20px; border-left: 4px solid var(--napoli-blue); background: #f8f9fa;">
                <h4>2. ⚽ Football Data API (per partite, rosa, classifica)</h4>
                <p>• Vai su: <a href="https://www.football-data.org" target="_blank">https://www.football-data.org</a></p>
                <p>• Registrati gratuitamente (piano free: 10 richieste/minuto)</p>
                <p>• Copia la tua API key</p>
                <p>• Sostituisci <code>YOUR_API_KEY_HERE</code> nel file js/app.js</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin-top: 20px;">
                <strong>📝 Nota:</strong> Entrambe le API sono gratuite ma richiedono registrazione. 
                Una volta configurate, avrai accesso a tutti i dati reali del Napoli!
            </div>
            
            <button onclick="window.location.reload()" class="refresh-btn" style="margin-top: 20px; background: var(--napoli-blue); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer;">
                <i class="fas fa-refresh"></i> Ricarica dopo la configurazione
            </button>
        </div>
    `;
}

// Rendering Functions
function renderNews() {
    const newsContainer = elements.newsContainer;
    newsContainer.innerHTML = '';
    
    if (!appState.data.news || appState.data.news.length === 0) {
        newsContainer.appendChild(showError('Nessuna notizia disponibile. Configura la News API per vedere le ultime notizie sul Napoli.'));
        return;
    }
    
    appState.data.news.forEach(newsItem => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-item';
        newsCard.innerHTML = `
            <div class="news-image" style="background-image: url('${newsItem.image || ''}')">
                ${!newsItem.image ? '<i class="fas fa-newspaper"></i>' : ''}
            </div>
            <div class="news-content">
                <h3 class="news-title">${newsItem.title}</h3>
                <p class="news-summary">${newsItem.summary}</p>
                <div class="news-meta">
                    <span class="news-source">${newsItem.source}</span>
                    <span class="news-date">${timeAgo(newsItem.date)}</span>
                </div>
            </div>
        `;
        
        newsCard.addEventListener('click', () => {
            window.open(newsItem.url, '_blank');
        });
        
        newsContainer.appendChild(newsCard);
    });
}

function renderMatches() {
    const matchesContainer = elements.matchesContainer;
    matchesContainer.innerHTML = '';
    
    if (!appState.data.matches || appState.data.matches.length === 0) {
        matchesContainer.appendChild(showError('Nessuna partita disponibile. Configura la Football Data API per vedere le partite del Napoli.'));
        return;
    }
    
    let filteredMatches = appState.data.matches;
    
    // Apply filter
    if (appState.currentMatchFilter !== 'all') {
        filteredMatches = appState.data.matches.filter(match => {
            if (appState.currentMatchFilter === 'upcoming') {
                return match.status === 'scheduled' || match.status === 'timed';
            } else if (appState.currentMatchFilter === 'completed') {
                return match.status === 'finished';
            }
            return true;
        });
    }
    
    if (filteredMatches.length === 0) {
        matchesContainer.innerHTML = '<p class="text-center">Nessuna partita trovata per il filtro selezionato</p>';
        return;
    }
    
    filteredMatches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        
        const isHomeTeamNapoli = match.homeTeam.toLowerCase().includes('napoli');
        const isAwayTeamNapoli = match.awayTeam.toLowerCase().includes('napoli');
        
        let scoreDisplay = '';
        if (match.status === 'finished' && match.homeScore !== null) {
            scoreDisplay = `<div class="match-score">${match.homeScore} - ${match.awayScore}</div>`;
        }
        
        let statusClass = '';
        let statusText = '';
        switch (match.status) {
            case 'scheduled':
            case 'timed':
                statusClass = 'status-upcoming';
                statusText = 'Prossima';
                break;
            case 'live':
            case 'in_play':
                statusClass = 'status-live';
                statusText = 'LIVE';
                break;
            case 'finished':
                statusClass = 'status-completed';
                statusText = 'Finita';
                break;
        }
        
        matchCard.innerHTML = `
            <div class="match-header">
                <span class="match-competition">${match.competition}</span>
                <span class="match-date">${formatDate(match.date)}</span>
            </div>
            <div class="match-teams">
                <div class="team">
                    <div class="team-name ${isHomeTeamNapoli ? 'napoli' : ''}">${match.homeTeam}</div>
                </div>
                <div class="match-vs">VS</div>
                <div class="team">
                    <div class="team-name ${isAwayTeamNapoli ? 'napoli' : ''}">${match.awayTeam}</div>
                </div>
            </div>
            ${scoreDisplay}
            <div class="text-center">
                <span class="match-status ${statusClass}">${statusText}</span>
            </div>
        `;
        
        matchesContainer.appendChild(matchCard);
    });
}

function renderSquad() {
    const squadContainer = elements.squadContainer;
    squadContainer.innerHTML = '';
    
    if (!appState.data.squad || appState.data.squad.length === 0) {
        squadContainer.appendChild(showError('Rosa non disponibile. Configura la Football Data API per vedere i giocatori del Napoli.'));
        return;
    }
    
    let filteredSquad = appState.data.squad;
    
    // Apply position filter
    if (appState.currentSquadFilter !== 'all') {
        const positionMap = {
            'goalkeeper': 'portiere',
            'defender': 'difensore',
            'midfielder': 'centrocampista',
            'forward': 'attaccante'
        };
        
        const filterPosition = positionMap[appState.currentSquadFilter];
        filteredSquad = appState.data.squad.filter(player => 
            player.position.toLowerCase().includes(filterPosition)
        );
    }
    
    if (filteredSquad.length === 0) {
        squadContainer.innerHTML = '<p class="text-center">Nessun giocatore trovato per la posizione selezionata</p>';
        return;
    }
    
    filteredSquad.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-number">${player.number}</div>
            <div class="player-name">${player.name}</div>
            <div class="player-position">${player.position}</div>
            <div class="player-stats">
                <div>Età: ${player.age}</div>
                <div>${player.nationality}</div>
            </div>
        `;
        
        squadContainer.appendChild(playerCard);
    });
}

function renderStandings() {
    const standingsContainer = elements.standingsContainer;
    standingsContainer.innerHTML = '';
    
    if (!appState.data.standings || appState.data.standings.length === 0) {
        standingsContainer.appendChild(showError('Classifica non disponibile. Configura la Football Data API per vedere la classifica della Serie A.'));
        return;
    }
    
    // Create header
    const header = document.createElement('div');
    header.className = 'standings-header';
    header.innerHTML = `
        <div class="standings-row">
            <div>Pos</div>
            <div>Squadra</div>
            <div>G</div>
            <div>V</div>
            <div>P</div>
            <div>Punti</div>
        </div>
    `;
    standingsContainer.appendChild(header);
    
    // Create rows
    appState.data.standings.forEach(team => {
        const row = document.createElement('div');
        row.className = `standings-row ${team.team.toLowerCase().includes('napoli') ? 'napoli' : ''}`;
        row.innerHTML = `
            <div class="position">${team.position}</div>
            <div class="team-name-standings">${team.team}</div>
            <div>${team.played}</div>
            <div>${team.wins}</div>
            <div>${team.losses}</div>
            <div class="points">${team.points}</div>
        `;
        
        standingsContainer.appendChild(row);
    });
}

function renderCurrentTab() {
    switch (appState.currentTab) {
        case 'news':
            renderNews();
            break;
        case 'matches':
            renderMatches();
            break;
        case 'squad':
            renderSquad();
            break;
        case 'standings':
            renderStandings();
            break;
    }
}

// Event Handlers
function handleTabClick(event) {
    const tabElement = event.currentTarget;
    const tabName = tabElement.dataset.tab;
    
    if (tabName === appState.currentTab) return;
    
    // Update active tab
    elements.tabs.forEach(tab => tab.classList.remove('active'));
    tabElement.classList.add('active');
    
    // Update active content
    elements.tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-content`).classList.add('active');
    
    appState.currentTab = tabName;
    renderCurrentTab();
}

function handleFilterClick(event) {
    const filterBtn = event.currentTarget;
    const filterValue = filterBtn.dataset.filter || filterBtn.dataset.position;
    const parentSection = filterBtn.closest('.tab-content');
    
    // Update active filter button
    parentSection.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    filterBtn.classList.add('active');
    
    // Update state and re-render
    if (parentSection.id === 'matches-content') {
        appState.currentMatchFilter = filterValue;
        renderMatches();
    } else if (parentSection.id === 'squad-content') {
        appState.currentSquadFilter = filterValue;
        renderSquad();
    }
}

function handleRefresh() {
    loadData();
}

// Initialize App
function initApp() {
    // Add event listeners
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });
    
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    elements.refreshBtn.addEventListener('click', handleRefresh);
    
    // Load initial data
    loadData();
    
    console.log('🔵 Napoli Calcio News App inizializzata con dati reali!');
    console.log('⚽ Forza Napoli Sempre!');
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Service Worker Registration (for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registrato con successo:', registration.scope);
            })
            .catch(function(error) {
                console.log('ServiceWorker registrazione fallita:', error);
            });
    });
}