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
  Tag,
  Divider,
  Empty,
  Image,
} from 'antd'
import {
  UserOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  SmileOutlined,
  ForkOutlined,
  LogoutOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

const { Header, Content } = Layout

function Profile({ user }) {
  const [orders, setOrders] = useState([])
  const [shoppingList, setShoppingList] = useState([])
  const [recipes, setRecipes] = useState([])
  const [isListModalVisible, setIsListModalVisible] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [wheelResult, setWheelResult] = useState(null)
  const [isWheelModalVisible, setIsWheelModalVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user.user_type === 'chef') {
      fetchShoppingList()
    } else {
      fetchUserOrders()
      fetchAllRecipes()
    }
  }, [user])

  const fetchShoppingList = async () => {
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setShoppingList(data)
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

  const fetchAllRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRecipes(data)
    }
  }

  const addShoppingItem = async () => {
    if (!newItem.trim()) {
      message.error('请输入物品名称')
      return
    }

    const { error } = await supabase
      .from('shopping_list')
      .insert([{ user_id: user.id, item: newItem }])

    if (error) {
      message.error(error.message)
    } else {
      message.success('添加成功')
      setNewItem('')
      setIsListModalVisible(false)
      fetchShoppingList()
    }
  }

  const deleteShoppingItem = async (id) => {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id)

    if (error) {
      message.error(error.message)
    } else {
      message.success('删除成功')
      fetchShoppingList()
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
      fetchUserOrders()
    }
  }

  const spinWheel = () => {
    if (recipes.length < 2) {
      message.warning('至少需要2个菜品才能使用转盘')
      return
    }

    setIsSpinning(true)
    setWheelResult(null)

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * recipes.length)
      setWheelResult(recipes[randomIndex])
      setIsSpinning(false)
      setIsWheelModalVisible(true)
    }, 3000)
  }

  const handleOrderFromWheel = async () => {
    if (!wheelResult) return

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{ user_id: user.id, status: 'pending' }])
      .select()

    if (orderError) {
      message.error(orderError.message)
      return
    }

    const orderId = orderData[0].id
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert([{ order_id: orderId, recipe_id: wheelResult.id, quantity: 1 }])

    if (itemsError) {
      message.error(itemsError.message)
    } else {
      message.success('下单成功')
      setIsWheelModalVisible(false)
      setWheelResult(null)
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

  const renderChefProfile = () => (
    <Layout className="profile-layout">
      {/* <Header className="header">
        <div className="logo">🍳 个人中心</div>
        <nav className="desktop-nav">
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
            <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => navigate('/')}>首页</Menu.Item>
            <Menu.Item key="2" icon={<UserOutlined />}>个人中心</Menu.Item>
            <Menu.Item key="3" icon={<ForkOutlined />} onClick={logout}>
              <LogoutOutlined /> 退出登录
            </Menu.Item>
          </Menu>
        </nav>
      </Header> */}

      <Content className="profile-content">
        <Card className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              <SmileOutlined className="avatar-icon" />
            </div>
            <div className="profile-info">
              <h2>{user.username}</h2>
              <Tag color="green">👩🍳 厨师</Tag>
              <p>{user.email}</p>
            </div>
          </div>
        </Card>

        <Card className="shopping-list-card">
          <div className="card-header">
            <div className="card-title">
              <ForkOutlined /> 需购清单
            </div>
            <Button 
              type="primary" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={() => setIsListModalVisible(true)}
            >
              添加
            </Button>
          </div>
          
          {shoppingList.length === 0 ? (
            <Empty description="暂无需购物品" />
          ) : (
            <div className="shopping-list">
              {shoppingList.map(item => (
                <div key={item.id} className="shopping-item">
                  <span className="item-text">{item.item}</span>
                  <Button 
                    danger 
                    size="small" 
                    icon={<DeleteOutlined />}
                    onClick={() => deleteShoppingItem(item.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="logout-card">
          <Button 
            type="default" 
            danger 
            block 
            size="large"
            icon={<LogoutOutlined />}
            onClick={logout}
          >
            退出登录
          </Button>
        </Card>
      </Content>

      <footer className="bottom-nav">
        <div className="bottom-nav-item" onClick={() => navigate('/')}>
          <HomeOutlined />
          <span>首页</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/orders')}>
          <ShoppingCartOutlined />
          <span>订单</span>
        </div>
        <div className="bottom-nav-item active">
          <UserOutlined />
          <span>我的</span>
        </div>
      </footer>

      <Modal
        title="添加需购物品"
        visible={isListModalVisible}
        onCancel={() => {
          setIsListModalVisible(false)
          setNewItem('')
        }}
        footer={null}
      >
        <Input
          placeholder="输入需要购买的物品"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onPressEnter={addShoppingItem}
        />
        <Button 
          type="primary" 
          onClick={addShoppingItem}
          style={{ marginTop: 16, width: '100%' }}
        >
          添加
        </Button>
      </Modal>
    </Layout>
  )

  const renderFoodieProfile = () => (
    <Layout className="profile-layout">
      {/* <Header className="header">
        <div className="logo">🍔 个人中心</div>
        <nav className="desktop-nav">
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
            <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => navigate('/')}>首页</Menu.Item>
            <Menu.Item key="2" icon={<UserOutlined />}>个人中心</Menu.Item>
            <Menu.Item key="3" icon={<ForkOutlined />} onClick={logout}>
              <LogoutOutlined /> 退出登录
            </Menu.Item>
          </Menu>
        </nav>
      </Header> */}

      <Content className="profile-content">
        <Card className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              <ForkOutlined className="avatar-icon" />
            </div>
            <div className="profile-info">
              <h2>{user.username}</h2>
              <Tag color="blue">🍔 吃货</Tag>
              <p>{user.email}</p>
            </div>
          </div>
        </Card>

        {recipes.length >= 2 && (
          <Card className="wheel-card">
            <div className="wheel-header">
              <div className="card-title">🎲 随机菜品大转盘</div>
            </div>
            <div className="wheel-container">
              <div className={`wheel ${isSpinning ? 'spinning' : ''}`}>
                <div className="wheel-center">
                  <SmileOutlined />
                </div>
              </div>
              <Button 
                type="primary" 
                size="large"
                onClick={spinWheel}
                disabled={isSpinning}
                className="spin-btn"
              >
                {isSpinning ? '转动中...' : '开始转盘'}
              </Button>
            </div>
          </Card>
        )}

        <Card className="logout-card">
          <Button 
            type="default" 
            danger 
            block 
            size="large"
            icon={<LogoutOutlined />}
            onClick={logout}
          >
            退出登录
          </Button>
        </Card>
      </Content>

      <footer className="bottom-nav">
        <div className="bottom-nav-item" onClick={() => navigate('/')}>
          <HomeOutlined />
          <span>首页</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/orders')}>
          <ShoppingCartOutlined />
          <span>订单</span>
        </div>
        <div className="bottom-nav-item active">
          <UserOutlined />
          <span>我的</span>
        </div>
      </footer>

      <Modal
        title="🎲 转盘结果"
        visible={isWheelModalVisible}
        onCancel={() => {
          setIsWheelModalVisible(false)
          setWheelResult(null)
        }}
        footer={null}
        width={400}
      >
        {wheelResult && (
          <div className="wheel-result">
            <Image
              alt={wheelResult.name}
              src={wheelResult.image_url || 'https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png'}
              className="result-image"
            />
            <h3 className="result-name">{wheelResult.name}</h3>
            <p className="result-desc">{wheelResult.description}</p>
            <p className="result-price">{wheelResult.price} {wheelResult.price_type}</p>
            <div className="result-actions">
              <Button onClick={() => {
                setIsWheelModalVisible(false)
                setWheelResult(null)
              }}>
                我再想想
              </Button>
              <Button type="primary" onClick={handleOrderFromWheel}>
                就选这个，下单！
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )

  return user.user_type === 'chef' ? renderChefProfile() : renderFoodieProfile()
}

export default Profile