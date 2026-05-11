import { describe, expect, it } from 'vitest'

import {
  classifyDriveDoc,
  planDriveDocImports,
} from '@/lib/docs/neon-rabbit-drive-import'

describe('neon rabbit drive doc import planning', () => {
  it('classifies root-level docs into stable repo destinations', () => {
    expect(classifyDriveDoc('SS_Master_Build_Plan_v3_3.md', false)).toBe(
      'sparkle-suite/plans/SS_Master_Build_Plan_v3_3.md',
    )
    expect(classifyDriveDoc('SS_Supabase_Schema_v1_3.md', false)).toBe(
      'sparkle-suite/specs/SS_Supabase_Schema_v1_3.md',
    )
    expect(classifyDriveDoc('SS_DesignKit_Amethyst.md', false)).toBe(
      'sparkle-suite/design/SS_DesignKit_Amethyst.md',
    )
    expect(classifyDriveDoc('Sparkle Suite Troubleshooting Guide.md', false)).toBe(
      'sparkle-suite/operations/Sparkle Suite Troubleshooting Guide.md',
    )
    expect(classifyDriveDoc('Client Setup and Onboarding Live Reveal Co-Pilot.md', false)).toBe(
      'sparkle-suite/operations/Client Setup and Onboarding Live Reveal Co-Pilot.md',
    )
    expect(classifyDriveDoc('HQ_Master_Plan_v1_8.md', false)).toBe(
      'neon-rabbit/hq/HQ_Master_Plan_v1_8.md',
    )
    expect(classifyDriveDoc('RH_Research_01_RSS_Feed_Parsing_Engine.md', false)).toBe(
      'rabbit-hole/research/RH_Research_01_RSS_Feed_Parsing_Engine.md',
    )
    expect(classifyDriveDoc('L1_NR_Document_System_SOP_v1_13.md', false)).toBe(
      'neon-rabbit/operations/L1_NR_Document_System_SOP_v1_13.md',
    )
    expect(classifyDriveDoc('VAC_Project_Tracker_v1.3.md', false)).toBe(
      'vac/VAC_Project_Tracker_v1.3.md',
    )
    expect(classifyDriveDoc('Codex_CLI_Cheat_Sheet.md', false)).toBe(
      'tooling/Codex_CLI_Cheat_Sheet.md',
    )
    expect(classifyDriveDoc('SKILL.md', false)).toBe(
      'skills/SKILL.md',
    )
  })

  it('keeps archive files under a distinct archive root', () => {
    expect(classifyDriveDoc('SS_Master_Build_Plan_v1_1.md', true)).toBe(
      'archive/sparkle-suite/plans/SS_Master_Build_Plan_v1_1.md',
    )
    expect(classifyDriveDoc('NR_Document_System_SOP.md', true)).toBe(
      'archive/neon-rabbit/operations/NR_Document_System_SOP.md',
    )
  })

  it('plans imports without overwriting existing canonical repo files', () => {
    const plans = planDriveDocImports(
      [
        'H:\\My Drive\\Neon Rabbit\\SS_Master_Build_Plan_v3_3.md',
        'H:\\My Drive\\Neon Rabbit\\Archive\\SS_Supabase_Schema_v1_0.md',
        'H:\\My Drive\\Neon Rabbit\\SS_Supabase_Schema_v1_3.md',
      ],
      'H:\\My Drive\\Neon Rabbit',
      'C:\\Users\\louis\\neon-rabbit-core',
    )

    expect(plans).toEqual([
      {
        sourcePath: 'H:\\My Drive\\Neon Rabbit\\SS_Master_Build_Plan_v3_3.md',
        relativeDestination: 'docs/drive-import/sparkle-suite/plans/SS_Master_Build_Plan_v3_3.md',
      },
      {
        sourcePath: 'H:\\My Drive\\Neon Rabbit\\Archive\\SS_Supabase_Schema_v1_0.md',
        relativeDestination: 'docs/drive-import/archive/sparkle-suite/specs/SS_Supabase_Schema_v1_0.md',
      },
      {
        sourcePath: 'H:\\My Drive\\Neon Rabbit\\SS_Supabase_Schema_v1_3.md',
        relativeDestination: 'docs/drive-import/sparkle-suite/specs/SS_Supabase_Schema_v1_3.md',
      },
    ])
  })
})
