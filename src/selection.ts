// export interface Position {
//   x: number;
//   y: number;
// }

// export interface Velocity {
//   x: number;
//   y: number;
// }

// export interface CorrectCropParameters {
//   x: number;
//   y: number;
// }

// export interface Sprite {
//   imageSrc: string;
//   framesMax: number;
//   scale: number;
//   correctCropParameters: CorrectCropParameters;
//   image: HTMLImageElement;
//   imageLoaded: boolean;
// }

// export interface AttackRange {
//   position: Position;
//   width: number;
//   height: number;
//   correctCropParameters: CorrectCropParameters;
// }

// export class CreateCharacter {
//   position: Position;
//   height: number;
//   width: number;
//   imageSrc: string;
//   image: HTMLImageElement;
//   scale: number;
//   framesMax: number;
//   framesCurrent: number;
//   framesElapsed: number;
//   framesHold: number;
//   correctCropParameters: CorrectCropParameters;
//   facingRight: boolean;
//   imageLoaded: boolean;

//   constructor(position: Position, imageSrc: string, scale = 1, framesMax = 1, correctCropParameters: CorrectCropParameters) {
//       this.position = position;
//       this.height = 100;
//       this.width = 50;
//       this.imageSrc = imageSrc;
//       this.scale = scale;
//       this.framesMax = framesMax;
//       this.image = new Image();
//       this.image.src = imageSrc;
//       this.framesCurrent = 0;
//       this.framesElapsed = 0;
//       this.framesHold = 10; // Adjust this value to control the frame rate
//       this.correctCropParameters = correctCropParameters;
//       this.facingRight = true;
//       this.imageLoaded = false;
//       this.image.onload = () => {
//           this.imageLoaded = true;
//       };
//   }

//   drawCharacter(ctx: CanvasRenderingContext2D) {
//       if (!this.image.complete) return; // Check if the image is loaded before drawing

//       ctx.save();
//       if (!this.facingRight) {
//           ctx.scale(-1, 1);
//           ctx.translate(-ctx.canvas.width, 0);
//       }

//       ctx.drawImage(
//           this.image,
//           this.framesCurrent * (this.image.width / this.framesMax),
//           0,
//           this.image.width / this.framesMax,
//           this.image.height,
//           this.facingRight ? this.position.x - this.correctCropParameters.x : ctx.canvas.width - this.position.x - this.width + this.correctCropParameters.x,
//           this.position.y - this.correctCropParameters.y,
//           (this.image.width / this.framesMax) * this.scale,
//           this.image.height * this.scale
//       );

//       ctx.restore();
//   }

//   update(ctx: CanvasRenderingContext2D) {
//       this.drawCharacter(ctx);
//       this.framesElapsed++;
//       if (this.framesElapsed % this.framesHold === 0) {
//           if (this.framesCurrent < this.framesMax - 1) {
//               this.framesCurrent++;
//           } else {
//               this.framesCurrent = 0;
//           }
//       }
//   }
// }

// export class Character extends CreateCharacter {
//   velocity: Velocity;
//   sprite: string;
//   attackRange: AttackRange;
//   isAttackingUpper: boolean;
//   isAttackingLower: boolean;
//   health: number;
//   power: number;
//   attackUpperDamage: number;
//   attackLowerDamage: number;
//   pushEffect: number;
//   isJumping: boolean;
//   powerIncrement: number;
//   blocking: boolean;
//   sprites: Record<string, Sprite>;
//   currentAction: string;
//   canAttackUpper: boolean;
//   canAttackLower: boolean;

//   constructor(
//       position: Position,
//       velocity: Velocity,
//       sprite: string,
//       sprites: Record<string, Sprite>
//   ) {
//       super(position, sprites.idle.imageSrc, sprites.idle.scale, sprites.idle.framesMax, sprites.idle.correctCropParameters);
//       this.velocity = velocity;
//       this.height = 100;
//       this.width = 50;
//       this.sprite = sprite;
//       this.attackRange = {
//           position: {
//               x: this.position.x,
//               y: this.position.y
//           },
//           width: 100,
//           height: 10,
//           correctCropParameters: {
//               x: 0,
//               y: 0
//           }
//       };
//       this.isAttackingUpper = false;
//       this.isAttackingLower = false;
//       this.health = 100;
//       this.power = 0;
//       this.attackUpperDamage = 5;
//       this.attackLowerDamage = 10;
//       this.pushEffect = 200;
//       this.isJumping = false;
//       this.powerIncrement = 35;
//       this.blocking = false;
//       this.sprites = sprites;
//       this.currentAction = 'idle';
//       this.canAttackUpper = true; // Flag for upper attack cooldown
//       this.canAttackLower = true; // Flag for lower attack cooldown
//       for (const action in sprites) {
//           const sprite = sprites[action];
//           sprite.image = new Image();
//           sprite.image.src = sprite.imageSrc;
//           sprite.imageLoaded = false;
//           sprite.image.onload = () => {
//               sprite.imageLoaded = true;
//           };
//       }
//   }

//   setAction(action: string) {
//       if (this.currentAction === action) return;
//       this.currentAction = action;
//       const sprite = this.sprites[action];
//       this.image = sprite.image;
//       this.scale = sprite.scale;
//       this.framesMax = sprite.framesMax;
//       this.correctCropParameters = sprite.correctCropParameters;
//       this.framesCurrent = 0;
//       this.framesElapsed = 0;
//   }

//   attackingUpper() {
//       if (!this.canAttackUpper || this.blocking || this.isJumping) return; // Prevent attacking if in cooldown, blocking, or jumping
//       this.canAttackUpper = false; // Start cooldown
//       this.setAction('attackUpper');
//       this.isAttackingUpper = true;
//       setTimeout(() => {
//           this.isAttackingUpper = false;
//           if (this.currentAction === 'attackUpper') this.setAction('idle');
//       }, 800); // Increased duration for attack animation
//       setTimeout(() => {
//           this.canAttackUpper = true; // Reset cooldown after 5 seconds
//       }, 5000);
//   }

//   attackingLower() {
//       if (!this.canAttackLower || this.blocking || this.isJumping) return; // Prevent attacking if in cooldown, blocking, or jumping
//       this.canAttackLower = false; // Start cooldown
//       this.setAction('attackLower');
//       this.isAttackingLower = true;
//       setTimeout(() => {
//           this.isAttackingLower = false;
//           if (this.currentAction === 'attackLower') this.setAction('idle');
//       }, 800); // Increased duration for attack animation
//       setTimeout(() => {
//           this.canAttackLower = true; // Reset cooldown after 3 seconds
//       }, 3000);
//   }

//   applyUpperAttack(enemy: Character) {
//       enemy.health -= this.attackUpperDamage;
//       enemy.position.x += this.facingRight ? this.pushEffect : -this.pushEffect;
//       this.increasePower();
//   }

//   applyLowerAttack(enemy: Character) {
//       enemy.health -= this.attackLowerDamage;
//       this.increasePower();
//   }

//   increasePower() {
//       if (this.power < 100) {
//           this.power += this.powerIncrement;
//           if (this.power > 100) this.power = 100;
//           this.updatePowerBar();
//       }
//   }

//   updatePowerBar() {
//       const powerBar = document.querySelector(`.stats__power-bar--${this.sprite === 'player' ? 'player' : 'enemy'}`) as HTMLElement;
//       powerBar.style.width = this.power + '%';
//   }

//   update(ctx: CanvasRenderingContext2D) {
//       this.facingRight = this.position.x < (this === playerCharacter ? enemyCharacter.position.x : playerCharacter.position.x);
//       this.attackRange.position.x = this.facingRight ? this.position.x + this.width : this.position.x - this.attackRange.width;
//       this.attackRange.position.y = this.position.y;

//       this.drawCharacter(ctx);
//       this.framesElapsed++;
//       if (this.framesElapsed % this.framesHold === 0) {
//           if (this.framesCurrent < this.framesMax - 1) {
//               this.framesCurrent++;
//           } else {
//               this.framesCurrent = 0;
//           }
//       }

//       this.position.x += this.velocity.x;
//       this.position.y += this.velocity.y;

//       if (this.position.y + this.height >= ctx.canvas.height) {
//           this.position.y = ctx.canvas.height - this.height;
//           this.velocity.y = 0;
//           this.isJumping = false;
//       } else {
//           this.velocity.y += gravity;
//           if (this.isJumping) {
//               this.setAction('jump');
//           }
//       }
//   }
// }
