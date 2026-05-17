import { describe, expect, it } from 'vitest'

import NicNacPage from '@/app/nic-nac/page'

describe('Nic-Nac entry route', () => {
  it('renders the Nic-Nac shell directly', () => {
    const element = NicNacPage()

    expect(element).toBeTruthy()
  })
})
