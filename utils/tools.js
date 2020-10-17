const WXAPI = require('apifm-wxapi')
const AUTH = require('./auth')

// 显示购物车tabBar的Badge
async function showTabBarBadge() {

  const isLogined = await AUTH.checkHasLogined();
  if (isLogined) {
    const state = await AUTH.getIsRegistryCode()
    if (!state) {
      wx.removeTabBarBadge({
        index: 2
      });
      return
    }
  } else {
    wx.removeTabBarBadge({
      index: 2
    });
    return
  }

  const token = wx.getStorageSync('token')
  if (!token) {
    return
  }
  WXAPI.shippingCarInfo(token).then(res => {
    if (res.code == 700) {
      wx.removeTabBarBadge({
        index: 2
      });
    }
    if (res.code == 0) {
      if (res.data.number == 0) {
        wx.removeTabBarBadge({
          index: 2
        });
      } else {
        wx.setTabBarBadge({
          index: 2,
          text: `${res.data.number}`
        });
      }
    }
  })
}

module.exports = {
  showTabBarBadge: showTabBarBadge
}