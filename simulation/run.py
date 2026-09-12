"""Run a reproducible closed-loop real-connectivity/tethered-body experiment."""
import argparse
import json
import time
from pathlib import Path
import numpy as np
from .lif import Brain
from .body import Body


def experiment(circuit, flybody, seconds=1., mode='connected', seed=7, image=None):
    brain=Brain(circuit,seed=seed,disconnected=mode=='disconnected')
    body=Body(flybody);trace=[];started=time.perf_counter()
    try:
        for k in range(round(seconds/brain.dt)):
            t=k*brain.dt
            # Synthetic stimulus applied to real upstream partners. Joint feedback modulates it.
            angles=body.angles()
            stimulus={side:float(np.clip((160 if side=='left' else 45)-30*abs(angles[side]),0,300)) if t>=.2 else 0. for side in ('left','right')}
            rates=brain.step(stimulus['left'],stimulus['right'],silenced=mode=='silenced')
            body.step(rates)
            if k%100==0:
                trace.append({'t':round(brain.time,4),'stimulus_hz':stimulus,'rates_hz':rates,'angles_rad':body.angles(),'commands':dict(body.command)})
        if image:
            from PIL import Image
            Image.fromarray(body.render()).save(image)
        return {'mode':mode,'seed':seed,'simulated_seconds':brain.time,'wall_seconds':time.perf_counter()-started,
            'dataset':brain.meta['dataset'],'neurons':len(brain.v),'edges':brain.meta['edges'],
            'readout_spikes':{side:int(brain.total[i]) for side,i in brain.meta['readouts'].items()},
            'final_angles_rad':body.angles(),'trace':trace,
            'limitations':['Tethered body; not walking or lifting','Partial MaleCNS circuit','Synthetic input and rate-to-foreleg bridge','No biological validation']}
    finally:body.close()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--circuit',required=True);p.add_argument('--flybody',required=True)
    p.add_argument('--seconds',type=float,default=1);p.add_argument('--mode',choices=['connected','disconnected','silenced'],default='connected')
    p.add_argument('--output',default='data/run.json');p.add_argument('--image');a=p.parse_args()
    if not 0<a.seconds<=60:p.error('seconds must be in (0, 60]')
    result=experiment(a.circuit,a.flybody,a.seconds,a.mode,image=a.image)
    Path(a.output).parent.mkdir(parents=True,exist_ok=True);Path(a.output).write_text(json.dumps(result,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k!='trace'},indent=2))
