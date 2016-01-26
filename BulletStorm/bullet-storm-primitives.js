/**================================**/
/**            GAME OBJECT         **/
/**================================**/

var GameObject = {

	enabled: false,

	destroyed: false,

	pos: vec3.fromValues(0, -10, 0),

	shader: 0,

	vertexBuffer: 0,

	tintColor: [1.0, 1.0, 1.0, 1.0],

	transparent: false,

	create: function(pos, vertexBuffer, shader, tintColor)
	{
		var result = Object.create(GameObject);

		result.pos = pos;
		result.vertexBuffer = vertexBuffer;
		result.shader = shader;
		result.tintColor = tintColor;

		return result;
	},

	preUpdate: function() {}, 

	update: function() {},

	postUpdate: function() {}
}

/**================================**/
/**            PARTICLE            **/
/**================================**/

var ParticleManager = {

	createParticle : function(pos, shader, tintColor)
	{
		var result = GameObject.create(pos, SHAPE_SQR_0, shader, tintColor);

		cache.push(result);

		return result;
	}
}

/**================================**/
/**           SCENE OBJECT         **/
/**================================**/

var Scene = {

	gameObjects: [],

	camera: {
		eyePos: vec3.fromValues(0, 5, 0),
		lookAtPos: vec3.fromValues(0, -1.0, -3),
		upVector: vec3.fromValues(0, 0, -1)
	}
}