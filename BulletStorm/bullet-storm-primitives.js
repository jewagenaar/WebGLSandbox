/**================================**/
/**            GAME OBJECT         **/
/**================================**/

function GameObject(pos, vertexBuffer, shader, tintColor) 
{
	this.enabled = false;
	this.destroyed = false;
	this.transparent = false;

	this.pos = vec3.clone(pos);
	this.vertexBuffer = vertexBuffer;
	this.shader = shader;
	this.tintColor = tintColor;

	this.preUpdate = function() {} 

	this.update = function() {}

	this.postUpdate = function() {}
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
		result.update = this.bulletUpdate;

		return result;
	},

	bulletUpdate: function()
	{
		vec3.add(this.pos, this.pos, this.dir);

		if(this.pos[2] < -20)
		{
			this.destroyed = true;
		}
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