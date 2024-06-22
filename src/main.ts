import './style.css';

const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

canvas.width = 1000;
canvas.height = 460;
const gravity = 0.2;

let playGame: boolean = true;

interface Position {
    x: number;
    y: number;
}

interface Velocity {
    x: number;
    y: number;
}

interface CorrectCropParameters {
    x: number;
    y: number;
}

interface Sprite {
    imageSrc: string;
    framesMax: number;
    scale: number;
    correctCropParameters: CorrectCropParameters;
    image: HTMLImageElement;
    imageLoaded: boolean;
}

interface AttackRange {
    position: Position;
    width: number;
    height: number;
    correctCropParameters: CorrectCropParameters;
}

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false },
    s: { pressed: false },
    ArrowLeft: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowUp: { pressed: false },
    ArrowDown: { pressed: false }
};

class CreateCharacter {
    position: Position;
    height: number;
    width: number;
    imageSrc: string;
    image: HTMLImageElement;
    scale: number;
    framesMax: number;
    framesCurrent: number;
    framesElapsed: number;
    framesHold: number;
    correctCropParameters: CorrectCropParameters;
    facingRight: boolean;
    imageLoaded: boolean;

    constructor(position: Position, imageSrc: string, scale = 1, framesMax = 1, correctCropParameters: CorrectCropParameters) {
        this.position = position;
        this.height = 100;
        this.width = 50;
        this.imageSrc = imageSrc;
        this.scale = scale;
        this.framesMax = framesMax;
        this.image = new Image();
        this.image.src = imageSrc;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 10;  // Adjust this value to control the frame rate
        this.correctCropParameters = correctCropParameters;
        this.facingRight = true;
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    drawCharacter() {
        if (!this.image.complete) return;  // Check if the image is loaded before drawing

        ctx.save();
        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
        }

        ctx.drawImage(
            this.image,
            this.framesCurrent * (this.image.width / this.framesMax),
            0,
            this.image.width / this.framesMax,
            this.image.height,
            this.facingRight ? this.position.x - this.correctCropParameters.x : canvas.width - this.position.x - this.width + this.correctCropParameters.x,
            this.position.y - this.correctCropParameters.y,
            (this.image.width / this.framesMax) * this.scale,
            this.image.height * this.scale
        );

        ctx.restore();
    }

    update() {
        this.drawCharacter();
        this.framesElapsed++;
        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++;
            } else {
                this.framesCurrent = 0;
            }
        }
    }
}

class Character extends CreateCharacter {
    velocity: Velocity;
    sprite: string;
    attackRange: AttackRange;
    isAttackingUpper: boolean;
    isAttackingLower: boolean;
    health: number;
    power: number;
    attackUpperDamage: number;
    attackLowerDamage: number;
    pushEffect: number;
    isJumping: boolean;
    powerIncrement: number;
    blocking: boolean;
    sprites: Record<string, Sprite>;
    currentAction: string;
    canAttackUpper: boolean;
    canAttackLower: boolean;

    constructor(
        position: Position,
        velocity: Velocity,
        sprite: string,
        sprites: Record<string, Sprite>
    ) {
        super(position, sprites.idle.imageSrc, sprites.idle.scale, sprites.idle.framesMax, sprites.idle.correctCropParameters);
        this.velocity = velocity;
        this.height = 100;
        this.width = 50;
        this.sprite = sprite;
        this.attackRange = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            width: 100,
            height: 10,
            correctCropParameters: {
                x: 0,
                y: 0
            }
        };
        this.isAttackingUpper = false;
        this.isAttackingLower = false;
        this.health = 100;
        this.power = 0;
        this.attackUpperDamage = 5;
        this.attackLowerDamage = 10;
        this.pushEffect = 100;
        this.isJumping = false;
        this.powerIncrement = 10;
        this.blocking = false;
        this.sprites = sprites;
        this.currentAction = 'idle';
        this.canAttackUpper = true;  // Flag for upper attack cooldown
        this.canAttackLower = true;  // Flag for lower attack cooldown
        for (const action in sprites) {
            const sprite = sprites[action];
            sprite.image = new Image();
            sprite.image.src = sprite.imageSrc;
            sprite.imageLoaded = false;
            sprite.image.onload = () => {
                sprite.imageLoaded = true;
            };
        }
    }

    setAction(action: string) {
        if (this.currentAction === action) return;
        this.currentAction = action;
        const sprite = this.sprites[action];
        this.image = sprite.image;
        this.scale = sprite.scale;
        this.framesMax = sprite.framesMax;
        this.correctCropParameters = sprite.correctCropParameters;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
    }

    attackingUpper() {
        if (!this.canAttackUpper) return;  // Prevent attacking if in cooldown
        this.canAttackUpper = false;  // Start cooldown
        this.setAction('attackUpper');
        this.isAttackingUpper = true;
        setTimeout(() => {
            this.isAttackingUpper = false;
            if (this.currentAction === 'attackUpper') this.setAction('idle');
        }, 800); // Increased duration for attack animation
        setTimeout(() => {
            this.canAttackUpper = true;  // Reset cooldown after 5 seconds
        }, 5000);
    }

    attackingLower() {
        if (!this.canAttackLower) return;  // Prevent attacking if in cooldown
        this.canAttackLower = false;  // Start cooldown
        this.setAction('attackLower');
        this.isAttackingLower = true;
        setTimeout(() => {
            this.isAttackingLower = false;
            if (this.currentAction === 'attackLower') this.setAction('idle');
        }, 800); // Increased duration for attack animation
        setTimeout(() => {
            this.canAttackLower = true;  // Reset cooldown after 3 seconds
        }, 3000);
    }

    applyUpperAttack(enemy: Character) {
        enemy.health -= this.attackUpperDamage;
        enemy.position.x += this.facingRight ? this.pushEffect : -this.pushEffect;
        this.increasePower();
    }

    applyLowerAttack(enemy: Character) {
        enemy.health -= this.attackLowerDamage;
        this.increasePower();
    }

    increasePower() {
        if (this.power < 100) {
            this.power += this.powerIncrement;
            if (this.power > 100) this.power = 100;
            this.updatePowerBar();
        }
    }

    updatePowerBar() {
        const powerBar = document.querySelector(`.stats__power-bar--${this.sprite === 'gray' ? 'player' : 'enemy'}`) as HTMLElement;
        powerBar.style.width = this.power + '%';
    }

    update() {
        this.facingRight = this.position.x < (this === playerCharacter ? enemyCharacter.position.x : playerCharacter.position.x);
        this.attackRange.position.x = this.facingRight ? this.position.x + this.width : this.position.x - this.attackRange.width;
        this.attackRange.position.y = this.position.y;

        this.drawCharacter();
        this.framesElapsed++;
        if (this.framesElapsed % this.framesHold === 0) {
            if (this.framesCurrent < this.framesMax - 1) {
                this.framesCurrent++;
            } else {
                this.framesCurrent = 0;
            }
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.y + this.height >= canvas.height) {
            this.position.y = canvas.height - this.height;
            this.velocity.y = 0;
            this.isJumping = false;
        } else {
            this.velocity.y += gravity;
            if (this.isJumping) {
                this.setAction('jump');
            }
        }
    }
}

const background = new CreateCharacter(
    {
        x: -400,
        y: -100
    },
    '/pokhara.jpg',
    1,
    1,
    { x: 0, y: 0 }
);
const fireLeft = new CreateCharacter(
    {
        x: -30,
        y: 100
    },
    '/fire.png',
    15,
    6,
    { x: 0, y: 0 }
);
const fireRight = new CreateCharacter(
    {
        x: 800,
        y: 100
    },
    '/fire.png',
    15,
    6,
    { x: 0, y: 0 }
);

const playerCharacter = new Character(
    {
        x: 200,
        y: 700
    },
    {
        x: 0,
        y: 0
    },
    'gray',
    {
        idle: {
            imageSrc: '/zoro/idle.png',
            scale: 0.5,
            framesMax: 3,
            correctCropParameters: { x: 0, y: 0 },
            image: new Image(),
            imageLoaded: false
        },
        run: {
            imageSrc: '/zoro/running.png',
            scale: 0.5,
            framesMax: 1,
            correctCropParameters: { x: 0, y: 0 },
            image: new Image(),
            imageLoaded: false
        },
        jump: {
            imageSrc: '/zoro/jumping.png',
            scale: 0.5,
            framesMax: 1,
            correctCropParameters: { x: 0, y: 0 },
            image: new Image(),
            imageLoaded: false
        },
        attackUpper: {
            imageSrc: '/zoro/lightAttack.png',
            scale: 0.5,
            framesMax: 1,
            correctCropParameters: { x: 0, y: 0 },
            image: new Image(),
            imageLoaded: false
        },
        attackLower: {
            imageSrc: '/zoro/heavyAttack.png',
            scale: 0.5,
            framesMax: 4,
            correctCropParameters: { x: 0, y: 0 },
            image: new Image(),
            imageLoaded: false
        }
    }
);

const enemyCharacter = new Character(
    {
        x: 700,
        y: 700
    },
    {
        x: 0,
        y: 0
    },
    'purple',
    {
        idle: {
            imageSrc: '/luffy/idle.png',
            scale: 1,
            framesMax: 3,
            correctCropParameters: { x: 0, y: 100 },
            image: new Image(),
            imageLoaded: false
        },
        run: {
            imageSrc: '/samurai/run-sword.png',
            scale: 3.7,
            framesMax: 10,
            correctCropParameters: { x: 0, y: 40 },
            image: new Image(),
            imageLoaded: false
        },
        jump: {
            imageSrc: '/samurai/run.png',
            scale: 3.7,
            framesMax: 2,
            correctCropParameters: { x: 0, y: 0 },
            image: new Image(),
            imageLoaded: false
        },
        attackUpper: {
            imageSrc: '/samurai/run.png',
            scale: 3.7,
            framesMax: 6,
            correctCropParameters: { x: 0, y: 0 },
            image: new Image(),
            imageLoaded: false
        },
        attackLower: {
            imageSrc: '/samurai/run.png',
            scale: 3.7,
            framesMax: 6,
            correctCropParameters: { x: 0, y: 0 },
            image: new Image(),
            imageLoaded: false
        }
    }
);

function upperAttackDetection({ playerAttackRectangle, enemyAttackRectangle }: { playerAttackRectangle: Character, enemyAttackRectangle: Character }) {
    return (
        !enemyAttackRectangle.blocking &&
        playerAttackRectangle.attackRange.position.x + playerAttackRectangle.attackRange.width >= enemyAttackRectangle.position.x &&
        playerAttackRectangle.attackRange.position.x <= enemyAttackRectangle.position.x + enemyAttackRectangle.width &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.attackRange.height >= enemyAttackRectangle.position.y &&
        playerAttackRectangle.attackRange.position.y <= enemyAttackRectangle.position.y + enemyAttackRectangle.height &&
        playerAttackRectangle.isAttackingUpper
    );
}

function lowerAttackDetection({ playerAttackRectangle, enemyAttackRectangle }: { playerAttackRectangle: Character, enemyAttackRectangle: Character }) {
    return (
        !enemyAttackRectangle.blocking &&
        playerAttackRectangle.attackRange.position.x + playerAttackRectangle.attackRange.width >= enemyAttackRectangle.position.x &&
        playerAttackRectangle.attackRange.position.x <= enemyAttackRectangle.position.x + enemyAttackRectangle.width &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.height - playerAttackRectangle.attackRange.height + playerAttackRectangle.attackRange.height >= enemyAttackRectangle.position.y &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.height - playerAttackRectangle.attackRange.height <= enemyAttackRectangle.position.y + enemyAttackRectangle.height &&
        playerAttackRectangle.isAttackingLower
    );
}

// Function to check health
function declareWinner() {
    let winner = document.querySelector('.declareWinner') as HTMLElement;
    if (playerCharacter.health <= 0) {
        winner.innerText = 'Enemy Wins! Click to restart game';
        playGame = false;
    } else if (enemyCharacter.health <= 0) {
        winner.innerText = 'Player Wins! Click to restart game';
        playGame = false;
    }
}

// Function for boundary crossing 
function checkCentralCrossing() {
    if (playerCharacter.position.x < 40 || playerCharacter.position.x > 800 && playerCharacter.position.y) {
        playerCharacter.health = 0;
    } else if (enemyCharacter.position.x < 40 || enemyCharacter.position.x > 900) {
        enemyCharacter.health = 0;
    }
}

// Start animation loop
function startAnimation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update();
    fireLeft.update();
    fireRight.update();
    playerCharacter.update();
    enemyCharacter.update();

    playerCharacter.facingRight = playerCharacter.position.x < enemyCharacter.position.x;
    enemyCharacter.facingRight = enemyCharacter.position.x < playerCharacter.position.x;

    // Adding booleans for update of keys
    if (keys.a.pressed) {
        playerCharacter.position.x += -5;
        playerCharacter.setAction('run');
    } else if (keys.d.pressed) {
        playerCharacter.position.x += 5;
        playerCharacter.setAction('run');
    } else if (keys.w.pressed && !playerCharacter.isJumping) {
        playerCharacter.velocity.y = -5;
        playerCharacter.isJumping = true;
    } else if (keys.ArrowUp.pressed && !enemyCharacter.isJumping) {
        enemyCharacter.velocity.y = -5;
        enemyCharacter.isJumping = true;
    } else if (keys.ArrowLeft.pressed) {
        enemyCharacter.position.x += -5;
        enemyCharacter.setAction('run');
    } else if (keys.ArrowRight.pressed) {
        enemyCharacter.position.x += 5;
        enemyCharacter.setAction('run');
    } else {
        if (!playerCharacter.isAttackingUpper && !playerCharacter.isAttackingLower && !playerCharacter.isJumping) {
            playerCharacter.setAction('idle');
        }
        if (!enemyCharacter.isAttackingUpper && !enemyCharacter.isAttackingLower && !enemyCharacter.isJumping) {
            enemyCharacter.setAction('idle');
        }
    }

    // Collision detection for upper attack
    if (
        upperAttackDetection({ playerAttackRectangle: playerCharacter, enemyAttackRectangle: enemyCharacter }) && playerCharacter.isAttackingUpper
    ) {
        playerCharacter.isAttackingUpper = false;
        playerCharacter.applyUpperAttack(enemyCharacter);
        let enemyHealthBar = document.querySelector('.stats__health-bar--enemy') as HTMLElement;
        enemyHealthBar.style.width = enemyCharacter.health + '%';
        console.log('Upper attack detected by player');
    }

    if (
        upperAttackDetection({ playerAttackRectangle: enemyCharacter, enemyAttackRectangle: playerCharacter }) && enemyCharacter.isAttackingUpper
    ) {
        enemyCharacter.isAttackingUpper = false;
        enemyCharacter.applyUpperAttack(playerCharacter);
        let playerHealthBar = document.querySelector('.stats__health-bar--player') as HTMLElement;
        playerHealthBar.style.width = playerCharacter.health + '%';
        console.log('Upper attack detected by enemy');
    }

    // Collision detection for lower attack
    if (
        lowerAttackDetection({ playerAttackRectangle: playerCharacter, enemyAttackRectangle: enemyCharacter }) && playerCharacter.isAttackingLower
    ) {
        playerCharacter.isAttackingLower = false;
        playerCharacter.applyLowerAttack(enemyCharacter);
        let enemyHealthBar = document.querySelector('.stats__health-bar--enemy') as HTMLElement;
        enemyHealthBar.style.width = enemyCharacter.health + '%';
        console.log('Lower attack detected by player');
    }

    if (
        lowerAttackDetection({ playerAttackRectangle: enemyCharacter, enemyAttackRectangle: playerCharacter }) && enemyCharacter.isAttackingLower
    ) {
        enemyCharacter.isAttackingLower = false;
        enemyCharacter.applyLowerAttack(playerCharacter);
        let playerHealthBar = document.querySelector('.stats__health-bar--player') as HTMLElement;
        playerHealthBar.style.width = playerCharacter.health + '%';
        console.log('Lower attack detected by enemy');
    }

    checkCentralCrossing();
    declareWinner();

    if (playGame) {
        requestAnimationFrame(startAnimation);
    }
}

startAnimation();

// Adding event listeners
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'a':
            keys.a.pressed = true;
            break;
        case 'd':
            keys.d.pressed = true;
            break;
        case 'w':
            if (!playerCharacter.isJumping) {
                playerCharacter.velocity.y = -5;
                playerCharacter.isJumping = true;
            }
            break;
        case 't':
            playerCharacter.attackingUpper();
            break;
        case 'y':
            playerCharacter.attackingLower();
            break;
        case 's':
            playerCharacter.blocking = true;
            break;

        // Event listener for enemy player
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true;
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = true;
            break;
        case 'ArrowUp':
            if (!enemyCharacter.isJumping) {
                enemyCharacter.velocity.y = -5;
                enemyCharacter.isJumping = true;
            }
            break;
        case 'k':
            enemyCharacter.attackingUpper();
            break;
        case 'l':
            enemyCharacter.attackingLower();
            break;
        case 'ArrowDown':
            enemyCharacter.blocking = true;
            break;
    }
    console.log(event.key);
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'a':
            keys.a.pressed = false;
            break;
        case 'd':
            keys.d.pressed = false;
            break;
        case 'w':
            keys.w.pressed = false;
            break;
        case 's':
            playerCharacter.blocking = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowUp':
            keys.ArrowUp.pressed = false;
            break;
        case 'ArrowDown':
            enemyCharacter.blocking = false;
    }
});
