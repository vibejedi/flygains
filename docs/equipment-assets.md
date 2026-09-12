# Creating custom gym equipment

You can design the equipment in Blender, Maya or another 3D package. The current experiment includes only static placeholder props; a GLB importer and lifting interactions are not implemented yet.

## Visual deliverable

Export one GLB/glTF 2.0 asset per station for a future web renderer. Include the editable source file. Use real-world metres in your authoring scene, applied transforms, and document dimensions. We will scale equipment down for the fly; do not arbitrarily scale the body to human size.

Keep moving pieces separate: bar, left plate, right plate, bench pad and rack frame. Put pivots at the relevant joint/rotation centres. Place the assembly origin at ground centre. Bake textures, use PBR materials, avoid external texture paths, and keep texture resolution and polygon count modest. As an initial budget, aim for fewer than 50,000 triangles per station and 1–2K textures; these are project targets, not physics-engine limits.

## Physics deliverable

Supply simple collision proxies made from boxes, cylinders/capsules or convex mesh pieces. A squat rack needs separate posts and crossbars: one convex hull can fill the opening and prevent the fly from entering. For custom MuJoCo mesh geometry, export OBJ or STL alongside the GLB; GLB is the visual exchange format, not a direct MJCF input here.

Give each moving rigid body an intended mass, dimensions, pivot, range of movement and gripping location. We will define MJCF joints, friction, inertia, force limits and grasp constraints explicitly. Detailed appearances do not automatically provide correct physics or lifting behavior.

The pinned FlyBody model uses centimetres, grams and seconds (CGS), including gravity 981 cm/s². Convert metre-authored assets by 100 before any additional deliberate miniature scaling. Use consistent mass/inertia units; do not mix kilograms into a gram-based scene. See the [MuJoCo modeling reference](https://mujoco.readthedocs.io/en/stable/XMLreference.html).

Suggested filenames: bench.glb, deadlift-platform.glb, squat-rack.glb, dumbbell-rack.glb; keep a matching collision OBJ and a dimensions/mass note for each. Body parts that must move independently should have distinct, stable names.
