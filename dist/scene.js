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
// Flat turf over a faceted rock island; foliage stays outside the walking area.
const stone=mat('#899181'),moss=mat('#829d55'),grass=mat('#a8bd75'),brass=mat('#c6a765',{metalness:.3});
box(scene,0,-1.05,0,100,.2,100,mat('#c5d8a6'));
const foundation=mesh(new T.CylinderGeometry(1, .86, .85, 12),stone,scene,0,-.39,0);foundation.scale.set(6.9,1,5.2);
const turf=mesh(new T.CylinderGeometry(1,1,.13,12),grass,scene,0,.055,0);turf.scale.set(6.85,1,5.15);
for(let i=0;i<30;i++){const a=i/30*Math.PI*2;orb(scene,Math.cos(a)*6.25,-.34,Math.sin(a)*4.65,.58,.38,.45,stone,0);if(i%3===0)orb(scene,Math.cos(a)*6.25,-.02,Math.sin(a)*4.65,.5,.12,.35,moss,0);}
// Flush stone paths give all six feet continuous support.
box(scene,0,.128,0,10,.014,1.6,cream);
for(const [x,z]of positions)box(scene,x,.129,z/2,1.6,.014,Math.abs(z)+.1,cream);
for(let i=0;i<46;i++){const a=i*2.39996,x=Math.cos(a)*(5.7+(i%4)*.12),z=Math.sin(a)*(4.1+(i%3)*.14);for(let j=0;j<3;j++){const blade=mesh(new T.ConeGeometry(.055,.25+(j%2)*.13,3),moss,scene,x+j*.07,.2,z);blade.rotation.z=(j-1)*.2;}}
function label(text,x,z){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=64;const ctx=canvas.getContext('2d');ctx.font='24px monospace';ctx.textAlign='center';ctx.fillStyle='#425b36';ctx.fillText(text,384,42);const tex=new T.CanvasTexture(canvas);const o=mesh(new T.PlaneGeometry(2.6,.25),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),scene,x,.15,z);o.rotation.x=-Math.PI/2;}
function barbell(p,y,z=-.59){const g=new T.Group();g.position.set(0,y,z);p.add(g);rod(g,[-.68,0,0],[.68,0,0],.025,metal);for(const side of [-1,1]){const plate=mesh(new T.CylinderGeometry(.14,.14,.1,10),rubber,g,side*.58,0,0);plate.rotation.z=Math.PI/2;const ring=mesh(new T.TorusGeometry(.075,.012,5,12),brass,g,side*.22,0,.04);ring.rotation.y=Math.PI/2;}return g}
const bars=[],barHeights=[.68,.34,.84,.38];
positions.forEach(([x,z],i)=>{const g=new T.Group();g.position.set(x,.14,z);scene.add(g);
box(g,0,0,0,2.6,.02,2.5,i===1?wood:mat('#becb98'));
label(['01 / THORAX BENCH','02 / LOW LIFT','03 / SIX-LEG SQUAT','04 / TARSAL CURLS'][i],x,z+1.4);
// Four rear-foot pads leave the front pair free to use the grips.
for(const sx of [-.54,.54])for(const zz of [-.02,.42]){const pad=mesh(new T.CylinderGeometry(.14,.14,.012,10),dark,g,sx,.018,zz);}
if(i===0){
// Narrow sternum support ends before the abdomen, with lateral leg clearance.
box(g,0,.27,-.13,.27,.09,.47,dark);box(g,0,.13,-.13,.12,.26,.17,green);
for(const xx of [-.77,.77]){box(g,xx,.36,-.59,.06,.72,.06,green);box(g,xx,.035,-.59,.22,.05,.35,green);}bars[i]=barbell(g,barHeights[i]);}
if(i===1){for(const xx of [-.65,.65])box(g,xx,.07,-.59,.32,.12,.35,rubber);bars[i]=barbell(g,barHeights[i]);}
if(i===2){
// Open rear entry; side uprights sit outside the fly's spread legs and wings.
for(const xx of [-.88,.88]){box(g,xx,.56,-.65,.08,1.12,.08,green);box(g,xx,.035,0,.14,.05,1.65,green);rod(g,[xx,.48,-.7],[xx,.48,.2],.025,metal);}
rod(g,[-.88,1.13,-.65],[.88,1.13,-.65],.035,brass);bars[i]=barbell(g,barHeights[i]);}
if(i===3){
// Single low shelf behind the lifting area; no human-height storage tiers.
box(g,0,.13,-1.02,1.7,.06,.3,green);for(const xx of [-.65,.65])box(g,xx,.065,-1.02,.08,.13,.25,green);
for(const xx of [-.58,0,.58]){rod(g,[xx-.12,.24,-1.02],[xx+.12,.24,-1.02],.02,metal);for(const dx of [-.14,.14])orb(g,xx+dx,.24,-1.02,.07,.08,.08,dark,0);}
bars[i]=new T.Group();bars[i].position.set(0,barHeights[i],-.59);g.add(bars[i]);for(const side of [-1,1]){const xx=side*.22;rod(bars[i],[xx,0,-.13],[xx,0,.13],.022,metal);for(const zz of [-.15,.15])orb(bars[i],xx,0,zz,.08,.08,.07,dark,0);}}
});
label('MOSS & MUSCLE / EST. VERY RECENTLY',0,3.85);
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
function poseRod(o,a,b){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);o.position.copy(av.add(bv).multiplyScalar(.5));o.scale.y=v.length()/o.geometry.parameters.height;o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());}
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(!paused){let remaining=dt*speed;while(remaining>0){const d=Math.min(remaining,1/60);step(state,d,net,m=>$('event').textContent=m);remaining-=d;}}
fly.position.set(state.x,.14,state.y);if(state.phase==='walking'){const [tx,tz]=state.route?.[0]??[state.targetX,state.targetY];fly.rotation.y=Math.atan2(-(tx-state.x),-(tz-state.y));}else fly.rotation.y=0;
const moving=state.phase==='walking',lifting=state.phase==='lifting',wave=Math.sin(state.phaseTime*4);body.position.y=moving?Math.sin(state.time*16)*.012:0;body.scale.setScalar(1);
for(let i=0;i<bars.length;i++)bars[i].position.y=barHeights[i]+(lifting&&state.station===i?(wave+1)*.07:0);
for(const {g,s,j}of legs){g.rotation.set(moving?Math.sin(state.time*16+j*2+s)*.22:0,0,0);
const elbow=[s*.3,-.2,(j-1)*.15],ankle=[s*.36,-.57,(j-1)*.25],foot=[s*.46,-.59,(j-1)*.25-.08];
if(lifting&&j===0){const height=bars[state.station].position.y-.62;elbow.splice(0,3,s*.2,height*.5,-.2);ankle.splice(0,3,s*.04,height,-.33);foot.splice(0,3,s*.04,height,-.38);}
poseRod(g.children[0],[0,0,0],elbow);poseRod(g.children[1],elbow,ankle);poseRod(g.children[2],ankle,foot);}
for(const [i,w] of wings.entries())w.rotation.z=(i?1:-1)*(.08+Math.sin(state.time*10)*.025);
$('mass').textContent=state.mass.toFixed(2);$('level').textContent='LVL '+(1+Math.floor((state.mass-1)*10));$('energy').value=state.energy;$('fatigue').value=state.fatigue;$('energyText').textContent=Math.round(state.energy)+'%';$('fatigueText').textContent=Math.round(state.fatigue)+'%';$('sets').textContent=state.sets;$('reps').textContent=state.reps;$('clock').textContent=String(Math.floor(state.time/60)).padStart(2,'0')+':'+String(Math.floor(state.time%60)).padStart(2,'0');$('decision').textContent=(moving?'Heading to ':lifting?'Training: ':'Recovering after ')+names[state.station].toLowerCase();$('thought').textContent=lifting?'Small wings. Big ambitions.':moving?'Off to find the next tiny challenge.':'Even very small athletes need a break.';controls.update();renderer.render(scene,camera);}
requestAnimationFrame(animate);
