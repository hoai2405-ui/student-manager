import { Footer } from 'antd/es/layout/layout'
import { HeartOutlined } from '@ant-design/icons'

const AdminFooter = () => {
  return (
    <Footer style={{ 
      textAlign: 'center', 
      padding: '16px 24px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
      color: '#64748b',
      fontSize: '14px',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <span>Copyright © {new Date().getFullYear()}</span>
        <span style={{ color: '#ef4444' }}>
          <HeartOutlined style={{ marginRight: '4px' }} />
        </span>
        <span>Thiết kế bởi <strong style={{ color: '#3b82f6' }}>Hoài IT</strong></span>
      </div>
    </Footer>
  )
}
export default AdminFooter
