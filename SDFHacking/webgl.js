
var gl;
var shader;
var vertexBuffer;
var startTime;

function initWebGL()
{
	var canvas = document.getElementById("webgl-canvas");
	gl = canvas.getContext("webgl");

	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	shader = createShaderProgram("shader-vs", "shader-fs");
	setupShaderProgram(shader);

	initVertexBuffer();

	startTime = Date.now();
	setInterval(drawScene, 30);
}

function drawScene()
{
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(shader.vertexPositionAttribute, vertexBuffer.triCount, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numItems);

	var time = (Date.now() - startTime) / 1000.0;

	gl.uniform1f(shader.time, time);
	gl.uniform2f(shader.resolution, gl.viewportWidth, gl.viewportHeight);
}

function loadShader(id)
{
	var shaderElem = document.getElementById(id);
	var result = null;

	if(shaderElem != null)
	{
		var shaderSource = shaderElem.textContent;

		if(shaderElem.type == "x-shader/x-fragment")
		{
			result = gl.createShader(gl.FRAGMENT_SHADER);
		}
		else if (shaderElem.type == "x-shader/x-vertex")
		{
			result = gl.createShader(gl.VERTEX_SHADER);
		}

		if(result != null)
		{
			gl.shaderSource(result, shaderSource);
			gl.compileShader(result);

			if(!gl.getShaderParameter(result, gl.COMPILE_STATUS)) 
			{
            	alert(gl.getShaderInfoLog(result));
        	}
		}
	}

	return result;
}

function createShaderProgram(fragId, vertId)
{
	var fragShader = loadShader(fragId);
	var vertShader = loadShader(vertId);

	var result = null;

	if(fragShader != null && vertShader != null)
	{
		result = gl.createProgram();
		gl.attachShader(result, fragShader);
		gl.attachShader(result, vertShader);
		gl.linkProgram(result);	

		if (!gl.getProgramParameter(result, gl.LINK_STATUS)) 
		{
            alert("Could not create shader program. Please fix errors and try again.");
        }
	}

	return result;
}

function setupShaderProgram(shaderProgram)
{
	gl.useProgram(shaderProgram);
		
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");	
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.time = gl.getUniformLocation(shaderProgram, "uTime");
	shaderProgram.resolution = gl.getUniformLocation(shaderProgram, "uResolution");
}


function initVertexBuffer() 
{
	var aspect = gl.viewportWidth / gl.viewportHeight;

	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	
	var vertices = [
	     -1, 1*aspect, 1,  1*aspect,  1, -1*aspect,
       	 -1, 1*aspect, 1, -1*aspect, -1, -1*aspect
	];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	vertexBuffer.triCount = 2;
	vertexBuffer.numItems = vertices.length / vertexBuffer.triCount;
}



