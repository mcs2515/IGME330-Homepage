/*
loader.js
variable 'app' is in global scope - i.e. a property of window.
app is our single global object literal - all other functions and properties of 
the game will be properties of app.
*/
"use strict";

// if app exists use the existing copy
// else create a new empty object literal
var app = app || {};


window.onload = function(){
	//console.log("window.onload called");
	//this is the "sandbox" where we hook up our modules up
    //so that we don't have any hard-coded dependencies in
    //the modules themselves
    app.sound.init();
    app.main.sound=app.sound;
    app.main.myKeys=app.myKeys;
    app.main.Emitter=app.Emitter;
    app.main.init();
}

window.onblur=function(){
    //console.log("blur at "+Date());
    app.main.pauseGame();
    
    //stop the animation loop
    cancelAnimationFrame(app.main.animationID);
    
    //call update() once so that our paused screen getts drawn
    app.main.update();
};


window.onfocus=function(){
    //console.log("focus at "+Date());
    
    //stop the animation loop,just in case it's running
    cancelAnimationFrame(app.main.animationID);
    
    app.main.resumeGame();
    
    //restart the loop
    app.main.update();
};