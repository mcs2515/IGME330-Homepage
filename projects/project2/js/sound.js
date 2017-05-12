//sound.js
"use strict";
//if app exists use the existing copy
//else create a new object literal
var app=app|| {};

//define the .sound module and immediately invoke it in an IIFE
app.sound=(function(){
    //console.log("sound.js module loaded");
    var bgAudio = undefined;
	var effectAudio = undefined;
	var currentEffect = 0;
	var currentDirection = 1;
	var effectSounds = ["munch_munch.mp3","yum.mp3","yummy.mp3","wahh.mp3","nooo.mp3","ouch.mp3"];
	

	function init(){
		bgAudio = document.querySelector("#bgAudio");
		bgAudio.volume=0.25;
		effectAudio = document.querySelector("#effectAudio");
		effectAudio.volume = 0.3;
	}
		
	function stopBGAudio(){
		bgAudio.pause();
		bgAudio.currentTime = 0;
	}
	
	function playDamageEffect(){
        var effectAudio = document.createElement("audio");
        
        currentEffect = Math.floor(getRandom(4, effectSounds.length));
		effectAudio.src = "media/music/" + effectSounds[currentEffect];
		effectAudio.play();
//		currentEffect += currentDirection;
//		if (currentEffect == effectSounds.length || currentEffect == -1){
//			currentDirection *= -1;
//			currentEffect += currentDirection;
//		}
	}
    
    function playEatingEffect(){
        var effectAudio = document.createElement("audio");
        
        currentEffect = Math.floor(getRandom(0, 3));
		effectAudio.src = "media/music/" + effectSounds[currentEffect];
		effectAudio.play();
        
    }
    
    function playBGAudio(){
        bgAudio.play();
    }
    //export a public interface to this module
    //TODO
    //revealing module pattern, reveal public references to methods inside the sound module's scope
    return{
        init: init,
        stopBGAudio: stopBGAudio,
        playDamageEffect:playDamageEffect,
        playEatingEffect: playEatingEffect,
        playBGAudio: playBGAudio
    }
}());