const GomlNode = gr.Node.GomlNode;

gr.registerComponent("TimeAttackGameManager", {
  attributes: {
    targetCount: {
      converter: "Number",
      default: "5"
    },
    currentTime: {
      converter: "Number",
      default: "0"
    }
  },
  $awake: function () {
    this.__bindAttributes();
    this.targets = []; //position list for touch targets.
    this.targetNodeDec = gr.nodeDeclarations.get("touch-target");
    this.recordTime = 0;
  },
  $mount: function () {

  },
  $setup: function () {
    console.log("setup!");
    const targetCount = this.targetCount;

    // setup target list
    while (this.targets.length < targetCount) {
      let node = new GomlNode(this.targetNodeDec);
      node.setAttribute("text", `${this.targets.length}`)
      node.setAttribute("id", `target_${this.targets.length}`)
      this.targets.push(node);
      this.node.addChild(node);
    }

    //set time indicator
    let timeIndicator = new GomlNode(gr.nodeDeclarations.get("text"));
    timeIndicator.setAttribute("text", "0,0");
    timeIndicator.setAttribute("id", "timeIndicator");
    this.node.addChild(timeIndicator);
  },
  $reset: function () {
    console.log("reset!");
    this.targets.forEach((t) => {
      t.enabled = true;
    })
  },

  $gameStart: function () { //再スタートはresetしてから。
    console.log("gameStart!");
    //カウントダウン
    SE.countDown.rate(1.5, SE.countDown.play());

    setTimeout(() => {
      this.startTime = Date.now();
      const targetCount = this.targets.length;

      let count = 0;
      const _this = this;

      const updateTime = function () {
        _this.node.emit("timeupdate", _this.currnetTime());
      }
      const updateID = setInterval(updateTime, 30);
      this.targets[0].on("touch", function () {
        console.log(`target ${count} touched`);
        _this.targets[count].enabled = false;
        _this.targets[count].removeListener("touch", arguments.callee);
        count++;
        if (count < targetCount) {
          SE.touch.play();
          _this.targets[count].on("touch", arguments.callee);
          console.log(`time: ${_this.currnetTime()}`)
          console.log(`next is ${count}`);
        } else {
          SE.goal.play();
          let clearTime = _this.currnetTime();
          _this.recordTime = Math.min(_this.recordTime, clearTime);
          clearInterval(updateID);
          console.log("game finish");
          console.log(`time: ${clearTime}`);

          _this.node.emit("finish", clearTime);
        }
      });
    }, 2000);
  },

  currnetTime: function () { //プレイタイム
    return Date.now() - this.startTime;
  },
  getRecordTime: function () {
    return this.recordTime;
  }

});

// gr.registerNode("game-anager", ["Mouse"]);
gr.registerNode("time-attack-manager", ["TimeAttackGameManager"]);
