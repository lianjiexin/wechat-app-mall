const app = getApp()
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const UBT = require('../../utils/ubt.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    uid: undefined
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    AUTH.checkHasLogined().then(isLogined => {
      if (!isLogined) {
        wx.showModal({
          title: '提示',
          content: '本次操作需要您的登录授权',
          cancelText: '暂不登录',
          confirmText: '前往登录',
          success(res) {
            if (res.confirm) {
              wx.switchTab({
                url: "/pages/my/index"
              })
            } else {
              wx.navigateBack()
            }
          }
        })
      }
    })
  },
  bindSave: function (e) {
    const ubt = e.detail.value.amount,
      isNumber = /^(0|[1-9][0-9]*)$/;
    ubt.replace(/\s+/g, "");
    if (!ubt || !isNumber.test(ubt)) {
      wx.showToast({
        title: !ubt ? '请输入UBT数量' : '请输入正确数量',
        icon: 'none'
      })
      return
    }

    const uid = wx.getStorageSync('uid')
    UBT.exchangeUBTtoScore(uid, ubt).then(function (res) {
      if (res.status == 0) {
        wx.showModal({
          title: '成功',
          content: '恭喜您，成功兑换' + res.mubt + 'MUBT',
          showCancel: false,
          success(res) {
            if (res.confirm) {
              wx.switchTab({
                url: "/pages/my/index"
              })
            } else {
              wx.navigateBack()
            }
          }
        })
        return
      } else {
        wx.showToast({
          title: "兑换失败",
          icon: 'none'
        })
      }
    })
  },
  cancelLogin() {
    this.setData({
      wxlogin: true
    })
  }
})