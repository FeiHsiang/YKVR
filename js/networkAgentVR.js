(function() {
	'use strict'

	window.parseUserData = function( url, callback ) {
		let xhr = new XMLHttpRequest(); // why use const ??
		xhr.open( 'GET', url , true ) //  
		xhr.responseType = 'json' // set reponse as arraybuffer or text or json
		xhr.onload = function(e) {
			
			if (xhr.response.data){
				window.file = xhr.response.data ;
			}else{
				window.file = xhr.response ;
			}
			//// parse the transform from string to float array
			for (var i in window.file.scene_objs_v2){
				for (var j in window.file.scene_objs_v2[i].transform){
					var strings = window.file.scene_objs_v2[i].transform[j].split(",");
					if (strings.length != 3) { return -1; } 
					var floats = [ parseFloat(strings[0]), parseFloat(strings[1]), parseFloat(strings[2]) ];
					window.file.scene_objs_v2[i].transform[j]= floats;
				}	
			}

			return window.file;
		}
		xhr.send();
		return xhr.response ;
	}

//[start-20190215-fei0054-add]//
	function parseDiaoyurar( diaoyurarData ){
		let b64Data = diaoyurarData;
		// Decode base64 (convert ascii to binary)
		let strData     = atob(b64Data);
		// Convert binary string to character-number array
		let charData    = strData.split('').map(function(x){return x.charCodeAt(0);});
		// Turn number array into byte-array
		let binData     = new Uint8Array(charData);
		// Pako magic
		let data        = pako.inflate(binData);
		// Convert gunzipped byteArray back to ascii string:
		let resData     = String.fromCharCode.apply(null, new Uint16Array(data));
		// Convert string to JSON object  
		let resJsonData = JSON.parse(resData);

		return resJsonData;
	}
//[end---20190215-fei0054-add]//

	////// query server for basic data by user_id
	////// 20190921: Fei abandon this function on server V3 
	window.getARProjsByUserID = function( url, user_id, callback ) {
		if (!url ) return -1;
		if (!user_id) user_id = "makarvr";
		let xhr = new XMLHttpRequest();
		let data = {
			"user_id": user_id,
			"cid": "20"
		}
//[start-20190904-fei0073-add]//
		//////
		///////// for V3 server and Editor
		//////
		if ( serverVersion == "3.0.0"){
			console.log("%cnetWorkAgent.js: getARProjsByUserID: you shoudnt see this, Fei abandon this function in server V3", "color:red");
			getResByUserID(url, user_id, "", "", function(){
				console.log("netWorkAgent.js: getARProjsByUserID: getResByUserID: callback");

				let specificUrl = url+"get_ar_projs";
				let request = {
					"ver":"3.0.0",
					"cid": 5,
					"data":data
				};
				let jsonReq = JSON.stringify(request);
				// console.log("netWorkAgent.js: getARProjsByUserID: POST open, specificUrl=", specificUrl);
				xhr.open( 'POST', specificUrl , true );

				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
				xhr.onload = function(e) {
					console.log("networkAgent.js: getARProjsByUserID,  onload xhr.response = ", xhr.response );
					let userData;
					if (!xhr.response.error){
						if (xhr.response.data){
							userData = xhr.response.data;
							//// save the userData in window  
							if (!window.userARData){
								window.userARData = userData; 
							}else{
								// console.log("networkAgent.js: getARProjsByUserID: window.userARData already exist, replace it..");
								window.userARData = userData; 
							}

							if (callback) callback(userData); 
						}else{
							if (callback) callback("networkAgent.js:error: no xhr.response.data"); 
						}
					}else{
						if (callback) callback( xhr.response.error ); 
						console.log("networkAgent.js: getARProjsByUserID: oops something wrong:",xhr.response.error);
					}
				}
				// console.log("netWorkAgent.js: getARProjsByUserID: POST send, jsonReq=", jsonReq);
				xhr.send( jsonReq );

			}); // get the ARResList and create ARResDict 

			
		}
		

//[end---20190904-fei0073-add]//
		//////
		////// server V2 part 
		//////
		if ( serverVersion == "2.0.0"){
			let strData = JSON.stringify(data);
			//// the formData
			let FD  = new FormData();
			FD.append("cmd", "get_ar_projs");	//get_ar_projs ,  get_ar_proj_scene	, get_ar_projs_by_proj_id
			FD.append("data", strData );

			xhr.open( 'POST', url , true );
			// xhr.setRequestHeader('Content-Type', 'text/plain' );		
			xhr.responseType = 'json' // set reponse as arraybuffer or text or json

			xhr.onload = function(e) {
				console.log("networkAgent.js:getARProjsByUserID:", xhr.response );
				let userData;

//[start-20190214-fei0054-mod]//
				//// MAKAR "will" all use gzip compress the text as soon as We can(?)
				if (xhr.response.diaoyurar ){
					// console.log("networkAgent.js: getARProjsByUserID: xhr.response.diaoyurar ");

					let jsonData =  parseDiaoyurar(xhr.response.diaoyurar);
					if (!jsonData.error){
						if (jsonData.data){
							userData = jsonData.data;
							//// save the userData in window  
							if (!window.userARData){
								window.userARData = userData; 
							}else{
								console.log("networkAgent.js: getARProjsByUserID: window.userARData already exist, replace it..");
								window.userARData = userData; 
							}
							if (callback) callback(userData); 
						}else{
							if (callback) callback("networkAgent.js:error: no jsonData.data"); 
						}

					}else{
						if (callback) callback( jsonData.error ); 
						console.log("networkAgent.js: getARProjsByUserID: oops something wrong:", jsonData.error);
					}

					// console.log(jsonData);
				}else{
					// console.log("networkAgent.js: getARProjsByUserID: not xhr.response.diaoyurar ", xhr.response);

					if (!xhr.response.error){
						if (xhr.response.data){
							
							userData = xhr.response.data;

							// console.log("networkAgent.js:getARProjsByUserID: onload" );
							//// save the userData in window  
							if (!window.userARData){
								window.userARData = userData; 
							}else{
								// console.log("networkAgent.js: getARProjsByUserID: window.userARData already exist, replace it..");
								window.userARData = userData; 
							}
		
							if (callback) callback(userData); 
						}else{
							if (callback) callback("networkAgent.js:error: no xhr.response.data"); 
						}
					}else{
						if (callback) callback( xhr.response.error ); 
						console.log("networkAgent.js: getARProjsByUserID: oops something wrong:",xhr.response.error);
					}
				}
//[end---20190214-fei0054-mod]//
			}
			xhr.send( FD );
		}
		

	}

//[start-20190905-fei0073-add]//

	// window.getMessageByUserID = function( url, user_id, callback ) {
	// 	if (!url ) return -1;
	// 	if (!user_id) user_id = "makarvr";
	// 	let xhr = new XMLHttpRequest();
	// 	let data = {
	// 		"user_id": user_id,
	// 	}
	// 	//////
	// 	///////// for V3 server and Editor
	// 	//////
	// 	if ( serverVersion == "3.0.0"){
	// 		let specificUrl = url+"get_message";
	// 		let request = {
	// 			"ver":"3.0.0",
	// 			"cid": 5,
	// 			"data":data
	// 		};
	// 		let jsonReq = JSON.stringify(request);
	// 		// console.log("netWorkAgent.js: getMessageByUserID: POST open, specificUrl=", specificUrl);
	// 		xhr.open( 'POST', specificUrl , true );

	// 		xhr.setRequestHeader('Content-Type', 'application/json');
	// 		xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
	// 		xhr.onload = function(e) {
	// 			console.log("networkAgent.js: getMessageByUserID,  onload xhr.response = ", xhr.response );			 
	// 		}
	// 		console.log("networkAgent.js: getMessageByUserID, jsonReq=", jsonReq );
	// 		xhr.send( jsonReq );
	// 	}
	// }

	window.getUserPublishProjsByUserID = function( url, user_id, main_type, sub_type, callback ) {
		if (!url ) return -1;
		if (!user_id) user_id = "makarvr";
		if (!main_type) main_type = "";
		if (!sub_type) sub_type = "";

		// console.log("networkAgent.js: _getUserPublishProjs: ");
		let xhr = new XMLHttpRequest();
		let data = {
			"user_id": user_id,
		}
		//////
		///////// for V3 server and Editor
		//////
		if ( serverVersion == "3.0.0"){
			// getResByUserID(url, user_id, main_type, sub_type, function(){
			getResByUserID(url, user_id, main_type, sub_type, function( userProjResDict ){

				getUsrOnlineRes(url, user_id, main_type, sub_type , "" , function( userOnlineResDict ){
					// console.log("netWorkAgent.js: _getUserPublishProjs: getResByUserID: callback");

					let specificUrl = url+"get_usr_publish_projs";
					let request = {
						"ver":"3.0.0",
						"cid": 5,
						"data":data
					};
					let jsonReq = JSON.stringify(request);
					// console.log("netWorkAgent.js: _getUserPublishProjs: POST open, specificUrl=", specificUrl);
					xhr.open( 'POST', specificUrl , true );
		
					xhr.setRequestHeader('Content-Type', 'application/json');
					xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
					xhr.onload = function(e) {
						// console.log("networkAgent.js: _getUserPublishProjs,  onload xhr.response = ", xhr.response );
						let userPublishProjs;
						if (!xhr.response.error){
		
							if (xhr.response.data){
								userPublishProjs = xhr.response.data;
								//// save the userData in window  
								if (!window.userPublishProjs){
									window.userPublishProjs = userPublishProjs; 
								}else{
									// console.log("networkAgent.js: _getUserPublishProjs: window.userPublishProjs already exist, replace it..");
									window.userPublishProjs = userPublishProjs; 
								}
		
								if (callback){
									// console.log("networkAgent.js: _getUserPublishProjs,  onload, do callback");
									// callback(userPublishProjs);
									callback(userPublishProjs , userProjResDict , userOnlineResDict );
								}  
							}else{
								if (callback) callback("networkAgent.js:error: no xhr.response.data"); 
							}
		
						}else{
							if (callback) callback( xhr.response.error ); 
							console.log('%cnetworkAgent.js: _getUserPublishProjs: oops something wrong: ', 'color:red', xhr.response.error);
						}
		
					}
					// console.log("networkAgent.js: _getUserPublishProjs, jsonReq=", jsonReq );
					xhr.send( jsonReq );

				});

				

			}); // get the ARResList and create ARResDict 

		
		}
	}

	window.getNewestPublishProjs = function( url, proj_type, callback ) {
		if (!url ) return -1;
		if (!proj_type) proj_type = "ar";
		let xhr = new XMLHttpRequest();
		let data = {
			"proj_type": proj_type,
		}
		//////
		///////// for V3 server and Editor
		//////
		if ( serverVersion == "3.0.0"){
			let specificUrl = url+"get_newest_publish_projs";
			let request = {
				"ver":"3.0.0",
				"cid": 5,
				"data":data
			};
			let jsonReq = JSON.stringify(request);
			// console.log("netWorkAgent.js: getNewestPublishProjs: POST open, specificUrl=", specificUrl);
			xhr.open( 'POST', specificUrl , true );

			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
			xhr.onload = function(e) {
				console.log("networkAgent.js: getNewestPublishProjs,  onload xhr.response = ", xhr.response );
			}
			console.log("networkAgent.js: getNewestPublishProjs, jsonReq=", jsonReq );
			xhr.send( jsonReq );
		}
	}
//[end---20190905-fei0073-add]//


//[start-20190904-fei0073-add]//
	//////
	////// server V3 get_res / get_usr_online_res
	//////
	window.getResByUserID = function(url, user_id, main_type, sub_type, callback ){
		if (!user_id) user_id = "fefe";
		if (!main_type) main_type = "";
		if (!sub_type) sub_type = "";
		// console.log("networkAgent.js: _getResByUserID: ");

		let specificUrl = url+"get_res";
		let xhr = new XMLHttpRequest(); // dont use var!!! will override the previous one
		let data = {
			"user_id": user_id , //miflytest
			"main_type": main_type , // ar, vr 
			"sub_type": sub_type 
		}
		let request = {
			"ver":"3.0.0",
			"cid": 5,
			"data":data
		};
		let jsonReq = JSON.stringify(request);
		xhr.open( 'POST', specificUrl , true );
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
		xhr.onload = function(e) {
			// console.log("networkAgent: _getResByUserID,  onload xhr.response = ", xhr.response );
			// console.log('%cnetworkAgent: _getResByUserID,  onload error ', 'color: blue');  //// color: #bada55

			if ( xhr.response.error ){
				console.log('%cnetworkAgent: _getResByUserID,  onload error ', 'color:red', xhr.response );  //// color: #bada55
			}else{
				console.log('%cnetworkAgent: _getResByUserID,  onload save ', 'color:blue', xhr.response.data.list );  //// color: #bada55
				
				// createProjResDictFromResList(xhr.response.data.list);

				if ( xhr.response.data.list.length > 0 ){
					createProjResDictFromResList(xhr.response.data.list, function( userProjResDict ){
						if (callback){
							callback( userProjResDict );
						}
					});
				}else{
					if (callback){
						console.log('networkAgent: _getResByUserID,  onload  use res is empty ' );  //// color: #bada55
						callback( "use res is empty" );
					}
				}

			}

			// if (callback){
			// 	callback();
			// }

		}
		xhr.send( jsonReq );
	}

	//////
	////// search the res_id from res
	//////
	var createProjResDictFromResList = function( userResList , callback ){
		if (!userResList) return -1;
		let userProjResDict = {};
		for (let i = 0; i < userResList.length; i++ ){
			userProjResDict[ userResList[i].res_id ] = userResList[i];

			if ( i == userResList.length-1 ){
				console.log("netWorkAgent.js: createProjResDictFromResList: i == userARResList.length, callback", i, userResList.length ); // Object.keys(userARResDict).length
				if (callback){
					callback( userProjResDict );
				}
			}
		}
		// window.userProjResDict = userProjResDict;
		// console.log("%cnetWorkAgent.js: createProjResDictFromResList:, userProjResDict=", "color:blue",userProjResDict); // Object.keys(userARResDict).length
	}

//[end---20190904-fei0073-add]//

//[start-20200511-fei0093-add]//
	window.getUsrOnlineRes = function( url, user_id, main_type, sub_type , category , callback ){
			
		if (!user_id) user_id = "fefe";
		if (!main_type) main_type = "";
		if (!sub_type) sub_type = "";
		if (!category) category = ""

		//get_usr_online_res
		let specificUrl = url+"get_usr_online_res";
		let xhr = new XMLHttpRequest(); // dont use var!!! will override the previous one
		let data = {
			"user_id": user_id , //miflytest
			"main_type": main_type , // ar, vr 
			"sub_type": sub_type ,
			"category": category ,
		}
		let request = {
			"ver":"3.0.0",
			"cid": 5,
			"data":data
		};
		let jsonReq = JSON.stringify(request);
		xhr.open( 'POST', specificUrl , true );
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
		xhr.onload = function(e) {
			console.log("networkAgentVR.js: _getUsrOnlineRes: res = ", xhr.response );

			if ( xhr.response.error ){
				console.log('networkAgent.js: _getUsrOnlineRes,  onload error ', xhr.response );  //// color: #bada55
			}else{
				console.log('networkAgent.js: _getUsrOnlineRes,  onload save ' , xhr.response );  //// color: #bada55
				
				if ( xhr.response.data.online_res_list.length > 0 ){
					createOnlineResDictFromResList( xhr.response.data.online_res_list , function( userOnlineResDict ){
						if (callback){
							callback( userOnlineResDict );
						}
					});
				}else{
					if (callback){
						console.log('networkAgent: _getUsrOnlineRes,  onload  use res is empty ' );  //// color: #bada55
						callback( {} ); // "use res is empty"
					}
				}
			}

		}
		xhr.send( jsonReq );
	}


	var createOnlineResDictFromResList = function( userOnlineResList , callback ){
		if (!userOnlineResList) return -1;
		let userOnlineResDict = {};
		for (let i = 0; i < userOnlineResList.length; i++ ){
			userOnlineResDict[ userOnlineResList[i].res_id ] = userOnlineResList[i];

			if ( i == userOnlineResList.length-1 ){
				console.log("netWorkAgent.js: createProjResDictFromResList: i == userARResList.length, callback", i, userOnlineResList.length ); // Object.keys(userARResDict).length
				if (callback){
					callback( userOnlineResDict );
				}
			}
		}
		// window.userOnlineResDict = userOnlineResDict;
	}

//[end---20200511-fei0093-add]//

//[start-20191113-thonsha-add]//
	function readTextFile(fileUrl, callback)
	{
		var rawFile = new XMLHttpRequest();
		var txtcontent;
		rawFile.open("GET", fileUrl, true);
		rawFile.onreadystatechange = function ()
		{
			if(rawFile.readyState === 4)
			{
				if(rawFile.status === 200 || rawFile.status == 0)
				{
					let allText = rawFile.responseText;
					
					txtcontent = allText;
					if (callback) callback( txtcontent );
				}
			}
		}
		rawFile.send(null);
		// return txtcontent;
	}
//[end---20191113-thonsha-add]//




////// GET the VR project from MAKAR
//[start-20190806-fei0071-add]//

	window.getVRSceneByUserID = function( url, user_id, callback ) {
		if (!url ) return -1;
		if (!user_id) user_id = "makarvr";
		
		let VRSceneResult = [];
		VRSceneResult.user_id = user_id;

		if (serverVersion == "3.0.0"){
			// console.log("networkAgent.js: getVRSceneByUserID 22: ");
			var main_type = "";
			var sub_type = "";

			var getUserPublishProjsCallback = function(userPublishProjs, userProjResDict, userOnlineResDict ){
			// getUserPublishProjsByUserID(url, user_id, main_type, sub_type, function(userPublishProjs , userProjResDict ){
				console.log("networkAgent.js: getVRSceneByUserID: getUserPublishProjsByUserID: userPublishProjs=", userPublishProjs);
				if ( typeof(userPublishProjs) != "string" ){
					
					let projIDList = [];
					for (let i in userPublishProjs.proj_list){
						if (userPublishProjs.proj_list[i].proj_type == "vr"){
							projIDList.push( userPublishProjs.proj_list[i].proj_id  );
						}
					}
					let xhr = new XMLHttpRequest(); // dont use var!!! will override the previous one
					let data = {
						"proj_id_list": projIDList
					}
					let specificUrl = url+"get_vr_projs_by_proj_id";
					let request = {
						"ver":"3.0.0",
						"cid": 5,
						"data":data
					};
					let jsonReq = JSON.stringify(request);
					xhr.open( 'POST', specificUrl , true );
					xhr.setRequestHeader('Content-Type', 'application/json');
					xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
					xhr.onload = function(e) {
						// console.log("networkAgent.js: get_vr_projs_by_proj_id: onload, response=", xhr.response );
						let publishVRProjs = xhr.response.data;
						window.publishVRProjs = publishVRProjs;
						
						let count = 0;
						if ( publishVRProjs.result ){
							if ( publishVRProjs.result.length ){
								for (let j = 0; j < publishVRProjs.result.length; j++ ){
									
									let xhr = new XMLHttpRequest(); // dont use var!!! will override the previous one
									let data = {
										"user_id": publishVRProjs.result[j].user_id,
										"proj_id": publishVRProjs.result[j].proj_id
									}
									let specificUrl = url+"get_vr_proj_scene"; // get_vr_proj_scene 
									let request = {
										"ver":"3.0.0",
										"cid": 5,
										"data":data
									};
									let getVRProjSceneJsonReq = JSON.stringify(request);
									// console.log("netWorkAgent.js: _getUserPublishProjs: POST open, specificUrl=", specificUrl);
									xhr.open( 'POST', specificUrl , true );
									xhr.setRequestHeader('Content-Type', 'application/json');
									xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"

									xhr.onload = function(e) {
										count++;
										// console.log("networkAgent.js: get_vr_proj_scene: onload, response=", xhr.response );
										VRSceneResult[j] = xhr.response.data;
										
										//////
										////// check the consistency between every objects inside sceneResult and userProjResDict 
										////// save the res_url into scene
										//////

										// for ( let k = 0; k < VRSceneResult[j].scenes.length; k++ ){
										// 	if ( VRSceneResult[j].scenes[k].scene_objs ){
										// 		for ( let m = 0; m < VRSceneResult[j].scenes[k].scene_objs.length; m++ ){
										// 			let res = VRSceneResult[j].scenes[k].scene_objs[m];
										// 			let res_id = res.res_id ;

										// 			if (  res.res_id == "" ){
										// 				if (res.main_type == "camera" && res.res_name == "VR Camera" && res.sub_type == "VRcamera" ){
										// 					// console.log("networkAgentVR.js: _getVRSceneByUserID: _getUSerPublishProjs: res camera");
										// 				}else{
										// 					console.log("networkAgentVR.js: _getVRSceneByUserID: _getUSerPublishProjs: res error: ", res, i, j, k ); 
										// 				}
										// 			} else {
										// 				if (userProjResDict[res_id]){
										// 					if ( userProjResDict[res_id].res_url == res.res_url ){
										// 						// console.log("networkAgentVR.js: _getVRSceneByUserID: _getUSerPublishProjs: publish.res_url is same as res.url "  );
										// 					} else {
										// 						console.log("%cnetworkAgentVR.js: _getVRSceneByUserID: _getUSerPublishProjs: publish.res_url different as res.url, replace it", "color:red" , i, j, k );
										// 					}

										// 					if (userProjResDict[res_id].main_type=="model"){
										// 						if (userProjResDict[res_id].res_url_fbx){
										// 							// console.log("networkAgentVR.js: _getVRSceneByUserID: _getUSerPublishProjs: res model: ", res, i, j, k ); 
										// 							res.res_url_fbx = userProjResDict[res_id].res_url_fbx;
										// 						}
										// 					}
										// 				}
										// 			}
										// 		}
										// 	}
										// }
										
										if ( count == publishVRProjs.result.length ){
											// console.log("%cnetworkAgent.js: get_vr_proj_scene: onload, save VRSceneResult ", "color:red", count );
											window.VRSceneResult = VRSceneResult;
											window.userProjResDict = userProjResDict;
											window.userOnlineResDict = userOnlineResDict;
											if (callback) callback(VRSceneResult);
										}

									}
									xhr.send(getVRProjSceneJsonReq);

								}
							}
						}
						
							
					}
					xhr.send(jsonReq);

				}
			// });
			};


			getPayInfoByUserID( url, user_id , function( userPayInfo ){
				let expire_date, expire_date_ymd, expire_date_ymd_arr, ISOexpire_date;
//[start-20191113-thonsha-add]//
				let userIDWhiteListUrl = 'https://s3-ap-northeast-1.amazonaws.com/makar.webar.defaultobject/web_white_list/webVR_UserID_WhiteList.txt';
				readTextFile( userIDWhiteListUrl , function( txtfile ){

					let jsonObj = JSON.parse(txtfile);
					let userIDList = jsonObj["customizedUserID"]["list"];
					let nameList = [];
					for (let i = 0; i < userIDList.length; i++){
						nameList.push(userIDList[i]["name"]);
					}
					let isInNameList = (nameList.indexOf(user_id) > -1);
//[end---20191113-thonsha-add]//
					if (userPayInfo.data){
						// console.log("networkAgent.js:_getARSceneByUserID:_getPayInfoByUserID: user_type=", userPayInfo.data.user_type );
						switch (userPayInfo.data.user_type){
							case "free":
								console.log("networkAgent.js:_getARSceneByUserID:_getPayInfoByUserID: user_type(free)=", userPayInfo.data );
//[start-20191113-thonsha-mod]//
								if (isInNameList){
//[end---20191113-thonsha-mod]//
									getUserPublishProjsByUserID(url, user_id, main_type, sub_type, getUserPublishProjsCallback );
									break;
								}
								if(callback) callback("this ID is free user, now allow for using webAR ");

								break;
							case "proA":
								console.log("networkAgent.js:_getARSceneByUserID:_getPayInfoByUserID: user_type(proA)=", userPayInfo.data );
//[start-20191113-thonsha-mod]//
								if (isInNameList){
//[end---20191113-thonsha-mod]//
									getUserPublishProjsByUserID(url, user_id, main_type, sub_type, getUserPublishProjsCallback );
									break;
								}

								//////// check the expire date, it is work, doesnt need now.
								expire_date = userPayInfo.data.user_type_expire_date;
								if (expire_date){
									expire_date_ymd = expire_date.split(" ")[0];
									if (expire_date_ymd){
										expire_date_ymd_arr = expire_date_ymd.split("-");
										if (expire_date_ymd_arr){
											if (expire_date_ymd_arr.length == 3 ){
												////// it is very wired, in most browser( PC firefox/chrome ), the month start from 0, both get and set
												////// use var date = new Date( 2019, 9, 2 ), date.getMonth() = 9 
												////// but date.toISOString() = "2019-10-01T16:00:00.000Z"
												////// 
												////// use var date = new Date( [2019, 9, 2] ), date.getMonth() = 8 
												////// but date.toISOString() = "2019-09-01T16:00:00.000Z"

												////// Depend on the earliest paying user, the proA user from 2019-09-25 to 2020-07-25 are free user,
												////// most set new type for verification user.
												// expire_date_ymd_arr = [2020,9,28];
												ISOexpire_date = new Date( expire_date_ymd_arr );
												// var diffDays = ( ISOexpire_date - new Date() )/1000/60/60/24; ////// it unit is millisecond 
												var diffDays = ( ISOexpire_date - new Date([2020,9,26]) )/1000/60/60/24; ////// it unit is millisecond 
												console.log("networkAgent.js:_getARSceneByUserID:_getPayInfoByUserID: expire_date_ymd_arr=", expire_date_ymd_arr, ISOexpire_date );
												console.log("networkAgent.js:_getARSceneByUserID:_getPayInfoByUserID: diffDays=", diffDays );
												if ( diffDays > 1 ){
													getUserPublishProjsByUserID(url, user_id, main_type, sub_type, getUserPublishProjsCallback );
													break;
												}else{
													if(callback) callback("this ID is unpaid user, now allow for using webAR ");
													break;
												}
											}
										}
									}
								}
								if(callback) callback("this ID is unpaid user, now allow for using webAR. ");

								break;

							case "proB":
							case "proC":
							case "custom":
								console.log("networkAgent.js:_getARSceneByUserID:_getPayInfoByUserID: user_type(custom/proB/proC)=", userPayInfo.data );
								getUserPublishProjsByUserID(url, user_id, main_type, sub_type, getUserPublishProjsCallback );

								break;

							default:
								console.log("networkAgent.js:_getARSceneByUserID:_getPayInfoByUserID: user_type(default)=", userPayInfo.data );
								if(callback) callback("this ID is not MAKAR user ");
								break;
						}
					}else{
						console.log("networkAgent.js:_getARSceneByUserID:_getPayInfoByUserID: error, userPayInfo=", userPayInfo );	
						if(callback) callback("this ID have some problem ");
					}


				} );

				
			});


		}
		
	}


	window.getPayInfoByUserID = function( url, user_id, callback ){
		if (!url ) return -1;
		if (!user_id ) return -1;
		// if (!url ) url = "https://ssl-api-makar-v3-apps.miflyservice.com:8081/Makar/";
		// if (!user_id ) user_id = "fefe";

		let specificUrl = url + "get_pay_info"; //set the url you want
		let xhr = new XMLHttpRequest(); // dont use var!!! will override the previous one
		let data = {
			"user_id": user_id , // user_id: miflytest
		}
		let request = {
			"ver":"3.0.0",
			"cid": 5,
			"data":data
		};
		let jsonReq = JSON.stringify(request);
		xhr.open( 'POST', specificUrl , true );
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
		xhr.onload = function(e) {

			if (callback){
				callback( xhr.response );
			}
		}
		xhr.send( jsonReq );
	}


	window.getVRDataByUserID = function( url, user_id, callback ) {
		if (!url ) return -1;
		if (!user_id) user_id = "makarvr";
		let xhr = new XMLHttpRequest();
		let data = {
			"user_id": user_id,
			"cid": "20"
		}
		let strData = JSON.stringify(data);
		//// the formData
		let FD  = new FormData();
		FD.append("cmd", "get_vr_projs");	 
		FD.append("data", strData );

		xhr.open( 'POST', url , true );
		// xhr.setRequestHeader('Content-Type', 'text/plain' );		//// json
		xhr.responseType = 'json' // set reponse as arraybuffer or text or json

		xhr.onload = function(e) {
			// console.log("networkAgent.js:getVRDataByUserID:", xhr.response);
			let userVRData;

	//[start-20190214-fei0054-mod]//
			//// MAKAR "will" all use gzip compress the text as soon as We can(?)
			if (xhr.response.diaoyurar ){
				// console.log("networkAgent.js: getVRDataByUserID: xhr.response.diaoyurar ");

				let jsonData =  parseDiaoyurar(xhr.response.diaoyurar);
				if (!jsonData.error){
					if (jsonData.data){
						userVRData = jsonData.data;
						//// save the userVRData in window  
						if (!window.userVRData){
							console.log("networkAgent.js: getVRDataByUserID: save window.userARData ");
							window.userVRData = userVRData; 
						}else{
							console.log("networkAgent.js: getVRDataByUserID: window.userARData already exist, replace it..");
							window.userVRData = userVRData; 
						}
						if (callback) callback(userVRData); 
					}else{
						if (callback) callback("networkAgent.js:getVRDataByUserID:error: no jsonData.data"); 
					}

				}else{
					if (callback) callback( jsonData.error ); 
					console.log("networkAgent.js: getVRDataByUserID: oops something wrong:", jsonData.error);
				}

				// console.log(jsonData);
			}else{
				// console.log("networkAgent.js: getVRDataByUserID: not xhr.response.diaoyurar ", xhr.response);

				if (!xhr.response.error){
					if (xhr.response.data){
						
						userVRData = xhr.response.data;

						// console.log("networkAgent.js:getVRDataByUserID: onload, response=", xhr.response );
						
						//// save the userVRData in window
						if (userVRData.proj_list) {

							if (!window.userVRData){
								console.log("networkAgent.js: getVRDataByUserID: save window.userARData =", userVRData);
								window.userVRData = userVRData; 
							}else{
								console.log("networkAgent.js: getVRDataByUserID: window.userARData already exist, replace it..");
								window.userVRData = userVRData; 
							}
	
							if (callback) callback(userVRData);

						}else{
							console.log("%cnetworkAgent.js:getVRDataByUserID: onload, fail userVRData.proj_list is empty", "color:red" );
							if (callback) callback("the userVRData.proj_list is empty");
						}
					

					}else{
						if (callback) callback("networkAgent.js:getVRDataByUserID:error: no xhr.response.data"); 
					}
				}else{
					if (callback) callback( xhr.response.error ); 
					console.log("networkAgent.js: getVRDataByUserID: oops something wrong:",xhr.response.error);
				}
			}
	//[end---20190214-fei0054-mod]//
		}
		xhr.send( FD );
	}



//[end---20190806-fei0071-add]//


//[start-20190715-fei0070-add]//
	window.uploadDataToServer = function(url, index, callback){
		if (!url ) return -1;

		let xhr = new XMLHttpRequest(); // dont use var!!! will override the previous one
		let data = {
			"user_id": userARData.user_id,
			"target_id": userARData.proj_list[index].target_id // 1545795389.8544426.1988048228
		}
		// console.log("networkAgent: uploadDataToServer, data = ", data );

		if ( serverVersion == "3.0.0"){
			let specificUrl = url+"add_scan_times";
			let request = {
				"ver":"3.0.0",
				"cid": 5,
				"data":data
			};
			let jsonReq = JSON.stringify(request);

			xhr.open( 'POST', specificUrl , true );

			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
			
			xhr.onload = function(e) {
				// console.log("networkAgent: uploadDataToServer, xhr.response.data = ", xhr.response.data );
			}
			xhr.send( jsonReq );

		}

		if ( serverVersion == "2.0.0"){
			let strData = JSON.stringify(data);
			let FD  = new FormData();
			FD.append("cmd", "add_scan_times");	//get_ar_projs ,  get_ar_proj_scene	, get_ar_projs_by_proj_id
			FD.append("data", strData );

			xhr.open( 'POST', url , true );
			xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"
			xhr.onload = function(e) {
				console.log("networkAgent: uploadDataToServer, xhr = ", xhr.response.data );
			}

			xhr.send( FD );
		}
	}

	////// POST test
	window.testPOST = function(url, callback){
		// if (!url ) return -1;

		var url2 = "http://60.250.125.146:8081/Makar/get_usr_publish_projs"; // get_usr_publish_projs , get_vr_projs , get_ar_projs , get_res
		// var url2 = "https://60.250.125.146:8888/Makar/get_usr_publish_projs"; // get_usr_publish_projs , get_vr_projs , get_ar_projs , get_res

		// var url2 = "https://192.168.0.119:8887/"; // get_usr_publish_projs , get_vr_projs , get_ar_projs , get_res

		// var url2 = "http://192.168.0.119:8887/generator/"; // get_usr_publish_projs , get_vr_projs , get_ar_projs , get_res
		// var url2 = "http://192.168.0.119:8887/"; // get_usr_publish_projs , get_vr_projs , get_ar_projs , get_res

		// var url2 = "https://192.168.0.119:8888/generator/"; // get_usr_publish_projs , get_vr_projs , get_ar_projs , get_res

		// var url2 = "https://192.168.0.135:8881/generator/"; // get_usr_publish_projs , get_vr_projs , get_ar_projs , get_res

		// var url2 = "http://192.168.0.135:8881/generator/"; // get_usr_publish_projs , get_vr_projs , get_ar_projs , get_res

		let xhr = new XMLHttpRequest(); // dont use var!!! will override the previous one
		let data = {
			"user_id": "fefe", //miflytest
		}
		let request = {
			"ver":"3.0.0",
			"cid": 5,
			"data":data,
			"length":8,
		};
		let jsonReq = JSON.stringify(request);
		console.log(" jsonReq ", jsonReq);

		let FD  = new FormData();
		FD.append("cmd", "add_scan_times");	//get_ar_projs ,  get_ar_proj_scene	, get_ar_projs_by_proj_id
		FD.append("data", jsonReq );

		xhr.open( 'POST', url2 , true );
		xhr.setRequestHeader('Content-Type', 'application/json');
		// xhr.setRequestHeader('Content-type', 'application/json ; charset=UTF-8');
		// xhr.setRequestHeader('Accept', 'application/json');
		xhr.responseType = 'json' // set reponse as "arraybuffer" or "text" or "json"

		xhr.onload = function(e) {
			console.log("networkAgent: testPOST,  onload xhr = ", xhr, xhr.response );
		}
		xhr.send( jsonReq );
		// xhr.send( FD );

	}

//[end---20190715-fei0070-add]//

})();
