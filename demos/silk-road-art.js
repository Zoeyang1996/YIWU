import * as THREE from 'three';

// 细节仅属于美术层，沿用现有港口坐标、交互点和商品状态。
const canvasTexture = (w, h, paint) => {
  const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
  paint(canvas.getContext('2d'), w, h);
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=8; return texture;
};
export function stoneTexture() {
  return canvasTexture(1024,1024,(ctx,w,h)=>{
    ctx.fillStyle='#bcb9a5'; ctx.fillRect(0,0,w,h);
    let seed=73; const random=()=>((seed=(seed*16807)%2147483647)/2147483647);
    for(let row=0;row<32;row++) for(let col=-1;col<12;col++) {
      const x=col*100+(row%2)*50,y=row*32;
      const value=180+random()*22;
      ctx.fillStyle=`rgb(${value+13},${value+12},${value})`; ctx.fillRect(x+1,y+1,98,30);
      ctx.strokeStyle='rgba(255,255,238,.22)'; ctx.lineWidth=.7; ctx.strokeRect(x+2,y+2,96,28);
      for(let i=0;i<8;i++) { ctx.fillStyle='rgba(75,84,73,.05)'; ctx.fillRect(x+random()*98,y+random()*30,random()*16,1); }
    }
  });
}
export function seaTexture() {
  return canvasTexture(2048,1024,(ctx,w,h)=>{
    ctx.fillStyle='#6f9691'; ctx.fillRect(0,0,w,h);
    for(let row=-2;row<40;row++) {
      for(let strand=0;strand<4;strand++) {
        ctx.strokeStyle=strand===0?'rgba(235,232,204,.37)':'rgba(210,224,206,.17)'; ctx.lineWidth=strand===0?1.2:.65;
        ctx.beginPath();
        for(let x=-2;x<=w+2;x+=4) {
          const y=row*30+strand*4+Math.sin(x*Math.PI*8/w+row*.42)*6+Math.sin(x*Math.PI*16/w+row*.6)*2;
          x===-2?ctx.moveTo(x,y):ctx.lineTo(x,y);
        } ctx.stroke();
      }
    }
    for(let j=0;j<36;j++) {
      const x=(j*313)%w,y=(j*149)%h;
      for(let k=0;k<5;k++) { ctx.beginPath(); ctx.strokeStyle=`rgba(244,235,204,${.35-k*.045})`; ctx.lineWidth=.8; ctx.ellipse(x,y,12+k*5,4+k*2,-.1,Math.PI*.9,Math.PI*2.2); ctx.stroke(); }
    }
  });
}
export function createArtMaterials(toon) {
  const tiles=canvasTexture(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#d8dfd2'; ctx.fillRect(0,0,w,h);
    for(let x=0;x<w;x+=16) {
      ctx.fillStyle=x%32?'#a8b9b0':'#c4cfc1'; ctx.fillRect(x,0,8,h);
      ctx.strokeStyle='#6d8580'; ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(x+13,0);ctx.lineTo(x+13,h);ctx.stroke();
      for(let y=0;y<h;y+=42) {ctx.strokeStyle='rgba(70,88,83,.4)';ctx.beginPath();ctx.ellipse(x+7,y,7,3,0,0,Math.PI);ctx.stroke();}
    }
  });
  const plaster=canvasTexture(256,256,(ctx,w,h)=>{
    ctx.fillStyle='#f0ead8';ctx.fillRect(0,0,w,h);
    for(let i=0;i<1600;i++) {const x=(i*37)%256,y=(i*73)%256;ctx.fillStyle=i%3?'rgba(98,93,67,.025)':'rgba(255,255,255,.16)';ctx.fillRect(x,y,2,1);}
  });
  return { roof:toon(0x536e67,{map:tiles}), wall:toon(0xffffff,{map:plaster}), wood:toon(0x6c5141), dark:toon(0x3e4945), stone:toon(0xb0b2a1), gold:toon(0xb5a16b), red:toon(0x995b48), glass:toon(0x6b827c), cloth:toon(0xd2c0a0) };
}
function mesh(g,geometry,material,x,y,z) {
  const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function box(g,m,w,h,d,x,y,z) {return mesh(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);}
export function curvedRoof(w,d,h,material) {
  const positions=[],uvs=[],indices=[],n=20;
  for(let side=0;side<2;side++) for(let i=0;i<=n;i++) {
    const t=i/n, x=(side?1:-1)*t*w*.5;
    const y=h*(1-t)+h*.34*t*t*t*t;
    for(const z of [-d*.5,d*.5]) { positions.push(x,y,z);uvs.push(t,z<0?0:1); }
  }
  for(let side=0;side<2;side++) for(let i=0;i<n;i++) {const a=side*(n+1)*2+i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  const roof=new THREE.Mesh(geo,material);roof.material.side=THREE.DoubleSide;roof.castShadow=true;roof.receiveShadow=true;return roof;
}
export function merchantHouse(w,d,h,A,{shop=false}={}) {
  const g=new THREE.Group();
  box(g,A.stone,w+.3,.24,d+.3,0,.12,0);box(g,A.wall,w,h,d,0,.24+h*.5,0);
  for(const x of [-w*.48,0,w*.48]) for(const z of [-d*.49,d*.51]) box(g,A.wood,.12,h,.13,x,h*.5+.24,z);
  for(const y of [.3,h*.48,h+.15]) box(g,A.wood,w+.12,.12,d+.1,0,y,0);
  for(const side of [-1,1]) {
    const x=side*(w*.5+.025);
    for(const z of [-d*.27,d*.27]) {
      box(g,A.dark,.06,h*.32,d*.29,x,h*.62+.24,z);
      for(let i=-2;i<=2;i++) box(g,A.wood,.08,h*.32,.025,x+side*.03,h*.62+.24,z+i*d*.05);
      for(let i=-1;i<=1;i++) box(g,A.wood,.08,.025,d*.3,x+side*.03,h*.62+.24+i*h*.1,z);
      box(g,A.stone,.2,.08,d*.34,x,h*.46+.24,z);
    }
  }
  for(const x of [-w*.3,w*.3]) {
    box(g,A.dark,w*.22,h*.32,.06,x,h*.6+.24,-d*.5-.025);
    for(let i=-2;i<=2;i++)box(g,A.wood,.028,h*.32,.08,x+i*w*.035,h*.6+.24,-d*.5-.05);
  }
  const front=d*.5+.04;
  box(g,A.dark,w*.24,h*.62,.08,0,h*.31+.24,front);
  for(const x of [-w*.3,w*.3]) {
    box(g,A.dark,w*.22,h*.32,.08,x,h*.58+.24,front);
    for(let i=-2;i<=2;i++) box(g,A.wood,.028,h*.32,.025,x+i*w*.035,h*.58+.24,front+.06);
    for(let i=-1;i<=1;i++) box(g,A.wood,w*.22,.025,.025,x,h*.58+.24+i*h*.1,front+.06);
    box(g,A.stone,w*.26,.08,.18,x,h*.42+.24,front+.06);
  }
  const roof=curvedRoof(w+1,d+.8,h*.36,A.roof);roof.position.y=h+.24;roof.rotation.y=Math.PI/2;
  // 檐口、连贯瓦垄与脊饰，避免原先的四面锥体。
  roof.rotation.y=0;g.add(roof);
  box(g,A.wood,.12,.1,d+.86,0,h*1.36+.24,0);
  for(const z of [-d*.5-.35,d*.5+.35]) {
    const tip=mesh(g,new THREE.TorusGeometry(.14,.025,5,12,Math.PI),A.gold,0,h*1.36+.28,z);tip.rotation.y=Math.PI/2;
  }
  for(const x of [-w*.5-.35,w*.5+.35]) box(g,A.wood,.09,.1,d+.8,x,h+.24+h*.12,0);
  for(let i=-3;i<=3;i++) box(g,A.wood,.06,.16,.28,i*w/7,h+.2,front+.14);
  box(g,A.stone,w*.42,.12,.65,0,.06,front+.35);
  if(shop) {
    const awning=curvedRoof(w*.8,1.4,.2,A.cloth);awning.position.set(0,h*.57,front+.65);g.add(awning);
    for(const x of [-w*.38,w*.38]) box(g,A.wood,.06,h*.57,.06,x,h*.285,front+1.15);
    for(let i=0;i<4;i++) mesh(g,new THREE.CylinderGeometry(.14,.12,.28,12),i%2?A.red:A.glass,-w*.28+i*w*.18,.38,front+.1);
  }
  return g;
}
export function decorateHarbor(scene,A,toon) {
  const g=new THREE.Group();scene.add(g);
  // 岸线的石砌立面、压顶和系缆柱。
  for(let i=-19;i<=19;i++) {
    box(g,A.stone,.96,.5,.6,i,-.19,12.95);box(g,A.wall,.98,.1,.76,i,.1,12.8);
    if(i%4===0&&Math.abs(i)>1) {
      const post=mesh(g,new THREE.CylinderGeometry(.13,.2,.55,10),A.dark,i,.3,12.6);
      mesh(g,new THREE.TorusGeometry(.18,.025,5,12),A.gold,i,.48,12.6).rotation.x=Math.PI/2;
    }
  }
  // 远景街坊：前景保留宽阔行走区，高建筑集中在后侧。
  for(let row=0;row<3;row++) for(const side of [-1,1]) for(let col=0;col<3;col++) {
    const house=merchantHouse(3.3+(col%2)*.5,2.7,2.4+(row%2)*.9,A,{shop:row===0});
    house.position.set(side*(5.4+col*4.4),0,-9-row*5);house.rotation.y=side>0?-Math.PI/2:Math.PI/2;g.add(house);
  }
  // 码头货物分组陈列：竹筐、陶罐、叠货与布包。
  for(const [x,z] of [[-7,10],[-11,8],[6.6,10],[-5,-4],[7,-5]]) {
    for(let i=0;i<3;i++) {
      const barrel=mesh(g,new THREE.CylinderGeometry(.27,.24,.55,12),A.wood,x+(i%2)*.55,.28+Math.floor(i/2)*.5,z);barrel.rotation.y=i*.3;
      for(const y of [.14,.42]) mesh(g,new THREE.TorusGeometry(.265,.018,4,12),A.dark,barrel.position.x,barrel.position.y-.28+y,z).rotation.x=Math.PI/2;
    }
    box(g,A.cloth,1,.55,.75,x-1,.3,z+.2);
  }
  // 松树的枝干与扁平簇叶，使用墨绿渐层而非球形糖果树。
  const pine=toon(0x536e5d),pineLight=toon(0x81947c);
  for(const [x,z] of [[-13,5],[13,6],[-15,-5],[15,-9],[-3,-18]]) {
    mesh(g,new THREE.CylinderGeometry(.08,.18,2.7,8),A.wood,x,1.35,z);
    for(let i=0;i<5;i++) {
      const sx=Math.sin(i*2.3)*.8,sz=Math.cos(i*2.3)*.6;
      const branch=box(g,A.wood,1.5,.07,.07,x+sx*.5,1.6+i*.23,z+sz*.5);branch.rotation.z=sx*.2;
      const leaf=mesh(g,new THREE.SphereGeometry(.75,12,6),i%2?pine:pineLight,x+sx,1.7+i*.23,z+sz);leaf.scale.set(1,.23,.75);
    }
  }
  // 石青远山以连续起伏的山脊构成景深。
  for(let layer=0;layer<3;layer++) {
    const positions=[];for(let i=0;i<=50;i++) {const x=-45+i*1.8,h=3+Math.sin(i*.49+layer)*2+Math.sin(i*.93)*1.2;positions.push(x,-.2,-29-layer*7,x,h+layer*1.2,-29-layer*7);}
    const indices=[];for(let i=0;i<50;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo,toon([0x7e9689,0xa0afa0,0xc1c9b7][layer],{side:THREE.DoubleSide})));
  }
  return g;
}
export function detailShip(ship,A) {
  // 绳索、船舷、甲板细线、桅杆支索与帆骨。
  for(let i=0;i<24;i++) box(ship,A.wood,1.6,.015,.025,0,.68,-1.7+i*.145);
  for(const side of [-1,1]) {
    box(ship,A.gold,.04,.04,3.3,side*.82,.78,0);
    for(let i=0;i<8;i++) box(ship,A.wood,.045,.28,.045,side*.82,.83,-1.5+i*.43);
  }
  for(let i=0;i<3;i++) {
    const points=[new THREE.Vector3(-.75,.8,-1.3+i),new THREE.Vector3(0,3,-1+i),new THREE.Vector3(.75,.8,-1.3+i)];
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x695e48,transparent:true,opacity:.65}));ship.add(line);
  }
}
export function harborShip(A) {
  const g=new THREE.Group(),positions=[],indices=[],n=18,k=14;
  for(let i=0;i<=n;i++) {
    const t=i/n,z=-2+t*4,width=.18+Math.sin(Math.PI*t)*.68,lip=.62+Math.pow(Math.abs(t-.5)*2,3)*.35;
    for(let j=0;j<=k;j++) {const a=j/k*Math.PI;positions.push(Math.cos(a)*width,lip-Math.sin(a)*.55,z);}
  }
  for(let i=0;i<n;i++)for(let j=0;j<k;j++){const a=i*(k+1)+j;indices.push(a,a+1,a+k+1,a+1,a+k+2,a+k+1);}
  const hull=new THREE.BufferGeometry();hull.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));hull.setIndex(indices);hull.computeVertexNormals();mesh(g,hull,A.wood,0,0,0).material.side=THREE.DoubleSide;
  const deck=new THREE.Shape();deck.moveTo(0,-2);deck.bezierCurveTo(.85,-1.5,.95,1,.15,2);deck.lineTo(-.15,2);deck.bezierCurveTo(-.95,1,-.85,-1.5,0,-2);
  const board=mesh(g,new THREE.ShapeGeometry(deck,24),A.cloth,0,.64,0);board.rotation.x=-Math.PI/2;
  box(g,A.wood,.8,.4,.7,0,.88,-1.2);
  for(const [z,height,width] of [[-1.05,2.55,.7],[0,3.35,1.2],[1.1,2.8,.9]]) {
    mesh(g,new THREE.CylinderGeometry(.035,.055,height,10),A.dark,0,.65+height*.5,z);
    const geo=new THREE.PlaneGeometry(width,height*.6,12,6),pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin((pos.getX(i)/width+.5)*Math.PI)*.15);geo.computeVertexNormals();
    const sail=mesh(g,geo,A.cloth,0,.65+height*.64,z+.08);sail.material.side=THREE.DoubleSide;
    for(let j=0;j<7;j++)box(g,A.gold,width,.016,.016,0,.65+height*.34+j*height*.1,z+.13);
  }
  detailShip(g,A);return g;
}
