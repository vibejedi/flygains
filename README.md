# FlyGains

A tiny autonomous fly gym, with a roadmap toward a real connectome-driven embodied simulation.

**Current status:** the web app is a synthetic-controller prototype. It does not emulate the male fly brain, run MuJoCo, or train a learning policy. Imported connections influence a simplified recurrent model; they do not establish biological fidelity.

## Run the web prototype

Requires Python 3 to serve files, and Node.js for the model tests. No npm install or build needed.

```sh
python -m http.server 8000 --directory dist
node tests/model.test.mjs
```

Open http://localhost:8000. Four workout stations, animated fly, fatigue, recovery, speed controls and fictional muscle gains are included. Training runs while the page is active; state resets on reload.

## Real brain and body

See [the implementation guide](docs/embodied-fly.md) for verified data sources, body models, engineering milestones, and what remains unimplemented.

Public MaleCNS v1.0 files can be obtained without a Codex account:

```sh
python scripts/download_mcns.py --output data/mcns
```

This downloads approximately 1.2 GB, including connectivity, cell annotations and neurotransmitter predictions. It records SHA-256 digests and source URLs. Raw data is not committed to this repository. A successful download does not by itself create a neural simulation.

## Browser graph import

The model dialog accepts JSON with `source` set to `MCNS v1.0`, a `neurons` array of unique string IDs, and an `edges` array containing `pre`, `post`, and finite signed `weight`. Limits: 5,000 neurons, 50,000 edges, 8 MB. Do not convert full-brain data to browser JSON. Use sparse arrays in a separate simulation process for larger graphs.

Input provenance is user-declared. Incoming absolute weights are normalized per neuron; leaky tanh activity has artificial energy, fatigue and time inputs. Index-modulo-four readouts and station novelty determine exercise choice. These readouts are not identified motor circuits. The 24-dot brain panel is illustrative. Neurotransmitter predictions require a stated interpretation; synapse counts alone do not determine inhibitory sign.

## Validation

Model tests cover all-station autonomous activity, energy and fatigue bounds, rep accounting, graph validation and normalization. Browser visual QA and live WebMCP execution have not been performed. Full MCNS downloads and brain/body integration have not been run.
