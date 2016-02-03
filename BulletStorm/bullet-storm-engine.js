/**     BULLET STORM namespace     **/

var BulletStormEngine = BulletStormEngine || {};

/**================================**/
/**           !! GLOBALS !!        **/
/**================================**/ 

const FSIZE = Float32Array.BYTES_PER_ELEMENT;

var g_WebGL;
var g_Framebuffer1;
var g_RenderTexture1;

var g_ModelMatrix = mat4.create();
var g_ViewMatrix = mat4.create();
var g_ProjectionMatrix = mat4.create();

var g_StartTime = Date.now();

var g_ShaderCache = new Array();
var g_BufferCache = new Array();

var g_BackgroundBuffer;
var g_BackgroundShader;

var g_BlitBuffer;
var g_BlitShader;

/**================================**/
/**    >>> SETUP & RUN GAME >>>    **/
/**================================**/

BulletStormEngine.initInputSystem = function()
{
	document.onkeydown = BulletStormIO.onKeyDown;
	document.onkeyup = BulletStormIO.onKeyUp;
}

BulletStormEngine.init = function()	
{
	g_WebGL = GL.getWebGLContext();
	g_WebGL.blendFunc(g_WebGL.SRC_ALPHA, g_WebGL.ONE);

	BulletStormEngine.createFramebuffer1();
	BulletStormEngine.initInputSystem();
}

BulletStormEngine.mainLoop = function()
{
	BulletManager.update();

	BulletStormEngine.updateScene();

	BulletStormEngine.renderSceneToBuffer();

	//BulletStormEngine.renderBufferToScreen();

	requestAnimationFrame(BulletStormEngine.mainLoop);
}


BulletStormEngine.updateScene = function()
{
	for(var i = Scene.gameObjects.length - 1; i >= 0; --i)
    {
		var go = Scene.gameObjects[i];

		if(go.__initialized__ == undefined)
		{
			go.init();
			go.__initialized__ = true;
		}

		if(go.destroyed)
		{
			go.cleanup();
			Scene.gameObjects.splice(i, 1);
		}
		else
		{
			if(go.enabled)
			{
				go.update();
			}		
		}
	}
}

BulletStormEngine.loadResources = function()
{
	g_BackgroundBuffer = createBackgroundBuffer();
 	g_BackgroundShader = createBackgroundShader();

 	g_BlitShader = createBlitShader();
 	g_BlitBuffer = createBlitBuffer();

 	g_BufferCache[SHAPE_TRI_0] = createTriangleVertexBuffer();
 	g_BufferCache[SHAPE_SQR_0] = createSquareVertexBuffer();
 	g_ShaderCache[SHADER_OBJECT_0] = createObjectShader();
 	g_ShaderCache[SHADER_BULLET_0] = createBulletShader(); 
 	g_ShaderCache[SHADER_SPECIAL_0] = createSpecialShader();
}

BulletStormEngine.createFramebuffer1 = function()
{
	g_Framebuffer1 = g_WebGL.createFramebuffer();

	g_WebGL.bindFramebuffer(g_WebGL.FRAMEBUFFER, g_Framebuffer1);
	g_Framebuffer1.width = g_WebGL.viewportWidth;
	g_Framebuffer1.height = g_WebGL.viewportHeight;

	g_RenderTexture1 = gl.createTexture();	
	g_WebGL.bindTexture(g_WebGL.TEXTURE_2D, g_RenderTexture1);	
	g_WebGL.texParameteri(g_WebGL.TEXTURE_2D, g_WebGL.TEXTURE_MAG_FILTER, g_WebGL.LINEAR);
    g_WebGL.texParameteri(g_WebGL.TEXTURE_2D, g_WebGL.TEXTURE_MIN_FILTER, g_WebGL.LINEAR_MIPMAP_NEAREST);
    g_WebGL.texImage2D(g_WebGL.TEXTURE_2D, 0, g_WebGL.RGBA, g_Framebuffer1.width, g_Framebuffer1.height, 0, g_WebGL.RGBA, g_WebGL.UNSIGNED_BYTE, null);

    var renderbuffer = g_WebGL.createRenderbuffer();
    g_WebGL.bindRenderbuffer(g_WebGL.RENDERBUFFER, renderbuffer);
    g_WebGL.renderbufferStorage(g_WebGL.RENDERBUFFER, g_WebGL.DEPTH_COMPONENT16, g_Framebuffer1.width, g_Framebuffer1.height);

    g_WebGL.framebufferTexture2D(g_WebGL.FRAMEBUFFER, g_WebGL.COLOR_ATTACHMENT0, g_WebGL.TEXTURE_2D, g_RenderTexture1, 0);
    g_WebGL.framebufferRenderbuffer(g_WebGL.FRAMEBUFFER, g_WebGL.DEPTH_ATTACHMENT, g_WebGL.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// -------------------------------- //
// ~~~~    Drawing Functions   ~~~~ //
// -------------------------------- //

BulletStormEngine.drawBackground = function()
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

BulletStormEngine.drawObjects = function()
{
	// setup the view and project matrices
	var cam = Scene.camera;

	mat4.lookAt(g_ViewMatrix, cam.eyePos, cam.lookAtPos, cam.upVector); 
	mat4.perspective(g_ProjectionMatrix, 45, g_WebGL.viewportWidth / g_WebGL.viewportHeight, 0.1, 100.0);

	var cachedModelMatrix = mat4.clone(g_ModelMatrix);

    // draw all objects in the scene
    for(var i = 0; i < Scene.gameObjects.length; i++)
    {
		var go = Scene.gameObjects[i];

		if(go.enabled)
		{
			BulletStormEngine.drawGameObject(go);
		}

		g_ModelMatrix = cachedModelMatrix;
    }
}

BulletStormEngine.drawGameObject = function(go)
{
	var shader = g_ShaderCache[go.shader];
	var vertexBuffer = g_BufferCache[go.vertexBuffer];

	mat4.identity(g_ModelMatrix);

	mat4.translate(g_ModelMatrix, g_ModelMatrix, go.pos);	
	mat4.scale(g_ModelMatrix, g_ModelMatrix, go.scale);
	mat4.rotateX(g_ModelMatrix, g_ModelMatrix, go.rotation[0]);
	mat4.rotateY(g_ModelMatrix, g_ModelMatrix, go.rotation[1]);
	mat4.rotateZ(g_ModelMatrix, g_ModelMatrix, go.rotation[2]);

	g_WebGL.useProgram(shader);

	if(go.transparent)
	{
		g_WebGL.enable(g_WebGL.BLEND);
	}

	var time = (Date.now() - g_StartTime) / 1000.0;

	go.preRender(g_WebGL, shader, time);
	
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

	if(go.transparent)
	{
		g_WebGL.disable(g_WebGL.BLEND);
	}
}

BulletStormEngine.renderSceneToBuffer = function()
{
	g_WebGL.viewport(0, 0, g_WebGL.viewportWidth, g_WebGL.viewportHeight);
	g_WebGL.clear(g_WebGL.COLOR_BUFFER_BIT, g_WebGL.DEPTH_BUFFER_BIT);

	BulletStormEngine.drawBackground();
	BulletStormEngine.drawObjects();
}

BulletStormEngine.renderBufferToScreen = function()
{
	mat4.ortho(g_ProjectionMatrix, -1, 1, -1, 1, 0.1, 1000.0);    

   	g_WebGL.useProgram(g_BlitShader);

    g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, g_BlitBuffer);
    g_WebGL.enableVertexAttribArray(g_BlitShader.vertexPositionAttribute);
    g_WebGL.vertexAttribPointer(g_BlitShader.vertexPositionAttribute, 3, g_WebGL.FLOAT, false, 5 * FSIZE, 0);
    
	// g_WebGL.enableVertexAttribArray(shader.textureCoordinateAttribute);
	// g_WebGL.vertexAttribPointer(shader.textureCoordinateAttribute, 2, g_WebGL.FLOAT, false, 5 * FSIZE, 3 * FSIZE);

    g_WebGL.drawArrays(g_WebGL.TRIANGLE_FAN, 0, g_BlitBuffer.numItems);
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
	    /* pos: */ 1.0,  0.0, -1.0, /* uv: */  1.0, 0.0,
	              -1.0,  0.0, -1.0,            0.0, 0.0,
	              -1.0,  0.0,  1.0,            0.0, 1.0,
	               1.0,  0.0,  1.0,            1.0, 1.0
	];

	g_WebGL.bufferData(g_WebGL.ARRAY_BUFFER, new Float32Array(vertices), g_WebGL.STATIC_DRAW);
	
	result.itemSize = 5;
	result.numItems = 4;

	return result;
}

function createBlitBuffer()
{
	var result = g_WebGL.createBuffer();
	g_WebGL.bindBuffer(g_WebGL.ARRAY_BUFFER, result);

	var vertices = [
	    /* pos: */ 1.0, -1.0, 0.0, /* uv: */  1.0, 0.0,
	              -1.0, -1.0, 0.0,            0.0, 0.0,
	              -1.0,  1.0, 0.0,            0.0, 1.0,
	               1.0,  1.0, 0.0,            1.0, 1.0
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

function createSpecialShader()
{
	var shaderProgram = GL.createShaderProgram(g_WebGL, "bs.default.vs", "bs.special-weapon.fs");
	setupDefaultShader(shaderProgram);

	shaderProgram.time = g_WebGL.getUniformLocation(shaderProgram, "u_Time");

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

function createBlitShader()
{
	var shaderProgram = GL.createShaderProgram(g_WebGL, "bs.background.vs", "bs.blit.fs");

	g_WebGL.useProgram(shaderProgram);		
	shaderProgram.vertexPositionAttribute = g_WebGL.getAttribLocation(shaderProgram, "a_VertexPosition");	

 	return shaderProgram;
}





