const app = getApp()
const UBT = require('../../utils/ubt.js')

Page({
  data: {
    params: {
      wxlogin: true,
      password: "",
      registerCode: "",
      uid: ""
    },
    wxBindingState: true
  },
  onLoad(options) {
    // 0：已绑定 1：未绑定
    if (options.wxBindingState == "0") {
      this.setData({
        wxBindingState: true
      })
      wx.setNavigationBarTitle({
        title: "解绑注册码"
      })
    } else {
      this.setData({
        wxBindingState: false
      })
      wx.setNavigationBarTitle({
        title: "绑定注册码"
      })
    }
  },
  onShow() {
    // 获取uid
    const uid = wx.getStorageSync('uid');
    this.setParams("uid", uid);
  },

  fromRegisterCode(e) {
    this.setParams("registerCode", e.detail.value)
  },

  fromPassword(e) {
    this.setParams("password", e.detail.value)
  },

  /**
   * 修改params对象的属性值
   * @param {String} key 
   * @param {String} next 
   */
  setParams(key, next) {
    let data = this.data.params;
    data[key] = next;
    this.setData({
      params: data
    })
  },

  /* 绑定 */
  async registerUid() {
    const code = await UBT.registerUid(this.data.params);
    if (code) {
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/my/index'
        })
      }, 300)
    }
  },

  /* 解绑 */
  async deregisterUid() {
    const code = await UBT.deregisterUid(this.data.params);
    if (code) {
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/my/index'
        })
      }, 300)
    }
  },
})