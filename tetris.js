// --- PIEZAS Y COLORES ---
const pieces = 'TJLOSZI';
const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
];

// --- CANVAS PRINCIPAL Y NEXT ---
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
nextCtx.scale(20, 20);

const scoreElem = document.getElementById('score');
const timerElem = document.getElementById('timer');

const ROWS = 20;
const COLS = 12;

// --- SONIDOS ---
const sounds = {
    rotate: new Audio('sounds/rotate.mp3'),
    drop: new Audio('sounds/drop.mp3'),
    clear: new Audio('sounds/clear.mp3'),
    reset: new Audio('sounds/reset.mp3'),
    gameover: new Audio('sounds/gameover.mp3'),
    tip: new Audio('sounds/tip-tip.mp3')
};
function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play();
    }
}

function arenaSweep() {
    let rowCount = 1;
    let linesThisSweep = 0;
    for (let y = arena.length - 1; y >= 0; --y) {
        if (arena[y].every(cell => cell !== 0)) {
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            player.score += rowCount * 10;
            rowCount *= 2;
            playSound('clear');
            y++;
            linesThisSweep++;
        }
    }
    if (linesThisSweep > 0) {
        linesCleared += linesThisSweep;
        updateLevel();
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                 arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#111';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x:0, y:0});
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        playSound('drop');
    }
    dropCounter = 0;
}

function playerHardDrop() {
    let moved = false;
    while (!collide(arena, player)) {
        player.pos.y++;
        moved = true;
    }
    player.pos.y--;
    if (moved) {
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        playSound('drop');
        dropCounter = 0;
    }
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    } else {
        playSound('tip');
    }
}

function playerReset() {
    player.matrix = createPiece(nextPieceType);
    nextPieceType = pieces[Math.floor(Math.random() * pieces.length)];
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    drawNext();
    if (collide(arena, player)) {
        showGameOver();
        playSound('gameover');
        return;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
    playSound('rotate');
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    // Centrar la pieza en el canvas next
    const matrix = createPiece(nextPieceType);
    const offset = {
        x: Math.floor((nextCanvas.width / 20 - matrix[0].length) / 2),
        y: Math.floor((nextCanvas.height / 20 - matrix.length) / 2)
    };
    drawMatrix(matrix, offset, nextCtx);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = true;
let animationFrameId = null;

// --- CRONÓMETRO ---
let timerInterval = null;
let elapsedSeconds = 0;

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!paused) {
            elapsedSeconds++;
            updateTimerUI();
        }
    }, 1000);
}
function stopTimer() {
    clearInterval(timerInterval);
}
function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    updateTimerUI();
}
function updateTimerUI() {
    const min = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const sec = String(elapsedSeconds % 60).padStart(2, '0');
    timerElem.textContent = `${min}:${sec}`;
}

function update(time = 0) {
    if (paused) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    animationFrameId = requestAnimationFrame(update);
}

function pauseGame() {
    paused = true;
    stopTimer();
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function resumeGame() {
    if (!paused) return;
    paused = false;
    lastTime = performance.now();
    startTimer();
    update();
}

function updateScore() {
    scoreElem.innerText = player.score;
}

const arena = createMatrix(COLS, ROWS);

let nextPieceType = pieces[Math.floor(Math.random() * pieces.length)];

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

const pauseBtn = document.getElementById('pauseBtn');
if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
        if (paused) {
            pauseBtn.textContent = 'Pausar';
            resumeGame();
        } else {
            pauseBtn.textContent = 'Continuar';
            pauseGame();
        }
    });
}

document.addEventListener('keydown', event => {
    if (event.key === 'p' || event.key === 'P') {
        if (paused) {
            pauseBtn.textContent = 'Pausar';
            resumeGame();
        } else {
            pauseBtn.textContent = 'Continuar';
            pauseGame();
        }
    }
    if (paused) return;
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'q' || event.key === 'Q') {
        playerRotate(-1);
    } else if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') {
        playerRotate(1);
    } else if (event.code === 'Space') {
        playerHardDrop();
    }
});

// --- DIFICULTAD Y NIVELES ---
let difficulty = null;
let level = 1;
let linesCleared = 0;

// --- Mostrar/Ocultar Modal de Dificultad ---
function showDifficultyModal() {
    document.getElementById('difficultyModal').style.display = 'flex';
}
function hideDifficultyModal() {
    document.getElementById('difficultyModal').style.display = 'none';
}

// --- Inicialización de dificultad ---
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.onclick = () => {
        difficulty = btn.getAttribute('data-difficulty');
        hideDifficultyModal();
        startGameWithDifficulty();
    };
});

function startGameWithDifficulty() {
    // Reset tablero y estado
    arena.forEach(row => row.fill(0));
    player.score = 0;
    linesCleared = 0;
    level = 1;
    dropInterval = 1000;
    if (difficulty === 'hard') {
        // Añadir líneas ocupadas al fondo (ejemplo: 6 líneas)
        for (let y = ROWS - 1; y >= ROWS - 6; --y) {
            for (let x = 0; x < COLS; ++x) {
                arena[y][x] = Math.random() < 0.6 ? Math.floor(Math.random() * 7) + 1 : 0;
            }
        }
    }
    playerReset();
    updateScore();
    drawNext();
    paused = false;
    resetTimer();
    startTimer();
    update();
}

function updateLevel() {
    if (difficulty === 'easy') {
        // Sube nivel cada 10 líneas
        const newLevel = Math.floor(linesCleared / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(1000 - (level - 1) * 100, 100); // mínimo 100ms
        }
    } else if (difficulty === 'medium') {
        // Sube nivel cada 200 puntos
        const newLevel = Math.floor(player.score / 200) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(1000 - (level - 1) * 120, 80);
        }
    } else if (difficulty === 'hard') {
        // Sube nivel cada 7 líneas
        const newLevel = Math.floor(linesCleared / 7) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(900 - (level - 1) * 120, 60);
        }
    }
    updateLevelUI();
}

// --- Mostrar nivel en UI ---
function updateLevelUI() {
    let levelElem = document.getElementById('level');
    if (!levelElem) {
        levelElem = document.createElement('div');
        levelElem.id = 'level';
        levelElem.style.marginTop = '10px';
        levelElem.style.background = '#444';
        levelElem.style.color = '#fff';
        levelElem.style.padding = '6px 18px';
        levelElem.style.borderRadius = '10px';
        levelElem.style.fontSize = '1.2rem';
        levelElem.style.textAlign = 'center';
        document.querySelector('.score-container').after(levelElem);
    }
    levelElem.textContent = `Nivel: ${level}`;
}

// --- Mostrar el modal al cargar ---
window.onload = function() {
    showDifficultyModal();
    resetTimer();
};

// --- GAME OVER UI ---
function showGameOver() {
    paused = true;
    stopTimer();
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    let gameOverElem = document.getElementById('gameOverMsg');
    if (!gameOverElem) {
        gameOverElem = document.createElement('div');
        gameOverElem.id = 'gameOverMsg';
        gameOverElem.style.position = 'absolute';
        gameOverElem.style.top = '50%';
        gameOverElem.style.left = '50%';
        gameOverElem.style.transform = 'translate(-50%, -50%)';
        gameOverElem.style.background = '#222';
        gameOverElem.style.color = '#fff';
        gameOverElem.style.padding = '32px 48px';
        gameOverElem.style.fontSize = '2rem';
        gameOverElem.style.borderRadius = '16px';
        gameOverElem.style.boxShadow = '0 4px 24px #000a';
        gameOverElem.style.zIndex = '1000';
        document.body.appendChild(gameOverElem);
    }
    gameOverElem.innerHTML = 'Game Over<br><button id="restartBtn">Reiniciar</button>';
    document.getElementById('restartBtn').onclick = () => {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        if (gameOverElem) gameOverElem.remove();
        playerReset();
        paused = false;
        update();
    };
}

// --- BOTÓN DE REINICIO ---
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        playerReset();
        playSound('reset');
        paused = false;
        pauseBtn.textContent = 'Pausar';
        resetTimer();
        update();
    });
}
