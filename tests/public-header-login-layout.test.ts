import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Sparkle Suite public header and login layout', () => {
  it('uses one workspace login CTA and routes signed-in reps into the workspace', () => {
    const header = source('app/_components/sparkle-suite-public-chrome.tsx')
    const accountAction = source('app/_components/SparkleSuitePublicAccountAction.tsx')

    expect(header).toContain('SparkleSuitePublicAccountAction')
    expect(header).not.toContain('<a href="/login">Sign in here.</a>')
    expect(accountAction).toContain("'use client'")
    expect(accountAction).toContain('getSession')
    expect(accountAction).toContain('onAuthStateChange')
    expect(accountAction).toContain('redirectToWorkspaceUnlessAlreadyThere')
    expect(accountAction).toContain('window.location.pathname')
    expect(accountAction).toContain('currentPathname !== workspaceHref')
    expect(accountAction).toContain("const workspaceHref = '/nic-nac'")
    expect(accountAction).toContain("const loginHref = '/login?redirect=%2Fnic-nac'")
    expect(accountAction).toContain('Sparkle Suite workspace')
    expect(accountAction).toContain('Log in to your Sparkle Suite workspace')
    expect(accountAction).not.toContain('signOut')
    expect(accountAction).not.toContain('Log out')
    expect(accountAction).not.toContain('Already have Sparkle Suite?')
    expect(accountAction).not.toContain('Sign in here.')
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
