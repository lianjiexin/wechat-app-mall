const app = getApp()
const CONFIG = require('../../config.js')
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js')
const UBT = require('../../utils/ubt.js')

Page({
  data: {
    wxlogin: true,
    wxloginState: false,
    wxBindingState: false,
    mubt: 0,
    ubt: 0,
  },
  onLoad() {
  },
  onShow() {
    const _this = this
    const order_hx_uids = wx.getStorageSync('order_hx_uids')
    this.setData({
      version: CONFIG.version,
      order_hx_uids
    })
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined,
        wxloginState: isLogined
      })
      if (isLogined) {
        _this.getIsRegistryCode();
        _this.getUserApiInfo();
        _this.getUserAmount();
      }
    })
    // 获取结算车数据，显示TabBarBadge
    TOOLS.showTabBarBadge();
  },
  /* 查询用户注册码是否绑定 */
  async getIsRegistryCode() {
    const registerCode = wx.getStorageSync('uid'),
      data = await UBT.getUidRegistryByUid(registerCode);
    this.setData({
      wxBindingState: data == null ? false : true
    })
  },
  // 关于我们
  aboutUs() {
    wx.showModal({
      title: '关于我们',
      content: '优贝，基于区块链智能合约的药品权证结算分发系统',
      showCancel: false
    })
  },
  loginOut() {
    AUTH.loginOut()
    wx.reLaunch({
      url: '/pages/my/index'
    })
  },
  getUserApiInfo: function () {
    var that = this;
    WXAPI.userDetail(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        let _data = {}
        _data.apiUserInfoMap = res.data
        if (res.data.base.mobile) {
          _data.userMobile = res.data.base.mobile
        }
        if (that.data.order_hx_uids && that.data.order_hx_uids.indexOf(res.data.base.id) != -1) {
          _data.canHX = true // 具有扫码核销的权限
        }
        that.setData(_data);
      }
    })
  },
  getUserAmount() {
    const that = this,
      registerCode = wx.getStorageSync('registerCode');
    UBT.retrieveUBT(registerCode, 'mubt').then(function (res) {
      that.setData({
        mubt: res.data && res.data.point ? res.data.point.toFixed(2) : 0
      });
    })
    UBT.retrieveUBT(registerCode, 'ubt').then(function (res) {
      that.setData({
        ubt: res.data && res.data.point ? res.data.point.toFixed(2) : 0
      });
    })
  },
  cancelLogin() {
    this.setData({
      wxlogin: true
    })
  },
  goLogin() {
    this.setData({
      wxlogin: false
    })
  },
  processLogin(e) {
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      })
      return;
    }
    AUTH.register(this);
  },
  // scanOrderCode() {
  //   wx.scanCode({
  //     onlyFromCamera: true,
  //     success(res) {
  //       wx.navigateTo({
  //         url: '/pages/order-details/scan-result?hxNumber=' + res.result,
  //       })
  //     },
  //     fail(err) {
  //       console.error(err)
  //       wx.showToast({
  //         title: err.errMsg,
  //         icon: 'none'
  //       })
  //     }
  //   })
  // },
  clearStorage() {
    wx.clearStorageSync()
    wx.showToast({
      title: '已清除',
      icon: 'success'
    })
  },
})