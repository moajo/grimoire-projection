/**
 * 仕様：
 *
 * 最初の画面は投影キャリブレーション。
 * pumpのロゴ表示しておく。
 * 赤い丸を四隅に置いて「u」キーで射影行列を設定する。そして赤いまるが消える。
 * ゲーム選択画面。(@1)1キーでタイムアタックのゲーム開始。セットアップ（ターゲットの表示まで）
 * ターゲットをいい感じに配置する。
 * (@2)ゲームスタートするとカウントダウンしてスタート。全部順番に触ってクリア。タイムが表示される。最高タイムも別に表示されてる。
 * 全部触れなかったり、クリアした後とかも、rキーで(@2)に戻る。プレイ中はスペースで触れる。シフトスペースで戻れる。
 * シフトrで(@1)へ戻る。
 *
 *
 *
 * webcamera射影変換->webcamraw
 * フレーム差分2値化丸め->diffBuffer
 * ターゲットシルエット->targetHitarea
 * 当たり判定->targetHitTest
 *
 *
 * タスク
 * ・ロゴいいやつ準備
 * ・ターゲットデザイン
 * ・効果音
 * ・diffのアルゴリズム検討
 * ・diffのしきい値検討
 * ・
 */

const UniformResolverRegistry = gr.lib.fundamental.Material.UniformResolverRegistry;
const Matrix = gr.lib.math.Matrix;
const timer = document.getElementById("timeattack-time");
const recordTime = document.getElementById("record-time");

let projectionMatrix = Matrix.identity();
UniformResolverRegistry.add("PROJ", (valinfo) => (proxy) => {
  proxy.uniformMatrix(valinfo.name, projectionMatrix);
});

// for webcam
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;

//debug key command
document.addEventListener("keydown", function (e) {
  console.log(e.keyCode);

  if (e.keyCode === 80) { //p:テスト用板ポリの表示切替
    const current = gr("*")("#titleView").first().enabled;
    gr("*")("#titleView").first().enabled = !current;
    gr("*")("#bgwebcam").first().enabled = current;
    // console.log(gr("*")("#bgwebcam").first().enabled);


  } else if (e.keyCode === 32) { //space:ターゲットタッチ
    const targets = gr("*")("time-attack-manager").getAttribute("targetList");
    const index = gr("*")("time-attack-manager").getAttribute("currentTargetIndex");
    if (index < 0) {
      console.log("targetIndex is -1");
      return;
    }
    if (e.shiftKey) { //back
      if (index > 0) {
        targets[index - 1].sendMessage("resetColor")
        gr("*")("time-attack-manager").setAttribute("currentTargetIndex", index - 1);
        gr("*")("time-attack-manager").setAttribute("lastTouchID", -1);
      }
    } else { //touch forced
      console.log(index);
      targets[index].sendMessage("touch");
    }

  } else if (e.keyCode === 85) { //u:射影行列更新.射影ガイドポインタdisabled.
    updateMat();
    gr("*")("#projectionGuide").first().enabled = false;
  } else if (e.keyCode === 82) { //r:reset
    gameReset_time();
    timer.innerText = `0.00`;
  } else if (e.keyCode === 83) { //s:start
    gameStart_time();
  } else if (e.keyCode === 73) { //i:init
    gameSetup_time();
    document.getElementById("title").classList.add("hidden");
  } else if (e.keyCode === 67) { //c:clearRecord
    if (e.shiftKey) {
      console.log("clear record!");
      clearRecord();
      recordTime.innerText = `RECORD: 999.99`
    }
  } else if (e.keyCode === 89) { //y:差分表示をdisabled
    disableDiffRenderTest();
  }
})

var updateMat = function () {

};
gr(function () {
  // gr("*")("#bgwebcam").first().enabled = false;
  var p1 = gr("#maingoml")("#p1").single();
  var p2 = gr("#maingoml")("#p2").single();
  var p3 = gr("#maingoml")("#p3").single();
  var p4 = gr("#maingoml")("#p4").single();

  updateMat = function () {
    var p1p = p1.getAttribute("viewportPos");
    var p2p = p2.getAttribute("viewportPos");
    var p3p = p3.getAttribute("viewportPos");
    var p4p = p4.getAttribute("viewportPos");

    console.log(p1p.X, p1p.Y);
    console.log(p2p.X, p2p.Y);
    console.log(p3p.X, p3p.Y);
    console.log(p4p.X, p4p.Y);

    var mat = getSystem(p1p, p2p, p3p, p4p);
    // console.log(mat);

    projectionMatrix.rawElements = [mat[0], mat[3], mat[6], 0,
     mat[1], mat[4], mat[7], 0,
      mat[2], mat[5], 1, 0,
       0, 0, 0, 1];
    Matrix.transpose(projectionMatrix);

    // console.log(projectionMatrix);
    // gr("#maingoml")("#r").setAttribute("l1", [mat[0], mat[3], mat[6]]);
    // gr("#maingoml")("#r").setAttribute("l2", [mat[1], mat[4], mat[7]]);
    // gr("#maingoml")("#r").setAttribute("l3", [mat[2], mat[5], 1]);

  }
});

function toggleWebcam() { //webcamのオンオフ切替
  var current = gr("*")("#bgwebcam").first().enabled;
  gr("*")("#bgwebcam").first().enabled = !current;
}

function setThreshold(threshold) { //誤差しきい値設定
  gr("*")("#renderdiff").setAttribute("threshold", threshold);
}

function gameReset_time() {
  gr("*")("time-attack-manager").sendMessage("reset");
}

function clearRecord() {
  localStorage.removeItem('record');
  gr("*")("time-attack-manager").setAttribute("recordTime", 999990);
}

function gameSetup_time() {
  // gr("*")("#logo").first().enabled = false;
  gr("*")("time-attack-manager").sendMessage("setup");
  const recordCache = localStorage.getItem("record") || 999990;
  gr("*")("time-attack-manager").setAttribute("recordTime", recordCache);
  recordTime.innerText = `RECORD: ${(recordCache/1000).toFixed(2)}`
}

function disableDiffRenderTest() {
  gr("*")("#testquad").setAttribute("material", "new(black)");
}

function touchAll() {
  gr("*")("#target_0").sendMessage("touch");
  gr("*")("#target_1").sendMessage("touch");
  gr("*")("#target_2").sendMessage("touch");
  gr("*")("#target_3").sendMessage("touch");
  gr("*")("#target_4").sendMessage("touch");
}

function gameStart_time() {
  const manager = gr("*")("time-attack-manager").first();
  manager.sendMessage("gameStart");
  timer.classList.remove("hidden");
  recordTime.classList.remove("hidden");
  const timeupdateHandler = function (time) {
    timer.innerText = `${(time/1000).toFixed(2)}`;
  }
  manager.on("timeupdate", timeupdateHandler);
  manager.on("finish", function (time) { //時間更新止めて、記録時間表示更新
    manager.removeListener("timeupdate", timeupdateHandler);
    timer.innerText = `${(time/1000).toFixed(2)}`;
    const record = manager.getAttribute("recordTime");
    recordTime.innerText = `RECORD: ${(record/1000).toFixed(2)}`
    localStorage.setItem("record", record);
  })


}

window.onload = function () {

  var wrapper = document.getElementById("wrapper");
  var w = wrapper.clientWidth;
  var h = wrapper.clientHeight;
  var canvas = document.getElementById("maingoml");
  canvas.width = w;
  canvas.height = h;
}


function getSystem(p1, p2, p3, p4) {
  var system = [];
  var sx = (p1.X - p2.X) + (p3.X - p4.X);
  var sy = (p1.Y - p2.Y) + (p3.Y - p4.Y);

  var dx1 = p2.X - p3.X;
  var dx2 = p4.X - p3.X;
  var dy1 = p2.Y - p3.Y;
  var dy2 = p4.Y - p3.Y;

  var z = (dx1 * dy2) - (dy1 * dx2);
  var g = ((sx * dy2) - (sy * dx2)) / z;
  var h = ((sy * dx1) - (sx * dy1)) / z;

  system[0] = p2.X - p1.X + g * p2.X;
  system[1] = p4.X - p1.X + h * p4.X;
  system[2] = p1.X;
  system[3] = p2.Y - p1.Y + g * p2.Y;
  system[4] = p4.Y - p1.Y + h * p4.Y;
  system[5] = p1.Y;
  system[6] = g;
  system[7] = h;

  return system;
}
