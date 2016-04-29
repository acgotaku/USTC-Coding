window.Lib = (function () {
    var gl =document.getElementById('canvas').getContext('webgl') || document.getElementById('canvas').getContext('experimental-webgl');
    var ext = gl.getExtension('OES_texture_float');
    ext = gl.getExtension('OES_texture_float_linear');
    var Lib = {
        CreateIbo: function (data) {
            var ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return ibo;
        },
        CreateVbo:function(data){
            var vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            return vbo; 
        },
        SetAttribute:function(vbo, attL, attS){
            for (var i in vbo){
                gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
                gl.enableVertexAttribArray(attL[i]);
                gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
            }
        },
        CreateShader:function(id){
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
        },
        CreateProgram:function(vs,fs){
            var program = gl.createProgram();
            var v_shader, f_shader;
            v_shader = this.CreateShader(vs);
            f_shader = this.CreateShader(fs);
            gl.attachShader(program, v_shader);
            gl.attachShader(program, f_shader);
            gl.linkProgram(program);
            if(gl.getProgramParameter(program, gl.LINK_STATUS)){
                gl.useProgram(program);
                return program;
            }else{
                console.log( vs +" "+ fs +"\n"+gl.getProgramInfoLog(program));
            }
        },
        CreateFramebuffer:function(width, height, format){
            var textureFormat = null;
            if(!format){
                textureFormat = gl.UNSIGNED_BYTE;
            }else{
                textureFormat = format;
            }
            // generate frame buffer
            var frameBuffer = gl.createFramebuffer();
            
            //bind the framebuffer to WebGL
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            
            // generate and bind renderbuffer for depthbuffer
            var depthRenderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
            
            // set the renderbuffer as a depth buffer
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            
            // Associate the renderbuffer to the frame buffer
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
            
            // generate the texture for the frame buffer
            var fTexture = gl.createTexture();
            
            // To bind the texture for the frame buffer
            gl.bindTexture(gl.TEXTURE_2D, fTexture);
            
            // set the texture memory at framebuffer
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, textureFormat, null);
            
            // texture parameter
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  
            // associate  texture to the framebuffer
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
            
            // unbind the various objects 
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            
            // return the object
            return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
        }




    };
     
    return Lib;
}());