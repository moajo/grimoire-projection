gr.registerComponent("Mouse", { //マウスで動かすやつ
  attributes: {
    viewportPos: {
      converter: "Vector2",
      default: "0,0"
    }
  },
  $awake: function () {
    this.__bindAttributes();
  },
  $mount: function () {
    var camera = this.tree("camera").first();
    var canvas = this.companion.get("canvasElement");
    var mouseDown = Rx.Observable.fromEvent(canvas, "mousedown");
    var mouseUp = Rx.Observable.fromEvent(canvas, "mouseup");
    var mouseMove = Rx.Observable.fromEvent(canvas, "mousemove");

    var aspect = camera.getAttribute("aspect");
    var ymax = camera.getAttribute("orthoSize");
    var xmax = ymax * aspect;
    var pos = this.node.getAttribute("position");
    this.viewportPos = [((pos.X / xmax) + 1) / 2, ((-pos.Y / ymax) + 1) / 2];

    var ismouseonP1 = false;
    Rx.Observable.fromEvent(this.node, "mouseenter").subscribe(() => {
      ismouseonP1 = true;
    });
    Rx.Observable.fromEvent(this.node, "mouseleave").subscribe(() => {
      ismouseonP1 = false;
    });

    var isp1dragging = false;
    mouseDown.filter(() => ismouseonP1).subscribe(() => {
      isp1dragging = true;
    });
    mouseUp.subscribe(() => {
      isp1dragging = false;
    });

    var drags = Rx.Observable.create(function (sub) {
      var began = false;
      mouseMove.subscribe((e) => {
        if (isp1dragging) {
          began = true;
          sub.onNext(e);
        } else if (began) {
          sub.onCompleted();
        }
      }, (e) => {
        sub.onError(e);
      })
    });

    drags.scan((acc, x) => {
      if (acc === null) {
        return { first: x, val: x, beganPos: this.node.getAttribute("position") };
      }
      return { first: acc.first, val: x, beganPos: acc.beganPos };
    }, null).repeat().subscribe((e) => {
      var aspect = camera.getAttribute("aspect");
      var ymax = camera.getAttribute("orthoSize");
      var xmax = ymax * aspect;
      var newx = (e.val.clientX - e.first.clientX) / canvas.width * 2 * xmax;
      var newy = (e.val.clientY - e.first.clientY) / canvas.height * 2 * ymax;
      this.node.setAttribute("position", [e.beganPos.X + newx, e.beganPos.Y - newy, e.beganPos.Z]);

      //update viewportPos
      var pos = this.node.getAttribute("position");
      this.viewportPos = [((pos.X / xmax) + 1) / 2, ((-pos.Y / ymax) + 1) / 2];
      // console.log(thiss.viewportPos.X, this.viewportPos.Y);

    });
  }
});

let touchableCount = 10;
gr.registerComponent("Touchable", { //タッチ。文字表示する
  attributes: {
    text: {
      converter: "String",
      default: "0"
    },
    index: {
      converter: "Number",
      default: 0
    },
    defaultColor: {
      converter: "Color4",
      default: "white"
    }
  },
  $awake: function () {
    const _this = this;
    this.node.setAttribute("nodeID", touchableCount / 255);
    touchableCount += 10;
    this.node.on("touch", function () {
      // console.log(`touch!: ${this.getAttribute("text")}`);
      // _this.node.setAttribute("color", "blue");
      // setTimeout(function () {
      //   _this.node.setAttribute("color", "white");
      // }, 100);
    });
  },
  $mount: function () {
    let text = new GomlNode(gr.nodeDeclarations.get("text"));
    text.setAttribute("size", 4);
    text.setAttribute("position", [0.2, 0, 5]);
    text.setAttribute("color", "blue");
    this.getAttributeRaw("text").watch(function (newVal) {
      text.setAttribute("text", newVal);
    }, true)
    this.node.addChild(text);
  },
  $touch: function () {
    this.node.emit("touch", this.node);
  },
  $resetColor: function () {
    this.node.setAttribute("color", this.getAttribute("defaultColor"));
  }
});

gr.registerNode("mouse-mesh", ["Mouse"], { geometry: "sphere", color: "white", scale: "1.9" }, "mesh");
gr.registerNode("touch-target", ["Touchable"], { material: "new(target)", class: "touchTarget" }, "mouse-mesh"); //ゲームのタイムアタック用ターゲット
