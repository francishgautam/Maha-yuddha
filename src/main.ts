import './style.css'

const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
const ctx : CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

canvas.width = 1000;
canvas.height = 460;
const gravity = 0.1;

let playGame : boolean = true;

interface Position {
    x : number;
    y : number;
}

interface Velocity { 
    x : number;
    y : number;
}

interface CorrectCropParameters {
    x : number;
    y : number;
}

interface AttackRange {
    position : Position;
    width : number;
    height : number;
    correctCropParameters : CorrectCropParameters;
}

const keys  = {
    a : { pressed : false },
    d : { pressed : false },
    w : { pressed : false},
    s : { pressed : false},
    ArrowLeft : { pressed : false},
    ArrowRight : { pressed : false},
    ArrowUp : { pressed : false}
};

let lastKey : string | null = '';

class CreateCharacter {

    position : Position;
    height : number;
    width : number;
    imageSrc : string;
    image : any;
    scale : number;
    framesMax : number;
    framesCurrent : number;
    framesElapsed : number;
    framesHold : number;
    // image : CanvasImageSource;
    // imageSrc : CanvasImageSource;
    correctCropParameters : object;
    constructor(position : Position, imageSrc : string, scale = 1, framesMax = 1, correctCropParameters : object){
        this.position = position
        this.height = 100
        this.width = 50
        this.imageSrc = imageSrc
        this.scale = scale
        this.framesMax = framesMax
        this.image = new Image();
        this.image.src = imageSrc;

        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 0;

        this.correctCropParameters = correctCropParameters;
    }

    // Character creation function
    drawCharacter(){
        ctx.drawImage(
            this.image, 
            this.framesCurrent * (this.image.width/this.framesMax),  // This is for the crop from the top left position of the image in x-direction
            0,                                  // This will crop in the y direction from the top
            this.image.width/this.framesMax,    // framesMax is the value of total images in the sprite ( I am using linear sprite )
            this.image.height,                  //

            this.position.x,
            this.position.y,
            (this.image.width/this.framesMax) * this.scale, 
            this.image.height* this.scale
        );
    }

    //Attack creation function
    drawAttackUpper(){
       
    }
    drawAttackLower(){
      
    }

    update(){
        this.drawCharacter();

        this.framesElapsed++;
        //Update animation frame
        if(this.framesElapsed % this.framesHold === 0){
            if(this.framesCurrent < this.framesMax -1 )   // -1 because the first frame starts at zero
        {   
            this.framesCurrent++;
        }
        else{
            this.framesCurrent = 0;
        }
        }
    }
}

class Character extends CreateCharacter{

    velocity : Velocity;
    height : number;
    width : number;
    sprite : string;
    attackRange : AttackRange;
    isAttackingUpper : boolean;
    isAttackingLower : boolean;
    health : number;
    power : number;
    correctCropParameters: CorrectCropParameters;
 
    constructor(position : Position, velocity : Velocity, sprite : string, imageSrc : string, scale = 1, framesMax = 1,correctCropParameters : CorrectCropParameters ){
       
        super(
            position,imageSrc,scale,framesMax, correctCropParameters
        );

        this.velocity = velocity
        this.height = 100
        this.width = 50,
        this.sprite = sprite
        this.attackRange = {
            position : {
                x : this.position.x,
                y : this.position.y
            },
            width : 100,
            height : 10,
            correctCropParameters : {
                x : 0,
                y : 0
            }
        }
        this.isAttackingUpper = false;
        this.isAttackingLower = false;
        this.health = 100;
        this.power = 0;
        this.framesCurrent = 0;
        this.framesElapsed = 0;
        this.framesHold = 0;
        this.correctCropParameters = correctCropParameters;
    }

    update(){
        this.drawCharacter();

        
        this.framesElapsed++;
        //Update animation frame
        if(this.framesElapsed % this.framesHold === 0){
            if(this.framesCurrent < this.framesMax -1 )   // -1 because the first frame starts at zero
        {   
            this.framesCurrent++;
        }
        else{
            this.framesCurrent = 0;
        }
        }

        this.attackRange.position.x = this.position.x + this.attackRange.correctCropParameters.x;
        this.attackRange.position.y = this.position.y;

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y ;

        if (this.position.y + this.height >= canvas.height) {
            this.position.y = canvas.height - this.height; 
            this.velocity.y = 0;
        } else {
            this.velocity.y += gravity;
        }
    }

    attackingUpper(){
        this.isAttackingUpper = true;
        setTimeout(()=>{
            this.isAttackingUpper = false
        },100)
    }
    attackingLower(){
        this.isAttackingLower = true;
        setTimeout(()=>{
            this.isAttackingLower = false
        },100)
    }
}

const background = new CreateCharacter(
    {
        x : -400,
        y : -100
    },
    '/pokhara.jpg',
    1,
    1,
    {x:0,y:0}
)

const playerCharacter = new Character(
    {
        x : 200,
        y : 0
    },
    {
        x : 0,
        y : 0
    },
    'gray',
    '/samurai/idle.png',
    3,
    3,
    {x:215,y:180}
);

const enemyCharacter = new Character(
    {
        x : 700,
        y : 0,
    },
    {
        x : 0,
        y : 0
    },
    'purple',
    '/samurai/idle.png',
    3,
    3,
    {x:215,y:180}
);

function upperAttackDetection({playerAttackRectangle,enemyAttackRectangle}){
    return(
        playerAttackRectangle.attackRange.position.x + playerAttackRectangle.attackRange.width >= enemyAttackRectangle.position.x &&
        playerAttackRectangle.attackRange.position.x <= enemyAttackRectangle.position.x + enemyAttackRectangle.width &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.attackRange.height >= enemyAttackRectangle.position.y &&
        playerAttackRectangle.attackRange.position.y <= enemyAttackRectangle.position.y + enemyAttackRectangle.height &&
        playerAttackRectangle.isAttackingUpper
    )
}

function lowerAttackDetection({playerAttackRectangle,enemyAttackRectangle}){
    return(
        playerAttackRectangle.attackRange.position.x + playerAttackRectangle.attackRange.width >= enemyAttackRectangle.position.x &&
        playerAttackRectangle.attackRange.position.x <= enemyAttackRectangle.position.x + enemyAttackRectangle.width &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.height - playerAttackRectangle.attackRange.height + playerAttackRectangle.attackRange.height >= enemyAttackRectangle.position.y &&
        playerAttackRectangle.attackRange.position.y + playerAttackRectangle.height - playerAttackRectangle.attackRange.height <= enemyAttackRectangle.position.y + enemyAttackRectangle.height &&
        playerAttackRectangle.isAttackingLower
    )
}

function declareWinner(){
    let winner = document.querySelector('.declareWinner') as HTMLElement;
    if(playerCharacter.health <= 0){
        winner.innerText = 'Enemy Wins ! Click to restart game'
        playGame = false;

    }else if(enemyCharacter.health <= 0){
        winner.innerText = 'Player Wins ! Click to restart game'
        playGame = false;
    }
}

function startAnimation(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    background.update();   
    playerCharacter.update();
    enemyCharacter.update();

    // Adding booleans for update of keys
    if(keys.a.pressed){
        playerCharacter.position.x += -5;
    }
    else if(keys.d.pressed){
        playerCharacter.position.x += 5;
    }
    else if(keys.w.pressed){
        playerCharacter.position.y += -5;
    }
    else if(keys.ArrowUp.pressed){
        enemyCharacter.position.y += -5;
    }
    else if(keys.ArrowLeft.pressed){
        enemyCharacter.position.x += -5;
    }
    else if(keys.ArrowRight.pressed){
        enemyCharacter.position.x += 5;
    }

    // Collision detection for upper attack............................

    if (
      upperAttackDetection({playerAttackRectangle : playerCharacter, enemyAttackRectangle : enemyCharacter}) && playerCharacter.isAttackingUpper
    ) {
        playerCharacter.isAttackingUpper = false;

        //Decrease the health bar of enemy for upper attack by player 
        let enemyHealthBar = document.querySelector('.stats__health-bar--enemy') as HTMLElement;
        enemyCharacter.health += -10;
        enemyHealthBar.style.width = enemyCharacter.health + '%';

        // //Increase the power up bar
        // let playerPowerUpBar = document.querySelector('.stats__power-bar--player') as HTMLElement;
        // playerCharacter.power += 1;
        // playerPowerUpBar.style.width = playerCharacter.health + '%';
        
        console.log('Upper attack detected by player');
    }

    if (
        upperAttackDetection({playerAttackRectangle : enemyCharacter, enemyAttackRectangle : playerCharacter}) && enemyCharacter.isAttackingUpper
      ) {
          playerCharacter.isAttackingUpper = false;

        //Decrease the health bar of player for upper attack by enemy
        let playerHealthBar = document.querySelector('.stats__health-bar--player') as HTMLElement;
        playerCharacter.health += -3;
        playerHealthBar.style.width = playerCharacter.health + '%';

        console.log('Upper attack detected by enemy');
      }

    // Collision detection for lower attack...........................

    if (
      lowerAttackDetection({playerAttackRectangle: playerCharacter,enemyAttackRectangle : enemyCharacter}) && playerCharacter.isAttackingLower
    ) {
        playerCharacter.isAttackingLower = false;

        //Decrease the health bar for lower attack by player
        let enemyHealthBar = document.querySelector('.stats__health-bar--enemy') as HTMLElement;
        enemyCharacter.health += -10;
        enemyHealthBar.style.width = enemyCharacter.health + '%';

        console.log('Lower attack detected by player');
    }

    if (
        lowerAttackDetection({playerAttackRectangle: enemyCharacter,enemyAttackRectangle : playerCharacter}) && enemyCharacter.isAttackingLower
      ) {
          playerCharacter.isAttackingLower = false;

        //Decrease the health bar for lower attack by enemy
        let playerHealthBar = document.querySelector('.stats__health-bar--player') as HTMLElement;
        playerCharacter.health += -3;
        playerHealthBar.style.width = playerCharacter.health + '%';
          console.log('Lower attack detected by enemy');
      }
    
    // Declare winner...........................................
    declareWinner();


    if(playGame){
        requestAnimationFrame(startAnimation);
      }
}

startAnimation();

// Adding event listeners
window.addEventListener('keydown', (event) => {
    switch(event.key){
        case 'a':
            keys.a.pressed = true;
            lastKey = 'a';
            break;  
        case 'd':
            keys.d.pressed = true;
            lastKey = 'd';
            break;
        case 'w':
            playerCharacter.velocity.y = -5;
            lastKey = 'w';
            break;
        case 't':
            playerCharacter.attackingUpper();
            break;
        case 'y':
            playerCharacter.attackingLower();
            break;
        case 's':
            playerCharacter.crouch();
            break;

// Event listener for enemy player

        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true;
            lastKey = 'ArrowLeft';
            break;  
        case 'ArrowRight':
            keys.ArrowRight.pressed = true;
            lastKey = 'ArrowRight';
            break;
        case 'ArrowUp':
            enemyCharacter.velocity.y = -5;
            lastKey = 'ArrowUp';
            break;
        case 'k':
            enemyCharacter.attackingUpper();
            break;
        case 'l':
            enemyCharacter.attackingLower();
            break;
        case 'ArrowDown':
            enemyCharacter.crouch();
    }
    console.log(event.key);
});

window.addEventListener('keyup', (event) => {
    switch(event.key){
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
            
        // case 's':
        //     playerCharacter.stand();
        //     break;
        
    }
})
