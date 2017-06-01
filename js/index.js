/******************************

PRE-LOAD THESE PUPPIES 

*******************************/
_addToManifest(manifest,{
	firefly: "sprites/firefly.json"
});

/******************************

CONSTANTS-ISH
(they're not really constants, w/e)

*******************************/

var NUM_FIREFLIES,
	FLY_LOOP,
	FLY_SWERVE,
	SHOW_CLOCKS,
	FLY_CLOCK_SPEED,
	FLY_RADIUS,
	FLY_PULL,
	FLY_SYNC,
	MOUSE_RADIUS;

var _resetConstants = function(){
	var area = window.innerWidth * window.innerHeight;
	NUM_FIREFLIES = Math.round(area * (150)/(1280*600)); // 150 fireflies per 1280x600
	if(NUM_FIREFLIES<100) NUM_FIREFLIES=100; // actually, MINUMUM 100
	
	FLY_LOOP = 50;
	FLY_SWERVE = 0.1;
	SHOW_CLOCKS = false;
	FLY_CLOCK_SPEED = 0.3;
	FLY_RADIUS = 200;
	FLY_PULL = 0.035;
	FLY_SYNC = false;
	MOUSE_RADIUS = 200;
};

_resetConstants();

/******************************

THE MAIN GAME CODE

*******************************/

var app;
var fireflies = [];
window.onload = function(){

	// Create app!
	app = new PIXI.Application(document.body.clientWidth, document.body.clientHeight, {backgroundColor:0x000000});
	$("#game").appendChild(app.view);

	// Mouse
	Mouse.init($("#game"));

	// When loaded all assets...
	_loadAssets(manifest, function(){

		// Add fireflies!
		_addFireflies(NUM_FIREFLIES);

		// Animation loop
		app.ticker.add(function(delta){
			for(var i=0; i<fireflies.length; i++){
				fireflies[i].update(delta);
			}
		});

		// Synchronize 'em!
		_syncConstants();

	});

	// Play bg music whenever
	var bg_loop = new Howl({
		src: "sounds/forest.mp3",
		volume: 0.8,
		loop: true
	});
	bg_loop.play();

	// Set up widgets!
	Widgets.convert($("#words"));

};

var _addFireflies = function(num){
	for(var i=0; i<num; i++){
		var ff = new Firefly();
		fireflies.push(ff);
		app.stage.addChild(ff.graphics);
	}
};

var _removeFireflies = function(num){
	for(var i=0; i<num; i++){
		var ff = fireflies.pop();
		app.stage.removeChild(ff.graphics);
	}
};

var _resetFireflies = function(){
	for(var i=0; i<fireflies.length; i++){
		var ff = fireflies[i];
		ff.clock = Math.random();
	}	
};

/******************************

THE FIREFLY CODE

*******************************/

function Firefly(){

	var self = this;

	// Graphics
	self.graphics = new PIXI.Container();
	var g = self.graphics;
	g.scale.set(0.15);

	// Random spot
	self.x = Math.random()*app.renderer.width;
	self.y = Math.random()*app.renderer.height;
	self.angle = Math.random()*Math.TAU;
	self.speed = 0.5 + Math.random()*1;
	self.swerve = (Math.random()-0.5)*FLY_SWERVE;

	// Clock! From 0 to 1
	self.clock = Math.random();

	// Flash
	var flash = _makeMovieClip("firefly", {anchorX:0.5, anchorY:0.5});
	flash.gotoAndStop(2);
	flash.alpha = 0;
	g.addChild(flash);

	// Body
	var body = _makeMovieClip("firefly", {anchorX:0.5, anchorY:0.5});
	body.gotoAndStop(0);
	g.addChild(body);

	// Body2
	var body2 = _makeMovieClip("firefly", {anchorX:0.5, anchorY:0.5});
	body2.gotoAndStop(1);
	body2.alpha = 0;
	g.addChild(body2);

	// Wings
	var wings = _makeMovieClip("firefly", {anchorX:0.5, anchorY:0.5});
	wings.gotoAndStop((Math.random()<0.5) ? 3 : 4);
	g.addChild(wings);

	// Clock
	var clock = new PIXI.Container();
	clock.visible = false;
	g.addChild(clock);

	// Dark Clock
	var darkClock = new PIXI.Container();
	clock.addChild(darkClock);
	var darkClockBody = _makeMovieClip("firefly", {anchorX:0.5, anchorY:0.5});
	darkClockBody.gotoAndStop(7);
	darkClock.addChild(darkClockBody);
	var darkClockHand = _makeMovieClip("firefly", {anchorX:0.5, anchorY:0.5});
	darkClockHand.gotoAndStop(8);
	darkClock.addChild(darkClockHand);

	// Light Clock
	var lightClock = new PIXI.Container();
	lightClock.alpha = 0;
	clock.addChild(lightClock);
	var lightClockBody = _makeMovieClip("firefly", {anchorX:0.5, anchorY:0.5});
	lightClockBody.gotoAndStop(5);
	lightClock.addChild(lightClockBody);
	var lightClockHand = _makeMovieClip("firefly", {anchorX:0.5, anchorY:0.5});
	lightClockHand.gotoAndStop(6);
	lightClock.addChild(lightClockHand);

	// Mouse LAST pressed... a little decay...
	var _chaos = 0;

	// Update
	self.update = function(delta){

		//////////////////////
		// Position & Angle //
		//////////////////////

		// Update position
		self.x += self.speed * delta * Math.cos(self.angle);
		self.y += self.speed * delta * Math.sin(self.angle);

		// Loop around
		if(self.x<-FLY_LOOP) self.x=app.renderer.width+FLY_LOOP;
		if(self.x>app.renderer.width+FLY_LOOP) self.x=-FLY_LOOP;
		if(self.y<-FLY_LOOP) self.y=app.renderer.height+FLY_LOOP;
		if(self.y>app.renderer.height+FLY_LOOP) self.y=-FLY_LOOP;

		// Swerve
		self.angle += self.swerve;
		if(Math.random()<0.05) self.swerve = (Math.random()-0.5)*FLY_SWERVE;

		////////////////////////
		// Cycling & Flashing //
		////////////////////////

		// Increment cycle
		flash.alpha *= 0.9;
		self.clock += (delta/60)*FLY_CLOCK_SPEED;

		// If near mouse, get chaotic, and fast!
		if(Mouse.pressed) _chaos=1;
		if(_chaos>0.01 && closeEnough(self,Mouse,MOUSE_RADIUS)){
			self.clock += Math.random()*0.15;
		}
		_chaos *= 0.8;

		// Flashed?
		if(self.clock>1){

			// Flash!
			flash.alpha = 1;
			self.clock = 0;

			// Bring nearby fireflies up.
			if(FLY_SYNC){
				for(var i=0;i<fireflies.length;i++){
					var ff = fireflies[i];
					if(ff==self) continue; // is self? forget it
					if(closeEnough(self,ff,FLY_RADIUS)){ // is close enough?
						var pull = (ff.clock/1); // to prevent double-pulling
						ff.clock += pull*FLY_PULL;
						if(ff.clock>1) ff.clock=1;
					}
				}
			}

		}
		body2.alpha = flash.alpha;
		lightClock.alpha = flash.alpha;

		//////////////
		// Graphics //
		//////////////

		// Position
		g.x = self.x;
		g.y = self.y;
		g.rotation = self.angle+Math.TAU/4;

		// Flap wings
		wings.gotoAndStop( (wings.currentFrame==3) ? 4 : 3 );

		// Clocks!
		clock.rotation = -g.rotation;
		clock.visible = SHOW_CLOCKS;
		darkClockHand.rotation = lightClockHand.rotation = self.clock*Math.TAU;

	};
	self.update(0);

}

/******************************

UI CODE: Resize, make widgets, etc...

*******************************/

subscribe("mousedown",function(){
	$("#words").className = "no-select";
});
subscribe("mouseup",function(){
	$("#words").className = "";
});

window.onresize = function(){
	if(app) app.renderer.resize(document.body.clientWidth, document.body.clientHeight);
};

/******************************

WIDGET CODE: Modifying "Constants"

*******************************/

// Synchronize with the UI
var _syncConstants = function(){

	publish("slider/numFireflies", [NUM_FIREFLIES]);

	publish("toggle/showClocks", [SHOW_CLOCKS]);
	publish("slider/clockSpeed", [FLY_CLOCK_SPEED]);

	publish("toggle/neighborNudgeRule", [FLY_SYNC]);
	publish("slider/nudgeAmount", [FLY_PULL]);
	publish("slider/neighborRadius", [FLY_RADIUS]);

};

// Num of Fireflies

subscribe("slider/numFireflies", function(value){

	// Settle the difference...
	if(value > fireflies.length){
		_addFireflies(value-fireflies.length);
	}
	if(value < fireflies.length){
		_removeFireflies(fireflies.length-value);
	}

	// Then make that the new constant.
	NUM_FIREFLIES = value;

});

// Internal Clock

subscribe("toggle/showClocks", function(value){
	SHOW_CLOCKS = value;
});
subscribe("slider/clockSpeed", function(value){
	FLY_CLOCK_SPEED = value
});

// Neighbor Nudge Rule

subscribe("toggle/neighborNudgeRule", function(value){
	FLY_SYNC = value;
	if(FLY_SYNC){
		$("#nudgeAmount").removeAttribute("inactive");
		$("#neighborRadius").removeAttribute("inactive");
	}else{
		$("#nudgeAmount").setAttribute("inactive","yes");
		$("#neighborRadius").setAttribute("inactive","yes");
	}
});
subscribe("slider/nudgeAmount", function(value){
	FLY_PULL = value;
});
subscribe("slider/neighborRadius", function(value){
	FLY_RADIUS = value;
});

// Reset Everything

subscribe("button/resetFireflies", function(){
	_resetFireflies();
});

subscribe("button/resetEverything", function(){
	_resetConstants();
	_syncConstants();
	_resetFireflies();
});
