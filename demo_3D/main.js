    var run = true;
    var c = document.getElementById('canvas');
    var q = new qtnIV();
    var qt = q.identity(q.create());
    c.width = 480; //Math.min(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 800) {
        c.height =900;
    }else{
        c.height =700;
    }
    c.addEventListener('mousemove', MouseMove, true);
    var GridWidth = c.width / 2;
    var GridHeight = c.height / 2;
    var width = c.width;
    var height = c.height;
    const SplatRadius = GridWidth /8.0;
    const ImpulsePosition = [ GridWidth / 2, - SplatRadius / 2];
    var VisualizeProgram, Obstacles, Velocity, Density, Pressure ,Temperature, Divergence, QuadVao , HireObstacles;
    var gl = c.getContext('webgl');
    var sphereVAO =InitSphere();
    Initialize();
    render();
    function render(){
        Update();
        var ext = gl.getExtension('OES_vertex_array_object');
        gl.useProgram(VisualizeProgram);
        ext.bindVertexArrayOES(QuadVao); 
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);  
        var uniLocation = new Array();
        uniLocation.push(gl.getUniformLocation(VisualizeProgram, 'FillColor'));
        uniLocation.push(gl.getUniformLocation(VisualizeProgram, 'Scale'));
        gl.enable(gl.BLEND);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        //draw ink
        gl.bindTexture(gl.TEXTURE_2D,Density.Ping.TextureHandle);
        gl.uniform3fv(uniLocation[0], [1.0,1.0,1.0]);
        gl.uniform2fv(uniLocation[1], [1.0/width, 1.0/height]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        //Draw obstacles 
        gl.bindTexture(gl.TEXTURE_2D, HireObstacles.TextureHandle);
        gl.uniform3fv(uniLocation[0], [0.125, 0.8, 0.75]);
        gl.uniform2fv(uniLocation[1], [1.0/width, 1.0/height]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        RenderSphere();
        ext.bindVertexArrayOES(QuadVao); 
        gl.flush();
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        if(run){requestAnimationFrame(render);}
    }
    function Initialize(){
        var w = GridWidth;
        var h = GridHeight;
        Velocity = CreateSlab(w, h, 2);
        Density = CreateSlab(w, h, 1);
        Pressure = CreateSlab(w, h, 1);
        Temperature = CreateSlab(w, h, 1);
        Divergence = CreateSurface(w, h, 3);
        InitSlabOps();
        VisualizeProgram = CreateProgram("Vertex", "Visualize");
        Obstacles = CreateSurface(w, h, 3);
        CreateObstacles(Obstacles,w,h);
        w = GridWidth * 2;
        h = GridHeight * 2;
        HireObstacles = CreateSurface(w,h,1);
        CreateObstacles(HireObstacles, w, h);
        QuadVao = CreateQuad();  
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        ClearSurface(Temperature.Ping, AmbientTemperature);  
    }
    function InitSphere(){
        var ext = gl.getExtension('OES_vertex_array_object');
        var Prg = CreateProgram('Sphere.VS', 'Sphere.FS');
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
        var Prg = CreateProgram('Sphere.VS', 'Sphere.FS');
        var uniLocation = new Array();
        uniLocation.push(gl.getUniformLocation(Prg, 'ModelviewProjection'));
        uniLocation.push(gl.getUniformLocation(Prg, 'ViewMatrix'));
        uniLocation.push(gl.getUniformLocation(Prg, 'NormalMatrix'));
        uniLocation.push(gl.getUniformLocation(Prg, 'LightPosition'));
        uniLocation.push(gl.getUniformLocation(Prg, 'DiffuseMaterial'));
        uniLocation.push(gl.getUniformLocation(Prg, 'AmbientMaterial'));
        uniLocation.push(gl.getUniformLocation(Prg, 'SpecularMaterial'));
        uniLocation.push(gl.getUniformLocation(Prg, 'Shininess'));        var m = new matIV();
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
        gl.viewport(0, 0, GridWidth, GridHeight);

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