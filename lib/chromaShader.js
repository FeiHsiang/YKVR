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

var vertexShader = 
	`varying vec2 vUv;
	void main()
	{
		vUv = uv;
		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
		gl_Position = projectionMatrix * mvPosition;
	}`;

var fragmentShader = `
	uniform sampler2D texture;
	uniform vec3 color;
	varying vec2 vUv;
	float _threshold = 1.0 ;
	float _slope = 0.3 ;
	void main()
	{
		vec3 tColor = texture2D( texture, vUv ).rgb;
		// float a = (length(tColor - color) - 0.5) * 7.0;

		// if (tColor.g > 0.7 && tColor.r < 0.7 && tColor.b < 0.7  ){
		// 	tColor = vec3(0.0, 0.0, 0.0);
		// 	tColor.g = 0.0;
		// 	a = 0.0 ;
		// }
		// gl_FragColor = vec4(tColor, a);

		///////// thonsha method ///////
		float d1, d2, d3, d4, d;
		d1 = abs(length(abs(color.rgb - tColor.rgb)));

		float c1 = abs(length( tColor.g - tColor.r) - length(color.g - color.r));
		float c2 = abs(length( tColor.r - tColor.b) - length(color.r - color.b));
		float c3 = abs(length( tColor.b - tColor.g) - length(color.b - color.g));

		d4 = c1 + c2 + c3;

		d = (d1*2.0 + d4) / 2.0 ;

		float edge0 = _threshold * (1.0 - _slope);
		float alpha = smoothstep(edge0, _threshold, d);
		gl_FragColor = vec4(tColor, alpha );

	}`;


THREE.ChromaKeyMaterial = function( parameters ) {
	// console.log("chromaShader.js: ChromaKeyMaterial: parameters=", parameters );
	if ( parameters === undefined ) return;
	if ( parameters.map === undefined || parameters.keyColor === undefined ) return;
	if ( parameters.side === undefined)  parameters.side = THREE.FrontSide;

	if ( parameters.slope === undefined)  parameters.slope = 0.3 ;
	if ( parameters.threshold === undefined)  parameters.threshold = 1.0 ;
	
	var fragmentShaderM = fragmentShader.replace("float _threshold = 1.0", "float _threshold = " + parameters.threshold.toFixed(3) );
	fragmentShaderM = fragmentShaderM.replace("float _slope = 0.3", "float _slope = " + parameters.slope.toFixed(3) );

	// console.log("chromaShader.js: ChromaKeyMaterial: slope / threshold =", parameters.slope, parameters.threshold  );
	// console.log("chromaShader.js: ChromaKeyMaterial: fragmentShader =", fragmentShaderM  );

	var self = this;
	THREE.ShaderMaterial.call(self);
	
	var keyColorObject;

	if ( Array.isArray( parameters.keyColor  ) ){ 
		keyColorObject = new THREE.Color( parameters.keyColor[0] , parameters.keyColor[1] , parameters.keyColor[2] );
	}else{
		keyColorObject = new THREE.Color( parameters.keyColor );
	}

	self.setValues({
		uniforms: {
			texture: {
				type: "t",
				value: parameters.map,
			},
			color: {
				type: "c",
				value: keyColorObject
			}
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShaderM,

		map: parameters.map, 
		transparent: true,
		side: parameters.side ,

	});
	
};

THREE.ChromaKeyMaterial.prototype = Object.create( THREE.ShaderMaterial.prototype );
THREE.ChromaKeyMaterial.prototype.constructor = THREE.ChromaKeyMaterial;
