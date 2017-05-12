// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};



/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main = {
	//  properties
    WIDTH : 640, 
    HEIGHT: 480,
    canvas: undefined,
    ctx: undefined,
   	lastTime: 0, // used by calculateDeltaTime() 
    debug: true,
    CIRCLE_STATE:{NORMAL:0,EXPLODING:1,MAX_SIZE:2,IMPLODING:3,DONE:4},
    circles:[],
    numCircles:this.NUM_CIRCLES_START,
    paused: false,
    animation: 0,
    gameState: undefined,
    roundScore: 0,
    totalScore: 0,
    colors:["#fd5b78","#ff6037","#ff9966","#ffff66","#66ff66","#50bfe6","#ff6eff","#ee34d2"],
//    bgAudio: undefined,
//    effectAudio: undefined,
//    currentEffect:0,
//    currentDirection:1,
//    effectSounds:["1.mp3","2.mp3","3.mp3","4.mp3","5.mp3","6.mp3","7.mp3","8.mp3"],
    sound: undefined, //required-loaded by main.js
    CIRCLE: Object.freeze({
        NUM_CIRCLES_START:5,
        NUM_CIRCLES_END:20,
        START_RADIUS:8,
        MAX_RADIUS:45,
        MIN_RADIUS:2,
        MAX_LIFETIME:2.5,
        MAX_SPEED:80,
        EXPLOSION_SPEED:60,
        IMPLOSION_SPEED:84,
        NUM_LEVEL_INCREASE:3,
        PERCENT_CIRCLES_TO_ADVANCE: .35,
    }),
    
    GAME_STATE: Object.freeze({
        BEGIN:0,
        DEFAULT:1,
        EXPLODING:2,
        ROUND_OVER:3,
        REPEAT_LEVEL:4,
        END:5,
    }),
    
    // methods
	init : function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
        
        this.numCircles=this.CIRCLE.NUM_CIRCLES_START;
        this.circles=this.makeCircles(this.numCircles);
        console.log("this.circles= "+ this.circles);
        
        this.bgAudio = document.querySelector("#bgAudio");
        this.bgAudio.volume=0.25;
        this.effectAudio= document.querySelector("#effectAudio");
        this.effectAudio.volume=0.3;
        
        this.gameState=this.GAME_STATE.BEGIN;
        
        //hook up events
        this.canvas.onmousedown= this.doMousedown.bind(this);
        
        //load level
        this.reset();
		
		// start the game loop
		this.update();
	},
    
    //create a new level of circles
    reset: function(){
        this.numCircles+=5;
        this.roundScore=0;
        this.circles= this.makeCircles(this.numCircles);
        //console.log(this.numCircles);
    },
	
	update: function(){
		// 1) LOOP
		// schedule a call to update()
	 	this.animationID= requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) PAUSED?
	 	// if so, bail out of loop
        if(this.paused){
            this.drawPausedScreen(this.ctx);
            return;
        }
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
        
        //4)UPDATE
        //move circles
        this.moveCircles(dt);
        
        //CHECK FOR COLLISIONS
        this.checkForCollisions();
        
		// 5) DRAW	
		// i) draw background
		this.ctx.fillStyle = "black"; 
		this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT); 
	
	    //ii draw circles
        this.ctx.globalAlpha=.9;
        this.drawCircles(this.ctx);
        
		// iii) draw HUD
		this.ctx.globalAlpha=1.0;
        this.drawHUD(this.ctx);
		
		// iv) draw debug info
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText(this.ctx,"dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "white");
		}
        
        //CHECK FOR CHEATS
        //if we are on the start sren or a round over screen
        if(this.gameState==this.GAME_STATE.BEGIN || this.gameState==this.GAME_STATE.ROUND_OVER){
            if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] &&    myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT]){
                this.totalScore++;
                this.sound.playEffect();
            }
        }
	},
    
    doMousedown: function(e){
        this.sound.playBGAudio()
        
        //unpause on a click
        //just to make sure we never get stuckin a paused state
        if(this.paused){
            this.paused=false;
            this.update();
            return;
        }
        
        //you can only click one circle
        if(this.gameState==this.GAME_STATE.EXPLODING)return;
        
//        console.log("e="+e);
//        console.log("e.target="+e.target);
//        console.log("this="+this);
//        console.log("e.pageX="+e.pageX);
//        console.log("e.pageY="+e.pageY);
        
        //if round is over, reset and add 5 more circles
        if(this.gameState==this.GAME_STATE.ROUND_OVER){
            this.gameState=this.GAME_STATE.DEFAULT;
            this.reset();
            return;
        }
        
        //if game ended, reset total score, gamestate, and number of circles
        if(this.gameState==this.GAME_STATE.END){ 
            this.totalScore=0;
            this.numCircles=this.CIRCLE.NUM_CIRCLES_START;
            this.gameState=this.GAME_STATE.DEFAULT;
            this.reset();
            return;
        }
        
        if(this.gameState==this.GAME_STATE.REPEAT_LEVEL){ 
            this.numCircles-=5;
            this.gameState=this.GAME_STATE.DEFAULT;
            this.reset();
            return;
        }

        var mouse=getMouse(e);
        //console.log("(mouse.x,mouse.y)="+mouse.x+","+mouse.y);

        //have to call through app.main because this=canvas
        this.checkCircleClicked(mouse);
    },
	
	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
	calculateDeltaTime: function(){
		var now,fps;
		now = performance.now(); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
    
    circleHitLeftRight: function(c){
        if(c.x < c.radius || c.x >this.WIDTH-c.radius){
            return true;
        }
    },
    
     circleHitTopBottom: function(c){
        if(c.y < c.radius || c.y >this.HEIGHT-c.radius){
            return true;
        }
    },
    
    drawCircles: function(ctx){
        if(this.gameState==this.GAME_STATE.ROUND_OVER) this.ctx.globalAlpha=0.25;
        for(var i=0;i<this.circles.length;i++){
            var c=this.circles[i];
            c.draw(ctx);
            //console.log("drawing circles i="+ i);
        }
        
        if(this.gameState==this.GAME_STATE.END) this.ctx.globalAlpha=0.1;
        for(var i=0;i<this.circles.length;i++){
            var c=this.circles[i];
            c.draw(ctx);
            //console.log("drawing circles i="+ i);
        }
        
        if(this.gameState==this.GAME_STATE.REPEAT_LEVEL) this.ctx.globalAlpha=0.25;
        for(var i=0;i<this.circles.length;i++){
            var c=this.circles[i];
            c.draw(ctx);
            //console.log("drawing circles i="+ i);
        }
    },
    
    moveCircles: function(dt){
        for(var i=0;i<this.circles.length;i++){
            var c=this.circles[i];
            if(c.state===this.CIRCLE_STATE.DONE) continue;
            if(c.state===this.CIRCLE_STATE.EXPLODING){
                c.radius+=this.CIRCLE.EXPLOSION_SPEED*dt;
                    if(c.radius>=this.CIRCLE.MAX_RADIUS){
                        c.state=this.CIRCLE_STATE.MAX_SIZE;
                        console.log("circle #" + i + " hit Circle.MAX_RADIUS");
                    }
                continue;
            } 
        
        
        if(c.state==this.CIRCLE_STATE.MAX_SIZE){
            c.lifetime+=dt;//lifetime is in seconds
            if(c.lifetime>=this.CIRCLE.MAX_LIFETIME){
                c.state=this.CIRCLE_STATE.IMPLODING;
                console.log("circle #"+ i+ " hit CIRCLE.MAX_LIFETIME");
            }
            continue;
        }
        
        if(c.state==this.CIRCLE_STATE.IMPLODING){
            c.radius-=this.CIRCLE.IMPLOSION_SPEED*dt;
            if(c.radius<=this.CIRCLE.MIN_RADIUS){
                console.log("circle #"+ i+ " hit CIRCLE.MIN_RADIUS and is gone");
                c.state=this.CIRCLE_STATE.DONE;
            }
        }
                
            //move circles
            c.move(dt);
            
            //did circles leave screen?
            if(this.circleHitLeftRight(c)){
                c.xSpeed*=-1;
                c.move(dt); //an extra move
            } 
            if(this.circleHitTopBottom(c)){
               c.ySpeed*=-1;
                c.move(dt); //an extra move
            } 
        }//end for loop
    },
        
    drawPausedScreen: function(ctx){
        ctx.save();
        ctx.fillStyle="black";
        ctx.fillRect(0,0, this.WIDTH, this.HEIGHT);
        ctx.textAlign= "center";
        ctx.textBaseline="middle";
        this.fillText(this.ctx,"...PAUSED...", this.WIDTH/2, this.HEIGHT/2, "40pt courier", "white");
        ctx.restore();
    },

    makeCircles: function(num){
        var circleMove= function(dt){
            this.x +=this.xSpeed*this.speed*dt;
            this.y +=this.ySpeed*this.speed*dt;
        };
        
        var circleDraw=function(ctx){
            //draw circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
            ctx.closePath();
            ctx.fillStyle= this.fillStyle;
            ctx.fill();
            ctx.restore();
        };   

        var array=[];
        debugger;
        for(var i=0; i<num;i++){
            //make a new object literal
            var c={};

            //add .x and .y properties
            //.x and .y are somewhere on the canvas, with minimum margin of START_RAdius
            //getRandom() is from utilities.js
            c.x=getRandom(this.CIRCLE.START_RADIUS*2, this.WIDTH-this.CIRCLE.START_RADIUS*2);
            c.y=getRandom(this.CIRCLE.START_RADIUS*2, this.HEIGHT-this.CIRCLE.START_RADIUS*2);

            //add radius property
            c.radius= this.CIRCLE.START_RADIUS;

            //getRandomUnitVector() is form utilities.js
            var randomVector=getRandomUnitVector();
            c.xSpeed= randomVector.x;
            c.ySpeed= randomVector.y;

            //make more properties
            c.speed= this.CIRCLE.MAX_SPEED;
            c.fillStyle= this.colors[i % this.colors.length];
            c.state=this.CIRCLE_STATE.NORMAL;
            c.lifetime=0;
            c.draw= circleDraw;
            c.move=circleMove;

            //no more properties can be added!
            Object.seal(c);
            array.push(c);
        }
        return array;
    },
    
    checkCircleClicked: function(mouse){
    //looping through circle array backwards
        for(var i=this.circles.length-1; i>=0; i--){
            var c= this.circles[i];
            
            if(pointInsideCircle(mouse.x,mouse.y, c)){
                
                c.xSpeed=c.ySpeed=0;
                this.sound.playEffect();
                c.state=this.CIRCLE_STATE.EXPLODING;
                this.gameState=this.GAME_STATE.EXPLODING;
                this.roundScore++;
                break; //we want to click only one circle
            }
        }
    },
    
    checkForCollisions: function(){
        if(this.gameState==this.GAME_STATE.EXPLODING){
           //checek for collisions between circles
           for(var i=0; i<this.circles.length; i++){
                var c1=this.circles[i];
               //only check for collisions if c1 is exploding
               if(c1.state===this.CIRCLE_STATE.NORMAL) continue;
               if(c1.state===this.CIRCLE_STATE.DONE) continue;
               
               for(var j=0;j<this.circles.length; j++){
                   var c2=this.circles[j];
                   
                   //don't check for collisions if c2 is the same circle
                   if(c1===c2) continue;
                   //don't check for collisions if c2 is alread exploding
                   if(c2.state !=this.CIRCLE_STATE.NORMAL) continue;
                   if(c2.state ===this.CIRCLE_STATE.DONE) continue;
                   
                   //now you finally can check for a collision
                   if(circlesIntersect(c1,c2)){
                       this.sound.playEffect();
                       c2.state=this.CIRCLE_STATE.EXPLODING;
                       c2.xSpeed=c2.ySpeed=0;
                       this.roundScore++;
                   }
               }
           }//end for
            
            //round over?
            var isOver=true;
            for(var i=0; i<this.circles.length; i++){
                var c=this.circles[i];
                if(c.state !=this.CIRCLE_STATE.NORMAL && c.state !=this.CIRCLE_STATE.DONE){
                    isOver=false;
                    break;
                }
            }//end for
            
            if(isOver){
                
                //if number of circles has reached max number of circles
                if(this.numCircles ==this.CIRCLE.NUM_CIRCLES_END){
                     this.gameState=this.GAME_STATE.END;
                }
                
                //if the level is over
                if(this.roundScore < Math.floor(this.numCircles*this.CIRCLE.PERCENT_CIRCLES_TO_ADVANCE)){
                    this.gameState=this.GAME_STATE.REPEAT_LEVEL;
                    this.totalScore-=this.roundScore;
                }
                
                //else continue to the next round
                if(this.roundScore >= Math.floor(this.numCircles*this.CIRCLE.PERCENT_CIRCLES_TO_ADVANCE) && this.numCircles !==this.CIRCLE.NUM_CIRCLES_END){
                    this.gameState=this.GAME_STATE.ROUND_OVER;
                }
                
                this.totalScore+=this.roundScore;
                this.stopBGAudio();
            }
       }//end if GAME_STATE_EXPLODING
    },

    drawHUD: function(ctx){
        var goal= Math.floor(this.numCircles*this.CIRCLE.PERCENT_CIRCLES_TO_ADVANCE);
        var nextGoal=Math.floor((this.numCircles+5)*this.CIRCLE.PERCENT_CIRCLES_TO_ADVANCE);
        console.log("Goal: "+goal);
        
        ctx.save();//NEW
        //draw score
        //fillText(string,x,y,css,color)
        this.fillText(this.ctx,"This Round: " + this.roundScore + " of " + this.numCircles,20,20, "14pt Courier", "#ddd");
        this.fillText(this.ctx,"Total Score: " + this.totalScore, this.WIDTH-200,20, "14pt Courier", "#ddd");
        this.fillText(this.ctx,"Goal: " + goal+ " circles",20,40, "14pt Courier", "#ddd");
        
        //NEW
        if(this.gameState==this.GAME_STATE.BEGIN){
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            this.fillText(this.ctx,"To begin, click a circle", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "white");
        }//end if
        
        //NEW
        if(this.gameState==this.GAME_STATE.ROUND_OVER){
            ctx.save();
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            this.fillText(this.ctx,"Round Over", this.WIDTH/2, this.HEIGHT/2-40, "30pt courier", "red");
            this.fillText(this.ctx,"Click to continue", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "red");

            //this.fillText(this.ctx,"Next round there are " + (this.numCircles+5) + " circles", this.WIDTH/2, this.HEIGHT/2+40, "20pt courier", "white");
            
            this.fillText(this.ctx,"Goal next round: " + nextGoal+ " of "+ (this.numCircles+5) + " circles", this.WIDTH/2, this.HEIGHT/2+40, "20pt courier", "white");
        }//end if
        
        //NEW
        if(this.gameState==this.GAME_STATE.END){
            ctx.save();
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            this.fillText(this.ctx,"Game Over", this.WIDTH/2, this.HEIGHT/2-40, "40pt courier", "white");
            this.fillText(this.ctx,"Your final score was " + this.totalScore, this.WIDTH/2, this.HEIGHT/2+5, "20pt courier", "red");
            this.fillText(this.ctx,"Click to play again", this.WIDTH/2, this.HEIGHT/2+40, "15pt courier", "white");
        }//end if
        
        //NEW
        if(this.gameState==this.GAME_STATE.REPEAT_LEVEL){
            ctx.save();
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            this.fillText(this.ctx,"You missed the goal of " + goal, this.WIDTH/2, this.HEIGHT/2-40, "20pt courier", "white");
            this.fillText(this.ctx,"Click to continue" , this.WIDTH/2, this.HEIGHT/2+5, "25pt courier", "red");
            this.fillText(this.ctx,"Goal: " + goal + " of " + this.numCircles, this.WIDTH/2, this.HEIGHT/2+40, "20pt courier", "white");
        }//end if
        
        
        ctx.restore();
    },
    
    pauseGame: function(){
        this.paused=true;
        this.stopBGAudio();
        
        //stop the animation loop
        cancelAnimationFrame(this.animationID);
        //call update() once so that our pasused screen gets drawn
        this.update();
    },
    
    resumeGame: function(){
        //stop the animation loop, just in case it's running
        cancelAnimationFrame(this.animationID);
        
        this.paused=false;
        
        this.sound.playBGAudio();
        //restart the loop
        this.update();
    },
    
    stopBGAudio: function(){
        //this.bgAudio.pause();
        //this.bgAudio.currentTime=0;
        this.sound.stopBGAudio()
    },
    
    playEffect: function(){
        this.effectAudio.src = "media/" + this.effectSounds[this.currentEffect];
        this.effectAudio.play();
        
        this.currentEffect+=this.currentDirection;
        if(this.currentEffect==this.effectSounds.length || this.currentEffect==-1){
            this.currentDirection *=-1;
            this.currentEffect+=this.currentDirection;
        }
    },
    
    toggleDebug(){
        if(this.debug==true){
            this.debug=false;
        }
        else{
            this.debug=true;
        }
    }
}; // end app.main