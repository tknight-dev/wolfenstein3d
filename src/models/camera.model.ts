/**
 * @author tknight-dev
 */

/**
 * Postions in terms of C
 */
export interface Camera {
	r: number; // float: rotation in degrees
	x: number; // int
	xRelative: number; // float
	y: number; // int
	yRelative: number; // float
	z: number; // float: zoom
}

export const CameraDecode = (camera: Float32Array): Camera => {
	return {
		r: camera[0],
		x: camera[1] | 0,
		xRelative: camera[2],
		y: camera[3] | 0,
		yRelative: camera[4],
		z: camera[5],
	};
};

export const CameraEncode = (camera: Camera): Float32Array => {
	return Float32Array.from([camera.r, camera.x, camera.xRelative, camera.y, camera.yRelative, camera.z]);
};

export const CameraInvertXY = (camera: Float32Array): Camera => {
	return {
		r: camera[0],
		x: camera[1] | 0,
		xRelative: camera[2],
		y: camera[3] | 0,
		yRelative: camera[4],
		z: camera[5],
	};
};
