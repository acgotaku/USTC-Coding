    var run = true;
    var c = document.getElementById('canvas');
    c.width = 480; //Math.min(window.innerWidth, window.innerHeight);
    c.height =window.innerHeight - 50;
    var GridWidth = c.width / 2;
    var GridHeight = c.height / 2;
    var width = c.width;
    var height = c.height;
    const SplatRadius = GridWidth /8.0;
    const ImpulsePosition = [ GridWidth / 2, - SplatRadius / 2];
    var VisualizeProgram, Obstacles, Velocity, Density, Pressure ,Temperature, Divergence, QuadVao , HireObstacles;
    var gl = c.getContext('webgl');
    Initialize();
    render();
    function render(){
        Update();
        gl.useProgram(VisualizeProgram);
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
        gl.flush();
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
        var QuadVao = CreateQuad();  
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        ClearSurface(Temperature.Ping, AmbientTemperature);  
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