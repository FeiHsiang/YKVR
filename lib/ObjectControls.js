/* --------------------------------------------------------
THREE.ObjectControls
version: 1.1
author: Alberto Piras
email: a.piras.ict@gmail.com
github: https://github.com/albertopiras
license: MIT
----------------------------------------------------------*/

/**
 * THREE.ObjectControls
 * @constructor
 * @param camera - The camera.
 * @param domElement - the renderer's dom element
 * @param objectToMove - the object to control.
 */

THREE.ObjectControls = function( domElement, objectToMove) {
	mesh = objectToMove;
	domElement = (domElement !== undefined) ? domElement : document;

	this.setObjectToMove = function(newMesh) {
		mesh = newMesh;
	};

	this.setDistance = function(min, max) {
		minDistance = min;
		maxDistance = max;
	};

	this.setZoomSpeed = function(newZoomSpeed) {
		zoomSpeed = newZoomSpeed;
	};

	this.setRotationSpeed = function(newRotationSpeed) {
		rotationSpeed = newRotationSpeed;
	};

	this.setRotationSpeedTouchDevices = function(newRotationSpeed) {
		rotationSpeedTouchDevices = newRotationSpeed;
	};

	this.enableVerticalRotation = function() {
		verticalRotationEnabled = true;
	};

	this.disableVerticalRotation = function() {
		verticalRotationEnabled = false;
	};

	this.enableHorizontalRotation = function() {
		horizontalRotationEnabled = true;
	};

	this.disableHorizontalRotation = function() {
		horizontalRotationEnabled = false;
	};

	this.setMaxVerticalRotationAngle = function(min, max) {
		MAX_ROTATON_ANGLES.x.from = min;
		MAX_ROTATON_ANGLES.x.to = max;
		MAX_ROTATON_ANGLES.x.enabled = true;
	};

	this.setMaxHorizontalRotationAngle = function(min, max) {
		MAX_ROTATON_ANGLES.y.from = min;
		MAX_ROTATON_ANGLES.y.to = max;
		MAX_ROTATON_ANGLES.y.enabled = true;
	};

	this.disableMaxHorizontalAngleRotation = function() {
		MAX_ROTATON_ANGLES.y.enabled = false;
	};

	this.disableMaxVerticalAngleRotation = function() {
		MAX_ROTATON_ANGLES.x.enabled = false;
	};

	/** Mouse Interaction Controls (rotate & zoom, desktop **/
	// Mouse - move
	domElement.addEventListener('mousedown', mouseDown, false);
	domElement.addEventListener('mousemove', mouseMove, false);
	domElement.addEventListener('mouseup', mouseUp, false);

	// Mouse - zoom
	domElement.addEventListener('wheel', wheel, false);


	/** Touch Interaction Controls (rotate & zoom, mobile) **/
	// Touch - move
	domElement.addEventListener('touchstart', onTouchStart, false);
	domElement.addEventListener('touchmove', onTouchMove, false);
	domElement.addEventListener('touchend', onTouchEnd, false);

//[start-20190709-fei0069-add]//
	////// prevent the right mouse menu
	domElement.addEventListener( 'contextmenu', onContextMenu, false );
	function onContextMenu( event ) {
		event.preventDefault();
	}
//[end---20190709-fei0069-add]//

	/********************* controls variables *************************/

	var MAX_ROTATON_ANGLES = {
		x: {
		// Vertical from bottom to top.
		enabled: false,
		from: Math.PI / 8,
		to: Math.PI / 8
		},
		y: {
		// Horizontal from left to right.
		enabled: false,
		from: Math.PI / 4,
		to: Math.PI / 4
		}
	};

	/**
	 * RotationSpeed
	 * 1= fast
	 * 0.01 = slow
	 * */
	var maxDistance = 15, minDistance = 6, zoomSpeed = 0.5, rotationSpeed = 0.05,
		rotationSpeedTouchDevices = 0.05, verticalRotationEnabled = false,
		horizontalRotationEnabled = true;

	var mouseFlags = {MOUSEDOWN: 0, MOUSEMOVE: 1};

	var flag;
	var isDragging = false;
//[start-20190709-fei0069-add]//
	var isPanning = false;
//[end---20190709-fei0069-add]//
	var previousMousePosition = {x: 0, y: 0};

	/**
	 * CurrentTouches
	 * length 0 : no zoom
	 * length 2 : is zoomming
	 */
	var currentTouches = [];

	var prevZoomDiff = {X: null, Y: null};

	/***************************** shared functions **********************/

	// function zoomIn() {
	//   	camera.position.z -= zoomSpeed;
	// }

	// function zoomOut() {
	// 	camera.position.z += zoomSpeed;
	// }
	
	function scalePlus() {
		// mesh.scale.addScalar( 0.1 );
		mesh.scale.multiplyScalar ( 1.1 );

  	}

  	function scaleMinus() {
		// mesh.scale.addScalar( -0.1 );
		mesh.scale.multiplyScalar ( 0.9 );

  	}

	/**
	 * @description Checks if the rotation in a specific axe is within the maximum
	 * values allowed.
	 * @param delta is the difference of the current rotation angle and the
	 *     expected rotation angle
	 * @param axe is the axe of rotation: x(vertical rotation), y (horizontal
	 *     rotation)
	 * @return true if the rotation with the new delta is included into the
	 *     allowed angle range, false otherwise
	 */
	function isWithinMaxAngle(delta, axe) {
		if (MAX_ROTATON_ANGLES[axe].enabled) {
			var condition = ((MAX_ROTATON_ANGLES[axe].from * -1) < (mesh.rotation[axe] + delta)) && ((mesh.rotation[axe] + delta) < MAX_ROTATON_ANGLES[axe].to);
			return condition ? true : false;
		}
		return true;
	}

	function resetMousePosition() {
		previousMousePosition = {x: 0, y: 0};
	}

	/******************  MOUSE interaction functions - desktop  *****/
	function mouseDown(e) {

//[start-20190705-fei0069-add]//
		scope.dispatchEvent( { type: 'mouseDown' } );
		switch ( event.button ) {

			case scope.mouseButtons.LEFT:
				isDragging = true;
				flag = mouseFlags.MOUSEDOWN;

				break;
			case scope.mouseButtons.RIGHT:
				// console.log("objectControls: mouseDown RIGHT");
				isPanning = true;
				panStart.set( event.clientX, event.clientY );
				break;
		}
//[end---20190705-fei0069-add]//

	}
	

	function mouseMove(e) {

		if (isDragging) {

			var deltaMove = {
				x: e.offsetX - previousMousePosition.x,
				y: e.offsetY - previousMousePosition.y
			};

			previousMousePosition = {x: e.offsetX, y: e.offsetY};

			if (horizontalRotationEnabled && deltaMove.x != 0)
			// && (Math.abs(deltaMove.x) > Math.abs(deltaMove.y))) {
			// enabling this, the mesh will rotate only in one specific direction
			// for mouse movement
			{
				if (!isWithinMaxAngle(Math.sign(deltaMove.x) * rotationSpeed, 'y'))
				return;
				// mesh.rotation.y -= Math.sign(deltaMove.x) * rotationSpeed; //// 20190709 Fei: make plus to minux
				// mesh.rotateY( 1 * Math.sign(deltaMove.x) * rotationSpeed );
				mesh.rotateOnWorldAxis ( new THREE.Vector3(0, 0, 1), 1 * Math.sign(deltaMove.x) * rotationSpeed);

				flag = mouseFlags.MOUSEMOVE;
			}

			if (verticalRotationEnabled && deltaMove.y != 0)
			// &&(Math.abs(deltaMove.y) > Math.abs(deltaMove.x)) //
			// enabling this, the mesh will rotate only in one specific direction for
			// mouse movement
			{
				if (!isWithinMaxAngle(Math.sign(deltaMove.y) * rotationSpeed, 'x'))
				return;
				// mesh.rotation.x += Math.sign(deltaMove.y) * rotationSpeed;
				// mesh.rotateX(  -1 * Math.sign(deltaMove.y) * rotationSpeed);
				mesh.rotateOnWorldAxis ( new THREE.Vector3(1, 0, 0), 1 * Math.sign(deltaMove.y) * rotationSpeed);

				flag = mouseFlags.MOUSEMOVE;
			}
		}
//[start-20190709-fei0069-add]//
		else if (isPanning){
			////// pan(translation) part
			panEnd.set( event.clientX, event.clientY );
			panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
			// console.log("onTouchMove: panDelta = ", panDelta );
			mesh.position.x += panDelta.x;
			mesh.position.z -= panDelta.y; //// the coordinate of object ..?
			panStart.copy( panEnd );
		}
//[end---20190709-fei0069-add]//

	}

	function mouseUp(e) {
		isDragging = false;
		isPanning = false;
		resetMousePosition();
		// e.preventDefault(); ////// 20190709 Fei remove it
	}

	function wheel(e) {
		var delta = e.wheelDelta ? e.wheelDelta : e.deltaY * -1;


		// if (delta > 0 && camera.position.z > minDistance) {
		if (delta > 0 ) {
			// zoomIn();
			scalePlus();

		// } else if (delta < 0 && camera.position.z < maxDistance) {
		} else if (delta < 0 ) {
			// zoomOut();
			scaleMinus();


		}
	}
	/****************** TOUCH interaction functions - mobile  *****/

	function onTouchStart(e) {
//[start-20190705-fei0069-add]//
		// console.log("ObjectControls: onTouchStart: e.touches[0]  = ", e.touches[0].clientX );
		scope.dispatchEvent( { type: 'onTouchStart' } );
//[end---20190705-fei0069-add]//
		// e.preventDefault(); ////// 20190709 Fei remove it

		flag = mouseFlags.MOUSEDOWN;
		if (e.touches.length === 2) {
			prevZoomDiff.X = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
			prevZoomDiff.Y = Math.abs(e.touches[0].clientY - e.touches[1].clientY);
			currentTouches = new Array(2);

//[start-20190708-fei0069-add]//
			////// the pan( translation ) evnet.
			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );
			panStart.set( x, y );
//[end---20190708-fei0069-add]//

		} else {
			previousMousePosition = {x: e.touches[0].pageX, y: e.touches[0].pageY};
		}
	}

	function onTouchEnd(e) {
		// console.log("ObjectControls: touchend event");

		prevZoomDiff.X = null;
		prevZoomDiff.Y = null;

		/* If you were zooming out, currentTouches is updated for each finger you
		* leave up the screen so each time a finger leaves up the screen,
		* currentTouches length is decreased of a unit. When you leave up both 2
		* fingers, currentTouches.length is 0, this means the zoomming phase is
		* ended.
		*/
		if (currentTouches.length > 0) {
			currentTouches.pop();
		} else {
			currentTouches = [];
		}
		
		// e.preventDefault(); ////// 20190709 Fei remove it 

		if (flag === mouseFlags.MOUSEDOWN) {
			// TouchClick
			// You can invoke more other functions for animations and so on...
		} else if (flag === mouseFlags.MOUSEMOVE) {
			// Touch drag
			// You can invoke more other functions for animations and so on...
		}
		resetMousePosition();
	}

//[start-20190705-fei0069-add]//
	var scope = this;
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var panOffset = new THREE.Vector3();


	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();
	this.panSpeed = 1.0;
	this.mouseButtons = { LEFT: THREE.MOUSE.LEFT, MIDDLE: THREE.MOUSE.MIDDLE, RIGHT: THREE.MOUSE.RIGHT };

//[end---20190705-fei0069-add]//

	function onTouchMove(e) {

//[start-20190705-fei0069-add]//
		// scope.dispatchEvent({type:'onTouchMove'});
//[end---20190705-fei0069-add]//

		e.preventDefault();
		flag = mouseFlags.MOUSEMOVE;
		// Touch zoom.
		// If two pointers are down, check for pinch gestures.
		if (e.touches.length === 2) {
			currentTouches = new Array(2);
			// Calculate the distance between the two pointers.
			var curDiffX = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
			var curDiffY = Math.abs(e.touches[0].clientY - e.touches[1].clientY);
			var distance = Math.sqrt( curDiffX * curDiffX + curDiffY * curDiffY );

			if (prevZoomDiff && prevZoomDiff.X > 0 && prevZoomDiff.Y > 0) {
				var prevDistance = Math.sqrt( prevZoomDiff.X * prevZoomDiff.X + prevZoomDiff.Y * prevZoomDiff.Y );

				// console.log("ObjectControls: onTouchMove: distance=", distance, ", prevDistance=", prevDistance);

				if ( distance >  prevDistance + 2 )  {
					scalePlus();
				} else if ( distance < prevDistance - 2 ) {
					scaleMinus();
				}

			}
			// Cache the distance for the next move event.
			prevZoomDiff.X = curDiffX;
			prevZoomDiff.Y = curDiffY;

//[start-20190708-fei0069-add]//
			////// pan(translation) part
			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );
			panEnd.set( x, y );
			panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
			// console.log("onTouchMove: panDelta = ", panDelta );
			
			mesh.position.x += panDelta.x;
			mesh.position.z -= panDelta.y; //// the coordinate of object ..?

			panStart.copy( panEnd );

//[end---20190708-fei0069-add]//

		// Touch Rotate.
//[start-20190708-fei0069-mod]//
		// } else if (currentTouches.length === 0) { //// origin,
		} else if ( e.touches.length === 1) { //// fei, one finger event, pan(rotation)
//[end---20190708-fei0069-mod]//
			prevZoomDiff.X = null;
			prevZoomDiff.Y = null;
			var deltaMove = {
				x: e.touches[0].pageX - previousMousePosition.x,
				y: e.touches[0].pageY - previousMousePosition.y
			};
			previousMousePosition = {x: e.touches[0].pageX, y: e.touches[0].pageY};

			// console.log("ObjectControls: onTouchMove: rotation: deltaMove.xy=", deltaMove.x, deltaMove.y );

			// if (horizontalRotationEnabled && deltaMove.x != 0) {
			if (horizontalRotationEnabled && Math.abs(deltaMove.x) > 0.001 ) {
				if (!isWithinMaxAngle(
						Math.sign(deltaMove.x) * rotationSpeedTouchDevices, 'y'))
				return;
				// mesh.rotation.y -= Math.sign(deltaMove.x) * rotationSpeedTouchDevices; ////20190709 Fei: make plus to minux
				// mesh.rotateY(  1 * Math.sign(deltaMove.x) * rotationSpeedTouchDevices);
				mesh.rotateOnWorldAxis ( new THREE.Vector3(0, 0, 1), 1 * Math.sign(deltaMove.x) * rotationSpeedTouchDevices);
			}

			// if (verticalRotationEnabled && deltaMove.y != 0) {
			if (verticalRotationEnabled && Math.abs(deltaMove.y) > 0.001 ) {
				if (!isWithinMaxAngle(
						Math.sign(deltaMove.y) * rotationSpeedTouchDevices, 'x'))
				return;
				// mesh.rotation.x += Math.sign(deltaMove.y) * rotationSpeedTouchDevices;
				// mesh.rotateX(  -1 * Math.sign(deltaMove.y) * rotationSpeedTouchDevices);
				mesh.rotateOnWorldAxis ( new THREE.Vector3(1, 0, 0), 1 * Math.sign(deltaMove.y) * rotationSpeedTouchDevices); // rotate by world
			}
		}
	}

//[start-20190709-fei0069-add]//
	// var panLeft = function () {
	// 	var v = new THREE.Vector3();
	// 	return function panLeft( distance, objectMatrix ) {
	// 		v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
	// 		v.multiplyScalar( - distance );
	// 		panOffset.add( v );
	// 	};
	// }();

	// var panUp = function () {

	// 	var v = new THREE.Vector3();

	// 	return function panUp( distance, objectMatrix ) {
	// 		if ( scope.screenSpacePanning === true ) {
	// 			v.setFromMatrixColumn( objectMatrix, 1 );
	// 		} else {
	// 			v.setFromMatrixColumn( objectMatrix, 0 );
	// 			v.crossVectors( scope.object.up, v );
	// 		}
	// 		v.multiplyScalar( distance );
	// 		panOffset.add( v );
	// 	};
	// }();

//[end---20190709-fei0069-add]//

};

THREE.ObjectControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.ObjectControls.prototype.constructor = THREE.ObjectControls;


