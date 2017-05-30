/**********************************

RANDOM CRAP TO MAKE MY LIFE EASIER

**********************************/

Math.TAU = Math.PI*2;

/*******

The poor man's jQuery

*******/

function $(query){
	return document.querySelector(query);
}

/*******

If close to...

*******/

function closeEnough(from, to, radius){
	var dx = from.x - to.x;
	var dy = from.y - to.y;
	var dist = dx*dx+dy*dy;
	return (dist<radius*radius);
}

/*******

Make a MovieClip. e.g:

_makeSprite("button", {width:960});

*******/
function _makeMovieClip(resourceName, options){
	options = options || {};

	// Make that MovieClip!
	var resources = PIXI.loader.resources;
	var resource = resources[resourceName];	
	if(!resource) throw Error("There's no MovieClip named '"+resourceName+"'!");
	var numFrames = Object.keys(resource.data.frames).length;
	var frames = [];
	for(var i=0; i<numFrames; i++){
		var str = "0000" + i; // FOUR leading zeroes
		str = str.substr(str.length-4);
		frames.push(PIXI.Texture.fromFrame(resourceName+str));
	}
	var mc = new PIXI.extras.MovieClip(frames);

	// Options
	mc.gotoAndStop(0);
	mc.anchor.x = 0.5;
	mc.anchor.y = 0.5;
	if(options.width!==undefined) _scaleToWidth(mc, options.width);
	if(options.anchorX!==undefined) mc.anchor.x=options.anchorX;
	if(options.anchorY!==undefined) mc.anchor.y=options.anchorY;
	if(options.scale!==undefined) mc.scale.x=mc.scale.y=options.scale;

	// Gimme
	return mc;

}


/***************

PRELOADING & ASSET MANIFEST

***************/

var manifest = {};
var sounds = {};

function _loadAssets(manifest, completeCallback, progressCallback){

	// ABSOLUTE NUMBER OF ASSETS!
	var _isLoadingImages = 0;
	var _isLoadingSounds = 0;
	var _totalAssetsLoaded = 0;
	var _totalAssetsToLoad = 0;
	for(var key in manifest){
		var src = manifest[key];

		// Loading sounds or images?
		if(src.slice(-4)==".mp3") _isLoadingSounds=1;
		else _isLoadingImages=1;

		// Loading sprite or image?
		if(src.slice(-5)==".json") _totalAssetsToLoad+=2; // Is Sprite. Actually TWO assets.
		else _totalAssetsToLoad+=1;
		
	}

	// When you load an asset
	var _onAssetLoad = function(){
		_totalAssetsLoaded++;
		if(progressCallback){
			progressCallback(_totalAssetsLoaded/_totalAssetsToLoad); // Callback PROGRESS
		}
	};

	// When you load a group
	var _groupsToLoad = _isLoadingImages + _isLoadingSounds;
	var _onGroupLoaded = function(){
		_groupsToLoad--;
		if(_groupsToLoad==0) completeCallback(); // DONE.
	};

	// HOWLER - Loading Sounds
	var _soundsToLoad = 0;
	var _onSoundLoad = function(){
		_soundsToLoad--;
		_onAssetLoad();
		if(_soundsToLoad==0) _onGroupLoaded();
	};

	// PIXI - Loading Images & Sprites (or pass it to Howler)
	var loader = PIXI.loader;
	var resources = PIXI.loader.resources;
	for(var key in manifest){

		var src = manifest[key];

		// Is MP3. Leave it to Howler.
		if(src.slice(-4)==".mp3"){
			var sound = new Howl({ src:[src] });
			_soundsToLoad++;
			sound.once('load', _onSoundLoad);
			Game.sounds[key] = sound;
			continue;
		}

		// Otherwise, is an image (or json). Leave it to PIXI.
	    loader.add(key, src);

	}
	loader.on('progress', _onAssetLoad);
	loader.once('complete', _onGroupLoaded);
	loader.load();

};

function _addToManifest(manifest, keyValues){
	for(var key in keyValues){
		manifest[key] = keyValues[key];
	}
};

/**********************

Add Mouse Shtuff

***********************/

function _addMouseEvents(target, onmousedown, onmousemove, onmouseup){

	// WRAP THEM CALLBACKS
	var _onmousedown = function(event){
		var _fakeEvent = _onmousemove(event);
		onmousedown(_fakeEvent);
	};
	var _onmousemove = function(event){
		
		// Mouse position
		var _fakeEvent = {};
		if(event.changedTouches){
			// Touch
			var bounds = target.getBoundingClientRect();
			_fakeEvent.x = event.changedTouches[0].clientX - bounds.left;
			_fakeEvent.y = event.changedTouches[0].clientY - bounds.top;
			event.preventDefault();
		}else{
			// Not Touch
			_fakeEvent.x = event.offsetX;
			_fakeEvent.y = event.offsetY;
		}

		// Mousemove callback
		onmousemove(_fakeEvent);
		return _fakeEvent;

	};
	var _onmouseup = function(event){
		var _fakeEvent = {};
		onmouseup(_fakeEvent);
	};

	// Add events!
	target.addEventListener("mousedown", _onmousedown);
	target.addEventListener("mousemove", _onmousemove);
	document.body.addEventListener("mouseup", _onmouseup);

	// TOUCH.
	target.addEventListener("touchstart",_onmousedown,false);
	target.addEventListener("touchmove",_onmousemove,false);
	document.body.addEventListener("touchend",_onmouseup,false);

}