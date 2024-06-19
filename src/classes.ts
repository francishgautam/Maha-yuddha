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
  health : number;
  power : number;

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
      this.health = 100;
      this.power = 0;
  }
}

class Character {

      position : Position;
      height : number;
      width : number;
   
      constructor(position : Position){
          this.position = position
          this.height = 100
          this.width = 50
      }

  // Character creation function
  drawCharacter(){
      console.log('character')
  }

  //Attack creation function
  drawAttackUpper(){
      
  }
  drawAttackLower(){
     
  }

  update(){
      this.drawCharacter()
  }
}

