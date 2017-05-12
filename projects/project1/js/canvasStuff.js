(function(){
    "use strict";

    var NUM_SAMPLES = 256;
    var songFile='media/Castle In The Sky.mp3';
    var audioElement;
    var analyserNode, delayNode; 
    var canvas,ctx;
    var greyScale=0.0, maxRadius=200, delayAmount= 0.0;
    var invert=false, tintGreen=false, noise=false, lines=false;
    var modeType = "frequency";
    var selectedSong = "Castle_In_The_Sky";
    var magicTheme=false;
    var img, pattern, ang = 0, rot=0;
     var my_gradient;
    
    function init(){
        // set up canvas stuff
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext("2d");
        
        //get a image file and repeat it as a pattern
        img = document.getElementById("background");
        pattern=ctx.createPattern(img,"repeat-x");
        
        // get reference to <audio> element on page
        audioElement = document.querySelector('audio');
        
        // call our helper function and get an analyser node
        analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
        
        document.querySelector("#slider1").onchange=function(){
            maxRadius =parseFloat(document.querySelector("#slider1").value);
        };
                      
        document.querySelector("#slider2").onchange=function(){
            greyScale =parseFloat(document.querySelector("#slider2").value);
        };

        document.querySelector("#slider3").onchange=function(){
            delayAmount =parseFloat(document.querySelector("#slider3").value);
        };

        //setups
        setupUI();
        setupEffects();

        // load and play default sound into audio element
        playStream(audioElement,songFile);
        
        my_gradient=ctx.createLinearGradient(0,0,0,canvas.height);
        my_gradient.addColorStop(0,"#d8c2ff");
        my_gradient.addColorStop(1/2,"#24113f");
        my_gradient.addColorStop(1,"#d8c2ff");
        ctx.fillStyle=my_gradient;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        
        // start animation loop
        update();
    }


    //keeps updating the canvas to continue the "animations"--------------------------------------------------
    function update() {
        // do your drawing stuff here
        // this schedules a call to the update() method in 1/60 seconds
        requestAnimationFrame(update);
        
        // create a new array of 8-bit integers (0-255)
        var data = new Uint8Array(NUM_SAMPLES/2); 
        delayNode.delayTime.value= delayAmount;
        
        
        //check to see what mode the user wants
        if(modeType=="frequency"){
            // populate the array with the frequency data
            // notice these arrays can be passed "by reference" 
            analyserNode.getByteFrequencyData(data);
        }
        else{
            // OR
            analyserNode.getByteTimeDomainData(data); // waveform data
        }
        
        //clear the canvas
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle=my_gradient;
        ctx.fillRect(0,0,canvas.width,canvas.height);  
       
        
        if(magicTheme){
            drawBackground();
            drawSpiral(data);
            drawHeart();
        }
        else{
            drawWaves(data);
            drawCircles(data);
        }
         
        //draw several shapes
        
        drawRects(data);
        
        //check of the user input on the scaled provided
        manipulatePixels();
    } 

    //HELPERS====================================================================================================================================================================

    //checks for Checkboxes-----------------------------------------------------------------------------------------------------
    function setupEffects(){
        //call the checkfunc method, sending the box id names and an anonymous function that sets a value
        checkfunc("invertCheckbox", function(v) { invert = v; });
        checkfunc("greenCheckbox", function(v) { tintGreen = v; });
        checkfunc("noiseCheckbox", function(v) { noise = v; });
        checkfunc("linesCheckbox", function(v) { lines = v; });
    }

    //calls the manipulate function on the checkbox that was checked------------------------------------------------------------
    function checkfunc(boxName, changeVal) {
        document.getElementById(boxName).onchange = function(e){
            changeVal(e.target.checked);
        };
    }
    
    //-------------------------------------------------------------------------------------------------------------------------
    function createWebAudioContextWithAnalyserNode(audioElement) {
        var audioCtx, analyserNode, sourceNode;
        // create new AudioContext
        audioCtx = new (window.AudioContext || window.webkitAudioContext);

        // create an analyser node
        analyserNode = audioCtx.createAnalyser();

        /*
        We will request NUM_SAMPLES number of samples or "bins" spaced equally 
        across the sound spectrum.

        If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
        the third is 344Hz. Each bin contains a number between 0-255 representing 
        the amplitude of that frequency.
        */ 

        // fft stands for Fast Fourier Transform
        analyserNode.fftSize = NUM_SAMPLES;

        // this is where we hook up the <audio> element to the analyserNode
        sourceNode = audioCtx.createMediaElementSource(audioElement); 
        sourceNode.connect(analyserNode);

        // here we connect to the destination i.e. speakers
        //analyserNode.connect(audioCtx.destination);

        //create DelayNode instance
        delayNode = audioCtx.createDelay();

        //connect rouse node directly to speakers to hear unaltered source in this channel
        sourceNode.connect(audioCtx.destination);
        //this channel will play and visualize the delay
        sourceNode.connect(delayNode);
        delayNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        return analyserNode;
    }


    //-------------------------------------------------------------------------------------------------------
    function drawRects(data){   
       
         // vars for sound bars
        var barWidth = (canvas.width)/data.length;
        var barSpacing = 7;
        var barHeight = 100;
        var topSpacing = 700;
        var baseHeight=5;
        var y=100;
        var blur=10;
        
        // loop through the data and draw!
        for(var i=0; i<data.length; i++)
        {   
            if(magicTheme){
                ctx.save();
                ctx.fillStyle = "#ffedf2";
                
                if(invert){
                    ctx.fillStyle="#ec7696"
                }
                ctx.translate(canvas.width/2, canvas.height/2);
                ctx.rotate((Math.PI * 2 * (i / (data.length-40)))+ (rot -= .00002));

                ctx.beginPath();
                ctx.fillRect(0,maxRadius,barWidth-2, baseHeight+data[i]*.5);
                ctx.restore();
            }
            else{
                ctx.save();
                // the higher the amplitude of the sample (bin) the taller the bar
                ctx.globalAlpha= .5;
                ctx.fillStyle= "black";
                ctx.shadowBlur=blur;
                ctx.shadowColor="blue";
                
                ctx.fillRect(i * (barWidth + barSpacing),0,barWidth,data[i]-y);
                ctx.fillRect(canvas.width-(i * (barWidth + barSpacing)),canvas.height,barWidth,-data[i]+y);
                //ctx.fillRect(canvas.width-(i * (barWidth + barSpacing+4)),(canvas.height+data[i])-250,barWidth,200);

                
                ctx.fillStyle= "white";
                ctx.shadowBlur=blur;
                ctx.shadowColor="blue";
                ctx.fillRect(i * (barWidth + barSpacing),canvas.height,barWidth,-data[i]+y);
                ctx.fillRect(canvas.width-(i * (barWidth + barSpacing)),0,barWidth,data[i]-y);
                ctx.restore();

                //drawinvertedbars
                //ctx.fillRect(canvas.width-i*(barWidth+barSpacing),topSpacing+256-data[i]-20,barWidth,barHeight);
            }
        } 
    }
          
    //checks to see what 
    function drawCircles(data){
        //red-ish circles
        var percent=0;
        var circleRadius=(canvas.width)/data.length;
        var spacing= 6;
        var alpha= 1;
        
        for(var i=0; i<data.length; i++) {
            percent= data[i]/255;
            circleRadius=percent*maxRadius;

            //pink
            ctx.beginPath();
            ctx.fillStyle=makeColor(255,111,111,.34-percent/3.0);
            ctx.arc(canvas.width/2,canvas.height/2,circleRadius,0,2*Math.PI,false);
            ctx.fill();
            ctx.closePath();

            //blueish circles,bigger,moretransparent
            ctx.beginPath();
            ctx.fillStyle=makeColor(0,0,255,.10-percent/9.5);
            ctx.arc(canvas.width/2,canvas.height/2,circleRadius*1.5,0,2*Math.PI,false);
            ctx.fill();
            ctx.closePath();

            //yellowish circles smaller
            ctx.beginPath();
            ctx.fillStyle=makeColor(204,255,204,.5);
            ctx.arc(canvas.width/2,canvas.height/2,circleRadius*.50,0,2*Math.PI,false);
            ctx.fill();
            ctx.closePath();                  
        }
    }
    
    function drawSpiral(data){
        var x=0;
        var y=0;
        var angle=0;

        ctx.save();
        ctx.lineWidth= 2;
        ctx.strokeStyle = "white";
        ctx.shadowBlur=8;
        ctx.shadowColor="white";
        
        if(invert){
            ctx.strokeStyle = "grey";
            ctx.shadowColor="grey";
        }
        
        ctx.beginPath();
        
        ctx.translate(canvas.width/2, canvas.height/2);
        //ctx.rotate(Math.PI - (ang));
        
        ctx.moveTo(0,0);
        for (var i = 0; i<data.length+10; i++) {
            //this makes interesting patterns
            ctx.rotate((Math.PI - (ang))/50);
            angle = .1 *i;
            //increment the angle and rotate the image 
            x=(i*1.3)*Math.cos(angle);
            y=(i*1.3)*Math.sin(angle);
            
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    //draws a purple waves behind black waves in sync to the data
    function drawWaves(data){
        var x=10;
        var y=160;
        var half=canvas.height/2;
        var length=5+(canvas.width/data.length);
        
        //wave visual
        ctx.save();
       
        ctx.shadowColor= "white";
        ctx.shadowBlur=10;
        
        //purple line
        ctx.strokeStyle= "purple";
        ctx.lineWidth = 5;
        ctx.beginPath();
        for(var j=0; j<data.length; j++){
            ctx.lineTo(j*length, half+data[j]-y);
        }
        ctx.stroke();
        //black line
        ctx.strokeStyle= "black";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        
        //purple line reverse
        ctx.strokeStyle= "purple";
        ctx.lineWidth = 5;
        
        ctx.beginPath();
        for(var j=0; j<data.length; j++){
            ctx.lineTo(canvas.width-(j*length), half+data[j]-y);
        }
        ctx.stroke();
        //black line
        ctx.strokeStyle= "black";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
    
    //draws the image as the baground and rotates it
    function drawBackground(){
        //rotate the background image
            ctx.save(); //saves the state of canvas
            ctx.globalAlpha=.9;
            ctx.scale(1.8,1.8);
            ctx.translate(canvas.width/3.6, canvas.height/3.6);
            ctx.rotate(Math.PI / 180 * (ang += .1)); //increment the angle and rotate the image 
            ctx.drawImage(img,  -img.width/2, -img.height / 2, img.width, img.height); //draw the image ;)
            ctx.restore(); //restore the state of canvas
    }
    
    //draws a heart at the center of the canvas
    //Code Author: m1erickson
    //http://jsfiddle.net/m1erickson/8Ja8A/
    function drawHeart(){   
        //draws a light white background behind the heart
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.fillStyle="rgba(255,255,255,.5)";
        ctx.strokeStyle="rgba(255,255,255,1)";
        
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.arc(0,0,180,0,2*Math.PI);
        ctx.shadowBlur=15;
        ctx.shadowColor="white";
        
        if(invert){
            ctx.shadowColor="grey";
        }
        
        ctx.stroke();
        ctx.fill();
        ctx.restore();
        
        //heart curves
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.fillStyle="#BE1E73";
        ctx.strokeStyle= "pink";
        ctx.lineWidth= 3;
        ctx.beginPath();
        ctx.moveTo(0,-15);
        ctx.bezierCurveTo( 0,-45, -50,-45, -50, -15);
        ctx.bezierCurveTo( -50,15, 0,20, 0, 45 );
        ctx.bezierCurveTo( 0,20, 50,15, 50, -15 );  
        ctx.bezierCurveTo( 50,-45, 0,-45, 0, -15);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur=8;
        ctx.shadowColor="white";
        
        if(invert){
            ctx.shadowColor="grey";
        }
        ctx.stroke();
        ctx.restore();
    }

    //checks checkboxes and scales to manipulate the pixels-----------------------------------------------------------------------
    function manipulatePixels(){
        //i) Get all of the rgba pixel data of the canvas by grabbing the image data
        var imageData=ctx.getImageData(0,0,canvas.width, canvas.height);

        //ii)imageData.data is an 8-bit  typed array- values range from 0-255
        //imageData.data contains 4 values per pixel: 4 x canvas.width x
        //canvas.height = 10240000 values!
        //we are looping through this 60 fps-wow
        var data = imageData.data;
        var length = data.length;
        var width = imageData.width;

        //iii)Iteratethrougheachpixel
        //we step by 4 so that we can manipulate pixel per iteration
        //data[i]is the red value
        //data[i+1]is the green value
        //data[i+2]is the blue value
        //data[i+3]is the alpha value
        for(var i=0; i<length; i+=4){
            //increase green value only
            if(tintGreen){
                data[i+1]= data[i]+60; //just the green channel this time
                data[i+5]= data[i]+60; //just the green channel this time
            }
            if(invert){
                var red=data[i], green=data[i+1], blue=data[i+2];
                data[i]=255-red;        //set red value
                data[i+1]=255-green;    //set blue value
                data[i+2]=255-blue;     //set green value

            }
            if(noise&&Math.random()<.10){
                //data[i]=data[i+1]=data[i+2]=128 //gray noise
                data[i+4]=data[i+5]=data[i+6]=255; //or white noise
                //data[i]=data[i+1]=data[i+2]=0; //or back noise
                data[i+3]=255; //alpha
            }
            if(lines){
                var row= Math.floor(i/4/width);
                if(row%50==0){
                    //this row
                    data[i]=data[i+1]= data[i+2]= data[i+3]=255;

                    //next row
                    data[i+(width*4)]=
                    data[i+(width*4)+1]=
                    data[i+(width*4)+2]=
                    data[i+(width*4)+3]=255;
                }
            }

        //this sets the greyscale for each particle based on the scale
        //let c equal the value on the scale between 0----->1
        //we want to go from [r,g,b]----->[gr,gr,gr]  //let gr equal the color grey
        // (1-c)*[r,g,b] + c*[gr,gr,gr]   if c= 0, we get rgb, else if c=1 we get gr    
        
         var average = (data[i]+ data[i+1]+ data[i+2])/3; //getting a grey valuev "gr"
         var saturated = greyScale*average; //depending on the scale value, change between grey to normal rgb values "c*gr"
         var oppositeVal= (1-greyScale); //if callGrey=0, we get rgb, else if callGrey=1, we get grey "1-c"

        // (1-c)*[r] + c[gr]    
         data[i] = oppositeVal* data[i] + saturated;
        // (1-c)*[g] + c[gr]  
         data[i+1] = oppositeVal* data[i+1] + saturated;
        // (1-c)*[b] + c[gr]  
         data[i+2] = oppositeVal* data[i+2] + saturated;              
        }

        //put the modified data back on the canvas
        ctx.putImageData(imageData,0,0);
        //console.log("was called");
    }

    //checks for user click on frequency/wave modes and the transform button and calls appropriate methods--------------------
    function setupUI(){
        //change theme based on the user click on button
        document.querySelector(".magicTheme").onclick = function(e){
            
            //checks to see if the magicMode is T or F and switches it
            if(magicTheme==true){
                //while magicMode is T,
                magicTheme=false;
                //change the inner html of the button
                document.querySelector(".magicTheme").innerHTML = "Magic Girl Mode";
                //switch music
                playStream(audioElement,'media/New Adventure Theme.mp3');
                //have music selected
                document.getElementById('New_Adventure_Theme').className = "selected"; 
                
                //"options" return to its original colors by changing class
                document.getElementById('songList').className = "options";
                document.getElementById('mode').className = "options";
                
                //change the button looks
                document.querySelector(".magicTheme").className = "magicTheme";
            }
            else{
                magicTheme=true;
                
                //change the inner html of the button
                document.querySelector(".magicTheme").innerHTML = "Boring Life Mode";
                //switch music
                playStream(audioElement,'media/Precure Princess Engage.mp3');
                
                //remove selection off of last played song
                document.getElementById(selectedSong).className = " ";
                
                //"options" change colors by adding another class
                document.getElementById('songList').className = "options magicalColors";
                document.getElementById('mode').className = "options magicalColors";
                
                //change how the button looks by adding another calss
                document.querySelector(".magicTheme").className = "magicTheme changeTheme";
            }          
        };
        
        //change the song when song is clicked
        document.querySelector("#New_Adventure_Theme").onclick = changeSong;
        document.querySelector("#Castle_In_The_Sky").onclick = changeSong;
        document.querySelector("#Through_The_Danger").onclick = changeSong;      

        //checks to see what mode the user clicks and calls the changeMode method
        document.querySelector("#frequency").onclick = changeMode;
        document.querySelector("#wave").onclick = changeMode;
    }
    
    //add new class or remove class to select or unselect an "option"-------------------------------------------------------------------
    function changeMode(e){
        //removes the selected class from the current mode to the new selected mode
        document.getElementById(modeType).className = " ";     
        modeType = e.target.id;
        document.getElementById(modeType).className = "selected";
    }

    //changes the current song by getting the file name and sending it to the playstream--------------------------------------
    function changeSong(e){
        //get the new file path to song and send to playStream()
        songFile = 'media/' + e.target.id.replace(/_/g, " ") + '.mp3';   
        playStream(audioElement,songFile);
        
        //remove selection off of last played song
        document.getElementById(selectedSong).className = " ";
        //reassign new song as selected song
        selectedSong = e.target.id;
        document.getElementById(selectedSong).className = "selected";  
    }

    //changes the song playing by giving the path of the music file and audio
    function playStream(audioElement,path){
        audioElement.src = path;
        audioElement.play();
        //change the play and pause button on the player
        thePlayer.addClass( cssClass.playing );
    }
    
    //these functions focuses on data manipulation and particle effects--------------------------------------------------------
    function makeColor(red, green, blue, alpha){
        var color='rgba('+red+','+green+','+blue+', '+alpha+')';
        return color;
    }
    
    window.addEventListener("load",init);
}());