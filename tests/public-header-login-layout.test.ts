import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Sparkle Suite public header and login layout', () => {
  it('keeps public pages visible and lets reps sign in or clear an old session', () => {
    const header = source('app/_components/sparkle-suite-public-chrome.tsx')
    const accountAction = source('app/_components/SparkleSuitePublicAccountAction.tsx')
    const nicNacPage = source('app/nic-nac/page.tsx')

    expect(header).toContain('SparkleSuitePublicAccountAction')
    expect(header).not.toContain("accountMode = 'public'")
    expect(header).not.toContain('mode={accountMode}')
    expect(header).not.toContain('<a href="/login">Sign in here.</a>')
    expect(nicNacPage).not.toContain('<SparkleSuitePublicHeader accountMode="workspace" />')
    expect(accountAction).toContain("'use client'")
    expect(accountAction).toContain('getSession')
    expect(accountAction).toContain('onAuthStateChange')
    expect(accountAction).not.toContain('redirectToWorkspaceUnlessAlreadyThere')
    expect(accountAction).not.toContain('window.location.replace')
    expect(accountAction).toContain('Already have Sparkle Suite?')
    expect(accountAction).toContain('Sign in here.')
    expect(accountAction).toContain('signOut')
    expect(accountAction).toContain("window.location.assign('/')")
    expect(accountAction).toContain('href="/nic-nac"')
    expect(accountAction).toContain('Open workspace')
    expect(accountAction).toContain('Log out')
  })

  it('keeps the login form inside the first Sparkle landing shell instead of below a full-height header wrapper', () => {
    const loginPage = source('app/login/page.tsx')
    const loginClient = source('app/login/_client.tsx')
    const globals = source('app/globals.css')

    expect(loginPage).toContain('<main className="sparkle-landing-v2">')
    expect(loginPage).toContain('<section className="sl2-login"')
    expect(loginPage.indexOf('<SparkleSuitePublicHeader')).toBeLessThan(
      loginPage.indexOf('<section className="sl2-login"'),
    )
    expect(loginPage.indexOf('<section className="sl2-login"')).toBeLessThan(
      loginPage.indexOf('<SparkleSuitePublicFooter'),
    )
    expect(loginPage).not.toContain('<main>')
    expect(loginClient).toContain('className="sl2-login__card"')
    expect(loginClient).not.toContain("margin: '80px auto'")
    expect(globals).toContain('.sparkle-landing-v2 .sl2-login')
  })

  it('anchors the public chrome brand and account action to opposite viewport edges', () => {
    const globals = source('app/globals.css')

    expect(globals).toContain('max-width: none;')
    expect(globals).toContain('justify-content: space-between;')
    expect(globals).toContain('padding: 14px clamp(20px, 6vw, 56px);')
    expect(globals).toContain('grid-template-columns: minmax(0, auto) minmax(0, auto);')
    expect(globals).not.toContain('max-width: 1240px;\n  min-height: 72px;\n  padding: 14px 20px;')
    expect(globals).not.toContain('grid-template-columns: minmax(0, 1fr);\n    justify-items: start;\n    min-height: 78px;')
  })
})
