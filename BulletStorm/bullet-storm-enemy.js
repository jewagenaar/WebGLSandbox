var EnemyManager = {

	create : function(enemyType, pos) {

		var result = new GameObject(vec3.fromValues(0, -10, -30), SHAPE_TRI_0, SHADER_OBJECT_0, [1.0, 0.0, 0.0, 1.0]);

		result.rotation = vec3.fromValues(0, 3.14, 0);
		result.update = _enemyUpdatePatternA;
		result.enabled = true;

		return result;
	}
}


function _enemyUpdatePatternA() 
{
	vec3.add(this.pos, this.pos, vec3.fromValues(0, 0, 0.1));

	if(this.pos[2] > 0)
	{
		this.destroyed = true;
	}
}

