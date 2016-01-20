    var run = false;
    var c = document.getElementById('canvas');
    c.width = Math.min(window.innerWidth, window.innerHeight);
    c.height = c.width;
    var gl = c.getContext('webgl');
    var ext;
    ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float');
    if(ext == null){
        alert('float texture not supported');
    }

    var Prg = create_program('Vertex', 'Fill');

 
    // locationの初期化
    var AttLocation = [];
    AttLocation.push(gl.getAttribLocation(Prg, 'Position'));
    var AttStride = [];
    AttStride.push(2);
    //-1,-1,1,-1,1,1,-1,1,-1,-1
    var position =[
            -1.0,-1.0, 
             1.0,-1.0,
             1.0, 1.0,
            -1.0, 1.0,
            -1.0,-1.0
    ];
    position= circle({x:0,y:0}, 0.4, 100);
    var vPlane = create_vbo(position);
    var planeVBOList = [vPlane];
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    render();

    function render(){
        
        gl.viewport(0, 0, c.width, c.height);
        
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(Prg);
        
        set_attribute(planeVBOList, AttLocation, AttStride);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, position.length / 2);
        gl.flush();
        
       // if(run){requestAnimationFrame(render);}
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
        var frameBuffer  = create_framebuffer(TEXTURE_WIDTH, TEXTURE_WIDTH, gl.FLOAT);
        var surface =Surface(frameBuffer.f , frameBuffer.t, numComponents);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return surface;
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