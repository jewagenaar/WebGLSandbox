var BulletStorm = BulletStorm || {};

BulletStorm.run = function()
{
	BulletStormEngine.init();

	BulletStorm.setupScene();

	BulletStormEngine.mainLoop();
}

BulletStorm.setupScene = function()
{
	BulletStormEngine.loadResources();

 	var go1 = Player;

 	Scene.gameObjects.push(go1);

 	var go2 = EnemyManager.create();

 	Scene.gameObjects.push(go2);
}