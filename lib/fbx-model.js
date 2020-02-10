/**
 * FBX model loader.
 */
AFRAME.registerComponent('fbx-model', {
    schema: {
        src: {type: 'model'}
    },

    init: function () {
        // console.log( "init fbx component, this=", this );
        this.model = null;
        this.mixers = null;
        this.fbxLoader = new THREE.FBXLoader();

    },

    update: function () {
        var self = this;
        var el = this.el; // the entity tag
        var data = this.data; // default key ?
        var scene = el.sceneEl.object3D; // THREE scene
        var object3D = this.el.object3D;
        var object3DMap = this.el.object3DMap;
        var sceneEl = this.el.sceneEl;

        // console.log( "fbx-model.js: update fbx component, this=", this );
        // console.log( "fbx-model.js: update fbx component, el.components=", el.components );

        if (!data ) { return; }

        // this.remove();

//[start-20180717-ben(spider)]//
        self.fbxLoader.load( data["src"], 
            function fbxLoaded ( fbxModel ) {
                // console.log("fbx-model.js: fbxModel =", fbxModel );
    
                if (fbxModel.animations){
                    fbxModel.mixer = new THREE.AnimationMixer( fbxModel );
                    // mixers.push( object.mixer ); // fei20181106 remove, we now check which obj is visible then update it
                    var action = fbxModel.mixer.clipAction( fbxModel.animations[ 0 ] );
                    action.play();
                    
                    sceneEl.addBehavior( self );
                    // console.log("fbx-model.js: have animations addBehavior self=", self );

                    ///// self call animation, not a good way. but it is work
                    // var clock = new THREE.Clock();
                    // function animation_tick(dt) {
                    //     var dt = clock.getDelta();
                    //     fbxModel.mixer.update(dt);
                    //     setTimeout( animation_tick , 30 );
                    // }
                    // animation_tick(0);

                }

                fbxModel.traverse( function ( child ) {
                    if ( child.isMesh ) {
                        // console.log("fbx-model.js: fbxModel mesh=", child);
                        child.el = el; ////// add the el for raycaster
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                let scale = new THREE.Vector3(1,1,1);
                checkFBXApplication(fbxModel, scale ); //// 
                fbxModel.scale.copy( scale.multiplyScalar( 0.01 ) ); //// 0.01 is the ratio of unity

                // scene.add( fbxModel );

                // fbxModel["makarObject"] = true ;
                // object3D["makarObject"] = true ;


                fbxModel.el = el; // just add..
                object3D.add(fbxModel);
                object3DMap["mesh"] = fbxModel;
                scene.add( object3D );
                console.log("fbx-model.js: add into scene " );

        } );
//[end-20180717-ben(spider)]//

        var checkFBXApplication = function( object, scale ){
            
            if (object["LastSaved|ApplicationName"]){
                switch (object["LastSaved|ApplicationName"].value ){
                    case "3ds Max":
                        if ( object["OriginalUnitScaleFactor"] ){
                            console.log("LastSaved|ApplicationName = 3d Max, OriginalUnitScaleFactor exist scale*", object["OriginalUnitScaleFactor"]  ) ; 
                            scale.multiplyScalar( object["OriginalUnitScaleFactor"] );
                        }else{
                            console.log("LastSaved|ApplicationName = 3d Max, OriginalUnitScaleFactor not exist scale*100 " ) ; 
                            scale.multiplyScalar(100);
                        }
                        // scale.multiplyScalar(100);
                        break;
                    case "Maya":
                        if ( object["OriginalUnitScaleFactor"] ){
                            console.log("LastSaved|ApplicationName = Maya, OriginalUnitScaleFactor exist scale*", object["OriginalUnitScaleFactor"]  ) ; 
                            scale.multiplyScalar( object["OriginalUnitScaleFactor"] );
                        }else{
                            console.log("LastSaved|ApplicationName = Maya, OriginalUnitScaleFactor not exist do nothong"  ) ; 
                        }
                        // object.scale.set(1,1,1);
                        break;
                    default:
                        console.log("not 3ds Max and Maya, LastSaved|ApplicationName = ", object["LastSaved|ApplicationName"] );
                }
            }else{
                console.log("three.js: checkFBXApplication: object not include LastSaved|ApplicationName " );
            }
        }

    },
    
    remove: function () {
        if (!this.model) { return; }
        this.el.removeObject3D('mesh');  
    },

    loadFbx: function () {
    },

    pause: function () {},
    
    play: function () {}
});