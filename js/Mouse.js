window.Mouse = {};
Mouse.init = function(target){

	// Events!
	var _onmousedown = function(event){
		Mouse.pressed = true;
		publish("mousedown");
	};
	var _onmousemove = function(event){
		Mouse.x = event.x;
		Mouse.y = event.y;
		publish("mousemove");
	};
	var _onmouseup = function(){
		Mouse.pressed = false;
		publish("mouseup");
	};

	// Add mouse & touch events!
	_addMouseEvents(target, _onmousedown, _onmousemove, _onmouseup);

};