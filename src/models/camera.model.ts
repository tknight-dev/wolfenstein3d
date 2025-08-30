/**
 * @author tknight-dev
 */

/**
 * Postions in terms of C
 */
export interface Camera {
	fov: number; // float: field of view in radian
	r: number; // float: rotation in radians
	x: number; // int
	y: number; // int
	z: number; // float: zoom
}

export const CameraDecode = (camera: Float32Array): Camera => {
	return {
		fov: camera[0],
		r: camera[1],
		x: camera[2] | 0,
		y: camera[3] | 0,
		z: camera[4],
	};
};

export const CameraEncode = (camera: Camera): Float32Array => {
	return Float32Array.from([camera.fov, camera.r, camera.x, camera.y, camera.z]);
};
