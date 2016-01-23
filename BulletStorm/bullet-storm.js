/**     BULLET STORM namespace     **/

var BulletStorm = BulletStorm || {};

/**================================**/
/**            GAME OBJECT         **/
/**================================**/

var GameObject = {

	pos: [0, 0, 0],

	shader: null,

	vertexBuffer: null,

	tintColor: [1.0, 1.0, 1.0, 1.0],

	create: function(pos, vertexBuffer, shader, tintColor)
	{
		var result = Object.create(GameObject);

		result.pos = pos;
		result.vertexBuffer = vertexBuffer;
		result.shader = shader;
		result.tintColor = tintColor;

		return result;
	}
}

/**================================**/
/**          SCENE OBJECT          **/
/**================================**/

var Scene = {

	gameObjects: [],

	camera: {
		eyePos: vec3.fromValues(0, 1, 0),
		lookAtPos: vec3.fromValues(0, -1, -0.5),
		upVector: vec3.fromValues(0, 0, -1)
	}
}

/**================================**/
/**           !! GLOBALS !!        **/
/**================================**/

const FSIZE = Float32Array.BYTES_PER_ELEMENT;

var g_WebGL;

var g_ModelMatrix = mat4.create();
var g_ViewMatrix = mat4.create();
var g_ProjectionMatrix = mat4.create();

var g_StartTime = Date.now();


/**================================**/
/**        >>> RUN GAME >>>        **/
/**================================**/

BulletStorm.run = function()
{
	g_WebGL = GL.getWebGLContext();
	g_WebGL.blendFunc(g_WebGL.SRC_ALPHA, g_WebGL.ONE);

	init();

	setInterval(drawScene, 33);
}

/**================================**/
/**            GAME ENGINE         **/
/**================================**/

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

		mat4.identity(g_ModelMatrix);
		mat4.translate(g_ModelMatrix, g_ModelMatrix, go.pos);

		g_WebGL.useProgram(go.shader);

		g_WebGL.disable(g_WebGL.DEPTH_TEST);
		g_WebGL.enable(g_WebGL.BLEND);

		g_WebGL.uniformMatrix4fv(go.shader.viewMatrixUniform, false, g_ViewMatrix);		
		g_WebGL.uniformMatrix4fv(go.shader.projectionMatrixUniform, false, g_ProjectionMatrix);
		g_WebGL.uniformMatrix4fv(go.shader.modelMatrixUniform, false, g_ModelMatrix);
		g_WebGL.uniform4fv(go.shader.tintColor, go.tintColor);

		g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, go.vertexBuffer);
		g_WebGL.enableVertexAttribArray(go.shader.vertexPositionAttribute);
		g_WebGL.vertexAttribPointer(go.shader.vertexPositionAttribute, 3, g_WebGL.FLOAT, false, 5 * FSIZE, 0);
		
		g_WebGL.enableVertexAttribArray(go.shader.textureCoordinateAttribute);
		g_WebGL.vertexAttribPointer(go.shader.textureCoordinateAttribute, 2, g_WebGL.FLOAT, false, 5 * FSIZE, 3 * FSIZE);

		g_WebGL.drawArrays(g_WebGL.TRIANGLE_FAN, 0, go.vertexBuffer.numItems);

		g_WebGL.enable(g_WebGL.DEPTH_TEST);
		g_WebGL.disable(g_WebGL.BLEND);
    }
}

function createTriangleVertexBuffer() 
{
	var result = g_WebGL.createBuffer();
	g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, result);

	var vertices = [
	     0.0,  0.0, -1.0,
	    -1.0,  0.0,  1.0,
	     1.0,  0.0,  1.0
	];

	g_WebGL.bufferData(g_WebGL.ARRAY_BUFFER, new Float32Array(vertices), g_WebGL.STATIC_DRAW);
	
	result.itemSize = 3;
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


function drawScene()
{
	g_WebGL.viewport(0, 0, g_WebGL.viewportWidth, g_WebGL.viewportHeight);
	g_WebGL.clear(g_WebGL.COLOR_BUFFER_BIT, g_WebGL.DEPTH_BUFFER_BIT);

	drawBackground();
	drawObjects();
}

function createForegroundShader()
{
	var shaderProgram = GL.createShaderProgram(g_WebGL, "bs.default.vs", "bs.circle.fs");

	g_WebGL.useProgram(shaderProgram);
		
	shaderProgram.vertexPositionAttribute = g_WebGL.getAttribLocation(shaderProgram, "a_VertexPosition");	
	shaderProgram.textureCoordinateAttribute = g_WebGL.getAttribLocation(shaderProgram, "a_TexCoord");	
	shaderProgram.modelMatrixUniform = g_WebGL.getUniformLocation(shaderProgram, "u_ModelMatrix");
	shaderProgram.viewMatrixUniform = g_WebGL.getUniformLocation(shaderProgram, "u_ViewMatrix");
	shaderProgram.projectionMatrixUniform = g_WebGL.getUniformLocation(shaderProgram, "u_ProjMatrix");
	shaderProgram.tintColor = g_WebGL.getUniformLocation(shaderProgram, "u_TintColor");

 	return shaderProgram;
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

function init()	
{
	g_BackgroundBuffer = createBackgroundBuffer();
 	g_BackgroundShader = createBackgroundShader();

 	var buffer = createSquareVertexBuffer();
 	var shader = createForegroundShader();

 	var go1 = GameObject.create([0, -10, 0], buffer, shader, [1.0, 0.0, 0.0, 1.0]);

 	Scene.gameObjects.push(go1);
}



