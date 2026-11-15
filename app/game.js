/**
 * 2048 Game Engine
 * DevOps Project 08 Modern Interactive Client
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('2048_sound') !== 'false';
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('2048_sound', this.enabled);
    return this.enabled;
  }

  playMove() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Audio playback silently catches
    }
  }

  playMerge(val) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = Math.min(300 + Math.log2(val || 4) * 55, 900);

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.16);
      osc2.stop(now + 0.16);
    } catch (e) {}
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch (e) {}
  }

  playGameOver() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }
}

class Game2048 {
  constructor() {
    this.size = 4;
    this.grid = [];
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('2048_best_score') || '0', 10);
    this.won = false;
    this.keepPlaying = false;
    this.over = false;
    this.history = [];

    this.sound = new SoundEffects();

    // DOM Elements
    this.tileContainer = document.getElementById('tile-container');
    this.scoreElement = document.getElementById('score');
    this.bestScoreElement = document.getElementById('best-score');
    this.scoreAddition = document.getElementById('score-addition');
    this.undoBtn = document.getElementById('undo-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.soundBtn = document.getElementById('sound-btn');
    this.themeBtn = document.getElementById('theme-btn');
    this.overlay = document.getElementById('game-overlay');
    this.overlayBadge = document.getElementById('overlay-badge');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlaySubtitle = document.getElementById('overlay-subtitle');
    this.overlayKeepPlayingBtn = document.getElementById('overlay-keep-playing-btn');
    this.overlayRetryBtn = document.getElementById('overlay-retry-btn');

    this.initUI();
    this.bindEvents();
    this.startNewGame();
  }

  initUI() {
    this.bestScoreElement.textContent = this.bestScore;

    // Apply stored theme
    const savedTheme = localStorage.getItem('2048_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    this.updateThemeIcons(savedTheme);

    // Apply stored sound state
    this.updateSoundIcons(this.sound.enabled);
  }

  updateSoundIcons(enabled) {
    const onIcon = document.getElementById('sound-icon-on');
    const offIcon = document.getElementById('sound-icon-off');
    if (enabled) {
      onIcon.classList.remove('hidden');
      offIcon.classList.add('hidden');
    } else {
      onIcon.classList.add('hidden');
      offIcon.classList.remove('hidden');
    }
  }

  updateThemeIcons(theme) {
    const darkIcon = document.getElementById('theme-icon-dark');
    const lightIcon = document.getElementById('theme-icon-light');
    if (theme === 'dark') {
      darkIcon.classList.remove('hidden');
      lightIcon.classList.add('hidden');
    } else {
      darkIcon.classList.add('hidden');
      lightIcon.classList.remove('hidden');
    }
  }

  startNewGame() {
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.won = false;
    this.keepPlaying = false;
    this.over = false;
    this.history = [];

    this.overlay.classList.add('hidden');
    this.overlayKeepPlayingBtn.classList.add('hidden');
    this.undoBtn.disabled = true;

    this.updateScore(0);
    this.addRandomTile();
    this.addRandomTile();
    this.render();
  }

  saveState() {
    const snapshot = {
      grid: this.grid.map(row => [...row]),
      score: this.score,
      won: this.won,
      over: this.over
    };
    this.history.push(snapshot);
    if (this.history.length > 5) {
      this.history.shift();
    }
    this.undoBtn.disabled = false;
  }

  undo() {
    if (this.history.length === 0) return;
    const lastState = this.history.pop();
    this.grid = lastState.grid;
    this.score = lastState.score;
    this.won = lastState.won;
    this.over = lastState.over;

    this.overlay.classList.add('hidden');
    this.undoBtn.disabled = this.history.length === 0;
    this.updateScore(this.score, false);
    this.render();
  }

  getEmptyCells() {
    const cells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) {
          cells.push({ r, c });
        }
      }
    }
    return cells;
  }

  addRandomTile() {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length === 0) return null;

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    this.grid[cell.r][cell.c] = value;
    return { ...cell, value, isNew: true };
  }

  move(direction) {
    // 0: Up, 1: Right, 2: Down, 3: Left
    if (this.over) return false;

    // Snapshot before modifying
    const prevGrid = this.grid.map(row => [...row]);
    let moved = false;
    let scoreAdded = 0;
    let maxMergedVal = 0;

    const rotate = (matrix) => {
      const res = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          res[c][this.size - 1 - r] = matrix[r][c];
        }
      }
      return res;
    };

    // Rotate matrix so we can always slide Left
    let rotations = 0;
    if (direction === 0) rotations = 3; // Up
    else if (direction === 1) rotations = 2; // Right
    else if (direction === 2) rotations = 1; // Down
    else if (direction === 3) rotations = 0; // Left

    let workingGrid = this.grid.map(row => [...row]);
    for (let i = 0; i < rotations; i++) {
      workingGrid = rotate(workingGrid);
    }

    // Process Left slide
    for (let r = 0; r < this.size; r++) {
      const row = workingGrid[r].filter(val => val !== 0);
      const newRow = [];
      for (let c = 0; c < row.length; c++) {
        if (c + 1 < row.length && row[c] === row[c + 1]) {
          const merged = row[c] * 2;
          newRow.push(merged);
          scoreAdded += merged;
          if (merged > maxMergedVal) maxMergedVal = merged;
          if (merged === 2048 && !this.won && !this.keepPlaying) {
            this.won = true;
          }
          c++; // skip merged neighbor
        } else {
          newRow.push(row[c]);
        }
      }
      while (newRow.length < this.size) {
        newRow.push(0);
      }
      workingGrid[r] = newRow;
    }

    // Rotate back to original orientation
    const reverseRotations = (4 - rotations) % 4;
    for (let i = 0; i < reverseRotations; i++) {
      workingGrid = rotate(workingGrid);
    }

    // Check if anything changed
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (workingGrid[r][c] !== prevGrid[r][c]) {
          moved = true;
          break;
        }
      }
    }

    if (moved) {
      this.saveState();
      this.grid = workingGrid;
      this.addRandomTile();

      if (scoreAdded > 0) {
        this.updateScore(this.score + scoreAdded, true, scoreAdded);
        this.sound.playMerge(maxMergedVal);
      } else {
        this.sound.playMove();
      }

      this.render();

      if (this.won && !this.keepPlaying) {
        this.sound.playWin();
        this.showWinScreen();
      } else if (!this.hasAvailableMoves()) {
        this.over = true;
        this.sound.playGameOver();
        this.showGameOverScreen();
      }
    }

    return moved;
  }

  hasAvailableMoves() {
    if (this.getEmptyCells().length > 0) return true;

    // Check horizontal neighbors
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size - 1; c++) {
        if (this.grid[r][c] === this.grid[r][c + 1]) return true;
      }
    }

    // Check vertical neighbors
    for (let c = 0; c < this.size; c++) {
      for (let r = 0; r < this.size - 1; r++) {
        if (this.grid[r][c] === this.grid[r + 1][c]) return true;
      }
    }

    return false;
  }

  updateScore(newScore, animate = false, addedPoints = 0) {
    this.score = newScore;
    this.scoreElement.textContent = this.score;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.bestScoreElement.textContent = this.bestScore;
      localStorage.setItem('2048_best_score', this.bestScore);
    }

    if (animate && addedPoints > 0) {
      const bubble = document.createElement('div');
      bubble.className = 'score-add-bubble';
      bubble.textContent = `+${addedPoints}`;
      this.scoreAddition.appendChild(bubble);

      setTimeout(() => {
        bubble.remove();
      }, 800);
    }
  }

  showWinScreen() {
    this.overlayBadge.textContent = '🎉 VICTORY!';
    this.overlayBadge.style.color = '#10b981';
    this.overlayBadge.style.borderColor = '#10b981';
    this.overlayTitle.textContent = 'You Reached 2048!';
    this.overlaySubtitle.textContent = 'Outstanding puzzle skills! Continue to achieve higher scores.';
    this.overlayKeepPlayingBtn.classList.remove('hidden');
    this.overlay.classList.remove('hidden');
  }

  showGameOverScreen() {
    this.overlayBadge.textContent = 'GAME OVER';
    this.overlayBadge.style.color = '#ef4444';
    this.overlayBadge.style.borderColor = '#ef4444';
    this.overlayTitle.textContent = 'No More Moves!';
    this.overlaySubtitle.textContent = `Final Score: ${this.score}. Try again to beat your record!`;
    this.overlayKeepPlayingBtn.classList.add('hidden');
    this.overlay.classList.remove('hidden');
  }

  render() {
    this.tileContainer.innerHTML = '';

    const boardWidth = this.tileContainer.offsetWidth || 480;
    const isSmall = window.innerWidth <= 520;
    const gap = isSmall ? 10 : 14;
    const tileSize = (boardWidth - (gap * 3)) / 4;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        if (val !== 0) {
          const tile = document.createElement('div');
          const tileClass = val <= 2048 ? `tile-${val}` : 'tile-super';
          tile.className = `tile ${tileClass}`;

          const x = c * (tileSize + gap);
          const y = r * (tileSize + gap);

          tile.style.width = `${tileSize}px`;
          tile.style.height = `${tileSize}px`;
          tile.style.transform = `translate(${x}px, ${y}px)`;

          const inner = document.createElement('div');
          inner.className = 'tile-inner';
          inner.textContent = val;

          tile.appendChild(inner);
          this.tileContainer.appendChild(tile);
        }
      }
    }
  }

  bindEvents() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      // Prevent default page scroll on arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.move(0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.move(1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.move(2);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.move(3);
          break;
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            this.undo();
          }
          break;
      }
    });

    // Touch Swipe Controls
    let touchStartX = 0;
    let touchStartY = 0;
    const board = document.getElementById('board-container');

    board.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    board.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (Math.max(absX, absY) > 30) {
          if (absX > absY) {
            this.move(dx > 0 ? 1 : 3); // Right or Left
          } else {
            this.move(dy > 0 ? 2 : 0); // Down or Up
          }
        }
      }
    }, { passive: true });

    // Buttons
    this.restartBtn.addEventListener('click', () => this.startNewGame());
    this.undoBtn.addEventListener('click', () => this.undo());

    this.overlayRetryBtn.addEventListener('click', () => this.startNewGame());
    this.overlayKeepPlayingBtn.addEventListener('click', () => {
      this.keepPlaying = true;
      this.overlay.classList.add('hidden');
    });

    // Sound toggle
    this.soundBtn.addEventListener('click', () => {
      const active = this.sound.toggle();
      this.updateSoundIcons(active);
    });

    // Theme toggle
    this.themeBtn.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('2048_theme', next);
      this.updateThemeIcons(next);
    });

    // D-Pad buttons
    document.getElementById('dpad-up')?.addEventListener('click', () => this.move(0));
    document.getElementById('dpad-right')?.addEventListener('click', () => this.move(1));
    document.getElementById('dpad-down')?.addEventListener('click', () => this.move(2));
    document.getElementById('dpad-left')?.addEventListener('click', () => this.move(3));

    // Window resize handler for responsive tile scaling
    window.addEventListener('resize', () => this.render());
  }
}

// Start game when page loads
document.addEventListener('DOMContentLoaded', () => {
  new Game2048();
});
