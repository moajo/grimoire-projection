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
    const bufferCount = this.getAttribute("bufferCount");
    for (var i = 0; i < bufferCount; i++) {
      this.fboArray[i] = { name: `${this.getAttribute("arrayName")}_${i}`, fbo: new Framebuffer(this.companion.get("gl")) };
      this.fboArray[i].fbo.update(args.buffers[`${this.getAttribute("arrayName")}_${i}`]);
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
    // console.log(`index: ${index} name: ${obj.name}`);

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
      technique: "default"
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
      // console.log(`name:${varName} ${name}`);
      this.node.setAttribute(varName, `backbuffer(${name})`);
    }
  }
});

gr.registerComponent("RenderTouchTarget", { //ヒットしてるオブジェクトのIDを探す
  attributes: {
    out: {
      default: "default",
      converter: "String"
    },
    targetBuffer: {
      default: "default",
      converter: "String",
    }
  },
  $awake: function () {
    this.getAttributeRaw("targetBuffer").boundTo("_targetBuffer");
  },
  $mount: function () {
    this._gl = this.companion.get("gl");
    this._canvas = this.companion.get("canvasElement");
    const gr = this.companion.get("GeometryRegistory");
    this._geom = gr.getGeometry("quad");
    this._materialContainer = this.node.getComponent("MaterialContainer");
  },
  $bufferUpdated(args) {
    const out = this.getAttribute("out");
    if (out !== "default") {
      this._fbo = new Framebuffer(this.companion.get("gl"));
      this._fbo.update(args.buffers[out]);
      this._fboSize = args.bufferSizes[out];
      this.pixels = new Uint8Array(this._fboSize.width * this._fboSize.height * 4);
    } else {
      throw new Error("aaaa");
    }
  },
  $render: function (args) {
    if (!this._materialContainer.materialReady) {
      return;
    }
    // bound render target
    this._fbo.bind();
    this._gl.viewport(0, 0, this._fboSize.width, this._fboSize.height);

    // clear buffer if needed
    if (this._fbo && this._clearColorEnabled) {
      this._gl.clearColor(this._clearColor.R, this._clearColor.G, this._clearColor.B, this._clearColor.A);
      this._gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
    }
    // make rendering argument
    const renderArgs = {
      targetBuffer: this._targetBuffer,
      geometry: this._geom,
      attributeValues: {},
      camera: null,
      transform: null,
      buffers: args.buffers,
      viewport: args.viewport,
      technique: "default"
    };
    renderArgs.attributeValues = this._materialContainer.materialArgs;
    // do render
    this._materialContainer.material.draw(renderArgs);
    this._gl.flush();

    this._gl.readPixels(0, 0, this._fboSize.width, this._fboSize.height, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, this.pixels);
    const targets = gr("*")(".touchTarget").toArray();
    const map = {};
    targets.forEach(t => {
      const id = t.getAttribute("nodeID") * 255;
      map[Math.round(id)] = { node: t, count: 0 };
    })
    for (var i = 0; i < this.pixels.length; i += 4) {
      const col = this.pixels[i];
      if (col === 0) {
        continue;
      }
      map[col].count++;
    }
    for (var i = 1; i < targets.length + 1; i++) {
      const t = map[i];
      if (t.count > 20) {
        t.node.sendMessage("touch");
      }
    }
  }

});

gr.registerNode("render-buffer-array", ["MaterialContainer", "RenderDiff"], { material: null });
gr.registerNode("render-diff", ["BufferArrayReciever"], {}, "render-quad");
gr.registerNode("render-touch-detect", ["MaterialContainer", "RenderTouchTarget"], {});
