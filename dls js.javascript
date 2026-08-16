/* =========================================================
   ADMIN PASSWORD
========================================================= */

const ADMIN_PASSWORD = "35786491";

let adminLoggedIn = false;


/* =========================================================
   DATABASE
========================================================= */

let database = JSON.parse(localStorage.getItem("dls26_database")) || { leagues: [] };

let currentLeagueId = null;


/* =========================================================
   UTILS / HELPERS
========================================================= */

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

function openAdminLogin() {
    document.getElementById("adminModal").style.display = "flex";
    document.getElementById("adminPassword").value = "";
    document.getElementById("passwordError").style.display = "none";

    setTimeout(() => {
        document.getElementById("adminPassword").focus();
    }, 100);
}


function closeAdminLogin() {
    document.getElementById("adminModal").style.display = "none";
}


function loginAdmin() {
    const password = document.getElementById("adminPassword").value;

    if (password === ADMIN_PASSWORD) {
        adminLoggedIn = true;
        closeAdminLogin();

        document.getElementById("adminArea").style.display = "block";
        render();

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
        });
    } else {
        document.getElementById("passwordError").style.display = "block";
        document.getElementById("adminPassword").value = "";
        document.getElementById("adminPassword").focus();
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function logoutAdmin() {
    adminLoggedIn = false;
    document.getElementById("adminArea").style.display = "none";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   SAVE
========================================================= */

function saveDatabase() {
    localStorage.setItem("dls26_database", JSON.stringify(database));
}


/* =========================================================
   GET CURRENT LEAGUE
========================================================= */

function getCurrentLeague() {
    if (!database.leagues.length) {
        return null;
    }

    if (!currentLeagueId) {
        currentLeagueId = database.leagues[0].id;
    }

    return database.leagues.find(league => league.id === currentLeagueId);
}


/* =========================================================
   CREATE LEAGUE
========================================================= */

function createLeague() {
    if (!adminLoggedIn) {
        alert("Administrator access required.");
        return;
    }

    const name = document.getElementById("leagueName").value.trim();
    const season = document.getElementById("leagueSeason").value.trim();

    if (!name) {
        alert("Please enter a league name.");
        return;
    }

    const league = {
        id: Date.now(),
        name: name,
        season: season || "Season 1",
        teams: [],
        matches: []
    };

    database.leagues.push(league);
    currentLeagueId = league.id;

    saveDatabase();

    document.getElementById("leagueName").value = "";
    document.getElementById("leagueSeason").value = "";

    render();
}


/* =========================================================
   ADD TEAM
========================================================= */

function addTeam() {
    if (!adminLoggedIn) {
        alert("Administrator access required.");
        return;
    }

    const league = getCurrentLeague();

    if (!league) {
        alert("Create a league first.");
        return;
    }

    const name = document.getElementById("teamName").value.trim();
    const manager = document.getElementById("teamManager").value.trim();

    if (!name) {
        alert("Enter a team name.");
        return;
    }

    if (league.teams.some(team => team.name.toLowerCase() === name.toLowerCase())) {
        alert("This team already exists.");
        return;
    }

    league.teams.push({
        id: Date.now(),
        name: name,
        manager: manager || "Unknown"
    });

    saveDatabase();

    document.getElementById("teamName").value = "";
    document.getElementById("teamManager").value = "";

    render();
}


/* =========================================================
   ADD RESULT
========================================================= */

function addResult() {
    if (!adminLoggedIn) {
        alert("Administrator access required.");
        return;
    }

    const league = getCurrentLeague();

    if (!league) {
        alert("Create a league first.");
        return;
    }

    const homeId = Number(document.getElementById("homeTeam").value);
    const awayId = Number(document.getElementById("awayTeam").value);
    const homeScore = Number(document.getElementById("homeScore").value);
    const awayScore = Number(document.getElementById("awayScore").value);
    const date = document.getElementById("matchDate").value;

    if (!homeId || !awayId) {
        alert("Select both teams.");
        return;
    }

    if (homeId === awayId) {
        alert("A team cannot play against itself.");
        return;
    }

    if (document.getElementById("homeScore").value === "" || document.getElementById("awayScore").value === "") {
        alert("Enter both scores.");
        return;
    }

    league.matches.push({
        id: Date.now(),
        homeId,
        awayId,
        homeScore,
        awayScore,
        date: date || new Date().toISOString().split("T")[0]
    });

    saveDatabase();

    document.getElementById("homeScore").value = "";
    document.getElementById("awayScore").value = "";

    render();
}


/* =========================================================
   STANDINGS
========================================================= */

function calculateStandings(league) {
    const table = {};

    league.teams.forEach(team => {
        table[team.id] = {
            id: team.id,
            name: team.name,
            manager: team.manager,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0
        };
    });

    league.matches.forEach(match => {
        const home = table[match.homeId];
        const away = table[match.awayId];

        if (!home || !away) return;

        home.played++;
        away.played++;

        home.gf += match.homeScore;
        home.ga += match.awayScore;
        away.gf += match.awayScore;
        away.ga += match.homeScore;

        if (match.homeScore > match.awayScore) {
            home.wins++;
            away.losses++;
            home.points += 3;
        } else if (match.homeScore < match.awayScore) {
            away.wins++;
            home.losses++;
            away.points += 3;
        } else {
            home.draws++;
            away.draws++;
            home.points++;
            away.points++;
        }
    });

    Object.values(table).forEach(team => {
        team.gd = team.gf - team.ga;
    });

    return Object.values(table).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.name.localeCompare(b.name);
    });
}


/* =========================================================
   TABS
========================================================= */

function renderTabs() {
    const container = document.getElementById("leagueTabs");
    container.innerHTML = "";

    database.leagues.forEach(league => {
        const button = document.createElement("button");
        button.className = "tab " + (league.id === currentLeagueId ? "active" : "");
        button.innerHTML = `${escapeHTML(league.name)} <small>(${escapeHTML(league.season)})</small>`;

        button.onclick = () => {
            currentLeagueId = league.id;
            render();
        };

        container.appendChild(button);
    });
}


/* =========================================================
   STANDINGS DISPLAY
========================================================= */

function renderStandings(league) {
    const body = document.getElementById("standingsBody");
    body.innerHTML = "";

    if (!league || !league.teams.length) {
        body.innerHTML = `
            <tr>
                <td colspan="10" class="empty">
                    No teams have been added yet.
                </td>
            </tr>
        `;
        return;
    }

    const standings = calculateStandings(league);

    standings.forEach((team, index) => {
        const row = document.createElement("tr");

        if (index === 0) {
            row.classList.add("champion");
        }

        row.innerHTML = `
            <td class="position">${index + 1}</td>
            <td>
                ${escapeHTML(team.name)}
                <br>
                <small style="color:#6f7d9e;">
                    ${escapeHTML(team.manager)}
                </small>
            </td>
            <td>${team.played}</td>
            <td>${team.wins}</td>
            <td>${team.draws}</td>
            <td>${team.losses}</td>
            <td>${team.gf}</td>
            <td>${team.ga}</td>
            <td>${team.gd > 0 ? "+" : ""}${team.gd}</td>
            <td><strong>${team.points}</strong></td>
        `;

        body.appendChild(row);
    });
}


/* =========================================================
   RESULTS
========================================================= */

function renderResults(league) {
    const container = document.getElementById("resultsList");
    container.innerHTML = "";

    if (!league || !league.matches.length) {
        container.innerHTML = `
            <div class="empty">
                No match results yet.
            </div>
        `;
        return;
    }

    [...league.matches].reverse().forEach(match => {
        const home = league.teams.find(team => team.id === match.homeId);
        const away = league.teams.find(team => team.id === match.awayId);

        if (!home || !away) return;

        const div = document.createElement("div");
        div.className = "match";

        div.innerHTML = `
            <div class="match-top">
                <span>${escapeHTML(match.date)}</span>
                <span>DLS 26</span>
            </div>
            <div class="score">
                ${escapeHTML(home.name)}
                &nbsp; ${match.homeScore} - ${match.awayScore} &nbsp;
                ${escapeHTML(away.name)}
            </div>
        `;

        container.appendChild(div);
    });
}


/* =========================================================
   TEAM LIST
========================================================= */

function renderTeams(league) {
    const container = document.getElementById("teamList");
    container.innerHTML = "";

    if (!league || !league.teams.length) {
        container.innerHTML = `
            <div class="empty">
                No teams added.
            </div>
        `;
        return;
    }

    league.teams.forEach(team => {
        const card = document.createElement("div");
        card.className = "league-card";

        card.innerHTML = `
            <div>
                <h3>${escapeHTML(team.name)}</h3>
                <small>Manager: ${escapeHTML(team.manager)}</small>
            </div>
            <button class="danger" onclick="removeTeam(${team.id})">
                Remove
            </button>
        `;

        container.appendChild(card);
    });
}


/* =========================================================
   TEAM SELECTORS
========================================================= */

function renderTeamSelectors(league) {
    const home = document.getElementById("homeTeam");
    const away = document.getElementById("awayTeam");

    home.innerHTML = `<option value="">Home team</option>`;
    away.innerHTML = `<option value="">Away team</option>`;

    if (!league) return;

    league.teams.forEach(team => {
        home.innerHTML += `
            <option value="${team.id}">
                ${escapeHTML(team.name)}
            </option>
        `;

        away.innerHTML += `
            <option value="${team.id}">
                ${escapeHTML(team.name)}
            </option>
        `;
    });
}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function renderStats(league) {
    document.getElementById("teamCount").textContent = league ? league.teams.length : 0;
    document.getElementById("matchCount").textContent = league ? league.matches.length : 0;

    if (!league) {
        document.getElementById("leaderName").textContent = "-";
        document.getElementById("leaderPoints").textContent = "0";
        return;
    }

    const standings = calculateStandings(league);

    if (!standings.length) {
        document.getElementById("leaderName").textContent = "-";
        document.getElementById("leaderPoints").textContent = "0";
        return;
    }

    document.getElementById("leaderName").textContent = standings[0].name;
    document.getElementById("leaderPoints").textContent = standings[0].points;
}


/* =========================================================
   REMOVE TEAM
========================================================= */

function removeTeam(teamId) {
    if (!adminLoggedIn) {
        alert("Administrator access required.");
        return;
    }

    const league = getCurrentLeague();

    if (!league) return;

    const team = league.teams.find(t => t.id === teamId);

    if (!team) return;

    if (!confirm(`Remove ${team.name}? Existing matches involving this team will also be removed.`)) {
        return;
    }

    league.teams = league.teams.filter(t => t.id !== teamId);
    league.matches = league.matches.filter(
        match => match.homeId !== teamId && match.awayId !== teamId
    );

    saveDatabase();
    render();
}


/* =========================================================
   DELETE CURRENT LEAGUE
========================================================= */

function deleteCurrentLeague() {
    if (!adminLoggedIn) {
        alert("Administrator access required.");
        return;
    }

    const league = getCurrentLeague();

    if (!league) {
        alert("There is no league to delete.");
        return;
    }

    if (!confirm(`Delete ${league.name}?`)) {
        return;
    }

    database.leagues = database.leagues.filter(l => l.id !== league.id);

    currentLeagueId = database.leagues.length ? database.leagues[0].id : null;

    saveDatabase();
    render();
}


/* =========================================================
   CLEAR EVERYTHING
========================================================= */

function clearEverything() {
    if (!adminLoggedIn) {
        alert("Administrator access required.");
        return;
    }

    if (!confirm("This will delete ALL leagues, teams and results. Continue?")) {
        return;
    }

    database = { leagues: [] };
    currentLeagueId = null;

    saveDatabase();
    render();
}


/* =========================================================
   MAIN RENDER FUNCTION
========================================================= */

function render() {
    const league = getCurrentLeague();

    renderTabs();
    renderStats(league);
    renderStandings(league);
    renderResults(league);
    renderTeams(league);
    renderTeamSelectors(league);
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    render();
});