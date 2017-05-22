/*
Copyright Damien George, thecmb.org, 2013.
This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/3.0/.

Modifed for LWA1 URO.
*/

var MAIN = (function ($) {
    "use strict";

    var camera, scene, renderer, stats = null;
    var lfsMaterials, materials, sqfaceTexture = null;
    var sphere, galacticPlane, equatorialPlane, xhair, sourceLabels;

    function myGeom(radius, detail) {
        var theta = Math.acos(1/Math.sqrt(3));
        var phi = Math.PI / 4.0;
        var a = Math.sin(theta) * Math.cos(phi);
        var b = Math.sin(theta) * Math.sin(phi);
        var c = Math.cos(theta);

        var vertices = [
            [0, 1, 0],
            [-a, b, c], [a, b, c], [a, b, -c], [-a, b, -c],
            [0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0],
            [-a, -b, c], [a, -b, c], [a, -b, -c], [-a, -b, -c],
            [0, -1, 0]
        ];

        var faces = [
            [0, 1, 2], [1, 5, 2],
            [0, 2, 3], [2, 6, 3],
            [0, 3, 4], [3, 7, 4],
            [0, 4, 1], [4, 8, 1],

            [1, 8, 9], [1, 9, 5],
            [2, 5, 10], [2, 10, 6],
            [3, 6, 11], [3, 11, 7],
            [4, 7, 12], [4, 12, 8],

            [5, 9, 10], [9, 13, 10],
            [6, 10, 11], [10, 13, 11],
            [7, 11, 12], [11, 13, 12],
            [8, 12, 9], [12, 13, 9]
        ];

        var uvs = [
            [[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]],

            [[1, 0], [0, 0], [0, 1]], [[1, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [0, 1]], [[1, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [0, 1]], [[1, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [0, 1]], [[1, 0], [0, 1], [1, 1]],

            [[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]],
            [[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]]
        ];

        var geometry = new THREE.Geometry();
        var midpoints = [];

        function project(v) {
            v = v.normalize().clone();
            v.index = geometry.vertices.push(v) - 1;
            return v;
        }

        // approximate a curved face with recursively sub-divided faces
        function makeFace(v1, v2, v3, uv1, uv2, uv3, matIdx, detail) {
            if (detail < 1) {
                var face = new THREE.Face3(v1.index, v2.index, v3.index, [v1.clone(), v2.clone(), v3.clone()]);
                face.centroid.add(v1).add(v2).add(v3).divideScalar(3);
                face.normal = face.centroid.clone().normalize();
                face.materialIndex = matIdx;
                geometry.faces.push(face);
                geometry.faceVertexUvs[0].push([uv1.clone(), uv2.clone(), uv3.clone()]);
            } else {
                // split face into 4 smaller faces
                detail -= 1;
                makeFace(v1, midpoint(v1, v2), midpoint(v1, v3), uv1, midpointUV(uv1, uv2), midpointUV(uv1, uv3), matIdx, detail); // top quadrant
                makeFace(midpoint(v1, v2), v2, midpoint(v2, v3), midpointUV(uv1, uv2), uv2, midpointUV(uv2, uv3), matIdx, detail); // left quadrant
                makeFace(midpoint(v1, v3), midpoint(v2, v3), v3, midpointUV(uv1, uv3), midpointUV(uv2, uv3), uv3, matIdx, detail); // right quadrant
                makeFace(midpoint(v1, v2), midpoint(v2, v3), midpoint(v1, v3), midpointUV(uv1, uv2), midpointUV(uv2, uv3), midpointUV(uv1, uv3), matIdx, detail); // center quadrant
            }
        }

        function midpointUV(uv1, uv2) {
            return new THREE.Vector2().addVectors(uv1, uv2).divideScalar(2);
        }

        function midpoint(v1, v2) {
            if (!midpoints[v1.index]) midpoints[v1.index] = [];
            if (!midpoints[v2.index]) midpoints[v2.index] = [];
            var mid = midpoints[v1.index][v2.index];
            if (mid === undefined) {
                // generate mid point and project to surface
                mid = project(new THREE.Vector3().addVectors(v1, v2).divideScalar(2));
                midpoints[v1.index][v2.index] = midpoints[v2.index][v1.index] = mid;
            }
            return mid;
        }

        var i, f, l, v, uv, uv1, uv2, uv3;

        // initial vertices
        for (i = 0, l = vertices.length; i < l; i ++) {
            v = vertices[i];
            project(new THREE.Vector3(v[0], v[1], v[2]));
        }

        // subdivided faces
        v = geometry.vertices;
        for (i = 0; i < faces.length; i++) {
            f = faces[i];
            uv = uvs[i];
            for (var j = 0; j < 3; j++) {
                uv[j] = new THREE.Vector2(uv[j][0], uv[j][1]);
            }
            makeFace(v[f[0]], v[f[1]], v[f[2]], uv[0], uv[1], uv[2], Math.floor(i/2), detail);
        }

        // apply radius
        for (i = 0, l = geometry.vertices.length; i < l; i ++) {
            geometry.vertices[i].multiplyScalar(radius);
        }

        geometry.computeFaceNormals();
        geometry.computeCentroids();
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        return geometry;
    }

    var initLng = 0.0, initLat = 0.0, initZ = 850;
    var sceneDirty = true, wantedLat = initLat, wantedLng = initLng, wantedZ = initZ;

    var mouseX = 0, mouseY = 0;
    var mouseHeld = false;

    var doingAnimationLoop = false;
    function updateScene(forceUpdate) {
        if (!doingAnimationLoop) {
            if (forceUpdate) {
                sceneDirty = true;
            }
            if (!sceneDirty && (Math.abs(wantedLat - sphere.rotation.x) > 2e-3 || Math.abs(wantedLng - sphere.rotation.y) > 2e-3 || Math.abs(wantedZ - camera.position.z) > 1e-1)) {
                sceneDirty = true;
            }
            if (sceneDirty) {
                doingAnimationLoop = true;
                requestAnimationFrame(animate);
            }
        }
    }

    function animate() {
        doingAnimationLoop = false;
        sceneDirty = false;
        render();
        if (stats !== null) {
            stats.update();
        }
        updateScene();
    }

    function render() {
        sphere.rotation.y += (wantedLng - sphere.rotation.y) * 0.04;
        sphere.rotation.x += (wantedLat - sphere.rotation.x) * 0.04;
        camera.position.z += (wantedZ - camera.position.z) * 0.06;

        galacticPlane.rotation = sphere.rotation.clone();
        galacticPlane.rotation.y -= 13.11 * Math.PI / 180;
        galacticPlane.rotation.z += 62.10 * Math.PI / 180;

        equatorialPlane.rotation = sphere.rotation.clone();
	for(var i=0; i<sourceLabels.length; i++) {
		var ra = sourceLabels[i].original[0];
		var dec = sourceLabels[i].original[1];

		var xPrime = 220*Math.cos(dec*Math.PI/180)*Math.sin(-ra*Math.PI/180 + Math.PI/2);
		var yPrime = 220*Math.sin(dec*Math.PI/180);
		var zPrime = 220*Math.cos(dec*Math.PI/180)*Math.cos(-ra*Math.PI/180 + Math.PI/2);
		var pos = new THREE.Vector3(xPrime, yPrime, zPrime);
		var rot = sphere.rotation.clone();
		
		pos.applyEuler(rot);
		sourceLabels[i].position.setX(pos.x + 5);
		sourceLabels[i].position.setY(pos.y + 200.0 + 5);
		sourceLabels[i].position.setZ(pos.z);
	}

        renderer.render(scene, camera);

        // Cas A should be at (350.86, 58.80) degrees equatorial
        var lng = (Math.PI / 2 + sphere.rotation.y) % (2 * Math.PI);
        if (lng < 0) {
            lng += 2 * Math.PI;
        }
	lng *= 180 / Math.PI;
	var lat = sphere.rotation.x * 180 / Math.PI;

        $("#coord").html('RA: ' + lng.toFixed(2) + "&deg;; Dec.:" + lat.toFixed(2) + "&deg;");
    }

    function doScroll(dx, dy) {
        var zoomFac = 2e-5 * camera.position.z;
        wantedLng += dx * zoomFac;
        wantedLat += dy * zoomFac;
        if (wantedLat < -0.6 * Math.PI) {
            wantedLat = -0.6 * Math.PI;
        } else if (wantedLat > 0.6 * Math.PI) {
            wantedLat = 0.6 * Math.PI;
        }
        updateScene();
    }

    function doZoom(amount) {
        wantedZ -= amount * wantedZ / 200;
        if (wantedZ < 210) {
            wantedZ = 210;
        }
        if (wantedZ > 1700) {
            wantedZ = 1700;
        }
        updateScene();
    }

    function windowResize(event) {
        $("#heading").css('left', window.innerWidth / 2 - $("#heading").width() / 2);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight - 4);
        xhair.position.set(window.innerWidth / 2, window.innerHeight / 2 - 2, 0);
        updateScene(true);
    }

    function mouseLeave(event) {
        mouseHeld = false;
    }

    function mouseDown(event) {
        mouseHeld = true;
    }

    function mouseUp(event) {
        mouseHeld = false;
    }

    function mouseMove(event) {
        var newMouseX = event.clientX;
        var newMouseY = event.clientY;
        if (mouseHeld) {
            doScroll(newMouseX - mouseX, newMouseY - mouseY);
        }
        mouseX = newMouseX;
        mouseY = newMouseY;
    }

    function mouseWheel(event, delta) {
        doZoom(10 * delta);
    }

    function mouseDoubleClick(event) {
        doZoom(50);
    }

    var touchPrevNumTouches = 0;
    var touchPrevDoubleDistance = null;

    function touchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            var t0 = event.touches[0];
            mouseX = t0.pageX;
            mouseY = t0.pageY;
        }
    }

    function touchEnd(event) {
        //event.preventDefault();
        if (event.touches.length !== 0) {
            // only process a touchEnd request when all touches have finished
            return;
        }
        touchPrevDoubleDistance = null;
    }

    function touchMove(event) {
        event.preventDefault();

        // turn the touch into a centre pos and an optional distance
        var t0, t1;
        var newMouseX, newMouseY;
        var centre;
        var dist;
        if (event.touches.length === 1) {
            t0 = event.touches[0];
            newMouseX = t0.pageX;
            newMouseY = t0.pageY;
            dist = null;
        } else if (event.touches.length === 2) {
            t0 = event.touches[0];
            t1 = event.touches[1];
            newMouseX = (t0.pageX + t1.pageX) / 2;
            newMouseY = (t0.pageY + t1.pageY) / 2;
            dist = Math.sqrt(Math.pow(t0.pageX - t1.pageX, 2) + Math.pow(t0.pageY - t1.pageY, 2));
        } else {
            newMouseX = mouseX;
            newMouseY = mouseY;
            dist = null;
        }

        if (event.touches.length !== touchPrevNumTouches) {
            // if the user change the number of fingers in the touch, we reset the motion variables
            touchPrevNumTouches = event.touches.length;
            touchPrevDoubleDistance = null;
        } else {
            doScroll(newMouseX - mouseX, newMouseY - mouseY);
            if (dist !== null && touchPrevDoubleDistance !== null) {
                var distDiff = dist - touchPrevDoubleDistance;
                doZoom(distDiff);
            }
        }
        mouseX = newMouseX;
        mouseY = newMouseY;
        touchPrevDoubleDistance = dist;
    }

    function keypressArrow(key) {
        if (key === 'left') {
            doScroll(-35, 0);
        } else if (key === 'right') {
            doScroll(35, 0);
        } else if (key === 'up') {
            doScroll(0, -35);
        } else if (key === 'down') {
            doScroll(0, 35);
        }
    }

    function keypressZoom(key) {
        if (key === '=') {
            doZoom(25);
        } else if (key === '+') {
            doZoom(25);
        } else if (key === '-') {
            doZoom(-25);
        }
    }

    function keypressLetter(key) {
        if (key === 'r') {
            wantedLat = initLat;
            wantedLng = initLng;
            wantedZ = initZ;
            updateScene();
        } else if (key == 'g') {
            toggleGalacticPlane();
        } else if (key == 'e') {
            toggleEquatorialPlane();
        } else if (key == 'x') {
            toggleCrosshair();
        }
    }

    function keypressDebug(key) {
        var i;
        if (key == 'd w') {
            for (i = 0; i < lfsMaterials.length; i++) {
                lfsMaterials[i].wireframe = !lfsMaterials[i].wireframe;
            }
        } else if (key == 'd f') {
            if (sqfaceTexture === null) {
                sqfaceTexture = THREE.ImageUtils.loadTexture('img/sqface.png');
                sqfaceTexture.magFilter = THREE.NearestFilter;
            }
            for (i = 0; i < lfsMaterials.length; i++) {
                lfsMaterials[i].map = sqfaceTexture;
            }
        } else if (key.indexOf('d s') === 0) {
            var p = sphere.position.clone();
            var r = sphere.rotation.clone();
            scene.remove(sphere);
            sphere = new THREE.Mesh(myGeom(200, parseInt(key[4], 10)), materials);
            sphere.position = p;
            sphere.rotation = r;
            scene.add(sphere);
        }
        updateScene(true);
    }

    var channelPrefix = 'lwa74';

    function reloadChannel() {
        var tex = THREE.ImageUtils.loadTexture('/tiles/' + channelPrefix + '/' + channelPrefix + '.png');
        tex.magFilter = THREE.NearestFilter;
        lfsMaterials[0].map = tex;
        updateScene(true);
    }

    function changeChannel(chanSpan) {
        $("#channel .switch").removeClass('active');
        chanSpan.addClass('active');
        var chan = chanSpan.text();
        if (chan === 'LFS') {
            channelPrefix = 'lwa74';
        } else if (chan === '38') {
            channelPrefix = 'lwa38';
        } else if (chan === '60') {
            channelPrefix = 'lwa60';
        } else if (chan === '74') {
            channelPrefix = 'lwa74';
	}
        reloadChannel();
    }

    function toggleGalacticPlane() {
        galacticPlane.visible = $("#toggle .galactic").toggleClass('active').hasClass('active');
        updateScene(true);
    }

    function toggleEquatorialPlane() {
        equatorialPlane.visible = $("#toggle .equatorial").toggleClass('active').hasClass('active');
        updateScene(true);
    }

    function toggleCrosshair() {
        xhair.visible = $("#toggle .xhair").toggleClass('active').hasClass('active');
        updateScene(true);
    }
    
    function toggleLabels() {
	var newState = $("#toggle .labels").toggleClass('active').hasClass('active');
	for(var i=0; i<sourceLabels.length; i++) {
		sourceLabels[i].visible = newState;
	}
	updateScene(true);
    }

    function makeTextSprite(message, parameters) {
        // http://stemkoski.github.io/Three.js/Topology-Data.html
	if ( parameters === undefined ) parameters = {};
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters["fontface"] : "Arial";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters["fontsize"] : 18;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters["borderThickness"] : 4;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	var spriteAlignment = THREE.SpriteAlignment.topLeft;

	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;
	
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);
	
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas) 
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture, useScreenCoordinates: false, alignment: spriteAlignment } );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(100,50,1.0);
	return sprite;	
}

    // function for drawing rounded rectangles
    function roundRect(ctx, x, y, w, h, r) {
	// http://stemkoski.github.io/Three.js/Topology-Data.html
	ctx.beginPath();
	ctx.moveTo(x+r, y);
	ctx.lineTo(x+w-r, y);
	ctx.quadraticCurveTo(x+w, y, x+w, y+r);
	ctx.lineTo(x+w, y+h-r);
	ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
	ctx.lineTo(x+r, y+h);
	ctx.quadraticCurveTo(x, y+h, x, y+h-r);
	ctx.lineTo(x, y+r);
	ctx.quadraticCurveTo(x, y, x+r, y);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();   
   }

    var global = {};

    global.main = function () {
        $("#heading").css('left', window.innerWidth / 2 - $("#heading").width() / 2);

        $("#aboutlink").toggle(
                function () {
                    // show more text
                    $(this).html("Close information");
                    $("#about").show();
                },
                function () {
                    // hide more text
                    $(this).html("Information");
                    $("#about").hide();
                }
                );

        if (!Detector.webgl) {
            Detector.addGetWebGLMessage();
            $('body').append('<img id="lfsstatic" src="http://lwalab.phys.unm.edu/lwatv/lwatv.png" />');
            return;
        }

        var container = document.createElement('div');
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.set(0, 200, 1800);

        scene = new THREE.Scene();

        // initial texture for the sphere
	lfsMaterials = [];
	var tex = THREE.ImageUtils.loadTexture("/tiles/lwa74/lwa74.png");
	lfsMaterials.push(new THREE.MeshLambertMaterial({map:tex, color:0xffffff, ambient:0x777777, shading:THREE.SmoothShading}));
        materials = new THREE.MeshFaceMaterial(lfsMaterials);

        // the sphere
        sphere = new THREE.Mesh(new THREE.SphereGeometry(200, 64, 64), materials);
        sphere.position.x = 0;
        sphere.position.y = 200;
        sphere.position.z = 0;
        sphere.rotation.y = initLng + 2.5;
        sphere.rotation.x = initLat + 1.0;
        scene.add(sphere);

        // geometry and material for a circle
        var lineGeom = new THREE.Geometry();
        for (var i = 0; i <= 48; i ++) {
            var lth = i / 48 * 2 * Math.PI;
            var lx = 201 * Math.cos(lth);
            var lz = 201 * Math.sin(lth);
            lineGeom.vertices.push(new THREE.Vector3(lx, 0, lz));
        }
        var lineMat1 = new THREE.LineBasicMaterial({ color:0xFFFFFF, linewidth:2 });
	var lineMat2 = new THREE.LineDashedMaterial({ color:0xFFFFFF, linewidth:2, dashSize:4, gapSize:4 });

        // galactic plane
        galacticPlane = new THREE.Line(lineGeom, lineMat1, THREE.LineStrip);
        galacticPlane.position = sphere.position.clone();
        galacticPlane.visible = false;
        scene.add(galacticPlane);

        // equatorial plane
        equatorialPlane = new THREE.Line(lineGeom, lineMat2, THREE.LinePieces);
        equatorialPlane.position = sphere.position.clone();
        equatorialPlane.visible = false;
        scene.add(equatorialPlane);

        // crosshair
        xhair = new THREE.Sprite(new THREE.SpriteMaterial({map:THREE.ImageUtils.loadTexture('/tiles/xhair.png')}));
        xhair.position.set(window.innerWidth / 2, window.innerHeight / 2 - 2, 0);
        xhair.scale.set(61, 61, 1);
        xhair.visible = false;
        scene.add(xhair);

        // light
        var light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 0, 1).normalize();
        scene.add(light);

	// labels
	sourceLabels = [];

	var label = makeTextSprite(" Cas A ", {fontsize: 32});
	label.position = new THREE.Vector3(0.0, 0.0, -202.0);
	label.original = [350.86, 58.80];
	label.visible = false;
	scene.add(label);
	sourceLabels.push(label);
	
	var label = makeTextSprite(" Cen A ", {fontsize: 32});
	label.position = new THREE.Vector3(0.0, 0.0, -202.0);
	label.original = [201.37, -43.02];
	label.visible = false;
	scene.add(label);
	sourceLabels.push(label);
	
	var label = makeTextSprite(" Cyg A ", {fontsize: 32});
	label.position = new THREE.Vector3(0.0, 0.0, -202.0);
	label.original = [299.86, 40.73];
	label.visible = false;
	scene.add(label);
	sourceLabels.push(label);
	
	var label = makeTextSprite(" Her A ", {fontsize: 32});
	label.position = new THREE.Vector3(0.0, 0.0, -202.0);
	label.original = [252.78,  4.99];
	label.visible = false;
	scene.add(label);
	sourceLabels.push(label);
	
	var label = makeTextSprite(" Hyd A ", {fontsize: 32});
	label.position = new THREE.Vector3(0.0, 0.0, -202.0);
	label.original = [139.53, -12.10];
	label.visible = false;
	scene.add(label);
	sourceLabels.push(label);

	var label = makeTextSprite(" Tau A ", {fontsize: 32});
	label.position = new THREE.Vector3(0.0, 0.0, -202.0);
	label.original = [ 83.63,  22.01];
	label.visible = false;
	scene.add(label);
	sourceLabels.push(label);

	var label = makeTextSprite(" Vir A ", {fontsize: 32});
	label.position = new THREE.Vector3(0.0, 0.0, -202.0);
	label.original = [187.71,  12.39];
	label.visible = false;
	scene.add(label);
	sourceLabels.push(label);

        //renderer = new THREE.CanvasRenderer();
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight - 4);
        container.appendChild(renderer.domElement);

        /*
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild(stats.domElement);
        */

        // work out if we are running on a portable device
        var agent = navigator.userAgent.toLowerCase();
        var iDevice = agent.indexOf("iphone") >= 0 || agent.indexOf("ipad") >= 0 || agent.indexOf("android") >= 0;

        window.addEventListener('resize', windowResize, false);

        if (iDevice) {
            container.addEventListener('touchstart', touchStart, false);
            container.addEventListener('touchend', touchEnd, false);
            container.addEventListener('touchmove', touchMove, false);
        } else {
            $(document).mouseleave(mouseLeave);
            $(document).mousedown(mouseDown);
            $(document).mouseup(mouseUp);
            $(document).mousemove(mouseMove);
            $(document).mousewheel(mouseWheel);
            $(document).dblclick(mouseDoubleClick);

            Mousetrap.bind(['left', 'right', 'up', 'down'], function(e, key) { keypressArrow(key); });
            Mousetrap.bind(['=', '+', '-'], function(e, key) { keypressZoom(key); });
            Mousetrap.bind(['r', 'g', 'e', 'x'], function(e, key) { keypressLetter(key); });
            Mousetrap.bind(['d w', 'd f', 'd s 0', 'd s 1', 'd s 2', 'd s 3', 'd s 4'], function(e, key) { keypressDebug(key); });
        }

        $("#channel .switch").removeClass('active');
        $("#channel .lfs").addClass('active');
        $("#channel .switch").click(function(event) { changeChannel($(this)); });

        $("#toggle .galactic").click(function(event) { toggleGalacticPlane(); });
        $("#toggle .equatorial").click(function(event) { toggleEquatorialPlane(); });
	$("#toggle .labels").click(function(event) { toggleLabels(); });
        $("#toggle .xhair").click(function(event) { toggleCrosshair(); });

        setInterval(function() { updateScene(true); }, 1000); // update every second for slow loading images
        updateScene(true);
    };

    return global;
}(jQuery));

$(document).ready(MAIN.main);
