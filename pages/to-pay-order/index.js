const app = getApp()
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const wxpay = require('../../utils/pay.js')
const ubt = require('../../utils/ubt')

Page({
  data: {
    wxlogin: true,

    totalScoreToPay: 0,
    goodsList: [],
    isNeedLogistics: 0, // 是否需要物流信息
    allGoodsPrice: 0,
    yunPrice: 0,
    allGoodsAndYunPrice: 0,
    goodsJsonStr: "",
    orderType: "", //订单类型，购物车下单或立即支付下单，默认是购物车，
    pingtuanOpenId: undefined, //拼团的话记录团号

    hasNoCoupons: true,
    coupons: [],
    youhuijine: 0, //优惠券金额
    curCoupon: null, // 当前选择使用的优惠券
    curCouponShowText: '请选择使用优惠券', // 当前选择使用的优惠券
    peisongType: 'kd', // 配送方式 kd,zq 分别表示快递/到店自取
    remark: ''
  },
  onLoad(e) {
    let _data = {
      isNeedLogistics: 1
    }
    if (e.orderType) {
      _data.orderType = e.orderType
    }
    // if (e.pingtuanOpenId) {
    //   _data.pingtuanOpenId = e.pingtuanOpenId
    // }
    this.setData(_data);
  },
  onShow() {
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        this.doneShow()
      }
    })
  },
  async doneShow() {
    let shopList = [];
    const token = wx.getStorageSync('token')
    //立即购买下单
    if ("buyNow" == this.data.orderType) {
      var buyNowInfoMem = wx.getStorageSync('buyNowInfo');
      this.data.kjId = buyNowInfoMem.kjId;
      if (buyNowInfoMem && buyNowInfoMem.shopList) {
        shopList = buyNowInfoMem.shopList
      }
    } else {
      //购物车下单
      const res = await WXAPI.shippingCarInfo(token)
      if (res.code == 0) {
        shopList = res.data.items
      }
    }
    this.setData({
      goodsList: shopList,
      peisongType: this.data.peisongType
    });
    this.initShippingAddress()
  },
  getDistrictId: function (obj, aaa) {
    if (!obj) {
      return "";
    }
    if (!aaa) {
      return "";
    }
    return aaa;
  },

  // 发放MUBT
  async goCreateOrder() {
    const params = this.data.curAddressData;
    if (!params || !params.address) {
      wx.showToast({
        title: '请设置接收注册码',
        icon: 'none'
      })
      return;
    }
    const ubtParams = {
      "point": this.data.allGoodsPrice,
      "seq": Math.round(Math.random() * 1000000),
      "type": 'mubt',
      "uid": params.address
    }
    ubt.increaseUBT(ubtParams).then(res => {
      if (res.status === 0) {
        this.createOrder(true);
      }
    })
  },
  /**
   * 创建订单
   * @param {String} e 
   */
  createOrder(e) {
    var that = this,
      loginToken = wx.getStorageSync('token'),
      remark = this.data.remark; // 备注信息

    let postData = {
      token: loginToken, // token
      goodsJsonStr: that.data.goodsJsonStr, // 商品JSON
      remark: remark, // 备注
      peisongType: that.data.peisongType  // 配送方式
    };

    if (that.data.kjId) {
      postData.kjid = that.data.kjId
    }
    if (that.data.pingtuanOpenId) {
      postData.pingtuanOpenId = that.data.pingtuanOpenId
    }
    if (that.data.isNeedLogistics > 0 && postData.peisongType == 'kd') {
      if (postData.peisongType == 'kd') {
        postData.provinceId = that.data.curAddressData.provinceId;
        postData.cityId = that.data.curAddressData.cityId;
        if (that.data.curAddressData.districtId) {
          postData.districtId = that.data.curAddressData.districtId;
        }
        postData.address = that.data.curAddressData.address;
        postData.linkMan = that.data.curAddressData.linkMan;
        postData.mobile = that.data.curAddressData.mobile;
        postData.code = that.data.curAddressData.code;
      }
    }
    if (that.data.curCoupon) {
      postData.couponId = that.data.curCoupon.id;
    }
    
    if (!e) {
      postData.calculate = "true";
    }

    WXAPI.orderCreate(postData).then(function (res) {
      if (res.code != 0) {
        wx.showModal({
          title: '错误',
          content: res.msg,
          showCancel: false
        })
        return;
      }

      if (e && "buyNow" != that.data.orderType) {
        // 清空购物车数据
        WXAPI.shippingCarInfoRemoveAll(loginToken)
      }
      if (!e) {
        that.setData({
          totalScoreToPay: res.data.score,
          isNeedLogistics: res.data.isNeedLogistics,
          allGoodsPrice: res.data.amountTotle,
          allGoodsAndYunPrice: res.data.amountLogistics + res.data.amountTotle,
          yunPrice: res.data.amountLogistics
        });
        that.getMyCoupons();
        return;
      }
      setTimeout(() => {
        wx.redirectTo({
          url: "/pages/order-list/index"
        })
      }, 300)
    })
  },
  async initShippingAddress() {
    const res = await WXAPI.defaultAddress(wx.getStorageSync('token'))
    if (res.code == 0) {
      this.setData({
        curAddressData: res.data.info
      });
    } else {
      this.setData({
        curAddressData: null
      });
    }
    this.processYunfei();
  },
  processYunfei() {
    var goodsList = this.data.goodsList
    if (goodsList.length == 0) {
      return
    }
    var goodsJsonStr = "[";
    var isNeedLogistics = 0;
    var allGoodsPrice = 0;


    let inviter_id = 0;
    let inviter_id_storge = wx.getStorageSync('referrer');
    if (inviter_id_storge) {
      inviter_id = inviter_id_storge;
    }
    for (let i = 0; i < goodsList.length; i++) {
      let carShopBean = goodsList[i];
      if (carShopBean.logistics || carShopBean.logisticsId) {
        isNeedLogistics = 1;
      }
      allGoodsPrice += carShopBean.price * carShopBean.number;

      var goodsJsonStrTmp = '';
      if (i > 0) {
        goodsJsonStrTmp = ",";
      }
      if (carShopBean.sku && carShopBean.sku.length > 0) {
        let propertyChildIds = ''
        carShopBean.sku.forEach(option => {
          propertyChildIds = propertyChildIds + ',' + option.optionId + ':' + option.optionValueId
        })
        carShopBean.propertyChildIds = propertyChildIds
      }
      goodsJsonStrTmp += '{"goodsId":' + carShopBean.goodsId + ',"number":' + carShopBean.number + ',"propertyChildIds":"' + carShopBean.propertyChildIds + '","logisticsType":0, "inviter_id":' + inviter_id + '}';
      goodsJsonStr += goodsJsonStrTmp;


    }
    goodsJsonStr += "]";
    this.setData({
      isNeedLogistics: isNeedLogistics,
      goodsJsonStr: goodsJsonStr
    });
    this.createOrder();
  },
  /** 添加接收注册码 */
  addAddress() {
    wx.navigateTo({
      url: "/pages/address-add/index"
    })
  },
  /** 选择接收注册码 */
  selectAddress: function () {
    wx.navigateTo({
      url: "/pages/select-address/index"
    })
  },
  /**
  * 备注改变
  * @param {Object} e 
  */
  remarkChange(e) {
    this.data.remark = e.detail.value
  },
  async getMyCoupons() {
    const res = await WXAPI.myCoupons({
      token: wx.getStorageSync('token'),
      status: 0
    })
    if (res.code == 0) {
      var coupons = res.data.filter(entity => {
        return entity.moneyHreshold <= this.data.allGoodsAndYunPrice;
      })
      if (coupons.length > 0) {
        coupons.forEach(ele => {
          ele.nameExt = ele.name + ' [满' + ele.moneyHreshold + '元可减' + ele.money + '元]'
        })
        this.setData({
          hasNoCoupons: false,
          coupons: coupons
        });
      }
    }
  },
  // bindChangeCoupon: function (e) {
  //   const selIndex = e.detail.value;
  //   this.setData({
  //     youhuijine: this.data.coupons[selIndex].money,
  //     curCoupon: this.data.coupons[selIndex],
  //     curCouponShowText: this.data.coupons[selIndex].nameExt
  //   });
  // },

  // radioChange(e) {
  //   this.setData({
  //     peisongType: e.detail.value
  //   })
  //   this.processYunfei()
  // },
  cancelLogin() {
    wx.navigateBack()
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
})