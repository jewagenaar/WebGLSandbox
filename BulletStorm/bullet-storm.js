/**     BULLET STORM namespace     **/

var BulletStorm = BulletStorm || {};

/**================================**/
/**           !! GLOBALS !!        **/
/**================================**/ 

const FSIZE = Float32Array.BYTES_PER_ELEMENT;

var g_WebGL;

var g_ModelMatrix = mat4.create();
var g_ViewMatrix = mat4.create();
var g_ProjectionMatrix = mat4.create();

var g_StartTime = Date.now();

var g_ShaderCache = new Array();
var g_BufferCache = new Array();

/**================================**/
/**    >>> SETUP & RUN GAME >>>    **/
/**================================**/

BulletStorm.initInputSystem = function()
{
	document.onkeydown = BulletStormIO.onKeyDown;
	document.onkeyup = BulletStormIO.onKeyUp;
}

BulletStorm.init = function()	
{
	BulletStorm.initInputSystem();
	BulletStorm.setupScene();
}

BulletStorm.mainLoop = function()
{
	BulletStorm.updateScene();
	BulletStorm.drawScene();

	requestAnimationFrame(BulletStorm.mainLoop);
}

BulletStorm.updateScene = function()
{
	for(var i = 0; i < Scene.gameObjects.length; i++)
    {
		var go = Scene.gameObjects[i];

		go.preUpdate();

		if(go.enabled)
		{
			go.update();
		}		

		go.postUpdate();
	}
}

BulletStorm.run = function()
{
	g_WebGL = GL.getWebGLContext();
	g_WebGL.blendFunc(g_WebGL.SRC_ALPHA, g_WebGL.ONE);

	BulletStorm.init();

	BulletStorm.mainLoop();
}

BulletStorm.loadResources = function()
{
	g_BackgroundBuffer = createBackgroundBuffer();
 	g_BackgroundShader = createBackgroundShader();

 	var buffer = createTriangleVertexBuffer();
 	g_BufferCache[SHAPE_TRI_0] = buffer;

 	var shader = createObjectShader();
 	g_ShaderCache[SHADER_OBJECT_0] = shader;
}

BulletStorm.setupScene = function()
{
	BulletStorm.loadResources();

 	var go1 = Player;

 	Scene.gameObjects.push(go1);
}

// -------------------------------- //
// ~~~~    Drawing Functions   ~~~~ //
// -------------------------------- //

function drawBackground()
{
	mat4.ortho(g_ProjectionMatrix, -1, 1, -1, 1, 0.1, 1000.0);    

   	var time = (Date.now() - g_StartTime) / 1000.0;

   	g_WebGL.useProgram(g_BackgroundShader);

	g_WebGL.uniform1f(g_BackgroundShader.time, time);
	g_WebGL.uniform2f(g_BackgroundShader.resolution, g_WebGL.viewportWidth, g_WebGL.viewportHeight);
	g_WebGL.uniform1f(g_BackgroundShader.accel, 10.0);

    g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, g_BackgroundBuffer);
    g_WebGL.enableVertexAttribArray(g_BackgroundShader.vertexPositionAttribute);
    g_WebGL.vertexAttribPointer(g_BackgroundShader.vertexPositionAttribute, 3, g_WebGL.FLOAT, false, 0, 0);
    g_WebGL.drawArrays(g_WebGL.TRIANGLE_FAN, 0, g_BackgroundBuffer.numItems);
}

function drawObjects()
{
	// setup the view and project matrices
	var cam = Scene.camera;

	mat4.lookAt(g_ViewMatrix, cam.eyePos, cam.lookAtPos, cam.upVector); 
	mat4.perspective(g_ProjectionMatrix, 45, g_WebGL.viewportWidth / g_WebGL.viewportHeight, 0.1, 100.0);

    // draw all objects in the scene
    for(var i = 0; i < Scene.gameObjects.length; i++)
    {
		var go = Scene.gameObjects[i];

		if(go.enabled)
		{
			BulletStorm.drawGameObject(go);
		}
    }
}

BulletStorm.drawGameObject = function(go)
{
	var shader = g_ShaderCache[go.shader];
	var vertexBuffer = g_BufferCache[go.vertexBuffer];

	mat4.identity(g_ModelMatrix);
	mat4.translate(g_ModelMatrix, g_ModelMatrix, go.pos);	

	g_WebGL.useProgram(shader);

	if(go.tranparent)
	{
		g_WebGL.disable(g_WebGL.DEPTH_TEST);
		g_WebGL.enable(g_WebGL.BLEND);
	}
	
	g_WebGL.uniformMatrix4fv(shader.viewMatrixUniform, false, g_ViewMatrix);		
	g_WebGL.uniformMatrix4fv(shader.projectionMatrixUniform, false, g_ProjectionMatrix);
	g_WebGL.uniformMatrix4fv(shader.modelMatrixUniform, false, g_ModelMatrix);
	g_WebGL.uniform4fv(shader.tintColor, go.tintColor);

	g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, vertexBuffer);
	g_WebGL.enableVertexAttribArray(shader.vertexPositionAttribute);
	g_WebGL.vertexAttribPointer(shader.vertexPositionAttribute, 3, g_WebGL.FLOAT, false, 5 * FSIZE, 0);
	
	g_WebGL.enableVertexAttribArray(shader.textureCoordinateAttribute);
	g_WebGL.vertexAttribPointer(shader.textureCoordinateAttribute, 2, g_WebGL.FLOAT, false, 5 * FSIZE, 3 * FSIZE);

	g_WebGL.drawArrays(g_WebGL.TRIANGLE_FAN, 0, vertexBuffer.numItems);

	if(go.tranparent)
	{
		g_WebGL.enable(g_WebGL.DEPTH_TEST);
		g_WebGL.disable(g_WebGL.BLEND);
	}
}

BulletStorm.drawScene = function()
{
	g_WebGL.viewport(0, 0, g_WebGL.viewportWidth, g_WebGL.viewportHeight);
	g_WebGL.clear(g_WebGL.COLOR_BUFFER_BIT, g_WebGL.DEPTH_BUFFER_BIT);

	drawBackground();
	drawObjects();
}

// -------------------------------- //
// ~~~~   GL Setup Functions   ~~~~ //
// -------------------------------- //

function createTriangleVertexBuffer() 
{
	var result = g_WebGL.createBuffer();
	g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, result);

	var vertices = [
	    /*  position  */  /*  uvs  */ 
	     0.0,  0.0, -1.0, 0.5, 1.0,
	    -1.0,  0.0,  1.0, 0.0, 0.0,
	     1.0,  0.0,  1.0, 1.1, 0.0
	];

	g_WebGL.bufferData(g_WebGL.ARRAY_BUFFER, new Float32Array(vertices), g_WebGL.STATIC_DRAW);
	
	result.itemSize = 5;
	result.numItems = 3;

	return result;
}

function createSquareVertexBuffer()
{
	var result = g_WebGL.createBuffer();
	g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, result);

	var vertices = [
	    /* pos: */ 1.0,  0.0, -1.0, /* uv: */  1.0, 1.0,
	              -1.0,  0.0, -1.0,            0.0, 1.0,
	              -1.0,  0.0,  1.0,            0.0, 0.0,
	               1.0,  0.0,  1.0,            1.0, 0.0
	];

	g_WebGL.bufferData(g_WebGL.ARRAY_BUFFER, new Float32Array(vertices), g_WebGL.STATIC_DRAW);
	
	result.itemSize = 5;
	result.numItems = 4;

	return result;
}

function createBackgroundBuffer()
{
	var result = g_WebGL.createBuffer();
	g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, result);

	var vertices = [
		1.0, -1.0, 0.0,
       -1.0, -1.0, 0.0,
       -1.0,  1.0, 0.0,
        1.0,  1.0, 0.0 
	];

	g_WebGL.bufferData(g_WebGL.ARRAY_BUFFER, new Float32Array(vertices), g_WebGL.STATIC_DRAW);
	
	result.itemSize = 5;
	result.numItems = 4;

	return result;
}

function createObjectShader()
{
	var shaderProgram = GL.createShaderProgram(g_WebGL, "bs.default.vs", "bs.flatcolor.fs");
	setupDefaultShader(shaderProgram);

 	return shaderProgram;
}

function createBulletShader()
{
	var shaderProgram = GL.createShaderProgram(g_WebGL, "bs.default.vs", "bs.bullet.fs");
	setupDefaultShader(shaderProgram);	

 	return shaderProgram;
}

function setupDefaultShader(shaderProgram)
{
	g_WebGL.useProgram(shaderProgram);
		
	shaderProgram.vertexPositionAttribute = g_WebGL.getAttribLocation(shaderProgram, "a_VertexPosition");	
	shaderProgram.textureCoordinateAttribute = g_WebGL.getAttribLocation(shaderProgram, "a_TexCoord");	
	shaderProgram.modelMatrixUniform = g_WebGL.getUniformLocation(shaderProgram, "u_ModelMatrix");
	shaderProgram.viewMatrixUniform = g_WebGL.getUniformLocation(shaderProgram, "u_ViewMatrix");
	shaderProgram.projectionMatrixUniform = g_WebGL.getUniformLocation(shaderProgram, "u_ProjMatrix");
	shaderProgram.tintColor = g_WebGL.getUniformLocation(shaderProgram, "u_TintColor");
}

function createBackgroundShader()
{
	var shaderProgram = GL.createShaderProgram(g_WebGL, "bs.background.vs", "bs.background.fs");

	g_WebGL.useProgram(shaderProgram);
		
	shaderProgram.vertexPositionAttribute = g_WebGL.getAttribLocation(shaderProgram, "a_VertexPosition");	
	shaderProgram.time = g_WebGL.getUniformLocation(shaderProgram, "u_Time");
	shaderProgram.resolution = g_WebGL.getUniformLocation(shaderProgram, "u_Resolution");
	shaderProgram.accel = g_WebGL.getUniformLocation(shaderProgram, "u_Acceleration");

 	return shaderProgram;
}




