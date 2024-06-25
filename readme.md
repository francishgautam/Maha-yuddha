# Maha Yuddha

## Project Description
The project aims to develop a simple 2D fighting game using HTML canvas, CSS for styling, and JavaScript for game logic. The game will include a start screen, character selection, level selection, and gameplay mechanics.

## Functional Requirements
1. **Create a 2D fighting game with basic fighting mechanics**
   - Basic fighting parameters: attack, crouch, jump, and movement mechanics
   - Health system to win the game
   - Interactive bot that plays with you
2. **Create interactive game layout and audio mechanics**
   - Interactive character selection and level selection
   - Start game screen, loading game screen (lore screen), and gameplay screen
   - Distinct audio overlay

## Additional Features
- Distinct power-up mechanism for the characters
- Push mechanism that sends the enemy beyond the boundary to win the game (adding collision)

## Technologies
- HTML
- CSS
- TypeScript
- Vite

## Instructions
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.y
4. Open your browser and navigate to `http://localhost:5173`.

Enjoy playing Maha Yuddha!

How to play?

The goal is to send the other player out of the boundary or reduce their health to zero.

Keys:-

For player one:-
a and d  for movement for player one
w for jump
s for block
t for heavy attack
y for light attack 
f for special move


left right for movement for player two
left and right for movement
up for jump
down for block
k for heavy attack
l for light attack 
f for special move




Features:- 
you cannot attack while jumping or crouching
heavy attack pushes the enemy away but does less damage than light attack
power up bar can only be used when it is full


Power up:-
Luffy - Reduce the enemy power bar by zero , quickly teleports to the enemy position\
Zoro - attack damage increase
Smoker - Push effect increase for heavy attack
Hancock - Self healing, increase to full health

Press space to pause the game
If you want to play with bot, leave the second player selection 
