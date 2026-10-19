import * as THREE from './assets/three.module.js';
// One instanced draw for the small contact washes beneath every standing figure.
// The retained source transforms still receive the bridge's local ground normal.
export function crowdShadows(people){
  const material=new THREE.MeshBasicMaterial({color:'#61563d',transparent:true,opacity:.11,depthWrite:false});
  const mesh=new THREE.InstancedMesh(new THREE.CircleGeometry(1,16),material,people.people.length);
  mesh.name='shared foot contact washes';mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);people.group.add(mesh);
  const sources=people.people.map(p=>{
    p.foot.geometry.computeBoundingSphere();const radius=p.foot.geometry.boundingSphere.radius;p.foot.visible=false;
    return {foot:p.foot,root:p.g,radius};
  });
  const matrix=new THREE.Matrix4(),inverse=new THREE.Matrix4(),scale=new THREE.Vector3();
  return {mesh,update(){
    people.group.updateWorldMatrix(true,false);inverse.copy(people.group.matrixWorld).invert();
    for(let i=0;i<sources.length;i++){
      const s=sources[i];s.root.updateMatrixWorld(true);scale.setScalar(s.radius);
      matrix.multiplyMatrices(inverse,s.foot.matrixWorld).scale(scale);mesh.setMatrixAt(i,matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
  }};
}
