const prisma = require('../../config/prisma');
const moment = require('moment');

/**
 * Helper to calculate growth percentage
 */
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

/**
 * Get monthly trend (Jan to Dec) with zero filling
 */
const getMonthlyTrend = async (year, type) => {
  const startOfYear = moment().year(year).startOf('year').toDate();
  const endOfYear = moment().year(year).endOf('year').toDate();

  let results;
  
  if (type === 'user') {
    results = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM "createdAt") as month, 
        COUNT(id)::int as count 
      FROM users 
      WHERE "createdAt" >= ${startOfYear} AND "createdAt" <= ${endOfYear} AND "role" = 'USER'
      GROUP BY month
    `;
  } else {
    // Revenue trend based on subscriptions and their plan prices
    results = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM s."createdAt") as month, 
        SUM(p.price)::float as count 
      FROM subscriptions s
      JOIN subscription_plans p ON s."planId" = p.id
      WHERE s."createdAt" >= ${startOfYear} AND s."createdAt" <= ${endOfYear}
      GROUP BY month
    `;
  }

  const dataMap = {};
  results.forEach(item => {
    dataMap[parseInt(item.month)] = item.count;
  });

  const months = moment.monthsShort();
  return months.map((month, index) => ({
    label: month,
    value: dataMap[index + 1] || 0
  }));
};

/**
 * Get comparison data (Current Month vs Last Month)
 */
const getComparisonStats = async () => {
  const currentStart = moment().startOf('month').toDate();
  const lastMonthStart = moment().subtract(1, 'month').startOf('month').toDate();
  const lastMonthEnd = moment().subtract(1, 'month').endOf('month').toDate();

  const [currentUsers, lastUsers, currentRevenue, lastRevenue] = await Promise.all([
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: currentStart } } }),
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.subscription.findMany({ 
      where: { createdAt: { gte: currentStart } }, 
      include: { plan: true } 
    }),
    prisma.subscription.findMany({ 
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, 
      include: { plan: true } 
    }),
  ]);

  const currentRevSum = currentRevenue.reduce((acc, sub) => acc + (sub.plan?.price || 0), 0);
  const lastRevSum = lastRevenue.reduce((acc, sub) => acc + (sub.plan?.price || 0), 0);

  return {
    userGrowth: calculateGrowth(currentUsers, lastUsers),
    revenueGrowth: calculateGrowth(currentRevSum, lastRevSum)
  };
};

/**
 * Main Stats Service
 */
const getStats = async () => {
  const currentYear = moment().year();

  const [
    totalUsers,
    totalTracks,
    activeSubscriptions,
    allPaidSubscriptions,
    recentUsers,
    userTrend,
    revenueTrend,
    growthStats
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER', isDeleted: false } }),
    prisma.track.count(),
    prisma.user.count({ where: { userType: { in: ['BASIC', 'PREMIUM'] }, isDeleted: false } }),
    prisma.subscription.findMany({ include: { plan: true } }),
    prisma.user.findMany({
      take: 10,
      where: { role: 'USER', isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        userType: true,
        createdAt: true,
      },
    }),
    getMonthlyTrend(currentYear, 'user'),
    getMonthlyTrend(currentYear, 'revenue'),
    getComparisonStats()
  ]);

  const totalEarnings = allPaidSubscriptions.reduce((acc, sub) => acc + (sub.plan?.price || 0), 0);

  return {
    kpis: {
      totalUsers: { value: totalUsers, growth: growthStats.userGrowth },
      totalTracks: { value: totalTracks },
      totalSubscriptions: { value: activeSubscriptions },
      totalEarnings: { value: totalEarnings, growth: growthStats.revenueGrowth },
    },
    graphs: {
      userGrowth: userTrend,
      revenueTrend: revenueTrend
    },
    recentUsers
  };
};

module.exports = {
  getStats,
};
