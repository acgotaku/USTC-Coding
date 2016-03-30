    const  AmbientTemperature = 0.0;
    const  CellSize = 1.25;
    const  ImpulseTemperature = 10.0;
    const  ImpulseDensity = 1.0;
    const  NumJacobiIterations = 40;
    const  TimeStep = 0.25;
    const  SmokeBuoyancy = 1.0;
    const  SmokeWeight = 0.05;
    const  GradientScale = 1.125 / CellSize;
    const  TemperatureDissipation = 0.99;
    const  VelocityDissipation = 0.99;
    const  DensityDissipation = 0.999;

    function Surface(FboHandle, TextureHandle, depth, NumComponents){
        var object={};
        object.FboHandle = FboHandle;
        object.TextureHandle = TextureHandle;
        object.Depth = depth;
        object.NumComponents = NumComponents;
        return object;
    }
    function Slab(Ping, Pong){
        var object={};
        object.Ping = Ping;
        object.Pong = Pong;
        return object;
    }
    function CreateSurface(width, height,depth, numComponents){
        var frameBuffer  = CreateFramebuffer(width * depth, height, gl.FLOAT);
        var surface =Surface(frameBuffer.f , frameBuffer.t, depth, numComponents);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return surface;
    }
    function ClearSurface(s, v){
        gl.bindFramebuffer(gl.FRAMEBUFFER, s.FboHandle);
        gl.clearColor(v, v, v, v);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    function CreateSlab(width, height, depth, numComponents){
        var slab = Slab();
        slab.Ping = CreateSurface(width, height, depth, numComponents);
        slab.Pong = CreateSurface(width, height, depth, numComponents);
        return slab;
    }

    function Programs(){
        var object={};
        object.Advect = null;
        object.Jacobi = null;
        object.SubtractGradient = null;
        object.ComputeDivergence = null;
        object.ApplyImpulse = null;
        object.ApplyBuoyancy = null;
        return object;
    }
    function InitSlabOps(){
        Programs =Programs();
        Programs.Advect = CreateProgram("Smoke.Vertex", "Advect");
        Programs.Jacobi = CreateProgram("Smoke.Vertex", "Jacobi");
        Programs.SubtractGradient = CreateProgram("Smoke.Vertex", "SubtractGradient");
        Programs.ComputeDivergence = CreateProgram("Smoke.Vertex", "ComputeDivergence");
        Programs.ApplyImpulse = CreateProgram("Smoke.Vertex", "Splat");
        Programs.ApplyBuoyancy = CreateProgram("Smoke.Vertex", "Buoyancy");
    }
    function SwapSurfaces(slab){
        var temp = slab.Ping;
        slab.Ping = slab.Pong;
        slab.Pong =temp;
    }
    function CreateQuad(){
        var position =[
                -1.0,-1.0, 
                 1.0,-1.0,
                -1.0, 1.0,
                 1.0, 1.0
        ];
        var ext;
        ext = gl.getExtension('OES_vertex_array_object');
        if(ext == null){
            alert('vertex array object not supported');
            return;
        }
        var VAO = ext.createVertexArrayOES();
        ext.bindVertexArrayOES(VAO);
        var Plane = CreateVbo(position);
        var VBOList = [Plane];
        SetAttribute(VBOList,[0],[2]);
        return VAO;
    }

    function DrawCircle(center, radius, slices){
        var pos = new Array();
        var stepSize =((2*Math.PI)/slices);
        pos.push(center.x, center.y);
        for (var i=0;i<=slices; i++){
            var angle =stepSize * (i+1);
            pos.push((Math.sin(angle)* radius + center.x) * height / width,(Math.cos(angle)* radius +center.y));
        }
        return pos;
    }

    function DrawSphere(row, column, rad, color){
        var pos = new Array(), nor = new Array(),
            col = new Array(), st  = new Array(), idx = new Array();
        for(var i = 0; i <= row; i++){
            var r = Math.PI / row * i;
            var ry = Math.cos(r);
            var rr = Math.sin(r);
            for(var ii = 0; ii <= column; ii++){
                var tr = Math.PI * 2 / column * ii;
                var tx = rr * rad * Math.cos(tr);
                var ty = ry * rad;
                var tz = rr * rad * Math.sin(tr);
                var rx = rr * Math.cos(tr);
                var rz = rr * Math.sin(tr);
                if(color){
                    var tc = color;
                }else{
                    tc = hsva(360 / row * i, 1, 1, 1);
                }
                pos.push(tx, ty, tz);
                nor.push(rx, ry, rz);
                col.push(tc[0], tc[1], tc[2], tc[3]);
                st.push(1 - 1 / column * ii, 1 / row * i);
            }
        }
        r = 0;
        for(i = 0; i < row; i++){
            for(ii = 0; ii < column; ii++){
                r = (column + 1) * i + ii;
                idx.push(r, r + 1, r + column + 2);
                idx.push(r, r + column + 2, r + column + 1);
            }
        }
        return {p : pos, n : nor, c : col, t : st, i : idx};
    }

    function CreateObstacles(dest, width ,height, depth){
        gl.bindFramebuffer(gl.FRAMEBUFFER , dest.FboHandle);
        gl.viewport(0,0, width * depth, height);
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        var Prg = CreateProgram('Smoke.Vertex', 'Smoke.Fill');
        // locationの初期化
        gl.useProgram(Prg);
        var ext = gl.getExtension('OES_vertex_array_object');
        var VAO = ext.createVertexArrayOES();
        ext.bindVertexArrayOES(VAO);
        var AttLocation = [];
        AttLocation.push(gl.getAttribLocation(Prg, 'Position'));
        var slice = gl.getUniformLocation(Prg, 'Slice');
        var Size = gl.getUniformLocation(Prg, 'Size');
    
        var AttStride = [];
        AttStride.push(2);
        //-1,-1,1,-1,1,1,-1,1,-1,-1
        var T= 0.999;
        var Lposition =[ -T, -T, T, -T, T,  T, -T,  T, -T, -T ];
        //position= circle({x:0,y:0}, 0.4, 100);
        var vPlane = CreateVbo(Lposition);
        var planeVBOList = [vPlane];
        SetAttribute(planeVBOList, AttLocation, AttStride);
        gl.uniform1f(Size, depth);
       for(var i =0; i< depth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.LINE_STRIP, 0, Lposition.length / 2);
        }  
        gl.deleteBuffer(vPlane);
        gl.deleteProgram(Prg);
        ext.deleteVertexArrayOES(VAO);
    }
    function ResetState(){
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
    }

    function Advect(velocity, source, obstacles, dest, dissipation){
        var p = Programs.Advect;
        gl.useProgram(p);
        var inverseSize = gl.getUniformLocation(p, 'InverseSize');
        var timeStep = gl.getUniformLocation(p, "TimeStep");
        var dissLoc = gl.getUniformLocation(p, "Dissipation");
        var slice = gl.getUniformLocation(p, "Slice");
        var size = gl.getUniformLocation(p, "Size");
        var sourceTexture = gl.getUniformLocation(p, "SourceTexture");
        var obstaclesTexture = gl.getUniformLocation(p, "Obstacles");
        gl.uniform3fv(inverseSize, [1.0 /GridWidth * GridDepth, 1.0/GridHeight, 1.0/GridDepth]);
        gl.uniform1f(timeStep, TimeStep);
        gl.uniform1f(dissLoc, dissipation);
        gl.uniform1i(sourceTexture, 1);
        gl.uniform1i(obstaclesTexture, 2);
        gl.uniform1f(size,dest.Depth);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velocity.TextureHandle);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, source.TextureHandle);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, obstacles.TextureHandle);
        for (var i = 0; i < dest.Depth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        ResetState();
    }
    function ApplyBuoyancy(velocity, temperature, density, dest){
        var p = Programs.ApplyBuoyancy;
        gl.useProgram(p);
        var scale =gl.getUniformLocation(p, 'Scale');
        gl.uniform3fv(scale, [1.0 /GridWidth * GridDepth, 1.0/GridHeight, 1.0/GridDepth]);
        var tempSampler = gl.getUniformLocation(p, "Temperature");
        var inkSampler = gl.getUniformLocation(p, "Density");
        var ambTemp = gl.getUniformLocation(p, "AmbientTemperature");
        var timeStep = gl.getUniformLocation(p, "TimeStep");
        var sigma = gl.getUniformLocation(p, "Sigma");
        var kappa = gl.getUniformLocation(p, "Kappa");
        var slice = gl.getUniformLocation(p, "Slice");
        var size = gl.getUniformLocation(p, "Size");
        gl.uniform1f(size,dest.Depth);
        gl.uniform1i(tempSampler, 1);
        gl.uniform1i(inkSampler, 2);
        gl.uniform1f(ambTemp, AmbientTemperature);
        gl.uniform1f(timeStep, TimeStep);
        gl.uniform1f(sigma, SmokeBuoyancy);
        gl.uniform1f(kappa, SmokeWeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velocity.TextureHandle);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, temperature.TextureHandle);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, density.TextureHandle);
       // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        for (var i = 0; i < dest.Depth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        ResetState();

    }
    function ApplyImpulse(dest, position , value){
        var p = Programs.ApplyImpulse;
        gl.useProgram(p);
        var pointLoc = gl.getUniformLocation(p, "Point");
        var radiusLoc = gl.getUniformLocation(p, "Radius");
        var fillColorLoc = gl.getUniformLocation(p, "FillColor");
        var slice = gl.getUniformLocation(p, "Slice");
        var size = gl.getUniformLocation(p, "Size");
        gl.uniform1f(size,dest.Depth);
        gl.uniform3fv(pointLoc, position);
        gl.uniform1f(radiusLoc,SplatRadius);
        gl.uniform3fv(fillColorLoc, [value, value, value]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.enable(gl.BLEND);
       // gl.drawArrays(gl.TRIANGLE_STRIP, 0 , 4);
        for (var i = 0; i < dest.Depth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        ResetState();
    }
    function ComputeDivergence(velocity, obstacles, dest){
        var p = Programs.ComputeDivergence;
        gl.useProgram(p);
        var halfCell = gl.getUniformLocation(p, "HalfInverseCellSize");
        gl.uniform1f(halfCell, 0.5/ CellSize);
        var scale =gl.getUniformLocation(p, 'Scale');
        gl.uniform3fv(scale, [1.0 /GridWidth * GridDepth, 1.0/GridHeight, 1.0/GridDepth]);
        //gl.uniform2fv(scale, [1.0/GridWidth, 1.0/GridHeight]);
        var sampler = gl.getUniformLocation(p, "Obstacles");
        var slice = gl.getUniformLocation(p, "Slice");
        var size = gl.getUniformLocation(p, "Size");
        gl.uniform1f(size,dest.Depth);
        gl.uniform1i(sampler, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velocity.TextureHandle);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, obstacles.TextureHandle);
       // gl.drawArrays(gl.TRIANGLE_STRIP, 0 , 4);
        for (var i = 0; i < dest.Depth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        ResetState();
    }
    function Jacobi(pressure, divergence, obstacles, dest){
        var p = Programs.Jacobi;
        gl.useProgram(p);
        var scale =gl.getUniformLocation(p, 'Scale');
        //gl.uniform2fv(scale, [1.0/GridWidth, 1.0/GridHeight]);
        gl.uniform3fv(scale, [1.0 /GridWidth * GridDepth, 1.0/GridHeight, 1.0/GridDepth]);
        var alpha = gl.getUniformLocation(p, "Alpha");
        var inverseBeta = gl.getUniformLocation(p, "InverseBeta");
        var dSampler = gl.getUniformLocation(p, "Divergence");
        var oSampler = gl.getUniformLocation(p, "Obstacles");
        var slice = gl.getUniformLocation(p, "Slice");
        var size = gl.getUniformLocation(p, "Size");
        gl.uniform1f(size,dest.Depth);
        gl.uniform1f(alpha, -CellSize * CellSize);
        gl.uniform1f(inverseBeta, 0.25);
        gl.uniform1i(dSampler, 1);
        gl.uniform1i(oSampler, 2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressure.TextureHandle);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, divergence.TextureHandle);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, obstacles.TextureHandle);
       // gl.drawArrays(gl.TRIANGLE_STRIP, 0 , 4);
        for (var i = 0; i < dest.Depth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        ResetState();
    }
    function SubtractGradient(velocity, pressure, obstacles, dest){
        var p = Programs.SubtractGradient;
        gl.useProgram(p);
        var scale =gl.getUniformLocation(p, 'Scale');
        gl.uniform3fv(scale, [1.0 /GridWidth * GridDepth, 1.0/GridHeight, 1.0/GridDepth]);
       // gl.uniform2fv(scale, [1.0/GridWidth, 1.0/GridHeight]);
        var gradientScale = gl.getUniformLocation(p, "GradientScale");
        gl.uniform1f(gradientScale, GradientScale);
        var halfCell = gl.getUniformLocation(p, "HalfInverseCellSize");
        gl.uniform1f(halfCell, 0.5/CellSize);
        var sampler = gl.getUniformLocation(p, "Pressure");
        gl.uniform1i(sampler, 1);
        sampler = gl.getUniformLocation(p, "Obstacles");
        gl.uniform1i(sampler, 2);
        var slice = gl.getUniformLocation(p, "Slice");
        var size = gl.getUniformLocation(p, "Size");
        gl.uniform1f(size,dest.Depth);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,velocity.TextureHandle);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, pressure.TextureHandle);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, obstacles.TextureHandle);     
       // gl.drawArrays(gl.TRIANGLE_STRIP, 0 , 4);
        for (var i = 0; i < dest.Depth; i++){
            gl.uniform1f(slice, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        ResetState();   
    }