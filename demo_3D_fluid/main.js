var GridWidth =512;
var GridHeight = 512;
var GridDepth = 8;
window.Main = (function () {
    const  AmbientTemperature = 0.0;
    const  ImpulseTemperature = 10.0;
    const  ImpulseDensity = 1.0;
    const  TemperatureDissipation = 0.99;
    const  VelocityDissipation = 0.99;
    const  DensityDissipation = 0.9999;
    const  NumJacobiIterations = 40;
    const  SplatRadius = GridWidth /8.0;
    const  ImpulsePosition = [ GridWidth / 2, - SplatRadius / 2, GridDepth / 2];
    var VisualizeProgram, Obstacles, Velocity, Density, Pressure ,Temperature, Divergence, QuadVao ,CubeVao, HireObstacles, Cube,CubeProgram;
    var run = true;
    var c = document.getElementById('canvas');
    var gl =c.getContext('webgl') || c.getContext('experimental-webgl');
    var ext = gl.getExtension('OES_vertex_array_object');
    var count =0;
    var Main = {
        Initialize: function () {      
            c.width = 512; //Math.min(window.innerWidth, window.innerHeight);
            c.height =c.width;
            var w = GridWidth;
            var h = GridHeight;
            var d = GridDepth;
            Velocity = Fluid.CreateSlab(w, h, d, 3);
            Density = Fluid.CreateSlab(w, h, d, 1);
            Pressure = Fluid.CreateSlab(w, h, d, 1);
            Temperature = Fluid.CreateSlab(w, h, d, 1);
            Divergence = Fluid.CreateVolume(w, h, d, 3);
            Fluid.InitSlabOps();
            Cube = Fluid.CreateSurface(c.width, c.height, gl.FLOAT);
            VisualizeProgram = Lib.CreateProgram("FirstPass.VS", "FirstPass.FS");
            CubeProgram = Lib.CreateProgram("SecondPass.VS", "SecondPass.FS");
            Obstacles = Fluid.CreateVolume(w, h, d, 3);
            Fluid.CreateObstacles(Obstacles,w,h, d);
            w = c.width;
            h = c.height;
            d = GridDepth;
            CubeVao = Fluid.CreateCube();
            QuadVao = Fluid.CreateQuad();
            Fluid.ClearSurface(Temperature.Ping, AmbientTemperature);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            this.Render();
        },
        Update:function(){
            gl.viewport(0, 0, GridWidth * GridDepth, GridHeight);
            ext.bindVertexArrayOES(QuadVao); 
            Fluid.Advect(Velocity.Ping, Velocity.Ping, Obstacles, Velocity.Pong, VelocityDissipation);
            Fluid.SwapSurfaces(Velocity);

            Fluid.Advect(Velocity.Ping, Temperature.Ping, Obstacles, Temperature.Pong, TemperatureDissipation);
            Fluid.SwapSurfaces(Temperature);

            Fluid.Advect(Velocity.Ping, Density.Ping, Obstacles, Density.Pong, DensityDissipation);
            Fluid.SwapSurfaces(Density);

            Fluid.ApplyImpulse(Temperature.Ping, ImpulsePosition, ImpulseTemperature);

            Fluid.ApplyImpulse(Density.Ping, ImpulsePosition, ImpulseDensity);

            Fluid.ApplyBuoyancy(Velocity.Ping, Temperature.Ping, Density.Ping, Velocity.Pong);
            Fluid.SwapSurfaces(Velocity);     

            Fluid.ComputeDivergence(Velocity.Ping, Obstacles, Divergence); 
            Fluid.ClearSurface(Pressure.Ping, 0);
            for (var i= 0; i < NumJacobiIterations; ++i){
                Fluid.Jacobi(Pressure.Ping, Divergence, Obstacles, Pressure.Pong);
                Fluid.SwapSurfaces(Pressure);
            }

            Fluid.SubtractGradient(Velocity.Ping, Pressure.Ping, Obstacles, Velocity.Pong);
            Fluid.SwapSurfaces(Velocity); 
        },
        Render:function(){
            Main.Update();
            gl.useProgram(VisualizeProgram);
            ext.bindVertexArrayOES(CubeVao); 
            gl.bindFramebuffer(gl.FRAMEBUFFER, Cube.FboHandle);  
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.viewport(0, 0, c.width, c.height);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            count++;
            var rad = (count % 360) * Math.PI /180;
            var m = new matIV();
            var mMatrix = m.identity(m.create());
            var vMatrix = m.identity(m.create());
            var pMatrix = m.identity(m.create());
            var mvMatrix = m.identity(m.create());
            var tmpMatrix = m.identity(m.create());
            var camPosition =[0.0, 0.0, 2.0];
            m.lookAt(camPosition, [0,0,0] , [0, 1, 0], vMatrix);
            m.perspective(45, c.width / c.height ,0.1, 100 , pMatrix);
            m.multiply(pMatrix, vMatrix, tmpMatrix);
            m.identity(mMatrix);
            var qMatrix = m.identity(m.create());
           // q.toMatIV(qt, qMatrix);
           // m.rotate(mMatrix,rad, [0, 1, 0], mMatrix);
            m.multiply(mMatrix, qMatrix, mMatrix);
            m.multiply(vMatrix, mMatrix, mvMatrix);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.CULL_FACE);
            gl.frontFace( gl.CW );
            var modelview = gl.getUniformLocation(VisualizeProgram, 'modelViewMatrix');
            gl.uniformMatrix4fv(modelview,false, mvMatrix);

            var projectionMatrix = gl.getUniformLocation(VisualizeProgram, 'projectionMatrix');
            gl.uniformMatrix4fv(projectionMatrix,false, pMatrix);

            gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); 
            gl.flush();
            gl.useProgram(CubeProgram);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);  
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.viewport(0, 0, c.width, c.height);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.CULL_FACE);
            gl.frontFace( gl.CCW );
            var modelview = gl.getUniformLocation(CubeProgram, 'modelViewMatrix');
            gl.uniformMatrix4fv(modelview,false, mvMatrix);
            var modelMatrix = gl.getUniformLocation(CubeProgram, 'modelMatrix');
            gl.uniformMatrix4fv(modelMatrix,false, mMatrix);

            var projectionMatrix = gl.getUniformLocation(CubeProgram, 'projectionMatrix');
            gl.uniformMatrix4fv(projectionMatrix,false, pMatrix);

            var steps = gl.getUniformLocation(CubeProgram, 'steps');
            gl.uniform1f(steps, GridDepth);

            var alphaCorrection = gl.getUniformLocation(CubeProgram, 'alphaCorrection');
            gl.uniform1f(alphaCorrection, 1.0);
            var texure = gl.getUniformLocation(CubeProgram, "texure");
            var cubeTex = gl.getUniformLocation(CubeProgram, "cubeTex");

            gl.uniform1i(texure, 0);
            gl.uniform1i(cubeTex, 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, Cube.TextureHandle);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, Density.Ping.TextureHandle);
            gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); 
            gl.flush();
            if(run){requestAnimationFrame(Main.Render);}
        }
    };
     
    return Main;
}());
Main.Initialize();



