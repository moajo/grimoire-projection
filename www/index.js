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

    console.log(p1p);

    var mat = getSystem(p1p, p2p, p3p, p4p);
    console.log(mat);
    gr("#maingoml")("#r").setAttribute("l1", [mat[0], mat[3], mat[6]]);
    gr("#maingoml")("#r").setAttribute("l2", [mat[1], mat[4], mat[7]]);
    gr("#maingoml")("#r").setAttribute("l3", [mat[2], mat[5], 1]);
  }

});

var video = document.getElementById('myVideo');
var localStream = null;
navigator.getUserMedia({ video: true, audio: false },
  function (stream) { // for success case
    // console.log(stream);
    video.src = window.URL.createObjectURL(stream);
  },
  function (err) { // for error case
    console.log(err);
  }
);


function updateMat() {
  _updateMat();
}

function fullScreen() {
  ElementRequestFullscreen(video);
}

function exitFullScreen() {
  DocumentExitFullscreen(document);
}

// ------------------------------------------------------------
// エレメントをフルスクリーン表示する関数
// ------------------------------------------------------------
function ElementRequestFullscreen(element) {
  var list = [
		"requestFullscreen",
		"webkitRequestFullScreen",
		"mozRequestFullScreen",
		"msRequestFullscreen"
	];
  for (var i = 0; i < list.length; i++) {
    if (element[list[i]]) {
      element[list[i]]();
      return true;
    }
  }
  return false;
}

function DocumentExitFullscreen(document_obj) {
  var list = [
		"exitFullscreen",
		"webkitExitFullscreen",
		"mozCancelFullScreen",
		"msExitFullscreen"
	];
  var i;
  var num = list.length;
  for (i = 0; i < num; i++) {
    if (document_obj[list[i]]) {
      document_obj[list[i]]();
      return true;
    }
  }
  return false;
}



// var canvas = document.getElementById("canvas");
// var context = canvas.getContext("2d");

function g() {
  var wrapper = document.getElementById("wrapper");
  var w = wrapper.clientWidth;
  var h = wrapper.clientHeight;
  console.log(w, h);
  console.log(video.width, video.height);
}

window.onload = function () {
  window.innerWidth
  window.innerHeight
  var wrapper = document.getElementById("wrapper");
  var w = wrapper.clientWidth;
  var h = wrapper.clientHeight;
  var canvas = document.getElementById("maingoml");
  canvas.width = w;
  canvas.height = h;
  video.width = w;
  video.height = h;

  // context.globalAlpha = 0.5;
  // context.fillStyle = "rgba(255,0,0,1.0)";
  // context.fillRect(20, 20, 40, 40);
  //TODO:http://qiita.com/ShinyaOkazawa/items/9e662bf2121548f79d5f
  //キャンバスをCSSで変形さすと図形が引き伸ばされる
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
