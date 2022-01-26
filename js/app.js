(function() {
	/* Canvas */
/*The UI is intentionally simple to reduce the amount of code necessary to bind the message updates to the UI components.
T*/
occupancy
	var canvas = document.getElementById('drawCanvas');  
	var ctx = canvas.getContext('2d');           //cuz i wanna draw in 2d
	var color = document.querySelector(':checked').getAttribute('data-color');

	canvas.width = Math.min(document.documentElement.clientWidth, window.innerWidth || 300);
	canvas.height = Math.min(document.documentElement.clientHeight, window.innerHeight || 300);
	 
	ctx.strokeStyle = color;      /* color of pen set to the selected pen color */
	ctx.lineWidth = '3';        /*pen width */
	ctx.lineCap = ctx.lineJoin = 'round';

	/* Mouse and touch events */
	
	document.getElementById('colorSwatch').addEventListener('click', function() {
		color = document.querySelector(':checked').getAttribute('data-color');
	}, false);
	
	var isTouchSupported = 'ontouchstart' in window;
	var isPointerSupported = navigator.pointerEnabled;
	var isMSPointerSupported =  navigator.msPointerEnabled;
	
	var downEvent = isTouchSupported ? 'touchstart' : (isPointerSupported ? 'pointerdown' : (isMSPointerSupported ? 'MSPointerDown' : 'mousedown'));
	var moveEvent = isTouchSupported ? 'touchmove' : (isPointerSupported ? 'pointermove' : (isMSPointerSupported ? 'MSPointerMove' : 'mousemove'));
	var upEvent = isTouchSupported ? 'touchend' : (isPointerSupported ? 'pointerup' : (isMSPointerSupported ? 'MSPointerUp' : 'mouseup'));
	 	  
	canvas.addEventListener(downEvent, startDraw, false);
	canvas.addEventListener(moveEvent, draw, false);
	canvas.addEventListener(upEvent, endDraw, false);

	canvas.addEventListener('click',e=> {if (e.target.id=='clear'){ctx.clearReact(0,0,canvas.width,canvas.height);}})

	/* PubNub */
/*Initialize the PubNub Object
The PubNub object allows you to make PubNub API calls, like publish, subscribe and more. There are more configuration properties than what you see here, but this is all you need for this Quickstart. Of course, you would use your own publish/subscribe keys below.*/

	var channel = 'draw';

	var pubnub = PUBNUB.init({
		publish_key     : 'pub-c-38000c28-4066-491f-bfa3-2e0ea6f5047a',
		subscribe_key   : 'sub-c-0dd31fba-7e5b-11ec-8e41-c2c95df3c49a',
		leave_on_unload : true,
		ssl		: document.location.protocol === "https:"
	});

	pubnub.subscribe({
		channel: channel,
		callback: drawFromStream,
		presence: function(m){
			if(m.occupancy >= 1){
				document.getElementById('unit').textContent = 'doodlers';
			}
   			document.getElementById('occupancy').textContent = m.occupancy;
   			var p = document.getElementById('occupancy').parentNode;
   			p.classList.add('anim');
   			p.addEventListener('transitionend', function(){p.classList.remove('anim');}, false);
   		}
	});

	function publish(data) {
		pubnub.publish({
			channel: channel,
			message: data
		});
     }

    /* Draw on canvas */

    function drawOnCanvas(color, plots) {
    	ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.moveTo(plots[0].x, plots[0].y);

    	for(var i=1; i<plots.length; i++) {
	    	ctx.lineTo(plots[i].x, plots[i].y);
	    }
	    ctx.stroke();
    }

    function drawFromStream(message) {
		if(!message || message.plots.length < 1) return;
		drawOnCanvas(message.color, message.plots);
    }
    
    // Get Older and Past Drawings
    if(drawHistory) {
	    pubnub.history({
	    	channel  : channel,
	    	count    : 50,
	    	callback : function(messages) {
	    		pubnub.each( messages[0], drawFromStream );
	    	}
	    });
	}
    var isActive = false;
    var plots = [];

	function draw(e) {
		e.preventDefault(); // prevent continuous touch event process e.g. scrolling!
	  	if(!isActive) return;

    	var x = isTouchSupported ? (e.targetTouches[0].pageX - canvas.offsetLeft) : (e.offsetX || e.layerX - canvas.offsetLeft);
    	var y = isTouchSupported ? (e.targetTouches[0].pageY - canvas.offsetTop) : (e.offsetY || e.layerY - canvas.offsetTop);

    	plots.push({x: (x << 0), y: (y << 0)}); // round numbers for touch screens

    	drawOnCanvas(color, plots);
	}
	
	function startDraw(e) {
	  	e.preventDefault();
	  	isActive = true;
	}
	
	function endDraw(e) {
	  	e.preventDefault();
	  	isActive = false;
	  
	  	publish({
	  		color: color,
	  		plots: plots
	  	});

	  	plots = [];
	}
})();
