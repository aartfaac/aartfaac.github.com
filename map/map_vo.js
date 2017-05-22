var mapTypes = {};

// set up the map types
mapTypes['sky'] = {
	getTileUrl: function(coord, zoom) {
		return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
	  		return "https://mw1.google.com/mw-planetary/sky/skytiles_v1/" + coord.x + "_" + coord.y + '_' + zoom + '.jpg';
			});
		},
	tileSize: new google.maps.Size(256, 256),
	isPng: false,
	maxZoom: 13,
	radius: 57.2957763671875,
	name: 'Visible Sky',
	credit: 'Image Credit: SDSS, DSS Consortium, NASA/ESA/STScI'
};

mapTypes['iras'] = {
	getTileUrl: function(coord, zoom) {
		return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
	  		return "https://mw1.google.com/mw-planetary/sky/mapscontent_v1/overlayTiles/iras/zoom" + zoom + "/iras_" + coord.x + "_" + coord.y + '.png';
		});
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	maxZoom: 13,
	radius: 57.2957763671875,
	name: 'IRAS',
	credit: 'Image Credit: SDSS, DSS Consortium, NASA/ESA/STScI'
};

mapTypes['nvss'] = {
	getTileUrl: function(coord, zoom) {
		return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
	  		return "/tiles/nvss/" + zoom + "/nvss_" + zoom + "_" + coord.x + "_" + coord.y + ".png";
		});
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	maxZoom: 9,
	radius: 57.2957763671875,
	name: 'NVSS',
	credit: 'Image Credit: SDSS, DSS Consortium, NASA/ESA/STScI'
};

mapTypes['halpha'] = {
	getTileUrl: function(coord, zoom) {
		return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
		  	return "/tiles/halpha/" + zoom + "/halpha_" + zoom + "_" + coord.x + "_" + coord.y + ".png";
		});
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	maxZoom: 8,
	radius: 57.2957763671875,
	name: 'H&alpha;',
	credit: 'Image Credit: SDSS, DSS Consortium, NASA/ESA/STScI'
}; 

//mapTypes['AARTFAAC 38'] = {
//	getTileUrl: function(coord, zoom) {
//		return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
//	  		return "/tiles/lwa38/" + zoom + "/lwa38_" + zoom + "_" + coord.x + "_" + coord.y + ".png";
//		});
//	},
//	tileSize: new google.maps.Size(256, 256),
//	isPng: true,
//	maxZoom: 6,
//	radius: 57.2957763671875,
//	name: 'AARTFAAC @ 38 MHz',
//	credit: 'Image Credit: AARTFAAC.org'
//};

//mapTypes['lwa60'] = {
//	getTileUrl: function(coord, zoom) {
//		return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
//	  		return "/tiles/lwa60/" + zoom + "/lwa60_" + zoom + "_" + coord.x + "_" + coord.y + ".png";
//		});
//	},
//	tileSize: new google.maps.Size(256, 256),
//	isPng: true,
//	maxZoom: 6,
//	radius: 57.2957763671875,
//	name: 'LWA1 @ 60 MHz',
//	credit: 'Image Credit: LWA1'
//};

mapTypes['AARTFAAC 60'] = {
	getTileUrl: function(coord, zoom) {
		return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
	  		return "/tiles/lwa74/" + zoom + "/lwa74_" + zoom + "_" + coord.x + "_" + coord.y + ".png";
		});
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	maxZoom: 6,
	radius: 57.2957763671875,
	name: 'AARTFAAC @ 60 MHz',
	credit: 'Image Credit: AARTFAAC.org'
};

mapTypes['fermi4'] = {
	getTileUrl: function(coord, zoom) {
		return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
	  		return "/tiles/fermi4/" + zoom + "/fermi4_" + zoom + "_" + coord.x + "_" + coord.y + ".png";
		});
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true,
	maxZoom: 6,
	radius: 57.2957763671875,
	name: 'Fermi 4',
	credit: 'Image Credit: SDSS, DSS Consortium, NASA/ESA/STScI'
};

// Normalizes the tile URL so that tiles repeat across the x axis (horizontally) like the
// standard Google map tiles.
function getHorizontallyRepeatingTileUrl(coord, zoom, urlfunc) {
	var y = coord.y;
	var x = coord.x;

	// tile range in one direction range is dependent on zoom level
	// 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
	var tileRange = 1 << zoom;

	// don't repeat across y-axis (vertically)
	if (y < 0 || y >= tileRange) {
		return null;
	}

	// repeat across x-axis
	if (x < 0 || x >= tileRange) {
		x = (x % tileRange + tileRange) % tileRange;
	}

	return urlfunc({x:x,y:y}, zoom)
}
 
var map;
var mapTypeIds = [];

// Setup a copyright/credit line, emulating the standard Google style
var creditNode = document.createElement('div');
creditNode.id = 'credit-control';
creditNode.style.fontSize = '11px';
creditNode.style.fontFamily = 'Arial, sans-serif';
creditNode.style.margin = '0 2px 2px 0';
creditNode.style.whitespace = 'nowrap';
creditNode.index = 0;

function setCredit(credit) {
	creditNode.innerHTML = credit + ' -';
}
 
function initialize() {
	// push all mapType keys in to a mapTypeId array to set in the mapTypeControlOptions
	for (var key in mapTypes) {
		mapTypeIds.push(key);
	}

	var mapOptions = {
		zoom: 1,
		center: new google.maps.LatLng(0, 0),
		mapTypeControlOptions: {
	  		mapTypeIds: mapTypeIds,
	  		style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
		}
	};
	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	// push the credit/copyright custom control
	map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(creditNode);

	// add the new map types to map.mapTypes
	for (key in mapTypes) {
		map.mapTypes.set(key, new google.maps.ImageMapType(mapTypes[key]));
	}

	// handle maptypeid_changed event to set the credit line
	google.maps.event.addListener(map, 'maptypeid_changed', function() {
		setCredit(mapTypes[map.getMapTypeId()].credit);
	});

	// start with the sky map type
	map.setMapTypeId('sky');

//	addOverlay('lwa38')
//	addOverlay('lwa60')
	addOverlay('lwa74')
	addOverlay('nvss')
	addOverlay('fermi4')

	var statusBarContainer = document.getElementById('statusDiv');
	var statusbar = new MStatusBar({map:map,container1:statusBarContainer});
}

function addOverlay(theme){
	var hMap = new MCustomTileLayer(map,theme);
	//map.overlayMapTypes.insertAt(0, hMap);

	var oDiv = document.getElementById('controlsDiv');
	var tlcOptions = {
		parent: oDiv,
		overlay: hMap,
		caption: theme.toUpperCase()
	}
	var tlc = new MTileLayerControl(tlcOptions);

}

