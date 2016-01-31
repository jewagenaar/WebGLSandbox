/**================================**/
/**              PLAYER            **/
/**================================**/

var Player = Player || new GameObject(vec3.fromValues(0, -10, 0), SHAPE_TRI_0, SHADER_OBJECT_0, [0.2, 0.2, 1.0, 1.0]);

Player.lastFireTime = 0;
Player.lastWeaponChange = 0;
Player.currentWeapon = WEAPON_DEFAULT;
Player.specialWeaponGO = null;

Player.init = function()
{	
	this.createSpecialWeaponGO();
	this.enabled = true;
}

Player.cleanup = function()
{
	this.specialWeaponGO.destroy = true;
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
	
	if(BulletStormIO.isKeyDown(KEY_SHIFT))
	{
		this.changeWeapons();
	}

	this.specialWeaponGO.enabled = false;

	if(BulletStormIO.isKeyDown(KEY_SPACE))
	{
		this.shoot();
	}
}

Player.changeWeapons = function()
{
	var t = Date.now();
	
	if(t - this.lastWeaponChange > WEAPON_SWAP_RATE)
	{
		this.currentWeapon = (this.currentWeapon + 1) % 2;
		this.lastWeaponChange = t;
	}
}

Player.shoot = function()
{
	var t = Date.now();

	switch(this.currentWeapon)
	{
		case WEAPON_DEFAULT:
			this.shootNormal(t);
			break;
		case WEAPON_SPECIAL:
			this.shootSpecial(t);
			break;
		default:
			break;
	}
}

Player.shootNormal = function(t)
{
	if(t - this.lastFireTime > FIRE_RATE)
	{
		var p = vec3.clone(this.pos);
		p[2] = p[2] - 0.75;

		var b = BulletManager.createBullet(p, vec3.fromValues(0, 0, -0.1), SHADER_BULLET_0, [1.0, 0.0, 1.0, 1.0]);

		b.enabled = true;

		Scene.gameObjects.push(b);

		this.lastFireTime = t;
	}
}

Player.shootSpecial = function(t)
{
	this.specialWeaponGO.enabled = true;		
}

Player.createSpecialWeaponGO = function()
{
	this.specialWeaponGO = new GameObject(this.pos, SHAPE_SQR_0, SHADER_SPECIAL_0, [1.0, 1.0, 1.0, 1.0]);
	this.specialWeaponGO.scale = vec3.fromValues(1.0, 1.0, 30.0);
	
	this.specialWeaponGO.update = function()
	{
		this.pos = Player.pos;
	}

	this.specialWeaponGO.preRender = function(webGLContext, shader, deltaTime)
	{
		webGLContext.uniform1f(shader.time, deltaTime);
	}

	Scene.gameObjects.push(this.specialWeaponGO);
}

