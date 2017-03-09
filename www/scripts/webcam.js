gr.registerComponent("Webcam", {
  attributes: {
    target: {
      converter: "String",
      default: "texture"
    }
  },
  $mount: function () {
    let _this = this;
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
    navigator.getUserMedia({ video: { width: 1920, height: 1080 }, audio: false },
      (localMediaStream) => {
        let url = (window.URL || window.webkitURL);
        let video = document.createElement('video');
        video.addEventListener('canplay', function () {
          video.removeEventListener('canplay', arguments.callee, true);
          video.play();
          _this.node.setAttribute(_this.getAttribute("target"), video);
        }, true);
        video.src = url.createObjectURL(localMediaStream);
      },
      () => {}
    );

  }
});
