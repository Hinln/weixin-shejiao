const app = getApp()

Page({
  data: {
    friendId: '',
    friendName: '',
    friendInfo: null,
    userInfo: null,
    messages: [],
    inputMessage: '',
    scrollToMessage: '',
    onlineStatus: '在线',
    pageSize: 20,
    isLoading: false
  },

  onLoad(options) {
    const { friendId, friendName } = options
    this.setData({
      friendId,
      friendName,
      userInfo: app.globalData.userInfo
    })
    
    this.loadFriendInfo()
    this.loadMessages()
    this.watchMessages()
  },

  async loadFriendInfo() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('friends').doc(this.data.friendId).get()
      this.setData({
        friendInfo: res.data.friendInfo
      })
    } catch (error) {
      console.error('加载好友信息失败：', error)
    }
  },

  async loadMessages() {
    if (this.data.isLoading) return

    try {
      this.setData({ isLoading: true })
      const db = wx.cloud.database()
      const _ = db.command
      
      const res = await db.collection('messages')
        .where({
          _openid: _.or([
            _.eq(app.globalData.userInfo._openid),
            _.eq(this.data.friendInfo._openid)
          ]),
          toUser: _.or([
            _.eq(app.globalData.userInfo._openid),
            _.eq(this.data.friendInfo._openid)
          ])
        })
        .orderBy('createTime', 'desc')
        .limit(this.data.pageSize)
        .get()

      const messages = res.data.map(msg => ({
        ...msg,
        from: msg._openid === app.globalData.userInfo._openid ? 'self' : 'friend'
      }))

      this.setData({
        messages: messages.reverse(),
        scrollToMessage: `msg-${messages[messages.length - 1]?._id}`
      })
    } catch (error) {
      console.error('加载消息失败：', error)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  watchMessages() {
    const db = wx.cloud.database()
    const _ = db.command
    
    this.messageWatcher = db.collection('messages')
      .where({
        _openid: _.or([
          _.eq(app.globalData.userInfo._openid),
          _.eq(this.data.friendInfo._openid)
        ]),
        toUser: _.or([
          _.eq(app.globalData.userInfo._openid),
          _.eq(this.data.friendInfo._openid)
        ])
      })
      .watch({
        onChange: this.onMessageChange.bind(this),
        onError: err => {
          console.error('监听消息失败：', err)
        }
      })
  },

  onMessageChange(snapshot) {
    if (!snapshot.type) return

    const messages = snapshot.docs.map(msg => ({
      ...msg,
      from: msg._openid === app.globalData.userInfo._openid ? 'self' : 'friend'
    }))

    this.setData({
      messages,
      scrollToMessage: `msg-${messages[messages.length - 1]._id}`
    })
  },

  onInputChange(e) {
    this.setData({
      inputMessage: e.detail.value
    })
  },

  async sendMessage() {
    if (!this.data.inputMessage.trim()) return

    try {
      const db = wx.cloud.database()
      const message = {
        content: this.data.inputMessage,
        type: 'text',
        toUser: this.data.friendInfo._openid,
        createTime: db.serverDate()
      }

      await db.collection('messages').add({
        data: message
      })

      this.setData({
        inputMessage: ''
      })
    } catch (error) {
      console.error('发送消息失败：', error)
      wx.showToast({
        title: '发送失败',
        icon: 'error'
      })
    }
  },

  async chooseImage() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const tempFilePath = res.tempFilePaths[0]
      const cloudPath = `chat-images/${Date.now()}-${Math.random().toString(36).slice(-6)}.${tempFilePath.match(/\.([^.]+)$/)[1]}`

      wx.showLoading({
        title: '发送中...'
      })

      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      })

      const db = wx.cloud.database()
      const message = {
        content: uploadRes.fileID,
        type: 'image',
        toUser: this.data.friendInfo._openid,
        createTime: db.serverDate()
      }

      await db.collection('messages').add({
        data: message
      })

      wx.hideLoading()
    } catch (error) {
      console.error('发送图片失败：', error)
      wx.showToast({
        title: '发送失败',
        icon: 'error'
      })
    }
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [url]
    })
  },

  loadMoreMessages() {
    if (this.data.isLoading) return
    this.setData({
      pageSize: this.data.pageSize + 20
    })
    this.loadMessages()
  },

  onUnload() {
    if (this.messageWatcher) {
      this.messageWatcher.close();
    }
  }
});