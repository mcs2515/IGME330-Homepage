"use strict"
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

app.main = {
   //properties for canvas
    canvas: undefined,
    ctx: undefined,
    WIDTH: 1000,
    HEIGHT: 600,
    animationID: 0,
    time: 0,
    lastTime: 0,
    dt: 1/60.0,
    dragging:false,
    gameState: undefined,
    paused: false,
    background:undefined, 
    pattern:undefined,
    backgroundSpeed:0,
    totalScore: 0,
    enemies: [],
    //modules
    myKeys:undefined,
    Emitter:undefined,
    exhaust:undefined,
    sound: undefined,
    titleImage: undefined,
    
    //objects
    BIRD: function(){
        this.imageFile= undefined,
        this.width= 0,
        this.height=0,
        this.x= -80,
        this.y= 0,
        this.RADIUS= 75,
        this.velX= 25,
        this.velY=25,
        this.attacked= false,
        this.OFFSCREENX= 250,
        
        //variables to animate bird 
        this.frameIndex=0,
        this.tickCount=0,
        this.ticksPerFrame=4,
        this.numberOfFrames=8,
        //function that animates bird
        this.animate= function(ctx){
            ctx.drawImage(
                this.imageFile, //image file to draw
                this.frameIndex * this.width/this.numberOfFrames, //sx
                0, //sy
                this.width/this.numberOfFrames, //frame width
                150, //frame Height
                this.x-((this.width/2)/this.numberOfFrames)+30,  //destination x
                this.y-this.height/2,  //destination y
                this.width/this.numberOfFrames,
                150);
            
            this.tickCount +=1;
            
            //stay on each frame for 4 ticks
            if(this.tickCount >this.ticksPerFrame){
                this.tickCount =0;
                
                if(this.frameIndex <this.numberOfFrames-1){
                //go to the next frame
                this.frameIndex +=1;
                }
                //reset frame once we recahed last frame
                else{
                    this.frameIndex =0;
                }
            }
        }
    },
    
    //caterpillar object
    HEAD: Object.seal({
        imageFile: undefined,
        width: 0,
        height:0,
        x: 200,
        y: 100,      
        previousX: 0,
        previousY: 0,
        RADIUS: 30,
        health: 10,
        MAX_ENERGY: 200,
        energy:0,
        prevEnergy:0,
        speed: 0,
        NORM_SPEED:35,
        RUN_SPEED: 100,
        //head manages an array of body objects
        NUM_START_BODIES: 2,
        bodies: [],
    }),
    
    //function constructor for each body piece of caterpillar
    BODY: function(){
        this.imageFile=undefined;
        this.width= 0;
        this.height=0;
        this.x= 0;
        this.y= 0;
        this.previousX= 0;
        this.previousY= 0;
        this.RADIUS=25;
    },
    
    //leave object
    LEAF: Object.seal({
        imageFile:undefined,
        width: 0,
        height:0,
        x: 200,
        y: 300,
        RADIUS: 30,
    }),

    //game states
    GAME_STATE: Object.freeze({
        START:0,
        PLAY:1,
        END:2,
    }),

    init: function(){
        //console.log("app.main.init() called");
        // initialize properties
        this.canvas = document.querySelector('canvas');
        this.canvas.width = this.WIDTH;
        this.canvas.height = this.HEIGHT;
        this.ctx = this.canvas.getContext('2d');
        this.dt = calculateDeltaTime(this.lastTime);
        
        this.bgAudio = document.querySelector("#bgAudio");
        this.bgAudio.volume=0.25;
        this.effectAudio= document.querySelector("#effectAudio");
        this.effectAudio.volume=0.3;
       
        this.HEAD.imageFile= document.querySelector("#head");
        this.LEAF.imageFile= document.querySelector("#food");
        this.BODY.imageFile= document.querySelector("#body");
        this.titleImage= document.querySelector("#title");
        
        this.canvas.onmousedown= this.doMousedown.bind(this);
        this.canvas.addEventListener("mousemove", this.followMouse.bind(this)),
        document.querySelector("#button1").onmousedown = function(){
            this.resetGame();
            this.gameState=this.GAME_STATE.PLAY;
            this.sound.playBGAudio();
            
        }.bind(this);
            
        this.setUpImage(this.HEAD);
        this.setUpImage(this.LEAF);
        this.setUpImage(this.BODY);
        

        this.background = document.querySelector("#grass");
        this.pattern = this.ctx.createPattern(this.background,"repeat");
        
        
        //seeting up particles
        this.exhaust=new this.Emitter();
        this.exhaust.numParticles=100;
        this.exhaust.red=255;
        this.exhaust.green=240;
        this.exhaust.blue=51;
        
        this.gameState=this.GAME_STATE.START;
        
        this.ctx.globalAlpha=1.0;

        this.update();
    },


    update: function(){
        //LOOP
        // schedule a call to update()
        this.animationID = requestAnimationFrame(this.update.bind(this));
        
        //PAUSED?
	 	// if so, bail out of loop
        if(this.paused){
            if(this.gameState !=this.GAME_STATE.END && this.gameState !=this.GAME_STATE.START){
                this.drawPausedScreen(this.ctx);
                return;
            }
        }
        this.ctx.clearRect(0,0,this.WIDTH,this.HEIGHT);
        
        //this.dt = calculateDeltaTime(this.lastTime);
        
        //ONLY IN PLAY STATE DO...
        if(this.gameState == this.GAME_STATE.PLAY){
            //this.ctx.clearRect(0, 0, this.ctx.WIDTH, this.ctx.HEIGHT);
            
            //CLEAR CANVAS
            this.ctx.save();
            this.ctx.rect(0,0,this.WIDTH,this.HEIGHT);
            this.ctx.fillStyle=this.pattern;
            this.ctx.fill();
            this.ctx.restore();
            
            //DRAW
            //pan background image
            this.panningImages();
            //draw the particles
            this.exhaust.updateAndDraw(this.ctx, {x:this.LEAF.x-30,y:this.LEAF.y});
            //draw the leaf
            this.ctx.drawImage(this.LEAF.imageFile,this.LEAF.x -this.LEAF.width/2, this.LEAF.y-this.LEAF.height/2);
            
            //draw the bodies
            for(var i =this.HEAD.bodies.length-1; i >=0; i--){
                this.ctx.drawImage(this.BODY.imageFile,this.HEAD.bodies[i].x-this.HEAD.width/2,this.HEAD.bodies[i].y-this.HEAD.height/2);
            }
            
            //draw the head
            this.ctx.drawImage(this.HEAD.imageFile, this.HEAD.x-this.HEAD.width/2, this.HEAD.y-this.HEAD.height/2);
            
            //draw the birds
            for(var i=0; i<this.enemies.length; i++){
                this.enemies[i].animate(this.ctx);
            }
            
            
            //UPDATE MOUSE POSITION AND FOLLOW IT
            this.moveCaterpillar();
            this.followMouse.bind(this);
            this.followLeader();
            this.followBug();
            
            //CHECK FOR COLLISION
            this.checkForCollisions();
            
            if(this.debug){
                //DRAW WHERE THE COLLISION IS IN COMPARISON TO THE IMAGE
                this.ctx.save();
                this.ctx.strokeStyle = "red";
                this.ctx.beginPath();
                this.ctx.arc(this.BIRD.x,this.BIRD.y,this.BIRD.RADIUS, 0, 2*Math.PI);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.arc(this.HEAD.x,this.HEAD.y,this.HEAD.RADIUS, 0, 2*Math.PI);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.arc(this.LEAF.x,this.LEAF.y,this.LEAF.RADIUS, 0, 2*Math.PI);
                this.ctx.stroke();


                for(var i=0; i<this.HEAD.bodies.length;i++){
                    this.ctx.beginPath();
                    this.ctx.arc(this.HEAD.bodies[i].x,this.HEAD.bodies[i].y,this.HEAD.bodies[i].RADIUS, 0, 2*Math.PI);
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }
        }
   
        this.globalAlpha = 1.0;
        
        //DRAW GUD
        this.drawHUD(this.ctx);

    },
    

   //---KEY INPUTS-------------------------------------------------------------------------------------------------------
   //checks for key input to move caterpillar
   moveCaterpillar:function(){
        
        this.HEAD.previousX = this.HEAD.x;
        this.HEAD.previousY = this.HEAD.y;

        // adjusts coordinates of mouse over the window, to local mouse coordinates over the canvas
        if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_LEFT]){
            if(this.HEAD.x > this.HEAD.width/2){
                this.HEAD.x -= this.HEAD.speed * this.dt;  
            }
        }

        if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_RIGHT]){
            if(this.HEAD.x < this.WIDTH-this.HEAD.width/2){
                this.HEAD.x += this.HEAD.speed * this.dt;
            }
        }


        if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_UP]){
            if(this.HEAD.y > this.HEAD.height/2){
                this.HEAD.y -= this.HEAD.speed * this.dt;
            }
        }

        if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_DOWN]){
            if(this.HEAD.y < this.HEIGHT-this.HEAD.height/2){
                this.HEAD.y += this.HEAD.speed * this.dt;
            }
        }
       
       if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_SHIFT]){    
           if(this.HEAD.energy >=1){
                this.HEAD.speed=this.HEAD.RUN_SPEED;
                this.HEAD.energy--;
           }
           else{
               this.HEAD.speed=this.HEAD.NORM_SPEED;
           }
       }
       
    },
    
    
    //---OBJECT BEHAVIORS-----------------------------------------------------------------------------------------------------
    //head will constantly follow the mouse
    followMouse:function(e){
        var mouse=getMouse(e);
        
        this.HEAD.previousX = this.HEAD.x;
        this.HEAD.previousY = this.HEAD.y;
        
//        var dx= this.HEAD.x - mouse.x;
//        var dy= this.HEAD.y - mouse.y;
//        //attack angle
//        var angle = Math.tan(dy/dx);
//        //determine the bird's velocity
//        var vx = this.HEAD.SPEED * Math.cos(angle);
//        var vy = this.HEAD.SPEED * Math.sin(angle);
//        //move the bird towards bug
//        this.HEAD.x +=vx;
//        this.HEAD.y +=vy;
       
        // adjusts coordinates of mouse over the window, to local mouse coordinates over the canvas
        this.HEAD.x = mouse.x;
        this.HEAD.y = mouse.y;
    },
    
    //array of body objects will follow the head of the caterpiller
    followLeader: function(){
        
        this.HEAD.bodies[0].previousX = this.HEAD.bodies[0].x;
        this.HEAD.bodies[0].previousY = this.HEAD.bodies[0].y;
        this.HEAD.bodies[0].x = this.HEAD.previousX-this.HEAD.width/2;
        this.HEAD.bodies[0].y = this.HEAD.previousY;
        
        
        //have body i follow the last body's coordinates
        for(var i = this.HEAD.bodies.length-1 ; i >0; i--){
            this.HEAD.bodies[i].previousX = this.HEAD.bodies[i].x;
            this.HEAD.bodies[i].previousY = this.HEAD.bodies[i].y;

            this.HEAD.bodies[i].x = this.HEAD.bodies[i-1].previousX-this.BODY.width/2;
            this.HEAD.bodies[i].y = this.HEAD.bodies[i-1].previousY;
        }
         //console.log("i: "+ i+ " x: "+ this.HEAD.bodies[i].x + " y: " + this.HEAD.bodies[i].y);
    },
    
    //bird objs will seek bug 
    followBug: function(){
        for(var i=0; i<this.enemies.length; i++){      
            //if the bird hasn't taken a bite yet
            if(this.enemies[i].attacked == false){
                //have bird follow catterpillar
                var dx= this.HEAD.x - this.enemies[i].x
                var dy= this.HEAD.y - this.enemies[i].y
                //attack angle
                var angle = Math.tan(dy/dx);
                //determine the bird's velocity
                var vx = this.enemies[i].velX * Math.cos(angle);
                var vy = this.enemies[i].velY * Math.sin(angle);
                //move the bird towards bug
                this.enemies[i].x -=vx*this.dt;
                this.enemies[i].y -=vy*this.dt;
            }
            //increase birds speed to go offscreen
            else{
                this.enemies[i].x -= this.enemies[i].velX*5*this.dt;
                //show that the bird has a body piece in mouth
                this.ctx.drawImage(this.BODY.imageFile,this.enemies[i].x-100,this.enemies[i].y)
            }

            //if bird goes offscreen, reset its position
            if(this.enemies[i].x < -this.enemies[i].OFFSCREENX){
                this.resetBird(i);
            }
        }
    },
    
    //---OBJECT CREATIONS-----------------------------------------------------------------------------------------------------
    //function that creates new bird objects
    addBirds:function(){
        var newBird= new this.BIRD;
        
        newBird.imageFile = document.querySelector("#bird");   
        this.setUpImage(newBird);
        newBird.x = this.WIDTH+newBird.OFFSCREENX;
        newBird.y = getRandom(30, this.HEIGHT-30);
        newBird.attacked=false;
        this.enemies.push(newBird);
    },
    
    //function that creates new body objects
    addBodies: function(){ 
        var newBody = new this.BODY;
        
        if(this.HEAD.bodies.length==0){
            newBody.x = this.HEAD.previousX;
            newBody.y = this.HEAD.previousY;
            
        }
        else{
        
            newBody.x = this.HEAD.bodies[this.HEAD.bodies.length-1];
            newBody.y = this.HEAD.bodies[this.HEAD.bodies.length-1];
        }
        
        newBody.previousX= newBody.x;
        newBody.previousY= newBody.y;

        this.HEAD.bodies.push(newBody);
    },
    
    //---RESETTING THINGS-----------------------------------------------------------------------------------------------------
    resetBird: function(i){ 
            this.enemies[i].x = this.WIDTH+this.enemies[i].OFFSCREENX;
            this.enemies[i].y = getRandom(30, this.HEIGHT-30);
            this.enemies[i].attacked=false;
    },
    
    resetLeaf: function(){
        this.LEAF.x = this.LEAF.RADIUS+this.WIDTH+30;
        this.LEAF.y = getRandom(this.LEAF.RADIUS, this.HEIGHT-this.LEAF.RADIUS);
    },
    
    resetGame: function(){
        this.totalScore=0;
        this.HEAD.prevEnergy=0;
        this.HEAD.energy=0;
        this.resetLeaf();
        this.exhaust.createParticles({x:this.LEAF.x-10,y:this.LEAF.y});
        this.HEAD.speed = this.HEAD.NORM_SPEED;
        
        for(var i = 0; i<=this.HEAD.bodies.length; i++){
            this.HEAD.bodies.pop();
        }
        
         for(var i=0; i<=this.enemies.length; i++){
             this.enemies.pop();
         }

    
        for(var i = 0; i< this.HEAD.NUM_START_BODIES; i++){
            this.addBodies();
        }
    },
    
    //-----COLLISION DECTECTION-----------------------------------------------------------------------------------------------------
    //check collisions between several game objects
    checkForCollisions: function(){
        //check collision for caterpiller head and leaf objectf
        if(circlesIntersect(this.HEAD,this.LEAF)){
            this.addBodies(); //add onto the caterpillar
            this.resetLeaf(); //reset the leaf position
            this.addBirds();  //create another enemy
            this.sound.playEatingEffect(); //play the eating sound effect
            //increase the total score
            this.totalScore+=Math.floor(this.HEAD.bodies.length *1.05); 
            //increase the caterpillar's energy
            if(this.HEAD.energy < this.HEAD.MAX_ENERGY){
                this.HEAD.energy += 20; 
            }
        }


        //check collision for caterpiller head and bird objects
        for(var i=0; i<this.enemies.length; i++){
            if(circlesIntersect(this.HEAD,this.enemies[i])){
                //make sure the bird hasn't eaten yet
                if(this.enemies[i].attacked===false){
                    this.HEAD.bodies.pop(); //remove a body piece from caterpillar
                    this.enemies[i].attacked=true; //make sure that the bird can't get seconds
                    this.sound.playDamageEffect(); //play the damage sound effect
                }
            }
        }
        
        //check collision for caterpillar body objects and bird objects     
            for(var k=0; k<this.enemies.length; k++){ //for every enemy on screen
                 for(var i=0; i<this.HEAD.bodies.length-1; i++){ //for every body the caterpillar has
                    if(circlesIntersect(this.HEAD.bodies[i],this.enemies[k])){
                        //make sure the bird hasn't eaten yet
                        if(this.enemies[k].attacked===false){
                            this.HEAD.bodies.pop(); //remove a body piece from caterpillar
                            this.enemies[k].attacked=true; //make sure that the bird can't get seconds
                            this.sound.playDamageEffect(); //play the damage sound effect
                        }
                    }
                }   
        }
        
        //change game state if player loses too many bodies
        if(this.HEAD.bodies.length <2){
            this.gameState = this.GAME_STATE.END;
        }  
    },
    
    //----HUD STUFF----------------------------------------------------------------------------------------------------------------
    //draws different texts to screen depending on what state the game is in
    drawHUD: function(ctx){
        ctx.save();
        
        //fillText(string,x,y,css,color)
        //DRAW SCORE
        ctx.save();
        ctx.shadowColor = "#000"
        ctx.shadowOffsetX= 2;
        ctx.shadowOffsetY= 2;
        this.fillText(ctx,"Total Calories: " + this.totalScore, this.WIDTH-300,30, "19pt Itim", "#ddd");
        //HIDE BUTTON
         document.querySelector("#button1").style.display="none";
        
        this.fillText(ctx,"Energy:", 90,30, "18pt Itim", "#ddd");
        ctx.restore();
        
        //energy bar
        ctx.fillStyle = "red";
        //give the bar some kind of growing animation
        if(this.HEAD.prevEnergy <this.HEAD.energy && this.HEAD.energy <this.HEAD.MAX_ENERGY){
            this.HEAD.prevEnergy=this.HEAD.prevEnergy + 0.2;
        }
        else{
            this.HEAD.prevEnergy = this.HEAD.energy;
        }
        
        //draw the energy bar
        ctx.fillRect(180, 15, this.HEAD.prevEnergy, 20);
        ctx.beginPath();
        ctx.rect(180, 15, this.HEAD.MAX_ENERGY, 20);
        ctx.stroke();

        //show the start menu screen with title and clickable button
        if(this.gameState==this.GAME_STATE.START){
//            ctx.fillStyle="green";
//            ctx.rect(0,0,this.WIDTH,this.HEIGHT);
//            ctx.fill();
            ctx.drawImage(this.titleImage,0,0, this.WIDTH, this.HEIGHT);
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            this.fillText(ctx,"I Like to Eat Too!!", this.WIDTH/2, this.HEIGHT/2, "50pt Itim", "white"); 
            document.querySelector("#button1").style.display="inline";
            this.fillText(ctx,"By: Megan C. Smith", 90, this.HEIGHT-15, "8pt Montserrat", "white");
            this.fillText(ctx,"November 2016", this.WIDTH-90, this.HEIGHT-15, "8pt Montserrat", "white");

        }//end if
        
        //let user know that the game has ended and allow for restart with clickable button
        if(this.gameState==this.GAME_STATE.END){
            this.resetGame();
            this.stopBGAudio();
            ctx.save();
            ctx.fillStyle="black";
            ctx.fillRect(0,0, this.WIDTH, this.HEIGHT);
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            this.fillText(ctx,"GAME OVER.", this.WIDTH/2, this.HEIGHT/2-40, "50pt Itim", "red");
            this.fillText(ctx,"You were instead, eaten by the birdies.", this.WIDTH/2, this.HEIGHT/2+10, "18pt Itim", "red");
            document.querySelector("#button1").style.display="inline";
        }//end if
        
        ctx.restore();
    },
    
    //helper method to make drawing text to screen easier and less line of code
    fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
    
    //let user know that the game has been paused
    drawPausedScreen: function(ctx){
        ctx.save();
        ctx.fillStyle="black";
        ctx.fillRect(0,0, this.WIDTH, this.HEIGHT);
        ctx.textAlign= "center";
        ctx.textBaseline="middle";
        this.fillText(this.ctx,"...PAUSED...", this.WIDTH/2, this.HEIGHT/2, "40pt Montserrat", "white");
        ctx.restore();
        document.querySelector("#button1").style.display="none";
    },
    
    //pauses the game when user is not on the window browser
    pauseGame: function(){
        this.paused=true;
        this.stopBGAudio();
        
        //stop the animation loop
        cancelAnimationFrame(this.animationID);
        //call update() once so that our pasused screen gets drawn
        this.update();
    },
    
    //resumes the game when user is on the window browser
    resumeGame: function(){
        //stop the animation loop, just in case it's running
        cancelAnimationFrame(this.animationID);
        
        this.paused=false;
        
        this.sound.playBGAudio();
        //restart the loop
        this.update();
    },

    
 
//    //-------AUDIO STUFF--------------------------------------------------------------------------------------------------------
    stopBGAudio: function(){
        this.sound.stopBGAudio()
    },
    
    
    //---------HELPER METHODS-------------------------------------------------------------------------------------------------------
    toggleDebug: function(){
        if(this.debug == false){
            this.debug = true;
        }
        else{
            this.debug = false;
        }
    },
    
     doMousedown: function(e){
         var mouse=getMouse(e);
         
        //unpause on a click
        //just to make sure we never get stuckin a paused state
        if(this.paused){
            this.paused=false;
            this.update();
            return;
        }
     }, 
    
    panningImages: function() {
        this.LEAF.x=this.LEAF.x-.5;
        
        if(this.LEAF.x <0){
            this.resetLeaf();
        }
        
        this.backgroundSpeed--;
        this.ctx.save();
        this.ctx.translate(this.backgroundSpeed/2,0);
        this.ctx.rect(this.backgroundSpeed,0,this.WIDTH,this.HEIGHT);
        this.ctx.fillStyle=this.pattern;
        this.ctx.fill();
        this.ctx.restore();
    },
    
    //just sets up the ibjects width and height based on the size of the image file
    setUpImage: function(object){
        object.width= object.imageFile.width;
        object.height= object.imageFile.height;
    },
    
    

}