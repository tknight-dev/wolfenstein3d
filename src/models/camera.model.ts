/**
 * @author tknight-dev
 */

/**
 * Postions in terms of C
 */
export interface Camera {
	rDeg: number; // float: rotation in degrees
	rRad: number; // float: rotation in radians
	x: number; // int
	xRelative: number; // float
	y: number; // int
	yRelative: number; // float
	z: number; // float: zoom
}

export const CameraDecode = (camera: Float32Array): Camera => {
	return {
		rDeg: camera[0],
		rRad: camera[1],
		x: camera[2] | 0,
		xRelative: camera[3],
		y: camera[4] | 0,
		yRelative: camera[5],
		z: camera[6],
	};
};

export const CameraEncode = (camera: Camera): Float32Array => {
	return Float32Array.from([camera.rDeg, camera.rRad, camera.x, camera.xRelative, camera.y, camera.yRelative, camera.z]);
};
