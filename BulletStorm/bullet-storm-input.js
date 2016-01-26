const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;

var BulletStormIO = BulletStormIO || {};

BulletStormIO.keyRegister = new Map();

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