Page({
  data: {
    price: '',
    privilege: ''
  },
  bindPriceInput(e) {
    this.setData({ price: e.detail.value })
  },
  bindPrivilegeInput(e) {
    this.setData({ privilege: e.detail.value })
  },
  handleSubmit() {
    const { price, privilege } = this.data
    wx.cloud.callFunction({
      name: 'manageVipSettings',
      data: {
        price,
        privilege
      }
    }).then(res => {
      wx.showToast({ title: '保存成功' })
    }).catch(err => {
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  }
})