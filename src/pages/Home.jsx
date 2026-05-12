import { useState, useEffect } from 'react'
import {
  Layout,
  Menu,
  Row,
  Col,
  Card,
  Input,
  Button,
  Modal,
  Form,
  message,
  List,
  Tag,
  Divider,
  Badge,
  Checkbox,
  Spin,
} from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  BookOutlined,
  SmileOutlined,
  ForkOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { supabase } from '../supabase'
import { homeRecipes } from '../data/recipes'
import { useNavigate } from 'react-router-dom'

const { Header, Content, Sider } = Layout
const { Search } = Input

function Home({ user }) {
  const [recipes, setRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [selectedRecipes, setSelectedRecipes] = useState([])
  const [orders, setOrders] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [douguoRecipes, setDouguoRecipes] = useState([])
  const [douguoLoading, setDouguoLoading] = useState(false)
  const [douguoSearch, setDouguoSearch] = useState('')
  const [isPriceModalVisible, setIsPriceModalVisible] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const [priceForm, setPriceForm] = useState({ price: '', priceType: '' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecipes()
    fetchOrders()
    fetchDouguoRecipes()
  }, [])

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRecipes(data)
    }
  }

  const fetchOrders = async () => {
    if (user.user_type === 'chef') {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, recipes(*))')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (data) {
        setOrders(data)
      }
    }
  }

  const fetchOrderItems = async (orderIds) => {
    if (orderIds.length === 0) return
    const { data, error } = await supabase
      .from('order_items')
      .select('*, recipes(*)')
      .in('order_id', orderIds)

    if (data) {
      setOrderItems(data)
    }
  }

  const fetchDouguoRecipes = async () => {
    setDouguoLoading(true)
    try {
      setDouguoRecipes(homeRecipes)
    } catch (error) {
      console.error('获取豆果美食数据失败:', error)
      message.error('获取菜谱数据失败，使用本地数据')
    } finally {
      setDouguoLoading(false)
    }
  }

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDouguoRecipes = douguoRecipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(douguoSearch.toLowerCase()) ||
      recipe.description.toLowerCase().includes(douguoSearch.toLowerCase())
  )

  const handleAddRecipe = async (values) => {
    const { data, error } = await supabase.from('recipes').insert([
      {
        name: values.name,
        description: values.description,
        ingredients: values.ingredients,
        steps: values.steps,
        price: values.price,
        price_type: values.priceType,
        chef_id: user.id,
      },
    ])

    if (error) {
      message.error(error.message)
    } else {
      message.success('菜谱添加成功')
      setIsAddModalVisible(false)
      fetchRecipes()
    }
  }

  const handleAddFromDouguo = (douguoRecipe) => {
    setCurrentRecipe(douguoRecipe)
    setPriceForm({ price: '', priceType: '' })
    setIsPriceModalVisible(true)
  }

  const handleConfirmPrice = async () => {
    if (!priceForm.price || !priceForm.priceType) {
      message.warning('请填写完整的价格信息')
      return
    }

    const { data, error } = await supabase.from('recipes').insert([
      {
        name: currentRecipe.name,
        description: currentRecipe.description,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        price: parseFloat(priceForm.price),
        price_type: priceForm.priceType,
        chef_id: user.id,
      },
    ])

    if (error) {
      message.error(error.message)
    } else {
      message.success('菜谱已添加到我的菜谱列表')
      setIsPriceModalVisible(false)
      setCurrentRecipe(null)
      fetchRecipes()
    }
  }

  const handleOrder = async () => {
    if (selectedRecipes.length === 0) {
      message.warning('请先选择菜谱')
      return
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{ user_id: user.id, status: 'pending' }])
      .select()

    if (orderError) {
      message.error(orderError.message)
      return
    }

    const orderId = orderData[0].id
    const orderItemsData = selectedRecipes.map((recipe) => ({
      order_id: orderId,
      recipe_id: recipe.id,
      quantity: 1,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData)

    if (itemsError) {
      message.error(itemsError.message)
    } else {
      message.success('下单成功')
      setSelectedRecipes([])
    }
  }

  const handleConfirmOrder = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (error) {
      message.error(error.message)
    } else {
      message.success('订单已确认')
      window.location.reload()
    }
  }

  const toggleRecipeSelection = (recipe) => {
    setSelectedRecipes((prev) => {
      const exists = prev.find((r) => r.id === recipe.id)
      if (exists) {
        return prev.filter((r) => r.id !== recipe.id)
      }
      return [...prev, recipe]
    })
  }

  const getTotalPrice = () => {
    const totalsByUnit = {}
    selectedRecipes.forEach((recipe) => {
      const unit = recipe.price_type || '单位'
      const price = recipe.price || 0
      if (totalsByUnit[unit]) {
        totalsByUnit[unit] += price
      } else {
        totalsByUnit[unit] = price
      }
    })
    return Object.entries(totalsByUnit)
      .map(([unit, amount]) => `${amount} ${unit}`)
      .join(' + ')
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const chefOrders = orders.map((order) => ({
    ...order,
    items: order.order_items || [],
  }))

  const getIngredientsList = () => {
    const ingredients = new Set()
    chefOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.recipes?.ingredients) {
          item.recipes.ingredients.split(';').forEach((ing) => {
            ingredients.add(ing.trim())
          })
        }
      })
    })
    return Array.from(ingredients)
  }

  if (user.user_type === 'chef') {
    return (
      <Layout className="chef-layout">
        <Header className="header">
          <div className="logo">🍳 张爹厨房</div>
          <nav className="desktop-nav">
            <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
              <Menu.Item key="1" icon={<HomeOutlined />}>首页</Menu.Item>
              <Menu.Item key="2" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
                个人中心
              </Menu.Item>
              <Menu.Item key="3" icon={<SmileOutlined />} onClick={logout}>
                退出登录
              </Menu.Item>
            </Menu>
          </nav>
        </Header>
        <Layout>
          <Content className="chef-content">
            <div className="search-bar">
              {/* <Search
                placeholder="搜索菜谱"
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={setSearchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              /> */}
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalVisible(true)}
              >
                添加个人菜谱
              </Button>
            </div>

            {chefOrders.length > 0 && (
              <div className="chef-orders-section">
                <div className="section-title">
                  <ShoppingCartOutlined /> 待处理订单{' '}
                  <Badge count={chefOrders.length} />
                </div>
                <div className="orders-list">
                  {chefOrders.map((order) => (
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
                        {order.items.map((item) => (
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
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleConfirmOrder(order.id)}
                        >
                          <CheckCircleOutlined /> 确认已完成
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="ingredients-panel">
                  <div className="section-title">📝 备菜清单</div>
                  <div className="ingredients-list">
                    {getIngredientsList().map((ing, idx) => (
                      <div key={idx} className="ingredient-item">
                        <Checkbox>{ing}</Checkbox>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="douguo-section">
              <div className="douguo-title">
                <LinkOutlined /> 家常精选菜谱
              </div>
              <Search
                placeholder="搜索家常菜谱"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={(value) => setDouguoSearch(value)}
                onChange={(e) => setDouguoSearch(e.target.value)}
                style={{ marginBottom: 12, width: '100%' }}
              />
              <Spin spinning={douguoLoading}>
                <div className="douguo-list">
                  {filteredDouguoRecipes.map((recipe) => (
                    <div key={recipe.id} className="douguo-item">
                      <div className="douguo-item-title">{recipe.name}</div>
                      <div className="douguo-item-desc">{recipe.description}</div>
                      <div className="douguo-item-meta">
                        <span>⏱️ {recipe.cookTime}</span>
                        <span>📊 {recipe.difficulty}</span>
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        icon={<DownloadOutlined />}
                        className="douguo-add-btn"
                        onClick={() => handleAddFromDouguo(recipe)}
                      >
                        添加到我的菜谱
                      </Button>
                    </div>
                  ))}
                </div>
              </Spin>
            </div>

            <Divider />
            <h3 className="section-title">
              <BookOutlined /> 我的菜谱
            </h3>
            <Row gutter={[16, 16]}>
              {filteredRecipes.map((recipe) => (
                <Col xs={24} sm={12} md={8} lg={6} key={recipe.id}>
                  <Card
                    hoverable
                    className="recipe-card"
                    title={recipe.name}
                    extra={
                      <Tag color={recipe.chef_id === user.id ? 'green' : 'blue'}>
                        {recipe.chef_id === user.id ? '我的菜谱' : '其他厨师'}
                      </Tag>
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
                </Col>
              ))}
            </Row>

            </Content>
          
        </Layout>
        <footer className="bottom-nav">
          <div className="bottom-nav-item active" onClick={() => navigate('/')}>
            <HomeOutlined />
            <span>首页</span>
          </div>
          <div className="bottom-nav-item" onClick={() => navigate('/profile')}>
            <UserOutlined />
            <span>个人中心</span>
          </div>
          <div className="bottom-nav-item" onClick={logout}>
            <SmileOutlined />
            <span>退出</span>
          </div>
        </footer>
        <Modal
          title="添加新菜谱"
          visible={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          footer={null}
        >
          <Form
            name="addRecipe"
            layout="vertical"
            onFinish={handleAddRecipe}
          >
            <Form.Item
              name="name"
              label="菜谱名称"
              rules={[{ required: true, message: '请输入菜谱名称' }]}
            >
              <Input placeholder="例如：红烧肉" />
            </Form.Item>
            <Form.Item
              name="description"
              label="菜谱描述"
              rules={[{ required: true, message: '请输入菜谱描述' }]}
            >
              <Input.TextArea placeholder="简单描述这道菜" />
            </Form.Item>
            <Form.Item
              name="ingredients"
              label="所需食材"
              rules={[{ required: true, message: '请输入所需食材' }]}
            >
              <Input.TextArea placeholder="用分号分隔，例如：猪肉;生姜;料酒" />
            </Form.Item>
            <Form.Item
              name="steps"
              label="做法步骤"
              rules={[{ required: true, message: '请输入做法步骤' }]}
            >
              <Input.TextArea rows={4} placeholder="详细描述烹饪步骤" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="price"
                  label="价格数值"
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <Input type="number" placeholder="例如：10" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priceType"
                  label="支付形式"
                  rules={[{ required: true, message: '请输入支付形式' }]}
                >
                  <Input placeholder="例如：元/拳/家务" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                添加菜谱
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="设置菜谱价格"
          visible={isPriceModalVisible}
          onCancel={() => {
            setIsPriceModalVisible(false)
            setCurrentRecipe(null)
          }}
          footer={null}
        >
          {currentRecipe && (
            <div>
              <p className="price-modal-title">菜谱：{currentRecipe.name}</p>
              <Form
                name="priceForm"
                layout="vertical"
                initialValues={priceForm}
              >
                <Form.Item
                  name="price"
                  label="价格数值"
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <Input
                    type="number"
                    placeholder="例如：10"
                    value={priceForm.price}
                    onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                  />
                </Form.Item>
                <Form.Item
                  name="priceType"
                  label="支付形式"
                  rules={[{ required: true, message: '请输入支付形式' }]}
                >
                  <Input
                    placeholder="例如：元/拳/家务/拥抱"
                    value={priceForm.priceType}
                    onChange={(e) => setPriceForm({ ...priceForm, priceType: e.target.value })}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={handleConfirmPrice} block>
                    确认添加
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>
      </Layout>
    )
  }

  return (
    <Layout className="foodie-layout">
      <Header className="header">
          <div className="logo">🍔 美食天地</div>
          <nav className="desktop-nav">
            <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
              <Menu.Item key="1" icon={<HomeOutlined />}>首页</Menu.Item>
              <Menu.Item key="2" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
                个人中心
              </Menu.Item>
              <Menu.Item key="3" icon={<ForkOutlined />} onClick={logout}>
                退出登录
              </Menu.Item>
            </Menu>
          </nav>
        </Header>
      <Content className="foodie-content">
        <div className="search-bar">
          <Search
            placeholder="搜索想吃的菜"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedRecipes.length > 0 && (
          <div className="cart-bar">
            <ShoppingCartOutlined />
            <span>已选择 {selectedRecipes.length} 道菜</span>
            <span className="cart-total">
              总计: {getTotalPrice()}
            </span>
            <Button type="primary" onClick={handleOrder}>
              去下单
            </Button>
          </div>
        )}
        <Divider />
        <h3 className="section-title">
          <BookOutlined /> 今日菜谱
        </h3>
        <Row gutter={[16, 16]}>
          {filteredRecipes.map((recipe) => (
            <Col xs={24} sm={12} md={8} lg={6} key={recipe.id}>
              <Card
                hoverable
                className={`recipe-card foodie-card ${
                  selectedRecipes.find((r) => r.id === recipe.id)
                    ? 'selected'
                    : ''
                }`}
                title={recipe.name}
                extra={
                  <Checkbox
                    checked={selectedRecipes.find((r) => r.id === recipe.id)}
                    onChange={() => toggleRecipeSelection(recipe)}
                  />
                }
              >
                <div className="foodie-card-body">
                  <div className="foodie-price">
                    <span className="price-amount">{recipe.price}</span>
                    <span className="price-unit">{recipe.price_type}</span>
                  </div>
                  <p className="foodie-desc">{recipe.description}</p>
                  <div className="foodie-ingredients">
                    <ForkOutlined className="ingredients-icon" />
                    <span className="ingredients-text">{recipe.ingredients?.slice(0, 40)}...</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>
      <footer className="bottom-nav">
        <div className="bottom-nav-item active" onClick={() => navigate('/')}>
          <HomeOutlined />
          <span>首页</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/profile')}>
          <UserOutlined />
          <span>个人中心</span>
        </div>
        <div className="bottom-nav-item" onClick={logout}>
          <ForkOutlined />
          <span>退出</span>
        </div>
      </footer>
    </Layout>
  )
}

export default Home