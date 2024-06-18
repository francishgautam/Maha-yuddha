const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
const ctx : CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight-100;
const gravity = 0.1;

interface Position {
    x : number;
    y : number;
}

interface Velocity { 
    x : number;
    y : number;
}

interface ChangeDirection {
    x : number;
    y : number;
}

interface AttackRange {
    position : Position;
    width : number;
    height : number;
    changeDirection : ChangeDirection;
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
    velocity : Velocity;
    height : number;
    width : number;
    sprite : string;
    changeDirection : ChangeDirection;
    attackRange : AttackRange;
    isAttackingUpper : boolean;
    isAttackingLower : boolean;
 
    constructor(position : Position, velocity : Velocity, sprite : string, changeDirection : ChangeDirection){
        this.position = position
        this.velocity = velocity
        this.height = 100
        this.width = 50
        this.sprite = sprite
        this.changeDirection = changeDirection
        this.attackRange = {
            position : {
                x : this.position.x,
                y : this.position.y
            },
            changeDirection,
            width : 100,
            height : 10
        }
        this.isAttackingUpper = false;
        this.isAttackingLower = false;
    }

    // Character creation function
    drawCharacter(){
        ctx.fillStyle = this.sprite;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        //Attack box
        ctx.fillRect(this.attackRange.position.x,this.attackRange.position.y,this.attackRange.width,this.attackRange.height);

        if(this.isAttackingUpper == true){
            this.drawAttackUpper();
        }
        if(this.isAttackingLower == true){
            this.drawAttackLower();
        }
    }

    //Attack creation function
    drawAttackUpper(){
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.position.x,this.position.y,this.attackRange.width,this.attackRange.height);
    }
    drawAttackLower(){
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.position.x,this.position.y+playerCharacter.height-10,this.attackRange.width,this.attackRange.height);
    }

    crouch(){

    }

    update(){
        this.drawCharacter();

        this.attackRange.position.x = this.position.x + this.attackRange.changeDirection.x;
        this.attackRange.position.y = this.position.y;

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;


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

const playerCharacter = new CreateCharacter(
    {
        x : 0,
        y : 0
    },
    {
        x : 0,
        y : 0
    },
    'gray',
    {
        x : 0,
        y : 0
    }
);

const enemyCharacter = new CreateCharacter(
    {
        x : 100,
        y : 0,
    },
    {
        x : 0,
        y : 0
    },
    'purple',
    {
        x : -50,
        y : 0
    }
);

function upperAttackDetection(playerAttackRectangle,enemyAttackRectangle){
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


function startAnimation(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
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

    // Collision detection for upper attack
    if (
      upperAttackDetection({playerAttackRectangle : playerCharacter, enemyAttackRectangle : enemyCharacter}) && playerCharacter.isAttackingUpper
    ) {
        playerCharacter.isAttackingUpper = false;
        console.log('Upper attack detected');
    }

    if (
        upperAttackDetection({playerAttackRectangle : enemyCharacter, enemyAttackRectangle : playerCharacter}) && enemyCharacter.isAttackingUpper
      ) {
          playerCharacter.isAttackingUpper = false;
          console.log('Upper attack detected');
      }

    // Collision detection for lower attack
    if (
      lowerAttackDetection(playerCharacter,enemyCharacter) && playerCharacter.isAttackingLower
    ) {
        playerCharacter.isAttackingLower = false;
        console.log('Lower attack detected');
    }

    requestAnimationFrame(startAnimation);
    
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
