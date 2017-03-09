const Framebuffer = gr.lib.fundamental.Resource.FrameBuffer;
gr.registerComponent("RenderDiff", {
  attributes: {
    targetBuffer: {
      default: "default",
      converter: "String",
    },
    // clearColor: {
    //   default: "#0000",
    //   converter: "Color4",
    // },
    // clearColorEnabled: {
    //   default: true,
    //   converter: "Boolean",
    // },
    // clearDepthEnabled: {
    //   default: true,
    //   converter: "Boolean",
    // },
    // clearDepth: {
    //   default: 1.0,
    //   converter: "Number",
    // },
    technique: {
      default: "default",
      converter: "String"
    },
    bufferCount: {
      default: 10,
      converter: "Number"
    }
  },

  $awake: function () {
    this.getAttributeRaw("targetBuffer").boundTo("_targetBuffer");
    // this.getAttributeRaw("clearColor").boundTo("_clearColor");
    // this.getAttributeRaw("clearColorEnabled").boundTo("_clearColorEnabled");
    // this.getAttributeRaw("clearDepthEnabled").boundTo("_clearDepthEnabled");
    // this.getAttributeRaw("clearDepth").boundTo("_clearDepth");
    this.getAttributeRaw("technique").boundTo("_technique");

    this.textureBuffers = [];

  },

  $mount: function () {
    this._gl = this.companion.get("gl");
    this._canvas = this.companion.get("canvasElement");
    const geometryRegistory = this.companion.get("GeometryRegistory");
    this._geom = geometryRegistory.getGeometry("quad");
    this._materialContainer = this.node.getComponent("MaterialContainer");

    const tbd = gr.nodeDeclarations.get("texture-buffer");
    this.textureBuffers = [];
    const bufferCount = this.getAttribute("bufferCount");
    for (var i = 0; i < bufferCount; i++) {
      const buf = new GomlNode(tbd);
      buf.setAttribute("name", `diff_${i}`);
      this.textureBuffers.push(buf);
      this.node.addChild(buf);
    }
  },

  $bufferUpdated: function (args) {
    // const out = this.getAttribute("out");
    // if (out !== "default") {
    this._fbo = [];
    const bufferCount = this.getAttribute("bufferCount");
    for (var i = 0; i < bufferCount; i++) {
      this._fbo[i] = new Framebuffer(this.companion.get("gl"));
      this._fbo[i].update(this.textureBuffers[i]);
    }
    this._fboSize = args.bufferSizes[0];

    //rergister buffer uniform
    const UniformResolverRegistry = gr.lib.fundamental.Material.UniformResolverRegistry;
    UniformResolverRegistry.add("DIFF_1", (valinfo) => (proxy) => {
      proxy.uniformMatrix(valinfo.name, this._fbo[0]);
    });
    // }
    // const depthBuffer = this.getAttribute("depthBuffer");
    // if (depthBuffer && this._fbo) {
    //   this._fbo.update(args.buffers[depthBuffer]);
    // }
  },

  $render: function (args) {
    if (!this._materialContainer.materialReady) {
      return;
    }
    // bound render target
    if (this._fbo) {
      this._fbo.forEach(fbo => {
        fbo.bind();
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
      });
    } else {
      // this._gl.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
      // this._gl.viewport(args.viewport.Left, this._canvas.height - args.viewport.Bottom, args.viewport.Width, args.viewport.Height);
    }
    // clear buffer if needed
    // if (this._fbo && this._clearColorEnabled) {
    //   this._gl.clearColor(this._clearColor.R, this._clearColor.G, this._clearColor.B, this._clearColor.A);
    //   this._gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
    // }
    // if (this._clearDepthEnabled) {
    //   this._gl.clearDepth(this._clearDepth);
    //   this._gl.clear(WebGLRenderingContext.DEPTH_BUFFER_BIT);
    // }

  }
});

gr.registerNode("render-diff", ["MaterialContainer", "RenderDiff"], { material: null });
