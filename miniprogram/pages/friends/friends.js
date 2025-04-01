const app = getApp()

Page({
  data: {
    activeTab: 'friends',
    friendsList: [],
    requestsList: [],
    requestCount: 0,
    searchKeyword: ''
  },

  onLoad() {
    this.loadFriendsList()
    this.loadFriendRequests()
  },

  onShow() {
    this.loadFriendRequests()
  },

  async loadFriendsList() {
    try {
      const db = wx.cloud.database()
      const userInfo = app.globalData.userInfo
      
      const res = await db.collection('friends')
        .where({
          _openid: userInfo._openid,
          status: 'accepted'
        })
        .orderBy('createTime', 'desc')
        .get()

      this.setData({
        friendsList: res.data
      })
    } catch (error) {
      console.error('加载好友列表失败：', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  async loadFriendRequests() {
    try {
      const db = wx.cloud.database()
      const userInfo = app.globalData.userInfo
      
      const res = await db.collection('friend_requests')
        .where({
          toUser: userInfo._openid,
          status: 'pending'
        })
        .orderBy('createTime', 'desc')
        .get()

      this.setData({
        requestsList: res.data,
        requestCount: res.data.length
      })
    } catch (error) {
      console.error('加载好友请求失败：', error)
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({ searchKeyword: keyword })
    
    if (keyword) {
      this.searchFriends(keyword)
    } else {
      this.loadFriendsList()
    }
  },

  async searchFriends(keyword) {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      const userInfo = app.globalData.userInfo
      
      const res = await db.collection('friends')
        .where({
          _openid: userInfo._openid,
          status: 'accepted',
          'friendInfo.nickName': db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        })
        .get()

      this.setData({
        friendsList: res.data
      })
    } catch (error) {
      console.error('搜索好友失败：', error)
    }
  },

  async handleRequest(e) {
    const { id, action } = e.currentTarget.dataset
    const db = wx.cloud.database()
    
    try {
      if (action === 'accept') {
        await db.collection('friend_requests').doc(id).update({
          data: {
            status: 'accepted',
            updateTime: db.serverDate()
          }
        })
        
        // 创建好友关系
        const request = this.data.requestsList.find(item => item._id === id)
        await db.collection('friends').add({
          data: {
            userInfo: app.globalData.userInfo,
            friendInfo: request.from,
            status: 'accepted',
            createTime: db.serverDate()
          }
        })

        wx.showToast({
          title: '已接受请求',
          icon: 'success'
        })
      } else {
        await db.collection('friend_requests').doc(id).update({
          data: {
            status: 'rejected',
            updateTime: db.serverDate()
          }
        })

        wx.showToast({
          title: '已拒绝请求',
          icon: 'success'
        })
      }

      this.loadFriendRequests()
      this.loadFriendsList()
    } catch (error) {
      console.error('处理好友请求失败：', error)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  },

  navigateToChat(e) {
    const friend = e.currentTarget.dataset.friend
    wx.navigateTo({
      url: `/pages/chat/chat?friendId=${friend._id}&friendName=${friend.friendInfo.nickName}`
    })
  }
})