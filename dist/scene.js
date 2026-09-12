import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {initial,makeNetwork,step,names,positions} from './model.js';
const $=id=>document.getElementById(id);
const scene=new T.Scene();scene.background=new T.Color('#d8e7bc');scene.fog=new T.Fog('#d8e7bc',22,48);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor('#d8e7bc');$('world').append(renderer.domElement);
const camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.1,100);camera.position.set(12,12,17);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.47;controls.minDistance=8;controls.maxDistance=32;controls.autoRotateSpeed=.5;
scene.add(new T.HemisphereLight(0xffffe8,0x79966e,2.4));const sun=new T.DirectionalLight(0xfff7df,3.2);sun.position.set(-6,15,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:50});sun.shadow.normalBias=.03;sun.shadow.radius=4;scene.add(sun);
const mat=(c,extra={})=>new T.MeshStandardMaterial({color:c,roughness:.85,flatShading:true,...extra});const cream=mat('#edf0d9'),green=mat('#748c69'),dark=mat('#344940'),metal=mat('#aeb9a3',{metalness:.35}),rubber=mat('#394742'),wood=mat('#b0be91');
function mesh(g,m,p,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
function box(p,x,y,z,w,h,d,m){return mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z)}
function rod(p,a,b,r,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const o=mesh(new T.CylinderGeometry(r,r,v.length(),7),m,p);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o}
function orb(p,x,y,z,sx,sy,sz,m,detail=1){const o=mesh(new T.IcosahedronGeometry(1,detail),m,p,x,y,z);o.scale.set(sx,sy,sz);return o}
box(scene,0,-.72,0,100,.2,100,mat('#c5d8a6'));box(scene,0,-.04,0,11,.3,8,cream);for(const x of [-4.6,4.6])for(const z of [-3.2,3.2])box(scene,x,-.4,z,.22,.7,.22,green);
const grid=new T.GridHelper(10.8,36,0xd4dcc6,0xe0e5d3);grid.position.y=.116;grid.scale.z=7.8/10.8;scene.add(grid);
function label(text,x,z){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;const ctx=canvas.getContext('2d');ctx.font='22px monospace';ctx.textAlign='center';ctx.fillStyle='#607650';ctx.fillText(text,256,42);const tex=new T.CanvasTexture(canvas);const o=mesh(new T.PlaneGeometry(2.4,.3),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),scene,x,.125,z);o.rotation.x=-Math.PI/2;}
function barbell(p,y,z=0){const g=new T.Group();g.position.set(0,y,z);p.add(g);rod(g,[-1.05,0,0],[1.05,0,0],.035,metal);for(const side of [-1,1]){const plate=mesh(new T.CylinderGeometry(.26,.26,.13,12),rubber,g,side*.82,0,0);plate.rotation.z=Math.PI/2;const plate2=mesh(new T.CylinderGeometry(.2,.2,.08,12),green,g,side*.96,0,0);plate2.rotation.z=Math.PI/2;}return g}
const bars=[];positions.forEach(([x,z],i)=>{const g=new T.Group();g.position.set(x,.13,z);scene.add(g);box(g,0,.035,0,2.65,.07,2.5,i===1?wood:mat('#c3d3af'));label(['01 / BENCH','02 / DEADLIFT','03 / SQUAT','04 / FREE WEIGHTS'][i],x,z+1.43);
if(i===0){box(g,0,.47,.22,.58,.16,1.55,dark);for(const zz of [-.3,.7])box(g,0,.23,zz,.1,.45,.1,metal);for(const xx of [-.85,.85]){box(g,xx,.8,-.6,.09,1.5,.09,green);box(g,xx,.12,-.6,.45,.1,.7,green);}bars[i]=barbell(g,1.38,-.6);}
if(i===1){for(const xx of [-.9,.9])box(g,xx,.09,0,.6,.08,2.3,rubber);bars[i]=barbell(g,.36);}
if(i===2){for(const xx of [-.95,.95])for(const zz of [-.65,.65])box(g,xx,1.15,zz,.1,2.2,.1,green);rod(g,[-.95,2.25,-.65],[.95,2.25,-.65],.05,dark);for(const xx of [-.95,.95])rod(g,[xx,.8,-.65],[xx,.8,.65],.045,metal);bars[i]=barbell(g,1.5);}
if(i===3){for(const xx of [-.9,.9])box(g,xx,.48,-.6,.09,.9,.5,green);for(const yy of [.4,.85]){box(g,0,yy,-.6,2.1,.09,.52,metal);for(const xx of [-.7,0,.7]){rod(g,[xx-.15,yy+.17,-.6],[xx+.15,yy+.17,-.6],.025,metal);for(const dx of [-.18,.18])box(g,xx+dx,yy+.17,-.6,.14,.22,.22,dark);}}}
});
// Seeded scenery keeps the garden identical between reloads.
let seed=34;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<27;i++){const x=(rand()-.5)*35,z=-6-rand()*16,h=3+rand()*7;rod(scene,[x,-.6,z],[x,h*.7,z],.09,mat('#a7bf88'));for(let j=0;j<3;j++)orb(scene,x+(rand()-.5)*1.2,h*(.5+j*.2),z,1.0+rand()*.7,1.6,1,mat(['#b4ce94','#bfd5a2','#abc78e'][j]),0);}
for(let i=0;i<19;i++){const x=(rand()-.5)*25,z=-5-rand()*13,h=1.5+rand()*5;rod(scene,[x,-.6,z],[x,h,z],.025,mat('#a4bb87'));const flower=new T.Group();scene.add(flower);flower.position.set(x,h,z);orb(flower,0,0,0,.18,.09,.18,mat('#e5cf79'));for(let j=0;j<7;j++){const a=j/7*Math.PI*2;const petal=orb(flower,Math.cos(a)*.28,0,Math.sin(a)*.28,.26,.045,.14,mat('#f6f3da'));petal.rotation.y=-a;}}
const fly=new T.Group();scene.add(fly);const body=new T.Group();fly.add(body);const shell=mat('#293e36'),eye=mat('#ba3540',{roughness:.28});orb(body,0,.61,.25,.27,.28,.48,shell);orb(body,0,.67,-.18,.28,.3,.29,shell);orb(body,0,.71,-.49,.23,.23,.21,shell);for(const s of [-1,1]){orb(body,s*.18,.75,-.55,.14,.18,.14,eye,2);rod(body,[s*.09,.86,-.55],[s*.14,.98,-.72],.01,dark);}
const wings=[];for(const s of [-1,1]){const wing=orb(body,s*.28,.88,.2,.22,.022,.61,mat('#dee9d6',{transparent:true,opacity:.48,side:T.DoubleSide,depthWrite:false}));wing.rotation.y=s*.38;wings.push(wing);}
const legs=[];for(let j=0;j<3;j++)for(const s of [-1,1]){const g=new T.Group();body.add(g);g.position.set(s*.18,.62,-.26+j*.24);rod(g,[0,0,0],[s*.3,-.2,(j-1)*.15],.023,dark);rod(g,[s*.3,-.2,(j-1)*.15],[s*.36,-.57,(j-1)*.25],.016,dark);rod(g,[s*.36,-.57,(j-1)*.25],[s*.46,-.59,(j-1)*.25-.08],.012,dark);legs.push({g,s,j});}
let state=initial(),net=makeNetwork(),speed=1,paused=false,last=performance.now(),view=0;
$('loading').remove();
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ Resume':'Ⅱ Pause'};
$('feed').onclick=()=>{if(state.time-state.lastBoost<30){$('event').textContent='Still enjoying the last sugar break.';return}state.energy=Math.min(100,state.energy+25);state.lastBoost=state.time;$('event').textContent='A little sugar. A lot of ambition.'};
$('reset').onclick=()=>{state=initial();net=makeNetwork();$('event').textContent='A fresh start. The same tiny ambition.'};
for(const b of document.querySelectorAll('[data-speed]'))b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b))};
$('view').onclick=()=>{view=(view+1)%3;camera.position.set(...[[12,12,17],[-12,9,12],[0,19,4]][view]);controls.target.set(0,1,0)};
$('cinema').onclick=()=>{const on=document.body.classList.toggle('cinema');controls.autoRotate=on;$('cinema').setAttribute('aria-pressed',on);$('cinema').textContent=on?'Exit cinema':'Cinema'};
$('stats').onclick=()=>{$('stats').setAttribute('aria-expanded',!document.body.classList.toggle('hide-stats'))};
$('setup').onclick=()=>$('info').showModal();$('close').onclick=()=>$('info').close();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(!paused){let remaining=dt*speed;while(remaining>0){const d=Math.min(remaining,1/60);step(state,d,net,m=>$('event').textContent=m);remaining-=d;}}
fly.position.set(state.x,.16,state.y+.7);if(state.phase==='walking')fly.rotation.y=Math.atan2(-(state.targetX-state.x),-(state.targetY-state.y));else fly.rotation.y=0;
const moving=state.phase==='walking',lifting=state.phase==='lifting',wave=Math.sin(state.phaseTime*4);body.position.y=lifting?wave*.06:moving?Math.sin(state.time*16)*.02:0;const size=1+Math.min(state.mass-1,.8)*.35;body.scale.setScalar(size);
for(const {g,s,j}of legs){g.rotation.x=moving?Math.sin(state.time*16+j*2+s)*.3: lifting&&j===0?-.45+wave*.35:0;g.rotation.z=lifting&&j===0?-s*.25:0;}for(const [i,w] of wings.entries())w.rotation.z=(i?1:-1)*(.08+Math.sin(state.time*10)*.025);
for(let i=0;i<bars.length;i++)if(bars[i])bars[i].position.y=[1.38,.36,1.5][i]+(lifting&&state.station===i?(wave+1)*.12:0);
$('mass').textContent=state.mass.toFixed(2);$('level').textContent='LVL '+(1+Math.floor((state.mass-1)*10));$('energy').value=state.energy;$('fatigue').value=state.fatigue;$('energyText').textContent=Math.round(state.energy)+'%';$('fatigueText').textContent=Math.round(state.fatigue)+'%';$('sets').textContent=state.sets;$('reps').textContent=state.reps;$('clock').textContent=String(Math.floor(state.time/60)).padStart(2,'0')+':'+String(Math.floor(state.time%60)).padStart(2,'0');$('decision').textContent=(moving?'Heading to ':lifting?'Training: ':'Recovering after ')+names[state.station].toLowerCase();$('thought').textContent=lifting?'Small wings. Big ambitions.':moving?'Off to find the next tiny challenge.':'Even very small athletes need a break.';controls.update();renderer.render(scene,camera);}
requestAnimationFrame(animate);
