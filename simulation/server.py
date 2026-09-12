"""Local-only interactive lab. Run: python -m simulation.server --help."""
import argparse
import io
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from PIL import Image
import numpy as np
from .lif import Brain
from .body import Body

class Lab:
    def __init__(self,circuit,flybody):
        self.circuit=circuit;self.flybody=flybody;self.lock=threading.Lock();self.stop=threading.Event()
        self.settings={'paused':False,'left_hz':160.,'right_hz':45.,'feedback':True,'disconnected':False}
        self.reset=True;self.png=None;self.state={'status':'starting'}
        self.thread=threading.Thread(target=self.run,daemon=True);self.thread.start()

    def run(self):
        body=None
        try:
            while not self.stop.is_set():
                with self.lock:
                    config=dict(self.settings);reset=self.reset;self.reset=False
                if reset:
                    if body:body.close()
                    body=Body(self.flybody);brain=Brain(self.circuit,disconnected=config['disconnected'])
                if not config['paused']:
                    for _ in range(500):
                        angles=body.angles()
                        rates={side:float(np.clip(config[side+'_hz']-(30*abs(angles[side]) if config['feedback'] else 0),0,500)) for side in ('left','right')}
                        output=brain.step(rates['left'],rates['right']);body.step(output)
                image=io.BytesIO();Image.fromarray(body.render()).save(image,format='PNG')
                state={'status':'running','time':brain.time,'dataset':brain.meta['dataset'],'neurons':len(brain.v),'edges':brain.meta['edges'],
                    'rates_hz':{side:float(brain.rates[i]) for side,i in brain.meta['readouts'].items()},
                    'angles_rad':body.angles(),'commands':dict(body.command),'settings':config,
                    'readout_spikes':{side:int(brain.total[i]) for side,i in brain.meta['readouts'].items()}}
                with self.lock:self.png=image.getvalue();self.state=state
                self.stop.wait(.03 if not config['paused'] else .2)
        except Exception as exc:
            with self.lock:self.state={'status':'error','message':str(exc)}
        finally:
            if body:body.close()

    def control(self,values):
        if not isinstance(values,dict) or not values or set(values)-{'paused','left_hz','right_hz','feedback','disconnected','reset'}:
            raise ValueError('Unknown or empty control object')
        for key,value in values.items():
            if key.endswith('_hz'):
                if type(value) not in (float,int) or not np.isfinite(value) or not 0<=value<=500:raise ValueError('Rates must be 0–500 Hz')
            elif type(value) is not bool:raise ValueError('Expected boolean')
        with self.lock:
            if values.get('reset') or ('disconnected' in values and values['disconnected']!=self.settings['disconnected']):self.reset=True
            self.settings.update({k:v for k,v in values.items() if k!='reset'})
            return dict(self.settings)


def make_handler(lab,port):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def send(self,body,content_type='application/json',status=200):
            self.send_response(status);self.send_header('Content-Type',content_type);self.send_header('Content-Length',str(len(body)))
            self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
        def do_GET(self):
            path=self.path.split('?')[0]
            if path=='/':return self.send(Path(__file__).with_name('lab.html').read_bytes(),'text/html; charset=utf-8')
            with lab.lock:
                if path=='/state':return self.send(json.dumps(lab.state).encode())
                if path=='/frame.png' and lab.png:return self.send(lab.png,'image/png')
            self.send(b'{"error":"Not available"}',status=404)
        def do_POST(self):
            if self.path!='/control':return self.send(b'{}',status=404)
            # Binding and origin/host checks protect the unauthenticated local control endpoint.
            allowed={f'127.0.0.1:{port}',f'localhost:{port}'}
            if self.headers.get('Host') not in allowed or self.headers.get('Origin') not in {f'http://{h}' for h in allowed}:
                return self.send(b'{"error":"Same-origin requests only"}',status=403)
            try:
                size=int(self.headers.get('Content-Length','0'))
                if not 0<size<=2048:raise ValueError('Invalid request size')
                values=json.loads(self.rfile.read(size));result=lab.control(values)
                self.send(json.dumps(result).encode())
            except (ValueError,TypeError) as exc:self.send(json.dumps({'error':str(exc)}).encode(),status=400)
    return Handler

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--circuit',required=True);p.add_argument('--flybody',required=True);p.add_argument('--port',type=int,default=8765)
    a=p.parse_args();lab=Lab(a.circuit,a.flybody);server=ThreadingHTTPServer(('127.0.0.1',a.port),make_handler(lab,a.port))
    print(f'Open http://127.0.0.1:{a.port} — local experiment; no public deployment.',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:lab.stop.set();server.server_close();lab.thread.join(timeout=10)
