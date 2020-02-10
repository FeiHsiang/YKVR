////// developVR 20191021 
(function() {
	
	var integrate = function(){


		AFRAME.registerComponent('initvrscene', {
			init: function () {
				var sceneEl = this.el;
			}
		});
	
		AFRAME.registerComponent('cursor-listener', {
			init: function () {
				// console.log('cursor-listener: this.el=', this.el.attributes.src );
				// console.log('cursor-listener: this.el=', this.el );

				// var makarVRIndex = this.el.attributes.makarVRIndex.value; //// test
	
				// this.el.addEventListener('click', function (evt) {
	
				// 	// console.log('cursor-listener: evt=', evt );
				// 	// console.log('I was clicked at: ', evt.detail.intersection.point);
					// console.log('I was clicked, this.object3D = ', this.object3D );

				// 	if ( this.object3D.behav ){
				// 		evt.preventDefault();
				// 		vrController.triggerEvent( this.object3D.behav[0] );
				// 	}
					
				// 	// if (serverVersion == "2.0.0"){
				// 	// 	let vrScene = document.getElementById("vrscene");
				// 	// 	let sky = vrScene.children.sky;
				// 	// 	if ( evt.target.attributes.makarVRIndex ){
				// 	// 		if (VRSceneResult[ evt.target.attributes.makarVRIndex.value ].data.scenes[0].scene_skybox_main_type == "image"){
				// 	// 			// console.log("sky=", sky);
				// 	// 			console.log("VRSceneResult scene[0].scene_skybox_url =", VRSceneResult[ evt.target.attributes.makarVRIndex.value ].data.scenes[0].scene_skybox_url  );
				// 	// 			sky.setAttribute( "src", VRSceneResult[ evt.target.attributes.makarVRIndex.value ].data.scenes[0].scene_skybox_url ); //// 
				// 	// 		}
				// 	// 	}else{
				// 	// 		console.log(" WTF" );
				// 	// 	}
				// 	// }
					
				// 	// var imgString = vrScene.children.makarAssets.children[ makarVRIndex ].attributes.src.value; //// test
				// 	// sky.setAttribute( "src", imgString ); //// test
	
				// } );

				//20191023-start-thonsha-mod

				// this.el.addEventListener( 'touchend', endEvent, false );
				// this.el.addEventListener( 'mouseup', endEvent, false );
				this.el.addEventListener( 'click', clickEvent, false );
				this.el.addEventListener( 'fusing', fusingEvent, false );

				function fusingEvent(event){
					event.preventDefault();
					if (event.target == event.currentTarget){
						// console.log('I was fusing, this.object3D = ', this.object3D , event );.
						if (this.object3D.behav){
							delay = this.object3D.behav[0].display*1000+5;
							// console.log("======= delay :"+delay+" =====");
							let cursor = document.getElementById("cursor_main");
							cursor.setAttribute('cursor', "fuseTimeout:"+ delay);
							cursor.setAttribute('animation__mouseenter', "dur: "+delay );
						}
					}
					

				}	

				function clickEvent( event ) {
					event.preventDefault();
					
					if (event.target == event.currentTarget){
						// console.log('I was clicked, this.object3D = ', this.object3D , event );
						
						if ( this.object3D.behav ){
							let reset = false;
							for(let i=0;i<this.object3D.behav.length;i++){
								if (this.object3D.behav[i].simple_behav == "CloseAndResetChildren"){
									reset = true;
								}
							}

							for(let i=0;i<this.object3D.behav.length;i++){
								if (this.object3D.behav[i].simple_behav != "CloseAndResetChildren"){
									vrController.triggerEvent( this.object3D.behav[i], reset );
								}
							}
							
						}
					}
				}
				
				//20191023-end-thonsha-mod

			}
		});
	
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

			//// for update
			this.FUNCTION_ENABLED = false;
			this.clock = new THREE.Clock();
			this.delta = this.time = 0;
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
				// console.log("VRFunc.js: VRController: _loadScene: [projectIndex, sceneIndex]=", projIndex, sceneIndex);

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

					self.loadAssets(); //// for video elements
					self.loadSceneObjects(projIndex, sceneIndex);
					setTimeout( function(){
						self.loadSky(projIndex, sceneIndex);
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
							aSky.setAttribute("material", {src: "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/Spherical_Image/SphericalImage.png" });
						}
						else{
							aSky.setAttribute("material", {src: self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url }); //  
						}
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
				let scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs;
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

							// camera_cursor.object3D.rotation.set( 0, 180 * Math.PI/180 , 0 , "YXZ" ); ///// actually, looks control will control this object3D, but I cant modify it directly..  
							// console.log("VRFunc.js: _loadSceneObjects: camera: ", i, scene_objs[i], rotation );							

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

							// console.log("VRFunc.js: _loadSceneObjects: model", i, scene_objs[i]  );
							
							if (userProjResDict[ scene_objs[i].res_id ] ){
								// console.log("VRFunc.js: _loadSceneObjects: model res_url", i, obj.res_url, userProjResDict[obj.res_id].res_url  );
								//20191025-start-thonsha-mod
								if (scene_objs[i].res_url == userProjResDict[scene_objs[i].res_id].res_url){
									setTimeout( function(){
										self.loadGLTFModel(scene_objs[i], position, rotation, scale );
									}, 1 );
									// self.loadGLTFModel(scene_objs[i], position, rotation, scale );
								}
								else if (scene_objs[i].res_url_fbx == userProjResDict[scene_objs[i].res_id].res_url_fbx ){
									// console.log("%cVRFunc.js: _loadSceneObjects: model res_url_fbx is same as userProjResDict", "color:blue"   );

									setTimeout( function(){
										self.loadFBXModel(scene_objs[i], position, rotation, scale );
									}, 1 );

								}else{
									console.log("%cVRFunc.js: _loadSceneObjects: model res_url_fbx is different from userProjResDict!", "color:red" , i , obj, userProjResDict[obj.res_id] );	
								}
								//20191025-end-thonsha-mod
							}else{
								console.log("%cVRFunc.js: _loadSceneObjects: model res_id not exist!", "color:red" , i );	
							}
							
							break;
						
						default:
							console.log("VRFunc.js: _loadSceneObjects: default", i, self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs[i] );
							
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
						plane.setAttribute("makarVRIndex", i ); //// fei add
						plane.setAttribute("cursor-listener", true ); //// fei add
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
								plane.setAttribute( "material", "side:double; opacity: 1.0; transparent: true; " ); //// it is work
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
							}else{
								console.log("VRFunc.js: loadTexture: loaded target different" );
							}
						});
						//20191031-end-thonsha-mod
	
						//20181029-start-thonhsa-add
						if(obj.obj_parent_id){
							plane.setAttribute("visible", false);
							plane.setAttribute('class', "unclickable" );
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
						//20181029-end-thonhsa-add
						
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
					
				// anchor.setAttribute("geometry","primitive: sphere; radius: 0.05" );
				// anchor.setAttribute("material","roughness: 0.48; color:	#FF0000");
				self.setTransform(anchor, position, rotation, scale);
				anchor.setAttribute( "id", obj.obj_id );//// fei add 
				self.makarObjects.push( anchor );
				
				
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
							textLength += 0.85;
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
				textEntity.setAttribute("font","font/bbttf-msdf.json");
				textEntity.setAttribute("negate","false");

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
				textEntity.setAttribute("makarVRIndex", i ); //// fei add
				textEntity.setAttribute("cursor-listener", true ); //// fei add

				// self.setTransform(textEntity, position, rotation, scale);
				// self.makarObjects.push( textEntity );

				textEntity.addEventListener("loaded", function(evt){
					console.log("VRFunc.js: loaded trigger");
					if (evt.target == evt.currentTarget){

						let r = new THREE.Vector3();
						r.set(0,Math.PI, 0); 
						textEntity.object3D.rotation.setFromVector3(r);
						// textEntity.object3D.children[0].rotation.setFromVector3(r);
						// textEntity.object3D.children[0].position.x = -textEntity.object3D.children[0].position.x;

						textEntity.object3D["makarObject"] = true; 
						if ( obj.behav ){
							textEntity.object3D["behav"] = obj.behav ;
						}
					}
				});


				///
				anchor.appendChild(textEntity);
				///

				if(obj.obj_parent_id){
					textEntity.setAttribute("visible", false);
					textEntity.setAttribute('class', "unclickable" );
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
			
			this.loadGLTFModel = function(obj, position, rotation, scale){

				let assets = document.getElementById("makarAssets");

				let assetsitem = document.createElement("a-asset-item")
				assetsitem.setAttribute("id", obj.obj_id+"_"+obj.res_id);
				assetsitem.setAttribute("src",obj.res_url);
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
				modelEntity.setAttribute("makarVRIndex", i ); //// fei add
				modelEntity.setAttribute("cursor-listener", true ); //// fei add

				self.setTransform(modelEntity, position, rotation, scale);
				self.makarObjects.push( modelEntity );

				//20191125-start-thonsha-add
				modelEntity.addEventListener("model-loaded", function(evt){ // model-loaded  / object3dset
					// console.log("VRFunc.js: VRController: _loadGLTFModel, object3dset: evt=", evt );
					if ( evt.target ==  evt.currentTarget ){
						if ( modelEntity.object3D ){
							modelEntity.object3D["makarObject"] = true;
							if ( obj.behav ){
								modelEntity.object3D["behav"] = obj.behav ;
							}

				//20191203-start-thonsha-add
							if (obj.material){

								for(let i = 0; i < obj.material.length; i++){
									let rgb = obj.material[i].color.split(",");
									let color = new THREE.Color(parseFloat(rgb[0]),parseFloat(rgb[1]),parseFloat(rgb[2]));
			
									const objj = modelEntity.getObject3D('mesh');
									objj.traverse(node => {
										if(node.material){
											if (node.material.name == obj.material[i].name) {
												node.material.color = color;
											}
										}
									});
								}

							}
				//20191203-start-thonsha-add							
							
							evt.detail.model.animationSlices = animationSlices;
						}
					}else{
						// console.log("VRFunc.js: VRController: _loadFBXModel, target!=currentTarget", obj.res_name, modelEntity.object3D.children );
					}
				});

				//20191125-end-thonsha-add

				//20181029-start-thonhsa-add
				if(obj.obj_parent_id){
					modelEntity.setAttribute("visible", false);
					modelEntity.setAttribute('class', "unclickable" );
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
				//20181029-end-thonhsa-add
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
				modelEntity.setAttribute("makarVRIndex", i ); //// fei add
				modelEntity.setAttribute("cursor-listener", true ); //// fei add

				self.setTransform(modelEntity, position, rotation, scale);
				self.makarObjects.push( modelEntity );
				//20181029-start-thonhsa-add
				if(obj.obj_parent_id){
					modelEntity.setAttribute("visible", false);
					modelEntity.setAttribute('class', "unclickable" );
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
				//20181029-end-thonhsa-add
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
					// soundEntity.setAttribute("")

					self.makarObjects.push( soundEntity );
					if(obj.obj_parent_id){
						soundEntity.setAttribute("sound", "autoplay: false");
						soundEntity.setAttribute("visible", false);
						soundEntity.setAttribute('class', "unclickable" );
						let timeoutID = setInterval( function () {
							let parent = document.getElementById(obj.obj_parent_id);
							if (parent){ 
								if(parent.object3D.children.length > 0){
									parent.appendChild(soundEntity);
									window.clearInterval(timeoutID);
								} 
							}
						}, 1);
					}
					else{	
						self.vrScene.appendChild(soundEntity);
					}

					soundEntity.addEventListener("loaded", function(evt){

						if (evt.target == evt.currentTarget){
							soundEntity.object3D["makarObject"] = true; 
							if ( obj.behav ){
								soundEntity.object3D["behav"] = obj.behav ;
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
				mp4Video.autoplay = true;
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
					videoPlane.setAttribute("cursor-listener", true ); //// fei add

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
						}
					});
					
					self.makarObjects.push( videoPlane );
					//20181029-start-thonhsa-add
					if(obj.obj_parent_id){
						videoPlane.setAttribute("visible", false);
						videoPlane.setAttribute('class', "unclickable" );
						mp4Video.autoplay = false;
						let timeoutID = setInterval( function () {
							let parent = document.getElementById(obj.obj_parent_id);
							if (parent){
								if(parent.object3D.children.length > 0){
									parent.appendChild(videoPlane);
									window.clearInterval(timeoutID);
								} 
							}
						}, 1);
					}
					else{
						// mp4Video.autoplay = true;
						self.vrScene.appendChild(videoPlane);
					}
					//20181029-end-thonhsa-add
				

					// }, 1 );
					// self.vrScene.appendChild(videoPlane);

					// console.log("VRFunc.js: VRController: loadVideo, videoPlane=", videoPlane );
				}
				
				
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
		}

		VRController.prototype.triggerEvent = function( event, reset, GLRenderer, arScene, makarObj ){
			if (!this.FUNCTION_ENABLED){
				return;
			}
			var self = this;

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
								window.activeVRScenes(i,j);
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
					if (target.getAttribute("visible")){
						target.setAttribute("visible",false);
						target.setAttribute('class', "unclickable" );

						target.object3D.traverse(function(child){
							if (child.type=="Group"){
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
								
								
								if(child.el.getAttribute("sound")){
									child.el.components.sound.pauseSound();
										
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
						if(target.object3D.behav){
							target.setAttribute('class', "clickable" );
						}

						target.object3D.traverse(function(child){
							if (child.type=="Group"){
								if (child.el.getAttribute("visible")){
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

									if(child.el.getAttribute("sound")){
										child.el.components.sound.playSound();
											
									}
									
								}
							}
							
						});
						
						
					}
					break;
				
				case "ShowModel":
					console.log("VRFunc.js: triggerEvent: ShowModel: event=", event );	
					obj_id = event.obj_id;
					target = document.getElementById(obj_id);
					if (target.getAttribute("visible")){
						target.setAttribute("visible",false);
						target.setAttribute('class', "unclickable" );

						target.object3D.traverse(function(child){
							if (child.type=="Group"){
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

								if(child.el.getAttribute("sound")){
									child.el.components.sound.pauseSound();
										
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
						if(target.object3D.behav){
							target.setAttribute('class', "clickable" );
						}

						target.object3D.traverse(function(child){
							if (child.type=="Group"){
								if (child.el.getAttribute("visible")){
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

									if(child.el.getAttribute("sound")){
										child.el.components.sound.playSound();
											
									}
									
								}
							}
							
						});
						
						
					}
					break;

				case "PlayMusic":
					console.log("VRFunc.js: triggerEvent: PlayMusic: event=", event );
					obj_id = event.obj_id;
					target = document.getElementById(obj_id);
					
					if(target.getAttribute("visible")){
						target.setAttribute("visible",false);
						target.setAttribute('class', "unclickable" );
						target.components.sound.pauseSound();
					}
					else{
						target.setAttribute("visible",true);
						if(target.object3D.behav){
							target.setAttribute('class', "clickable" );
						}
						target.components.sound.playSound();
					}

					break;
					
				case "ShowVideo":
					console.log("VRFunc.js: triggerEvent: ShowVideo: event=", event );	
					obj_id = event.obj_id;
					target = document.getElementById(obj_id);
					// console.log(target)
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

								if(child.el.getAttribute("sound")){
									child.el.components.sound.pauseSound();
										
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

									if(child.el.getAttribute("sound")){
										child.el.components.sound.playSound();
											
									}
									
								}
							}
							
						});
						
						
					}
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


		////// 20190921: Not use 
		// VRController.prototype.loadMAKARVRProjects = function(){
		// 	// console.log("VRFunc.js: loadMAKARVRProjects, this.vrScene= ", this.vrScene );
	
		// 	// let projectPlane = document.createElement("a-plane");
		// 	// projectPlane.setAttribute('position', {x: 0, y: 1.1 , z: -2});
		// 	// // projectPlane.setAttribute('class', "clickable" );
		// 	// this.vrScene.appendChild( projectPlane );
	
		// 	for (let i = 0; i < publishVRProjs.result.length; i++ ){
		// 		publishVRProjs.result[i].snapshot_url;
		// 		// console.log("VRFunc.js: loadMAKARVRProjects: snapShot=", userVRData.result[i].snapshot_url);
		// 		let projectPlane = document.createElement("a-plane");
		// 		projectPlane.setAttribute('position', {x: -2*i + 1, y: 1.1 , z: 1} );//// origin 
		// 		projectPlane.setAttribute( "src", publishVRProjs.result[i].snapshot_url ); //// origin
	
		// 		projectPlane.setAttribute('class', "clickable" ); //// fei add
		// 		projectPlane.setAttribute("makarVRIndex", i ); //// fei add
		// 		projectPlane.setAttribute("cursor-listener", true ); //// fei add
	
		// 		this.vrScene.appendChild( projectPlane );
	
		// 	}
		// }

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
			let url = window.serverUrl;
			let makarID;
			let uid = document.getElementById("uid");
			if (uid) {
				makarID = uid.value;
			}else{
				makarID = window.makarID;
			}
			////// show the panel by set the class = "" //////
			var panel = document.getElementById("panel");
			panel.className = "";
	
			// console.log("VRFunc.js: showVRProjList: ", url, makarID);
			getVRSceneByUserID(url, makarID, function(data){
				// console.log("VRFunc.js: showVRProjList: getVRSceneByUserID: callback, data=", data);
				
				////// get the variables
				let projs = document.getElementById("projs");
				let snapShotRow = projs.rows.proj_snapshot;
				let projNameRow = projs.rows.proj_name;
				let snapShotNumber = snapShotRow.children.length;
				let projNameNumber = projNameRow.children.length;
				////// clear the table
				for (let i=0; i<snapShotNumber; i++) snapShotRow.deleteCell(0);
				for (let i=0; i<projNameNumber; i++) projNameRow.deleteCell(0);

//20191111-start-thonsha-add
				let str = data;
                if (typeof(data) == "string"){ ////// error
                    console.log("VRFunc.js: _showVRProjList: _getVRSceneByUserID: callback, str=", data);
                    document.getElementById("pUserInfo").innerHTML = str;
                    document.getElementById("pUserInfo").style.color = "red";
                }else{
                    document.getElementById("pUserInfo").innerHTML = "";
                    document.getElementById("pUserInfo").style.color = "white";
                    ////// setup the table
                    for (let i = 0; i<data.length; i++){
                        ////// insert project name
                        let projNameCell = projNameRow.insertCell( i );
                        projNameCell.innerHTML =  window.publishVRProjs.result[i].proj_name;
                        ////// insert project snapShot
                        let snapShotCell = snapShotRow.insertCell( i );
                        let _img = document.createElement('img');
                        _img.src = window.publishVRProjs.result[i].snapshot_url;
                        _img.width = 150;
                        _img.height = 150;
                        
                        let chooseVRProject = function(e){
                            // console.log("VRFunc.js: chooseVRProject, e=", e); // e will be the img tag
                            document.getElementById('home').style.display = "none"; ////// make the home page disappear
                            document.getElementById("panel").className = "collapsed"; ////// smaller the panel
                            activeVRScenes( i );
                        };
                        _img.onclick = function(){
                            chooseVRProject(this);
                        }
        
                        snapShotCell.appendChild(_img);
                    }
                    
                }
//20191111-end-thonsha-add
	
				// console.log("projNameRow=", projNameRow, "snapShotRow=", snapShotRow);
	
	
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
				////// set a div above a-scene, must set one of width/height be "xxx px" 
				vrDiv = document.createElement('div');
				vrDiv.style.position = "relative" ;    //  "500px" or "80%"
				vrDiv.setAttribute('id', "vrDiv" ); ////// set the same id, if load the different VR project, remove the div first.
	
				// console.log("VRFunc.js: activeVRScenes: documentDE.WH=", document.documentElement.clientWidth, document.documentElement.clientHeight);
	
				// vrDiv.style.width  = Math.round(document.documentElement.clientWidth *1.0 ) + "px" ;    //  "500px" or "80%"
				// vrDiv.style.height = Math.round(document.documentElement.clientHeight*0.9 ) + "px" ;//  "500px" or "80%"
				
				vrDiv.style.width = document.documentElement.clientWidth + "px" ;    //  "500px" or "100%"
				vrDiv.style.height = Math.round(document.documentElement.clientHeight - 56) + "px" ;//  "500px" or "80%"
	
				// vrDiv.style.left = window.innerWidth*0.1+"px" ; //
				vrDiv.style.top = "56px" ; //
				window.onresize = function(){
					// console.log("window resize: WH=", window.innerWidth, window.innerHeight, vrDiv.clientWidth, vrDiv.clientHeight );
					vrDiv.style.width = document.documentElement.clientWidth + "px" ;    //  "500px" or "100%"
					vrDiv.style.height = Math.round(document.documentElement.clientHeight - 56) + "px" ;//  "500px" or "80%"
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
				
				vrController.setupFunction();
				////// set member into vrController
				let rendererSize = new THREE.Vector2();
				vrScene.renderer.getSize( rendererSize );
//20191112-start-thonsha-add
				vrscene.renderer.sortObjects = true;
//20191112-end-thonsha-add
	
				vrController.vrScene = vrScene;
	
				////// set cursor with animation
				let cursorEntity = document.createElement('a-entity');
				cursorEntity.setAttribute('id', "cursor_main" );
				cursorEntity.setAttribute('cursor', "fuse: true; fuseTimeout: 5" );
				cursorEntity.setAttribute('raycaster', "objects: .clickable" );
				cursorEntity.setAttribute('animation__mouseenter', "property: geometry.thetaLength; delay: 5; startEvents: mouseenter; dur: 5; from: 0.5; to: 360" );
				cursorEntity.setAttribute('animation__mouseleave', "property: geometry.thetaLength; startEvents: mouseleave; dur: 100; from: 360; to: 0.5" );
				cursorEntity.setAttribute('geometry', "primitive: ring; radiusOuter: 0.04; radiusInner: 0.02; thetaLength: 360; thetaStart: 0;" );
				cursorEntity.setAttribute('position', "0 0 -1" );
				cursorEntity.setAttribute('material', "color: red; shader: flat; " );
				////// set cursor default (green)
				let cursorEntityDefault = document.createElement('a-entity');
				cursorEntityDefault.setAttribute('id', "cursor_default" );
				cursorEntityDefault.setAttribute('geometry', "primitive: ring; radiusOuter: 0.04; radiusInner: 0.02; thetaLength: 360; thetaStart: 0;" );
				cursorEntityDefault.setAttribute('position', "0 0 -1.001" );
				cursorEntityDefault.setAttribute('material', "color: #2ADD2A; shader: flat; " );
				////// set the entity to contain a-camera
				let aCamera = document.createElement('a-camera');
				////// 20190921 Fei add some code inside  aframe-v0.9.2.js/aframe-v0.9.2.min.js for use touch control vertical view
				aCamera.setAttribute('look-controls', "" ); 
				// aCamera.setAttribute('xytouch-look-controls', "" ); ///// 20190921 Fei stop use it for now.
				aCamera.setAttribute('id', "aCamera" );
				aCamera.setAttribute('position', { x: 0 , y: 0 , z: 0 } ); ////// it is work, but cant get value
				aCamera.setAttribute( "fov", 60 ); ////// it is work, default is 80, 60 is unity set
				aCamera.setAttribute( "near", 0.3 ); ////// it is work, default is 0.3
				aCamera.setAttribute( "far", 10000 ); ////// it is work, default is 10000
				
				// console.log("VRFunc.js: aCamera.object3D.children=", aCamera.object3D.children.length );
				aCamera.appendChild(cursorEntity);
				aCamera.appendChild(cursorEntityDefault);
				// console.log("VRFunc.js: aCamera=", aCamera );
	
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
				ambientLight.setAttribute("color", "#353535" ); // white / gray / #fff 
				ambientLight.setAttribute("ground-color", "#fff" ); // #fff , Fei dont know how it work
				ambientLight.setAttribute("intensity", 1.0 );

				vrScene.appendChild(ambientLight);// this = vrScene


				let directLight = document.createElement("a-light");
				directLight.setAttribute("id", "directLight");
				directLight.setAttribute("type", "directional" );
				directLight.setAttribute("color", "#FFFFFF" ); // white / gray / #fff 
				directLight.setAttribute("intensity", 1.0 );
				var a = new THREE.Euler( 50/180*3.1416, 30/180*3.1416, 0, 'XYZ' );
				var b = new THREE.Vector3( 0, 0, -1 );
				b.applyEuler(a);
				console.log("directLight: ",b)
				directLight.setAttribute("position",b);

				vrScene.appendChild(directLight);// this = vrScene

//20191203-end-thonsha-mod

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

				////// load each scenes 
				// console.log("VRFunc.js: activeVRScenes: initvrscene: vrController= ", projIndex, vrController.VRSceneResult[projIndex], vrController.publishVRProjs.result[projIndex]  );
				// vrController.loadAssets();
				vrController.loadScene(projIndex, sceneIndex);
				
				// vrController.update();
				checkHost_tick();
				Module.checkMifly();

				////// setup the test 3D object, it is work
				// vrController.loadTexture();
	
				////// setup the default button.
				//// make the stable scene2D renderer, prepare for future.
				// let test = new THREE.Object3D();
				// vrController.loadTexture2D(test, "../images/homeIcon1.png"); // homeIcon1.png, homeIcon2.jpg			
				// test.position.set( -rendererSize.x + 150 , -rendererSize.y + 150, 0 );
				// scene2D.add(test);
	
				// let plane = new THREE.Mesh( new THREE.PlaneBufferGeometry(100, 100, 0), new THREE.MeshBasicMaterial( {side: THREE.BackSide, color: new THREE.Color("rgb(50,150,50)") } ) );
				// plane.position.set( -rendererSize.x + 50 , -rendererSize.y + 50, 0 );
				// scene2D.add(plane);
				
				// renderTick();
	
				// console.log("VRFunc.js: initvrscene, done", vrScene, vrScene.object3D );
			}
	
			
			var renderTick = function() {
				vrController.GLRenderer.clearDepth();
				vrController.GLRenderer.render( vrController.scene2D, vrController.camera2D);
				// console.log("renderTick");
				requestAnimationFrame(renderTick); // dont use it, because of the haning problem
			};
	

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
