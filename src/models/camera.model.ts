/**
 * @author tknight-dev
 */

/**
 * Postions in terms of C
 */
export interface Camera {
	r: number; // float: rotation in radians
	x: number; // float
	y: number; // float
	z: number; // float: zoom
}

export const CameraDecode = (camera: Float32Array): Camera => {
	return {
		r: camera[0],
		x: camera[1],
		y: camera[2],
		z: camera[3],
	};
};

export const CameraEncode = (camera: Camera): Float32Array => {
	return Float32Array.from([camera.r, camera.x, camera.y, camera.z]);
};
