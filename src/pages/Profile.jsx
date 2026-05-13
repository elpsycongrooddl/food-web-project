import { useState, useEffect } from 'react'
import {
  Layout,
  Menu,
  Card,
  Button,
  Modal,
  Form,
  Input,
  message,
  List,
  Tag,
  Divider,
  Empty,
  Upload,
  Image,
} from 'antd'
import {
  UserOutlined,
  HomeOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  EditOutlined,
  DeleteOutlined,
  SmileOutlined,
  ForkOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

const { Header, Content } = Layout

function Profile({ user }) {
  const [recipes, setRecipes] = useState([])
  const [orders, setOrders] = useState([])
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [editRecipeImage, setEditRecipeImage] = useState(null)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  useEffect(() => {
    if (user.user_type === 'chef') {
      fetchChefRecipes()
    } else {
      fetchUserOrders()
    }
  }, [user])

  const fetchChefRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('chef_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setRecipes(data)
    }
  }

  const fetchUserOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, recipes(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data)
    }
  }

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe)
    setIsEditModalVisible(true)
  }

  const handleSaveEdit = async (values) => {
    const { error } = await supabase
      .from('recipes')
      .update({
        name: values.name,
        description: values.description,
        image_url: editRecipeImage || editingRecipe.image_url,
        ingredients: values.ingredients,
        steps: values.steps,
        price: values.price,
        price_type: values.priceType,
      })
      .eq('id', editingRecipe.id)

    if (error) {
      message.error(error.message)
    } else {
      message.success('菜谱更新成功')
      setIsEditModalVisible(false)
      setEditRecipeImage(null)
      fetchChefRecipes()
    }
  }

  const handleDeleteRecipe = async (recipeId) => {
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId)

    if (error) {
      message.error(error.message)
    } else {
      message.success('菜谱删除成功')
      fetchChefRecipes()
    }
  }

  const handleCancelOrder = async (orderId) => {
    const { error } = await supabase.from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (error) {
      message.error(error.message)
    } else {
      message.success('订单已取消')
      window.location.reload()
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'orange'
      case 'completed':
        return 'green'
      case 'cancelled':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '待确认'
      case 'completed':
        return '已完成'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  return (
    <Layout className="profile-layout">
      <Header className="header">
        <div className="logo">{user.user_type === 'chef' ? '🍳' : '🍔'} 个人中心</div>
        <nav className="desktop-nav">
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
            <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => navigate('/')}>
              首页
            </Menu.Item>
            <Menu.Item key="2" icon={<UserOutlined />}>个人中心</Menu.Item>
            <Menu.Item key="3" icon={user.user_type === 'chef' ? <SmileOutlined /> : <ForkOutlined />} onClick={logout}>
              <LogoutOutlined /> 退出登录
            </Menu.Item>
          </Menu>
        </nav>
      </Header>
      <Content className="profile-content">
        <Card className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              {user.user_type === 'chef' ? (
                <SmileOutlined className="avatar-icon" />
              ) : (
                <ForkOutlined className="avatar-icon" />
              )}
            </div>
            <div className="profile-info">
              <h2>{user.username}</h2>
              <Tag color={user.user_type === 'chef' ? 'green' : 'blue'}>
                {user.user_type === 'chef' ? '👩🍳 厨师' : '🍔 吃货'}
              </Tag>
              <p>{user.email}</p>
            </div>
          </div>
        </Card>

        <Divider />

        {user.user_type === 'chef' ? (
          <div className="chef-section">
            <h3 className="section-title">
              <BookOutlined /> 我的菜谱
            </h3>
            {recipes.length === 0 ? (
              <Empty description="暂无菜谱，快去添加吧" />
            ) : (
              <List
                grid={{ gutter: 16, column: 1, md: 2, lg: 3 }}
                dataSource={recipes}
                renderItem={(recipe) => (
                  <List.Item key={recipe.id}>
                    <Card
                      hoverable
                      className="recipe-card"
                      title={recipe.name}
                      cover={recipe.image_url ? (
                        <Image
                          alt={recipe.name}
                          src={recipe.image_url}
                          style={{ height: 200, objectFit: 'cover' }}
                        />
                      ) : undefined}
                      extra={
                        <div className="card-actions">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditRecipe(recipe)}
                          >
                            编辑
                          </Button>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteRecipe(recipe.id)}
                          >
                            删除
                          </Button>
                        </div>
                      }
                    >
                      <p className="recipe-price">
                        <strong>{recipe.price}</strong> {recipe.price_type}
                      </p>
                      <p className="recipe-desc">{recipe.description}</p>
                      <div className="recipe-ingredients-full">
                        <span className="ingredients-label">食材：</span>
                        {recipe.ingredients?.split(';').map((ing, idx) => (
                          <span key={idx}>{ing}{idx < recipe.ingredients.split(';').length - 1 ? '；' : ''}</span>
                        ))}
                      </div>
                      <div className="recipe-steps">
                        <div className="recipe-steps-title">👩🍳 做法步骤</div>
                        {recipe.steps?.split(';').map((step, idx) => (
                          <div key={idx} className="recipe-step-item">
                            <strong>{idx + 1}.</strong> {step.replace(/^\d+\./, '')}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </div>
        ) : (
          <div className="foodie-section">
            <h3 className="section-title">
              <ShoppingCartOutlined /> 历史订单
            </h3>
            {orders.length === 0 ? (
              <Empty description="暂无订单记录" />
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
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
                      {order.status === 'pending' && (
                        <Button
                          type="text"
                          danger
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          取消订单
                        </Button>
                      )}
                      {order.status === 'completed' && (
                        <span className="order-completed">已完成</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <Modal
          title="编辑菜谱"
          visible={isEditModalVisible}
          onCancel={() => {
            setIsEditModalVisible(false)
            setEditingRecipe(null)
          }}
          footer={null}
        >
          {editingRecipe && (
            <Form
              key={editingRecipe.id}
              name="editRecipe"
              layout="vertical"
              initialValues={{
                name: editingRecipe.name,
                description: editingRecipe.description,
                image: editingRecipe.image_url,
                ingredients: editingRecipe.ingredients,
                steps: editingRecipe.steps,
                price: editingRecipe.price,
                priceType: editingRecipe.price_type,
              }}
              onFinish={handleSaveEdit}
            >
              <Form.Item
                name="name"
                label="菜谱名称"
                rules={[{ required: true, message: '请输入菜谱名称' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="image"
                label="成品图片"
              >
                {editRecipeImage || editingRecipe.image_url ? (
                  <Image
                    alt={editingRecipe.name}
                    src={editRecipeImage || editingRecipe.image_url}
                    style={{ width: '100%', height: 200, objectFit: 'cover', marginBottom: 12 }}
                  />
                ) : null}
                <Upload.Dragger
                  name="image"
                  accept="image/*"
                  beforeUpload={async (file) => {
                    const extension = file.name.split('.').pop()
                    const safeFileName = `recipes/${Date.now()}.${extension}`
                    const { error: uploadError } = await supabase.storage
                      .from('recipe-images')
                      .upload(safeFileName, file, {
                        cacheControl: '3600',
                        upsert: false
                      })
                    
                    if (!uploadError) {
                      const { data: { publicUrl } } = supabase.storage
                        .from('recipe-images')
                        .getPublicUrl(safeFileName)
                      setEditRecipeImage(publicUrl)
                      message.success('图片上传成功')
                    } else {
                      message.error('图片上传失败：' + uploadError.message)
                    }
                    return false
                  }}
                  fileList={editRecipeImage ? [{ uid: '1', name: 'recipe.jpg', status: 'done', url: editRecipeImage }] : []}
                >
                  <p className="ant-upload-text">点击或拖拽上传成品图片</p>
                  <p className="ant-upload-hint">支持 JPG、PNG 格式</p>
                </Upload.Dragger>
              </Form.Item>
              <Form.Item
                name="description"
                label="菜谱描述"
                rules={[{ required: true, message: '请输入菜谱描述' }]}
              >
                <Input.TextArea />
              </Form.Item>
              <Form.Item
                name="ingredients"
                label="所需食材"
                rules={[{ required: true, message: '请输入所需食材' }]}
              >
                <Input.TextArea placeholder="用分号分隔" />
              </Form.Item>
              <Form.Item
                name="steps"
                label="做法步骤"
                rules={[{ required: true, message: '请输入做法步骤' }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              <div className="price-row">
                <Form.Item
                  name="price"
                  label="价格数值"
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <Input type="number" />
                </Form.Item>
                <Form.Item
                  name="priceType"
                  label="支付形式"
                  rules={[{ required: true, message: '请输入支付形式' }]}
                >
                  <Input />
                </Form.Item>
              </div>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          )}
        </Modal>
      </Content>
      <footer className="bottom-nav">
        <div className="bottom-nav-item" onClick={() => navigate('/')}>
          <HomeOutlined />
          <span>首页</span>
        </div>
        <div className="bottom-nav-item active">
          <UserOutlined />
          <span>个人中心</span>
        </div>
        <div className="bottom-nav-item" onClick={logout}>
          {user.user_type === 'chef' ? <SmileOutlined /> : <ForkOutlined />}
          <span>退出</span>
        </div>
      </footer>
    </Layout>
  )
}

export default Profile