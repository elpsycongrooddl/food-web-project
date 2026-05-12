import { useState } from 'react'
import { Form, Input, Button, Card, Radio, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { supabase } from '../supabase'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values) => {
    console.log('表单提交的值:', values)
    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })

      if (signUpError) {
        message.error(`注册失败: ${signUpError.message}`)
        setLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (signInError) {
        message.error(`登录失败: ${signInError.message}`)
        setLoading(false)
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        message.error('用户认证失败')
        setLoading(false)
        return
      }

      const { error: profileError } = await supabase.from('users').insert([
        {
          id: userData.user.id,
          username: values.username,
          email: values.email,
          user_type: values.userType,
        },
      ])

      if (profileError) {
        message.error(`用户信息保存失败: ${profileError.message}`)
        console.error('Profile insert error:', profileError)
      } else {
        message.success('注册成功！')
        setTimeout(() => {
          navigate('/')
        }, 1500)
      }
    } catch (error) {
      message.error(`注册过程出错: ${error.message}`)
      console.error('Registration error:', error)
    }

    setLoading(false)
  }

  return (
    <div className="register-container">
      <Card className="register-card" title="注册">
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, max: 20, message: '用户名长度为2-20位' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少为6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请确认密码"
            />
          </Form.Item>

          <Form.Item
            name="userType"
            label="用户类型"
            rules={[{ required: true, message: '请选择用户类型' }]}
          >
            <Radio.Group>
              <Radio value="chef">👩🍳 厨师</Radio>
              <Radio value="foodie">🍔 吃货</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              注册
            </Button>
          </Form.Item>
        </Form>
        <p className="login-link">
          已有账号？<Link to="/login">立即登录</Link>
        </p>
      </Card>
    </div>
  )
}

export default Register