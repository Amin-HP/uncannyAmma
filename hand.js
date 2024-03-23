import { createNoise2D } from 'simplex-noise';

class Hand{
    constructor(model){
        this.object = model;
        this.noise2D = createNoise2D();
        this.ran = Math.random() * 10;
        this.bones = model.children[0].skeleton.bones;
        this.object.traverse(( child ) => {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }
    //update hand rotation
    setRotation(vec){
        for(let i = 1; i < this.bones.length; i++){
            this.bones[i].rotation.x = vec.x + this.noise2D(performance.now() * 0.0004, this.ran + i * 10) * 0.1;
            this.bones[i].rotation.y = vec.y + this.noise2D(performance.now() * 0.0004, this.ran + i * 10) * 0.1;
        }
    }
    //update hand position
    setPosition(vec){
       this.object.position.set(vec.x, vec.y, vec.z)
    }
    //get hand position
    getPosition(){
        return this.object.position;
    }

}

export { Hand };