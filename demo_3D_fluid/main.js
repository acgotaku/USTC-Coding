    var run = true;
    var FieldOfView = 0.7;
    var c = document.getElementById('canvas');
    var q = new qtnIV();
    var qt = q.identity(q.create());
    c.width = 480; //Math.min(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 800) {
        c.height =900;
    }else{
        c.height =700;
    }
    //c.width = c.height;
    c.addEventListener('mousemove', MouseMove, true);
    var GridWidth =c.width/2;
    var GridHeight = c.height/2;
    var GridDepth = 12;
    var width = c.width;
    var height = c.height;
    const SplatRadius = GridWidth /8.0;
    const ImpulsePosition = [ GridWidth / 2, - SplatRadius / 2, GridDepth / 2.0];
    var VisualizeProgram, Obstacles, Velocity, Density, Pressure ,Temperature, Divergence, QuadVao ,CubeVao, HireObstacles;
    var gl = c.getContext('webgl');
    var Prg = CreateProgram('Sphere.VS', 'Sphere.FS');
    var sphereVAO =InitSphere();
    Initialize();
    var count =0;
    render();
    function render(){
        Update();
        var ext = gl.getExtension('OES_vertex_array_object');
        gl.useProgram(VisualizeProgram);
        ext.bindVertexArrayOES(QuadVao); 
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);  
        var fillColor = gl.getUniformLocation(VisualizeProgram, 'FillColor');
        var scale =gl.getUniformLocation(VisualizeProgram, 'Scale');
        var slice = gl.getUniformLocation(VisualizeProgram, "Slice");
        var size = gl.getUniformLocation(VisualizeProgram, "Size");
        gl.enable(gl.BLEND);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
       
        var m = new matIV();
        var mMatrix = m.identity(m.create());
        var vMatrix = m.identity(m.create());
        var pMatrix = m.identity(m.create());
        var mvMatrix = m.identity(m.create());
        var tmpMatrix = m.identity(m.create());
        var mvpMatrix = m.identity(m.create());
        var camPosition =[0.0, 0.0, 1.0];
        m.lookAt(camPosition, [0,0,0] , [0, 1, 0], vMatrix);
        m.perspective(45, c.width / c.height ,0.1, 100 , pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);
        m.identity(mMatrix);
        var qMatrix = m.identity(m.create());
        q.toMatIV(qt, qMatrix);
        m.multiply(mMatrix, qMatrix, mMatrix);
        m.multiply(vMatrix, mMatrix, mvMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
         /*
        var lightPosition = gl.getUniformLocation(VisualizeProgram, 'LightPosition');
        gl.uniform3fv(lightPosition, [1.0,1.0,2.0]);

        var lightIntensity = gl.getUniformLocation(VisualizeProgram, 'LightIntensity');
        gl.uniform3fv(lightIntensity, [10.0,10.0,10.0]);

        var absorption = gl.getUniformLocation(VisualizeProgram, 'Absorption');
        gl.uniform1f(absorption, 10.0);
        
        var scale =gl.getUniformLocation(VisualizeProgram, 'Scale');

        var mvp = gl.getUniformLocation(VisualizeProgram, 'ModelviewProjection')
        gl.uniformMatrix4fv(mvp, false, mvpMatrix);

        var modelview = gl.getUniformLocation(VisualizeProgram, 'Modelview');
        gl.uniformMatrix4fv(modelview,false, mvMatrix);

        var viewMatrix = gl.getUniformLocation(VisualizeProgram, 'ViewMatrix');
        gl.uniformMatrix4fv(viewMatrix,false, vMatrix);

        var projectionMatrix = gl.getUniformLocation(VisualizeProgram, 'ProjectionMatrix');
        gl.uniformMatrix4fv(projectionMatrix,false, pMatrix);
        var rayOrigin = gl.getUniformLocation(VisualizeProgram, 'RayOrigin');
        var mvMatrix = m.identity(m.create());
        m.transpose(mvMatrix,tmpMatrix);
        var dataMatrix = m.identity(m.create());
        var data = camPosition.slice();
        data.push(0);
        m.multiply(tmpMatrix, m.vecToMat(data,dataMatrix), tmpMatrix)
        var array =[];
        array.push(tmpMatrix[0]); 
        array.push(tmpMatrix[4]);
        array.push(tmpMatrix[8]);
       //console.log(array);
        gl.uniform3fv(rayOrigin,array);

        var focalLength = gl.getUniformLocation(VisualizeProgram, 'FocalLength');
        gl.uniform1f(focalLength, 1.0);

        var size = gl.getUniformLocation(VisualizeProgram, "Size");
        gl.uniform1f(size, GridDepth);

        var windowSize = gl.getUniformLocation(VisualizeProgram, 'WindowSize');
        gl.uniform2fv(windowSize, [width,height]);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); */

        //draw ink
        var mvp = gl.getUniformLocation(VisualizeProgram, 'ModelviewProjection')
        gl.uniformMatrix4fv(mvp, false, mvpMatrix);
        gl.uniform1f(size,GridDepth);
        gl.uniform3fv(scale, [1.0/width, 1.0/height, 1.0/GridDepth]);
        gl.uniform3fv(fillColor, [1.0,1.0,1.0]);
        gl.bindTexture(gl.TEXTURE_2D,Density.Ping.TextureHandle);
        for (var i = 0; i < GridDepth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        //Draw obstacles 
        
        gl.bindTexture(gl.TEXTURE_2D, HireObstacles.TextureHandle);
        gl.uniform3fv(fillColor, [0.125, 0.8, 0.75]);
        gl.uniform3fv(scale, [1.0/width, 1.0/height, 1.0/GridDepth]);
        gl.uniform1f(size,GridDepth);
       for(var i =0; i< GridDepth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        
        RenderSphere();
        ext.bindVertexArrayOES(CubeVao); 
        gl.flush();
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        if(run){requestAnimationFrame(render);}
    }
    function Initialize(){
        var w = GridWidth;
        var h = GridHeight;
        var d = GridDepth;
        Velocity = CreateSlab(w, h, d, 3);
        Density = CreateSlab(w, h, d, 1);
        Pressure = CreateSlab(w, h, d, 1);
        Temperature = CreateSlab(w, h, d, 1);
        Divergence = CreateSurface(w, h, d, 3);
        InitSlabOps();
       // VisualizeProgram = CreateProgram("Cube.VS", "Cube.FS");
        VisualizeProgram = CreateProgram("Render.Vertex", "Render.Fill");
        Obstacles = CreateSurface(w, h, d, 3);
        CreateObstacles(Obstacles,w,h, d);
        w = c.width;
        h = c.height;
        d = GridDepth;
        HireObstacles = CreateSurface(w,h, d,3);
        CreateObstacles(HireObstacles, w, h, d);
        QuadVao = CreateQuad();  
        CubeVao =CreateCube();
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        ClearSurface(Temperature.Ping, AmbientTemperature);  
    }
    function InitSphere(){
        var ext = gl.getExtension('OES_vertex_array_object');
        var AttLocation = [];
        AttLocation.push(gl.getAttribLocation(Prg, 'Position'));
        AttLocation.push(gl.getAttribLocation(Prg, 'Normal'));
        var AttStride = [];
        AttStride.push(3);
        AttStride.push(3);
        var SphereData = DrawSphere(64, 64, 0.3);
        var Position = CreateVbo(SphereData.p);
        var Normal = CreateVbo(SphereData.n);
        var VBOList = [Position, Normal];
        var Index = CreateIbo(SphereData.i);
        var sphereVAO = ext.createVertexArrayOES();
        ext.bindVertexArrayOES(sphereVAO);
        SetAttribute(VBOList, AttLocation, AttStride);     
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index); 
        ext.bindVertexArrayOES(null); 
        return sphereVAO     

    }
    function RenderSphere(){
        gl.useProgram(Prg);
        var ext = gl.getExtension('OES_vertex_array_object');
        var uniLocation = new Array();
        uniLocation.push(gl.getUniformLocation(Prg, 'ModelviewProjection'));
        uniLocation.push(gl.getUniformLocation(Prg, 'ViewMatrix'));
        uniLocation.push(gl.getUniformLocation(Prg, 'NormalMatrix'));
        uniLocation.push(gl.getUniformLocation(Prg, 'LightPosition'));
        uniLocation.push(gl.getUniformLocation(Prg, 'DiffuseMaterial'));
        uniLocation.push(gl.getUniformLocation(Prg, 'AmbientMaterial'));
        uniLocation.push(gl.getUniformLocation(Prg, 'SpecularMaterial'));
        uniLocation.push(gl.getUniformLocation(Prg, 'Shininess'));       
        var m = new matIV();
        var SphereData = DrawSphere(64, 64, 0.3);
        var mMatrix = m.identity(m.create());
        var vMatrix = m.identity(m.create());
        var pMatrix = m.identity(m.create());
        var tmpMatrix = m.identity(m.create());
        var mvpMatrix = m.identity(m.create());
        var invMatrix = m.identity(m.create());
        var camPosition =[0.0, 0.0, 7.0];
        m.lookAt(camPosition, [0,0,0] , [0, 1, 0], vMatrix);
        m.perspective(45, c.width / c.height ,2, 500 , pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);

        m.identity(mMatrix);
        var qMatrix = m.identity(m.create());
        q.toMatIV(qt, qMatrix);
        m.multiply(mMatrix, qMatrix, mMatrix);

        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        m.inverse(mMatrix, invMatrix);
        ext.bindVertexArrayOES(sphereVAO);
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix3fv(uniLocation[1], false, m.getUpper3x3(vMatrix));
        gl.uniformMatrix3fv(uniLocation[2], false, m.getUpper3x3(invMatrix));
        gl.uniform3fv(uniLocation[3], [0.25, 0.25, 1.0]);
        gl.uniform3fv(uniLocation[4], [1.0, 0.5, 0.125]);
        gl.uniform3fv(uniLocation[5], [0.5, 0.25, 0.6]);
        gl.uniform3fv(uniLocation[6], [0.5, 0.5, 0.5]);
        gl.uniform1f(uniLocation[7], 50.0);
        gl.drawElements(gl.TRIANGLES, SphereData.i.length, gl.UNSIGNED_SHORT, 0);
             
    }
    function Update(){
        gl.viewport(0, 0, GridWidth * GridDepth, GridHeight);
        var ext = gl.getExtension('OES_vertex_array_object');
        ext.bindVertexArrayOES(QuadVao); 
        
        Advect(Velocity.Ping, Velocity.Ping, Obstacles, Velocity.Pong, VelocityDissipation);
        SwapSurfaces(Velocity);
        
        Advect(Velocity.Ping, Temperature.Ping, Obstacles, Temperature.Pong, TemperatureDissipation);
        SwapSurfaces(Temperature);
 
        Advect(Velocity.Ping, Density.Ping, Obstacles, Density.Pong, DensityDissipation);
        SwapSurfaces(Density);
        
        ApplyImpulse(Temperature.Ping, ImpulsePosition, ImpulseTemperature);
        
        ApplyImpulse(Density.Ping, ImpulsePosition, ImpulseDensity);
        
        ApplyBuoyancy(Velocity.Ping, Temperature.Ping, Density.Ping, Velocity.Pong);
        SwapSurfaces(Velocity);     

        ComputeDivergence(Velocity.Ping, Obstacles, Divergence); 
        ClearSurface(Pressure.Ping, 0);
        for (var i= 0; i < NumJacobiIterations; ++i){
            Jacobi(Pressure.Ping, Divergence, Obstacles, Pressure.Pong);
            SwapSurfaces(Pressure);
        }

        SubtractGradient(Velocity.Ping, Pressure.Ping, Obstacles, Velocity.Pong);
        SwapSurfaces(Velocity);
        
        
    }
    function MouseMove(e){
        var cw = c.width;
        var ch = c.height;
        var wh = 1 / Math.sqrt(cw * cw + ch * ch);
        var x = e.clientX - c.offsetLeft - cw * 0.5;
        var y = e.clientY - c.offsetTop - ch * 0.5;
        var sq = Math.sqrt(x * x + y * y);
        var r = sq * 2.0 * Math.PI * wh;
        if(sq != 1){
            sq = 1 / sq;
            x *= sq;
            y *= sq;
        }
        q.rotate(r, [y, x, 0.0], qt);
    }