"""Extract a reproducible real-connectivity DNa02 subnetwork from MaleCNS v1.0."""
import argparse
import json
from pathlib import Path
import numpy as np
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.feather as feather
import pyarrow.ipc as ipc


def build(source, output, per_side=64):
    source, output = Path(source), Path(output)
    annotations = feather.read_table(source / 'body-annotations-male-cns-v1.0-minconf-0.5.feather').to_pandas()
    nts = feather.read_table(source / 'body-neurotransmitters-male-cns-v1.0.feather', columns=['body','consensus_nt']).to_pandas().set_index('body')
    dn = annotations[annotations['type'] == 'DNa02'].sort_values('bodyId')
    if len(dn) != 2:
        raise ValueError('Expected exactly two annotated DNa02 neurons; review dataset.')
    targets = dn.bodyId.to_numpy(dtype=np.int64)
    path = source / 'connectome-weights-male-cns-v1.0-minconf-0.5.feather'
    reader = ipc.open_file(pa.memory_map(str(path), 'r'))
    incoming = []
    for i in range(reader.num_record_batches):
        batch = reader.get_batch(i)
        selected = batch.filter(pc.is_in(batch.column('body_post'), value_set=pa.array(targets)))
        if selected.num_rows:
            incoming.append(pa.Table.from_batches([selected]).to_pandas())
    import pandas as pd
    edges = pd.concat(incoming, ignore_index=True)
    eligible = set(annotations.bodyId)
    edges = edges[edges.body_pre.isin(eligible)]
    chosen = set(int(v) for v in targets)
    for target in targets:
        chosen.update(int(v) for v in edges[edges.body_post == target].sort_values(['weight','body_pre'], ascending=[False,True]).head(per_side).body_pre)
    nodes = sorted(chosen)
    arr = pa.array(nodes, type=pa.int64())
    parts = []
    for i in range(reader.num_record_batches):
        batch = reader.get_batch(i)
        mask = pc.and_(pc.is_in(batch.column('body_pre'), value_set=arr), pc.is_in(batch.column('body_post'), value_set=arr))
        selected = batch.filter(mask)
        if selected.num_rows:
            parts.append(pa.Table.from_batches([selected]).to_pandas())
    graph = pd.concat(parts, ignore_index=True).sort_values(['body_pre','body_post'])
    # Modeling convention, not receptor-level evidence. Other transmitters are omitted.
    sign_map = {'acetylcholine': 1., 'gaba': -1., 'glutamate': -1.}
    records = []
    for body in nodes:
        row = annotations[annotations.bodyId == body].iloc[0]
        nt = nts.loc[body, 'consensus_nt'] if body in nts.index else None
        records.append({'id': str(body), 'type': None if pd.isna(row['type']) else row['type'],
                        'instance': None if pd.isna(row['instance']) else row['instance'],
                        'vfb_id': None if pd.isna(row.vfbId) else row.vfbId,
                        'transmitter': None if pd.isna(nt) else nt})
    index = {v:i for i,v in enumerate(nodes)}
    pre = graph.body_pre.map(index).to_numpy(dtype=np.int32)
    post = graph.body_post.map(index).to_numpy(dtype=np.int32)
    counts = graph.weight.to_numpy(dtype=np.float64)
    signs = np.array([sign_map.get((r['transmitter'] or '').lower(), 0.) for r in records])
    # Aggregate real synapse counts retained verbatim. Gain is applied by LIF runtime.
    signed = counts * signs[pre]
    readouts = {}
    inputs = {}
    for _, row in dn.iterrows():
        side = 'left' if row['instance'].endswith('_L') else 'right'
        target = index[int(row.bodyId)]
        readouts[side] = target
        options = np.where((post == target) & (signs[pre] > 0) & ~np.isin(pre, list(map(index.get, targets))))[0]
        options = options[np.argsort(-counts[options], kind='stable')][:8]
        if not len(options):
            raise ValueError('No excitatory upstream inputs found.')
        inputs[side] = sorted(set(int(v) for v in pre[options]))
    output.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(output / 'circuit.npz', pre=pre, post=post, counts=counts, signed=signed)
    manifest = json.loads((source / 'manifest.json').read_text())
    metadata = {'dataset':'male-cns:v1.0', 'neurons':records, 'readouts':readouts, 'inputs':inputs,
        'edges':len(pre), 'omitted_transmitter_edges':int((signed == 0).sum()),
        'source_files':manifest['files'], 'selection':f'Top {per_side} annotated incoming partners per DNa02 plus both DNa02, induced subgraph.',
        'limitations':['Partial circuit, not whole brain', 'ACh excitatory; GABA and glutamate inhibitory by modeling convention; other transmitters omitted',
            'Stimulated upstream partners are not asserted to be sensory neurons', 'DNa02-to-foreleg actuation is an artificial test bridge, not a biological motor mapping']}
    (output / 'circuit.json').write_text(json.dumps(metadata, indent=2))
    print(json.dumps({'neurons':len(nodes),'edges':len(pre),'readouts':readouts,'inputs':inputs}))

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('--data',required=True);p.add_argument('--output',default='data/circuit');p.add_argument('--per-side',type=int,default=64)
    a=p.parse_args();build(a.data,a.output,a.per_side)
