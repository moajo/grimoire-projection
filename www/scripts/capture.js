const Framebuffer = gr.lib.fundamental.Resource.FrameBuffer;
/**
 * ソースのテクスチャを数フレーム保持するだけ。nextに毎フレーム通知する。
 * @type {Object}
 */
gr.registerComponent("RenderDiff", {
  attributes: {
    targetBuffer: {
      default: "default",
      converter: "String",
    },
    technique: {
      default: "default",
      converter: "String"
    },
    bufferCount: {
      default: 2,
      converter: "Number"
    },
    next: {
      default: null,
      converter: "Node"
    },
    arrayName: {
      default: "diff",
      converter: "String"
    }
  },

  $awake: function () {
    this.getAttributeRaw("targetBuffer").boundTo("_targetBuffer");
    this.getAttributeRaw("technique").boundTo("_technique");
  },

  $mount: function () {
    this._gl = this.companion.get("gl");
    this._canvas = this.companion.get("canvasElement");
    this._geom = this.companion.get("GeometryRegistory").getGeometry("quad");
    this._materialContainer = this.node.getComponent("MaterialContainer");


    // create buffer array
    const tbd = gr.nodeDeclarations.get("texture-buffer");
    this.textureBuffers = [];
    const bufferCount = this.getAttribute("bufferCount");
    for (var i = 0; i < bufferCount; i++) {
      const buf = new GomlNode(tbd);
      buf.setAttribute("name", `${this.getAttribute("arrayName")}_${i}`);
      this.textureBuffers.push(buf);
      this.node.addChild(buf);
    }
  },

  $bufferUpdated: function (args) {
    this.fboArray = [];
    // this._fbo = [];
    const bufferCount = this.getAttribute("bufferCount");
    for (var i = 0; i < bufferCount; i++) {
      this.fboArray[i] = { name: `diff_${i}`, fbo: new Framebuffer(this.companion.get("gl")) };
      this.fboArray[i].fbo.update(args.buffers[`${this.getAttribute("arrayName")}_${i}`]);
      // this._fbo[i] = new Framebuffer(this.companion.get("gl"));
      // this._fbo[i].update(args.buffers[`diff_${i}`]);
    }
    this._fboSize = args.bufferSizes[`${this.getAttribute("arrayName")}_0`];
    // console.log("updateBuffer!");
    // console.log(args);
    this.renderCount = 0;
  },

  $render: function (args) {
    if (!this._materialContainer.materialReady) {
      return;
    }
    const bufferCount = this.getAttribute("bufferCount");
    this.renderCount++;
    const index = this.renderCount % bufferCount;
    // bound render target
    const obj = this.fboArray[index];
    obj.fbo.bind();
    this._gl.viewport(0, 0, this._fboSize.width, this._fboSize.height);
    // make rendering argument
    const renderArgs = {
      targetBuffer: this._targetBuffer,
      geometry: this._geom,
      attributeValues: {},
      camera: null,
      transform: null,
      buffers: args.buffers,
      viewport: args.viewport,
      technique: this._technique
    };
    renderArgs.attributeValues = this._materialContainer.materialArgs;
    // do render
    this._materialContainer.material.draw(renderArgs);
    this._gl.flush();

    this.getAttribute("next").sendMessage("updateBufferArray", { count: this.renderCount, array: this.fboArray });
  }
});

gr.registerComponent("BufferArrayReciever", { //バッファ受けてシェーダに渡す。
  $updateBufferArray: function (obj) {
    const list = obj.array;
    const bufferCount = list.length;
    // console.log(`recieve: ${bufferCount}`)
    // const index = obj.count % bufferCount;
    for (var i = 0; i < bufferCount; i++) {
      const name = list[(obj.count - i + bufferCount) % bufferCount].name;
      const varName = `source${i}`;
      this.node.setAttribute(varName, `backbuffer(${name})`);
    }
  }
});

// gr.registerComponent("DetectTouch",{//動体と重なってるか判定するやつ
//   $mount:function() {
//     this._sceneRenderer = this.node.getComponent(RenderSceneComponent);
//     if (!this._sceneRenderer) {
//       throw new Error("The node attaching RenderHitArea should contain RenderScene.")
//     }
//     this._gl = this.companion.get("gl");
//     this._canvas = this.companion.get("canvasElement");
//     this.hitareaTexture = new Texture2D(this._gl);
//     this.hitareaRenderbuffer = new RenderBuffer(this._gl);
//     if (this.hitareaFBO) {
//       this.hitareaFBO.destroy();
//       this.hitareaFBO = null;
//     }
//   },
//   $resizeBuffer:function(args) {
//     const size = TextureSizeCalculator.getPow2Size(args.width, args.height);
//     this._bufferSize = [size.width, size.height];
//     this.hitareaTexture.update(0, size.width, size.height, 0, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE);
//     this.hitareaRenderbuffer.update(WebGLRenderingContext.DEPTH_COMPONENT16, size.width, size.height);
//     if (!this.hitareaFBO) {
//       this.hitareaFBO = new Framebuffer(this._gl);
//       this.hitareaFBO.update(this.hitareaTexture);
//       this.hitareaFBO.update(this.hitareaRenderbuffer);
//     }
//   },
//   $render:function(args) {
//     this.hitareaFBO.bind();
//     this._gl.viewport(0, 0, this._bufferSize[0], this._bufferSize[1]);
//     // clear buffer if needed
//     this._gl.clearColor(0, 0, 0, 0);
//     this._gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
//     this._gl.clearDepth(1);
//     this._gl.clear(WebGLRenderingContext.DEPTH_BUFFER_BIT);
//     const camera = this._sceneRenderer.camera || args.camera;
//     camera.renderScene({
//       renderer: this._sceneRenderer, // TODO
//       camera: camera,
//       buffers: args.buffers,
//       layer: this._sceneRenderer.layer,
//       viewport: args.viewport,
//       loopIndex: args.loopIndex,
//       technique: "hitarea",
//       sceneDescription: {}
//     });
//     this._gl.flush();
//     this._gl.readPixels(this._lastPosition[0] * this._bufferSize[0], this._lastPosition[1] * this._bufferSize[1], 1, 1, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, this._readCache);
//     const index = MeshIndexCalculator.fromColor(this._readCache);
//     if (index === 0) { // there was no object at pointer
//       if (this._lastRenderable instanceof Component) {
//         this._lastRenderable.node.emit("mouseleave", this._lastRenderable);
//       }
//       this._lastRenderable = null;
//     } else {
//       const r = camera.containedScene.queueRegistory.getByIndex(index - 1);
//       if (this._lastRenderable !== r) {
//         if (this._lastRenderable instanceof Component) {
//           this._lastRenderable.node.emit("mouseleave", this._lastRenderable);
//         }
//         if (r instanceof Component) {
//           r.node.emit("mouseenter", r);
//         }
//       } else {
//         if (r instanceof Component) {
//           if (this._mouseMoved) {
//             r.node.emit("mousemove", r);
//           } else {
//             r.node.emit("mouseon", r);
//           }
//         }
//       }
//       this._lastRenderable = r;
//     }
//     this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
//   }
//
// });

gr.registerNode("render-buffer-array", ["MaterialContainer", "RenderDiff"], { material: null });
gr.registerNode("render-diff", ["BufferArrayReciever"], {}, "render-quad");
