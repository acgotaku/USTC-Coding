    var run = true;
    var c = document.getElementById('canvas');
    c.width = Math.min(window.innerWidth, window.innerHeight);
    c.height = c.width;
    var gl = c.getContext('webgl');
    var ext;
    ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float');
    if(ext == null){
        alert('float texture not supported');
    }

    var Prg = create_program('Sphere.VS', 'Sphere.FS');

 
    // locationの初期化
    var AttLocation = [];
    AttLocation.push(gl.getAttribLocation(Prg, 'position'));
    AttLocation.push(gl.getAttribLocation(Prg, 'normal'));
    AttLocation.push(gl.getAttribLocation(Prg, 'color'));
    var AttStride = [];
    AttStride.push(3);
    AttStride.push(3);
    AttStride.push(4);
    //-1,-1,1,-1,1,1,-1,1,-1,-1
    var uniLocation = new Array();
    uniLocation.push(gl.getUniformLocation(Prg, 'mvpMatrix'));
    uniLocation.push(gl.getUniformLocation(Prg, 'mMatrix'));
    uniLocation.push(gl.getUniformLocation(Prg, 'invMatrix'));
    uniLocation.push(gl.getUniformLocation(Prg, 'lightPosition'));
    uniLocation.push(gl.getUniformLocation(Prg, 'eyeDirection'));
    uniLocation.push(gl.getUniformLocation(Prg, 'ambientColor'));
    var m = new matIV();
    
    // 各種行列の生成と初期化
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    var invMatrix = m.identity(m.create());
    
    // 点光源の位置
    var lightPosition = [0.25, 0.25, 1.0];
    
    // 環境光の色
    var ambientColor = [0.125, 0.125, 0.0, 1.0];
    
    // 視点ベクトル
    var eyeDirection = [0.0, 0.0, 7.0];
    m.lookAt(eyeDirection, [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);
    var position =[
            -1.0,-1.0, 
             1.0,-1.0,
             1.0, 1.0,
            -1.0, 1.0,
            -1.0,-1.0
    ];
    //position= circle({x:0,y:0}, 0.4, 100);
    var sphereData    = sphere(64, 64, 0.8);
    var sPosition = create_vbo(sphereData.p);
    var sNormal   = create_vbo(sphereData.n);
    var sColor    = create_vbo(sphereData.c);
    var sVBOList  = [sPosition, sNormal, sColor];
    
    // 球体用IBOの生成
    var sIndex = create_ibo(sphereData.i);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    var count = 0;
    render();

    function render(){
        
        gl.viewport(0, 0, c.width, c.height);
        
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        count++;
        
        // カウンタを元にラジアンと各種座標を算出
        var rad = (count % 360) * Math.PI / 180;
        var tx = Math.cos(rad) * 0.5;
        var ty = Math.sin(rad) * 0.5;
        var tz = Math.sin(rad) * 0.5;
        
        // トーラスのVBOとIBOをセット
        set_attribute(sVBOList, AttLocation, AttStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sIndex);
        
        // モデル座標変換行列の生成
        m.identity(mMatrix);
        m.translate(mMatrix, [tx, -ty, -tz], mMatrix);
        m.rotate(mMatrix, -rad, [0, 1, 1], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        m.inverse(mMatrix, invMatrix);

        gl.useProgram(Prg);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
        gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
        gl.uniform3fv(uniLocation[3], lightPosition);
        gl.uniform3fv(uniLocation[4], eyeDirection);
        gl.uniform4fv(uniLocation[5], ambientColor);
        gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);
        gl.flush();
        
        if(run){requestAnimationFrame(render);}
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
function sphere(row, column, rad, color){
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