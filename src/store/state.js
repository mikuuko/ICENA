// ICENA Global State (Single Source of Truth)

export const state = {
  user: null,
  profile: null,
  partnerProfile: null,
  gameState: {
    streak: 0,
    coins: 0,
    quests: [],
    coupons: [],
    achievements: [],
    milestone_claims: []
  },
  workouts: [],
  dietLogs: [],
  sleepLogs: [],
  weeklyStats: null,
  partnerWeeklyStats: null,
  customShopItems: [],
  victoryShopItems: [],
  victoryRedemptions: [],
  isLoaded: false
};

