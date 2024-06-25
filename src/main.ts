import './style.css';

const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let gravity = 0.4;

let playGame: boolean = true;
let paused: boolean = false; 
const backgroundMusic = document.getElementById('backgroundMusic') as HTMLAudioElement;
backgroundMusic.volume = 1;

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
        this.height = 200;
        this.width = 150;
        this.sprite = sprite;
        this.attackRange = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            width: 200,
            height: 30,
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
        this.pushEffect = 200;
        this.isJumping = false;
        this.powerIncrement = 35;
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
            if( !enemyCharacter.isJumping == false || !playerCharacter.isJumping == false){  //So that characters cannot upper attack in air
                return
            }

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
        if( !enemyCharacter.isJumping == false || !playerCharacter.isJumping == false){     //So that characters cannot lower attack in air
            return
        }
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

    //Power up code
    zoroPowerUpPlayer(){
        if(this.power >= 100 && (selectedPlayerCharacter == 'Zoro')){
            this.attackLowerDamage *= 5;
            this.attackUpperDamage *= 5;
            alert('Zoro power up added');
        }
        else{
            return;
        }

        //Reset power bar
        this.power = 0;
        this.updatePowerBar();

        setTimeout(()=>{
            this.attackLowerDamage /= 2;
            this.attackUpperDamage /= 2;
        }, 7000)
    }

    zoroPowerUpEnemy(){
        if(this.power >= 100 && (selectedEnemyCharacter == 'Zoro')){
            this.attackLowerDamage *= 5;
            this.attackUpperDamage *= 5;
            alert('Zoro power up added');
        }
        else{
            return;
        }

        //Reset power bar
        this.power = 0;
        this.updatePowerBar();

        setTimeout(()=>{
            this.attackLowerDamage /= 2;
            this.attackUpperDamage /= 2;
        }, 7000)
    }

    luffyPowerUpPlayer() {
        if (this.power >= 100 && (selectedPlayerCharacter == 'Luffy' || selectedEnemyCharacter == 'Luffy')) {
            alert('Luffy Power Up added');

            //Power up for luffy
            const powerUpBar = document.querySelector('.stats__power-bar--enemy') as HTMLElement;
            enemyCharacter.power = 0;
            powerUpBar.style.width = enemyCharacter.power + '%';
            playerCharacter.position.x = enemyCharacter.position.x-100;

            // Reset the power bar
            this.power = 0;
            this.updatePowerBar();
            
            //Reset other parameters
            setTimeout(() => {
        
            },7000);
        } else {
            return;
        }
    }
    luffyPowerUpEnemy() {
        if (this.power >= 100 && (selectedEnemyCharacter == 'Luffy')) {
            alert('Luffy Power Up added');

            //Power up for luffy
            const powerUpBar = document.querySelector('.stats__power-bar--player') as HTMLElement;
            playerCharacter.power = 0;
            powerUpBar.style.width = playerCharacter.power + '%';

            // Reset the power bar
            this.power = 0;
            this.updatePowerBar();

            //Reset other parameters
            setTimeout(()=>{
            }, 7000)
        } else {
            return;
        }
    }

    smokerPowerUpPlayer(){
        if (this.power >= 100 && (selectedPlayerCharacter == 'Smoker')) {
            alert('Smoker Power Up added');

            this.pushEffect += 200;
            // Reset the power bar
            this.power = 0;
            this.updatePowerBar();

            //Reset other parameters
            setTimeout(()=>{
                this.pushEffect = 200;
            }, 7000)
        } else {
            return;
        }
    }
    smokerPowerUpEnemy(){
        if (this.power >= 100 && (selectedEnemyCharacter == 'Smoker')) {
            alert('Smoker Power Up added');

            this.pushEffect += 200;
            // Reset the power bar
            this.power = 0;
            this.updatePowerBar();

            //Reset other parameters
            setTimeout(()=>{
                this.pushEffect = 200;
            }, 10000)
        } else {
            return;
        }
    }
    hancockPowerUpPlayer(){
        if (this.power >= 100 && (selectedPlayerCharacter == 'Hancock')) {
            alert('Hancock Power Up added');

            //Power up
            const playerHealthBar = document.querySelector('.stats__health-bar--player') as HTMLAreaElement;
            this.health = 100;
            playerHealthBar.style.width = this.health + '%';

        } else {
            return;
        }
    }
    hancockPowerUpEnemy(){
        if (this.power >= 100 && (selectedEnemyCharacter == 'Hancock')) {
            alert('Hancock Power Up added');

            //Power up
            const playerHealthBar = document.querySelector('.stats__health-bar--enemy') as HTMLAreaElement;
            this.health = 100;
            playerHealthBar.style.width = this.health + '%';
    
        } else {
            return;
        }
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

        if (this.position.y + this.height >= canvas.height ) {
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

const characterSprites: Record<string, Record<string, Sprite>> = {
    Luffy: {
        idle: { imageSrc: '/afro-luffy/idle.png', scale: 1, framesMax: 2, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        run: { imageSrc: '/afro-luffy/running.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        jump: { imageSrc: '/afro-luffy/jumping.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackUpper: { imageSrc: '/afro-luffy/heavyAttack.png', scale: 1, framesMax: 3, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackLower: { imageSrc: '/afro-luffy/lightAttack.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        block: { imageSrc: '/afro-luffy/blocking.png', scale: 1, framesMax: 2, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        death: { imageSrc: '/afro-luffy/death.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        
    },
    Zoro: {
        idle: { imageSrc: '/zoro/idle.png', scale: 1, framesMax: 3, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        run: { imageSrc: '/zoro/running.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        jump: { imageSrc: '/zoro/jumping.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackUpper: { imageSrc: '/zoro/lightAttack.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackLower: { imageSrc: '/zoro/heavyAttack.png', scale: 1, framesMax: 4, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        block: { imageSrc: '/zoro/blocking.png', scale: 1, framesMax: 2, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        death: { imageSrc: '/zoro/death.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },

    },
    Smoker: {
        idle: { imageSrc: '/smoker/idle.png', scale: 1, framesMax: 4, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        run: { imageSrc: '/smoker/running.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        jump: { imageSrc: '/smoker/jumping.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackUpper: { imageSrc: '/smoker/lightAttack.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackLower: { imageSrc: '/smoker/heavyAttack.png', scale: 1, framesMax: 2, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        block: { imageSrc: '/smoker/blocking.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        death: { imageSrc: '/smoker/death.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },

    },
    Hancock: {
        idle: { imageSrc: '/hancock/idle.png', scale: 1, framesMax: 3, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        run: { imageSrc: '/hancock/running.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        jump: { imageSrc: '/hancock/jumping.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackUpper: { imageSrc: '/hancock/lightAttack.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackLower: { imageSrc: '/hancock/heavyAttack.png', scale: 1, framesMax: 3, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        block: { imageSrc: '/hancock/blocking.png', scale: 0.6, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        death: { imageSrc: '/hancock/death.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },

    },
    LuffyPowerUp : {
        idle: { imageSrc: '/luffy-power-up/idle.png', scale: 1, framesMax: 3, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        run: { imageSrc: '/luffy-power-up/running.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        jump: { imageSrc: '/luffy-power-up/jumping.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackUpper: { imageSrc: '/luffy-power-up/lightAttack.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        attackLower: { imageSrc: '/luffy-power-up/heavyAttack.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        block: { imageSrc: '/luffy-power-up/blocking.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },
        death: { imageSrc: '/luffy-power-up/death.png', scale: 1, framesMax: 1, correctCropParameters: { x: 0, y: 100 }, image: new Image(), imageLoaded: false },

    }
};

const backgroundSprites: Record<string, string> = {
    Pokhara: '/pokhara.webp',
    Lumbini: '/lumbini.webp',
    MountEverest: '/mount-everest.webp',
    Tilicho: '/tilicho.webp'
};

let selectedPlayerCharacter: string = 'Luffy';
let selectedEnemyCharacter: string = 'LuffyPowerUp';
let selectedBackground: string = 'Pokhara';

document.querySelectorAll('.player-selection .character').forEach(character => {
    character.addEventListener('click', function(this: HTMLElement) {
        selectedPlayerCharacter = this.getAttribute('data-character') as string;
        document.querySelector('.player-selection .selected')?.classList.remove('selected');
        this.classList.add('selected');
    });
});

document.querySelectorAll('.enemy-selection .character').forEach(character => {
    character.addEventListener('click', function(this: HTMLElement) {
        selectedEnemyCharacter = this.getAttribute('data-character') as string;
        document.querySelector('.enemy-selection .selected')?.classList.remove('selected');
        this.classList.add('selected');
    });
});

document.querySelectorAll('.location-selection .background').forEach(background => {
    background.addEventListener('click', function(this: HTMLElement) {
        selectedBackground = this.getAttribute('data-background') as string;
        document.querySelector('.location-selection .selected')?.classList.remove('selected');
        this.classList.add('selected');
    });
});

    backgroundMusic.src = `/audio/${selectedBackground}.mp3`;


const characterConfirmationButton = document.querySelector('#characterConfirmationButton') as HTMLElement;
characterConfirmationButton.addEventListener('click', () => {
    const selectionContainer = document.getElementById('selection-container');
    const backgroundSelectionContainer = document.getElementById('background-selection-container') as HTMLElement;
    if (selectionContainer) {
        selectionContainer.style.display = 'none';
        backgroundSelectionContainer.style.display = 'block';
    }
});

const startGameButton = document.querySelector('#startGameButton') as HTMLElement;
startGameButton.addEventListener('click',()=>{
    const backgroundSelectionContainer = document.getElementById('background-selection-container');
    if(backgroundSelectionContainer){
        backgroundSelectionContainer.style.display = 'none';
    }
    const gameContainer = document.querySelector('.game-container') as HTMLElement;
    if (gameContainer) {
        gameContainer.style.display = 'block';
    }
    startGame();
})

let playerCharacter: Character;
let enemyCharacter: Character;

function startGame() {
    const playerSprites = characterSprites[selectedPlayerCharacter];
    const enemySprites = characterSprites[selectedEnemyCharacter];
    const backgroundSprite = backgroundSprites[selectedBackground];

    const background = new CreateCharacter(
        { x: 0, y: 0 },
        backgroundSprite,
        1,
        1,
        { x: 0, y: 0 }
    );

    const fireLeft = new CreateCharacter(
        {x:75,y:350},
        '/fire.png',
        15,
        6,
        {x:0,y:0}
    )

    const fireRight = new CreateCharacter(
        {x:1200,y:350},
        '/fire.png',
        15,
        6,
        {x:0,y:0}
    )

    playerCharacter = new Character(
        { x: 500, y: 700 },
        { x: 0, y: 100 },
        'gray',
        playerSprites
    );

    enemyCharacter = new Character(
        { x: 920, y: 700 },
        { x: 0, y: 0 },
        'purple',
        enemySprites
    );

    function startAnimation() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.update();
        playerCharacter.update();
        enemyCharacter.update();
        fireLeft.update();
        fireRight.update();

        if (paused) {
            return;
        }

        playerCharacter.facingRight = playerCharacter.position.x < enemyCharacter.position.x;
        enemyCharacter.facingRight = enemyCharacter.position.x < playerCharacter.position.x;

        if (keys.a.pressed && playerCharacter.blocking == false) {
            playerCharacter.position.x += -5;
            playerCharacter.setAction('run');
        } else if (keys.d.pressed && playerCharacter.blocking == false) {
            playerCharacter.position.x += 5;
            playerCharacter.setAction('run');
        } else if (keys.ArrowDown.pressed) {
            playerCharacter.setAction('block');
        } else if (keys.w.pressed && !playerCharacter.isJumping) {
            playerCharacter.velocity.y = -10;
            playerCharacter.isJumping = true;
        } else if (keys.ArrowUp.pressed && !enemyCharacter.isJumping) {
            enemyCharacter.velocity.y = -10;
            enemyCharacter.isJumping = true;
        } else if (keys.ArrowLeft.pressed && enemyCharacter.blocking == false) {
            enemyCharacter.position.x += -5;
            enemyCharacter.setAction('run');
        } else if (keys.ArrowRight.pressed && enemyCharacter.blocking == false) {
            enemyCharacter.position.x += 5;
            enemyCharacter.setAction('run');
        } else if (keys.ArrowDown.pressed) {
            enemyCharacter.setAction('block');
        } else {
            if (!playerCharacter.isAttackingUpper && !playerCharacter.isAttackingLower && !playerCharacter.isJumping) {
                playerCharacter.setAction('idle');
            }
            if (!enemyCharacter.isAttackingUpper && !enemyCharacter.isAttackingLower && !enemyCharacter.isJumping) {
                enemyCharacter.setAction('idle');
            }
        }

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

        if (playerCharacter.blocking == true) {
            playerCharacter.setAction('block');
        }
        if (enemyCharacter.blocking == true) {
            enemyCharacter.setAction('block');
        }

        checkCentralCrossing();
        declareWinner();

        if (playGame) {
            requestAnimationFrame(startAnimation);
        }
        bot();
    }

    backgroundMusic.play();
    startAnimation();
}

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
                playerCharacter.velocity.y = -11;
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
        case 'f':
            playerCharacter.zoroPowerUpPlayer();
            playerCharacter.luffyPowerUpPlayer();
            playerCharacter.smokerPowerUpPlayer();
            playerCharacter.hancockPowerUpPlayer();
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true;
            break;
        case 'ArrowRight':
            keys.ArrowRight.pressed = true;
            break;
        case 'ArrowUp':
            if (!enemyCharacter.isJumping) {
                enemyCharacter.velocity.y = -11;
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
        case 'p':
            enemyCharacter.luffyPowerUpEnemy();
            enemyCharacter.zoroPowerUpEnemy();
            enemyCharacter.smokerPowerUpEnemy();
            enemyCharacter.hancockPowerUpEnemy();
            break;
        case ' ':
            togglePause();  // Toggle pause on spacebar press
            break;
    }
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
        playerAttackRectangle.attackRange.position.y + playerCharacter.height - playerAttackRectangle.attackRange.height + playerAttackRectangle.attackRange.height >= enemyAttackRectangle.position.y &&
        playerAttackRectangle.attackRange.position.y + playerCharacter.height - playerAttackRectangle.attackRange.height <= enemyAttackRectangle.position.y + enemyAttackRectangle.height &&
        playerAttackRectangle.isAttackingLower
    );
}

function checkCentralCrossing() {
    if (playerCharacter.position.x < 155|| playerCharacter.position.x > canvas.width-250 ) {
        playerCharacter.health = 0;
        console.log(playerCharacter.position.y)
    } else if (enemyCharacter.position.x < 140 || enemyCharacter.position.x > canvas.width-250) {
        enemyCharacter.health = 0;
    }
}

function declareWinner() {
    const winner = document.querySelector('.declareWinner') as HTMLElement | null;
    if (!winner) {
        console.error('Winner element not found');
        return;
    }

    if (playerCharacter.health <= 0) {
        winner.innerText = 'Enemy Wins! Click to restart game';
        playerCharacter.setAction('death');
        setTimeout(() => {
            playGame = false;
        }, 500);
    } else if (enemyCharacter.health <= 0) {
        winner.innerText = 'Player Wins! Click to restart game';
        enemyCharacter.setAction('death');
        setTimeout(() => {
            playGame = false;
        }, 500);
    }

    winner.onclick = () => {
        location.reload();
    };
}


let botActionCooldown = false;

function bot() {
    if (selectedEnemyCharacter === 'LuffyPowerUp' && !botActionCooldown) {
        botActionCooldown = true; 

        const moveDirection = Math.random();

        if(enemyCharacter.position.x>canvas.width-350){
            keys.ArrowLeft.pressed = true;
            keys.ArrowRight.pressed = false;
        }
        else if (enemyCharacter.position.x < 250) {
            keys.ArrowLeft.pressed = false;
            keys.ArrowRight.pressed = true;
        }
        else if (moveDirection < 0.33) {
            keys.ArrowLeft.pressed = true;
            keys.ArrowRight.pressed = false;
        } else if (moveDirection < 0.66) {
            keys.ArrowLeft.pressed = false;
            keys.ArrowRight.pressed = true;
        } else {
            keys.ArrowLeft.pressed = false;
            keys.ArrowRight.pressed = false;
        }

        // Randomly decide to jump
        if (Math.random() < 0.1 && !enemyCharacter.isJumping) {
            enemyCharacter.velocity.y = -11;
            enemyCharacter.isJumping = true;
        }

        // Attack when player is closer
        if (playerCharacter.position.x - enemyCharacter.position.x < 100) {
            enemyCharacter.attackingUpper();
        } else if (playerCharacter.position.x - enemyCharacter.position.x < 100) {
            enemyCharacter.attackingLower();
        }

        setTimeout(() => {
            botActionCooldown = false;
        }, 300); 
    }
}

// Function to toggle the pause state
function togglePause() {
    paused = !paused;
    if (!paused) {
        startGame();
    }
}

