////// developVR 20191021 
(function() {
	
	var integrate = function(){


		AFRAME.registerComponent('initvrscene', {
			init: function () {
				var sceneEl = this.el;
			}
		});
	
		
		var VRController = function(){
			//// scene 2D part
			this.GLRenderer = null;
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

			this.projectIdx = 0;

			this.currentSceneIndex = null;
			//// 沒有特別的用意，主要是為了讓每次 create <video> 的 id 不相同
			this.loadSceneCount = 0;
			this.triggerEnable = false;
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
				// loadPage.style.display = "block";

				if (self.currentSceneIndex == sceneIndex){
					console.log("VRFunc.js: VRController: _loadScene: same scene");
				}
				else if (self.VRSceneResult[projIndex].scenes[sceneIndex] == undefined ){
					console.log("VRFunc.js: VRController: _loadScene: error, [valid sceneIndex]=", self.VRSceneResult[projIndex].scenes.length, sceneIndex);
				}else{
					loadPage.style.display = "block";

					if (self.makarObjects){ //// clean the additional object( without default object like, camera, cursor,  )
						for (let i = 0; i < self.makarObjects.length; i++ ){

							let makarObject = self.makarObjects[i];
							// makarObject.parentNode.removeChild( makarObject ); // this will remove the children, childNodes and object3D's children
							makarObject.remove();

						}
						self.makarObjects.length = 0; // clean the array.
					}
					
					self.loadSceneCount++;
					self.loadAssets(); //// for video elements
					self.loadSceneObjects(projIndex, sceneIndex);
					setTimeout( function(){
						self.currentSceneIndex = sceneIndex;
						self.loadSky(projIndex, sceneIndex);
					}, 1 );
					////// 延後 三秒鐘 讓觸發事件工作
					setTimeout(function(){
						console.log("VRFunc.js: _loadScene: set triggerEnable true ");
						self.triggerEnable = true;
					}, 3000);

				}
			}


			this.editorVerionControll = function (editor_version , projIndex , sceneIndex ){
				let scene_objs;

				//// 一定要含有大中小三個版號
				if (editor_version.length == 3) {
					
					//// 大中小版號
					let v0 = editor_version[0], v1 = editor_version[1], v2 = editor_version[2];

					switch(v0){
						case "3":
							if ( v1 == 0 && v2 <= 6 ){
								if ( !Array.isArray(self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs ) ){
									console.log("VRFunc.js: _editorVerionControll the scenes[sceneIndex] is not Array, error", self.VRSceneResult[projIndex] );
									return -1;
								}
								console.log("VRFunc.js: _editorVerionControll: the editor version before 3.0.6", self.VRSceneResult[projIndex] );
								scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs;
							} else if ( v1 == 1 || ( v1 ==0 && v2 >= 7 ) ) {
								console.log("VRFunc.js: _editorVerionControll: the editor version after 3.0.7", self.VRSceneResult[projIndex] );
								scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].objs;
							} else if ( v1 == 2  ){
								console.log("VRFunc.js: _editorVerionControll: the editor version is 3.2.n ", self.VRSceneResult[projIndex] );
								scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].objs;
								//// 此版本需要由 scenes 下調整相機參數 
								if (self.VRSceneResult[projIndex].scenes[sceneIndex].camera_rotation && self.VRSceneResult[projIndex].scenes[sceneIndex].fov){

									let rotation = new THREE.Vector3().fromArray(self.VRSceneResult[projIndex].scenes[sceneIndex].camera_rotation.split(",").map(function(x){return Number(x)}) );
									rotation.multiply( new THREE.Vector3(-1,-1,0) ).add( new THREE.Vector3(0, 180, 0) );
									
									let circle = Math.round (rotation.x / 360);
									rotation.x -= circle*360;

									let camera_cursor = document.getElementById( "camera_cursor" );
									let aCamera = document.getElementById( "aCamera" );
									
									// camera_cursor.setAttribute("rotation", rotation ); ////// it is work
									function lookContorlsLoaded(){
										console.log("VRFunc.js: _editorVerionControll: aCamera loaded rotation=", rotation );
										
										// aCamera.components["look-controls"].yawObject.rotation.set(0,0,0);
										// aCamera.components["look-controls"].pitchObject.rotation.set(0,0,0);

										aCamera.components["look-controls"].yawObject.rotation.y = rotation.y/180*Math.PI;
										aCamera.components["look-controls"].pitchObject.rotation.x = rotation.x/180*Math.PI;
										aCamera.object3D.position.set(0,0,0);
										
										console.log("VRFunc.js: _loadSceneObjects aCamera: yawr=", aCamera.components["look-controls"].yawObject.rotation ,
																					   ", pitchr=" , aCamera.components["look-controls"].pitchObject.rotation  );
										
										aCamera.removeEventListener("look-controls-loaded", lookContorlsLoaded); // 假如重新載入場景，不能再執行一次
									}

									//// reset the aCamera 
									if (aCamera.components["look-controls"].yawObject && aCamera.components["look-controls"].pitchObject){

										console.log("VRFunc.js: _editorVerionControll: aCamera look-controls already set" );
										lookContorlsLoaded({});
									}else{
										console.log("VRFunc.js: _editorVerionControll: aCamera look-controls not set yet" );
										aCamera.addEventListener("look-controls-loaded" , lookContorlsLoaded );
									}
								}


							}else {
								console.error("VRFunc.js: _editorVerionControll: the editor version after 3.2 , error ", self.VRSceneResult[projIndex] );
							}

							break;
						case "2":
						case "1":
							console.log("VRFunc.js: _editorVerionControll: largeVersion below 3" , self.VRSceneResult[projIndex] );
							scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs;
							break;

						default:
							console.log("VRFunc.js: _editorVerionControll: missing large version " , self.VRSceneResult[projIndex] );
					}


 				}else{

					if ( self.VRSceneResult[projIndex].editor_ver == "" ){
						////// the empty editor_ver , do version below 3.0.6 
						if ( !Array.isArray(self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs ) ){
							console.log("VRFunc.js: _loadSceneObjects the scene_objs_v2 is not Array, error", self.VRSceneResult[projIndex] );
							return -1;
						}
						console.log("VRFunc.js: _loadSceneObjects: the editor version empty", self.VRSceneResult[projIndex] );
						scene_objs = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_objs;
					}


				}
				  
				
				return scene_objs;
			}




	////// load the sky, 360 image/video
			this.loadSky = function( projIndex, sceneIndex ){
				// console.log("VRFunc.js: _loadSky: main type=", VRSceneResult[projIndex].scenes[0].scene_skybox_main_type, VRSceneResult[projIndex].scenes[0].scene_skybox_url);
				// scene_skybox_main_type: "spherical_video"
				let aSky;
				switch ( self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_main_type ){
					case "spherical_image":
					case "image":

					if (document.getElementById("sky")){
							aSky = document.getElementById("sky");
							if (aSky.localName == "a-sky"){
								//// 之前的 sky 是圖片，什麼都不用作
							}else if (aSky.localName == "a-videosphere"){
								//// 之前的 sky 是影片
								aSky.remove();
								aSky = document.createElement('a-sky');
								aSky.setAttribute('id', "sky" );
								self.vrScene.appendChild(aSky);
							}
						}else{
							aSky = document.createElement('a-sky');
							aSky.setAttribute('id', "sky" );
							self.vrScene.appendChild(aSky);
						}

						if(self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url == "DefaultResource/Spherical_Image/SphericalImage.png"){
							self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/Spherical_Image/SphericalImage.png"
						}

						aSky.setAttribute("material", {"src": self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url }); 

						aSky.setAttribute("radius", 2000 ); // if not set this, will be infinite
						// aSky.setAttribute('id', "sky" );
						// self.vrScene.appendChild(aSky);
						// self.makarObjects.push( aSky );

						var handleLoadingPage = function(){
							console.log("VRFunc.js: _loadSky: spherical_image materialtextureloaded, remove loading page ");
							loadPage.style.display = "none";
							//// 將自己移除事件，避免重複觸發事件
							aSky.removeEventListener("materialtextureloaded" , handleLoadingPage );
						};
						aSky.addEventListener("materialtextureloaded" , handleLoadingPage );

						break;
	
					case "spherical_video":
						////// a-assets
						let assets = document.getElementById("makarAssets");
						
						////// mp4 video 
						if (document.getElementById("sky")){
							aSky = document.getElementById("sky");
							if (aSky.localName == "a-sky"){
								//// 之前的 sky 是圖片，刪掉再創新的
								aSky.remove();
								aSky = document.createElement('a-videosphere');
								aSky.setAttribute('id', "sky" );
								self.vrScene.appendChild(aSky);
							}else if (aSky.localName == "a-videosphere"){
								//// 之前的 sky 是影片，不用額外動作
								
							}
						}else{
							aSky = document.createElement('a-videosphere');
							aSky.setAttribute('id', "sky" );
							self.vrScene.appendChild(aSky);
						}

						let skyVideo = document.createElement("video");
						skyVideo.src = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url;  
						skyVideo.playsInline = true;
						skyVideo.setAttribute("loop", "true" ); 
						skyVideo.setAttribute('type', 'video/mp4');
						skyVideo.onloadedmetadata = function() {

							//// 假如不是第一次進入場景，基本上都有點擊事件後進來
							if (self.loadSceneCount > 1){
								skyVideo.autoplay = true;
								skyVideo.setAttribute("autoplay", "true" ); 
								skyVideo.play();
								return;
							}

							if (window.Browser){
								//// 假如在 firefox(mozilla) 上不需要同意即可播放影片
								//// chrome 跟 safari 上 需要跳出點擊同意視窗來啟動影片
								if (window.Browser.name == "mozilla" ){
									skyVideo.autoplay = true;
									skyVideo.setAttribute("autoplay", "true" ); 
									skyVideo.play();
								} else {
									skyVideo.autoplay = false;
									skyVideo.setAttribute("autoplay", "false" ); 
									
									let wholeDiv = document.createElement("div");
									wholeDiv.style.position = "absolute";
									wholeDiv.style.top = "0px";
									wholeDiv.style.left = "0px";
									wholeDiv.style.width = "100%";
									wholeDiv.style.height = "100%";
									document.body.appendChild(wholeDiv);

									let clickImg = document.createElement("img");
									clickImg.setAttribute("id" , "clickImg" );
									clickImg.src = "https://mifly0makar0assets.s3-ap-northeast-1.amazonaws.com/DefaultResource/2D/button/click.png";

									clickImg.style.position = "absolute";
									
									clickImg.onload = function(){
										clickImg.style.left = "calc(50% - " + clickImg.width/2 + "px )";
										clickImg.style.top  = "calc(50% - " + clickImg.height/2 + "px )";
										aSky.setAttribute('opacity', 0 );

										wholeDiv.onclick = function(){
											console.log(" **** click **** " );

											skyVideo.play().then(() =>{
												console.log(" **** play then remove clickImg **** " );
												aSky.setAttribute('opacity', 1 );
												wholeDiv.remove();
											});
										};
									};

									wholeDiv.appendChild(clickImg);
								}
							}
							
						}

						skyVideo.setAttribute('crossorigin', 'anonymous');
						// skyVideo.setAttribute('id', 'skyVideo');
						skyVideo.setAttribute('id', self.VRSceneResult[projIndex].scenes[sceneIndex].scene_id + "_" + self.loadSceneCount );

						// skyVideo.play(); // play pause
						
						assets.appendChild(skyVideo); ////// add video into a-assets
						// aSky.setAttribute("src", "#skyVideo" );  
						aSky.setAttribute("src", "#"+self.VRSceneResult[projIndex].scenes[sceneIndex].scene_id + "_" + self.loadSceneCount ); // 

	
						aSky.setAttribute("radius", 2000 ); // if not set this, will be infinite
						// aSky.setAttribute('id', "sky" );
						// self.vrScene.appendChild(aSky);
						// self.makarObjects.push( aSky );

						var handleLoadingPage = function(){
							console.log("VRFunc.js: _loadSky: spherical_video materialtextureloaded, remove loading page ");
							loadPage.style.display = "none";
							//// 將自己移除事件，避免重複觸發事件
							aSky.removeEventListener("materialtextureloaded" , handleLoadingPage );
						};
						aSky.addEventListener("materialtextureloaded" , handleLoadingPage );

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
				
				let scene_objs = [];
				var editor_version = [];
				if (typeof(self.VRSceneResult[projIndex].editor_ver) != "string" ){
					console.log("VRFunc.js: _loadSceneObjects: the editor_ver is not string, error and return ");
					return -1;
				}else{
					editor_version = self.VRSceneResult[projIndex].editor_ver.split(".");
				}

				//// 版本控制，3.2.0 版本以上會有 相機設定參數在 scenes 層級，也在此函式內設定
				scene_objs = self.editorVerionControll(editor_version, projIndex , sceneIndex);
				if (!Array.isArray(scene_objs)) return -1;


				//// 改為 loading 一次 環景圖 在每次載入 3D Model 的時候在帶入。 
				let scene_skybox_url;
				if(self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url == "DefaultResource/Spherical_Image/SphericalImage.png"){
					self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url = "https://mifly0makar0assets.s3-ap-northeast-1.amazonaws.com/DefaultResource/2D/sceneDefaultImages/SphericalImage.png"
				}
				if (self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_main_type == 'spherical_video'){
					scene_skybox_url = "https://mifly0makar0assets.s3-ap-northeast-1.amazonaws.com/DefaultResource/spherical_image/defaultGray2.jpg";
				} else{
					scene_skybox_url = self.VRSceneResult[projIndex].scenes[sceneIndex].scene_skybox_url;
				}

				let targetCube = new THREE.WebGLRenderTargetCube(1024, 1024);
				let renderer = self.vrScene.renderer;
//20200730-thonsha-add-start
				renderer.outputEncoding = THREE.GammaEncoding;
				renderer.gammaFactor = 1;
//20200730-thonsha-add-end
				let envTexture = new THREE.TextureLoader().load(
					scene_skybox_url,
					function() 
					{
						let cubeTex = targetCube.fromEquirectangularTexture(renderer, envTexture);
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

									//// 假如編輯器版本大於 3.2.0 不參考 camera 物件
									if (self.VRSceneResult[projIndex].editor_ver ){
										if ( typeof(self.VRSceneResult[projIndex].editor_ver) == "string" ){
											var editor_version = self.VRSceneResult[projIndex].editor_ver.split(".");
											if (editor_version.length == 3){
												if (editor_version[0] == 3 && editor_version[1] == 2 ){
													console.log("VRFunc.js: _loadSceneObjects: camera: editor vesion is 3.2.n , dont set" );
													break;
												}
											}
										}
									}

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
										aCamera.object3D.position.set(0,0,0);
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

									self.loadGLTFModel(scene_objs[i], position, rotation, scale , cubeTex );

									break;
								
								// 20200521-thonsha-add-start
		
								case "light":
		
									self.loadLight(scene_objs[i], position, rotation, scale);
									break;
		
								default:
									console.log("VRFunc.js: _loadSceneObjects: default", i, scene_objs[i] );
									
							}
		
						}
					}
				);

				
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
						let imgType = obj.res_url.split(".")[url_spit_length-1].toLowerCase();

						let plane;
						if (imgType == "jpg" || imgType == "jpeg" || imgType == "png"){
							plane = document.createElement("a-plane");
							plane.setAttribute( "src", obj.res_url ); //// origin
						}
						else if (imgType == "gif"){
							plane = document.createElement("a-entity")
						}
						//20191101-end-thonsha-mod

						plane.setAttribute( "id", obj.obj_id );//// fei add 
						// plane.setAttribute("makarVRIndex", i ); //// fei add
						//20191111-start-thonsha-mod
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
								plane.setAttribute("material", "transparent: true; shader:gif;  src: url("+ obj.res_url+"); opacity: 1");

								if (transparentBehav.mode == 'RGB'){
									plane.setAttribute("geometry", "primitive: plane");
									plane.setAttribute("material", "shader:gif_RGB;  src: url("+ obj.res_url+"); opacity: 1; transparent: true; depthWrite:false; color: #"+color.getHexString()+"; _slope: "+parseFloat(slope)+"; _threshold: "+parseFloat(threshold)+";");
								}
								else if (transparentBehav.mode == 'HSV'){
									plane.setAttribute("geometry", "primitive: plane");
									plane.setAttribute("material", "shader:gif_HSV;  src: url("+ obj.res_url+"); opacity: 1; transparent: true; depthWrite:false; _keyingColorH:"+keyH+"; _keyingColorS:"+keyS+"; _keyingColorV:"+keyV+"; _deltaH:"+parseFloat(transparentBehav.hue)+"; _deltaS:"+parseFloat(transparentBehav.saturation)+"; _deltaV:"+parseFloat(transparentBehav.brightness)+";");
								}
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
								plane.setAttribute("material", "transparent: true; shader:gif;  src: url("+ obj.res_url+"); opacity: 1");
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

				// textEntity.setAttribute("geometry","primitive:plane; width:auto; height:auto");
				// textEntity.setAttribute("material","opacity: 0");
				
				textEntity.setAttribute("backcolor", obj.back_color ); //// 這邊注意一重點，自己設定的 attribute 不能使用 『大寫英文』，否則aframe data內會找不到，參照 text物件
				textEntity.setAttribute("textcolor", obj.color ); //// 暫時沒有用，假如未來文字支援『透明度』功能時候會需要

				textEntity.setAttribute("side","double");

				// textEntity.setAttribute("font","font/bbttf-msdf.json");
				var fontUrl = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/resource/fonts/";
				fonts = [  fontUrl + "1-msdf.json", fontUrl + "2-msdf.json" , fontUrl + "3-msdf.json", fontUrl + "4-msdf.json", fontUrl + "5-msdf.json", 
						   fontUrl + "6-msdf.json", fontUrl + "7-msdf.json" , fontUrl + "8-msdf.json", fontUrl + "9-msdf.json", fontUrl + "10-msdf.json", 
						   fontUrl + "11-msdf.json", fontUrl + "12-msdf.json" ];
				// fonts = [ fontUrl + "1-msdf.json" ];
				textEntity.setAttribute("font", fonts );

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
			
			this.loadGLTFModel = function(obj, position, rotation, scale, cubeTex){

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
														node.material = new THREE.MeshBasicMaterial({color: color, name: obj.material[i].name, skinning: node.material.skinning});
													}
												}
											});
											break;
										case "Standard":
											//20200512-thonsha-mod-start
											
											var renderer = modelEntity.sceneEl.renderer;
											objj.traverse(node => {
												if (node.material) {
													if (node.material.name == obj.material[i].name) {
//20200803-thonsha-add-start
														node.material = new THREE.MeshStandardMaterial({
															name: obj.material[i].name, 
															skinning: node.material.skinning , 
															map: node.material.map, 
															emissive:node.material.emissive,
															emissiveMap:node.material.emissiveMap,
															normalMap:node.material.normalMap
														});					
//20200803-thonsha-add-end
														node.material.color = color;
														node.material.metalness = obj.material[i].metallic;
														node.material.roughness = 1 - obj.material[i].smoothness;
														node.material.envMap = cubeTex.texture;
														node.material.envMapIntensity = 1;
														node.material.needsUpdate = true;
														node.material.reflectivity = 0;
														node.material.side = THREE.DoubleSide;
														node.material.transparent = true;
														// console.log('VRFunc.js: _loadGLTFModel: obj.material',obj.material);
														// console.log('VRFunc.js: _loadGLTFModel: standard node.material',node.material);
//20200730-thonsha-add-start														
														if (node.material.map){
															node.material.map.encoding = THREE.GammaEncoding;
															node.material.map.needsUpdate = true;
														}
//20200730-thonsha-add-end	
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

															node.customDepthMaterial = new THREE.MeshDepthMaterial( {
																depthPacking: THREE.RGBADepthPacking,
																skinning: true,
																map: node.material.map,
																alphaTest: obj.material[i].cut_off
															} );
														}
														else if(obj.material[i].mode == 2){
															node.material.opacity = parseFloat(rgba[3]);
															node.material.depthWrite = false;
														
															node.customDepthMaterial = new THREE.MeshDepthMaterial( {
																depthPacking: THREE.RGBADepthPacking,
																skinning: true,
																map: node.material.map,
																alphaTest: obj.material[i].cut_off
															} );
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

															node.customDepthMaterial = new THREE.MeshDepthMaterial( {
																depthPacking: THREE.RGBADepthPacking,
																skinning: true,
																map: node.material.map,
																alphaTest: obj.material[i].cut_off
															} );
														}
													}
												}
											});
											// renderer.toneMapping = THREE.ACESFilmicToneMapping;
											// renderer.outputEncoding = THREE.sRGBEncoding;
											
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
														node.material = new THREE.MeshBasicMaterial({color: new THREE.Color(1,1,1), name: obj.material[i].name, skinning: node.material.skinning, map: node.material.map});
//20200730-thonsha-add-start
														if (node.material.map){
															node.material.map.encoding = THREE.GammaEncoding;
															node.material.map.needsUpdate = true;
															console.log(node.material.map)

														}
//20200730-thonsha-add-end
														node.material.needsUpdate = true;
													}
												}
											});
											break;
										default:
											console.log(`The shader of no. ${i} material is not supported currently.`);
											break;
									}
								}

								//// if there is animation exist in GLTF, but the editor not contain the animation slices, the mixer will not init.
								//// use the first animation( usually only one), to setup animationSlice.
								if (Array.isArray(evt.detail.model.animations)){
									if ( evt.detail.model.animations.length>0 && !modelEntity.getAttribute("animation-mixer") ){
										console.log("VRFunc.js: loadGFLTFModel: the model with animation but no animation-mixer, probabily older version of editor ", evt.detail.model );
										modelEntity.setAttribute("animation-mixer", "clip: "+ evt.detail.model.animations[0].name );
										animationSlices = [];
										animationSlices.push({ changed:false, idle:"mifly168", uid:"mifly168" });
										animationSlices.push({
											animationName: evt.detail.model.animations[0].name,
											name: evt.detail.model.animations[0].name,
											endTime: evt.detail.model.animations[0].duration ,
											startTime: 0,
											uid:"mifly168"
										});
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
				mp4Video.setAttribute("id", obj.obj_id+"_"+obj.res_id+"_"+self.loadSceneCount );
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

					videoPlane.setAttribute("src", "#"+obj.obj_id+"_"+obj.res_id+"_"+self.loadSceneCount ); //  
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
								mp4Video.muted = false;
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
			////// 因為 VR 場景中目前不讓使用者以點擊或是滑鼠來操控物件，所以不需要額外判斷 look-control 開啟與否
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

			self.vrScene.canvas.addEventListener("touchend", endEvent, false);
			self.vrScene.canvas.addEventListener("mouseup", endEvent, false);

			//////
			////// raycaster for touch and mouse 
			//////
			let preMouse = new THREE.Vector2();
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
				if (!self.triggerEnable){
					return;
				}
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
				// console.log("VRFunc.js: _setupFunction: endEvent, intersects=", intersects , makarTHREEObjects , self.makarObjects );
				if (intersects.length != 0 ){
					console.log("VRFunc.js: _setupFunction: 1 endEvent, intersects=", intersects );
					let touchObject = self.getMakarObject( intersects[0].object );
					// console.log("VRFunc.js: _setupFunction: endEvent, touchObject.behav=", touchObject.behav );

//[start-20200915- fei 0101-add]//
					// console.log("VRFunc.js: _setupFunction: endEvent, touchObject.behav=", touchObject );
					touchObject.traverse(function(child){
						if (child.isMesh){
							// console.log("VRFunc.js: _setupFunction: endEvent, child = " , child );
						}

					});

//[end---20200915- fei 0101-add]//

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
					// for (let i = 0; i <VRSceneResult.length;i++){
					// 	for (let j = 0;j<VRSceneResult[i].scenes.length;j++){
					// 		if(VRSceneResult[i].scenes[j].scene_id == sceneID){
								
					// 			self.currentSceneIndex = j;

					// 			self.triggerEnable = false;
					// 			self.loadScene(i,j);
					// 			// window.activeVRScenes(i,j);
					// 		}
					// 	}
					// }	
					let idx = self.projectIdx;
					for (let i = 0;i<VRSceneResult[idx].scenes.length;i++){
						if(VRSceneResult[idx].scenes[i].scene_id == sceneID){
							// window.activeVRScenes(i,j);
							//// 先將觸控關閉，再跳轉場景
							self.triggerEnable = false;
							self.loadScene(idx,i);

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

		//20201201-thonsha-add-start

		VRController.prototype.setGuideList = function(projIndex){ 
			let self = this;

			let guide = document.getElementById("guide");
			let guideList = document.getElementById("guideList");

			let guideClass01 = document.getElementById("guideClass01");
			let bottomArrow01 = document.getElementById("bottomArrow01");
			let guideStore01 = document.getElementById("guideStore01");

			let guideClass02 = document.getElementById("guideClass02");
			let bottomArrow02 = document.getElementById("bottomArrow02");
			let guideStore02 = document.getElementById("guideStore02");

			let guideClass03 = document.getElementById("guideClass03");
			let bottomArrow03 = document.getElementById("bottomArrow03");
			let guideStore03 = document.getElementById("guideStore03");

			let guideClass04 = document.getElementById("guideClass04");
			let bottomArrow04 = document.getElementById("bottomArrow04");
			let guideStore04 = document.getElementById("guideStore04");

			let guideClass05 = document.getElementById("guideClass05");
			let bottomArrow05 = document.getElementById("bottomArrow05");
			let guideStore05 = document.getElementById("guideStore05");

			let guideClass06 = document.getElementById("guideClass06");
			let bottomArrow06 = document.getElementById("bottomArrow06");
			let guideStore06 = document.getElementById("guideStore06");

			let guideClass07 = document.getElementById("guideClass07");
			let bottomArrow07 = document.getElementById("bottomArrow07");
			let guideStore07 = document.getElementById("guideStore07");

			let guideClass08 = document.getElementById("guideClass08");
			let bottomArrow08 = document.getElementById("bottomArrow08");
			let guideStore08 = document.getElementById("guideStore08");

			guide.addEventListener('click', function(event){
				event.preventDefault();
				if (guideList.style.display == "block"){
					guideList.style.display ="none";
				}
				else{
					guideList.style.display ="block";
				}

			});

			guideClass01.addEventListener('click', function(event){
				event.preventDefault();
				if (guideStore01.style.display == "block"){
					guideStore01.style.display ="none";
					bottomArrow01.style.transform = "rotate(-45deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.85)"
				}
				else{
					guideStore01.style.display ="block";
					bottomArrow01.style.transform = "rotate(135deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.65)"

					guideStore02.style.display ="none";
					bottomArrow02.style.transform = "rotate(-45deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore03.style.display ="none";
					bottomArrow03.style.transform = "rotate(-45deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore04.style.display ="none";
					bottomArrow04.style.transform = "rotate(-45deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore05.style.display ="none";
					bottomArrow05.style.transform = "rotate(-45deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore06.style.display ="none";
					bottomArrow06.style.transform = "rotate(-45deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore07.style.display ="none";
					bottomArrow07.style.transform = "rotate(-45deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore08.style.display ="none";
					bottomArrow08.style.transform = "rotate(-45deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.85)"
				}
				
			});

			guideClass02.addEventListener('click', function(event){
				event.preventDefault();
				if (guideStore02.style.display == "block"){
					guideStore02.style.display ="none";
					bottomArrow02.style.transform = "rotate(-45deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.85)"
				}
				else{
					guideStore01.style.display ="none";
					bottomArrow01.style.transform = "rotate(-45deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore02.style.display ="block";
					bottomArrow02.style.transform = "rotate(135deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.65)"

					guideStore03.style.display ="none";
					bottomArrow03.style.transform = "rotate(-45deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore04.style.display ="none";
					bottomArrow04.style.transform = "rotate(-45deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore05.style.display ="none";
					bottomArrow05.style.transform = "rotate(-45deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore06.style.display ="none";
					bottomArrow06.style.transform = "rotate(-45deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore07.style.display ="none";
					bottomArrow07.style.transform = "rotate(-45deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore08.style.display ="none";
					bottomArrow08.style.transform = "rotate(-45deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.85)"
				}
				
			});

			guideClass03.addEventListener('click', function(event){
				event.preventDefault();
				if (guideStore03.style.display == "block"){
					guideStore03.style.display ="none";
					bottomArrow03.style.transform = "rotate(-45deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.85)"
				}
				else{
					guideStore01.style.display ="none";
					bottomArrow01.style.transform = "rotate(-45deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore02.style.display ="none";
					bottomArrow02.style.transform = "rotate(-45deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore03.style.display ="block";
					bottomArrow03.style.transform = "rotate(135deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.65)"

					guideStore04.style.display ="none";
					bottomArrow04.style.transform = "rotate(-45deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore05.style.display ="none";
					bottomArrow05.style.transform = "rotate(-45deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore06.style.display ="none";
					bottomArrow06.style.transform = "rotate(-45deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore07.style.display ="none";
					bottomArrow07.style.transform = "rotate(-45deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore08.style.display ="none";
					bottomArrow08.style.transform = "rotate(-45deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.85)"
				}
				
			});

			guideClass04.addEventListener('click', function(event){
				event.preventDefault();
				if (guideStore04.style.display == "block"){
					guideStore04.style.display ="none";
					bottomArrow04.style.transform = "rotate(-45deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.85)"
				}
				else{
					guideStore01.style.display ="none";
					bottomArrow01.style.transform = "rotate(-45deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore02.style.display ="none";
					bottomArrow02.style.transform = "rotate(-45deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore03.style.display ="none";
					bottomArrow03.style.transform = "rotate(-45deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore04.style.display ="block";
					bottomArrow04.style.transform = "rotate(135deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.65)"

					guideStore05.style.display ="none";
					bottomArrow05.style.transform = "rotate(-45deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore06.style.display ="none";
					bottomArrow06.style.transform = "rotate(-45deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore07.style.display ="none";
					bottomArrow07.style.transform = "rotate(-45deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore08.style.display ="none";
					bottomArrow08.style.transform = "rotate(-45deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.85)"
				}
				
			});

			guideClass05.addEventListener('click', function(event){
				event.preventDefault();
				if (guideStore05.style.display == "block"){
					guideStore05.style.display ="none";
					bottomArrow05.style.transform = "rotate(-45deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.85)"
				}
				else{
					guideStore01.style.display ="none";
					bottomArrow01.style.transform = "rotate(-45deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore02.style.display ="none";
					bottomArrow02.style.transform = "rotate(-45deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore03.style.display ="none";
					bottomArrow03.style.transform = "rotate(-45deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore04.style.display ="none";
					bottomArrow04.style.transform = "rotate(-45deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore05.style.display ="block";
					bottomArrow05.style.transform = "rotate(135deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.65)"
					
					guideStore06.style.display ="none";
					bottomArrow06.style.transform = "rotate(-45deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore07.style.display ="none";
					bottomArrow07.style.transform = "rotate(-45deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore08.style.display ="none";
					bottomArrow08.style.transform = "rotate(-45deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.85)"
				}
				
			});

			guideClass06.addEventListener('click', function(event){
				event.preventDefault();
				if (guideStore06.style.display == "block"){
					guideStore06.style.display ="none";
					bottomArrow06.style.transform = "rotate(-45deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.85)"
				}
				else{
					guideStore01.style.display ="none";
					bottomArrow01.style.transform = "rotate(-45deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore02.style.display ="none";
					bottomArrow02.style.transform = "rotate(-45deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore03.style.display ="none";
					bottomArrow03.style.transform = "rotate(-45deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore04.style.display ="none";
					bottomArrow04.style.transform = "rotate(-45deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore05.style.display ="none";
					bottomArrow05.style.transform = "rotate(-45deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore06.style.display ="block";
					bottomArrow06.style.transform = "rotate(135deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.65)"
					
					guideStore07.style.display ="none";
					bottomArrow07.style.transform = "rotate(-45deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore08.style.display ="none";
					bottomArrow08.style.transform = "rotate(-45deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.85)"
				}
				
			});

			guideClass07.addEventListener('click', function(event){
				event.preventDefault();
				if (guideStore07.style.display == "block"){
					guideStore07.style.display ="none";
					bottomArrow07.style.transform = "rotate(-45deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.85)"
				}
				else{
					guideStore01.style.display ="none";
					bottomArrow01.style.transform = "rotate(-45deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore02.style.display ="none";
					bottomArrow02.style.transform = "rotate(-45deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore03.style.display ="none";
					bottomArrow03.style.transform = "rotate(-45deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore04.style.display ="none";
					bottomArrow04.style.transform = "rotate(-45deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore05.style.display ="none";
					bottomArrow05.style.transform = "rotate(-45deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore06.style.display ="none";
					bottomArrow06.style.transform = "rotate(-45deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore07.style.display ="block";
					bottomArrow07.style.transform = "rotate(135deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.65)"
					
					guideStore08.style.display ="none";
					bottomArrow08.style.transform = "rotate(-45deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.85)"
				}
				
			});

			guideClass08.addEventListener('click', function(event){
				event.preventDefault();
				if (guideStore08.style.display == "block"){
					guideStore08.style.display ="none";
					bottomArrow08.style.transform = "rotate(-45deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.85)"
				}
				else{
					guideStore01.style.display ="none";
					bottomArrow01.style.transform = "rotate(-45deg)"
					guideClass01.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore02.style.display ="none";
					bottomArrow02.style.transform = "rotate(-45deg)"
					guideClass02.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore03.style.display ="none";
					bottomArrow03.style.transform = "rotate(-45deg)"
					guideClass03.style.background = "rgba(49, 51, 63, 0.85)"

					guideStore04.style.display ="none";
					bottomArrow04.style.transform = "rotate(-45deg)"
					guideClass04.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore05.style.display ="none";
					bottomArrow05.style.transform = "rotate(-45deg)"
					guideClass05.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore06.style.display ="none";
					bottomArrow06.style.transform = "rotate(-45deg)"
					guideClass06.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore07.style.display ="none";
					bottomArrow07.style.transform = "rotate(-45deg)"
					guideClass07.style.background = "rgba(49, 51, 63, 0.85)"
					
					guideStore08.style.display ="block";
					bottomArrow08.style.transform = "rotate(135deg)"
					guideClass08.style.background = "rgba(49, 51, 63, 0.65)"
				}
				
			});

			let storeTable01 = document.getElementById("storeTable01");
			let storeTable02 = document.getElementById("storeTable02");
			let storeTable03 = document.getElementById("storeTable03");
			let storeTable04 = document.getElementById("storeTable04");
			let storeTable05 = document.getElementById("storeTable05");
			let storeTable06 = document.getElementById("storeTable06");
			let storeTable07 = document.getElementById("storeTable07");
			let storeTable08 = document.getElementById("storeTable08");
			
			// =================== table 1 =========================
			let newRow = storeTable01.insertRow(0);
			let newData = newRow.insertCell(0);
			let newDiv = document.createElement("div");
			let newTable = document.createElement("table");
			let storeData = newTable.insertRow(0);
			let storeLogo = storeData.insertCell(0);
			let storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			let img = new Image();
			img.src = 'images/store01.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>呷七碗食品有限公司</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 1 );
				

			});

			newRow = storeTable01.insertRow(1);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);	
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store02.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>麵屋黑平</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);

			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 2 );
				

			});

			newRow = storeTable01.insertRow(2);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store03.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>小原田</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 3 );
				

			});

			// =================== table 2 =========================
			newRow = storeTable02.insertRow(0);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store04.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>永康街芋頭大王(芒果冰)</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 4 );
				

			});

			// =================== table 3 =========================

			newRow = storeTable03.insertRow(0);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store05.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>爵林堅果坊</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 5 );
				

			});

			newRow = storeTable03.insertRow(1);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store06.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>小珍珠烘培</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 6 );
				

			});

			newRow = storeTable03.insertRow(2);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store07.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>聖比德</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 7 );
				

			});

			// =================== table 4 =========================

			newRow = storeTable04.insertRow(0);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store08.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>小茶栽堂-<br>Le Salon永康店</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 8 );
				

			});

			newRow = storeTable04.insertRow(1);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store09.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>御尚璽</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 9 );
				

			});

			newRow = storeTable04.insertRow(2);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store10.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>興華名茶</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 10 );
				

			});

			// =================== table 5 =========================

			newRow = storeTable05.insertRow(0);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store11.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>框影咖啡</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 11 );
				

			});

			newRow = storeTable05.insertRow(1);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store12.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>Nous deux 努得咖啡</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 12 );
				

			});

			// =================== table 6 =========================

			newRow = storeTable06.insertRow(0);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store13.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>一茶工房</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 13 );
				

			});

			newRow = storeTable06.insertRow(1);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store14.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>三良品茶</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 14 );
				

			});

			// =================== table 7 =========================

			newRow = storeTable07.insertRow(0);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store15.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>幸福可可</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 15 );
				

			});

			// =================== table 8 =========================

			newRow = storeTable08.insertRow(0);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store16.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>Florame法恩</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 16 );
				

			});

			newRow = storeTable08.insertRow(1);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store17.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>晧雅日本生活百貨</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 17 );
				

			});

			newRow = storeTable08.insertRow(2);
			newData = newRow.insertCell(0);
			newDiv = document.createElement("div");
			newTable = document.createElement("table");
			storeData = newTable.insertRow(0);
			storeLogo = storeData.insertCell(0);
			storeName = storeData.insertCell(1);
			newTable.classList.toggle( 'storeDiv' );
			img = new Image();
			img.src = 'images/store18.png';
			img.style = "width:100px;"
			storeLogo.appendChild(img);
			storeName.innerHTML = "<h5>飛比樂有限公司</h5>"
			newDiv.appendChild(newTable);
			newData.appendChild(newDiv);
			newDiv.addEventListener('click', function(event){
				event.preventDefault();
				guideList.style.display ="none";
				//// 先將觸控關閉，再跳轉場景
				self.triggerEnable = false;
				self.loadScene(projIndex, 18 );
				

			});


		}
		//20201201-thonsha-add-end

		VRController.prototype.setSceneTable = function(projIndex){ 
			let self = this;
			////// get the variables
			let scenesTable = document.getElementById("scenesTable");
			let snapShotRow = scenesTable.rows.scene_snapshot;
			let sceneNameRow = scenesTable.rows.scene_name;
			let snapShotNumber = snapShotRow.children.length;
			let sceneNameNumber = sceneNameRow.children.length;
			////// clear the table
			for (let i=0; i<snapShotNumber; i++) snapShotRow.deleteCell(0);
			for (let i=0; i<sceneNameNumber; i++) sceneNameRow.deleteCell(0);
			
			// VRSceneResult[projIndex]
			for (let i = 0; i<VRSceneResult[projIndex].scenes.length; i++){
				let scene = VRSceneResult[projIndex].scenes[i];
				let sceneNameCell = sceneNameRow.insertCell( i );
				let snapShotCell = snapShotRow.insertCell( i );
				sceneNameCell.style.paddingLeft = "8px";
				snapShotCell.style.paddingLeft = "8px";

				//// 設置場景名稱
				let _div = document.createElement('div');
				_div.innerText = scene.scene_name;
				_div.className = "sceneNameOneRow";
				if (i == 0){
					_div.style.backgroundColor = "rgba(73, 117, 221, 1.0)";
				}
				sceneNameCell.appendChild(_div);
				
				////設置場景縮圖
				let _img = document.createElement('img');
				if(scene.scene_snapshot_url == "DefaultResource/Spherical_Image_Snapshot/SphericalImage.png"){
					_img.src = "https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/Spherical_Image/SphericalImage.png";
				}else{
					_img.src = scene.scene_snapshot_url;
				}
				_img.width = 128;
				_img.height = 64;
				_img.onclick = function(){
					if (self.triggerEnable){
						console.log("VRFuc.js: _setSceneTable: scene click, index = ", i , sceneNameRow.cells[i].children[0] ) ;
						sceneNameRow.cells[i].children[0].style.backgroundColor = "rgba(73, 117, 221, 1.0)";
						//// 先將觸控關閉，再跳轉場景
						self.triggerEnable = false;
						self.loadScene(projIndex, i );

						for (let j = 0; j < sceneNameRow.cells.length; j++ ){
							if (i == j) continue;
							sceneNameRow.cells[j].children[0].style.backgroundColor = "rgba(98, 103, 116, 1.0)";
						}
					}else{
						console.log("please wait 3 seconds for load scene");
					}
				};

				snapShotCell.appendChild(_img);

			}
		}

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

		function forbidden( message ){
			if (document.getElementById("freeUserWarnDiv")){
				document.getElementById("freeUserWarnDiv").style.display = "block";
				document.getElementById("pUserInfo").innerHTML =  message  ;
				document.getElementById("pUserInfo").style.color = "rgba(0,201,156,1)";
				leaveIframe.onclick = function(){
					event.preventDefault();
					window.open("https://www.makerar.com/", "_self");
				}
			}
		}

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

	
			// console.log("VRFunc.js: showVRProjList: ", url, makarID);
			getVRSceneByUserID(url, makarID, function(data){

				if (window.allowedMakarIDUseWeb == false  ){
					forbidden( "this ID <br> [" + makarID + "] <br> is free user, not allow to use webVR, visit MAKAR for more information" );
					return ;
				}
				console.log("VRFunc.js: showVRProjList: getVRSceneByUserID: callback, publishVRProjs=", publishVRProjs);
				let chooseVRProject = 0;
				if ( typeof(projName) == "string" ){
					for (let i in publishVRProjs.result ){
						if (publishVRProjs.result[i].proj_name.toLowerCase() == decodeURIComponent(projName).toLowerCase()  ){
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

			vrController.projectIdx = projIndex;
			
			function initvrscene(){
				
				// console.log("VRFunc.js: activeVRScenes: initvrscene vrScene=", vrScene  );
				if ( vrScene.children[2].attributes ){

				}
				// vrScene.children[2].remove(); ////// 20190921: Fei want to remove the default camera, 

				////// add the listener for show the panel or not
				// 20201202-thonsha-remove-start
				// vrScene.canvas.addEventListener("touchstart", startEvent, false);
				// vrScene.canvas.addEventListener("mousedown", startEvent, false);
				// function startEvent(event){
				// 	bottomScenes.className = bottomArrow.className = scenesInfo.className = "collapsed";
				// }
				// 20201202-thonsha-remove-end
				

				////// set member into vrController
				let rendererSize = new THREE.Vector2();
				vrScene.renderer.getSize( rendererSize );
				

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
				aCamera.setAttribute('wasd-controls', "" ); 
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

				vrController.triggerEnable = false;
				vrController.loadScene(projIndex, sceneIndex);			
				vrController.userStartTime = new Date().getTime();
				
				setTimeout(function(){
					leavedSendLog();
				}, 3000 );

				checkHost_tick();
				Module.checkMifly();
				renderTick();
	
				//// 製作下方，場景資訊
				// 20201202-thonsha-mod-start
				// vrController.setSceneTable(projIndex);
				vrController.setGuideList(projIndex);
				// 20201202-thonsha-mod-end


				/////// --------------------- 開發 OutlinePass start -----------------------------
				//// 在相機載入完成之後，vrScene.camera 會被設定為 aCamera 的底下物件，再依照此來設定
				////
				if ( ( Browser.desktop ) && THREE.EffectComposer && THREE.RenderPass && THREE.OutlinePass && THREE.ShaderPass && THREE.FXAAShader && THREE.CopyShader ){
					aCamera.addEventListener("loaded", function(e){

						let renderer = vrScene.renderer;
						var composer = new THREE.EffectComposer( renderer );
						vrController.composer = composer;
						var renderPass = new THREE.RenderPass( vrScene.object3D , vrScene.camera);
						
						composer.addPass( renderPass );
	
						let outlinePass = new THREE.OutlinePass( new THREE.Vector2( vrScene.clientWidth, vrScene.clientHeight), vrScene.object3D, vrScene.camera );
						outlinePass.visibleEdgeColor = new THREE.Color( 1.0, 1.0, 1.0 ); // 沒被遮擋到的邊緣顏色
						outlinePass.hiddenEdgeColor = new THREE.Color( 0.45, 0.0, 0.0 );  // 被遮擋到的邊緣顏色
						outlinePass.usePatternTexture = false; // 是否啟動紋路
						
						composer.addPass( outlinePass );
	
						// var onLoad = function ( texture ) {
						// 	outlinePass.patternTexture = texture;
						// 	texture.wrapS = THREE.RepeatWrapping;
						// 	texture.wrapT = THREE.RepeatWrapping;
						// };
						// var loader = new THREE.TextureLoader();
						// loader.load( 'https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/makar_default_objects/2D/tri_pattern.jpg', onLoad );
	
						let effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
						effectFXAA.uniforms[ 'resolution' ].value.set( 1 / vrScene.clientWidth, 1 / vrScene.clientHeight );
						composer.addPass( effectFXAA );
	
						var selectedObjects = [];
						var mouse = new THREE.Vector2();
						var raycaster = new THREE.Raycaster();
	
						let isMouseDown = null;
						let isTouchMove = null; 
						vrScene.canvas.addEventListener( 'mousedown', onMouseDown );
						vrScene.canvas.addEventListener( 'mousemove', onMouseMove );
						vrScene.canvas.addEventListener( 'mouseup', onMouseUp );

						vrScene.canvas.addEventListener( 'touchstart', onTouchStart );
						vrScene.canvas.addEventListener( 'touchmove', onTouchMove );
						vrScene.canvas.addEventListener( 'touchend', onTouchEnd );
						//// 點擊到 sky 或是 沒有點擊到物件（不應該發生）的時候取消『選取物件』

						function getChangedTouches(event){
							var x, y;
							if ( event.changedTouches ) {
								x = event.changedTouches[ 0 ].pageX;
								y = event.changedTouches[ 0 ].pageY;
							} else {
								x = event.clientX;
								y = event.clientY;
							}
							mouse.x = ( x / vrScene.clientWidth ) * 2 - 1;
							mouse.y = - ( y / vrScene.clientHeight ) * 2 + 1;
						}

						function onTouchStart(event){
							// console.log(" onTouchStart " );
							isTouchMove = false;
						}

						function onTouchMove( event ) {
							// console.log(" onTouchMove " );
							isTouchMove = true;
						}

						function onTouchEnd( event ) {
							// console.log(" onTouchEnd " );
							if (!isTouchMove){
								getChangedTouches(event);
								checkIntersectionAndCancel();
							}					
						}

						function onMouseDown(event){
							isMouseDown = true;
						}

						function onMouseMove( event ) {
							if (!isMouseDown){
								getChangedTouches(event);
								checkIntersection();
							}
						}

						function onMouseUp(event){
							isMouseDown = false;
							getChangedTouches(event);
							checkIntersectionAndCancel();
						}
						
						function addSelectedObject( object ) {
							selectedObjects = [];
							selectedObjects.push( object );
						}
	
						function checkIntersection() {
							raycaster.setFromCamera( mouse, vrScene.camera );
							var intersects = raycaster.intersectObject( vrScene.object3D, true );
							if ( intersects.length > 0 ) {
								var selectedObject = intersects[ 0 ].object;
								if (selectedObject.el){
									if (selectedObject.el.id != "sky" ){
										// console.log(" ----- checkIntersection: selectedObject= " , selectedObject );
										addSelectedObject( selectedObject );	
										outlinePass.selectedObjects = selectedObjects;
									}
								}
							} else {
								// outlinePass.selectedObjects = [];
								console.log(" --- " );
	
							}
						}

						function checkIntersectionAndCancel() {
							raycaster.setFromCamera( mouse, vrScene.camera );
							var intersects = raycaster.intersectObject( vrScene.object3D, true );
							if ( intersects.length > 0 ) {
								var selectedObject = intersects[ 0 ].object;
								if (selectedObject.el){
									if (selectedObject.el.id == "sky" ){
										outlinePass.selectedObjects = [];
										// console.log(" ----- checkIntersection: sky selectedObject= " , selectedObject );
									}else{
										// console.log(" ----- checkIntersection: selectedObject= " , selectedObject );
										addSelectedObject( selectedObject );
										outlinePass.selectedObjects = selectedObjects;
									}
								}
							} else {
								outlinePass.selectedObjects = [];
								// console.log(" --- " );
							}
						}
					});
				}
				/////// --------------------- 開發 OutlinePass end  -----------------------------

				// console.log("VRFunc.js: initvrscene, done", vrScene, vrScene.object3D );
			}
	
//20200528-thonsha-mod-start		
			var renderTick = function() {

				// vrController.GLRenderer.clearStencil();
				// vrController.GLRenderer.clearColor();
				vrController.GLRenderer.clearDepth();

				vrController.GLRenderer.render( vrController.vrScene.object3D, vrController.vrScene.camera );

				if (vrController.composer){
					vrController.composer.render();
				}
				// console.log("renderTick");
				requestAnimationFrame(renderTick); 
			};
			
//20200528-thonsha-mod-start	

		}

		
	}


	function makeid(length) {
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for ( var i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}

	var leavedSendLog = window.leavedSendLog = function(e) {
		if (!window.publishVRProjs) return;
		if (!publishVRProjs.result) return;
		if (!publishVRProjs.result[0].user_id) return;

		let device_id;
		if (localStorage.getItem("device_id")){
			if (localStorage.getItem("device_id") >= 24 ){
				device_id = localStorage.getItem("device_id");
			}else{
				device_id = new Date().getTime() + "_" + makeid(10) ;
				localStorage.setItem( "device_id",  device_id );
			}
		}else{
			device_id = new Date().getTime() + "_" + makeid(10) ;
			localStorage.setItem( "device_id",  device_id );
		}

		let leavedTime = new Date().getTime();

		let projData = {
			"brand": Browser.name + Browser.version ,
			"os": Browser.platform ,
			"device_id": device_id ,
			"client": "viewer" , //// 等amos修改玩之後再改為 web 
			"user_id": publishVRProjs.result[0].user_id ,
			"proj_id": "" ,
			"proj_type":"vr" ,
			"duration_time": 0 ,
			"explore_time": 0 ,
			"play_time": 0 ,
			"location_long":0.0 ,
			"location_lan":0.0 ,
		};
		projData.proj_id = publishVRProjs.result[ vrController.projectIdx ].proj_id;
		projData.duration_time = (leavedTime - vrController.userStartTime)/1000; // 單位是秒
		projData.play_time = (leavedTime - vrController.userStartTime)/1000; // 單位是秒
		projData.duration_time = 10 + Math.random(); // 單位是秒
		projData.play_time = 10 + Math.random(); // 單位是秒
		
		console.log("VRFunc.js: project[" + vrController.projectIdx + "] playing time = " , projData.duration_time , projData.play_time , projData.explore_time );

		let xhr = new XMLHttpRequest();
		let request = {
			ver: "3.1.3",
			cid: 5,
			data: projData
		};
		let jsonReq = JSON.stringify(request);
		xhr.open('POST', window.serverUrl+"add_project_log" , true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.responseType = 'json';
		xhr.addEventListener("load", function() {
			console.log("VRFunc.js: save done, ", xhr.response );
		});
		xhr.send(jsonReq);

		return undefined;
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
