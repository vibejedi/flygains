# From FlyGains prototype to an embodied fly simulation

Research checked 12 September 2026. This is the original implementation plan. A first tethered real-connectivity integration is now implemented and tested; see [current run instructions](run-simulation.md). The broader milestones below remain a roadmap.

## What the available resources actually provide

| Resource | Useful material | Role in FlyGains |
| --- | --- | --- |
| [MaleCNS v1.0](https://male-cns.janelia.org/download/) | Male brain and ventral nerve cord connectivity, annotations and neurotransmitter predictions | Neural wiring and cell identity |
| [Virtual Fly Brain](https://www.virtualflybrain.org/) | Anatomical references, neuron imagery and cross-dataset discovery | Find relevant circuits and keep anatomical mappings traceable |
| [FlyBody](https://github.com/TuragaLab/flybody) | Articulated MuJoCo fly model and locomotion task environments | Physics body candidate; VFB credits its homepage body to this project |
| [NeuroMechFly / FlyGym](https://neuromechfly.org/) | Body simulation, sensory feedback and locomotion controller tooling | Alternative body and sensor framework |
| [Shiu brain model](https://github.com/philshiu/Drosophila_brain_model) | Brian2 leaky integrate-and-fire model using female FlyWire data | Reference dynamics and experiments; not a ready-made MaleCNS model |

VFB's downloadable OBJ meshes, SWC neuron skeletons and NRRD images are anatomical assets. A mesh alone does not define joints, actuator forces, inertia, collision rules or sensor mappings. Its homepage's body attribution points to FlyBody; use the upstream physics package rather than extracting the homepage rendering.

FlyBody's README points to `fruitfly.xml` and `floor.xml` in its model directory and gives installation and viewer instructions. It is Apache-2.0 licensed. Preserve upstream notices when copying assets. The MuJoCo body is a different source from MaleCNS: it must not be described as the exact body of the connectome specimen.

NeuroMechFly's default anatomy comes from a female fly. If paired with MaleCNS, identify the result as a hybrid model unless sex-specific mechanics are validated. Its current experimental muscle-imitation implementation drives only the left-front leg with muscles; it is not a complete muscle-actuated six-legged athlete. See [the muscle tutorial](https://neuromechfly.org/tutorials/6_muscle_imitation/).

## Proposed implementation

1. **Acquire and freeze data.** Run the download script. Preserve source URLs, version and SHA-256 digests. Inspect actual Feather schemas before writing transforms. Keep neuron IDs exact. The full weights table includes segments beyond the curated neuron set, so join against annotations and report every filter and resulting count. Avoid assuming Codex and raw-export connection counts are identical.
2. **Establish a neural baseline.** Reproduce a published stimulation experiment in the Shiu reference model separately. Then adapt a sparse leaky integrate-and-fire implementation to MaleCNS. Document thresholds, membrane and synaptic time constants, delays, initial conditions and synaptic gain; these are model assumptions, not values supplied by the wiring map. Keep transmitter uncertainty explicit, including modulatory transmitters that cannot be reduced to a universal positive or negative sign.
3. **Run the body independently.** Install a pinned upstream FlyBody or FlyGym version and reproduce a walking example. Verify physics timestep, contacts, joint limits and forces before adding weights. Random joint actions are only an API test, not learned walking. Use a desktop or Linux simulation process first; benchmark before selecting cloud hardware.
4. **Close the sensory loop.** Map a small, documented set of sensory cells to environmental observations. Read identified descending populations to command an existing locomotion controller. Feed movement-dependent touch, taste and position signals back into the neural model. Record the exact mapping and state that the downstream controller is artificial. Never reuse female FlyWire neuron IDs as MaleCNS IDs without a verified crosswalk.
5. **Validate causal control.** Demonstrate that stimulus changes alter spikes and behavior, and that silencing chosen pathways changes those behaviors. Compare to shuffled-connectivity and controller-only baselines. Check sensitivity to timestep and neural parameters. Remove the prototype's modulo-four station selector from the real mode.
6. **Add the gym task.** Start with a grounded foreleg pushing task or resistance lever. Then introduce bars, grasp constraints and progressive loads. Bench pressing and squatting require designed or learned movement controllers; those human exercise skills will not emerge merely by loading a fly connectome. Reward and plasticity rules are engineering choices. Keep cosmetic muscle growth distinct from actuator strength, fatigue, mass and inertia.
7. **Connect the website.** Run the neural/body process separately and stream timestamped state, body transforms, spikes and metrics to the web frontend. Persist checkpoints and RNG state for continuous unattended runs. Show whether the source is demo, imported rate model, or validated spiking simulation. Avoid attributing real-time full-brain performance to body-only benchmarks.

## First meaningful target

A fly whose real MaleCNS-derived network changes its locomotion when it senses a stimulus, with movement feeding back into the network. This is a defensible milestone before autonomous lifting and growth. Exact biological emulation is not established by these components.

[Eon's embodied fly report](https://eon.systems/updates/embodied-brain-emulation) describes a related integration: a connectome-constrained model drives a body through selected descending outputs and existing motor controllers. It explicitly discusses the incomplete motor hierarchy. Treat that as evidence for the architecture, not proof that MaleCNS weightlifting is solved or that our prototype implements it.

## Access and provenance

[The official MaleCNS download page](https://male-cns.janelia.org/download/) supplies public bulk files as well as an authenticated neuPrint API route. Codex sign-in is therefore not a prerequisite for bulk acquisition. The supplied downloader uses the official public files, not scraped authenticated pages. The annotations endpoint returned HTTP 200 during this setup; the three full files have since been downloaded and inspected, and a traceable subset is bundled in `samples/mcns-dna02/`.

MaleCNS data attribution: FlyEM at HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular Biology, and Google Research. The official dataset is offered under CC-BY; consult its release page and manuscript for citation details. Our local hashes detect later changes; they are not publisher-provided authenticity checks.

Update: `simulation/` now includes a small spiking network, a tethered FlyBody adapter and a local interactive server. The browser prototype remains unchanged; free locomotion and learned lifting remain unimplemented.
