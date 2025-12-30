// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game State
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let highScore = localStorage.getItem('ironManHighScore') || 0;
let frameCount = 0;

// Iron Man Character
const ironMan = {
    x: 150,
    y: canvas.height / 2,
    width: 60,
    height: 50,
    velocity: 0,
    gravity: 0.6,
    jumpPower: -10,
    energy: 100,
    maxEnergy: 100,
    angle: 0,
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);
        
        // Iron Man Body (red and gold)
        // Chest/Arc Reactor
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d4ff';
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Inner glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (red)
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(-25, -10, 50, 40);
        
        // Gold accents
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-25, -10, 50, 8); // Top stripe
        ctx.fillRect(-25, 25, 50, 5); // Bottom stripe
        ctx.fillRect(-25, 5, 5, 15); // Left accent
        ctx.fillRect(20, 5, 5, 15); // Right accent
        
        // Helmet
        ctx.fillStyle = '#c41e3a';
        ctx.beginPath();
        ctx.ellipse(0, -25, 20, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Face mask (gold)
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(0, -25, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye glow
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-8, -30, 5, 8);
        ctx.fillRect(3, -30, 5, 8);
        
        // Repulsor hands (glowing)
        ctx.fillStyle = '#00d4ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00d4ff';
        ctx.fillRect(-35, 0, 10, 12);
        ctx.fillRect(25, 0, 10, 12);
        ctx.shadowBlur = 0;
        
        // Legs
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(-15, 30, 10, 15);
        ctx.fillRect(5, 30, 10, 15);
        
        ctx.restore();
        
        // Thruster trails
        if (this.velocity > 0) {
            ctx.fillStyle = 'rgba(255, 107, 53, 0.6)';
            ctx.beginPath();
            ctx.ellipse(this.x + 15, this.y + this.height - 5, 8, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + this.width - 15, this.y + this.height - 5, 8, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // Update angle based on velocity
        this.angle = Math.min(Math.max(this.velocity * 0.05, -0.3), 0.3);
        
        // Energy drain
        if (gameState === 'playing') {
            this.energy -= 0.1;
            if (this.energy <= 0) {
                this.energy = 0;
                gameOver();
            }
        }
        
        // Update energy bar
        const energyPercent = (this.energy / this.maxEnergy) * 100;
        document.getElementById('energyFill').style.width = energyPercent + '%';
        
        // Boundary check
        if (this.y + this.height > canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            gameOver();
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },
    
    jump() {
        if (gameState === 'playing' && this.energy > 5) {
            this.velocity = this.jumpPower;
            this.energy -= 2;
        }
    }
};

// Obstacles (Repulsor Barriers)
const obstacles = [];
const obstacleSpacing = 350;
const obstacleWidth = 80;

function createObstacle() {
    const gapSize = 180;
    const topHeight = Math.random() * (canvas.height - gapSize - 100 - 50) + 50;
    const bottomHeight = canvas.height - 50 - topHeight - gapSize;
    
    obstacles.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomHeight: bottomHeight,
        gapSize: gapSize,
        passed: false,
        color: Math.random() > 0.5 ? '#00d4ff' : '#ff6b35'
    });
}

function drawObstacle(obstacle) {
    // Top obstacle
    const gradient = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + obstacleWidth, 0);
    gradient.addColorStop(0, obstacle.color);
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(1, obstacle.color);
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = obstacle.color;
    
    // Top barrier with energy effect
    ctx.fillRect(obstacle.x, 0, obstacleWidth, obstacle.topHeight);
    
    // Energy particles on top barrier
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
        const particleX = obstacle.x + (obstacleWidth / 5) * i + (frameCount % 20) * 2;
        const particleY = obstacle.topHeight - 10;
        ctx.fillRect(particleX % (obstacle.x + obstacleWidth), particleY, 3, 3);
    }
    
    // Bottom barrier
    ctx.fillStyle = gradient;
    const bottomY = canvas.height - 50 - obstacle.bottomHeight;
    ctx.fillRect(obstacle.x, bottomY, obstacleWidth, obstacle.bottomHeight);
    
    // Energy particles on bottom barrier
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
        const particleX = obstacle.x + (obstacleWidth / 5) * i + (frameCount % 20) * 2;
        const particleY = bottomY + 10;
        ctx.fillRect(particleX % (obstacle.x + obstacleWidth), particleY, 3, 3);
    }
    
    ctx.shadowBlur = 0;
}

// Collectible Arc Reactors
const collectibles = [];

function createCollectible(x, y) {
    collectibles.push({
        x: x,
        y: y,
        radius: 15,
        collected: false,
        pulse: 0
    });
}

function drawCollectible(collectible) {
    if (collectible.collected) return;
    
    collectible.pulse += 0.1;
    const pulseSize = Math.sin(collectible.pulse) * 5;
    
    ctx.save();
    ctx.translate(collectible.x, collectible.y);
    
    // Outer glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, collectible.radius + pulseSize);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(0.5, '#0080ff');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00d4ff';
    ctx.beginPath();
    ctx.arc(0, 0, collectible.radius + pulseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner circle
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, collectible.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(0, 0, collectible.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Background elements
function drawBackground() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#4a90e2');
    skyGradient.addColorStop(0.5, '#357abd');
    skyGradient.addColorStop(1, '#2a5a8a');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height - 50);
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 5; i++) {
        const cloudX = (frameCount * 0.5 + i * 200) % (canvas.width + 100) - 50;
        const cloudY = 50 + i * 100;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 40, cloudY, 40, 0, Math.PI * 2);
        ctx.arc(cloudX + 80, cloudY, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Ground
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Ground pattern
    ctx.fillStyle = '#654321';
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.fillRect(i, canvas.height - 50, 20, 50);
    }
    
    // Ground border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.stroke();
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkCircleCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
}

// Game functions
function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('ironManHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
}

function resetGame() {
    gameState = 'playing';
    score = 0;
    frameCount = 0;
    obstacles.length = 0;
    collectibles.length = 0;
    
    ironMan.x = 150;
    ironMan.y = canvas.height / 2;
    ironMan.velocity = 0;
    ironMan.energy = ironMan.maxEnergy;
    ironMan.angle = 0;
    
    document.getElementById('score').textContent = score;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    // Create first obstacle
    createObstacle();
}

function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Update Iron Man
    ironMan.update();
    
    // Update obstacles
    obstacles.forEach(obstacle => {
        obstacle.x -= 4;
        
        // Check collision
        const ironManRect = {
            x: ironMan.x + 10,
            y: ironMan.y + 10,
            width: ironMan.width - 20,
            height: ironMan.height - 20
        };
        
        // Top obstacle
        if (checkCollision(ironManRect, {
            x: obstacle.x,
            y: 0,
            width: obstacleWidth,
            height: obstacle.topHeight
        })) {
            gameOver();
        }
        
        // Bottom obstacle
        if (checkCollision(ironManRect, {
            x: obstacle.x,
            y: canvas.height - 50 - obstacle.bottomHeight,
            width: obstacleWidth,
            height: obstacle.bottomHeight
        })) {
            gameOver();
        }
        
        // Score increment
        if (!obstacle.passed && obstacle.x + obstacleWidth < ironMan.x) {
            obstacle.passed = true;
            score += 10;
            document.getElementById('score').textContent = score;
        }
    });
    
    // Remove off-screen obstacles
    obstacles.forEach((obstacle, index) => {
        if (obstacle.x + obstacleWidth < 0) {
            obstacles.splice(index, 1);
        }
    });
    
    // Create new obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - obstacleSpacing) {
        createObstacle();
        // Create collectible in gap
        const lastObstacle = obstacles[obstacles.length - 1];
        const collectibleY = lastObstacle.topHeight + lastObstacle.gapSize / 2;
        createCollectible(canvas.width + 100, collectibleY);
    }
    
    // Update collectibles
    collectibles.forEach(collectible => {
        collectible.x -= 4;
        
        // Check collection
        if (!collectible.collected) {
            if (checkCircleCollision(collectible, {
                x: ironMan.x + 15,
                y: ironMan.y + 15,
                width: ironMan.width - 30,
                height: ironMan.height - 30
            })) {
                collectible.collected = true;
                score += 25;
                ironMan.energy = Math.min(ironMan.maxEnergy, ironMan.energy + 20);
                document.getElementById('score').textContent = score;
            }
        }
    });
    
    // Remove collected/off-screen collectibles
    collectibles.forEach((collectible, index) => {
        if (collectible.collected || collectible.x + collectible.radius < 0) {
            collectibles.splice(index, 1);
        }
    });
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    if (gameState === 'playing') {
        // Draw obstacles
        obstacles.forEach(drawObstacle);
        
        // Draw collectibles
        collectibles.forEach(drawCollectible);
    }
    
    // Draw Iron Man
    ironMan.draw();
    
    // Draw particles/effects
    if (gameState === 'playing') {
        // Energy particles from Iron Man
        for (let i = 0; i < 3; i++) {
            const particleX = ironMan.x + Math.random() * ironMan.width;
            const particleY = ironMan.y + ironMan.height + Math.random() * 10;
            ctx.fillStyle = `rgba(0, 212, 255, ${0.5 + Math.random() * 0.5})`;
            ctx.fillRect(particleX, particleY, 2, 2);
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event Listeners
document.getElementById('startBtn').addEventListener('click', resetGame);
document.getElementById('restartBtn').addEventListener('click', resetGame);

canvas.addEventListener('click', () => {
    if (gameState === 'playing') {
        ironMan.jump();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start') {
            resetGame();
        } else if (gameState === 'playing') {
            ironMan.jump();
        } else if (gameState === 'gameOver') {
            resetGame();
        }
    }
});

// Initialize
document.getElementById('highScore').textContent = highScore;
gameLoop();

// Draw initial screen
draw();
