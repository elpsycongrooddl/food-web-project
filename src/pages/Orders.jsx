import { useState, useEffect } from 'react'
import { Layout, Card, Button, Tag, Image, Modal, message, Empty, Checkbox, Upload } from 'antd'
import { ShoppingCartOutlined, ClockCircleOutlined, CheckCircleOutlined, HomeOutlined, UserOutlined, EditOutlined } from '@ant-design/icons'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

const { Content } = Layout

function Orders({ user }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [orderToComplete, setOrderToComplete] = useState(null)
  const [finishedImages, setFinishedImages] = useState({})
  const [ingredientsChecked, setIngredientsChecked] = useState({})

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*, order_items(*, recipes(*))')
      .order('created_at', { ascending: false })

    if (user.user_type === 'foodie') {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (data) {
      setOrders(data)
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
  }

  const handleCancelOrder = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (error) {
      message.error(error.message)
    } else {
      message.success('订单已取消')
      fetchOrders()
    }
  }

  const handleOpenCompleteModal = (order) => {
    setOrderToComplete(order)
    const initialImages = {}
    order.order_items?.forEach(item => {
      initialImages[item.id] = item.finished_image || ''
    })
    setFinishedImages(initialImages)
    setCompleteModalVisible(true)
  }

  const handleImageChange = (itemId, imageUrl) => {
    setFinishedImages(prev => ({
      ...prev,
      [itemId]: imageUrl
    }))
  }

  const handleCompleteOrder = async () => {
    if (!orderToComplete) return

    for (const item of orderToComplete.order_items || []) {
      const imageUrl = finishedImages[item.id]
      if (imageUrl) {
        await supabase
          .from('order_items')
          .update({ finished_image: imageUrl })
          .eq('id', item.id)

        await supabase
          .from('recipes')
          .update({ image_url: imageUrl })
          .eq('id', item.recipe_id)
      }
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderToComplete.id)

    if (error) {
      message.error(error.message)
    } else {
      message.success('订单已完成')
      setCompleteModalVisible(false)
      setOrderToComplete(null)
      fetchOrders()
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'completed': return 'green'
      case 'cancelled': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待确认'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  return (
    <Layout className="orders-layout">
      <div className="orders-header-bg">
        <div className="orders-header-content">
          <div className="orders-brand">
            <div className="brand-icon">📋</div>
            <div className="brand-text">
              <h1>我的订单</h1>
              <p>查看您的订单记录</p>
            </div>
          </div>
        </div>
      </div>

      <Content className="orders-content">
        {user.user_type === 'foodie' ? (
          <>
            {pendingOrders.length > 0 && (
              <div className="orders-section">
                <div className="section-title">
                  <ClockCircleOutlined /> 待确认订单
                  {pendingOrders.length > 0 && (
                    <Tag color="orange">{pendingOrders.length}</Tag>
                  )}
                </div>

                <div className="orders-list">
                  {pendingOrders.map((order) => (
                    <Card key={order.id} className="order-card">
                      <div className="order-header">
                        <div className="order-info">
                          <span className="order-id">订单 #{order.id}</span>
                          <Tag color={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Tag>
                        </div>
                        <div className="order-time">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className="order-items">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="order-item">
                            <div className="order-item-image-wrapper">
                              <Image
                                alt={item.recipes?.name}
                                src={item.finished_image || item.recipes?.image_url || 'https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png'}
                                className="order-item-image"
                              />
                            </div>
                            <div className="item-info">
                              <div className="item-name-row">
                                <span className="item-name">{item.recipes?.name}</span>
                                <span className="quantity">x{item.quantity}</span>
                              </div>
                              <span className="item-price">
                                {item.recipes?.price} {item.recipes?.price_type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <Button 
                          type="primary" 
                          danger 
                          onClick={() => handleCancelOrder(order.id)}
                          className="cancel-btn"
                        >
                          取消订单
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedOrders.length > 0 && (
              <div className="orders-section">
                <div className="section-title">
                  <CheckCircleOutlined /> 已完成订单
                </div>

                <div className="orders-list">
                  {completedOrders.map((order) => (
                    <Card key={order.id} className="order-card completed">
                      <div className="order-header">
                        <div className="order-info">
                          <span className="order-id">订单 #{order.id}</span>
                          <Tag color={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Tag>
                        </div>
                        <div className="order-time">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className="order-items">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="order-item">
                            <div className="order-item-image-wrapper">
                              <Image
                                alt={item.recipes?.name}
                                src={item.finished_image || item.recipes?.image_url || 'https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png'}
                                className="order-item-image"
                              />
                            </div>
                            <div className="item-info">
                              <div className="item-name-row">
                                <span className="item-name">{item.recipes?.name}</span>
                                <span className="quantity">x{item.quantity}</span>
                              </div>
                              <span className="item-price">
                                {item.recipes?.price} {item.recipes?.price_type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {cancelledOrders.length > 0 && (
              <div className="orders-section">
                <div className="section-title">
                  <span>❌</span> 已取消订单
                </div>

                <div className="orders-list">
                  {cancelledOrders.map((order) => (
                    <Card key={order.id} className="order-card cancelled">
                      <div className="order-header">
                        <div className="order-info">
                          <span className="order-id">订单 #{order.id}</span>
                          <Tag color={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Tag>
                        </div>
                        <div className="order-time">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className="order-items">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="order-item">
                            <div className="order-item-image-wrapper">
                              <Image
                                alt={item.recipes?.name}
                                src={item.recipes?.image_url || 'https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png'}
                                className="order-item-image"
                              />
                            </div>
                            <div className="item-info">
                              <span className="item-name">{item.recipes?.name}</span>
                              <span className="quantity">x{item.quantity}</span>
                            </div>
                            <span className="item-price">
                              {item.recipes?.price} {item.recipes?.price_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pendingOrders.length === 0 && completedOrders.length === 0 && cancelledOrders.length === 0 && (
              <Card className="empty-card">
                <Empty description="暂无订单记录" />
              </Card>
            )}
          </>
        ) : (
          <>
            <div className="orders-section">
              <div className="section-title">
                <ClockCircleOutlined /> 待处理订单
                {pendingOrders.length > 0 && (
                  <Tag color="orange">{pendingOrders.length}</Tag>
                )}
              </div>

              {pendingOrders.length > 0 ? (
                <div className="orders-list">
                  <Card className="ingredients-card">
                    <div className="section-title">
                      <ShoppingCartOutlined /> 所需备菜
                    </div>
                    <div className="ingredients-list">
                      {(() => {
                        const allIngredients = []
                        pendingOrders.forEach(order => {
                          order.order_items?.forEach(item => {
                            const ingredients = item.recipes?.ingredients?.split('；').filter(i => i.trim()) || []
                            ingredients.forEach(ing => {
                              const existing = allIngredients.find(i => i.name === ing)
                              if (existing) {
                                existing.count += item.quantity
                              } else {
                                allIngredients.push({ name: ing, count: item.quantity })
                              }
                            })
                          })
                        })
                        return allIngredients.map((ing, index) => (
                          <div key={index} className="ingredient-item">
                            <Checkbox
                              checked={ingredientsChecked[ing.name] || false}
                              onChange={(e) => setIngredientsChecked(prev => ({
                                ...prev,
                                [ing.name]: e.target.checked
                              }))}
                            />
                            <span className="ingredient-name">{ing.name}</span>
                            <span className="ingredient-count">x{ing.count}</span>
                          </div>
                        ))
                      })()}
                    </div>
                  </Card>

                  {pendingOrders.map((order) => (
                    <Card key={order.id} className="order-card">
                      <div className="order-header">
                        <div className="order-info">
                          <span className="order-id">订单 #{order.id}</span>
                          <Tag color="orange">待确认</Tag>
                        </div>
                        <div className="order-time">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className="order-items">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="order-item">
                            <div className="order-item-image-wrapper">
                              <Image
                                alt={item.recipes?.name}
                                src={item.recipes?.image_url || 'https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png'}
                                className="order-item-image"
                              />
                            </div>
                            <div className="item-info">
                              <span className="item-name">{item.recipes?.name}</span>
                              <span className="quantity">x{item.quantity}</span>
                            </div>
                            <span className="item-price">
                              {item.recipes?.price} {item.recipes?.price_type}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <Button 
                          onClick={() => handleViewOrder(order)}
                          className="view-detail-btn"
                        >
                          查看详情
                        </Button>
                        <Button 
                          type="primary" 
                          onClick={() => handleOpenCompleteModal(order)}
                          className="complete-btn"
                        >
                          确认完成
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="empty-card">
                  <Empty description="暂无待处理订单" />
                </Card>
              )}
            </div>

            <div className="orders-section">
              <div className="section-title">
                <CheckCircleOutlined /> 已完成订单
              </div>

              {completedOrders.length > 0 ? (
                <div className="orders-list">
                  {completedOrders.map((order) => (
                    <Card key={order.id} className="order-card completed">
                      <div className="order-header">
                        <div className="order-info">
                          <span className="order-id">订单 #{order.id}</span>
                          <Tag color="green">已完成</Tag>
                        </div>
                        <div className="order-time">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className="order-items">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="order-item">
                            <div className="order-item-image-wrapper">
                              <Image
                                alt={item.recipes?.name}
                                src={item.finished_image || item.recipes?.image_url || 'https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png'}
                                className="order-item-image"
                              />
                            </div>
                            <div className="item-info">
                              <div className="item-name-row">
                                <span className="item-name">{item.recipes?.name}</span>
                                <span className="quantity">x{item.quantity}</span>
                              </div>
                              <span className="item-price">
                                {item.recipes?.price} {item.recipes?.price_type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="empty-card">
                  <Empty description="暂无已完成订单" />
                </Card>
              )}
            </div>
          </>
        )}
      </Content>

      <Modal
        title="订单详情"
        visible={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={null}
        width={600}
      >
        {selectedOrder && (
          <div>
            <div className="order-detail-header">
              <span className="order-detail-id">订单 #{selectedOrder.id}</span>
              <Tag color={getStatusColor(selectedOrder.status)}>
                {getStatusText(selectedOrder.status)}
              </Tag>
            </div>
            <div className="order-detail-time">
              创建时间：{new Date(selectedOrder.created_at).toLocaleString('zh-CN')}
            </div>
            <div className="order-detail-items">
              {selectedOrder.order_items?.map((item) => (
                <div key={item.id} className="order-detail-item">
                  <div className="detail-item-content">
                    <h4 className="detail-item-name">{item.recipes?.name}</h4>
                    <div className="detail-item-ingredients">
                      <span className="ingredients-label">食材：</span>
                      <span className="ingredients-value">{item.recipes?.ingredients}</span>
                    </div>
                    <div className="detail-item-steps">
                      <div className="steps-title">👩🍳 做法步骤</div>
                      {item.recipes?.steps?.startsWith('http') ? (
                        <Image
                          alt="做法步骤"
                          src={item.recipes?.steps}
                          className="steps-image"
                          style={{ width: '100%', borderRadius: '8px' }}
                        />
                      ) : (
                        <div className="steps-list">
                          {item.recipes?.steps?.split(';').map((step, idx) => (
                            <div key={idx} className="step-item">
                              <span className="step-number">{idx + 1}.</span>
                              <span className="step-content">{step.replace(/^\d+\./, '').trim()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="确认完成订单"
        visible={completeModalVisible}
        onCancel={() => {
          setCompleteModalVisible(false)
          setOrderToComplete(null)
        }}
        footer={[
          <Button key="back" onClick={() => {
            setCompleteModalVisible(false)
            setOrderToComplete(null)
          }}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleCompleteOrder}>
            确认完成
          </Button>
        ]}
        width={600}
      >
        {orderToComplete && (
          <div>
            <div className="order-detail-header">
              <span className="order-detail-id">订单 #{orderToComplete.id}</span>
              <Tag color="orange">待确认</Tag>
            </div>
            <div className="order-detail-time">
              创建时间：{new Date(orderToComplete.created_at).toLocaleString('zh-CN')}
            </div>
            <div className="order-detail-items">
              {orderToComplete.order_items?.map((item) => (
                <div key={item.id} className="order-detail-item">
                  <div className="detail-item-content">
                    <h4 className="detail-item-name">{item.recipes?.name}</h4>
                    <div className="finished-image-section">
                      <span className="finished-image-label">成品图（选填）：</span>
                      <Upload.Dragger
                        name="image"
                        accept="image/*"
                        beforeUpload={async (file) => {
                          const extension = file.name.split('.').pop()
                          const safeFileName = `finished/${Date.now()}.${extension}`
                          const { error: uploadError } = await supabase.storage
                            .from('recipe-images')
                            .upload(safeFileName, file, { cacheControl: '3600', upsert: false })

                          if (!uploadError) {
                            const { data: { publicUrl } } = supabase.storage
                              .from('recipe-images')
                              .getPublicUrl(safeFileName)
                            setFinishedImages(prev => ({
                              ...prev,
                              [item.id]: publicUrl
                            }))
                            message.success('图片上传成功')
                          } else {
                            message.error('图片上传失败：' + uploadError.message)
                          }
                          return false
                        }}
                      >
                        <p className="ant-upload-text">点击上传成品图</p>
                        <p className="ant-upload-hint">支持 JPG、PNG 格式</p>
                      </Upload.Dragger>
                      {finishedImages[item.id] && (
                        <Image
                          alt="成品图"
                          src={finishedImages[item.id]}
                          className="finished-image-preview"
                          style={{ width: '100%', borderRadius: '8px', marginTop: '8px' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <footer className="bottom-nav">
        <div className="bottom-nav-item" onClick={() => navigate('/')}>
          <HomeOutlined />
          <span>首页</span>
        </div>
        <div className="bottom-nav-item active" onClick={() => navigate('/orders')}>
          <ShoppingCartOutlined />
          <span>订单</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/profile')}>
          <UserOutlined />
          <span>我的</span>
        </div>
      </footer>
    </Layout>
  )
}

export default Orders