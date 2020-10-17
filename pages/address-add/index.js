const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
Page({
  data: {},
  async onLoad(e) {
    if (e.id) { // 修改初始化数据库数据
      const res = await WXAPI.addressDetail(wx.getStorageSync('token'), e.id)
      if (res.code == 0) {
        console.log("123", res.data)
        this.setData({
          id: e.id,
          addressData: res.data.info
        })
      } else {
        wx.showModal({
          title: '错误',
          content: '无法获取快递地址数据',
          showCancel: false
        })
      }
    }
  },
  async bindSave(e) {

    const linkMan = e.detail.value.linkMan;
    const address = e.detail.value.address;
    
    if (linkMan == "") {
      wx.showToast({
        title: '请填写联系人姓名',
        icon: 'none'
      })
      return
    }
    // if (mobile == "") {
    //   wx.showToast({
    //     title: '请填写手机号码',
    //     icon: 'none'
    //   })
    //   return
    // }
    if (address == "") {
      wx.showToast({
        title: '请填写详细地址',
        icon: 'none'
      })
      return
    }

    const postData = {
      token: wx.getStorageSync('token'),
      linkMan: linkMan,
      address: address,
      mobile: "18543236963",
      code: '322000',
      isDefault: 'true',
      // 默认北京市朝阳区
      provinceId: "110000000000",  // 省ID
      cityId: "110100000000", // 市ID
      districtId: "110105000000"  // 区ID
    }
    let apiResult
    if (this.data.id) {
      postData.id = this.data.id
      console.log("postData", postData)
      apiResult = await WXAPI.updateAddress(postData)
    } else {
      apiResult = await WXAPI.addAddress(postData)
    }
    if (apiResult.code != 0) {
      // 登录错误 
      wx.hideLoading();
      wx.showToast({
        title: apiResult.msg,
        icon: 'none'
      })
      return;
    } else {
      wx.navigateBack()
    }
  },

  deleteAddress: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除该收货地址吗？',
      success: function (res) {
        if (res.confirm) {
          WXAPI.deleteAddress(wx.getStorageSync('token'), id).then(function () {
            wx.navigateBack({})
          })
        }
      }
    })
  },
})
