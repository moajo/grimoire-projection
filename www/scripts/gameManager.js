const GomlNode = gr.Node.GomlNode;

/**
 * タイムアタックするゲーム。
 * targetCountの数だけターゲットを配置し、1晩から順に触れて最後に触れたらゴール。
 * 配置終えたらまずリセット。
 * ゴールしたらリセットボタンでリセット。
 * 途中でもリセット可能。
 *
 * @type {Object}
 */
gr.registerComponent("TimeAttackGameManager", {
  attributes: {
    targetCount: {
      converter: "Number",
      default: "5"
    },
    currentTime: { //現在のプレイタイム
      converter: "Number",
      default: "0"
    }
  },
  $awake: function () {
    this.__bindAttributes();
    this.targetNodeDec = gr.nodeDeclarations.get("touch-target");
    this.recordTime = 0;
    this.waitingStart = false; //スタート準備状態
  },
  $mount: function () {

  },
  $setup: function () { //最初に一回呼ぶ。ターゲット生成とかする。
    console.log("setup!");
    const targetCount = this.targetCount;

    this.targets = []; //position list for touch targets.
    // setup target list
    while (this.targets.length < targetCount) {
      let node = new GomlNode(this.targetNodeDec);
      node.setAttribute("text", `${this.targets.length+1}`)
      node.setAttribute("id", `target_${this.targets.length}`)
      node.setAttribute("index", this.targets.length)
      this.targets.push(node);
      this.node.addChild(node);
    }

    //set time indicator
    let timeIndicator = new GomlNode(gr.nodeDeclarations.get("text"));
    timeIndicator.setAttribute("text", "0,0");
    timeIndicator.setAttribute("id", "timeIndicator");
    this.node.addChild(timeIndicator);
    this.node.sendMessage("reset");
  },
  $reset: function () { //スタートキーでスタートできる状態に戻す
    console.log("reset!");
    this.targets.forEach(t => {
      t.setAttribute("color", "white");
    });
    this.waitingStart = true;

    // this.targets.forEach((t) => {
    //   t.enabled = true;
    // })
  },

  $gameStart: function () {
    console.log("gameStart!");
    if (!this.waitingStart) {
      console.log("please $reset");
      return;
    }
    this.waitingStart = false;
    //カウントダウン
    SE.countDown.rate(1.5, SE.countDown.play());

    const targetCount = this.targets.length;

    // let count = 0;
    const _this = this;

    setTimeout(function () {
      _this.startTime = Date.now();
      const updateID = setInterval(function () {
        _this.node.emit("timeupdate", _this.currnetTime());
      }, 30);

      let currentTouchTarget = 0;
      let touchableFlag = true;
      const touchhandler = function (node) {
        const idx = node.getAttribute("index");
        if (touchableFlag && currentTouchTarget === idx) { //correct touch!

          touchableFlag = false; //連続タッチ禁止
          setTimeout(() => { touchableFlag = true; }, 500);

          currentTouchTarget++;
          node.setAttribute("color", "green"); //緑にする

          if (currentTouchTarget < targetCount) {
            SE.touch.play();
            // _this.targets[count].on("touch", arguments.callee);
            console.log(`time: ${_this.currnetTime()}`)
            console.log(`next is ${currentTouchTarget+1}`);
          } else {
            SE.goal.play();
            let clearTime = _this.currnetTime();
            _this.recordTime = Math.min(_this.recordTime, clearTime);
            clearInterval(updateID);
            console.log("game finish");
            console.log(`time: ${clearTime}`);

            _this.node.emit("finish", clearTime);
          }
        }
      }
      _this.targets.forEach(t => {
        t.on("touch", touchhandler);
      })
    }, 2000);





    // this.targets[0].on("touch", function () {
    //   console.log(`target ${count} touched`);
    //   _this.targets[count].enabled = false;
    //   _this.targets[count].removeListener("touch", arguments.callee);
    //   count++;
    //   if (count < targetCount) {
    //     SE.touch.play();
    //     _this.targets[count].on("touch", arguments.callee);
    //     console.log(`time: ${_this.currnetTime()}`)
    //     console.log(`next is ${count}`);
    //   } else {
    //     SE.goal.play();
    //     let clearTime = _this.currnetTime();
    //     _this.recordTime = Math.min(_this.recordTime, clearTime);
    //     clearInterval(updateID);
    //     console.log("game finish");
    //     console.log(`time: ${clearTime}`);
    //
    //     _this.node.emit("finish", clearTime);
    //   }
    // });
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
