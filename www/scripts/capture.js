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
      buf.setAttribute("name", `diff_${i}`);
      this.textureBuffers.push(buf);
      this.node.addChild(buf);
    }
  },

  $bufferUpdated: function (args) {
    // const out = this.getAttribute("out");
    // if (out !== "default") {
    this.fboArray = [];
    // this._fbo = [];
    const bufferCount = this.getAttribute("bufferCount");
    for (var i = 0; i < bufferCount; i++) {
      this.fboArray[i] = { name: `diff_${i}`, fbo: new Framebuffer(this.companion.get("gl")) };
      this.fboArray[i].fbo.update(args.buffers[`diff_${i}`]);
      // this._fbo[i] = new Framebuffer(this.companion.get("gl"));
      // this._fbo[i].update(args.buffers[`diff_${i}`]);
    }
    this._fboSize = args.bufferSizes["diff_0"];
    console.log("updateBuffer!");
    console.log(args);
    this.renderCount = 0;

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
    const bufferCount = this.getAttribute("bufferCount");
    this.renderCount++;
    const index = this.renderCount % bufferCount;
    // bound render target
    // if (this._fbo) {
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

    // this.fboArray.forEach(obj => {
    //   obj.fbo.bind();
    //   this._gl.viewport(0, 0, this._fboSize.width, this._fboSize.height);
    //   // make rendering argument
    //   const renderArgs = {
    //     targetBuffer: this._targetBuffer,
    //     geometry: this._geom,
    //     attributeValues: {},
    //     camera: null,
    //     transform: null,
    //     buffers: args.buffers,
    //     viewport: args.viewport,
    //     technique: this._technique
    //   };
    //   renderArgs.attributeValues = this._materialContainer.materialArgs;
    //   // do render
    //   this._materialContainer.material.draw(renderArgs);
    //   this._gl.flush();
    //
    // });
    this.getAttribute("next").sendMessage("updateBufferArray", { count: this.renderCount, array: this.fboArray });
    // }

  }
});

gr.registerComponent("BufferArrayReciever", { //バッファ受けてシェーダに渡す。
  $updateBufferArray: function (obj) {
    const list = obj.array;
    const bufferCount = list.length;
    const index = obj.count % bufferCount;
    console.log("recieve!!!!!!!:" + index);
    // console.log(list[0]);
    this.node.setAttribute("source", `backbuffer(${list[obj.count % bufferCount].name})`);
    this.node.setAttribute("source2", `backbuffer(${list[(obj.count-1) % bufferCount].name})`);
    // this.node.setAttribute("source", list[2].name);
  }
});

gr.registerNode("render-buffer-array", ["MaterialContainer", "RenderDiff"], { material: null });
gr.registerNode("render-diff", ["BufferArrayReciever"], {}, "render-quad");
