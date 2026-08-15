import { redirect } from 'next/navigation'

export default function ControlCenterLoginPage() {
  redirect('/login?redirect=%2Fcontrol-center')
}
