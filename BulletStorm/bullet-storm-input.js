var BulletStormIO = BulletStormIO || {};

BulletStormIO.keyRegister = new Array();

BulletStormIO.isKeyDown = function(key)
{
	return BulletStormIO.keyRegister[key] == true;
}

BulletStormIO.onKeyDown = function(ev)
{
	BulletStormIO.keyRegister[ev.keyCode] = true;
}

BulletStormIO.onKeyUp = function(ev)
{
	BulletStormIO.keyRegister[ev.keyCode] = false;
}