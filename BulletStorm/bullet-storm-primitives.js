/**================================**/
/**            GAME OBJECT         **/
/**================================**/

function GameObject(pos, vertexBuffer, shader, tintColor) 
{
	this.enabled = false;
	this.destroyed = false;
	this.transparent = false;

	this.pos = vec3.clone(pos);
	this.scale = vec3.fromValues(1.0, 1.0, 1.0);	
	this.rotation = vec3.fromValues(0.0, 0.0, 0.0);

	this.vertexBuffer = vertexBuffer;
	this.shader = shader;
	this.tintColor = tintColor;

	this.init = function() {}

	this.update = function() {}

	this.preRender = function(webGLContext, shader, deltaTime) {}

	this.cleanup = function() {}
}

/**================================**/
/**            BULLETS             **/
/**================================**/

var BulletManager = {

	nextId: 0,

	activeBullets: new Array(),

	bulletPool: new Array(),

	update: function()
	{
		for(var i = this.activeBullets.length - 1; i >= 0; --i)
		{
			var b = this.activeBullets[i];

			if(b.destroyed)
			{
				this.activeBullets.splice(i, 1);

				if(this.bulletPool.length < 100)
				{
					this.bulletPool.push(b);
				}				
			}
		}
	},

	createBullet: function(pos, dir, shader, tintColor)
	{
		var result;

		if(this.bulletPool.length == 0)
		{
			result = new GameObject(pos, SHAPE_SQR_0, shader, tintColor);
		}
		else
		{
			result.pos = vec3.clone(pos);
			result.shader = shader;
		}
		
		result.transparent = true;
		result.dir = vec3.clone(dir);
		result.update = _bulletUpdate;
		result.scale = vec3.fromValues(0.25, 0.25, 0.25);

		return result;
	}
}

// the GameObject.update function used by bullets
//
function _bulletUpdate()
{
	vec3.add(this.pos, this.pos, this.dir);

	if(this.pos[2] < -BULLET_TRAVEL_DIST)
	{
		this.destroyed = true;
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