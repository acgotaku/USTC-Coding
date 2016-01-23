    const  AmbientTemperature = 0.0;
    const  CellSize = 1.25;
    const  ImpulseTemperature = 10.0;
    const  ImpulseDensity = 1.0;
    const  NumJacobiIterations = 40;
    const  TimeStep = 0.125;
    const  SmokeBuoyancy = 1.0;
    const  SmokeWeight = 0.05;
    const  GradientScale = 1.125 / CellSize;
    const  TemperatureDissipation = 0.99;
    const  VelocityDissipation = 0.99;
    const  DensityDissipation = 0.9999;

    var run = true;
    var c = document.getElementById('canvas');
    c.width = Math.min(window.innerWidth, window.innerHeight);
    c.height = c.width;
    var GridWidth = c.width / 2;
    var GridHeight = c.height / 2;
    const SplatRadius = GridWidth /8.0;
    const ImpulsePosition = [ GridWidth / 2, - SplatRadius / 2];
    var VisualizeProgram, Obstacles, Velocity, Density, Pressure ,Temperature, Divergence, QuadVao , HireObstacles;
    var gl = c.getContext('webgl');
    Initialize(c.width,c.height);
    render();
    function render(){
        var width = c.width;
        var height = c.height;
       Update(c.width, c.height);
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
    function Initialize(width, height){
        var w = GridWidth;
        var h = GridHeight;
        Velocity = CreateSlab(w, h, 2);
        Density = CreateSlab(w, h, 1);
        Pressure = CreateSlab(w, h, 1);
        Temperature = CreateSlab(w, h, 1);
        Divergence = CreateSurface(w, h, 3);
        InitSlabOps();
        VisualizeProgram = create_program("Vertex", "Visualize");
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
    function Update(width, height){
        gl.viewport(0, 0, GridWidth, GridHeight);

        Advect(Velocity.Ping, Velocity.Ping, Obstacles, Velocity.Pong, VelocityDissipation);
        SwapSurfaces(Velocity);

        Advect(Velocity.Ping, Temperature.Ping, Obstacles, Temperature.Pong, TemperatureDissipation);
        SwapSurfaces(Temperature);

        Advect(Velocity.Ping, Density.Ping, Obstacles, Density.Pong, DensityDissipation);
        SwapSurfaces(Density);

        ApplyBuoyancy(Velocity.Ping, Temperature.Ping, Density.Ping, Velocity.Pong);
        SwapSurfaces(Velocity);
        ApplyImpulse(Temperature.Ping, ImpulsePosition, ImpulseTemperature);
        ApplyImpulse(Density.Ping, ImpulsePosition, ImpulseDensity);
        
        ComputeDivergence(Velocity.Ping, Obstacles, Divergence);
        ClearSurface(Pressure.Ping, 0);
        for (var i= 0; i < NumJacobiIterations; ++i){
            Jacobi(Pressure.Ping, Divergence, Obstacles, Pressure.Pong);
            SwapSurfaces(Pressure);
        }
        SubtractGradient(Velocity.Ping, Pressure.Ping, Obstacles, Velocity.Pong);
        SwapSurfaces(Velocity);
    }
    function create_ibo(data){
        var ibo = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return ibo;
    }

    function set_attribute(vbo, attL, attS){
        for (var i in vbo){
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
            gl.enableVertexAttribArray(attL[i]);
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }

    function create_shader(id){
        var shader;
        var scriptElement = document.getElementById(id);
        if(!scriptElement){
            return;
        }
        switch(scriptElement.type){
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default:
                return;
        }

        gl.shaderSource(shader,scriptElement.text);

        gl.compileShader(shader);

        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){

            return shader;
        }else{
            console.log(id +" "+ gl.getShaderInfoLog(shader));
        }
    }

    function create_program(vs, fs){
        var program = gl.createProgram();
        var v_shader, f_shader;
        v_shader = create_shader(vs);
        f_shader = create_shader(fs);
        gl.attachShader(program, v_shader);
        gl.attachShader(program, f_shader);

        gl.linkProgram(program);

        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            console.log(gl.getProgramInfoLog(program));
        }
    }



    function create_vbo(data){
        var vbo = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vbo;
    }
    function ResetState(){
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
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
        Programs.Advect = create_program("Vertex", "Advect");
        Programs.Jacobi = create_program("Vertex", "Jacobi");
        Programs.SubtractGradient = create_program("Vertex", "SubtractGradient");
        Programs.ComputeDivergence = create_program("Vertex", "ComputeDivergence");
        Programs.ApplyImpulse = create_program("Vertex", "Splat");
        Programs.ApplyBuoyancy = create_program("Vertex", "Buoyancy");
    }
    function SwapSurfaces(slab){
        var temp = slab.Ping;
        slab.Ping = slab.Pong;
        slab.Pong =temp;
    }
    function Advect(velocity, source, obstacles, dest, dissipation){
        var p = Programs.Advect;
        gl.useProgram(p);
        var inverseSize = gl.getUniformLocation(p, 'InverseSize');
        var timeStep = gl.getUniformLocation(p, "TimeStep");
        var dissLoc = gl.getUniformLocation(p, "Dissipation");
        var sourceTexture = gl.getUniformLocation(p, "SourceTexture");
        var obstaclesTexture = gl.getUniformLocation(p, "Obstacles");
        gl.uniform2fv(inverseSize, [1.0 /GridWidth, 1.0/GridHeight]);
        gl.uniform1f(timeStep, TimeStep);
        gl.uniform1f(dissLoc, dissipation);
        gl.uniform1i(sourceTexture, 1);
        gl.uniform1i(obstaclesTexture, 2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velocity.TextureHandle);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, source.TextureHandle);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, obstacles.TextureHandle);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        ResetState();
    }
    function ApplyBuoyancy(velocity, temperature, density, dest){
        var p = Programs.ApplyBuoyancy;
        gl.useProgram(p);
        var scale =gl.getUniformLocation(p, 'Scale');
        gl.uniform2fv(scale, [1.0/GridWidth, 1.0/GridHeight]);
        var tempSampler = gl.getUniformLocation(p, "Temperature");
        var inkSampler = gl.getUniformLocation(p, "Density");
        var ambTemp = gl.getUniformLocation(p, "AmbientTemperature");
        var timeStep = gl.getUniformLocation(p, "TimeStep");
        var sigma = gl.getUniformLocation(p, "Sigma");
        var kappa = gl.getUniformLocation(p, "Kappa");
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
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        ResetState();

    }
    function ApplyImpulse(dest, position , value){
        var p = Programs.ApplyImpulse;
        gl.useProgram(p);
        var pointLoc = gl.getUniformLocation(p, "Point");
        var radiusLoc = gl.getUniformLocation(p, "Radius");
        var fillColorLoc = gl.getUniformLocation(p, "FillColor");
        gl.uniform2fv(pointLoc, position);
        gl.uniform1f(radiusLoc,SplatRadius);
        gl.uniform3fv(fillColorLoc, [value, value, value]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.enable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0 , 4);
        ResetState();
    }
    function ComputeDivergence(velocity, obstacles, dest){
        var p = Programs.ComputeDivergence;
        gl.useProgram(p);
        var halfCell = gl.getUniformLocation(p, "HalfInverseCellSize");
        var scale =gl.getUniformLocation(p, 'Scale');
        gl.uniform1f(halfCell, 0.5/ CellSize);
        gl.uniform2fv(scale, [1.0/GridWidth, 1.0/GridHeight]);
        var sampler = gl.getUniformLocation(p, "Obstacles");
        gl.uniform1i(sampler, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velocity.TextureHandle);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, obstacles.TextureHandle);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        ResetState();
    }
    function Jacobi(pressure, divergence, obstacles, dest){
        var p = Programs.Jacobi;
        gl.useProgram(p);
        var scale =gl.getUniformLocation(p, 'Scale');
        gl.uniform2fv(scale, [1.0/GridWidth, 1.0/GridHeight]);
        var alpha = gl.getUniformLocation(p, "Alpha");
        var inverseBeta = gl.getUniformLocation(p, "InverseBeta");
        var dSampler = gl.getUniformLocation(p, "Divergence");
        var oSampler = gl.getUniformLocation(p, "Obstacles");
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
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        ResetState();
    }
    function SubtractGradient(velocity, pressure, obstacles, dest){
        var p = Programs.SubtractGradient;
        gl.useProgram(p);
        var scale =gl.getUniformLocation(p, 'Scale');
        gl.uniform2fv(scale, [1.0/GridWidth, 1.0/GridHeight]);
        var gradientScale = gl.getUniformLocation(p, "GradientScale");
        gl.uniform1f(gradientScale, GradientScale);
        var halfCell = gl.getUniformLocation(p, "HalfInverseCellSize");
        gl.uniform1f(halfCell, 0.5/CellSize);
        var sampler = gl.getUniformLocation(p, "Pressure");
        gl.uniform1i(sampler, 1);
        sampler = gl.getUniformLocation(p, "Obstacles");
        gl.uniform1i(sampler, 2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.FboHandle);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,velocity.TextureHandle);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, pressure.TextureHandle);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, obstacles.TextureHandle);     
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        ResetState();   
    }
    //CreateSlab.c
    function Surface(FboHandle, TextureHandle, NumComponents){
        var object={};
        object.FboHandle = FboHandle;
        object.TextureHandle = TextureHandle;
        object.NumComponents = NumComponents;
        return object;
    }
    function Slab(Ping, Pong){
        var object={};
        object.Ping = Ping;
        object.Pong = Pong;
        return object;
    }
    function CreateSurface(width, height, numComponents){
        var frameBuffer  = create_framebuffer(width, height, gl.FLOAT);
        var surface =Surface(frameBuffer.f , frameBuffer.t, numComponents);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return surface;
    }
    function ClearSurface(s, v){
        gl.bindFramebuffer(gl.FRAMEBUFFER, s.FboHandle);
        gl.clearColor(v, v, v, v);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    function CreateSlab(width, height, numComponents){
        var slab = Slab();
        slab.Ping = CreateSurface(width, height, numComponents);
        slab.Pong = CreateSurface(width, height, numComponents);
        return slab;
    }
    // フレームバッファをオブジェクトとして生成する関数
    function create_framebuffer(width, height, format){
        // フォーマットチェック
        var textureFormat = null;
        if(!format){
            textureFormat = gl.UNSIGNED_BYTE;
        }else{
            textureFormat = format;
        }
        var ext;
        ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float');
        if(ext == null){
            alert('float texture not supported');
        }
        // フレームバッファの生成
        var frameBuffer = gl.createFramebuffer();
        
        // フレームバッファをWebGLにバインド
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        
        // 深度バッファ用レンダーバッファの生成とバインド
        var depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        
        // レンダーバッファを深度バッファとして設定
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        
        // フレームバッファにレンダーバッファを関連付ける
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
        
        // フレームバッファ用テクスチャの生成
        var fTexture = gl.createTexture();
        
        // フレームバッファ用のテクスチャをバインド
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        
        // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, textureFormat, null);
        
        // テクスチャパラメータ
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // フレームバッファにテクスチャを関連付ける
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
        
        // 各種オブジェクトのバインドを解除
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        // オブジェクトを返して終了
        return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
    }
    //CreateSlab.c end
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
        var Plane = create_vbo(position);
        var VBOList = [Plane];
        set_attribute(VBOList,[0],[2]);
        return VAO;
    }
    function circle(center, radius, slices){
        var pos = new Array();
        var stepSize =((2*Math.PI)/slices);
        pos.push(center.x, center.y);
        for (var i=0;i<=slices; i++){
            var angle =stepSize * (i+1);
            pos.push((Math.sin(angle)* radius + center.x),(Math.cos(angle)* radius +center.y));
        }
        return pos;
    }
    function CreateObstacles(dest, width ,height){
        gl.bindFramebuffer(gl.FRAMEBUFFER , dest.FboHandle);
        gl.viewport(0,0, width, height);
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        var Prg = create_program('Vertex', 'Fill');
        // locationの初期化
        gl.useProgram(Prg);
        var ext = gl.getExtension('OES_vertex_array_object');
        var VAO = ext.createVertexArrayOES();
        ext.bindVertexArrayOES(VAO);
        var AttLocation = [];
        AttLocation.push(gl.getAttribLocation(Prg, 'Position'));
        var AttStride = [];
        AttStride.push(2);
        //-1,-1,1,-1,1,1,-1,1,-1,-1
        var Lposition =[
                -0.9999,-0.9999, 
                 0.9999,-0.9999,
                 0.9999, 0.9999,
                -0.9999, 0.9999,
                -0.9999,-0.9999
        ];
        //position= circle({x:0,y:0}, 0.4, 100);
        var vPlane = create_vbo(Lposition);
        var planeVBOList = [vPlane];
        set_attribute(planeVBOList, AttLocation, AttStride);
        gl.drawArrays(gl.LINE_STRIP, 0, Lposition.length / 2);
        gl.deleteBuffer(vPlane);

        var Cposition =circle({x:0,y:0.3}, 0.3, 100);
        var vCircle = create_vbo(Cposition);
        var circleVBOList = [vCircle];
        set_attribute(circleVBOList, AttLocation, AttStride);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, Cposition.length / 2);
        gl.deleteBuffer(vCircle);
        gl.deleteProgram(Prg);

    }