var G = G ? G : google.maps;

function MStatusBar(opts) {
	this.self = this;
	this.map = opts.map;
	this.container1 = opts.container1;
	this.container2 = opts.container2 || null;

	this.create();
	this.attachEvents();
	this.centerChanged();
	this.zoomChanged();
}


MStatusBar.prototype.create = function () {
	var oDiv = document.createElement('DIV');
	this.container1.appendChild(oDiv);
	oDiv.style.font = 'normal 12px verdana'

	var iTable = document.createElement('TABLE');
	oDiv.appendChild(iTable);
	iTable.setAttribute('width','100%');
	iTable.setAttribute('cellSpacing',0);
	iTable.setAttribute('cellPadding',1);

	var oTBody = document.createElement('TBODY');
	iTable.appendChild(oTBody);

	var oRow = document.createElement('TR');
	oTBody.appendChild(oRow);

	this.centerCell = document.createElement('TD');
	oRow.appendChild(this.centerCell);
	this.centerCell.style.width = '33%';
	this.centerCell.style.textAlign = 'center';

	this.zoomCell = document.createElement('TD');
	oRow.appendChild(this.zoomCell);
	this.zoomCell.style.width = '34%';
	this.zoomCell.style.textAlign = 'center';

	this.mouseCell = document.createElement('TD');
	oRow.appendChild(this.mouseCell);
	this.mouseCell.style.width = '33%';
	this.mouseCell.style.textAlign = 'center';

	//===========================
	if (this.container2) {
		var oDiv = document.createElement('DIV');
		this.container2.appendChild(oDiv);
		oDiv.style.font = 'normal 12px verdana'

		var iTable2 = document.createElement('TABLE');
		oDiv.appendChild(iTable2);
		iTable2.setAttribute('width','100%');
		iTable2.setAttribute('cellSpacing',0);
		iTable2.setAttribute('cellPadding',1);

		var oTBody2 = document.createElement('TBODY');
		iTable2.appendChild(oTBody2);

		var oRow2 = document.createElement('TR');
		oTBody2.appendChild(oRow2);

		this.povPositionCell = document.createElement('TD');
		oRow2.appendChild(this.povPositionCell);
		this.povPositionCell.style.width = '25%';
		this.povPositionCell.style.textAlign = 'center';

		this.povHeadingCell = document.createElement('TD');
		oRow2.appendChild(this.povHeadingCell);
		this.povHeadingCell.style.width = '25%';
		this.povHeadingCell.style.textAlign = 'center';

		this.povPitchCell = document.createElement('TD');
		oRow2.appendChild(this.povPitchCell);
		this.povPitchCell.style.width = '25%';
		this.povPitchCell.style.textAlign = 'center';

		this.povZoomCell = document.createElement('TD');
		oRow2.appendChild(this.povZoomCell);
		this.povZoomCell.style.width = '25%';
		this.povZoomCell.style.textAlign = 'center';
	 }
}



//povHeadingCell povPitchCell povZoomCell

MStatusBar.prototype.attachEvents = function() {
	var self = this.self;
	G.event.addListener(this.map,'center_changed', function(){self.centerChanged()});
	G.event.addListener(this.map,'zoom_changed', function(){self.zoomChanged()});
	G.event.addListener(this.map,'mousemove', function(mev){self.mouseMove(mev)});

	this.streetView = this.map.getStreetView();
	if (this.streetView) {
		//svs = new G.StreetViewService();
		G.event.addListener(this.streetView,'position_changed',function() {self.svpChanged()});
		G.event.addListener(this.streetView,'pov_changed',function() {self.svpChanged()});
	}	
}



MStatusBar.prototype.centerChanged = function () {
	lng = 180.0 - this.map.getCenter().lng();
	this.centerCell.innerHTML = 'Map center: ' +this.map.getCenter().lat().toFixed(6) + ',' + lng.toFixed(6);
}

MStatusBar.prototype.zoomChanged = function () {
	this.zoomCell.innerHTML = 'Zoom: ' + this.map.getZoom();
}
MStatusBar.prototype.mouseMove = function (mev) {
	lng = 180.0 - mev.latLng.lng();
	this.mouseCell.innerHTML = 'Mouse: ' + mev.latLng.lat().toFixed(6) + ',' + lng.toFixed(6);
}


MStatusBar.prototype.svpChanged = function(){
	//debug(svp.getPosition());
	//debug(svp.getPov().heading);
	//debug(svp.getPov().pitch);
	//debug(svp.getPov().zoom);
	this.povPositionCell.innerHTML = 'Position<br>'+this.streetView.getPosition().lat().toFixed(4) + ', ' + this.streetView.getPosition().lng().toFixed(4);
	this.povHeadingCell.innerHTML = 'Heading<br>'+this.streetView.getPov().heading.toFixed(2);
	this.povPitchCell.innerHTML = 'Pitch<br>' + this.streetView.getPov().pitch.toFixed(2);
	this.povZoomCell.innerHTML = 'Zoom:<br>' + this.streetView.getPov().zoom.toFixed(2);

	var link =  window.location.pathname +  '?lat='+svp.getPosition().lat().toFixed(6)+'&lon='+svp.getPosition().lng().toFixed(6)+'&mz='+ map.getZoom()+'&h='+svp.getPov().heading+'&p='+svp.getPov().pitch+'&z='+svp.getPov().zoom;
	//var oLink = document.getElementById("linkToThis");
	//oLink.innerHTML = '<a href="' + link + '">Link to this view</a>';
}

