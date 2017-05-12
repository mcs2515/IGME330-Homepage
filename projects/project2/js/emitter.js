// emitter.js
// author: Tony Jefferson
// last modified: 10/7/2015

"use strict";
var app = app || {};

app.Emitter=function(){

	function Emitter(){
		// public
		this.numParticles = 5;
		this.useCircles = true;
		this.useSquares = false;
		this.xRange = 10;
		this.yRange = 0;
		this.minXspeed = -1;
		this.maxXspeed = 1;
		this.minYspeed = 2;
		this.maxYspeed = 4;
		this.startRadius = 1;
		this.expansionRate = 0.005;
		this.decayRate = 1;
		this.lifetime = 150;
		this.red = 0;
		this.green = 0;
		this.blue = 0;
		
		// private
		this._particles = undefined;
	};
	
	
	// "public" methods
	var p=Emitter.prototype;
	
	p.createParticles = function(emitterPoint){
		// initialize particle array
		this._particles = [];
				
		// create exhaust particles
		for(var i=0; i< this.numParticles; i++){
			// create a particle object and add to array
			var p = {};
			this._particles.push(_initParticle(this, p, emitterPoint));
		}

		// log the particles
		//console.log(this._particles );
	};
	
	p.updateAndDraw = function(ctx, emitterPoint){
			/* move and draw particles */
			// each frame, loop through particles array
			// move each particle down screen, and slightly left or right
			// make it bigger, and fade it out
			// increase its age so we know when to recycle it
			
			for(var i=0;i<this._particles.length;i++){
				var p = this._particles[i];
							
				p.age += this.decayRate;
				p.r += this.expansionRate;
				p.x += p.xSpeed/5;
				p.y += p.ySpeed;
				var alpha = 1.5 - p.age/this.lifetime;
				
				if(this.useSquares){
					// fill a rectangle	
					ctx.fillStyle = "rgba(" + this.red + "," + this.green + "," + 			
					this.blue + "," + alpha + ")"; 
					ctx.fillRect(p.x, p.y, p.r, p.r);
					// note: this code is easily modified to draw images
				}
				
				if(this.useCircles){
					// fill a circle
                    ctx.save();
					ctx.fillStyle = "rgba(" + this.red + "," + this.green + "," + 			
					this.blue + "," + alpha + ")"; 
			         
                    ctx.shadowBlur=5;
                    ctx.shadowColor= "yellow"
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.r, 0,Math.PI * 2, false);
					ctx.closePath();
                    ctx.fill();
                    ctx.restore();
				}
							
				// if the particle is too old, recycle it
				if(p.age >= this.lifetime){
					_initParticle(this, p, emitterPoint);
				}		
			} // end for loop of this._particles
	} // end updateAndDraw()
			
	// "private" method
	function _initParticle(obj, p, emitterPoint){
		
		// give it a random age when first created
		p.age = getRandom(0,obj.lifetime);
				
		p.x = emitterPoint.x + getRandom(-obj.xRange, obj.xRange);
		//p.y = emitterPoint.y + getRandom(0, obj.yRange);
		p.y = emitterPoint.y;
		p.r = getRandom(obj.startRadius/2, obj.startRadius); // radius
		p.xSpeed = getRandom(obj.minXspeed, obj.maxXspeed);
		//p.ySpeed = getRandom(obj.minYspeed, obj.maxYspeed);
		p.ySpeed = p.xSpeed;
		return p;
	};
	
	
	return Emitter;
}();