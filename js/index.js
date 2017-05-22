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

var NUM_FIREFLIES = 150;
var FLY_LOOP = 50;
var FLY_SWERVE = 0.1;
var FLY_PERIOD = 3*60; 
var FLY_RADIUS = 200;
var FLY_PULL = 5;
var FLY_SYNC = false;
var MOUSE_RADIUS = 200;

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

	// TODO: Initial fireflies based on density??

	// When loaded all assets...
	_loadAssets(manifest, function(){

		// create a new Sprite from an image path
		for(var i=0; i<NUM_FIREFLIES; i++){
			var ff = new Firefly();
			fireflies.push(ff);
			app.stage.addChild(ff.graphics);
		}

		// Animation loop
		app.ticker.add(function(delta){
			for(var i=0; i<fireflies.length; i++){
				fireflies[i].update(delta);
			}
		});

	});

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

	// Cycle per two seconds! (60 frames)
	self.cycle = Math.random()*FLY_PERIOD;

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
		self.cycle += delta;

		// If near mouse, get chaotic, and fast!
		if(Mouse.pressed && closeEnough(self,Mouse,MOUSE_RADIUS)){
			self.cycle += 10+Math.random()*10;
		}

		// Flashed?
		if(self.cycle>FLY_PERIOD){

			// Flash!
			flash.alpha = 1;
			//self.cycle -= FLY_PERIOD;
			self.cycle = 0;

			// Bring nearby fireflies up.
			if(FLY_SYNC){
				for(var i=0;i<fireflies.length;i++){
					var ff = fireflies[i];
					if(ff==self) continue; // is self? forget it
					if(closeEnough(self,ff,FLY_RADIUS)){ // is close enough?
						var pull = (ff.cycle/FLY_PERIOD); // to prevent double-pulling
						ff.cycle += pull*FLY_PULL;
						if(ff.cycle>FLY_PERIOD) ff.cycle=FLY_PERIOD;
					}
				}
			}

		}
		body2.alpha = flash.alpha;

		//////////////
		// Graphics //
		//////////////

		// Position
		g.x = self.x;
		g.y = self.y;
		g.rotation = self.angle+Math.TAU/4;

		// Flap wings
		wings.gotoAndStop( (wings.currentFrame==3) ? 4 : 3 );

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

// Num of Fireflies

subscribe("slider/numFireflies", function(){
});

// Internal Clock

subscribe("toggle/showClocks", function(){
});
subscribe("slider/clockSpeed", function(){
});

// Neighbor Nudge Rule

subscribe("toggle/neighborNudgeRule", function(){
});
subscribe("slider/neighborRadius", function(){
});
subscribe("slider/nudgeAmount", function(){
});

// Reset Everything

subscribe("button/reset", function(){
});

