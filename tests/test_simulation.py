"""Run with: python -m unittest discover -s tests -p 'test_*.py'."""
import json
import unittest
from pathlib import Path
import numpy as np
from simulation.lif import Brain

CIRCUIT=Path(__file__).resolve().parents[1]/'samples/mcns-dna02'

class BrainTests(unittest.TestCase):
    def test_real_sample_identity(self):
        b=Brain(CIRCUIT)
        self.assertEqual(len(b.v),129)
        self.assertEqual(b.meta['edges'],3813)
        self.assertEqual({b.meta['neurons'][i]['type'] for i in b.meta['readouts'].values()},{'DNa02'})
        for ids in b.meta['inputs'].values():
            self.assertTrue(set(ids).isdisjoint(b.meta['readouts'].values()))

    def test_causal_and_reproducible(self):
        active=Brain(CIRCUIT,seed=7);repeat=Brain(CIRCUIT,seed=7)
        cut=Brain(CIRCUIT,seed=7,disconnected=True)
        for _ in range(4000):
            active.step(160,45);repeat.step(160,45);cut.step(160,45)
        self.assertTrue(any(active.total[i]>0 for i in active.meta['readouts'].values()))
        self.assertTrue(all(cut.total[i]==0 for i in cut.meta['readouts'].values()))
        np.testing.assert_array_equal(active.total,repeat.total)
        np.testing.assert_array_equal(active.v,repeat.v)

    def test_silencing_and_invalid_stimulus(self):
        b=Brain(CIRCUIT)
        for _ in range(100):b.step(500,500,silenced=True)
        self.assertEqual(int(b.total.sum()),0)
        state=b.v.copy()
        for x in (-1,501,float('nan'),float('inf')):
            with self.assertRaises(ValueError):b.step(x,0)
        np.testing.assert_array_equal(b.v,state)

if __name__=='__main__':unittest.main()
