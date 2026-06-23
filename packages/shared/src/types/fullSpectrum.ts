// The Full Spectrum model shape — shared by Profile.fullSpectrumScores and
// Role.idealProfile so a person and a role can be compared dimension-by-dimension.
// See /docs/DATA_MODEL.md for the IP/naming caveat: this is a working name and
// shape, built on public psychological constructs, pending trademark clearance.

export interface FullSpectrumProfile {
  skillsExperience: {
    translatedSkills: string[];
    mosMapping?: string;
    civilianEquivalents?: string[];
  };
  personality: {
    extraversion: number; // 0-100
    conscientiousness: number;
    openness: number;
    agreeableness: number;
    emotionalStability: number;
  };
  resilienceDrive: {
    gritScore: number; // 0-100
    perseveranceIndicators?: string[];
  };
  emotionalIntelligence: {
    selfAwareness: number;
    empathy: number;
    interpersonalSkill: number;
  };
  motivationValues: {
    coreValues: string[];
    whatDrivesThem?: string;
    roots?: { place: string; isPrimary: boolean; reason?: string }[];
  };
}

export interface FitBreakdown {
  dimensionScores: Record<string, number>;
  plainLanguageWhy: string;
  honestGaps: string[];
}
