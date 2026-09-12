# MaleCNS subset attribution

Source: [MaleCNS v1.0 public data release](https://male-cns.janelia.org/download/), provided by the FlyEM Project Team at HHMI Janelia, the University of Cambridge, MRC Laboratory of Molecular Biology, and Google Research. The dataset is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Consult the release page for the associated publication and full author list.

Modifications: extracted an induced 129-neuron subnetwork around the two annotated DNa02 cells; added integer indices, selected stimulation/readout sets and signed model weights using an explicitly simplified transmitter convention. Original synapse counts are retained in `circuit.npz`. No biological endorsement of these modifications is implied.

`circuit.json` records the selected IDs, VFB cross-references, extraction method, omitted-transmitter edge count, and URLs/SHA-256 digests of the downloaded source tables. `signed` in the NPZ is a modeling interpretation, not directly measured signed synaptic strength.

The body used by the experiment comes separately from [TuragaLab/flybody](https://github.com/TuragaLab/flybody), Apache-2.0, pinned in `scripts/setup_body.sh`. Body model by the FlyBody authors, Google DeepMind and HHMI Janelia; see Vaxenburg et al., *Whole-body physics simulation of fruit fly locomotion*, Nature (2025), https://doi.org/10.1038/s41586-025-09029-4. No body meshes are redistributed here; the setup retains the upstream license. `reports/physics.jpg` is a rendered view of that model with added decorative props.
