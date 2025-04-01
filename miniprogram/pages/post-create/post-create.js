const app = getApp()

Page({
  data: {
    content: '',
    tempImages: [],
    burnAfterRead: false,
    isSubmitting: false
  },

  onContentInput: function(e) {
    this.setData({
      content: e.detail.value
    })
  },

  chooseImage: function() {
    wx.chooseImage({
      count: 9 - this.data.tempImages.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.setData({
          tempImages: [...this.data.tempImages, ...res.tempFilePaths]
        })
      }
    })
  },

  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index
    const tempImages = [...this.data.tempImages]
    tempImages.splice(index, 1)
    this.setData({ tempImages })
  },

  previewImage: function(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.tempImages
    })
  },

  onBurnChange: function(e) {
    this.setData({
      burnAfterRead: e.detail.value
    })
  },

  submitPost: function() {
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入动态内容',
        icon: 'none'
      })
      return
    }

    this.setData({ isSubmitting: true })

    // 上传图片
    const uploadTasks = this.data.tempImages.map(tempPath => {
      return wx.cloud.uploadFile({
        cloudPath: `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${tempPath.match(/\.([^.]+)$/)[1]}`,
        filePath: tempPath
      })
    })

    Promise.all(uploadTasks).then(results => {
      const fileIds = results.map(res => res.fileID)
      
      // 创建动态
      return wx.cloud.callFunction({
        name: 'managePost',
        data: {
          action: 'createPost',
          content: this.data.content,
          images: fileIds,
          burnAfterRead: this.data.burnAfterRead
        }
      })
    }).then(res => {
      if (res.result.success) {
        // 更新每日发帖计数
        app.globalData.dailyPostCount++

        wx.showToast({
          title: '发布成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    }).catch(err => {
      console.error('发布动态失败：', err)
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ isSubmitting: false })
    })
  }
})