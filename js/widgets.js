(function(exports){

// SINGLETON
var Widgets = {};
exports.Widgets = Widgets;

// CONVERT 'EM ALL
Widgets.convert = function(dom){

	// All elements
	var widgetDOMs = dom.querySelectorAll("widget");

	// For each one...
	for(var i=0; i<widgetDOMs.length; i++){
		var widgetDOM = widgetDOMs[i];

		// Convert attributes into an object
		var config = {};
		for(var j=0; j<widgetDOM.attributes.length; j++){
			var key = widgetDOM.attributes[j].name;
			var value = widgetDOM.attributes[j].value;
			config[key] = value;
		}

		// Create widget of said type
		var type = config.type;
		var widget = new Widgets[type](config);

		// Replace it in the dom
		widgetDOM.parentNode.replaceChild(widget.dom, widgetDOM);

		// Gimme an ID!
		widget.dom.id = config.id;

	}

};

// TOGGLE WIDGET
// id, value, label, background, color, background-on, color-on, label-on, label-off
Widgets.toggle = function(config){

	var self = this;
	self.config = config;

	// Start value
	self.value = !!(parseInt(config.value));

	// Graphics
	var dom = document.createElement("div");
	dom.classList.add("widget");
	dom.classList.add("widget-toggle");
	self.dom = dom;

	// Label
	var label = document.createElement("div");
	label.id = "label";
	label.innerHTML = config.label;
	dom.appendChild(label);

	// Toggle
	var toggle = document.createElement("div");
	toggle.id = "toggle";
	toggle.style.borderColor = config.color;
	dom.appendChild(toggle);

	var toggle_switch = document.createElement("div");
	toggle_switch.id = "toggle_switch";
	toggle.appendChild(toggle_switch);
	
	var toggle_on = document.createElement("div");
	toggle_on.id = "toggle_on";
	toggle_on.innerHTML = config["label-on"];
	toggle_on.style.color = config["color-on"];
	toggle_switch.appendChild(toggle_on);

	var toggle_off = document.createElement("div");
	toggle_off.id = "toggle_off";
	toggle_off.innerHTML = config["label-off"];
	toggle_off.style.color = config["color"];
	toggle_switch.appendChild(toggle_off);
	
	var toggle_knob = document.createElement("div");
	toggle_knob.id = "toggle_knob";
	toggle_knob.style.background = config.color;
	toggle_switch.appendChild(toggle_knob);

	// Colors
	dom.style.color = config.color;

	// On change value
	self.onChangeValue = function(newValue){
		self.value = newValue;
		if(self.value){ // on
			toggle_switch.style.left = "0px";
			toggle.style.background = config["background-on"];
		}else{ // off
			toggle_switch.style.left = "-80px";
			toggle.style.background = config["background"];
		}
	}
	subscribe("toggle/"+config.id, self.onChangeValue);
	self.onChangeValue(self.value);

	// On Click
	self.dom.onclick = function(){
		self.value = !self.value;
		publish("toggle/"+config.id, [self.value]);
	};

};

// SLIDER WIDGET
// id, label, background, color, min, max, step, label-min, label-max
Widgets.slider = function(config){

	var self = this;
	self.config = config;

	// Graphics
	var dom = document.createElement("div");
	dom.classList.add("widget");
	dom.classList.add("widget-slider");
	dom.style.color = config.color;
	self.dom = dom;

	// Top Label
	var top_label = document.createElement("div");
	top_label.id = "top_label";
	top_label.innerHTML = config.label;
	dom.appendChild(top_label);

	// Slider
	var slider = document.createElement("div");
	slider.id = "slider";
	dom.appendChild(slider);

	var slider_bar = document.createElement("div");
	slider_bar.id = "slider_bar";
	slider_bar.style.borderColor = config.color;
	slider.appendChild(slider_bar);

	var slider_knob = document.createElement("div");
	slider_knob.id = "slider_knob";
	slider_knob.style.background = config.color;
	slider.appendChild(slider_knob);

	// Bottom labels
	var bottom_label = document.createElement("div");
	bottom_label.id = "bottom_label";
	dom.appendChild(bottom_label);
	
	var label_min = document.createElement("div");
	label_min.id = "label_min";
	label_min.innerHTML = config["label-min"];
	bottom_label.appendChild(label_min);
	
	var label_max = document.createElement("div");
	label_max.id = "label_max";
	label_max.innerHTML = config["label-max"];
	bottom_label.appendChild(label_max);

	// MOUSE EVENTS

	self.grabbing = false;
	self.onGrabbing = function(grabbing){
		self.grabbing = grabbing;
		if(grabbing){
			slider_knob.style.background = config.background;
			slider_knob.setAttribute("grabbing",true);
		}else{
			slider_knob.style.background = config.color;
			slider_knob.removeAttribute("grabbing");
		}
	};

	// Notches
	var min = parseFloat(config.min);
	var max = parseFloat(config.max);
	var step = parseFloat(config.step);

	// Convert Touch to Cursor
	var _getMouse = function(event){
		var pos = {};
		if(event.changedTouches){
			// Touch
			//var bounds = target ? target.getBoundingClientRect() : {left:0,top:0};
			pos.x = event.changedTouches[0].clientX;// - bounds.left;
			pos.y = event.changedTouches[0].clientY;// - bounds.top;
		}else{
			// Not Touch
			pos.x = event.pageX;
			pos.y = event.pageY;
		}
		return pos;
	};

	// Mouse Events
	var offsetX = 0;
	slider_knob.onmousedown = function(event){
		var pos = _getMouse(event);
		self.onGrabbing(true);
		offsetX = pos.x - slider_knob.getBoundingClientRect().left;
		event.stopPropagation();
	};
	slider_knob.addEventListener("touchstart", function(event){
		slider_knob.onmousedown(event);
		event.preventDefault();
	});
	self.dom.onmousedown = function(event){
		var pos = _getMouse(event);
		self.onGrabbing(true);
		offsetX = slider_knob.getBoundingClientRect().width/2;
		self.mouseToValue(pos.x);
	};
	self.dom.addEventListener("touchstart", function(event){
		self.dom.onmousedown(event);
	});
	var _onMouseUp = function(){
		self.onGrabbing(false);
	};
	window.addEventListener("mouseup", _onMouseUp);
	document.body.addEventListener("touchend",_onMouseUp,false);
	var _onMouseMove = function(event){
		if(self.grabbing){
			var pos = _getMouse(event);
			self.mouseToValue(pos.x);
		}
	};
	window.addEventListener("mousemove", _onMouseMove);
	window.addEventListener("touchmove", _onMouseMove);
	self.mouseToValue = function(pageX){

		// Convert to raw position
		var mouseX = pageX - offsetX;
		var bounds = self.dom.getBoundingClientRect();
		var sliderX = bounds.left;
		var knobWidth = slider_knob.getBoundingClientRect().width;
		var sliderWidth = bounds.width - knobWidth;
		var x = mouseX-sliderX;
		if(x<0) x=0;
		if(x>sliderWidth) x=sliderWidth;

		// Convert to value
		x = x/sliderWidth; // 0 to 1
		x = min + x*(max-min); // min to max
		x = Math.round(x/step)*step; // round to nearest step

		// Publish value
		publish("slider/"+config.id, [x]);

	};
	self.value = 0;
	self.onChangeValue = function(value){
		
		self.value = value;

		// Convert value to position
		var knobWidth = slider_knob.getBoundingClientRect().width;
		var sliderWidth = self.dom.getBoundingClientRect().width - knobWidth;
		var x = (value-min)/(max-min); // 0 to 1
		var left = x*sliderWidth;
		slider_knob.style.left = left;

	};
	subscribe("slider/"+config.id, self.onChangeValue);

};

// BUTTON WIDGET: 
// id, label, background, color, background-hover, color-hover, onclick
Widgets.button = function(config){

	var self = this;
	self.config = config;

	// Graphics
	var dom = document.createElement("div");
	dom.classList.add("widget");
	dom.classList.add("widget-button");
	dom.innerHTML = config.label;
	self.dom = dom;

	// Colors
	self.setColors = function(hover){
		dom.style.background = hover ? config["background-hover"] : config.background;
		dom.style.color = hover ? config["color-hover"] : config.color;
		dom.style.borderColor = dom.style.color;
	};
	self.setColors(false);

	// Mouse Events
	self.dom.onmouseover = function(){
		self.setColors(true);
	};
	self.dom.onmouseout = function(){
		self.setColors(false);
	};
	self.dom.onclick = function(){
		publish("button/"+config.id);
	};

};
	
})(window);