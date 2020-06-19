////// developVR 20191021 
(function() {
	
	var integrate = function(){


		AFRAME.registerComponent('initvrscene', {
			init: function () {
				var sceneEl = this.el;
			}
		});
	
		// AFRAME.registerComponent('cursor-listener', {
		// 	init: function () {
		// 		//20191023-start-thonsha-mod

		// 		// this.el.addEventListener( 'touchend', endEvent, false );
		// 		// this.el.addEventListener( 'mouseup', endEvent, false );
		// 		this.el.addEventListener( 'click', clickEvent, false );
		// 		this.el.addEventListener( 'fusing', fusingEvent, false );

		// 		function fusingEvent(event){
		// 			event.preventDefault();
		// 			if (event.target == event.currentTarget){
		// 				// console.log('I was fusing, this.object3D = ', this.object3D , event );
		// 				if (this.object3D.behav){
		// 					delay = this.object3D.behav[0].display*1000+5;
		// 					// console.log("======= delay :"+delay+" =====");
		// 					let cursor = document.getElementById("cursor_main");
		// 					cursor.setAttribute('cursor', "fuseTimeout:"+ delay);
		// 					cursor.setAttribute('animation__mouseenter', "dur: "+delay );
		// 				}
		// 			}
					

		// 		}	

		// 		function clickEvent( event ) {
		// 			console.log('I was clicked, this.object3D = ', this.object3D , event );
		// 			event.preventDefault();
					
		// 			if (event.target == event.currentTarget){
		// 				// console.log('I was clicked, this.object3D = ', this.object3D , event );
						
		// 				if ( this.object3D.behav ){
		// 					let reset = false;
		// 					for(let i=0;i<this.object3D.behav.length;i++){
		// 						if (this.object3D.behav[i].simple_behav == "CloseAndResetChildren"){
		// 							reset = true;
		// 						}
		// 					}

		// 					for(let i=0;i<this.object3D.behav.length;i++){
		// 						if (this.object3D.behav[i].simple_behav != "CloseAndResetChildren"){
		// 							vrController.triggerEvent( this.object3D.behav[i], reset );
		// 						}
		// 					}
							
		// 				}
		// 			}
		// 		}
				
		// 		//20191023-end-thonsha-mod

		// 	}
		// });
	
		var VRController = function(){
			//// scene 2D part
			this.GLRenderer = null;
			this.scene2D = null;
			this.camera2D = null;
			this.light = null;
	
			//// MAKAR part
			this.vrScene = null;
			this.publishVRProjs = null;
			this.VRSceneResult = null;
			this.makarVRscenes = {};

			this.makarObjects = [];

			this.objectControlState = null; //// 0: nothing, 1:mousedown/touchstart, 2: mousemove/touchmove, 3: mouseup/touchend.
			this.controlObject = null; //// for control object
			this.emptyObject = new THREE.Object3D(); //// create the empty object for memory control

//20200528-thonsha-add-start
			// this.cubeCamera = null;
			// this.cubeRenderTarget = new THREE.WebGLRenderTargetCube( 256, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } );
//20200528-thonsha-add-end

			//// for update
			this.FUNCTION_ENABLED = false;
			this.clock = new THREE.Clock();
			this.delta = this.time = 0;

			//// for sky - video
			this.isShowSky = false;
			this.currentSceneIndex = null;

		}
	
		VRController.prototype.setupFunction = function(){
			if (this.FUNCTION_ENABLED) {
				return;
			}
			// console.log("VRFunc.js: VRController: setupFunction");
			this.FUNCTION_ENABLED = true;
			var self = this;
	
			this.loadAssets = function(index){
				let assets = document.createElement("a-assets");
				assets.setAttribute('id', "makarAssets" );
				assets.setAttribute('timeout', "100" );
				self.vrScene.appendChild(assets);
				self.makarObjects.push( assets );
			};
			//////
			////// load the nth scene in specific prroject
			////// At first, will called for load the first scene. 
			this.loadScene = function(projIndex, sceneIndex) {
				console.log("VRFunc.js: VRController: _loadScene: [projectIndex, sceneIndex]=", projIndex, sceneIndex, self.VRSceneResult[projIndex].scenes[sceneIndex]);

				if (self.VRSceneResult[projIndex].scenes[sceneIndex] == undefined ){
					console.log("VRFunc.js: VRController: _loadScene: error, [valid sceneIndex]=", self.VRSceneResult[projIndex].scenes.length, sceneIndex);
				}else{

					if (self.makarObjects){ //// clean the additional object( without default object like, camera, cursor,  )
						for (let i = 0; i < self.makarObjects.length; i++ ){

							let makarObject = self.makarObjects[i];
							// makarObject.parentNode.removeChild( makarObject ); // this will remove the children, childNodes and object3D's children
							makarObject.remove();

						}
						self.makarObjects.length = 0; // clean the array.
					}
					//// 假如場景名稱含有 "@nv@" 則開背景相機，同時設定 isShowSky, 讓loading GLTF 時候可以判斷該不該 load 環景圖
					if ( self.VRSceneResult[projIndex].scenes[sceneIndex].scene_name.includes("@nv@")  ){
						for (let i in self.scene2D.children ){
							if (self.scene2D.children[i].videoBackground && self.scene2D.children[i].visible == false ){
								self.scene2D.children[i].visible = true;
							}
						}
						self.isShowSky = false;
					}else{
						self.isShowSky = true;
					}

					self.loadAssets(); //// for video elements
					self.loadSceneObjects(projIndex, sceneIndex);
					setTimeout( function(){

						self.currentSceneIndex = sceneIndex;
						if ( self.isShowSky ){
							self.loadSky(projIndex, sceneIndex);
						}
						// if ( self.VRSceneResult[projIndex].scenes[sceneIndex].scene_name.includes("@nv@")  ){
						// 	for (let i in self.scene2D.children ){
						// 		if (self.scene2D.children[i].videoBackground && self.scene2D.children[i].visible == false ){
						// 			self.scene2D.children[i].visible = true;
						// 		}
						// 	}
						// 	self.isShowSky = false;
						// }else{
						// 	self.loadSky(projIndex, sceneIndex);
						// 	self.isShowSky = true;
						// }
						
						// self.loadSky(projIndex, sceneIndex);

					}, 500 );
					
				}
			}


	////// load the sky, 360 image/video
			this.loadSky = function( projIndex, sceneIndex ){
				// console.log("VRFunc.js: loadSky: main type=", VRSceneResult[projIndex].scenes[0].scene_skybox_main_type, VRSceneResult[projIndex].scenes[0].scene_skybox_url);
				// scene_skybox_main_type: "spherical_video"
				
				switch ( self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_main_type ){
					case "spherical_image":
					case "image":
						var aSky = document.createElement('a-sky');
						if(self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url == "DefaultResource/Spherical_Image/SphericalImage.png"){
							self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/Spherical_Image/SphericalImage.png"
						}

						aSky.setAttribute("material", {"src": self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url }); 

						aSky.setAttribute("radius", 2000 ); // if not set this, will be infinite
						aSky.setAttribute('id', "sky" );
						self.vrScene.appendChild(aSky);
						self.makarObjects.push( aSky );

						break;
	
					case "spherical_video":
						////// a-assets
						let assets = document.getElementById("makarAssets");
						
						////// mp4 video 
						var aSky = document.createElement('a-videosphere');
						// aSky.setAttribute("src", self.VRSceneResult[projIndex].scenes[0].scene_skybox_url ); //  this is work, but hard to control the tag

						let skyVideo = document.createElement("video");
						skyVideo.src = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url;  
						skyVideo.playsInline = true;
						skyVideo.autoplay = true;
						skyVideo.setAttribute('crossorigin', 'anonymous');
						// skyVideo.setAttribute('id', 'skyVideo');
						skyVideo.setAttribute('id', self.VRSceneResult[projIndex].scenes[sceneIndex].scene_id );

						// skyVideo.play(); // play pause
						skyVideo.setAttribute("autoplay", "true" ); 
						// skyVideo.setAttribute("loop", "true" ); 
	
						assets.appendChild(skyVideo); ////// add video into a-assets
						// aSky.setAttribute("src", "#skyVideo" );  
						aSky.setAttribute("src", "#"+self.VRSceneResult[projIndex].scenes[sceneIndex].scene_id ); // 

	
						aSky.setAttribute("radius", 2000 ); // if not set this, will be infinite
						aSky.setAttribute('id', "sky" );
						
						self.vrScene.appendChild(aSky);
						self.makarObjects.push( aSky );
						console.log("VRFunc.js: _loadSky: aSky=", aSky );
						break;

				}
			};
			//////
			////// load all object in the scene
			//////
			this.loadSceneObjects = function( projIndex, sceneIndex ){
				if (!userProjResDict){
					console.log("%cVRFunc.js: _loadSceneObjects: error userProjResDict not exist, return -1", "color:red");
					return -1;
				}
				//20191029-start-thonsha-mod
				
				// let scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs;
				let scene_objs;
				console.log("VRFunc.js: _loadSceneObjects: self.VRSceneResult[projIndex]=", projIndex, sceneIndex, self.VRSceneResult[projIndex] );
				var editor_version ;
				if (typeof(self.VRSceneResult[projIndex].editor_ver) != "string" ){
					console.log("VRFunc.js: _loadSceneObjects: the editor_ver is not string, error and return ");
					return -1;
				}else{
					editor_version = self.VRSceneResult[projIndex].editor_ver.split(".");
				}

				if ( self.VRSceneResult[projIndex].editor_ver == "" ){
					////// the empty editor_ver , do version below 3.0.6 
					if ( !Array.isArray(self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs ) ){
						console.log("VRFunc.js: _loadSceneObjects the scene_objs_v2 is not Array, error", self.VRSceneResult[projIndex].scenes[sceneIndex] );
						return -1;
					}
					scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs;

				}else if ( editor_version[0] == 3 && editor_version[1] == 0 && editor_version[2] <= 6  ){
					////// the version below 3.0.6, before about 2020 03 
					if ( !Array.isArray(self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs ) ){
						console.log("VRFunc.js: _loadSceneObjects the scenes[sceneIndex] is not Array, error", self.VRSceneResult[projIndex].scenes[sceneIndex] );
						return -1;
					}
					scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs;
				} else if ((editor_version[0] == 3 && editor_version[1] == 0 && editor_version[2] >= 7) || (editor_version[0] >= 3 && editor_version[1] >= 0 ) ){
					////// the version below 3.0.5, before about 2020 03 
					console.log("VRFunc.js: _loadSceneObjects: the editor version after 3.0.7", self.VRSceneResult[projIndex].scenes[sceneIndex] );
					scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].objs;
				}else{
					//// the unknown version do version above 3.0.6 
					scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs;

				}



				for (let i = 0; i < scene_objs.length ; i++  ){
					// console.log("VRFunc.js: _loadSceneObjects: obj=", self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs[i] );
					// obj_parent = null;
					// if (scene_objs[i].obj_parent_id){
					// 	for (j = 0; j < scene_objs.length; j++){
					// 		if(scene_objs[i].obj_parent_id == scene_objs[j].obj_id){
					// 			obj_parent = scene_objs[j];
					// 		}
					// 	}
					// }
				//20191029-end-thonsha-mod
					let position = new THREE.Vector3().fromArray(scene_objs[i].transform[0].split(",").map(function(x){return Number(x)}) );
					let rotation = new THREE.Vector3().fromArray(scene_objs[i].transform[1].split(",").map(function(x){return Number(x)}) );
					let scale    = new THREE.Vector3().fromArray(scene_objs[i].transform[2].split(",").map(function(x){return Number(x)}) );
					
					switch( scene_objs[i].main_type ){
						case "camera":
							let camera_cursor = document.getElementById( "camera_cursor" );
							// camera_cursor.setAttribute("randomN", Math.random() ); ////// it is work

							// camera_cursor.setAttribute("rotation", { x: 0 , y: 180, z: 0 } ); ////// it is work
							// rotation = new THREE.Vector3( 0 , 180 , 0 ); ////// set for test
							rotation.multiply( new THREE.Vector3(-1,-1,0) ).add( new THREE.Vector3(0, 180, 0) ); //// because the makar editor coordinate
							
							camera_cursor.setAttribute("rotation", rotation ); ////// it is work
							camera_cursor.setAttribute("position", position ); ////// it is work

							//// reset the aCamera 
 							if (aCamera.components["look-controls"].yawObject && aCamera.components["look-controls"].pitchObject){
								aCamera.components["look-controls"].yawObject.rotation.set(0,0,0)
								aCamera.components["look-controls"].pitchObject.rotation.set(0,0,0)
							}

							// camera_cursor.object3D.rotation.set( 0, 180 * Math.PI/180 , 0 , "YXZ" ); ///// actually, looks control will control this object3D, but I cant modify it directly..  
							console.log("VRFunc.js: _loadSceneObjects: camera: ", i, scene_objs[i], position, rotation );							

							// this.setTransform( camera_cursor,
							// 	position, rotation, scale
							// );
							
							break;
						case "image":

							let obj = scene_objs[i];
							// console.log("VRFunc.js: _loadSceneObjects: image: ", i, scene_objs[i] );
							if (userProjResDict[ obj.res_id ] ){
								// console.log("VRFunc.js: _loadSceneObjects: image res_url", i, obj.res_url, userProjResDict[obj.res_id].res_url  );
								if ( obj.res_url == userProjResDict[obj.res_id].res_url ){
									// console.log("%cVRFunc.js: _loadSceneObjects: image res_url is same as userProjResDict", "color:blue"   );
									// console.log("%cVRFunc.js: _loadSceneObjects: image res_url is same as userProjResDict", "color:blue" , obj  );

									self.loadTexture(obj, position, rotation, scale );

								}else{
									console.log("%cVRFunc.js: _loadSceneObjects: image res_url is different from userProjResDict!", "color:red" , i , obj, userProjResDict[obj.res_id] );	
								}
							}else{
								console.log("%cVRFunc.js: _loadSceneObjects: image res_id not exist!", "color:red" , i );	
								
								switch(obj.res_id){
									case "MakAR_Call":
										obj.res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/MakAR_Call.png";
										break;
									case "MakAR_Room": 
										obj.res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/MakAR_Room.png";
										break;
									case "MakAR_Mail": 
										obj.res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/MakAR_Mail.png";
										break;
									case "Line_icon":
										obj.res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/Line_icon.png";
										break;
									case "FB_icon":
										obj.res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/FB_icon.png";
										break;
									default:
										console.log("image: default, obj=", window.sceneResult[i].data.scene_objs_v2[j]);
								}

								self.loadTexture(obj, position, rotation, scale );
							
							}

							break;
							
						//20191204-start-thonsha-add
						case "text":
							self.loadText( scene_objs[i] , position, rotation, scale);
							break;

						//20191204-end-thonsha-add
						
						//20191105-start-thonsha-add
						case "audio":

							if ((scene_objs[i].sub_type == "mp3" || scene_objs[i].sub_type == "wav" || scene_objs[i].sub_type == "ogg" ) && scene_objs[i].res_url){
								self.loadAudio(scene_objs[i]);
							}

							break;

						//20191105-end-thonsha-add

						case "video":

							// console.log("VRFunc.js: _loadSceneObjects: video, scene_objs=", scene_objs[i] );
							if ( scene_objs[i].sub_type == "mp4" && scene_objs[i].res_url  ){
								self.loadVideo( scene_objs[i] , position, rotation, scale );
							}

							break;

						case "model":

							////// check by user resource 
							console.log("VRFunc.js: _loadSceneObjects: model", i, scene_objs[i]  );
							if ( userProjResDict[ scene_objs[i].res_id ]  ){
								// console.log("VRFunc.js: _loadSceneObjects: model from user resource");
								scene_objs[i].res_url = userProjResDict[scene_objs[i].res_id].res_url ;
							} else if ( userOnlineResDict[ scene_objs[i].res_id ] ) { 
								// console.log("VRFunc.js: _loadSceneObjects: model from online resource" , userOnlineResDict[scene_objs[i].res_id].res_url );
								scene_objs[i].res_url = userOnlineResDict[scene_objs[i].res_id].res_url ;
							} else {
								// console.log(" __________VRFunc.js: _loadSceneObjects: model not exist");

								switch(scene_objs[i].res_id){
									case "Cube":
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/Cube.glb";
										break;
									case "Capsule":
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/Capsule.glb";
										break;
									case "Sphere":
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/Sphere.glb";
										break;
									case "ch_Bojue":
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/ch_Bojue.glb";
										break;
									case "ch_Fei":
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/ch_Fei.glb";
										break;
									case "ch_Lina":
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/ch_Lina.glb";
										break;
									case "ch_Poyuan":
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/ch_Poyuan.glb";
										break;
									case "ch_Roger":
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/ch_Roger.glb";
										break;
									default:
										
										if (scene_objs[i].res_gltf_resource){												
											break;
										}
										scene_objs[i].res_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/3D/MissingFileBox.glb";
										break;
								}
							}
							if(self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url == "DefaultResource/Spherical_Image/SphericalImage.png"){
								self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/Spherical_Image/SphericalImage.png"
							}

							let defaultGray360 = "https://mifly0makar0assets.s3-ap-northeast-1.amazonaws.com/DefaultResource/spherical_image/defaultGray2.jpg";
							if (self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_main_type == 'spherical_video'){
								self.loadGLTFModel(scene_objs[i], position, rotation, scale, "https://mifly0makar0assets.s3-ap-northeast-1.amazonaws.com/DefaultResource/spherical_image/defaultGray2.jpg" );
							}
							else{
								if (self.isShowSky){
									self.loadGLTFModel(scene_objs[i], position, rotation, scale, self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url );
								}else{
									self.loadGLTFModel(scene_objs[i], position, rotation, scale, defaultGray360 );
								}
							}
							


							// if (userProjResDict[ scene_objs[i].res_id ] ){
							// 	// console.log("VRFunc.js: _loadSceneObjects: model res_url", i, obj.res_url, userProjResDict[obj.res_id].res_url  );
							// 	//20191025-start-thonsha-mod
							// 	if (scene_objs[i].res_url == userProjResDict[scene_objs[i].res_id].res_url){
							// 		setTimeout( function(){
							// 			self.loadGLTFModel(scene_objs[i], position, rotation, scale );
							// 		}, 1 );
							// 		// self.loadGLTFModel(scene_objs[i], position, rotation, scale );
							// 	}
							// 	else if (scene_objs[i].res_url_fbx == userProjResDict[scene_objs[i].res_id].res_url_fbx ){
							// 		// console.log("%cVRFunc.js: _loadSceneObjects: model res_url_fbx is same as userProjResDict", "color:blue"   );

							// 		setTimeout( function(){
							// 			self.loadFBXModel(scene_objs[i], position, rotation, scale );
							// 		}, 1 );

							// 	}else{
							// 		console.log("%cVRFunc.js: _loadSceneObjects: model res_url_fbx is different from userProjResDict!", "color:red" , i , obj, userProjResDict[obj.res_id] );	
							// 	}
							// 	//20191025-end-thonsha-mod
							// }
							// else if(scene_objs[i].sub_type == 'gltf'){
							// 	setTimeout( function(){
							// 		self.loadGLTFModel(scene_objs[i], position, rotation, scale );
							// 	}, 5);
							// }
							
							// else{
							// 	console.log("%cVRFunc.js: _loadSceneObjects: model res_id not exist!", "color:red" , i );	
							// }
							
							break;
						
						// 20200521-thonsha-add-start

						case "light":

							self.loadLight(scene_objs[i], position, rotation, scale);
							break;

						default:
							console.log("VRFunc.js: _loadSceneObjects: default", i, scene_objs[i] );
							
					}

				}
				// console.log("VRFunc.js: loadSceneObjects: done, self.makarObjects ", self.makarObjects.length );
			}
	
			//
			// the html will use this function to load image
			// It is sad that I cant use default a-plane tag to get the image width/height 
			//
			this.loadTexture = function( obj, position, rotation, scale ){
				// console.log("VRFunc.js: VRController: loadTexture, obj=", obj, position, rotation, scale );
	
				var loader = new THREE.TextureLoader();
				loader.load(
					obj.res_url,
					function ( texture ) {
						// console.log("VRFunc.js: loadTexture: texture WH=", texture.image.width , texture.image.height );
						
						//20191111-start-thonsha-mod
						let url_spit_length = obj.res_url.split(".").length
						let imgType = obj.res_url.split(".")[url_spit_length-1]

						if (imgType == "jpg" || imgType == "jpeg" || imgType == "png"){
							var plane = document.createElement("a-plane");
						}
						else if (imgType == "gif"){
							var plane = document.createElement("a-entity")
						}
						//20191101-end-thonsha-mod

						plane.setAttribute( "id", obj.obj_id );//// fei add 
						// plane.setAttribute("makarVRIndex", i ); //// fei add
						//20191111-start-thonsha-mod
						if (imgType == "jpg" || imgType == "jpeg" || imgType == "png"){
							plane.setAttribute( "src", obj.res_url ); //// origin
						}
						// plane.setAttribute( "material", "side:double; opacity: 1.0; transparent: true; " ); //// it is work
						//20191111-end-thonsha-mod

						//20191108-start-thonsha-add

						let transparentImage = false
						if (obj.behav){
							for(let i=0;i<obj.behav.length;i++){
								if (obj.behav[i].simple_behav == "TransparentVideo" || obj.behav[i].simple_behav == "TransparentImage"){
									transparentImage = true;
									chromaKey = obj.behav[i].chromakey;
									slope = obj.behav[i].slope;
									threshold = obj.behav[i].threshold;
									transparentBehav = obj.behav[i];
									// console.log(obj.behav[i]);
								}
							}
						}

						if (transparentImage){
							let rgba = chromaKey.split(",");
							let color = new THREE.Color(parseFloat(rgba[0]),parseFloat(rgba[1]),parseFloat(rgba[2]));

							//20191127-start-thonsha-mod
							let HSV = transparentBehav.HSV.split(",");
							let keyH = parseFloat(HSV[0]);
							let keyS = parseFloat(HSV[1]);
							let keyV = parseFloat(HSV[2]);

							if (imgType == "jpg" || imgType == "jpeg" || imgType == "png"){
								if (transparentBehav.mode == 'RGB'){
									// console.log("===============RGB==============")
									plane.setAttribute( "material", "shader: chromaKey; color: #"+color.getHexString()+";transparent: true; _slope: "+parseFloat(slope)+"; _threshold: "+parseFloat(threshold)+";" ); //// thonsha add shader
								}
								else if (transparentBehav.mode == 'HSV'){
									// console.log("VRFunc.js: image HSV---------------" , keyH , keyS , keyV , transparentBehav.hue , transparentBehav.saturation , transparentBehav.brightness  );
									plane.setAttribute( "material", "shader: HSVMatting; transparent: true; _keyingColorH:"+keyH+"; _keyingColorS:"+keyS+"; _keyingColorV:"+keyV+"; _deltaH:"+parseFloat(transparentBehav.hue)+"; _deltaS:"+parseFloat(transparentBehav.saturation)+"; _deltaV:"+parseFloat(transparentBehav.brightness)+";" ); //// thonsha add shader
								}
							}
							else if (imgType == "gif"){
								plane.setAttribute("geometry", "primitive: plane");
								plane.setAttribute("material", "shader:gif;  src: url("+ obj.res_url+"); opacity: 1");
							}
							//20191127-end-thonsha-mod
						}
						else{
							if (imgType == "jpg" || imgType == "jpeg" || imgType == "png"){
								// plane.setAttribute( "material", "side:double; opacity: 1.0; transparent: true; " ); //// 圖片會受場上光源影響
								plane.setAttribute( "material", "shader: flat; side:double; opacity: 1.0; transparent: true; " ); //// 圖片不受場上光源影響
							}
							else if (imgType == "gif"){
								plane.setAttribute("geometry", "primitive: plane");
								plane.setAttribute("material", "shader:gif;  src: url("+ obj.res_url+"); opacity: 1");
							}
							
						}

						//20191108-end-thonsha-add

						//20191101-start-thonsha-mod
						if (obj.behav){
							if (obj.behav.length==1 && transparentImage){
								plane.setAttribute('class', "unclickable" ); //// fei add
							}
							else{
								plane.setAttribute('class', "clickable" );
							}
						}
						else{
							plane.setAttribute('class', "unclickable" ); //// fei add
						}

						

						//20191101-end-thonsha-mod

						// position = new THREE.Vector3( 1.5 , 0.0 , 4.0 ); ////// set for test
						// rotation = new THREE.Vector3( 0 , 0 , 0 ); ////// set for test
						
						//20191031-start-thonsha-mod
						// scale.multiply( new THREE.Vector3(texture.image.width*0.01, texture.image.height*0.01 , 1) ); ////// need calculate from elements paraemter.
						

						self.setTransform(plane, position, rotation, scale);
						// plane.setAttribute( "position", position );//// origin , same as "1 2 3"
						// plane.setAttribute( "rotation", rotation );//// origin , same as "1 2 3"
						// plane.setAttribute( "scale"   , scale );//// origin , same as "1 2 3"
						self.makarObjects.push( plane );

						plane.addEventListener("loaded", function(evt){

							// console.log(evt);
							if (evt.target == evt.currentTarget){

								setTimeout(function(){
									plane.setAttribute("cursor-listener", true ); //// fei add
								}, 500 );

								console.log("VRFunc.js: loadTexture: loaded target same" );
								// console.log("loadTexture:", texture.image.width, texture.image.height, evt );
								// plane.object3D.children[0].scale.multiply(new THREE.Vector3(texture.image.width*0.01, texture.image.height*0.01 , 1));
								plane.object3D.children[0].scale.set(texture.image.width*0.01, texture.image.height*0.01 , 1);
								// var r = plane.object3D.children[0].rotation.toVector3();
								// r.add( new THREE.Vector3(0,Math.PI, 0));
								let r = new THREE.Vector3();
								r.set(0,Math.PI, 0); 
								plane.object3D.children[0].rotation.setFromVector3(r);

								plane.object3D["makarObject"] = true; 
								if ( obj.behav ){
									plane.object3D["behav"] = obj.behav ;
								}
								if(obj.behav_reference){
									plane.object3D["behav_reference"] = obj.behav_reference ;
								}
							}else{
								console.log("VRFunc.js: loadTexture: loaded target different" );
							}
						});
						//20191031-end-thonsha-mod

						//20191227-start-thonsha-add
						console.log("image behav_reference: ",obj.behav_reference);
						if(obj.behav_reference){
							for(let i=0; i<obj.behav_reference.length;i++){
								if (obj.behav_reference[i].behav_name != 'PlayAnimation'){
									plane.setAttribute("visible", false);
									plane.setAttribute('class', "unclickable" );
									break;
								}
							}
							
						}
						//20191227-end-thonsha-add
	
						//20191029-start-thonhsa-add
						if(obj.obj_parent_id){
							// plane.setAttribute("visible", false);
							// plane.setAttribute('class', "unclickable" );
							let timeoutID = setInterval( function () {
								let parent = document.getElementById(obj.obj_parent_id);
								if (parent){ 
									if(parent.object3D.children.length > 0){
										parent.appendChild(plane);
										window.clearInterval(timeoutID);
									}
								}
							}, 1);
						}
						else{
							self.vrScene.appendChild(plane);
						}
						//20191029-end-thonhsa-add
						
						console.log("VRFunc.js: VRController: loadTexture,obj=", obj );

					},
					undefined,
					function ( err ) {
						console.error( 'An error happened. loadTexture, err=', err);
					}
				);
			}
			
			//20191204-start-thonsha-add
			
			this.loadText = function( obj, position, rotation, scale ){

				
				let anchor = document.createElement('a-entity');
					
				self.setTransform(anchor, position, rotation, scale);
				anchor.setAttribute( "id", obj.obj_id );//// fei add 
				self.makarObjects.push( anchor );
				if (obj.behav){
					anchor.setAttribute('class', "clickable" ); //// fei add
				}
				else{
					anchor.setAttribute('class', "unclickable" ); //// fei add
				}
				
				// let textEntity = document.createElement('a-entity');
				// // textEntity.setAttribute("geometry","primitive: plane; width: auto; height: auto; width: auto");
				// // textEntity.setAttribute("material","color: #FFFFFF");
				// // textEntity.setAttribute("text","value: "+obj.content+"; color:red; shader: msdf; font:https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/notosans/NotoSans-Regular.json");
				// // textEntity.setAttribute("text","value: hello; color:red; shader: msdf; font:https://raw.githubusercontent.com/etiennepinchon/aframe-fonts/master/fonts/creepster/Creepster-Regular.json");
				// textEntity.setAttribute("text","value: "+obj.content+"; color:blue; font:font/edukai-4.0-msdf.json");
				// =======================================================================
				let textEntity = document.createElement('a-text');
				textList = obj.content.split('\n');
				let longestSplit = 0;
				const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;
    			const isChinese = (str) => REGEX_CHINESE.test(str);
				for (let i = 0; i < textList.length;i++) {
					textLength = 0;
					for (let j = 0; j <  textList[i].length; j++) {
						if(isChinese(textList[i][j])){  // chinese
							textLength += 1.6;
						}
						else if(textList[i][j] == textList[i][j].toUpperCase() && textList[i][j] != textList[i][j].toLowerCase()){ // upper-case
							textLength += 1;
						}
						else if(textList[i][j] == textList[i][j].toLowerCase() && textList[i][j] != textList[i][j].toUpperCase()){ // lower-case
							// textLength += 0.85;
							textLength += 1;
						}
						else if(!isNaN(textList[i][j] * 1)){ //numeric
							textLength += 1;
						}
						else{ // other symbols
							textLength += 1.25;
						}
						
					}
					console.log( textList[i], textLength);
					if (textLength > longestSplit) longestSplit =textLength;
				}
				textEntity.setAttribute("value",obj.content);
				textEntity.setAttribute("width",longestSplit*0.08)	// 4 for 0.46  per 0.115
				textEntity.setAttribute("wrap-count",longestSplit); // 1 for 1 
				textEntity.setAttribute("anchor","center");
				textEntity.setAttribute("align","left");
				textEntity.setAttribute("geometry","primitive:plane; width:auto; height:auto");
				textEntity.setAttribute("material","opacity: 0");
				textEntity.setAttribute("side","double");
				textEntity.setAttribute("font","font/bbttf-msdf.json");
				textEntity.setAttribute("negate","false");
				textEntity.setAttribute('crossorigin', 'anonymous');

				let rgb = obj.color.split(",");
				let color = new THREE.Color(parseFloat(rgb[0]),parseFloat(rgb[1]),parseFloat(rgb[2])); 
				textEntity.setAttribute("color", "#"+color.getHexString());

				if (obj.behav){
					textEntity.setAttribute('class', "clickable" ); //// fei add
				}
				else{
					textEntity.setAttribute('class', "unclickable" ); //// fei add
				}
				// textEntity.setAttribute( "id", obj.obj_id );//// fei add 
				// textEntity.setAttribute("makarVRIndex", i ); //// fei add
				

				// self.setTransform(textEntity, position, rotation, scale);
				// self.makarObjects.push( textEntity );

				textEntity.addEventListener("loaded", function(evt){
					if (evt.target == evt.currentTarget){

						setTimeout(function(){
							textEntity.setAttribute("cursor-listener", true ); //// fei add
						}, 500 );

						let r = new THREE.Vector3();
						r.set(0,Math.PI, 0); 
						textEntity.object3D.rotation.setFromVector3(r);
						// textEntity.object3D.children[0].rotation.setFromVector3(r);
						// textEntity.object3D.children[0].position.x = -textEntity.object3D.children[0].position.x;

						textEntity.object3D["makarObject"] = true; 
						if ( obj.behav ){
							textEntity.object3D["behav"] = obj.behav ;
						}
						if(obj.behav_reference){
							textEntity.object3D["behav_reference"] = obj.behav_reference ;
						}
					}
				});


				///
				anchor.appendChild(textEntity);
				///

				//20191227-start-thonsha-add
				if(obj.behav_reference){
					for(let i=0; i<obj.behav_reference.length;i++){
						if (obj.behav_reference[i].behav_name != 'PlayAnimation'){
							// textEntity.setAttribute("visible", false);
							// textEntity.setAttribute('class', "unclickable" );
							anchor.setAttribute("visible", false);
							anchor.setAttribute('class', "unclickable" );
							break;
						}
					}
					
				}
				//20191227-end-thonsha-add
				if(obj.obj_parent_id){
					// textEntity.setAttribute("visible", false);
					// textEntity.setAttribute('class', "unclickable" );
					let timeoutID = setInterval( function () {
						let parent = document.getElementById(obj.obj_parent_id);
						if (parent){ 
							if(parent.object3D.children.length > 0){

								parent.appendChild(anchor);
								window.clearInterval(timeoutID);
							} 
						}
					}, 1);
				}
				else{
					self.vrScene.appendChild(anchor);
					// self.vrScene.appendChild(textEntity);
				}
			}

			//20191204-end-thonsha-add

			//20191025-start-thonsha-add
			
			this.loadGLTFModel = function(obj, position, rotation, scale, skyTexture){

				let assets = document.getElementById("makarAssets");

				let assetsitem = document.createElement("a-asset-item")
				assetsitem.setAttribute("id", obj.obj_id+"_"+obj.res_id);
				assetsitem.setAttribute("src",obj.res_url);
				assetsitem.setAttribute('crossorigin', 'anonymous');
				assets.appendChild(assetsitem);

				//20191128-start-thonsha-add
				var animationSlices= null;	
				var mainAnimation;	
				if(obj.animation){
					animationSlices= [];
					for(let i=0; i<obj.animation.length; i++){
						if (obj.animation[i].isActive){
							animationSlices.push({idle:obj.animation[i].uid, uid:obj.animation[i].uid, changed: false});
							mainAnimation = obj.animation[i].animationName;
						}
					}
					for(let i=0; i<obj.animation.length; i++){
						animationSlices.push({name:obj.animation[i].name,
											animationName:obj.animation[i].animationName,
											startTime:obj.animation[i].startTime,
											endTime:obj.animation[i].endTime,
											uid:obj.animation[i].uid
											});
					}
				}
				//20191128-end-thonsha-add

				let modelEntity = document.createElement('a-entity');

				if(!obj.res_url){ return };
	
				modelEntity.setAttribute("gltf-model", "#"+obj.obj_id+"_"+obj.res_id);
				
				modelEntity.setAttribute("animation-mixer", "clip: "+mainAnimation);
				if (obj.behav){
					modelEntity.setAttribute('class', "clickable" ); //// fei add
				}
				else{
					modelEntity.setAttribute('class', "unclickable" ); //// fei add
				}
				modelEntity.setAttribute( "id", obj.obj_id );//// fei add 
				
				modelEntity.setAttribute('crossorigin', 'anonymous');

				self.setTransform(modelEntity, position, rotation, scale);
				self.makarObjects.push( modelEntity );

				//20191125-start-thonsha-add
				modelEntity.addEventListener("model-loaded", function(evt){ // model-loaded  / object3dset
					console.log("VRFunc.js: VRController: _loadGLTFModel, object3dset: evt=", evt , obj );
					if ( evt.target ==  evt.currentTarget ){

						setTimeout(function(){
							modelEntity.setAttribute("cursor-listener", true ); //// fei add
						}, 500 );

						if ( modelEntity.object3D ){
							modelEntity.object3D["makarObject"] = true;
							if ( obj.behav ){
								modelEntity.object3D["behav"] = obj.behav ;
							}
							if(obj.behav_reference){
								modelEntity.object3D["behav_reference"] = obj.behav_reference ;
							}
					
							
				//20191203-start-thonsha-add
							if (obj.material){
								for(let i = 0; i < obj.material.length; i++){
									// console.log('VRFunc.js: loadGLTFModel: obj.material=', i, obj.material[i]);
									let rgba = obj.material[i].color.split(",");
									// console.log(rgba)
									let color = new THREE.Color(parseFloat(rgba[0]),parseFloat(rgba[1]),parseFloat(rgba[2]));
									const objj = modelEntity.getObject3D('mesh');

									switch (obj.material[i].shader) {
										case "Unlit/Color":
											objj.traverse(node => {
												if (node.isMesh) {
													if (node.material.name === obj.material[i].name) {
														if (node.material.skinning === true ){
															node.material = new THREE.MeshBasicMaterial({color: color, name: obj.material[i].name, skinning: true});;
														}else{
															node.material = new THREE.MeshBasicMaterial({color: color, name: obj.material[i].name, skinning: false});;
														}
													}
												}
											});
											break;
										case "Standard":
											//20200512-thonsha-mod-start
											var targetCube = new THREE.WebGLRenderTargetCube(1024, 1024);
											var renderer = modelEntity.sceneEl.renderer
											var texture = new THREE.TextureLoader().load(
												skyTexture,
												function() {
													var cubeTex = targetCube.fromEquirectangularTexture(renderer, texture);
													objj.traverse(node => {
														if (node.material) {
															if (node.material.name == obj.material[i].name) {
																node.material.color = color;
																node.material.metalness = obj.material[i].metallic;
																node.material.roughness = 1 - obj.material[i].smoothness;
																node.material.envMap = cubeTex.texture;
																node.material.envMapIntensity = 1;
																node.material.needsUpdate = true;
																node.material.reflectivity = 0;
																node.material.side = THREE.DoubleSide;
																node.material.transparent = true;
																
																// console.log('VRFunc.js: loadGLTFModel: material(standard) node.material=', i, node.material);
																
																if(obj.material[i].mode == 0){
																	node.material.opacity = 1;
																	renderer.setClearAlpha(1);

																	node.material.blending = THREE.CustomBlending;
																	node.material.blendEquation = THREE.AddEquation;
																	node.material.blendSrc = THREE.OneFactor;
																	node.material.blendDst = THREE.ZeroFactor;
																	node.material.blendSrcAlpha = THREE.ZeroFactor;
																	node.material.blendDstAlpha = THREE.OneFactor;

																}
																else if(obj.material[i].mode == 1){
																	node.material.opacity = 1;
																	node.material.alphaTest = obj.material[i].cut_off;
																	renderer.setClearAlpha(1);

																	node.material.blending = THREE.CustomBlending;
																	node.material.blendEquation = THREE.AddEquation;
																	node.material.blendSrc = THREE.OneFactor;
																	node.material.blendDst = THREE.ZeroFactor;
																	node.material.blendSrcAlpha = THREE.ZeroFactor;
																	node.material.blendDstAlpha = THREE.OneFactor;
																}
																else if(obj.material[i].mode == 2){
																	node.material.opacity = parseFloat(rgba[3]);
																	node.material.depthWrite = false;
																
																}
																else if(obj.material[i].mode == 3){
																	node.material.opacity = Math.max(parseFloat(rgba[3]), obj.material[i].metallic);
																	node.material.depthWrite = false;
																	node.material.blending = THREE.CustomBlending;
																	node.material.blendEquation = THREE.AddEquation;
																	node.material.blendSrc = THREE.OneFactor;
																	node.material.blendDst = THREE.OneMinusSrcAlphaFactor;
																	node.material.blendSrcAlpha = THREE.OneFactor;
																	node.material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
																}


															}
														}
													});
													renderer.toneMapping = THREE.ACESFilmicToneMapping;
													renderer.outputEncoding = THREE.sRGBEncoding;
												}
											);
											//20200512-thonsha-mod-end
											break;
										case "Unlit/Transparent": // 光源
											objj.traverse(node => {
												if (node.material) {
													if (node.material.name == obj.material[i].name) {
														node.material.opacity = 1;
														node.material.depthWrite = false;
													}
												}
											});
											break;
										case "Unlit/Transparent Cutout": //去背
											objj.traverse(node => {
												if (node.material) {
													if (node.material.name == obj.material[i].name) {
														node.material.opacity = 1;
														node.material.alphaTest = 0.5;
													}
												}
											});
											break;
										case "Unlit/Texture":
											objj.traverse(node => {
												if (node.material) {
													if (node.material.name == obj.material[i].name) {
														

														if (node.material.skinning === true ){
															node.material = new THREE.MeshBasicMaterial({name: obj.material[i].name, skinning: true, map: node.material.map});;
														}else{
															node.material = new THREE.MeshBasicMaterial({name: obj.material[i].name, skinning: false, map: node.material.map});;
														}

														// node.material.metalness = 0;
														// node.material.opacity = 1;
														// node.material.transparent = false;
														// node.material.emissiveIntensity = 0;
														// node.material.needsUpdate = true;

														console.log(" VRFunc.js: loadGLTFModel: material= Unlit/texture:",  node.material , node.material.lightMapIntensity , node.material.aoMapIntensity  );

													}
												}
											});
											break;
										default:
											console.log(`The shader of no. ${i} material is not supported currently.`);
											break;
									}
								}

							}
				//20191203-end-thonsha-add							
							
							evt.detail.model.animationSlices = animationSlices;
						}
					}else{
						// console.log("VRFunc.js: VRController: _loadFBXModel, target!=currentTarget", obj.res_name, modelEntity.object3D.children );
					}
				});

				//20191125-end-thonsha-add

				//20191226-start-thonsha-mod
				if(obj.behav_reference){
					for(let i=0; i<obj.behav_reference.length;i++){
						if (obj.behav_reference[i].behav_name != 'PlayAnimation'){
							modelEntity.setAttribute("visible", false);
							modelEntity.setAttribute('class', "unclickable" );
							break;
						}
					}
					
				}
				//20191029-start-thonhsa-add
				if(obj.obj_parent_id){
					// modelEntity.setAttribute("visible", false);
					// modelEntity.setAttribute('class', "unclickable" );
					let timeoutID = setInterval( function () {
						let parent = document.getElementById(obj.obj_parent_id);
						if (parent){ 
							if(parent.object3D.children.length > 0){
								parent.appendChild(modelEntity);
								window.clearInterval(timeoutID);
							} 
						}
					}, 1);
				}
				else{
					self.vrScene.appendChild(modelEntity);
					// self.vrScene.object3D.add(modelEntity.object3D);
				}
				//20191029-end-thonhsa-add

				//20191226-end-thonsha-mod
			}

			//20191025-end-thonsha-add

			this.loadFBXModel = function( obj, position, rotation, scale ){
				
				// console.log("VRFunc.js: VRController: loadFBXModel, obj=", obj, position, rotation, scale );
				// console.log("VRFunc.js: VRController: loadFBXModel, obj res_url_fbx=", obj.res_url_fbx  );

				let modelEntity = document.createElement('a-entity');
				
				if ( !obj.res_url_fbx ){ return };
				
				modelEntity.setAttribute('fbx-model', 'src:' + obj.res_url_fbx ); // res_url_fbx, load model first?

				//20191028-end-thonsha-add
				modelEntity.setAttribute("animation-mixer", "");
				//20191028-end-thonsha-add
				if (obj.behav){
					modelEntity.setAttribute('class', "clickable" ); //// fei add
				}
				else{
					modelEntity.setAttribute('class', "unclickable" ); //// fei add
				}
				modelEntity.setAttribute( "id", obj.obj_id );//// fei add 
				// modelEntity.setAttribute("makarVRIndex", i ); //// fei add
				setTimeout(function(){
					modelEntity.setAttribute("cursor-listener", true ); //// fei add
				}, 500 );
				

				self.setTransform(modelEntity, position, rotation, scale);
				self.makarObjects.push( modelEntity );

				//20191227-start-thonsha-mod
				if(obj.behav_reference){
					for(let i=0; i<obj.behav_reference.length;i++){
						if (obj.behav_reference[i].behav_name != 'PlayAnimation'){
							modelEntity.setAttribute("visible", false);
							modelEntity.setAttribute('class', "unclickable" );
							break;
						}
					}
					
				}
				//20191227-end-thonsha-mod
				//20191029-start-thonhsa-add
				if(obj.obj_parent_id){
					// modelEntity.setAttribute("visible", false);
					// modelEntity.setAttribute('class', "unclickable" );
					let timeoutID = setInterval( function () {
						let parent = document.getElementById(obj.obj_parent_id);
						if (parent){ 
							if(parent.object3D.children.length > 0){
								parent.appendChild(modelEntity);
								window.clearInterval(timeoutID);
							} 
						}
					}, 1);
				}
				else{	
					self.vrScene.appendChild(modelEntity);
				}
				//20191029-end-thonhsa-add
				modelEntity.addEventListener("model-loaded", function(evt){

					if (evt.target == evt.currentTarget){
						modelEntity.object3D["makarObject"] = true; 
						if ( obj.behav ){
							modelEntity.object3D["behav"] = obj.behav ;
						}
					}
				});

				// console.log("VRFunc.js: VRController: loadFBXModel, modelEntity=", modelEntity );
				// console.log("VRFunc.js: VRController: loadFBXModel, obj=", obj );

			}

			//20191105-start-thonsha-add
			this.loadAudio = function(obj){
				console.log("audio loaded");
				let assets = document.getElementById("makarAssets");

				let assetsitem = document.createElement("audio");
				assetsitem.setAttribute("id", obj.obj_id+"_"+obj.res_id);
				assetsitem.setAttribute("src",obj.res_url);
				assetsitem.setAttribute('crossorigin', 'anonymous');
				assetsitem.setAttribute("loop", true);
				assetsitem.setAttribute("preload", "auto");
				assets.appendChild(assetsitem);

				assetsitem.onloadedmetadata = function() {
					let soundEntity = document.createElement('a-entity');
					soundEntity.setAttribute("sound", "src: "+"#"+obj.obj_id+"_"+obj.res_id+"; autoplay: true; loop: true; volume: 1; positional: false");
					soundEntity.setAttribute( "id", obj.obj_id );
					soundEntity.setAttribute("sound", "autoplay: false"); 


					self.makarObjects.push( soundEntity );
					//20191227-start-thonsha-mod
					let audioBehavRef = false;
					if(obj.behav_reference){
						for(let i=0; i<obj.behav_reference.length;i++){
							if (obj.behav_reference[i].behav_name != 'PlayAnimation'){
								audioBehavRef = true;
								soundEntity.setAttribute("sound", "loop: false");
								soundEntity.setAttribute("visible", false);
								soundEntity.setAttribute('class', "unclickable" );
								break;
							}
						}
						
					}else{
						soundEntity.setAttribute("visible", true);
					}
					//20191227-end-thonsha-mod

					if(obj.obj_parent_id){

						let timeoutID = setInterval( function () {
							let parent = document.getElementById(obj.obj_parent_id);
							if (parent){ 
								if(parent.object3D.children.length > 0){
									parent.appendChild(soundEntity);
									window.clearInterval(timeoutID);

									parent.addEventListener("child-attached", function(el){
										
										console.log("VRFunc.js: VRController: _loadAudio,: parent child-attached, el=", el );
										let parentVisible = true;
										soundEntity.object3D.traverseAncestors( function(parent) {
											if (parent.type != "Scene"){
												console.log("VRFunc.js: VRController: _loadAudio,: traverseAncestors: not Scene parent=", parent );
												if (parent.visible == false){
													parentVisible = false;
												}
											} else {
												if (parentVisible == true && soundEntity.object3D.visible == true && audioBehavRef == false ){
													console.log("VRFunc.js: VRController: _loadAudio,: traverseAncestors: all parent visible true=", soundEntity.object3D );
													soundEntity.setAttribute("sound", "autoplay: true");
												}else{
													console.log("2 VRFunc.js: VRController: _loadAudio,: traverseAncestors: not all parent visible true=", soundEntity.object3D.children[0] );
													soundEntity.setAttribute("sound", "autoplay: false"); 
												}
											}
										});


									})

								} 
							}
						}, 1);
					}
					else{	
						soundEntity.setAttribute("sound", "autoplay: true");
						self.vrScene.appendChild(soundEntity);
					}

					soundEntity.addEventListener("loaded", function(evt){

						if (evt.target == evt.currentTarget){
							console.log("3 VRFunc.js: VRController: _loadAudio,: loaded, soundEntity.object3D.children[0]=", soundEntity.object3D.children[0] );
							soundEntity.object3D["makarObject"] = true; 
							if ( obj.behav ){
								soundEntity.object3D["behav"] = obj.behav ;
							}
							if(obj.behav_reference){
								soundEntity.object3D["behav_reference"] = obj.behav_reference ;
							}
						}
					});
				}

			}
			//20191105-end-thonsha-add

			this.loadVideo = function( obj, position, rotation, scale ){
				let assets = document.getElementById("makarAssets");

				var mp4Video, mp4Texture ;
		
				mp4Video = document.createElement('video');
				mp4Video.src = obj.res_url; // url, "Data/makarVRDemo.mp4"
				mp4Video.playsInline = true;
				mp4Video.autoplay = false;
				//thonsha add
				mp4Video.loop = true;
				//thonsha add
				mp4Video.setAttribute('crossorigin', 'anonymous');
				mp4Video.setAttribute("id", obj.obj_id+"_"+obj.res_id );
				// mp4Video.setAttribute("hidden", "true");
				// mp4Video.setAttribute("loop", "true");
				assets.appendChild(mp4Video); ////// add video into a-assets

				if (window.Browser){
					if (window.Browser.name == undefined || window.Browser.name == "safari"){
						mp4Video.muted = true;
					}
				}
				
				// mp4Texture = new THREE.VideoTexture( mp4Video );
				// mp4Texture.minFilter = THREE.LinearFilter;
				// mp4Texture.magFilter = THREE.LinearFilter;
				// //// mp4Texture.flipY = false;
				// mp4Texture.format = THREE.RGBFormat;

				mp4Video.onloadedmetadata = function() {
					var videoWidth , videoHeight;
					if (mp4Video.videoWidth >= mp4Video.videoHeight){
						videoWidth = 1;
						videoHeight = 1*mp4Video.videoHeight/mp4Video.videoWidth;
					}else{
						videoWidth = 1*mp4Video.videoWidth/mp4Video.videoHeight;
						videoHeight = 1;
					}

					// console.log("VRFunc.js: video WH=", mp4Video.videoWidth , mp4Video.videoHeight);
					let videoPlane = document.createElement("a-video");
					//20191108-start-thonsha-add
					let transparentVideo = false
					if (obj.behav){
						for(let i=0;i<obj.behav.length;i++){
							if (obj.behav[i].simple_behav == "TransparentVideo"){
								// console.log(obj.behav[i])
								transparentVideo = true;
								chromaKey = obj.behav[i].chromakey;
								slope = obj.behav[i].slope;
								threshold = obj.behav[i].threshold;
								transparentBehav = obj.behav[i];
							}
						}
					}

					if (transparentVideo){
						let rgba = chromaKey.split(",");
						var color = new THREE.Color(parseFloat(rgba[0]),parseFloat(rgba[1]),parseFloat(rgba[2]));

						//20191126-start-thonsha-mod
						let HSV = transparentBehav.HSV.split(",");
						let keyH = parseFloat(HSV[0]);
						let keyS = parseFloat(HSV[1]);
						let keyV = parseFloat(HSV[2]);

						if (transparentBehav.mode == 'RGB'){
							videoPlane.setAttribute( "material", "shader: chromaKey; color: #"+color.getHexString()+";transparent: true; _slope: "+parseFloat(slope)+"; _threshold: "+parseFloat(threshold)+";" ); //// thonsha add shader
						}
						else if (transparentBehav.mode == 'HSV'){
							// console.log("VRFunc.js: video HSV---------------" , keyH , keyS , keyV , transparentBehav.hue , transparentBehav.saturation , transparentBehav.brightness  );
							videoPlane.setAttribute( "material", "shader: HSVMatting; transparent: true; _keyingColorH:"+keyH+"; _keyingColorS:"+keyS+"; _keyingColorV:"+keyV+"; _deltaH:"+transparentBehav.hue+"; _deltaS:"+transparentBehav.saturation+"; _deltaV:"+transparentBehav.brightness+";" ); //// thonsha add shader
						}

						//20191126-end-thonsha-mod
					}
					else{
						videoPlane.setAttribute( "material", "side:double; opacity: 1.0; transparent: true; " ); //// it is work
					}
					//20191108-end-thonsha-add

					if (obj.behav){
						if (obj.behav.length==1 && transparentVideo){
							videoPlane.setAttribute('class', "unclickable" ); //// fei add
						}
						else{
							videoPlane.setAttribute('class', "clickable" );
						}
					}
					else{
						videoPlane.setAttribute('class', "unclickable" ); //// fei add
					}
					

					videoPlane.setAttribute( "id", obj.obj_id );//// fei add 
					// videoPlane.setAttribute("makarVRIndex", i ); //// fei add

					videoPlane.setAttribute("src", "#"+obj.obj_id+"_"+obj.res_id ); //  
					// videoPlane.setAttribute("src", obj.res_url);

					// position = new THREE.Vector3( 1.5 , 0.0 , 4.0 ); ////// set for test
					// rotation = new THREE.Vector3( 0 , 0 , 0 ); ////// set for test
					// scale.multiply( new THREE.Vector3(videoWidth, videoHeight, 1) ); ////// need calculate from elements paraemter.

					self.setTransform(videoPlane, position, rotation, scale);
					videoPlane.addEventListener("loaded", function(evt){
					// videoPlane.addEventListener("object3dset", function(evt){
						// console.log(evt);
						if (evt.target == evt.currentTarget){

							setTimeout(function(){
								videoPlane.setAttribute("cursor-listener", true ); //// fei add
							}, 500 );

							videoPlane.object3D.children[0].scale.multiply(new THREE.Vector3(videoWidth, videoHeight, 1));
							let r = new THREE.Vector3();
							r.set(0,Math.PI, 0); 
							videoPlane.object3D.children[0].rotation.setFromVector3(r);
							// var r = videoPlane.object3D.children[0].rotation.toVector3();
							// r.add( new THREE.Vector3(0,Math.PI, 0) );
							// videoPlane.object3D.children[0].rotation.setFromVector3(r);
							videoPlane.object3D["makarObject"] = true; 
							if ( obj.behav ){
								videoPlane.object3D["behav"] = obj.behav ;
							}
							if(obj.behav_reference){
								videoPlane.object3D["behav_reference"] = obj.behav_reference ;
							}
						}
					});
					
					self.makarObjects.push( videoPlane );

					//20191227-start-thonsha-mod
					let videoBehavRef = false;
					if(obj.behav_reference){
						for(let i=0; i<obj.behav_reference.length;i++){
							if (obj.behav_reference[i].behav_name != 'PlayAnimation'){
								videoBehavRef = true;
								videoPlane.setAttribute("visible", false);
								videoPlane.setAttribute('class', "unclickable" );
								break;
							}
						}
						
					}
					//20191227-end-thonsha-mod

					//20191029-start-thonhsa-add
					if(obj.obj_parent_id){
						// videoPlane.setAttribute("visible", false);
						// videoPlane.setAttribute('class', "unclickable" );
						mp4Video.autoplay = false;
						let timeoutID = setInterval( function () {
							let parent = document.getElementById(obj.obj_parent_id);
							if (parent){
								if(parent.object3D.children.length > 0){

									parent.addEventListener("child-attached", function(el){
                                        console.log("VRFunc.js: VRController: _loadVideo,: parent child-attached, el=", el );
                                        let parentVisible = true;
                                        videoPlane.object3D.traverseAncestors( function(parent) {
                                            if (parent.type != "Scene"){
                                                console.log("VRFunc.js: VRController: _loadVideo,: traverseAncestors: not Scene parent=", parent );
                                                if (parent.visible == false){
                                                    parentVisible = false;
                                                }
                                            } else {
                                                if (parentVisible == true && videoPlane.object3D.visible == true && videoBehavRef ==false ){
                                                    console.log("VRFunc.js: VRController: _loadVideo,: traverseAncestors: all parent visible true=", videoPlane.object3D );
                                                    mp4Video.autoplay = true;
                                                    mp4Video.play();
                                                }else{
                                                    console.log("VRFunc.js: VRController: _loadVideo,: traverseAncestors: not all parent visible true=", videoPlane.object3D );
                                                    //// rootObject.visible = false;
													mp4Video.autoplay = false;
													mp4Video.pause();
                                                }
                                            }
                                        });
                                    });

									parent.appendChild(videoPlane);
									window.clearInterval(timeoutID);
								} 
							}
						}, 1);
					}
					else{
						mp4Video.autoplay = true;
						mp4Video.play();//// this is not necessary 
						self.vrScene.appendChild(videoPlane);
					}
					//20191029-end-thonhsa-add
				

					// }, 1 );
					// self.vrScene.appendChild(videoPlane);

					// console.log("VRFunc.js: VRController: _loadVideo, videoPlane=", videoPlane );
				}
				
				
			}

			this.loadLight = function( obj, position, rotation, scale ){
				console.log("VRFunc.js: _loadLight: obj=", obj);
				let Light = document.createElement("a-light");
				Light.setAttribute("id", obj.obj_id);
				Light.setAttribute("type", obj.light.light_type );
				let rgb = obj.light.color.split(",");
				let color = new THREE.Color(parseFloat(rgb[0]),parseFloat(rgb[1]),parseFloat(rgb[2]));
				Light.setAttribute("color", "#"+color.getHexString()); // white / gray / #fff 
				Light.setAttribute("intensity",  obj.light.intensity );
				if (obj.light.shadow == "None"){
					Light.setAttribute("castShadow", false);
				}
				else{
					Light.setAttribute("castShadow", false);
				}
				
				let a = new THREE.Vector3( 0, 0, -1 );
				let b = new THREE.Euler();
				let quaternion = obj.quaternionRotation.split(",");
				let quaternionRotation = new THREE.Quaternion(parseFloat(quaternion[1]),parseFloat(quaternion[2]),parseFloat(quaternion[3]),parseFloat(quaternion[0]))
				b.setFromQuaternion(quaternionRotation)
				b.y = -b.y
				b.z = -b.z
				a.applyEuler(b);
				Light.setAttribute( "position", a );//// origin

				self.vrScene.appendChild(Light);// this = vrScene
			}
			

			this.setTransform = function( obj, position, rotation, scale ){
				// console.log("VRFunc.js: setTransform: obj=", obj, "\n position=", position , "\n rotation=", rotation , "\n scale=", scale); 
				let pos = position.clone(); 
				pos.multiply( new THREE.Vector3( -1, 1, 1 ) ); ////// reverse the x direction 
				obj.setAttribute( "position", pos );//// origin 

				let rot = rotation.clone(); 
				rot.multiply( new THREE.Vector3( 1 , -1 , -1 ) ); ////// reverse x y direction
				obj.setAttribute( "rotation", rot );//// origin 

				obj.setAttribute( "scale", scale );//// origin 

				// obj.setAttribute( "width" , scale.x );////// the unit ratio is 1:100
				// obj.setAttribute( "height", scale.y );

			}

			this.checkAnimation = function (obj, dt){
				if (obj.mixer){
					obj.mixer.update(dt);
				}
				if (obj.animationSlices ){
					if (obj.animationSlices[0].index){
						if (obj.animationSlices[obj.animationSlices[0].index]){
							if (obj.mixer._actions[0].time > obj.animationSlices[obj.animationSlices[0].index].timeEnd ||
								obj.mixer._actions[0].time < obj.animationSlices[obj.animationSlices[0].index].timeStart){
								obj.mixer._actions[0].time = obj.animationSlices[obj.animationSlices[0].index].timeStart;
							}
						}
					}
				}
			}

//[start-20200617-fei0097-add]//
			this.showObjectEvent = function(target, reset ){

				if (target.getAttribute("visible")){
					target.setAttribute("visible",false);
					target.setAttribute('class', "unclickable" );
					let id = target.getAttribute("src");
					if(id!=undefined){
						id = id.split("#").pop();
						let v = document.getElementById(id);
						if (v instanceof HTMLElement){
							v.pause();
						}
					}
					target.object3D.traverse(function(child){
						if (child.type=="Group"){
							child.el.setAttribute('class', "unclickable" );
							if(child.el.localName=="a-video"){
								let id = child.el.getAttribute("src");
								if(id!=undefined){
									id = id.split("#").pop();
									let v = document.getElementById(id);
									if (v instanceof HTMLElement){
										v.pause();
									}
								}
							}
							if(child.makarObject && child.el.getAttribute("sound")){
								// child.el.components.sound.stopSound();
								if (child.behav_reference){
									child.el.setAttribute("visible", false);
								}
								for(let i in child.children ){
									if ( child.children[i].children[0].type == "Audio" ){					
										if (child.children[i].children[0].isPlaying == true ){
											child.el.components.sound.stopSound();
										}
									}
								}
							}
						}
					});
					if (reset){
						target.object3D.traverse(function(child){
							if (child.type=="Group"){
								child.el.setAttribute("visible",false);
								child.el.setAttribute('class', "unclickable" );
							}
						});
					}
				}
				else{
					target.setAttribute("visible",true);
					let id = target.getAttribute("src");
					if(id!=undefined){
						id = id.split("#").pop();
						let v = document.getElementById(id);
						if (v instanceof HTMLElement){
							// v.load();
							v.play();
						}
					}
					if(target.object3D.behav){
						target.setAttribute('class', "clickable" );
					}
					target.object3D.traverse(function(child){
						if (child.type=="Group"){
							if (child.el.getAttribute("visible")){
								if(child.el.object3D.behav){
									child.el.setAttribute('class', "clickable" );
								}
								if(child.el.localName=="a-video"){
									let id = child.el.getAttribute("src");
									if(id!=undefined){
										id = id.split("#").pop();
										let v = document.getElementById(id);
										if (v instanceof HTMLElement){
											v.play();
										}
									}
								}
								if(child.makarObject && child.el.getAttribute("sound")){
									child.el.components.sound.playSound();
								}
							}
						}
					});
				}

			}

			this.hideGroupObjectEvent = function(target){
				if (target.getAttribute("visible")){
					target.setAttribute("visible",false);
					target.setAttribute('class', "unclickable" );
					target.object3D.traverse(function(child){
						if (child.type=="Group"){
							child.el.setAttribute('class', "unclickable" );
							if(child.el.localName=="a-video"){
								let id = child.el.getAttribute("src");
								if(id!=undefined){
									id = id.split("#").pop();
									let v = document.getElementById(id);
									if (v instanceof HTMLElement){
										v.pause();
									}
								}
							}
							if(child.makarObject && child.el.getAttribute("sound")){
								//// 假如此聲音物件有掛 behav_reference[ PlayMusic ], 則將visible 改為 false ，只有觸發 PlayMusic 才能再次開啟
								if (child.behav_reference){
									child.el.setAttribute("visible", false);
								}
								//// 假如聲音物件本來在播放，則停止。因應在手機上假如在沒播放的狀況下呼叫 stop，會報錯誤
								for(let i in child.children ){
									if ( child.children[i].children[0].type == "Audio" ){					
										if (child.children[i].children[0].isPlaying == true ){
											child.el.components.sound.stopSound();
										}
									}
								}
							}
						}
					});
				}
			}


//[end---20200617-fei0097-add]//


			////// 設計將 VR 專案中 cursor 的功能取消，改以點擊觸發。 
			////// 因為 VR 場景中目前不讓使用者以點擊或是滑鼠來操控物件，所以不序要額外判斷 look-control 開啟與否
			////// --------------------- debug --------------------------------

			this.getMakarObject = function( obj ){
				if (obj.makarObject != true){
					if ( obj.parent ){
						// console.log("obj.parent exist, goto");
						return ( self.getMakarObject( obj.parent ) );
					}else{
						// console.log("obj.parent not exist, return 0");
						return 0;
					}
				}else{
					// console.log("obj.makarObject == true, return", obj);
					return obj ;
				}
			}


			////// add the listener for show the panel or not
			self.vrScene.canvas.addEventListener("touchstart", startEvent, false);
			self.vrScene.canvas.addEventListener("mousedown", startEvent, false);

			self.vrScene.canvas.addEventListener( 'touchmove', moveEvent, false );
			self.vrScene.canvas.addEventListener( 'mousemove', moveEvent, false );

			self.vrScene.canvas.addEventListener("touchend", endEvent, false);
			self.vrScene.canvas.addEventListener("mouseup", endEvent, false);

//[start-20200313-fei0091-add]//
			////  set the temporary empty object, will replace it by the touchstart(cell phone)/mouseDown(PC)
			// var objectControls = new THREE.ObjectControls( self.vrScene.canvas , vrController.emptyObject );  
			// objectControls.enableVerticalRotation();
			// objectControls.setRotationSpeed( 0.1 ); // for PC 
			// objectControls.setPanSpeed( 0.01 ); // for PC 

			// objectControls.setRotationSpeedTouchDevices( 0.05 ); // for cell phone
			// objectControls.setDistance( -1000, 1000); // set min - max distance for zoom
			// objectControls.setZoomSpeed( 2 ); // set zoom speed
			
//[end---20200313-fei0091-add]//
			//////
			////// raycaster for touch and mouse 
			//////
			var preMouse = new THREE.Vector2();
			var mouse = new THREE.Vector2();
			var raycaster = new THREE.Raycaster();
			
			function startEvent(event){
				// console.log("VRFunc.js: startEvent: event=", event );

				event.preventDefault();
				self.touchMouseState = 1;
				let rect = self.GLRenderer.domElement.getBoundingClientRect();
				switch ( event.type ) {
					case "mousedown": ////// 20190709 Fei: add this event type for PC mouse
						preMouse.x = event.clientX ;
						preMouse.y = event.clientY ;

						mouse.x = ( (event.clientX - rect.left) / self.GLRenderer.domElement.clientWidth ) * 2 - 1; // GLRenderer.domElement.clientWidth window.innerWidth
						mouse.y = - ( (event.clientY - rect.top) / self.GLRenderer.domElement.clientHeight ) * 2 + 1; // GLRenderer.domElement.clientHeight  window.innerHeight
						break;
					case "touchstart": ////// 20190709 Fei: add this event type for cellphone
						// console.log("endEvent: touchend: event.touches  = ", event.changedTouches[0].clientX, event.changedTouches[0].clientY );
						preMouse.x = event.changedTouches[0].clientX;
						preMouse.y = event.changedTouches[0].clientY;
						
						mouse.x = ( (event.changedTouches[0].clientX - rect.left) / self.GLRenderer.domElement.clientWidth ) * 2 - 1; // GLRenderer.domElement.clientWidth window.innerWidth
						mouse.y = - ( (event.changedTouches[0].clientY - rect.top) / self.GLRenderer.domElement.clientHeight ) * 2 + 1; // GLRenderer.domElement.clientHeight  window.innerHeight
						break;

					default:
						console.log("VRFunc.js: startEvent: event.type=", event.type, " not mousedown/touchstart, return ");
						return ;

				}

				let makarTHREEObjects = [];
				for ( let i = 0; i < self.makarObjects.length; i++ ){
					let makarObject = self.makarObjects[i];
					// if ( makarObject.object3D ){
					if ( makarObject.object3D && makarObject.className == "clickable" ){	
							makarTHREEObjects.push(makarObject.object3D );
					}
				}

				raycaster.setFromCamera( mouse, self.vrScene.camera );
				let intersects = raycaster.intersectObjects( makarTHREEObjects , true ); 
				if (intersects.length != 0 ){
					console.log("VRFunc.js: startEvent: intersects =", intersects );
					let touchObject = self.getMakarObject( intersects[0].object );
					console.log("VRFunc.js: startEvent: touchObject =", touchObject );

					vrController.controlObject = touchObject;
				
					// objectControls.setObjectToMove( vrController.controlObject  );
				
					//// disable the look-control 
					//// check PC or mobile
					// if ( window.navigator.userAgent.toLowerCase().indexOf("mobile") >= 0  ){
					// 	aCamera.setAttribute('look-controls', { enabled: true , touchEnabled: false  } ); 
					// }else{
					// 	aCamera.setAttribute('look-controls', { enabled: false , touchEnabled: false  } ); 
					// }
					// aCamera.components["look-controls"].saveCameraPose();
				

				}else{ //// there is no object touched/pointed, make the objectControl disable , then make the look-control enable
					//// set control object to empty.
					// objectControls.setObjectToMove( vrController.emptyObject );
					//// enable the look-control 
					// aCamera.setAttribute('look-controls', { enabled: true , touchEnabled: true  } ); 

				}

			}
			
			function endEvent( event ) {
				// console.log("VRFunc.js: _setupFunction: endEvent: event=", event );
				if (self.touchMouseState == 2){
					return;
				}
				event.preventDefault(); ////// if not set this, on mobile will trigger twice 
				let rect = self.GLRenderer.domElement.getBoundingClientRect();
				switch ( event.type ) {
					case "mouseup":
						mouse.x = ( (event.clientX - rect.left) / self.GLRenderer.domElement.clientWidth ) * 2 - 1; // GLRenderer.domElement.clientWidth window.innerWidth
						mouse.y = - ( (event.clientY - rect.top) / self.GLRenderer.domElement.clientHeight ) * 2 + 1; // GLRenderer.domElement.clientHeight  window.innerHeight
						break;
					case "touchend":////// 20190709 Fei: add this event type for cellphone
						mouse.x = ( (event.changedTouches[0].clientX - rect.left) / self.GLRenderer.domElement.clientWidth ) * 2 - 1; // GLRenderer.domElement.clientWidth window.innerWidth
						mouse.y = - ( (event.changedTouches[0].clientY - rect.top) / self.GLRenderer.domElement.clientHeight ) * 2 + 1; // GLRenderer.domElement.clientHeight  window.innerHeight
						break;
					default:
						console.log("default endEvent: event.type=", event.type, " not mouseup/touchend, return ");
						return ;
				}
				// console.log("VRFunc.js: _setupFunction: endEvent, mouse=", mouse  );


				////// for the 3D scene part
				let makarTHREEObjects = [];
				for ( let i = 0; i < self.makarObjects.length; i++ ){
					let makarObject = self.makarObjects[i];
					if ( makarObject.object3D && makarObject.className == "clickable" ){
						makarTHREEObjects.push(makarObject.object3D );
					}
				}

				raycaster.setFromCamera( mouse, self.vrScene.camera );
				let intersects = raycaster.intersectObjects(  makarTHREEObjects, true ); 
				console.log("VRFunc.js: _setupFunction: endEvent, intersects=", intersects , makarTHREEObjects , self.makarObjects );
				if (intersects.length != 0 ){
					console.log("VRFunc.js: _setupFunction: 1 endEvent, intersects=", intersects );
					let touchObject = self.getMakarObject( intersects[0].object );
					console.log("VRFunc.js: _setupFunction: endEvent, touchObject.behav=", touchObject.behav );

					if (touchObject.behav){
						// self.triggerEvent( touchObject.behav[0] ); // 20190827: add the parameter obj( makarObject)
						// return;


						//// deal the group	
						//// 找出此次觸發事件中含有 group 的部份
						for (let i = 0; i < touchObject.behav.length; i++ ){
							if (touchObject.behav[i].group){
								//// 找出所有場上物件中，掛有觸發事件的物件
								for ( let j = 0; j < self.makarObjects.length; j++ ){
									let makarObject = self.makarObjects[j];
									if (makarObject.object3D){
										if (makarObject.object3D.makarObject && makarObject.object3D.behav ){

											for (let k = 0; k < makarObject.object3D.behav.length; k++ ){
												//// 找出除了自己以外掛有相同 group 的物件
												if (makarObject.object3D.behav[k].group == touchObject.behav[i].group &&  makarObject.object3D != touchObject ){
													// console.log(" ************* " , i , j , k , makarObject.object3D.behav[k] , touchObject.behav[i].group );
													let groupObj = document.getElementById(makarObject.object3D.behav[k].obj_id);
													self.hideGroupObjectEvent(groupObj);
												}
											}

										}
									}
								}
							}
						}


						let reset = false;
						for(let i = 0; i < touchObject.behav.length; i++){
							if (touchObject.behav[i].simple_behav == "CloseAndResetChildren"){
								reset = true;
							}
						}
						for(let i = 0; i < touchObject.behav.length; i++){
							if (touchObject.behav[i].simple_behav != "CloseAndResetChildren"){
								self.triggerEvent( touchObject.behav[i], reset, touchObject );
							}
						}

					}
				}
			}

			function moveEvent(event){
				switch ( event.type ) {
					case "mousemove":
						if ( self.touchMouseState == 1 ){
							if ( Math.abs(preMouse.x - event.clientX ) > 2 || Math.abs( preMouse.y - event.clientY  ) > 2 ){
								self.touchMouseState = 2;
								// console.log("VRFunc.js: moveEvent: 1  event=", event );

							}
						}
						break;
					case "touchmove":////// 20190709 Fei: add this event type for cellphone
						if ( Math.abs(preMouse.x - event.changedTouches[0].clientX) > 2 || Math.abs( preMouse.y - event.changedTouches[0].clientY )>2 ){
							self.touchMouseState = 2;
							// console.log("VRFunc.js: moveEvent: 2  event=", event );

						}

						////// If two pointers are down, make the control object as the previous object
						if (event.touches.length === 2) {
							// console.log("VRFunc.js: moveEvent: 3  event=", event );

							// objectControls.setObjectToMove( vrController.controlObject );
							// aCamera.setAttribute('look-controls', { enabled: true , touchEnabled: false  } ); 

						}

						break;
					default:
						console.log(" startEvent: event.type=", event.type, " not mousemove/touchmove, return ");
						return ;
				}
			}







			/////// --------------------- debug  -----------------------------




		}

		VRController.prototype.triggerEvent = function( event, reset, GLRenderer, arScene, makarObj ){
			if (!this.FUNCTION_ENABLED){
				return;
			}
			var self = this;
			let target;
			
			switch ( event.simple_behav ){
				case "PhoneCall":
					console.log("VRFunc.js: triggerEvent: PhoneCall: event=", event );	
					let telTag = window.document.getElementById("phoneCall");
					telTag.href = "tel:"+event.phone ;
					telTag.click();
					break;

				case "SendEmail": 
					console.log("VRFunc.js: triggerEvent: SendEmail: event=", event );	
					let mailTag = window.document.getElementById("sendEmail");
					mailTag.href = "mailto:" + event.mail_to ;
					mailTag.click();
					break;

				case "OpenWebPage":
					console.log("VRFunc.js: triggerEvent: OpenWebPage: event=", event , event.url );	
					let webTag = window.document.getElementById("openWebBrowser");
					webTag.href = event.url ;
					webTag.click();
					console.log("VRFunc.js: triggerEvent: OpenWebPage: webTag=", webTag );	
					break;

				case "SceneChange":
					console.log("VRFunc.js: triggerEvent: SceneChange: event=", event );
					//20191023-start-thonsha-add
					sceneID = event.scene_id;
					for (let i = 0; i <VRSceneResult.length;i++){
						for (let j = 0;j<VRSceneResult[i].scenes.length;j++){
							if(VRSceneResult[i].scenes[j].scene_id == sceneID){
								
								self.currentSceneIndex = j;
								
								// window.activeVRScenes(i,j);
								//// 假如要跳轉的場影不含有 "@nv@" 則關閉背景相機畫面
								if ( !self.VRSceneResult[i].scenes[j].scene_name.includes("@nv@")  ){
									for (let k in self.scene2D.children ){
										if (self.scene2D.children[k].videoBackground && self.scene2D.children[k].visible == true ){
											self.scene2D.children[k].visible = false;
										}
									}
								}
								self.loadScene(i,j);

							}
						}
					}	
					//20191023-end-thonsha-add
					break;

				case "ShowImage":
					console.log("VRFunc.js: triggerEvent: ShowImage: event=", event );	
					obj_id = event.obj_id;
					target = document.getElementById(obj_id);
					// console.log(target)

					self.showObjectEvent(target, reset);

					// if (target.getAttribute("visible")){
					// 	target.setAttribute("visible",false);
					// 	target.setAttribute('class', "unclickable" );

					// 	target.object3D.traverse(function(child){
					// 		if (child.type=="Group"){
					// 			child.el.setAttribute('class', "unclickable" );
					// 			if(child.el.localName=="a-video"){
					// 				let id = child.el.getAttribute("src");
					// 				if(id!=undefined){
					// 					id = id.split("#").pop();
					// 					let v = document.getElementById(id);
					// 					if (v instanceof HTMLElement){
					// 						v.pause();
					// 					}
					// 				}
					// 			}
								
								
					// 			if(child.el.getAttribute("sound")){
					// 				child.el.components.sound.stopSound();
										
					// 			}
					// 		}
							
					// 	});

					// 	if (reset){
					// 		target.object3D.traverse(function(child){
					// 			if (child.type=="Group"){
					// 				child.el.setAttribute("visible",false);
					// 				child.el.setAttribute('class', "unclickable" );
					// 			}
								
					// 		});
					// 	}
					// }
					// else{
					// 	target.setAttribute("visible",true);
					// 	if(target.object3D.behav){
					// 		target.setAttribute('class', "clickable" );
					// 	}

					// 	target.object3D.traverse(function(child){
					// 		if (child.type=="Group"){
					// 			if (child.el.getAttribute("visible")){
					// 				if(child.el.object3D.behav){
					// 					child.el.setAttribute('class', "clickable" );
					// 				}
					// 				if(child.el.localName=="a-video"){
					// 					let id = child.el.getAttribute("src");
					// 					if(id!=undefined){
					// 						id = id.split("#").pop();
					// 						let v = document.getElementById(id);
					// 						if (v instanceof HTMLElement){
					// 							v.play();
					// 						}
					// 					}
					// 				}

					// 				if(child.el.getAttribute("sound")){
					// 					child.el.components.sound.playSound();
											
					// 				}
									
					// 			}
					// 		}
							
					// 	});
						
						
					// }
					break;
				
					case "ShowText":
						console.log("VRFunc.js: triggerEvent: ShowText: event=", event );	
						obj_id = event.obj_id;
						target = document.getElementById(obj_id);

						//// 同時要處理 reset  子物件 影片播放 聲音播放
						self.showObjectEvent(target, reset);	

						// console.log("VRFunc.js: triggerEvent: ShowText: target=", target.getAttribute("visible") ,target );	
						// if (target.getAttribute("visible")){
						// 	target.setAttribute("visible",false);
						// 	target.setAttribute('class', "unclickable" );
	
						// 	target.object3D.traverse(function(child){
						// 		if (child.type=="Group"){
						// 			child.el.setAttribute('class', "unclickable" );
						// 			if(child.el.localName=="a-video"){
						// 				let id = child.el.getAttribute("src");
						// 				if(id!=undefined){
						// 					id = id.split("#").pop();
						// 					let v = document.getElementById(id);
						// 					if (v instanceof HTMLElement){
						// 						v.pause();
						// 					}
						// 				}
						// 			}
						// 			if(child.el.getAttribute("sound")){
						// 				child.el.components.sound.stopSound();
						// 			}
						// 		}
						// 	});
						// 	if (reset){
						// 		target.object3D.traverse(function(child){
						// 			if (child.type=="Group"){
						// 				child.el.setAttribute("visible",false);
						// 				child.el.setAttribute('class', "unclickable" );
						// 			}
						// 		});
						// 	}
						// }
						// else{
						// 	target.setAttribute("visible",true);
						// 	if(target.object3D.behav){
						// 		target.setAttribute('class', "clickable" );
						// 	}
						// 	target.object3D.traverse(function(child){
						// 		if (child.type=="Group"){
						// 			if (child.el.getAttribute("visible")){
						// 				if(child.el.object3D.behav){
						// 					child.el.setAttribute('class', "clickable" );
						// 				}
						// 				if(child.el.localName=="a-video"){
						// 					let id = child.el.getAttribute("src");
						// 					if(id!=undefined){
						// 						id = id.split("#").pop();
						// 						let v = document.getElementById(id);
						// 						if (v instanceof HTMLElement){
						// 							v.play();
						// 						}
						// 					}
						// 				}
						// 				if(child.el.getAttribute("sound")){
						// 					child.el.components.sound.playSound();
						// 				}
						// 			}
						// 		}
						// 	});
						// }
						break;

				case "ShowModel":
					console.log("VRFunc.js: triggerEvent: ShowModel: event=", event );	
					obj_id = event.obj_id;
					target = document.getElementById(obj_id);

					//// 同時要處理 reset  子物件 影片播放 聲音播放
					self.showObjectEvent(target, reset);	

					// if (target.getAttribute("visible")){
					// 	target.setAttribute("visible",false);
					// 	target.setAttribute('class', "unclickable" );

					// 	target.object3D.traverse(function(child){
					// 		if (child.type=="Group"){
					// 			child.el.setAttribute('class', "unclickable" );
					// 			if(child.el.localName=="a-video"){
					// 				let id = child.el.getAttribute("src");
					// 				if(id!=undefined){
					// 					id = id.split("#").pop();
					// 					let v = document.getElementById(id);
					// 					if (v instanceof HTMLElement){
					// 						v.pause();
					// 					}
					// 				}
					// 			}

					// 			if(child.el.getAttribute("sound")){
					// 				child.el.components.sound.stopSound();
										
					// 			}
					// 		}
							
					// 	});

					// 	if (reset){
					// 		target.object3D.traverse(function(child){
					// 			if (child.type=="Group"){
					// 				child.el.setAttribute("visible",false);
					// 				child.el.setAttribute('class', "unclickable" );
					// 			}
								
					// 		});
					// 	}
					// }
					// else{
					// 	target.setAttribute("visible",true);
					// 	if(target.object3D.behav){
					// 		target.setAttribute('class', "clickable" );
					// 	}

					// 	target.object3D.traverse(function(child){
					// 		if (child.type=="Group"){
					// 			if (child.el.getAttribute("visible")){
					// 				if(child.el.object3D.behav){
					// 					child.el.setAttribute('class', "clickable" );
					// 				}
					// 				if(child.el.localName=="a-video"){
					// 					let id = child.el.getAttribute("src");
					// 					if(id!=undefined){
					// 						id = id.split("#").pop();
					// 						let v = document.getElementById(id);
					// 						if (v instanceof HTMLElement){
					// 							v.play();
					// 						}
					// 					}
					// 				}

					// 				if(child.el.getAttribute("sound")){
					// 					child.el.components.sound.playSound();
											
					// 				}
									
					// 			}
					// 		}
							
					// 	});
						
						
					// }
					break;

				case "PlayMusic":
					console.log("VRFunc.js: triggerEvent: PlayMusic: event=", event );
					obj_id = event.obj_id;
					target = document.getElementById(obj_id);

					for(let i in target.object3D.children  ){
						if ( target.object3D.children[i].children[0].type == "Audio" ){					
							console.log("VRFunc.js: triggerEvent: PlayMusic: target.object3D.children =", i , target.object3D.children[i].children[0] );	
							
							if (target.object3D.children[i].children[0].isPlaying == true ){
								target.components.sound.stopSound();
								target.setAttribute("visible", false );
							}else{
								target.components.sound.playSound();
								target.setAttribute("visible", true  );
							}
							
						}
					}

					// if(target.getAttribute("visible")){
					// 	target.setAttribute("visible",false);
					// 	target.setAttribute('class', "unclickable" );
					// 	target.components.sound.stopSound();
					// }
					// else{
					// 	target.setAttribute("visible",true);
					// 	if(target.object3D.behav){
					// 		target.setAttribute('class', "clickable" );
					// 	}
					// 	target.components.sound.playSound();
					// }

					break;
					
				case "ShowVideo":
					console.log("VRFunc.js: triggerEvent: ShowVideo: event=", event );	
					obj_id = event.obj_id;
					target = document.getElementById(obj_id);
					// console.log(target)

					//// 同時要處理 reset  子物件 影片播放 聲音播放
					self.showObjectEvent(target, reset);	

					// if (target.getAttribute("visible")){
					// 	target.setAttribute("visible",false);
					// 	target.setAttribute('class', "unclickable" );
					// 	let id = target.getAttribute("src");
					// 	if(id!=undefined){
					// 		id = id.split("#").pop();
					// 		let v = document.getElementById(id);
					// 		if (v instanceof HTMLElement){
					// 			v.pause();
					// 		}
					// 	}

					// 	target.object3D.traverse(function(child){
					// 		if (child.type=="Group"){
					// 			child.el.setAttribute('class', "unclickable" );
					// 			if(child.el.localName=="a-video"){
					// 				let id = child.el.getAttribute("src");
					// 				if(id!=undefined){
					// 					id = id.split("#").pop();
					// 					let v = document.getElementById(id);
					// 					if (v instanceof HTMLElement){
					// 						v.pause();
					// 					}
					// 				}
					// 			}

					// 			if(child.el.getAttribute("sound")){
					// 				child.el.components.sound.stopSound();
										
					// 			}
					// 		}
							
					// 	});

					// 	if (reset){
					// 		target.object3D.traverse(function(child){
					// 			if (child.type=="Group"){
					// 				child.el.setAttribute("visible",false);
					// 				child.el.setAttribute('class', "unclickable" );
					// 			}
								
					// 		});
					// 	}
						
						
					// }
					// else{
					// 	target.setAttribute("visible",true);
					// 	let id = target.getAttribute("src");
					// 	if(id!=undefined){
					// 		id = id.split("#").pop();
					// 		let v = document.getElementById(id);
					// 		if (v instanceof HTMLElement){
					// 			// v.load();
					// 			v.play();
					// 		}
					// 	}
					// 	if(target.object3D.behav){
					// 		target.setAttribute('class', "clickable" );
					// 	}

					// 	target.object3D.traverse(function(child){
					// 		if (child.type=="Group"){
					// 			if (child.el.getAttribute("visible")){
					// 				if(child.el.object3D.behav){
					// 					child.el.setAttribute('class', "clickable" );
					// 				}
					// 				if(child.el.localName=="a-video"){
					// 					let id = child.el.getAttribute("src");
					// 					if(id!=undefined){
					// 						id = id.split("#").pop();
					// 						let v = document.getElementById(id);
					// 						if (v instanceof HTMLElement){
					// 							v.play();
					// 						}
					// 					}
					// 				}

					// 				if(child.el.getAttribute("sound")){
					// 					child.el.components.sound.playSound();
											
					// 				}
									
					// 			}
					// 		}
							
					// 	});
						
						
					// }
					break;
				
				case "PlayAnimation":
					
					console.log("VRFunc.js: triggerEvent: PlayAnimation: event=", event );	
					obj_id = event.obj_id;
					target = document.getElementById(obj_id);
					
					var mainAnimation;
					for(let i=1;i<target.object3D.children[0].animationSlices.length;i++){
						if (target.object3D.children[0].animationSlices[i].uid == event.uid){
							mainAnimation = target.object3D.children[0].animationSlices[i].animationName;
						}
					}
					target.setAttribute("animation-mixer", "clip: "+mainAnimation);

					if(event.loop){
						target.object3D.children[0].animationSlices[0].idle = event.uid;
						target.object3D.children[0].animationSlices[0].uid = event.uid;
						target.object3D.children[0].animationSlices[0].changed = true;
						target.setAttribute('class', "unclickable" );
					}
					else{
						target.object3D.children[0].animationSlices[0].uid = event.uid;
						target.object3D.children[0].animationSlices[0].changed = true;
					}

					break;

				default:
					console.log("VRFunc.js: triggerEvent: default: event=", event );	

					break;
			}

		}

		

		//////
		////// just update the VRController, not the renderer, so it is not consistent with renderer
		//////
		VRController.prototype.update = function(){
			if (!this.FUNCTION_ENABLED){
				return;
			}
			var self = this;
			
			this.delta = this.clock.getDelta() * 1;
			this.time = this.clock.elapsedTime * 1;
			
			// console.log("VRFunc.js: VRController update: this.time = ", this.time, this.delta, this.vrScene.delta );
			// console.log("VRFunc.js: VRController update: self.vrScene = ", self.vrScene );

			for ( let i = 0; i < self.makarObjects.length; i++ ){
				let makarObject = self.makarObjects[i];
				if ( makarObject.object3D ){
					if ( makarObject.object3D.makarObject ){
						if ( makarObject.object3D.children ){
							if ( makarObject.object3D.children[0] ){ // it must have only one child. 

								// console.log("VRFunc.js: VRController update: makarObject, model = ", makarObject.object3D.children[0] );
								self.checkAnimation( makarObject.object3D.children[0], this.delta );

							}
						}
					}
				}
			}

			setTimeout(  function(){
				self.update();
			},  this.vrScene.delta );


			
			// let tstart = new Date().getTime();
			////// do something

			// let tend = new Date().getTime(); // small to millisecond
			// let td = 30;
			// if ( (tend-tstart) < 30 ) td = 30 - (tend - tstart)+1;
			// else td = 1;

			
			// setTimeout( this.update() );
		}

//[start-20200604-fei0096-add]//

		VRController.prototype.startWebCam = function( continueScan, callback ){
			let onError = function(err) { console.error("VRController.startWebCam error:", err); };

			var self = this;
			let video = document.createElement('video');
			let configuration = { facing: "environment", };
			let texture = new THREE.VideoTexture(video);
			window.aTexture = texture;
			texture.minFilter = THREE.LinearFilter;
			texture.flipY = false;
			texture.format = THREE.RGBFormat; // THREE.RGBAFormat
			
			let rendererSize = new THREE.Vector2();
			self.vrScene.renderer.getSize( rendererSize );

			if ( navigator.mediaDevices  ) {

				let videoSuccess = function(stream){
					console.log("VRFunc.js: _startWebCam: videoSuccess: stream=", stream );
					video.srcObject = stream;
					readyToPlay = true;
					video.playsInline = true;
					video.onloadedmetadata = function() {
						function tick_video(){
							if (video.videoWidth > 200 || video.videoHeight > 200){
								console.log("VRFunc.js: tick_video play rendererSize[x,y]=", rendererSize.x , rendererSize.y , "video[w, h]=", video.videoWidth, video.videoHeight );
								video.play();

								//////// set the div size depend on video
								let videoWidth, videoHeight;
								let vrDiv = document.getElementById("vrDiv");
								let w, h;
								if ( rendererSize.x/rendererSize.y > video.videoWidth/video.videoHeight ){
									videoWidth  = Math.round(rendererSize.y -0) * video.videoWidth/video.videoHeight ;
									videoHeight = Math.round(rendererSize.y -0);

									w = window.innerWidth  ;
									h = (window.innerWidth/video.videoWidth)* video.videoHeight;
									
								}else{
									// videoWidth  = Math.round( document.documentElement.clientWidth );
									// videoHeight = Math.round( document.documentElement.clientWidth * video.videoHeight/video.videoWidth );
									videoWidth  = Math.round( rendererSize.x );
									videoHeight = Math.round( rendererSize.x * video.videoHeight/video.videoWidth );
									
									w = (window.innerHeight/video.videoHeight) * video.videoWidth ;
									h = window.innerHeight;
								}
								// vrDiv.style.width  = videoWidth + "px" ;    //  
								// vrDiv.style.height = videoHeight + "px" ;//
								// vrDiv.style.top = (document.documentElement.clientHeight - videoHeight)/2 + "px";
								// vrDiv.style.left = (document.documentElement.clientWidth - videoWidth)/2 + "px";

								//// full fill, left nothing blank
								vrDiv.style.width  = w + "px" ;
								vrDiv.style.height = h + "px" ;
								//// align the div and body
								vrDiv.style.left = ( innerWidth - w )/2 + "px" ;
								vrDiv.style.top  = ( innerHeight - h )/2 + "px" ;

								self.vrScene.resize(); ////// it must call after renderer resize

								////// setup the 2D camera
								let camera2D = new THREE.OrthographicCamera( -videoWidth/2, videoWidth/2, -videoHeight/2, videoHeight/2, -10, 20000);
								self.camera2D = camera2D;

								////// setup videoPlane
								let videoPlane = new THREE.Mesh(
									// new THREE.PlaneBufferGeometry(640, 480),
									// new THREE.PlaneBufferGeometry( document.documentElement.clientWidth , document.documentElement.clientHeight ),
									new THREE.PlaneBufferGeometry( videoWidth , videoHeight ),
									new THREE.MeshBasicMaterial( { map:texture, side: THREE.DoubleSide } ) ,
								);
								// videoPlane.material.depthTest = false;
								// videoPlane.material.depthWrite = false;
								videoPlane.position.set(0, 0, -1 );

								videoPlane.visible = false; //// 起始預設不顯示
								videoPlane.videoBackground = true; //// 為了查找
								texture.needsUpdate = true;

								self.scene2D.add( videoPlane );
								
								if ( callback ) { callback(); }

							}else{
								// console.log("tick_video else video[w, h]=", video.videoWidth, video.videoHeight );
								setTimeout(tick_video, 100);
							}
						}
						if ( self.camera2D ){
							console.log("VRFunc.js: _startWebCam: camera2D exist, donothing ");
						}else{
							console.log("VRFunc.js: _startWebCam: camera2D not exist, start video ");
							tick_video();
						}
						
					}
				}

				function startCamrea(stream){
					
					// console.log("VRFunc.js: start _enumerateDevices, stream =" , stream  );
					stream.getTracks().forEach(function(track) {
						// console.log("VRFunc.js: start _enumerateDevices, track =" , track  );
						track.stop();
					});

					navigator.mediaDevices.enumerateDevices().then(function( devices ) {

						let useFacingMode = true;
						let cameraID ;
						let video_constraints;

						devices = devices.filter(function(devices) { return devices.kind === 'videoinput'; });
						for (let i in devices){
							if ( devices[i].label ){ 
								// console.log("VRFunc.js:  devices[i]=", devices[i].label );
								if ( configuration.facing == "environment" ){
									if ( devices[i].label.toLowerCase().search( "back" ) != -1 || devices[i].label.toLowerCase().search( "後" ) != -1  ){ // front back
										cameraID = devices[i].deviceId;
										useFacingMode = false;
										// console.log("VRFunc.js: set useFacingMode false(environment), devices[i].label=", devices[i].label );
									}
									
								} else if (configuration.facing == "user"){
									if ( devices[i].label.toLowerCase().search( "front" ) != -1 || devices[i].label.toLowerCase().search( "前" ) != -1  ){ // front back
										cameraID = devices[i].deviceId;
										useFacingMode = false;
										// console.log("VRFunc.js: set useFacingMode false(user), devices[i].label=", devices[i].label );
									}

								}


							}else{
								// console.log("VRFunc.js: !devices label, devices[i]=", typeof(devices[i].label) , devices[i].label );
							}
							
							// console.log("VRFunc.js: devices= 1 ", devices[i].deviceId , " 2 " , devices[i].label , " 3 " , devices[i].kind , " 4 " , devices[i].toJSON() );
						}

						if (window.navigator.userAgent.toLowerCase().indexOf("mobile") >= 0 ){
							////// iphone part , can only use safari, and the permission of camera will request everytime. Use facingMode 
							if (window.navigator.userAgent.toLowerCase().indexOf("iphone") >=0 && window.navigator.userAgent.toLowerCase().indexOf("safari")>=0 ){
								console.log("VRFunc.js: _startCamera, The system is mobile: iphone ", window.navigator.userAgent.toLowerCase() );

								video_constraints = {
									video: {
										width: { min: 320, ideal: 640, max: 1280 },
										height: { min: 240, ideal: 480, max: 800 }, 
										frameRate: { min:15, ideal: 30, max: 60 },
										facingMode: configuration.facing ,
									}
								};

							}
							////// iphone part , can use chrome/Firefox, the permission of camera will request once.
							if (window.navigator.userAgent.toLowerCase().indexOf("android")>=0 ){
								
								if (useFacingMode){
									console.log("VRFunc.js: _startCamera, The system is mobile: android(use facingMode) "  );
									var facing = configuration.facing;
									video_constraints = {
										video: {
											width: { min: 320, ideal: 640, max: 1280 },
											height: { min: 240, ideal: 480, max: 800 }, 
											frameRate: { min:15, ideal: 30, max: 60 },
											facingMode: facing
										}
										
									};
								}else{
									console.log("VRFunc.js: _startCamera, The system is mobile: android(use cameraID) " , cameraID  );
									video_constraints = {
										video: {
											width: { min: 320, ideal: 640, max: 1280 },
											height: { min: 240, ideal: 480, max: 800 }, 
											frameRate: { min:15, ideal: 30, max: 60 },
											deviceId: { exact:cameraID }
										}
									};
								
								}
							}
						}else{
							console.log("VRFunc.js: _startCamera, The system is PC: ", window.navigator.userAgent.toLowerCase() );
							video_constraints = {
								video: {
									width: { min: 320, ideal: 640, max: 1280 },
									height: { min: 240, ideal: 480, max: 800 }, 
									frameRate: { min:15, ideal: 30, max: 60 },
									facingMode: "environment"
								}
							};
						}

						//////// start simply ////////
						// console.log("VRFunc.js: _startCamera, _getUserMedia: video_constraints " , video_constraints  );
						navigator.mediaDevices.getUserMedia( video_constraints ).then(videoSuccess, onError); // successCallback

					});

				}
				
				navigator.mediaDevices.getUserMedia( {video:{}} ).then( startCamrea , onError);


			} else {
				if (navigator.getUserMedia) {
					navigator.getUserMedia(hdConstraints, success, onError);
				} else {
					onError('navigator.getUserMedia is not supported on your browser');
				}
			}

			
		}

		
//[end---20200604-fei0096-add]//

//[start-20191111-fei0079-add]//
        var checkHost_tick = function() {
            if ( typeof(checkHost) != "undefined" ){
                if ( checkHost == "yet" ){
                    // console.log("VRFunc.js: checkHost = yet");
                    setTimeout(checkHost_tick, 50);
                }else{
                    if ( checkHost == "correct" ){
                        console.log("VRFunc.js: _checkHost_tick correct");
                    } else if ( checkHost == "fail" ){
                        //// remove all childrens of documnet
                        while (document.body.firstChild) {
                            document.body.removeChild(document.body.firstChild);
                        }
                        //// add the warning about Host
                        var divHostWarn = document.createElement('div');
                        divHostWarn.innerHTML = "<br>The host of webVR seems unauthorized,<br> please contact MIFLY ";
                        divHostWarn.style.fontSize = "18px";
                        divHostWarn.style.margin = "5px";
                        divHostWarn.style.fontWeight = "700";
                        document.body.append( divHostWarn );
                    }
                }
            } else {
                console.log("VRFunc.js: checkHost = undefined, something ERROR.");
                // setTimeout(checkHost_tick, 50);
            }
        };
		checkHost_tick();
		Module.checkMifly();
//[end---20191111-fei0079-add]//



		window.showVRProjList = function(){
//20200102-start-thonsha-add
			requestDeviceMotionPermission();
//20200102-end-thonsha-add
			let url = window.serverUrl;
			let makarID;
			let uid = document.getElementById("uid");
			if (window.makarID) {
				makarID = window.makarID;
			}else{
				console.error("VRFunc.js: the window.makarID not exit, FYS");
			}
			////// show the panel by set the class = "" //////
			// var panel = document.getElementById("panel");
			// panel.className = "";
	
			// console.log("VRFunc.js: showVRProjList: ", url, makarID);
			getVRSceneByUserID(url, makarID, function(data){
				console.log("VRFunc.js: showVRProjList: getVRSceneByUserID: callback, publishVRProjs=", publishVRProjs);
				let chooseVRProject = 0;
				if ( typeof(projName) == "string" ){
					for (let i in publishVRProjs.result ){
						if (publishVRProjs.result[i].proj_name.toLowerCase() == projName.toLowerCase()  ){
							chooseVRProject = i;
						}
					}
				}
				
				activeVRScenes(chooseVRProject);

	
			});
	
		};
	
		window.activeVRScenes = function( projIndex, sceneIndex=0){
			
			////// remove the video tag, and clean the memory, must be done before remove the div 
			let videos = document.getElementsByTagName("video");
			if ( videos.length > 0 ){
				for (let i = 0; i < videos.length; i++ ){
					videos[i].pause();
					videos[i].removeAttribute("src"); // empty source 	
					videos[i].load();
				}
			}
			
			////// set the same id=vrDiv, if load the different VR project, remove the div after remove video.
			if (document.getElementById("vrDiv")){
				document.getElementById("vrDiv").remove();
			}
 
			let VRembedded = true;
			let vrDiv;
			////// set the aframe scene
			let vrScene = document.createElement('a-scene');
			vrScene.setAttribute('id', "vrscene" ); ////// just id
			if (!VRembedded){
				document.body.appendChild(vrScene);
			}else{
				vrScene.setAttribute( 'embedded', "" ); ////// add this will make the scene embedded into a div
				vrScene.setAttribute( 'vr-mode-ui', "enabled: false" ); ////// add this will make the scene embedded into a div

				////// set a div above a-scene, must set one of width/height be "xxx px" 
				vrDiv = document.createElement('div');
				vrDiv.style.position = "relative" ;    //  "500px" or "80%"
				vrDiv.setAttribute('id', "vrDiv" ); ////// set the same id, if load the different VR project, remove the div first.
	
				// console.log("VRFunc.js: activeVRScenes: documentDE.WH=", document.documentElement.clientWidth, document.documentElement.clientHeight);
	
				// vrDiv.style.width  = Math.round(document.documentElement.clientWidth *1.0 ) + "px" ;    //  "500px" or "80%"
				// vrDiv.style.height = Math.round(document.documentElement.clientHeight*0.9 ) + "px" ;//  "500px" or "80%"
				
				vrDiv.style.width = document.documentElement.clientWidth + "px" ;    //  "500px" or "100%"
				vrDiv.style.height = Math.round(document.documentElement.clientHeight - 0) + "px" ;//  "500px" or "80%"
	
				// vrDiv.style.left = window.innerWidth*0.1+"px" ; //
				vrDiv.style.top = "0px" ; //
				window.onresize = function(){
					// console.log("window resize: WH=", window.innerWidth, window.innerHeight, vrDiv.clientWidth, vrDiv.clientHeight );
					vrDiv.style.width = document.documentElement.clientWidth + "px" ;    //  "500px" or "100%"
					vrDiv.style.height = Math.round(document.documentElement.clientHeight - 0) + "px" ;//  "500px" or "80%"
				};
				document.body.appendChild(vrDiv);
				vrDiv.appendChild(vrScene);
			}
			
	
			if (vrScene.hasLoaded) {
				initvrscene();
			} else {
				vrScene.addEventListener('loaded', initvrscene);
			}
	
			vrScene.addEventListener('enter-vr', function(){
				// console.log("VRFunc.js: vrScene enter-vr");
			});
			vrScene.addEventListener('renderstart', function(){
				// console.log("VRFunc.js: vrScene renderstart");
			});
			
			
			//////
			////// server V3 
			//////
	
			let vrController = new VRController();
			vrController.VRSceneResult = VRSceneResult;
			vrController.publishVRProjs = publishVRProjs;
			window.vrController = vrController; // 20190921 for debug

			function initvrscene(){
				
				// console.log("VRFunc.js: activeVRScenes: initvrscene vrScene=", vrScene  );
				if ( vrScene.children[2].attributes ){

				}
				// vrScene.children[2].remove(); ////// 20190921: Fei want to remove the default camera, 

				////// add the listener for show the panel or not
				vrScene.canvas.addEventListener("touchstart", startEvent, false);
				vrScene.canvas.addEventListener("mousedown", startEvent, false);
				function startEvent(event){
					document.getElementById("panel").className = "collapsed"; ////// smaller the panel
				}
				

				////// set member into vrController
				let rendererSize = new THREE.Vector2();
				vrScene.renderer.getSize( rendererSize );
				//////// add the 2D scene and 
				let scene2D = new THREE.Scene();
				vrController.scene2D = scene2D;

//20191112-start-thonsha-add
				vrscene.renderer.sortObjects = true;
//20191112-end-thonsha-add
				
				// vrScene.renderer.autoClearColor = false; // make the 2D Camera can render to the same WebGLRenderer of VRScene
				// vrScene.renderer.autoClearDepth = false; // make the 2D Camera can render to the same WebGLRenderer of VRScene
				vrScene.renderer.autoClear = false; // make the 2D Camera can render to the same WebGLRenderer of VRScene
				vrController.GLRenderer = vrScene.renderer;
				
				vrController.vrScene = vrScene;
	
				vrController.setupFunction();

				////// set cursor with animation
				let cursorEntity = document.createElement('a-entity');
				cursorEntity.setAttribute('id', "cursor_main" );
				cursorEntity.setAttribute('cursor', "fuse: true; fuseTimeout: 5" );
				cursorEntity.setAttribute('raycaster', "objects: .clickable" );
				cursorEntity.setAttribute('animation__mouseenter', "property: geometry.thetaLength; delay: 5; startEvents: mouseenter; dur: 5; from: 0.5; to: 360" );
				cursorEntity.setAttribute('animation__mouseleave', "property: geometry.thetaLength; startEvents: mouseleave; dur: 100; from: 360; to: 0.5" );
				cursorEntity.setAttribute('geometry', "primitive: ring; radiusOuter: 0.02; radiusInner: 0.01; thetaLength: 360; thetaStart: 0;" );
				cursorEntity.setAttribute('position', "0 0 -1" );
				cursorEntity.setAttribute('material', "color: red; shader: flat; " );
				////// set cursor default (green)
				let cursorEntityDefault = document.createElement('a-entity');
				cursorEntityDefault.setAttribute('id', "cursor_default" );
				cursorEntityDefault.setAttribute('geometry', "primitive: ring; radiusOuter: 0.02; radiusInner: 0.01; thetaLength: 360; thetaStart: 0;" );
				cursorEntityDefault.setAttribute('position', "0 0 -1.001" );
				cursorEntityDefault.setAttribute('material', "color: #2ADD2A; shader: flat; " );
				////// set the entity to contain a-camera
				// let aCamera = document.createElement('a-camera');
				let aCamera = document.createElement('a-entity');
				aCamera.setAttribute('camera', "" ); 
				////// 20190921 Fei add some code inside  aframe-v0.9.2.js/aframe-v0.9.2.min.js for use touch control vertical view
				aCamera.setAttribute('look-controls', "" ); 
				// aCamera.setAttribute('xytouch-look-controls', "" ); ///// 20190921 Fei stop use it for now.
				aCamera.setAttribute('id', "aCamera" );
				aCamera.setAttribute('position', { x: 0 , y: 0 , z: 0 } ); ////// it is work, but cant get value
				aCamera.setAttribute( "fov", 60 ); ////// it is work, default is 80, 60 is unity set
				aCamera.setAttribute( "near", 0.3 ); ////// it is work, default is 0.3
				aCamera.setAttribute( "far", 10000 ); ////// it is work, default is 10000
				
				// console.log("VRFunc.js: aCamera.object3D.children=", aCamera.object3D.children.length );

				// aCamera.appendChild(cursorEntity);
				// aCamera.appendChild(cursorEntityDefault);
				
				
				////// set the a-entity to wrap the a-camera, the position and roation set here is the default value, will replace when load scene.
				let cameraEntity = document.createElement('a-entity');
				cameraEntity.setAttribute('id', "camera_cursor" ); ////// it is work, can get value!
				cameraEntity.setAttribute('position', {x: 0, y: 0 , z: 0} ); ////// it is work, but cant get value
				cameraEntity.setAttribute('rotation', "0 0 0" ); ////// it is work too, but still can't get value

				cameraEntity.appendChild(aCamera);
				vrScene.appendChild(cameraEntity);// this = vrScene

//20191203-start-thonsha-mod
				let ambientLight = document.createElement("a-light");
				ambientLight.setAttribute("id", "ambientLight");
				ambientLight.setAttribute("type", "ambient" );
				ambientLight.setAttribute("color", "#808080" ); // white / gray / #fff 
				// ambientLight.setAttribute("ground-color", "#fff" ); // #fff , Fei dont know how it work
				ambientLight.setAttribute("intensity", 1 );

				vrScene.appendChild(ambientLight);// this = vrScene

//20191203-end-thonsha-mod

//20200528-thonsha-add-start
				// let cubeCamera = new THREE.CubeCamera( 1, 100000, 128 );
				// vrController.cubeCamera = cubeCamera;
				// console.log("20200528",  vrController.vrScene.camera)
				// vrController.vrScene.object3D.add( cubeCamera );
//20200528-thonsha-add-end

				////// try to modify the aspect ratio of camera, 20190917 Fei fail, I check the vrScene.camera is same as aCamera.object3D.children[2].
				////// But it need wait for the camera loading, at first, it is default camera, then it is the a-camera's object3D
				// console.log("VRFunc.js: activeVRScenes: initvrscene: vrScene.camera = ", vrScene.camera );
				vrScene.addEventListener('camera-set-active', function(evt) { 
					vrDiv = document.getElementById("vrDiv");
					// vrDiv.style.width = document.documentElement.clientWidth + "px" ;    //  "500px" or "100%"
					// vrDiv.style.height = Math.round(document.documentElement.clientHeight - 56) + "px" ;//  "500px" or "80%"
					// console.log("VRFunc.js: activeVRScenes: initvrscene: vrScene.camera active = ", vrScene.camera.aspect, vrDiv.clientWidth, vrDiv.clientHeight );
					vrScene.camera.aspect = vrDiv.clientWidth/vrDiv.clientHeight;
					vrScene.camera.updateProjectionMatrix();
				});
	
	
				////// load the sky: image/video set the sky 360 image.
				// vrController.loadSky(projIndex);

				vrController.startWebCam( false, function(){
					////// load each scenes 
					vrController.loadScene(projIndex, sceneIndex);
					checkHost_tick();
					Module.checkMifly();
					
					setTimeout(function(){
						// vrController.scene2D.children[0].visible = true;
						renderTick();
					}, 1 );
			
				});

				// vrController.loadScene(projIndex, sceneIndex);					
				// checkHost_tick();
				// Module.checkMifly();
				// renderTick();
	
				// console.log("VRFunc.js: initvrscene, done", vrScene, vrScene.object3D );
			}
	
//20200528-thonsha-mod-start		
			var renderTick = function() {

				if (vrController.camera2D){
					if ( true ){
						vrController.GLRenderer.render( vrController.scene2D, vrController.camera2D);
					}
				}else{
					vrController.GLRenderer.clearColor();
				}

				// vrController.GLRenderer.clearStencil();
				// vrController.GLRenderer.clearColor();
				vrController.GLRenderer.clearDepth();

				vrController.GLRenderer.render( vrController.vrScene.object3D, vrController.vrScene.camera );

				// console.log("renderTick");
				requestAnimationFrame(renderTick); // dont use it, because of the haning problem
			};
			
//20200528-thonsha-mod-start	

		}

		
	}




	var scope;
	if (typeof window !== 'undefined') {
		scope = window;
	} else {
		scope = self;
	}
	// scope.VRController = VRController;
	
	let integrateCount = 0;
	var integrateTick = function() {
		integrateCount++ ;
		if ( integrateCount > 3 ){
			console.log("VRFunc.js: integrateTick, integrateCount=", integrateCount, ", too many times" );
			return;
		}

		if (scope.AFRAME && scope.THREE) {
			console.log("VRFunc.js: integrateTick, scope=", scope , integrateCount );
			integrate();
			window.addEventListener("keyup", function(event) {
				if (event.keyCode === 13) {
					event.preventDefault();
					// getScenes();
				}
			});
		} else {
			setTimeout( function(){
				integrateTick( integrateCount );
			} , 500);
		}
	};

	if (typeof window !== 'undefined') {
		integrateTick( integrateCount );
	}

	console.log("VRFunc done, window innerWH",  window.innerWidth, window.innerHeight);
})();
