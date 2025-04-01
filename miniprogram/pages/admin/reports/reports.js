Page({
  data: {
    reportList: []
  },
  onLoad() {
    this.getReportList();
  },
  getReportList() {
    // 获取举报列表
    wx.cloud.callFunction({
      name: 'managePost',
      data: {
        action: 'getReports'
      }
    }).then(res => {
      this.setData({
        reportList: res.result.data
      });
    });
  },
  handleDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/report-detail/report-detail?id=${id}`
    });
  },
  handleProcess(e) {
    const id = e.currentTarget.dataset.id;
    wx.cloud.callFunction({
      name: 'managePost',
      data: {
        action: 'processReport',
        id: id
      }
    }).then(() => {
      wx.showToast({
        title: '处理成功'
      });
      this.getReportList();
    });
  }
});