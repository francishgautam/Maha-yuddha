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

interface AttackRange {
    position: Position;
    width: number;
    height: number;
    correctCropParameters: CorrectCropParameters;
}

interface Skin {
    imageSrc: string;
    framesMax: number;
}

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false },
    s: { pressed: false },
    ArrowLeft: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowUp: { pressed: false }
};

let LastKey: string | null = '';

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
    }

    drawCharacter() {
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
    skins: Skin;
    attackUpperDamage: number;
    attackLowerDamage: number;
    pushEffect: number;
    isJumping: boolean;
    powerIncrement: number;

    constructor(
        position: Position,
        velocity: Velocity,
        sprite: string,
        imageSrc: string,
        scale = 1,
        framesMax = 1,
        correctCropParameters: CorrectCropParameters,
        skins: { [key: string]: Skin }
    ) {
        super(position, imageSrc, scale, framesMax, correctCropParameters);
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
        this.framesMax = framesMax;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 10;
        this.skins = { imageSrc: '', framesMax: 0 };
        this.attackUpperDamage = 5;
        this.attackLowerDamage = 10;
        this.pushEffect = 100;
        this.isJumping = false;
        this.powerIncrement = 10;
    }

    attackingUpper() {
        this.isAttackingUpper = true;
        setTimeout(() => {
            this.isAttackingUpper = false;
        }, 100);
    }

    attackingLower() {
        this.isAttackingLower = true;
        setTimeout(() => {
            this.isAttackingLower = false;
        }, 100);
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

const playerCharacter = new Character(
    {
        x: 200,
        y: 0
    },
    {
        x: 0,
        y: 0
    },
    'gray',
    '/samurai/idle.png',
    3.7,
    3,
    { x: 0, y: 0 },
    {
        idle: {
            imageSrc: '/samurai/idle.png',
            framesMax: 3
        },
        run: {
            imageSrc: '/samurai/run-sword.png',
            framesMax: 12
        }
    }
);

const enemyCharacter = new Character(
    {
        x: 700,
        y: 0
    },
    {
        x: 0,
        y: 200
    },
    'purple',
    '/samurai/idle.png',
    3.7,
    3,
    { x: 0, y: 0 },
    {
        idle: {
            imageSrc: '/samurai/idle.png',
            framesMax: 3
        },
        run: {
            imageSrc: '/samurai/run-sword.png',
            framesMax: 12
        }
    }
);

function upperAttackDetection({ playerAttackRectangle, enemyAttackRectangle }: { playerAttackRectangle: Character, enemyAttackRectangle: Character }) {
    return (
        playerAttackRectangle.attackRange.position.x + playerAttackRectangle.attackRange.width >= enemyAttackRectangle.position.x &&
        playerAttackRectangle.attackRange.position.x <= enemyAttackRectangle.position.x + enemyAttackRectangle.width &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.attackRange.height >= enemyAttackRectangle.position.y &&
        playerAttackRectangle.attackRange.position.y <= enemyAttackRectangle.position.y + enemyAttackRectangle.height &&
        playerAttackRectangle.isAttackingUpper
    );
}

function lowerAttackDetection({ playerAttackRectangle, enemyAttackRectangle }: { playerAttackRectangle: Character, enemyAttackRectangle: Character }) {
    return (
        playerAttackRectangle.attackRange.position.x + playerAttackRectangle.attackRange.width >= enemyAttackRectangle.position.x &&
        playerAttackRectangle.attackRange.position.x <= enemyAttackRectangle.position.x + enemyAttackRectangle.width &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.height - playerAttackRectangle.attackRange.height + playerAttackRectangle.attackRange.height >= enemyAttackRectangle.position.y &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.height - playerAttackRectangle.attackRange.height <= enemyAttackRectangle.position.y + enemyAttackRectangle.height &&
        playerAttackRectangle.isAttackingLower
    );
}

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

function startAnimation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update();
    playerCharacter.update();
    enemyCharacter.update();

    playerCharacter.facingRight = playerCharacter.position.x < enemyCharacter.position.x;
    enemyCharacter.facingRight = enemyCharacter.position.x < playerCharacter.position.x;

    // Adding booleans for update of keys
    if (keys.a.pressed) {
        playerCharacter.position.x += -5;
    } else if (keys.d.pressed) {
        playerCharacter.position.x += 5;
    } else if (keys.w.pressed && !playerCharacter.isJumping) {
        playerCharacter.velocity.y = -5;
        playerCharacter.isJumping = true;
    } else if (keys.ArrowUp.pressed && !enemyCharacter.isJumping) {
        enemyCharacter.velocity.y = -5;
        enemyCharacter.isJumping = true;
    } else if (keys.ArrowLeft.pressed) {
        enemyCharacter.position.x += -5;
    } else if (keys.ArrowRight.pressed) {
        enemyCharacter.position.x += 5;
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
            LastKey = 'a';
            break;
        case 'd':
            keys.d.pressed = true;
            LastKey = 'd';
            break;
        case 'w':
            if (!playerCharacter.isJumping) {
                playerCharacter.velocity.y = -5;
                playerCharacter.isJumping = true;
            }
            LastKey = 'w';
            break;
        case 't':
            playerCharacter.attackingUpper();
            break;
        case 'y':
            playerCharacter.attackingLower();
            break;
        case 's':
            //playerCharacter.crouch();
            break;

        // Event listener for enemy player
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true;
            LastKey = 'ArrowLeft';
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = true;
            LastKey = 'ArrowRight';
            break;
        case 'ArrowUp':
            if (!enemyCharacter.isJumping) {
                enemyCharacter.velocity.y = -5;
                enemyCharacter.isJumping = true;
            }
            LastKey = 'ArrowUp';
            break;
        case 'k':
            enemyCharacter.attackingUpper();
            break;
        case 'l':
            enemyCharacter.attackingLower();
            break;
        case 'ArrowDown':
            //enemyCharacter.crouch();
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
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowUp':
            keys.ArrowUp.pressed = false;
            break;
    }
});
