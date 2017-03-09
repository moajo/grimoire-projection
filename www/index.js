const UniformResolverRegistry = gr.lib.fundamental.Material.UniformResolverRegistry;
const Matrix = gr.lib.math.Matrix;
const timer = document.getElementById("timeattack-time");

let projectionMatrix = Matrix.identity();
UniformResolverRegistry.add("PROJ", (valinfo) => (proxy) => {
  proxy.uniformMatrix(valinfo.name, projectionMatrix);
});

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;

var _updateMat = function () {

};
gr(function () {
  var p1 = gr("#maingoml")("#p1").single();
  var p2 = gr("#maingoml")("#p2").single();
  var p3 = gr("#maingoml")("#p3").single();
  var p4 = gr("#maingoml")("#p4").single();

  _updateMat = function () {
    var p1p = p1.getAttribute("viewportPos");
    var p2p = p2.getAttribute("viewportPos");
    var p3p = p3.getAttribute("viewportPos");
    var p4p = p4.getAttribute("viewportPos");

    console.log(p1p.X, p1p.Y);
    console.log(p2p.X, p2p.Y);
    console.log(p3p.X, p3p.Y);
    console.log(p4p.X, p4p.Y);

    var mat = getSystem(p1p, p2p, p3p, p4p);
    console.log(mat);

    projectionMatrix.rawElements = [mat[0], mat[3], mat[6], 0,
     mat[1], mat[4], mat[7], 0,
      mat[2], mat[5], 1, 0,
       0, 0, 0, 1];
    Matrix.transpose(projectionMatrix);

    console.log(projectionMatrix);
    // gr("#maingoml")("#r").setAttribute("l1", [mat[0], mat[3], mat[6]]);
    // gr("#maingoml")("#r").setAttribute("l2", [mat[1], mat[4], mat[7]]);
    // gr("#maingoml")("#r").setAttribute("l3", [mat[2], mat[5], 1]);

  }

});

function updateMat() {
  _updateMat();
}

function toggleWebcam() { //webcamのオンオフ切替
  var current = gr("*")("#bgwebcam").first().enabled;
  gr("*")("#bgwebcam").first().enabled = !current;
}

function gameReset_time() {
  gr("*")("time-attack-manager").sendMessage("setup");
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
  const timeupdateHandler = function (time) {
    timer.innerText = `${(time/1000).toFixed(2)}`;
  }
  manager.on("timeupdate", timeupdateHandler);
  manager.on("finish", function (time) {
    manager.removeListener("timeupdate", timeupdateHandler);
    timer.innerText = `${(time/1000).toFixed(2)}`;
  })


}

window.onload = function () {
  var wrapper = document.getElementById("wrapper");
  var w = wrapper.clientWidth;
  var h = wrapper.clientHeight;
  var canvas = document.getElementById("maingoml");
  canvas.width = w;
  canvas.height = h;

  var list = [];
  list.push({ x: 0, y: 0 })
  // var a = getSystem(list);
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
