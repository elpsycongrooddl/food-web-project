import { useState, useEffect, useRef } from 'react'
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
  Tag,
  Badge,
  Upload,
  Image,
  Switch,
  Drawer,
  Select,
  Divider,
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
  SlidersOutlined,
  DeleteOutlined,
  EditOutlined,
  XOutlined,
} from '@ant-design/icons'
import { supabase } from '../supabase'
import { homeRecipes } from '../data/recipes'
import { useNavigate } from 'react-router-dom'

const { Header, Content, Sider } = Layout
const { Search } = Input

function Home({ user }) {
  const [recipes, setRecipes] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('default')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [addMode, setAddMode] = useState('manual')
  const [selectedRecipes, setSelectedRecipes] = useState([])
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const [currentRecipeImage, setCurrentRecipeImage] = useState(null)
  const [editRecipeImage, setEditRecipeImage] = useState(null)
  const [addRecipeImage, setAddRecipeImage] = useState(null)
  const [stepsImage, setStepsImage] = useState(null)
  const [stepsType, setStepsType] = useState('text')
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', id: null })
  const [slideDeleteId, setSlideDeleteId] = useState(null)
  const [isCartModalVisible, setIsCartModalVisible] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  useEffect(() => {
    fetchRecipes()
    fetchCategories()
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

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setCategories(data)
    } else {
      createDefaultCategory()
    }
  }

  const createDefaultCategory = async () => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: '默认分类' }])
      .select()

    if (data) {
      setCategories(data)
    }
  }

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'default' || recipe.category_id === activeCategory
    return matchesSearch && matchesCategory
  })

  const chefRecipes = recipes.filter(r => r.chef_id === user.id)
  const filteredChefRecipes = chefRecipes.filter(recipe => {
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'default' || recipe.category_id === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleAddRecipe = async (values) => {
    const { data, error } = await supabase.from('recipes').insert([
      {
        name: values.name,
        description: values.description,
        ingredients: values.ingredients,
        steps: stepsImage || values.steps,
        price: values.price,
        price_type: values.priceType,
        chef_id: user.id,
        image_url: addRecipeImage || null,
        category_id: values.category || activeCategory,
        steps_type: stepsImage ? 'image' : 'text',
      },
    ])

    if (error) {
      message.error(error.message)
    } else {
      message.success('菜谱添加成功')
      setIsAddModalVisible(false)
      setAddRecipeImage(null)
      setStepsImage(null)
      form.resetFields()
      fetchRecipes()
    }
  }

  const handleUpdateRecipe = async (values) => {
    const { data, error } = await supabase
      .from('recipes')
      .update({
        name: values.name,
        description: values.description,
        ingredients: values.ingredients,
        steps: stepsImage || values.steps,
        price: values.price,
        price_type: values.priceType,
        image_url: editRecipeImage || currentRecipe.image_url,
        category_id: values.category || currentRecipe.category_id,
        steps_type: stepsImage ? 'image' : 'text',
      })
      .eq('id', currentRecipe.id)

    if (error) {
      message.error(error.message)
    } else {
      message.success('菜谱更新成功')
      setIsEditModalVisible(false)
      setCurrentRecipe(null)
      setEditRecipeImage(null)
      setStepsImage(null)
      editForm.resetFields()
      fetchRecipes()
    }
  }

  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState(null)

  const handleDeleteRecipe = (recipeId) => {
    setRecipeToDelete(recipeId)
    setDeleteConfirmModal(true)
  }

  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return
    
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeToDelete)

    if (error) {
      message.error(error.message)
    } else {
      message.success('菜谱删除成功')
      fetchRecipes()
    }
    
    setDeleteConfirmModal(false)
    setRecipeToDelete(null)
  }

  const handleAddFromHomeRecipes = async (recipe) => {
    const { data, error } = await supabase.from('recipes').insert([
      {
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        price: '',
        price_type: '',
        chef_id: user.id,
        image_url: recipe.image,
        category_id: activeCategory,
        steps_type: 'text',
      },
    ])

    if (error) {
      message.error(error.message)
    } else {
      message.success('菜谱已添加到我的菜谱')
      setIsAddModalVisible(false)
      fetchRecipes()
    }
  }

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      message.error('请输入分类名称')
      return
    }

    if (categoryForm.id) {
      const { error } = await supabase
        .from('categories')
        .update({ name: categoryForm.name })
        .eq('id', categoryForm.id)

      if (error) {
        message.error(error.message)
      } else {
        message.success('分类更新成功')
        fetchCategories()
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: categoryForm.name }])

      if (error) {
        message.error(error.message)
      } else {
        message.success('分类添加成功')
        fetchCategories()
      }
    }

    setCategoryForm({ name: '', id: null })
    setIsCategoryModalVisible(false)
  }

  const handleDeleteCategory = async (categoryId) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      message.error(error.message)
    } else {
      message.success('分类删除成功')
      if (activeCategory === categoryId) {
        setActiveCategory('default')
      }
      fetchCategories()
      fetchRecipes()
    }
  }

  const handleAddToCart = (recipe) => {
    setSelectedRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id)
      if (exists) {
        return prev.map(r =>
          r.id === recipe.id ? { ...r, quantity: r.quantity + 1 } : r
        )
      }
      return [...prev, { ...recipe, quantity: 1 }]
    })
    message.success('已添加到购物车')
  }

  const updateCartQuantity = (recipeId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(recipeId)
      return
    }
    setSelectedRecipes(prev =>
      prev.map(r =>
        r.id === recipeId ? { ...r, quantity } : r
      )
    )
  }

  const removeFromCart = (recipeId) => {
    setSelectedRecipes(prev => prev.filter(r => r.id !== recipeId))
  }

  const getCartTotal = () => {
    const totalsByUnit = {}
    
    selectedRecipes.forEach(item => {
      const price = parseFloat(item.price) || 0
      const quantity = item.quantity || 1
      const unit = item.price_type || '元'
      
      if (!totalsByUnit[unit]) {
        totalsByUnit[unit] = 0
      }
      totalsByUnit[unit] += price * quantity
    })
    
    const sortedUnits = Object.keys(totalsByUnit).sort((a, b) => {
      if (a === '元') return -1
      if (b === '元') return 1
      return a.localeCompare(b)
    })
    
    return sortedUnits.map(unit => {
      const total = totalsByUnit[unit].toFixed(2)
      return `${total} ${unit}`
    }).join(' + ')
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
      quantity: recipe.quantity,
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

  const handleStartSlide = (recipeId) => {
    setSlideDeleteId(recipeId)
  }

  const handleEndSlide = () => {
    setTimeout(() => setSlideDeleteId(null), 300)
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || '默认分类'
  }

  const renderChefHome = () => (
    <Layout className="chef-layout">
      <div className="chef-header-bg">
        <div className="chef-header-content">
          <div className="chef-brand">
            <div className="brand-icon">👩🍳</div>
            <div className="brand-text">
              <h1>张爹厨房</h1>
              <p>张爹带你吃香喝辣</p>
            </div>
          </div>
        </div>
      </div>

      <div className="chef-toolbar">
        <div className="toolbar-actions">
          <Button 
            type="primary" 
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
          >
            添加菜谱
          </Button>
          <Search
            placeholder="搜索"
            allowClear
            size="small"
            onChange={(e) => setSearchTerm(e.target.value)}
            className="chef-search"
          />
        </div>
      </div>

      <div className="chef-two-column">
        <div className="category-sidebar">
          <div className="category-list">
            <div 
              className={`category-item ${activeCategory === 'default' ? 'active' : ''}`}
              onClick={() => setActiveCategory('default')}
            >
              全部
            </div>
            {categories.map(category => (
              <div
                key={category.id}
                className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </div>
            ))}
            <div 
              className="category-item manage"
              onClick={() => setIsCategoryModalVisible(true)}
            >
              <SlidersOutlined /> 分类管理
            </div>
          </div>
        </div>

        <Content className="chef-content">
          <div className="chef-recipes-list">
            {filteredChefRecipes.length > 0 ? (
              filteredChefRecipes.map(recipe => (
                <div key={recipe.id} className="chef-recipe-item">
                  <Card
                    className="chef-recipe-card"
                    hoverable
                    onClick={() => {
                      setCurrentRecipe(recipe)
                      setEditRecipeImage(null)
                      setStepsImage(null)
                      setIsEditModalVisible(true)
                    }}
                  >
                    <div className="recipe-delete-btn" onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRecipe(recipe.id)
                    }}>
                      <DeleteOutlined />
                    </div>
                    <div className="recipe-card-left">
                      <Image
                        alt={recipe.name}
                        src={recipe.image_url || 'https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png'}
                        className="chef-recipe-image"
                        fallback="https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png"
                      />
                    </div>
                    <div className="recipe-card-right">
                      <div className="recipe-name">{recipe.name}</div>
                      <div className="recipe-desc">
                          {recipe.description || '美味佳肴'}
                        </div>
                        <div className="recipe-bottom">
                          <div className="recipe-price">
                            {recipe.price ? `${recipe.price} ${recipe.price_type}` : '未定价'}
                          </div>
                        </div>
                      </div>
                    </Card>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>暂无菜谱</p>
                <p className="empty-hint">点击上方按钮添加</p>
              </div>
            )}
          </div>
        </Content>
      </div>

      <footer className="bottom-nav">
        <div className="bottom-nav-item active" onClick={() => navigate('/')}>
          <HomeOutlined />
          <span>首页</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/orders')}>
          <ShoppingCartOutlined />
          <span>订单</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/profile')}>
          <UserOutlined />
          <span>我的</span>
        </div>
      </footer>

      <Modal
        title="添加菜谱"
        visible={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false)
          setAddMode('manual')
          setAddRecipeImage(null)
          setStepsImage(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <div className="add-recipe-tabs">
          <button 
            className={`tab-btn ${addMode === 'manual' ? 'active' : ''}`}
            onClick={() => setAddMode('manual')}
          >
            自行添加
          </button>
          <button 
            className={`tab-btn ${addMode === 'search' ? 'active' : ''}`}
            onClick={() => setAddMode('search')}
          >
            搜索菜谱
          </button>
        </div>

        {addMode === 'manual' ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddRecipe}
          >
            <Form.Item
              name="name"
              label="菜品名称"
              rules={[{ required: true, message: '请输入菜品名称' }]}
            >
              <Input placeholder="例如：宫保鸡丁" />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <Input.TextArea placeholder="简单描述一下这道菜" />
            </Form.Item>

            <Form.Item name="category" label="分类">
              <Select options={
                categories.map(c => ({ value: c.id, label: c.name }))
              } placeholder="选择分类" />
            </Form.Item>

            <Form.Item label="成品图">
              {addRecipeImage && (
                <Image
                  alt="预览"
                  src={addRecipeImage}
                  style={{ width: '100%', height: 120, objectFit: 'contain', marginBottom: 12 }}
                />
              )}
              <Upload.Dragger
                name="image"
                accept="image/*"
                beforeUpload={async (file) => {
                  const extension = file.name.split('.').pop()
                  const safeFileName = `recipes/${Date.now()}.${extension}`
                  const { error: uploadError } = await supabase.storage
                    .from('recipe-images')
                    .upload(safeFileName, file, { cacheControl: '3600', upsert: false })

                  if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                      .from('recipe-images')
                      .getPublicUrl(safeFileName)
                    setAddRecipeImage(publicUrl)
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
            </Form.Item>

            <Form.Item
              name="ingredients"
              label="食材"
              rules={[{ required: true, message: '请输入食材' }]}
            >
              <Input.TextArea placeholder="用分号分隔多个食材，例如：鸡肉200克;花生50克;青椒1个" />
            </Form.Item>

            <Form.Item label="做法">
              <Switch
                checked={stepsType === 'image'}
                onChange={(checked) => {
                  setStepsType(checked ? 'image' : 'text')
                  if (!checked) setStepsImage(null)
                }}
                checkedChildren="图片做法"
                unCheckedChildren="文字做法"
              />
              {stepsType === 'image' ? (
                <div>
                  {stepsImage && (
                    <Image
                      alt="做法图片"
                      src={stepsImage}
                      style={{ width: '100%', height: 150, objectFit: 'contain', marginBottom: 12 }}
                    />
                  )}
                  <Upload.Dragger
                    name="steps-image"
                    accept="image/*"
                    beforeUpload={async (file) => {
                      const extension = file.name.split('.').pop()
                      const safeFileName = `steps/${Date.now()}.${extension}`
                      const { error: uploadError } = await supabase.storage
                        .from('recipe-images')
                        .upload(safeFileName, file, { cacheControl: '3600', upsert: false })

                      if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                          .from('recipe-images')
                          .getPublicUrl(safeFileName)
                        setStepsImage(publicUrl)
                        message.success('图片上传成功')
                      } else {
                        message.error('图片上传失败：' + uploadError.message)
                      }
                      return false
                    }}
                  >
                    <p className="ant-upload-text">点击上传做法图片</p>
                  </Upload.Dragger>
                </div>
              ) : (
                <Form.Item name="steps" noStyle>
                  <Input.TextArea rows={4} placeholder="用分号分隔步骤，例如：1.准备食材;2.热锅加油;3.翻炒" />
                </Form.Item>
              )}
            </Form.Item>

            <Form.Item
              name="price"
              label="价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <Input type="number" placeholder="例如：50" />
            </Form.Item>

            <Form.Item
              name="priceType"
              label="支付形式"
              rules={[{ required: true, message: '请输入支付形式' }]}
            >
              <Input placeholder="例如：元/拳/家务/拥抱" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                确认添加
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <div className="search-recipes-modal">
            <Search
              placeholder="搜索菜谱"
              allowClear
              enterButton
              size="large"
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modal-search"
            />
            <div className="search-results">
              {homeRecipes.slice(0, 10).map(recipe => (
                <Card
                  key={recipe.id}
                  className="search-result-card"
                  hoverable
                  cover={recipe.image ? (
                    <Image
                      alt={recipe.name}
                      src={recipe.image}
                      className="result-image"
                    />
                  ) : undefined}
                >
                  <div className="result-name">{recipe.name}</div>
                  {recipe.description && <div className="result-desc">{recipe.description}</div>}
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleAddFromHomeRecipes(recipe)}
                  >
                    添加到我的菜谱
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="编辑菜谱"
        visible={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false)
          setCurrentRecipe(null)
          setEditRecipeImage(null)
          setStepsImage(null)
          editForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        {currentRecipe && (
          <Form
            form={editForm}
            layout="vertical"
            initialValues={{
              name: currentRecipe.name,
              description: currentRecipe.description,
              category: currentRecipe.category_id,
              ingredients: currentRecipe.ingredients,
              steps: currentRecipe.steps_type === 'text' ? currentRecipe.steps : '',
              price: currentRecipe.price,
              priceType: currentRecipe.price_type,
            }}
            onFinish={handleUpdateRecipe}
          >
            <Form.Item
              name="name"
              label="菜品名称"
              rules={[{ required: true, message: '请输入菜品名称' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <Input.TextArea />
            </Form.Item>

            <Form.Item name="category" label="分类">
              <Select options={
                categories.map(c => ({ value: c.id, label: c.name }))
              } placeholder="选择分类" />
            </Form.Item>

            <Form.Item label="成品图">
              <Image
                alt={currentRecipe.name}
                src={editRecipeImage || currentRecipe.image_url || 'https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png'}
                style={{ width: '100%', height: 120, objectFit: 'contain', marginBottom: 12 }}
              />
              <Upload.Dragger
                name="image"
                accept="image/*"
                beforeUpload={async (file) => {
                  const extension = file.name.split('.').pop()
                  const safeFileName = `recipes/${Date.now()}.${extension}`
                  const { error: uploadError } = await supabase.storage
                    .from('recipe-images')
                    .upload(safeFileName, file, { cacheControl: '3600', upsert: false })

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
              >
                <p className="ant-upload-text">点击上传成品图</p>
              </Upload.Dragger>
            </Form.Item>

            <Form.Item
              name="ingredients"
              label="食材"
              rules={[{ required: true, message: '请输入食材' }]}
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item label="做法">
              <Switch
                checked={currentRecipe.steps_type === 'image' || !!stepsImage}
                onChange={(checked) => {
                  if (!checked) setStepsImage(null)
                }}
                checkedChildren="图片做法"
                unCheckedChildren="文字做法"
              />
              {(currentRecipe.steps_type === 'image' || !!stepsImage) ? (
                <div>
                  <Image
                    alt="做法图片"
                    src={stepsImage || currentRecipe.steps}
                    style={{ width: '100%', height: 150, objectFit: 'contain', marginBottom: 12 }}
                  />
                  <Upload.Dragger
                    name="steps-image"
                    accept="image/*"
                    beforeUpload={async (file) => {
                      const extension = file.name.split('.').pop()
                      const safeFileName = `steps/${Date.now()}.${extension}`
                      const { error: uploadError } = await supabase.storage
                        .from('recipe-images')
                        .upload(safeFileName, file, { cacheControl: '3600', upsert: false })

                      if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                          .from('recipe-images')
                          .getPublicUrl(safeFileName)
                        setStepsImage(publicUrl)
                        message.success('图片上传成功')
                      } else {
                        message.error('图片上传失败：' + uploadError.message)
                      }
                      return false
                    }}
                  >
                    <p className="ant-upload-text">点击上传做法图片</p>
                  </Upload.Dragger>
                </div>
              ) : (
                <Form.Item name="steps" noStyle>
                  <Input.TextArea rows={4} />
                </Form.Item>
              )}
            </Form.Item>

            <Form.Item
              name="price"
              label="价格"
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

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="分类管理"
        visible={isCategoryModalVisible}
        onCancel={() => {
          setIsCategoryModalVisible(false)
          setCategoryForm({ name: '', id: null })
        }}
        footer={null}
      >
        <div className="category-modal">
          <Input
            placeholder="分类名称"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
          />
          <Button 
            type="primary" 
            onClick={handleAddCategory}
            className="category-submit-btn"
          >
            {categoryForm.id ? '更新分类' : '添加分类'}
          </Button>
          <Divider />
          <div className="category-list">
            {categories.map(category => (
              <div key={category.id} className="category-item">
                <span>{category.name}</span>
                <div className="category-actions">
                  <Button 
                    size="small" 
                    icon={<EditOutlined />}
                    onClick={() => setCategoryForm({ name: category.name, id: category.id })}
                  />
                  <Button 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteCategory(category.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title="确认删除"
        visible={deleteConfirmModal}
        onCancel={() => {
          setDeleteConfirmModal(false)
          setRecipeToDelete(null)
        }}
        footer={[
          <Button key="back" onClick={() => {
            setDeleteConfirmModal(false)
            setRecipeToDelete(null)
          }}>
            取消
          </Button>,
          <Button key="submit" type="primary" danger onClick={confirmDeleteRecipe}>
            确认删除
          </Button>,
        ]}
      >
        <p>确定要删除这个菜谱吗？此操作无法撤销。</p>
      </Modal>
    </Layout>
  )

  const renderFoodieHome = () => (
    <Layout className="chef-layout">
      <div className="chef-header-bg">
        <div className="chef-header-content">
          <div className="chef-brand">
            <div className="brand-icon">🍔</div>
            <div className="brand-text">
              <h1>张爹餐厅</h1>
              <p>跟着张爹吃香喝辣</p>
            </div>
          </div>
        </div>
      </div>

      <div className="chef-toolbar">
        <div className="toolbar-actions">
          <Search
            placeholder="搜索菜谱"
            allowClear
            size="small"
            onChange={(e) => setSearchTerm(e.target.value)}
            className="chef-search"
          />
        </div>
      </div>

      <div className="chef-two-column">
        <div className="category-sidebar">
          <div className="category-list">
            <div 
              className={`category-item ${activeCategory === 'default' ? 'active' : ''}`}
              onClick={() => setActiveCategory('default')}
            >
              全部
            </div>
            {categories.map(category => (
              <div
                key={category.id}
                className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </div>
            ))}
          </div>
        </div>

        <Content className="chef-content">
          <div className="recipes-list">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map(recipe => (
                <Card
                  key={recipe.id}
                  className="recipe-card"
                  hoverable
                >
                  <div className="recipe-card-left">
                    <Image
                      alt={recipe.name}
                      src={recipe.image_url}
                      className="chef-recipe-image"
                      fallback="https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png"
                    />
                  </div>
                  <div className="recipe-card-right">
                    <div className="recipe-name">{recipe.name}</div>
                    <div className="recipe-desc">
                      {recipe.description || '美味佳肴'}
                    </div>
                    <div className="recipe-bottom">
                      <div className="recipe-price">
                        {recipe.price ? `${recipe.price} ${recipe.price_type}` : '未定价'}
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(recipe)
                        }}
                        className="add-cart-btn"
                      />
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="empty-state">
                <p>暂无菜谱</p>
                <p className="empty-hint">暂无可用菜谱</p>
              </div>
            )}
          </div>
        </Content>
      </div>

      {selectedRecipes.length > 0 && (
        <div className="cart-footer">
          <div className="cart-summary" onClick={() => setIsCartModalVisible(true)}>
            <Badge count={selectedRecipes.reduce((sum, r) => sum + r.quantity, 0)}>
              <ShoppingCartOutlined className="cart-icon" />
            </Badge>
            <span className="cart-total">
              {getCartTotal()}
            </span>
            <span className="cart-hint">点击编辑</span>
          </div>
          <Button type="primary" onClick={handleOrder}>
            去下单
          </Button>
        </div>
      )}

      <Modal
        title="购物车"
        visible={isCartModalVisible}
        onCancel={() => setIsCartModalVisible(false)}
        footer={null}
      >
        <div className="cart-modal">
          {selectedRecipes.length === 0 ? (
            <p className="empty-cart">购物车为空</p>
          ) : (
            <div className="cart-items">
              {selectedRecipes.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image-wrapper">
                    <Image
                      alt={item.name}
                      src={item.image_url}
                      className="cart-item-image"
                      fallback="https://picnew.90sheji.com/design/00/23/31/57/5a33e781a29d0.png?_upd=90sheji_linggan_13641061.png"
                    />
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{`${item.price} ${item.price_type}`}</div>
                  </div>
                  <div className="cart-item-quantity">
                    <Button
                      size="small"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="quantity-num">{item.quantity}</span>
                    <Button
                      size="small"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    size="small"
                    danger
                    onClick={() => removeFromCart(item.id)}
                  >
                    <DeleteOutlined />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <footer className="bottom-nav">
        <div className="bottom-nav-item active" onClick={() => navigate('/')}>
          <HomeOutlined />
          <span>首页</span>
        </div>
        <div className="bottom-nav-item" onClick={() => navigate('/orders')}>
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

  return user.user_type === 'chef' ? renderChefHome() : renderFoodieHome()
}

export default Home