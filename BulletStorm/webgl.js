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

GL.createRenderTexture = function(gl)
{
	var frameBuffer = gl.createFramebuffer();

	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	frameBuffer.width = gl.viewportWidth;
	frameBuffer.height = gl.viewportHeight;

	var renderTexture = gl.createTexture();	
	gl.bindTexture(gl.TEXTURE_2D, renderTexture);	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, frameBuffer.width, frameBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);

    var renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBuffer.width, frameBuffer.height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var result = {};

    result.frameBuffer = frameBuffer;
    result.renderTexture = renderTexture;
    result.renderbuffer = renderBuffer;

    return result;
}




