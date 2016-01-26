var Player = Player || GameObject.create(vec3.fromValues(0, -10, 0), SHAPE_TRI_0, SHADER_OBJECT_0, [0.2, 0.2, 1.0, 1.0]);

Player.preUpdate = function()
{
	this.enabled = true;
}

Player.update = function()
{
	if(BulletStormIO.isKeyDown(KEY_LEFT))
	{
		vec3.add(this.pos, this.pos, vec3.fromValues(-0.1, 0, 0));
	}
	else if(BulletStormIO.isKeyDown(KEY_RIGHT))
	{
 		vec3.add(this.pos, this.pos, vec3.fromValues(0.1, 0, 0));
	}
}

Player.shoot = function()
{
	
}