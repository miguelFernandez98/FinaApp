import { useApp } from '../context'

export default function Toast() {
  const { toast } = useApp()
  return (
    <div className={`toast ${toast.visible ? 'show' : ''}`}>
      <i className={`fa-solid ${toast.icon}`} style={{ color: toast.color, fontSize: 18 }} />
      <span>{toast.message}</span>
    </div>
  )
}