function createMicrophone() {
  const ele = document.getElementById("microphone")
  StreamerSdk.createMicrophoneTracks().then((tracks) => {
    console.log("tracks", tracks)
    ele.innerHTML = "麦克风获取成功"
  }).catch((e) => {
    ele.innerHTML = "麦克风获取失败"
    console.log("error", e)
  })
}