var GL = GL || {};

GL.getWebGLContext = function()
{
	var canvas = document.getElementById("webgl-canvas");
	gl = canvas.getContext("webgl");

	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	return gl;
}

GL.loadShader = function(gl, id)
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

GL.createShaderProgram = function(gl, fragId, vertId)
{
	var fragShader = GL.loadShader(gl, fragId);
	var vertShader = GL.loadShader(gl, vertId);

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




