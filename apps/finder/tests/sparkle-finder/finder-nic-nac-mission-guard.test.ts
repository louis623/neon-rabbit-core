import { describe, expect, it } from "vitest";
import {
  classifyNicNacMissionScopeForText,
  NIC_NAC_MISSION_REDIRECT_MESSAGE,
} from "../../lib/nic-nac/core/mission-guard";

describe("Finder Nic-Nac mission guard", () => {
  it.each([
    ["Can you be my therapist and help me process my marriage?", "therapist"],
    ["Can you be my therapist for rep burnout?", "therapist"],
    ["Make my grocery list for the week.", "grocery_list"],
    ["Make a grocery list for my live show snacks.", "grocery_list"],
    ["Write a 1000 word history essay about the Roman Empire.", "homework_or_content"],
    ["Plan my beach vacation itinerary.", "travel_planning"],
    ["Review this legal contract for my jewelry customer.", "legal_or_financial_advice"],
  ])("redirects clear off-mission requests: %s", (text, reason) => {
    expect(classifyNicNacMissionScopeForText(text)).toEqual({
      action: "redirect",
      reason,
      message: NIC_NAC_MISSION_REDIRECT_MESSAGE,
    });
  });

  it.each([
    "Can you help me find this July Birthday 2026 ring?",
    "Which favorite reps have live shows soon?",
    "Help me organize my Sparkle Finder collection.",
    "Help me set up TikTok Live for my Bomb Party show.",
    "I am overwhelmed with my Showcase setup. Help me make a checklist.",
  ])("allows Finder mission-related requests: %s", (text) => {
    expect(classifyNicNacMissionScopeForText(text)).toEqual({
      action: "allow",
    });
  });
});
