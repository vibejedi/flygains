"""Sparse current-based LIF experiment. Parameters are assumptions, not fitted physiology."""
import json
from pathlib import Path
import numpy as np
from scipy.sparse import csr_matrix

class Brain:
    dt = 0.0001
    def __init__(self, circuit, seed=7, disconnected=False):
        p=Path(circuit)
        self.meta=json.loads((p/'circuit.json').read_text())
        with np.load(p/'circuit.npz', allow_pickle=False) as z:
            n=len(self.meta['neurons'])
            # The scalar 0.12 converts counted synapses to model current units.
            self.weights=csr_matrix((z['signed']*.12,(z['post'],z['pre'])), shape=(n,n))
        if disconnected:
            self.weights.data[:]=0
        self.v=np.zeros(n);self.current=np.zeros(n);self.refractory=np.zeros(n)
        self.rates=np.zeros(n);self.total=np.zeros(n,dtype=np.int64)
        self.rng=np.random.default_rng(seed);self.time=0

    def step(self, left_hz, right_hz, silenced=False):
        if not all(np.isfinite(x) and 0<=x<=500 for x in (left_hz,right_hz)):
            raise ValueError('Stimulus must be finite and between 0 and 500 Hz.')
        drive=np.zeros(len(self.v))
        for side,hz in [('left',left_hz),('right',right_hz)]:
            ids=self.meta['inputs'][side]
            drive[ids] += (self.rng.random(len(ids)) < hz*self.dt)*1.3
        self.current *= np.exp(-self.dt/.005)
        self.refractory=np.maximum(0,self.refractory-self.dt)
        self.v += self.dt/.020*(-self.v+self.current)+drive
        self.v[self.refractory>0]=0
        spikes=self.v>=1
        if silenced:
            spikes[:]=False;self.v[:]=0;self.current[:]=0
        self.v[spikes]=0;self.refractory[spikes]=.002
        self.current += self.weights@spikes.astype(float)
        self.rates=self.rates*np.exp(-self.dt/.050)+spikes/.050
        self.total += spikes;self.time += self.dt
        return {side:float(self.rates[i]) for side,i in self.meta['readouts'].items()}
