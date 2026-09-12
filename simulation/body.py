"""Tethered FlyBody physics experiment; no trained locomotion or anatomical motor mapping."""
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
import mujoco

class Body:
    def __init__(self, flybody):
        assets=Path(flybody).resolve()/'flybody/fruitfly/assets'
        root=ET.parse(assets/'fruitfly.xml').getroot()
        root.find('compiler').set('meshdir',str(assets))
        thorax=root.find("worldbody/body[@name='thorax']")
        thorax.remove(thorax.find('freejoint'))  # Explicit fixed thorax for causal actuator test.
        world=root.find('worldbody')
        ET.SubElement(world,'geom',name='lab_floor',type='plane',size='2 2 .1',pos='0 0 -.18',rgba='.14 .18 .12 1')
        # Four noninteracting station props in centimetres, away from the tether.
        for name,x,y in [('bench',.6,.55),('deadlift',-.6,.55),('squat',.6,-.55),('dumbbells',-.6,-.55)]:
            ET.SubElement(world,'geom',name=name+'_platform',type='box',pos=f'{x} {y} -.165',size='.22 .16 .015',rgba='.3 .38 .22 1')
            if name in ('bench','dumbbells'):
                ET.SubElement(world,'geom',name=name+'_top',type='box',pos=f'{x} {y} -.08',size='.16 .06 .025',rgba='.6 .75 .35 1')
            if name in ('bench','squat'):
                for dx in (-.17,.17):
                    ET.SubElement(world,'geom',type='capsule',fromto=f'{x+dx} {y} -.15 {x+dx} {y} .15',size='.012',rgba='.5 .55 .45 1')
            ET.SubElement(world,'geom',name=name+'_bar',type='capsule',fromto=f'{x-.19} {y} .02 {x+.19} {y} .02',size='.012',rgba='.75 .8 .7 1')
        self.model=mujoco.MjModel.from_xml_string(ET.tostring(root,encoding='unicode'))
        self.model.opt.timestep=0.0001
        self.data=mujoco.MjData(self.model)
        self.actuators={side:mujoco.mj_name2id(self.model,mujoco.mjtObj.mjOBJ_ACTUATOR,'femur_T1_'+side) for side in ('left','right')}
        self.joints={side:mujoco.mj_name2id(self.model,mujoco.mjtObj.mjOBJ_JOINT,'femur_T1_'+side) for side in ('left','right')}
        if min(self.actuators.values())<0 or min(self.joints.values())<0:
            raise ValueError('Upstream FlyBody names changed; review integration.')
        self.data.ctrl[:]=np.clip(0,self.model.actuator_ctrlrange[:,0],self.model.actuator_ctrlrange[:,1])
        self.base=self.data.ctrl.copy();mujoco.mj_forward(self.model,self.data)
        self.command={'left':0.,'right':0.}
        self.renderer=None

    def angles(self):
        return {side:float(self.data.qpos[self.model.jnt_qposadr[j]]) for side,j in self.joints.items()}

    def step(self,rates):
        for side,a in self.actuators.items():
            # Engineered unidirectional rate-to-position adapter; not an identified synaptic path.
            target=self.base[a]+.4*np.tanh(rates[side]/60.)
            self.data.ctrl[a]=np.clip(target,*self.model.actuator_ctrlrange[a])
            self.command[side]=float(self.data.ctrl[a])
        mujoco.mj_step(self.model,self.data)
        if not np.isfinite(self.data.qpos).all() or not np.isfinite(self.data.qvel).all():
            raise RuntimeError('Non-finite physics state')

    def render(self):
        if self.renderer is None:
            self.model.vis.global_.offwidth=960;self.model.vis.global_.offheight=640
            self.renderer=mujoco.Renderer(self.model,height=640,width=960)
        camera=mujoco.MjvCamera();camera.lookat[:]=[0,0,-.02];camera.distance=1.1;camera.azimuth=135;camera.elevation=-25
        self.renderer.update_scene(self.data,camera=camera)
        return self.renderer.render()

    def close(self):
        if self.renderer is not None:self.renderer.close()
