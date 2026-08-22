export const ISA_TENDENCIES: Record<string, { summary: string; tendencies: string[] }> = {
  Narrow: {
    summary: "Tends toward an extension-biased, narrower rib cage posture.",
    tendencies: [
      "Often shows more rotational range but less rib/trunk flexion",
      "May over-rely on extension-based strategies under load",
      "Frequently benefits from anterior core and expansion-based breathing work",
    ],
  },
  Wide: {
    summary: "Tends toward a flexion-biased, wider rib cage posture.",
    tendencies: [
      "Often shows more available flexion but less rotation",
      "May present as more globally stiff through the trunk",
      "Frequently benefits from rotational and extension-based mobility work",
    ],
  },
  None: {
    summary: "Not yet classified.",
    tendencies: ["Run a movement assessment to classify this athlete's profile."],
  },
};
